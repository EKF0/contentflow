import { z } from 'zod';
import { eq, and, desc, asc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  tables,
  fields,
  fieldOptions,
  records,
  cellValues,
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

async function assertWorkspaceMemberReadOnly(db: any, userId: string, workspaceId: string) {
  const membership = await assertWorkspaceMember(db, userId, workspaceId);
  if (membership.role === 'viewer') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return membership;
}

const FIELD_TYPES = [
  'text',
  'long_text',
  'number',
  'select',
  'multi_select',
  'date',
  'date_range',
  'checkbox',
  'collaborator',
  'url',
  'email',
  'phone',
  'attachment',
  'formula',
] as const;

export const tableRouter = router({
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      return ctx.db
        .select()
        .from(tables)
        .where(eq(tables.workspaceId, input.workspaceId))
        .orderBy(asc(tables.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ tableId: z.string() }))
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

      return table;
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(1).max(100),
        icon: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await assertWorkspaceMemberReadOnly(ctx.db, ctx.dbUser.id, input.workspaceId);

      const [table] = await ctx.db
        .insert(tables)
        .values(input)
        .returning();

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const defaultFields = [
        { name: 'Title', type: 'text' as const, sortOrder: 0 },
        { name: 'Status', type: 'select' as const, sortOrder: 1 },
        { name: 'Notes', type: 'long_text' as const, sortOrder: 2 },
      ];

      await ctx.db.insert(fields).values(
        defaultFields.map((f) => ({
          tableId: table.id,
          name: f.name,
          type: f.type,
          sortOrder: f.sortOrder,
          config: {},
        }))
      );

      return table;
    }),

  update: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string().min(1).max(100).optional(),
        icon: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tableId, ...data } = input;

      const [existing] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.id, tableId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMemberReadOnly(ctx.db, ctx.dbUser.id, existing.workspaceId);

      const [updated] = await ctx.db
        .update(tables)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tables.id, tableId))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.id, input.tableId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(
        ctx.db,
        ctx.dbUser.id,
        existing.workspaceId
      );

      if (!['owner', 'admin'].includes(membership.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db.delete(tables).where(eq(tables.id, input.tableId));

      return { success: true };
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        tableIds: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMemberReadOnly(ctx.db, ctx.dbUser.id, input.workspaceId);

      const updates = input.tableIds.map((tableId, index) =>
        ctx.db
          .update(tables)
          .set({ updatedAt: new Date() })
          .where(eq(tables.id, tableId))
      );

      await Promise.all(updates);

      return { success: true };
    }),

  // ─── Field Management ──────────────────────────────────────────────────────

  listFields: protectedProcedure
    .input(z.object({ tableId: z.string() }))
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

      return ctx.db
        .select()
        .from(fields)
        .where(eq(fields.tableId, input.tableId))
        .orderBy(asc(fields.sortOrder));
    }),

  createField: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string().min(1).max(100),
        type: z.enum(FIELD_TYPES),
        config: z.record(z.any()).optional(),
        sortOrder: z.number().int().optional(),
        width: z.number().int().optional(),
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

      await assertWorkspaceMemberReadOnly(ctx.db, ctx.dbUser.id, table.workspaceId);

      const [field] = await ctx.db
        .insert(fields)
        .values(input)
        .returning();

      return field;
    }),

  updateField: protectedProcedure
    .input(
      z.object({
        fieldId: z.string(),
        name: z.string().min(1).max(100).optional(),
        config: z.record(z.any()).optional(),
        sortOrder: z.number().int().optional(),
        width: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { fieldId, ...data } = input;

      const [existing] = await ctx.db
        .select()
        .from(fields)
        .where(eq(fields.id, fieldId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.id, existing.tableId))
        .limit(1);

      if (!table) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMemberReadOnly(ctx.db, ctx.dbUser.id, table.workspaceId);

      const [updated] = await ctx.db
        .update(fields)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(fields.id, fieldId))
        .returning();

      return updated;
    }),

  deleteField: protectedProcedure
    .input(z.object({ fieldId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(fields)
        .where(eq(fields.id, input.fieldId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.id, existing.tableId))
        .limit(1);

      if (!table) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(
        ctx.db,
        ctx.dbUser.id,
        table.workspaceId
      );

      if (!['owner', 'admin'].includes(membership.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db.delete(fields).where(eq(fields.id, input.fieldId));

      return { success: true };
    }),

  reorderFields: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        fieldIds: z.array(z.string()).min(1),
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

      await assertWorkspaceMemberReadOnly(ctx.db, ctx.dbUser.id, table.workspaceId);

      const updates = input.fieldIds.map((fieldId, index) =>
        ctx.db
          .update(fields)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(fields.id, fieldId))
      );

      await Promise.all(updates);

      return { success: true };
    }),

  // ─── Field Options Management ──────────────────────────────────────────────

  listFieldOptions: protectedProcedure
    .input(z.object({ fieldId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(fieldOptions)
        .where(eq(fieldOptions.fieldId, input.fieldId))
        .orderBy(asc(fieldOptions.sortOrder));
    }),

  createFieldOption: protectedProcedure
    .input(
      z.object({
        fieldId: z.string(),
        label: z.string().min(1).max(100),
        color: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [option] = await ctx.db
        .insert(fieldOptions)
        .values(input)
        .returning();

      return option;
    }),

  updateFieldOption: protectedProcedure
    .input(
      z.object({
        optionId: z.string(),
        label: z.string().min(1).max(100).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { optionId, ...data } = input;

      const [updated] = await ctx.db
        .update(fieldOptions)
        .set(data)
        .where(eq(fieldOptions.id, optionId))
        .returning();

      return updated;
    }),

  deleteFieldOption: protectedProcedure
    .input(z.object({ optionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(fieldOptions)
        .where(eq(fieldOptions.id, input.optionId));

      return { success: true };
    }),

  reorderFieldOptions: protectedProcedure
    .input(
      z.object({
        fieldId: z.string(),
        optionIds: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates = input.optionIds.map((optionId, index) =>
        ctx.db
          .update(fieldOptions)
          .set({ sortOrder: index })
          .where(eq(fieldOptions.id, optionId))
      );

      await Promise.all(updates);

      return { success: true };
    }),
});
