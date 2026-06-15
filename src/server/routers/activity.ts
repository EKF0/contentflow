import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { activityLog } from '@/lib/db/schema';

export const activityRouter = router({
  list: protectedProcedure
    .input(z.object({ recordId: z.string(), limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db
        .select()
        .from(activityLog)
        .where(eq(activityLog.recordId, input.recordId))
        .orderBy(desc(activityLog.createdAt))
        .limit(input.limit);

      return entries;
    }),

  listWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string(), limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db
        .select()
        .from(activityLog)
        .where(eq(activityLog.workspaceId, input.workspaceId))
        .orderBy(desc(activityLog.createdAt))
        .limit(input.limit);

      return entries;
    }),
});

export async function logActivity(
  db: { insert: (table: typeof activityLog) => { values: (data: Record<string, unknown>) => Promise<unknown> } },
  params: {
    workspaceId: string;
    recordId?: string;
    userId: string;
    action: 'create' | 'update' | 'delete' | 'comment' | 'status_change' | 'archive' | 'restore';
    entityType: 'record' | 'field' | 'view' | 'table' | 'workspace';
    entityId: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
  }
) {
  await db.insert(activityLog).values({
    workspaceId: params.workspaceId,
    recordId: params.recordId || null,
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    changes: params.changes || null,
  });
}
