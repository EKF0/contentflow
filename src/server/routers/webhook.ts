import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { webhooks, workspaceMembers } from '@/lib/db/schema';
import { sendTestWebhook } from '@/lib/webhooks';

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

export const webhookRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(1).max(100),
        url: z.string().url(),
        events: z
          .array(z.enum(['record.created', 'record.updated', 'record.deleted']))
          .default(['record.created', 'record.updated', 'record.deleted']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [webhook] = await ctx.db
        .insert(webhooks)
        .values({
          workspaceId: input.workspaceId,
          userId: ctx.dbUser.id,
          url: input.url,
          name: input.name,
          events: input.events,
          secret: `whsec_${crypto.randomUUID().replace(/-/g, '')}`,
        })
        .returning();

      return webhook;
    }),

  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      const items = await ctx.db
        .select()
        .from(webhooks)
        .where(eq(webhooks.workspaceId, input.workspaceId));

      return items;
    }),

  delete: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, input.webhookId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db.delete(webhooks).where(eq(webhooks.id, input.webhookId));

      return { success: true };
    }),

  test: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, input.webhookId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      const result = await sendTestWebhook(input.webhookId);
      return result;
    }),
});
