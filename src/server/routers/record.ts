import { z } from 'zod';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  records,
  cellValues,
  tables,
  workspaceMembers,
} from '@/lib/db/schema';

async function assertWorkspaceMember(db: any, userId: string, workspaceId: string) {
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);

  if (!membership) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return membership;
}

export const recordRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(100).default(50),
        includeArchived: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.id, input.tableId))
        .limit(1);

      if (!table) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, table.workspaceId);

      const conditions = [eq(records.tableId, input.tableId)];

      if (!input.includeArchived) {
        conditions.push(eq(records.isArchived, false));
      }

      if (input.cursor) {
        conditions.push(sql`${records.id} > ${input.cursor}`);
      }

      const items = await ctx.db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(asc(records.sortOrder), asc(records.id))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      // Fetch cell values for all records in batch
      if (items.length > 0) {
        const recordIds = items.map((r) => r.id);
        const cells = await ctx.db
          .select()
          .from(cellValues)
          .where(sql`${cellValues.recordId} IN ${recordIds}`);

        const cellsByRecord = new Map<string, typeof cells>();
        for (const cell of cells) {
          const existing = cellsByRecord.get(cell.recordId) ?? [];
          existing.push(cell);
          cellsByRecord.set(cell.recordId, existing);
        }

        return {
          items: items.map((record) => ({
            ...record,
            cellValues: cellsByRecord.get(record.id) ?? [],
          })),
          nextCursor,
        };
      }

      return { items, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [record] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, record.workspaceId);

      const cells = await ctx.db
        .select()
        .from(cellValues)
        .where(eq(cellValues.recordId, input.recordId));

      return { ...record, cellValues: cells };
    }),

  create: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        title: z.string().min(1).max(500),
        cellValues: z
          .array(
            z.object({
              fieldId: z.string(),
              value: z.any(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.id, input.tableId))
        .limit(1);

      if (!table) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(
        ctx.db,
        ctx.dbUser.id,
        table.workspaceId
      );

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Get the next sort order
      const [maxSort] = await ctx.db
        .select({ maxSort: sql<number>`COALESCE(MAX(${records.sortOrder}), 0)` })
        .from(records)
        .where(eq(records.tableId, input.tableId));

      const [record] = await ctx.db
        .insert(records)
        .values({
          tableId: input.tableId,
          workspaceId: table.workspaceId,
          title: input.title,
          sortOrder: (maxSort?.maxSort ?? 0) + 1,
          createdBy: ctx.dbUser.id,
        })
        .returning();

      // Insert cell values
      if (input.cellValues && input.cellValues.length > 0) {
        await ctx.db.insert(cellValues).values(
          input.cellValues.map((cv) => ({
            recordId: record.id,
            fieldId: cv.fieldId,
            value: cv.value,
          }))
        );
      }

      return record;
    }),

  update: protectedProcedure
    .input(
      z.object({
        recordId: z.string(),
        title: z.string().min(1).max(500).optional(),
        wordCount: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { recordId, ...data } = input;

      const [existing] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, recordId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(
        ctx.db,
        ctx.dbUser.id,
        existing.workspaceId
      );

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [updated] = await ctx.db
        .update(records)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(records.id, recordId))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(
        ctx.db,
        ctx.dbUser.id,
        existing.workspaceId
      );

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db.delete(records).where(eq(records.id, input.recordId));

      return { success: true };
    }),

  archive: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      const [updated] = await ctx.db
        .update(records)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(records.id, input.recordId))
        .returning();

      return updated;
    }),

  restore: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      const [updated] = await ctx.db
        .update(records)
        .set({ isArchived: false, updatedAt: new Date() })
        .where(eq(records.id, input.recordId))
        .returning();

      return updated;
    }),

  // Cell value operations
  upsertCellValue: protectedProcedure
    .input(
      z.object({
        recordId: z.string(),
        fieldId: z.string(),
        value: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [record] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(
        ctx.db,
        ctx.dbUser.id,
        record.workspaceId
      );

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [existing] = await ctx.db
        .select()
        .from(cellValues)
        .where(
          and(
            eq(cellValues.recordId, input.recordId),
            eq(cellValues.fieldId, input.fieldId)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await ctx.db
          .update(cellValues)
          .set({ value: input.value, updatedAt: new Date() })
          .where(
            and(
              eq(cellValues.recordId, input.recordId),
              eq(cellValues.fieldId, input.fieldId)
            )
          )
          .returning();

        return updated;
      }

      const [created] = await ctx.db
        .insert(cellValues)
        .values({
          recordId: input.recordId,
          fieldId: input.fieldId,
          value: input.value,
        })
        .returning();

      return created;
    }),

  deleteCellValue: protectedProcedure
    .input(
      z.object({
        recordId: z.string(),
        fieldId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [record] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, record.workspaceId);

      await ctx.db
        .delete(cellValues)
        .where(
          and(
            eq(cellValues.recordId, input.recordId),
            eq(cellValues.fieldId, input.fieldId)
          )
        );

      return { success: true };
    }),

  batchUpdateCellValues: protectedProcedure
    .input(
      z.object({
        recordId: z.string(),
        updates: z.array(
          z.object({
            fieldId: z.string(),
            value: z.any(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [record] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(
        ctx.db,
        ctx.dbUser.id,
        record.workspaceId
      );

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const results = [];
      for (const update of input.updates) {
        const [existing] = await ctx.db
          .select()
          .from(cellValues)
          .where(
            and(
              eq(cellValues.recordId, input.recordId),
              eq(cellValues.fieldId, update.fieldId)
            )
          )
          .limit(1);

        if (existing) {
          const [updated] = await ctx.db
            .update(cellValues)
            .set({ value: update.value, updatedAt: new Date() })
            .where(
              and(
                eq(cellValues.recordId, input.recordId),
                eq(cellValues.fieldId, update.fieldId)
              )
            )
            .returning();
          results.push(updated);
        } else {
          const [created] = await ctx.db
            .insert(cellValues)
            .values({
              recordId: input.recordId,
              fieldId: update.fieldId,
              value: update.value,
            })
            .returning();
          results.push(created);
        }
      }

      return results;
    }),
});
