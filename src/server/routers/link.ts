import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  recordLinks,
  records,
  cellValues,
  fields,
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

async function getRecordWorkspace(db: any, recordId: string): Promise<string> {
  const [record] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);

  if (!record) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return record.workspaceId;
}

async function getRecordWithCells(db: any, recordId: string) {
  const [record] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);

  if (!record) return null;

  const cells = await db
    .select()
    .from(cellValues)
    .where(eq(cellValues.recordId, recordId));

  return { ...record, cellValues: cells };
}

export const linkRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        sourceRecordId: z.string(),
        targetRecordId: z.string(),
        fieldName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getRecordWorkspace(ctx.db, input.sourceRecordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      const [existing] = await ctx.db
        .select()
        .from(recordLinks)
        .where(
          and(
            eq(recordLinks.sourceRecordId, input.sourceRecordId),
            eq(recordLinks.targetRecordId, input.targetRecordId),
            eq(recordLinks.fieldName, input.fieldName)
          )
        )
        .limit(1);

      if (existing) {
        return existing;
      }

      const [link] = await ctx.db
        .insert(recordLinks)
        .values({
          sourceRecordId: input.sourceRecordId,
          targetRecordId: input.targetRecordId,
          fieldName: input.fieldName,
          workspaceId,
        })
        .returning();

      return link;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        sourceRecordId: z.string(),
        targetRecordId: z.string(),
        fieldName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getRecordWorkspace(ctx.db, input.sourceRecordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      await ctx.db
        .delete(recordLinks)
        .where(
          and(
            eq(recordLinks.sourceRecordId, input.sourceRecordId),
            eq(recordLinks.targetRecordId, input.targetRecordId),
            eq(recordLinks.fieldName, input.fieldName)
          )
        );

      return { success: true };
    }),

  list: protectedProcedure
    .input(z.object({ recordId: z.string(), fieldName: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await getRecordWorkspace(ctx.db, input.recordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      const conditions = [eq(recordLinks.sourceRecordId, input.recordId)];
      if (input.fieldName) {
        conditions.push(eq(recordLinks.fieldName, input.fieldName));
      }

      return ctx.db
        .select()
        .from(recordLinks)
        .where(and(...conditions));
    }),

  getLinkedRecords: protectedProcedure
    .input(z.object({ recordId: z.string(), fieldName: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await getRecordWorkspace(ctx.db, input.recordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      const conditions = [eq(recordLinks.sourceRecordId, input.recordId)];
      if (input.fieldName) {
        conditions.push(eq(recordLinks.fieldName, input.fieldName));
      }

      const links = await ctx.db
        .select()
        .from(recordLinks)
        .where(and(...conditions));

      if (links.length === 0) return [];

      const targetIds = links.map((l: any) => l.targetRecordId);
      const linkedRecords = await ctx.db
        .select()
        .from(records)
        .where(sql`${records.id} IN ${targetIds}`);

      const recordIds = linkedRecords.map((r: any) => r.id);
      const allCells = recordIds.length > 0
        ? await ctx.db
            .select()
            .from(cellValues)
            .where(sql`${cellValues.recordId} IN ${recordIds}`)
        : [];

      const cellsByRecord = new Map<string, typeof allCells>();
      for (const cell of allCells) {
        const existing = cellsByRecord.get(cell.recordId) ?? [];
        existing.push(cell);
        cellsByRecord.set(cell.recordId, existing);
      }

      return linkedRecords.map((record: any) => ({
        ...record,
        cellValues: cellsByRecord.get(record.id) ?? [],
        linkFieldName: links.find((l: any) => l.targetRecordId === record.id)?.fieldName,
      }));
    }),

  reverseLinks: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await getRecordWorkspace(ctx.db, input.recordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      const links = await ctx.db
        .select()
        .from(recordLinks)
        .where(eq(recordLinks.targetRecordId, input.recordId));

      if (links.length === 0) return [];

      const sourceIds = links.map((l: any) => l.sourceRecordId);
      const sourceRecords = await ctx.db
        .select()
        .from(records)
        .where(sql`${records.id} IN ${sourceIds}`);

      return sourceRecords.map((record: any) => ({
        ...record,
        linkFieldName: links.find((l: any) => l.sourceRecordId === record.id)?.fieldName,
      }));
    }),

  searchTargetRecords: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        query: z.string().optional(),
        excludeRecordId: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
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

      const conditions = [
        eq(records.tableId, input.tableId),
        eq(records.isArchived, false),
      ];

      if (input.excludeRecordId) {
        conditions.push(sql`${records.id} != ${input.excludeRecordId}`);
      }

      if (input.query) {
        conditions.push(sql`${records.title} ILIKE ${'%' + input.query + '%'}`);
      }

      return ctx.db
        .select({ id: records.id, title: records.title })
        .from(records)
        .where(and(...conditions))
        .orderBy(records.title)
        .limit(input.limit);
    }),
});
