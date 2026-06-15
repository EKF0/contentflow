import { z } from 'zod';
import { eq, and, desc, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  workspaces,
  workspaceMembers,
  users,
} from '@/lib/db/schema';

const MEMBER_ROLES = z.enum(['owner', 'admin', 'editor', 'viewer']);

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
  return membership;
}

export const workspaceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, ctx.dbUser.id));

    if (memberships.length === 0) return [];

    const workspaceIds = memberships.map((m) => m.workspaceId);

    const workspacesList = await ctx.db
      .select()
      .from(workspaces)
      .orderBy(desc(workspaces.createdAt));

    const filtered = workspacesList.filter((w) => workspaceIds.includes(w.id));

    const memberCounts = await ctx.db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        memberCount: count(),
      })
      .from(workspaceMembers)
      .groupBy(workspaceMembers.workspaceId);

    const countMap = new Map(memberCounts.map((mc: any) => [mc.workspaceId, mc.memberCount]));

    return filtered.map((w) => ({
      ...w,
      memberCount: countMap.get(w.id) ?? 0,
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      if (!membership) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [workspace] = await ctx.db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, input.workspaceId))
        .limit(1);

      if (!workspace) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return workspace;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [workspace] = await ctx.db
        .insert(workspaces)
        .values(input)
        .returning();

      await ctx.db.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: ctx.dbUser.id,
        role: 'owner',
      });

      return workspace;
    }),

  update: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, ...data } = input;

      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      if (!membership || membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [updated] = await ctx.db
        .update(workspaces)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(workspaces.id, workspaceId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      if (!membership || membership.role !== 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db
        .delete(workspaces)
        .where(eq(workspaces.id, input.workspaceId));

      return { success: true };
    }),

  invite: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string().email(),
        role: z.enum(['admin', 'editor', 'viewer']).default('editor'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [targetUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No user found with that email address',
        });
      }

      const [existing] = await ctx.db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, targetUser.id)
          )
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User is already a member of this workspace',
        });
      }

      const [member] = await ctx.db
        .insert(workspaceMembers)
        .values({
          workspaceId: input.workspaceId,
          userId: targetUser.id,
          role: input.role,
        })
        .returning();

      return {
        member,
        user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
      };
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [target] = await ctx.db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, input.userId)
          )
        )
        .limit(1);

      if (target?.role === 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove the workspace owner' });
      }

      await ctx.db
        .delete(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, input.userId)
          )
        );

      return { success: true };
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
        role: z.enum(['admin', 'editor', 'viewer']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      if (!membership || membership.role !== 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner can change member roles' });
      }

      if (input.userId === ctx.dbUser.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot change your own role' });
      }

      const [target] = await ctx.db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, input.userId)
          )
        )
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      }

      const [updated] = await ctx.db
        .update(workspaceMembers)
        .set({ role: input.role })
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, input.userId)
          )
        )
        .returning();

      return updated;
    }),

  getMembers: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      if (!membership) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const members = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          role: workspaceMembers.role,
          createdAt: workspaceMembers.createdAt,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, input.workspaceId));

      return members;
    }),
});
