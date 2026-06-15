import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys, records, cellValues, tables, workspaceMembers } from '@/lib/db/schema';
import { eq, and, sql, asc } from 'drizzle-orm';

async function authenticateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const keyHash = `h_${Math.abs(hash).toString(16)}`;

  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
    .limit(1);

  if (!apiKey) return null;

  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return null;
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return apiKey;
}

async function assertWorkspaceAccess(userId: string, workspaceId: string) {
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

async function handleGetRecords(
  request: NextRequest,
  params: { tableId: string }
) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100);
  const cursor = url.searchParams.get('cursor');
  const includeArchived = url.searchParams.get('includeArchived') === 'true';

  const conditions = [eq(records.tableId, params.tableId)];

  if (!includeArchived) {
    conditions.push(eq(records.isArchived, false));
  }

  if (cursor) {
    conditions.push(sql`${records.id} > ${cursor}`);
  }

  const items = await db
    .select()
    .from(records)
    .where(and(...conditions))
    .orderBy(asc(records.sortOrder), asc(records.id))
    .limit(limit + 1);

  let nextCursor: string | undefined;
  if (items.length > limit) {
    const nextItem = items.pop();
    nextCursor = nextItem?.id;
  }

  if (items.length > 0) {
    const recordIds = items.map((r) => r.id);
    const cells = await db
      .select()
      .from(cellValues)
      .where(sql`${cellValues.recordId} IN ${recordIds}`);

    const cellsByRecord = new Map<string, typeof cells>();
    for (const cell of cells) {
      const existing = cellsByRecord.get(cell.recordId) ?? [];
      existing.push(cell);
      cellsByRecord.set(cell.recordId, existing);
    }

    return NextResponse.json({
      data: items.map((record) => ({
        ...record,
        cellValues: cellsByRecord.get(record.id) ?? [],
      })),
      nextCursor,
    });
  }

  return NextResponse.json({ data: items, nextCursor });
}

async function handleGetRecord(
  request: NextRequest,
  params: { recordId: string }
) {
  const [record] = await db
    .select()
    .from(records)
    .where(eq(records.id, params.recordId))
    .limit(1);

  if (!record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  const cells = await db
    .select()
    .from(cellValues)
    .where(eq(cellValues.recordId, params.recordId));

  return NextResponse.json({ data: { ...record, cellValues: cells } });
}

async function handleCreateRecord(request: NextRequest) {
  const body = await request.json();
  const { tableId, title, cellValues: cellValuesData } = body;

  if (!tableId || !title) {
    return NextResponse.json({ error: 'tableId and title are required' }, { status: 400 });
  }

  const [table] = await db
    .select()
    .from(tables)
    .where(eq(tables.id, tableId))
    .limit(1);

  if (!table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }

  const [maxSort] = await db
    .select({ maxSort: sql<number>`COALESCE(MAX(${records.sortOrder}), 0)` })
    .from(records)
    .where(eq(records.tableId, tableId));

  const [record] = await db
    .insert(records)
    .values({
      tableId,
      workspaceId: table.workspaceId,
      title,
      sortOrder: (maxSort?.maxSort ?? 0) + 1,
      createdBy: 'api-user',
    })
    .returning();

  if (cellValuesData && Array.isArray(cellValuesData) && cellValuesData.length > 0) {
    await db.insert(cellValues).values(
      cellValuesData.map((cv: { fieldId: string; value: unknown }) => ({
        recordId: record.id,
        fieldId: cv.fieldId,
        value: cv.value,
      }))
    );
  }

  return NextResponse.json({ data: record }, { status: 201 });
}

async function handleUpdateRecord(
  request: NextRequest,
  params: { recordId: string }
) {
  const body = await request.json();
  const { title, cellValues: cellValuesData } = body;

  const [existing] = await db
    .select()
    .from(records)
    .where(eq(records.id, params.recordId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updateData.title = title;

  const [updated] = await db
    .update(records)
    .set(updateData)
    .where(eq(records.id, params.recordId))
    .returning();

  if (cellValuesData && Array.isArray(cellValuesData)) {
    for (const cv of cellValuesData) {
      const [existingCell] = await db
        .select()
        .from(cellValues)
        .where(
          and(
            eq(cellValues.recordId, params.recordId),
            eq(cellValues.fieldId, cv.fieldId)
          )
        )
        .limit(1);

      if (existingCell) {
        await db
          .update(cellValues)
          .set({ value: cv.value, updatedAt: new Date() })
          .where(
            and(
              eq(cellValues.recordId, params.recordId),
              eq(cellValues.fieldId, cv.fieldId)
            )
          );
      } else {
        await db.insert(cellValues).values({
          recordId: params.recordId,
          fieldId: cv.fieldId,
          value: cv.value,
        });
      }
    }
  }

  return NextResponse.json({ data: updated });
}

async function handleDeleteRecord(
  request: NextRequest,
  params: { recordId: string }
) {
  const [existing] = await db
    .select()
    .from(records)
    .where(eq(records.id, params.recordId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  await db.delete(records).where(eq(records.id, params.recordId));

  return NextResponse.json({ data: { deleted: true } });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const apiKey = await authenticateApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  const { route } = await params;
  const membership = await assertWorkspaceAccess(apiKey.userId, apiKey.workspaceId);
  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const permissions = (apiKey.permissions as string[]) ?? [];
  if (!permissions.includes('read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    if (route[0] === 'tables' && route[1] && route[2] === 'records' && !route[3]) {
      return await handleGetRecords(request, { tableId: route[1] });
    }

    if (route[0] === 'records' && route[1] && !route[2]) {
      return await handleGetRecord(request, { recordId: route[1] });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[REST API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const apiKey = await authenticateApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  const { route } = await params;
  const membership = await assertWorkspaceAccess(apiKey.userId, apiKey.workspaceId);
  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const permissions = (apiKey.permissions as string[]) ?? [];
  if (!permissions.includes('write')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    if (route[0] === 'records' && !route[1]) {
      return await handleCreateRecord(request);
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[REST API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const apiKey = await authenticateApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  const { route } = await params;
  const membership = await assertWorkspaceAccess(apiKey.userId, apiKey.workspaceId);
  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const permissions = (apiKey.permissions as string[]) ?? [];
  if (!permissions.includes('write')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    if (route[0] === 'records' && route[1] && !route[2]) {
      return await handleUpdateRecord(request, { recordId: route[1] });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[REST API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const apiKey = await authenticateApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  const { route } = await params;
  const membership = await assertWorkspaceAccess(apiKey.userId, apiKey.workspaceId);
  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const permissions = (apiKey.permissions as string[]) ?? [];
  if (!permissions.includes('write')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    if (route[0] === 'records' && route[1] && !route[2]) {
      return await handleDeleteRecord(request, { recordId: route[1] });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[REST API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
