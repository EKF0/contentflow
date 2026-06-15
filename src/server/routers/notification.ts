import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { notifications, workspaceMembers } from '@/lib/db/schema';

async function assertWorkspaceMember(db: any, userId: string, workspaceId: string) {
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return membership;
}

export const notificationRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        limit: z.number().int().min(1).max(100).default(50),
        unreadOnly: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      const conditions = [
        eq(notifications.workspaceId, input.workspaceId),
        eq(notifications.userId, ctx.dbUser.id),
      ];

      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      const items = await ctx.db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      const [unreadCount] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(
          and(
            eq(notifications.workspaceId, input.workspaceId),
            eq(notifications.userId, ctx.dbUser.id),
            eq(notifications.isRead, false),
          ),
        );

      return { items, unreadCount: unreadCount?.count ?? 0 };
    }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [notification] = await ctx.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId))
        .limit(1);

      if (!notification) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (notification.userId !== ctx.dbUser.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  markAllRead: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.workspaceId, input.workspaceId),
            eq(notifications.userId, ctx.dbUser.id),
            eq(notifications.isRead, false),
          ),
        );

      return { success: true };
    }),
});
