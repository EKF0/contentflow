import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { templates } from '@/lib/db/schema';

export const templateRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const builtIn = await ctx.db
      .select()
      .from(templates)
      .where(eq(templates.isSystem, true))
      .orderBy(desc(templates.createdAt));

    const custom = await ctx.db
      .select()
      .from(templates)
      .where(eq(templates.isSystem, false))
      .orderBy(desc(templates.createdAt));

    return [...builtIn, ...custom];
  }),

  get: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .select()
        .from(templates)
        .where(eq(templates.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      return template;
    }),

  applyTemplate: protectedProcedure
    .input(z.object({ templateId: z.string(), workspaceName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .select()
        .from(templates)
        .where(eq(templates.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      const workspaceId = crypto.randomUUID();

      return { workspaceId, success: true };
    }),

  createFromWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string(), name: z.string(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const templateId = crypto.randomUUID();

      await ctx.db.insert(templates).values({
        id: templateId,
        name: input.name,
        description: input.description || '',
        category: 'custom',
        fieldDefinitions: [],
        statusDefinitions: [],
        sampleRecords: [],
        isSystem: false,
        usageCount: 0,
      });

      return { templateId, success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .select()
        .from(templates)
        .where(eq(templates.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      if (template.isSystem) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete system templates' });
      }

      await ctx.db.delete(templates).where(eq(templates.id, input.templateId));

      return { success: true };
    }),
});
