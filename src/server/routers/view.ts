import { z } from 'zod';
import { eq, and, asc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { views, tables, workspaceMembers } from '@/lib/db/schema';

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

export const viewRouter = router({
  list: protectedProcedure
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
        .from(views)
        .where(eq(views.tableId, input.tableId))
        .orderBy(asc(views.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ viewId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [view] = await ctx.db
        .select()
        .from(views)
        .where(eq(views.id, input.viewId))
        .limit(1);

      if (!view) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.id, view.tableId))
        .limit(1);

      if (!table) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, table.workspaceId);

      return view;
    }),

  create: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string().min(1).max(100),
        type: z.enum(['grid', 'kanban', 'calendar', 'gallery', 'form']),
        isDefault: z.boolean().optional(),
        isShared: z.boolean().optional(),
        filters: z.array(z.any()).optional(),
        sorts: z.array(z.any()).optional(),
        groupBy: z.any().optional(),
        columns: z.array(z.any()).optional(),
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

      const [view] = await ctx.db
        .insert(views)
        .values(input)
        .returning();

      return view;
    }),

  update: protectedProcedure
    .input(
      z.object({
        viewId: z.string(),
        name: z.string().min(1).max(100).optional(),
        type: z.enum(['grid', 'kanban', 'calendar', 'gallery', 'form']).optional(),
        isDefault: z.boolean().optional(),
        isShared: z.boolean().optional(),
        filters: z.array(z.any()).optional(),
        sorts: z.array(z.any()).optional(),
        groupBy: z.any().optional(),
        columns: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { viewId, ...data } = input;

      const [existing] = await ctx.db
        .select()
        .from(views)
        .where(eq(views.id, viewId))
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

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [updated] = await ctx.db
        .update(views)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(views.id, viewId))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(views)
        .where(eq(views.id, input.viewId))
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

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Don't allow deleting the default view
      if (existing.isDefault) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete the default view',
        });
      }

      await ctx.db.delete(views).where(eq(views.id, input.viewId));

      return { success: true };
    }),
});
