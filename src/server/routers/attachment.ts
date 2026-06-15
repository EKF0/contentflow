import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { attachments, records, workspaceMembers } from '@/lib/db/schema';
import {
  uploadFile,
  deleteFile,
  getSignedUrl,
  isAllowedMimeType,
  isAllowedSize,
} from '@/lib/storage';

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

export const attachmentRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        recordId: z.string(),
        filename: z.string().min(1).max(255),
        mimeType: z.string().nullable(),
        size: z.number().int().positive(),
        fileData: z.string(), // base64-encoded file data
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [record] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(
        ctx.db,
        ctx.dbUser.id,
        record.workspaceId,
      );

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (!isAllowedMimeType(input.mimeType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File type not allowed',
        });
      }

      if (!isAllowedSize(input.size)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File too large (max 10MB)',
        });
      }

      const fileBuffer = Buffer.from(input.fileData, 'base64');

      const { url, filename, size, mimeType } = await uploadFile(
        fileBuffer,
        input.filename,
        input.mimeType,
      );

      const [attachment] = await ctx.db
        .insert(attachments)
        .values({
          recordId: input.recordId,
          workspaceId: record.workspaceId,
          userId: ctx.dbUser.id,
          filename,
          url,
          mimeType,
          size,
        })
        .returning();

      return attachment;
    }),

  list: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [record] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, record.workspaceId);

      const items = await ctx.db
        .select()
        .from(attachments)
        .where(eq(attachments.recordId, input.recordId));

      return items;
    }),

  delete: protectedProcedure
    .input(z.object({ attachmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [attachment] = await ctx.db
        .select()
        .from(attachments)
        .where(eq(attachments.id, input.attachmentId))
        .limit(1);

      if (!attachment) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(
        ctx.db,
        ctx.dbUser.id,
        attachment.workspaceId,
      );

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await deleteFile(attachment.url);

      await ctx.db
        .delete(attachments)
        .where(eq(attachments.id, input.attachmentId));

      return { success: true };
    }),

  getSignedUrl: protectedProcedure
    .input(z.object({ attachmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [attachment] = await ctx.db
        .select()
        .from(attachments)
        .where(eq(attachments.id, input.attachmentId))
        .limit(1);

      if (!attachment) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, attachment.workspaceId);

      const url = await getSignedUrl(attachment.url);
      return { url };
    }),
});
