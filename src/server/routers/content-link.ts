import { z } from 'zod';
import { eq, and, or, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { contentLinks, records, cellValues, tables, workspaceMembers } from '@/lib/db/schema';

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

async function getRecordWorkspace(db: any, recordId: string): Promise<string> {
  const [record] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);

  if (!record) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return record.workspaceId;
}

async function getRecordWithCells(db: any, recordId: string) {
  const [record] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);

  if (!record) return null;

  const cells = await db
    .select()
    .from(cellValues)
    .where(eq(cellValues.recordId, recordId));

  return { ...record, cellValues: cells };
}

export const contentLinkRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        sourceRecordId: z.string(),
        targetRecordId: z.string(),
        linkType: z.enum(['derivative', 'inspiration', 'reference']).default('derivative'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getRecordWorkspace(ctx.db, input.sourceRecordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      if (input.sourceRecordId === input.targetRecordId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot link a record to itself' });
      }

      const [existing] = await ctx.db
        .select()
        .from(contentLinks)
        .where(
          and(
            eq(contentLinks.sourceRecordId, input.sourceRecordId),
            eq(contentLinks.targetRecordId, input.targetRecordId),
          ),
        )
        .limit(1);

      if (existing) {
        return existing;
      }

      const [link] = await ctx.db
        .insert(contentLinks)
        .values({
          sourceRecordId: input.sourceRecordId,
          targetRecordId: input.targetRecordId,
          linkType: input.linkType,
        })
        .returning();

      return link;
    }),

  delete: protectedProcedure
    .input(z.object({ linkId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [link] = await ctx.db
        .select()
        .from(contentLinks)
        .where(eq(contentLinks.id, input.linkId))
        .limit(1);

      if (!link) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const workspaceId = await getRecordWorkspace(ctx.db, link.sourceRecordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      await ctx.db.delete(contentLinks).where(eq(contentLinks.id, input.linkId));

      return { success: true };
    }),

  list: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await getRecordWorkspace(ctx.db, input.recordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      const outgoingLinks = await ctx.db
        .select()
        .from(contentLinks)
        .where(eq(contentLinks.sourceRecordId, input.recordId));

      const incomingLinks = await ctx.db
        .select()
        .from(contentLinks)
        .where(eq(contentLinks.targetRecordId, input.recordId));

      const allLinks = [...outgoingLinks, ...incomingLinks];

      if (allLinks.length === 0) {
        return { outgoing: [], incoming: [] };
      }

      const relatedRecordIds = [
        ...new Set([
          ...outgoingLinks.map((l: any) => l.targetRecordId),
          ...incomingLinks.map((l: any) => l.sourceRecordId),
        ]),
      ];

      const relatedRecords = await ctx.db
        .select()
        .from(records)
        .where(sql`${records.id} IN ${relatedRecordIds}`);

      const recordMap = new Map<string, typeof relatedRecords[0]>();
      for (const record of relatedRecords) {
        recordMap.set(record.id, record);
      }

      return {
        outgoing: outgoingLinks.map((link: any) => ({
          ...link,
          record: recordMap.get(link.targetRecordId) ?? null,
        })),
        incoming: incomingLinks.map((link: any) => ({
          ...link,
          record: recordMap.get(link.sourceRecordId) ?? null,
        })),
      };
    }),

  listWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      const links = await ctx.db
        .select()
        .from(contentLinks)
        .innerJoin(records, eq(contentLinks.sourceRecordId, records.id))
        .where(eq(records.workspaceId, input.workspaceId));

      return links;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        linkId: z.string(),
        status: z.enum(['synced', 'outdated', 'orphaned']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [link] = await ctx.db
        .select()
        .from(contentLinks)
        .where(eq(contentLinks.id, input.linkId))
        .limit(1);

      if (!link) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const workspaceId = await getRecordWorkspace(ctx.db, link.sourceRecordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      const [updated] = await ctx.db
        .update(contentLinks)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(contentLinks.id, input.linkId))
        .returning();

      return updated;
    }),

  getTree: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await getRecordWorkspace(ctx.db, input.recordId);
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, workspaceId);

      const [rootRecord] = await ctx.db
        .select()
        .from(records)
        .where(eq(records.id, input.recordId))
        .limit(1);

      if (!rootRecord) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      async function buildChildren(parentId: string, visited: Set<string>): Promise<any[]> {
        if (visited.has(parentId)) return [];
        visited.add(parentId);

        const childrenLinks = await ctx.db
          .select()
          .from(contentLinks)
          .where(eq(contentLinks.sourceRecordId, parentId));

        const children = [];
        for (const link of childrenLinks) {
          const childRecord = await getRecordWithCells(ctx.db, link.targetRecordId);
          if (childRecord) {
            const grandchildren = await buildChildren(childRecord.id, visited);
            children.push({
              ...childRecord,
              linkId: link.id,
              linkType: link.linkType,
              linkStatus: link.status,
              children: grandchildren,
            });
          }
        }
        return children;
      }

      const tree = await buildChildren(rootRecord.id, new Set());

      return {
        root: rootRecord,
        tree,
      };
    }),

  getMap: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.db, ctx.dbUser.id, input.workspaceId);

      const allLinks = await ctx.db
        .select({
          id: contentLinks.id,
          sourceRecordId: contentLinks.sourceRecordId,
          targetRecordId: contentLinks.targetRecordId,
          linkType: contentLinks.linkType,
          status: contentLinks.status,
        })
        .from(contentLinks)
        .innerJoin(records, eq(contentLinks.sourceRecordId, records.id))
        .where(eq(records.workspaceId, input.workspaceId));

      if (allLinks.length === 0) {
        return { nodes: [], edges: [] };
      }

      const recordIds = new Set<string>();
      for (const link of allLinks) {
        recordIds.add(link.sourceRecordId);
        recordIds.add(link.targetRecordId);
      }

      const allRecords = await ctx.db
        .select()
        .from(records)
        .where(sql`${records.id} IN ${[...recordIds]}`);

      const cells = allRecords.length > 0
        ? await ctx.db
            .select()
            .from(cellValues)
            .where(sql`${cellValues.recordId} IN ${[...recordIds]}`)
        : [];

      const cellsByRecord = new Map<string, typeof cells>();
      for (const cell of cells) {
        const existing = cellsByRecord.get(cell.recordId) ?? [];
        existing.push(cell);
        cellsByRecord.set(cell.recordId, existing);
      }

      const nodes = allRecords.map((record) => ({
        ...record,
        cellValues: cellsByRecord.get(record.id) ?? [],
      }));

      return {
        nodes,
        edges: allLinks,
      };
    }),
});
