import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { apiKeys, workspaceMembers } from '@/lib/db/schema';

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

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'cf_';
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const prefix = key.slice(0, 8) + '...';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return { key, hash: `h_${Math.abs(hash).toString(16)}`, prefix };
}

export const apiKeyRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(1).max(100),
        permissions: z.array(z.string()).default(['read']),
        expiresAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      const generated = generateApiKey();

      const [apiKey] = await ctx.db
        .insert(apiKeys)
        .values({
          userId: ctx.dbUser.id,
          workspaceId: input.workspaceId,
          name: input.name,
          keyHash: generated.hash,
          keyPrefix: generated.prefix,
          permissions: input.permissions,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        })
        .returning();

      return {
        ...apiKey,
        key: generated.key,
      };
    }),

  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      const items = await ctx.db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          permissions: apiKeys.permissions,
          isActive: apiKeys.isActive,
          lastUsedAt: apiKeys.lastUsedAt,
          expiresAt: apiKeys.expiresAt,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.workspaceId, input.workspaceId));

      return items;
    }),

  revoke: protectedProcedure
    .input(z.object({ apiKeyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, input.apiKeyId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (existing.userId !== ctx.dbUser.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db
        .update(apiKeys)
        .set({ isActive: false })
        .where(eq(apiKeys.id, input.apiKeyId));

      return { success: true };
    }),
});
