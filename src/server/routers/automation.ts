import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { automations, workspaceMembers } from '@/lib/db/schema';
import { processRecordEvent } from '@/lib/automation-engine';

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

const conditionSchema = z.object({
  fieldId: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'before', 'after']),
  value: z.any(),
});

const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('notify'),
    userIds: z.array(z.string()),
    message: z.string(),
  }),
  z.object({
    type: z.literal('assign'),
    userIds: z.array(z.string()),
  }),
  z.object({
    type: z.literal('update_field'),
    fieldId: z.string(),
    value: z.any(),
  }),
  z.object({
    type: z.literal('send_email'),
    to: z.array(z.string()),
    subject: z.string(),
    body: z.string(),
  }),
  z.object({
    type: z.literal('webhook'),
    url: z.string().url(),
    method: z.enum(['GET', 'POST']),
    body: z.any().optional(),
  }),
]);

export const automationRouter = router({
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      return ctx.db
        .select()
        .from(automations)
        .where(eq(automations.workspaceId, input.workspaceId))
        .orderBy(desc(automations.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ automationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [automation] = await ctx.db
        .select()
        .from(automations)
        .where(eq(automations.id, input.automationId))
        .limit(1);

      if (!automation) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, automation.workspaceId);

      return automation;
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(1).max(200),
        trigger: z.enum(['status_change', 'date_arrived', 'field_updated', 'created']),
        conditions: z.array(conditionSchema).default([]),
        actions: z.array(actionSchema).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      const [automation] = await ctx.db
        .insert(automations)
        .values({
          workspaceId: input.workspaceId,
          name: input.name,
          trigger: input.trigger,
          conditions: input.conditions,
          actions: input.actions,
          createdBy: ctx.dbUser.id,
        })
        .returning();

      return automation;
    }),

  update: protectedProcedure
    .input(
      z.object({
        automationId: z.string(),
        name: z.string().min(1).max(200).optional(),
        trigger: z.enum(['status_change', 'date_arrived', 'field_updated', 'created']).optional(),
        conditions: z.array(conditionSchema).optional(),
        actions: z.array(actionSchema).min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(automations)
        .where(eq(automations.id, input.automationId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      const { automationId, ...data } = input;
      const [updated] = await ctx.db
        .update(automations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(automations.id, automationId))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ automationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(automations)
        .where(eq(automations.id, input.automationId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      await ctx.db.delete(automations).where(eq(automations.id, input.automationId));

      return { success: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ automationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(automations)
        .where(eq(automations.id, input.automationId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      const [updated] = await ctx.db
        .update(automations)
        .set({ isActive: !existing.isActive, updatedAt: new Date() })
        .where(eq(automations.id, input.automationId))
        .returning();

      return updated;
    }),

  execute: protectedProcedure
    .input(
      z.object({
        automationId: z.string(),
        recordId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(automations)
        .where(eq(automations.id, input.automationId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      await processRecordEvent({
        type: 'created',
        recordId: input.recordId,
        changedBy: ctx.dbUser.id,
      });

      return { success: true };
    }),
});
