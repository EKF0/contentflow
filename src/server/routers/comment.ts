import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { comments, mentions, users, records, workspaceMembers, notifications } from '@/lib/db/schema';
import { notifyMention } from '@/lib/notifications';

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

function extractMentionIds(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const matches: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
}

export const commentRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        recordId: z.string(),
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
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

      const conditions = [
        eq(comments.recordId, input.recordId),
        sql`${comments.parentCommentId} IS NULL`,
      ];

      if (input.cursor) {
        conditions.push(sql`${comments.id} > ${input.cursor}`);
      }

      const rootComments = await ctx.db
        .select()
        .from(comments)
        .where(and(...conditions))
        .orderBy(asc(comments.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (rootComments.length > input.limit) {
        const nextItem = rootComments.pop();
        nextCursor = nextItem?.id;
      }

      const commentIds = rootComments.map((c) => c.id);
      let replies: any[] = [];

      if (commentIds.length > 0) {
        replies = await ctx.db
          .select()
          .from(comments)
          .where(sql`${comments.parentCommentId} IN ${commentIds}`)
          .orderBy(asc(comments.createdAt));
      }

      const userIds = [
        ...new Set([
          ...rootComments.map((c) => c.userId),
          ...replies.map((c) => c.userId),
        ]),
      ];

      let userList: any[] = [];
      if (userIds.length > 0) {
        userList = await ctx.db
          .select()
          .from(users)
          .where(sql`${users.id} IN ${userIds}`);
      }

      const usersById = new Map(userList.map((u) => [u.id, u]));

      const repliesByParent = new Map<string, typeof replies>();
      for (const reply of replies) {
        const parentId = reply.parentCommentId!;
        const existing = repliesByParent.get(parentId) ?? [];
        existing.push(reply);
        repliesByParent.set(parentId, existing);
      }

      const commentsWithReplies = rootComments.map((comment) => ({
        ...comment,
        author: usersById.get(comment.userId) ?? null,
        replies: (repliesByParent.get(comment.id) ?? []).map((reply) => ({
          ...reply,
          author: usersById.get(reply.userId) ?? null,
        })),
      }));

      return {
        items: commentsWithReplies,
        nextCursor,
      };
    }),

  count: protectedProcedure
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

      const [result] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(eq(comments.recordId, input.recordId));

      return { count: result?.count ?? 0 };
    }),

  create: protectedProcedure
    .input(
      z.object({
        recordId: z.string(),
        content: z.string().min(1).max(5000),
        parentCommentId: z.string().optional(),
      })
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

      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, record.workspaceId);

      if (membership.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (input.parentCommentId) {
        const [parent] = await ctx.db
          .select()
          .from(comments)
          .where(eq(comments.id, input.parentCommentId))
          .limit(1);

        if (!parent || parent.recordId !== input.recordId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid parent comment' });
        }
      }

      const [comment] = await ctx.db
        .insert(comments)
        .values({
          recordId: input.recordId,
          workspaceId: record.workspaceId,
          userId: ctx.dbUser.id,
          content: input.content,
          parentCommentId: input.parentCommentId ?? null,
        })
        .returning();

      await ctx.db.insert(notifications).values({
        workspaceId: record.workspaceId,
        recordId: input.recordId,
        userId: ctx.dbUser.id,
        type: 'comment',
        message: `${ctx.dbUser.name} commented on "${record.title}"`,
        metadata: { commentId: comment.id },
      });

      const mentionNames = extractMentionIds(input.content);
      if (mentionNames.length > 0) {
        const mentionedUsers = await ctx.db
          .select()
          .from(users)
          .where(sql`${users.name} IN ${mentionNames}`);

        for (const mentionedUser of mentionedUsers) {
          await ctx.db.insert(mentions).values({
            commentId: comment.id,
            mentionedUserId: mentionedUser.id,
          });

          await notifyMention(
            record.workspaceId,
            input.recordId,
            mentionedUser.id,
            ctx.dbUser.id,
            input.content.slice(0, 200)
          );
        }
      }

      const [author] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.dbUser.id))
        .limit(1);

      return { ...comment, author };
    }),

  update: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(comments)
        .where(eq(comments.id, input.commentId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (existing.userId !== ctx.dbUser.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [updated] = await ctx.db
        .update(comments)
        .set({ content: input.content, updatedAt: new Date() })
        .where(eq(comments.id, input.commentId))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(comments)
        .where(eq(comments.id, input.commentId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      const isAuthor = existing.userId === ctx.dbUser.id;
      const isAdmin = membership.role === 'owner' || membership.role === 'admin';

      if (!isAuthor && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db.delete(comments).where(eq(comments.id, input.commentId));

      return { success: true };
    }),

  resolve: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(comments)
        .where(eq(comments.id, input.commentId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, existing.workspaceId);

      const [updated] = await ctx.db
        .update(comments)
        .set({ isResolved: !existing.isResolved, updatedAt: new Date() })
        .where(eq(comments.id, input.commentId))
        .returning();

      return updated;
    }),
});

function asc(column: any) {
  return column;
}
