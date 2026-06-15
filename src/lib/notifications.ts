import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications, users, records, workspaces, workspaceMembers } from '@/lib/db/schema';
import { sendMentionEmail, sendAssignmentEmail, sendStatusChangeEmail } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function getUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user;
}

async function getRecord(recordId: string) {
  const [record] = await db.select().from(records).where(eq(records.id, recordId)).limit(1);
  return record;
}

async function getWorkspace(workspaceId: string) {
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  return ws;
}

type NotificationType = 'mention' | 'assignment' | 'status_change' | 'comment' | 'system';

async function createNotification(params: {
  workspaceId: string;
  recordId: string;
  userId: string;
  type: NotificationType;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(notifications).values({
    workspaceId: params.workspaceId,
    recordId: params.recordId,
    userId: params.userId,
    type: params.type,
    message: params.message,
    metadata: params.metadata ?? null,
  });
}

function recordUrl(recordId: string): string {
  return `${APP_URL}/records/${recordId}`;
}

export async function notifyMention(
  workspaceId: string,
  recordId: string,
  mentionedUserId: string,
  mentionerUserId: string,
  commentSnippet: string,
): Promise<void> {
  const [mentioner, record, workspace] = await Promise.all([
    getUser(mentionerUserId),
    getRecord(recordId),
    getWorkspace(workspaceId),
  ]);

  if (!mentioner || !record || !workspace) return;
  if (mentionedUserId === mentionerUserId) return;

  const message = `${mentioner.name} mentioned you in "${record.title}"`;

  await createNotification({
    workspaceId,
    recordId,
    userId: mentionedUserId,
    type: 'mention',
    message,
    metadata: { mentionerName: mentioner.name, commentSnippet },
  });

  const targetUser = await getUser(mentionedUserId);
  if (targetUser?.email) {
    await sendMentionEmail({
      to: targetUser.email,
      mentionerName: mentioner.name,
      recordTitle: record.title,
      workspaceName: workspace.name,
      recordUrl: `/records/${recordId}`,
    }).catch((err) => console.error('[Notification] Failed to send mention email:', err));
  }
}

export async function notifyAssignment(
  workspaceId: string,
  recordId: string,
  assigneeId: string,
  assignerUserId: string,
): Promise<void> {
  const [assigner, record, workspace] = await Promise.all([
    getUser(assignerUserId),
    getRecord(recordId),
    getWorkspace(workspaceId),
  ]);

  if (!assigner || !record || !workspace) return;
  if (assigneeId === assignerUserId) return;

  const message = `${assigner.name} assigned you to "${record.title}"`;

  await createNotification({
    workspaceId,
    recordId,
    userId: assigneeId,
    type: 'assignment',
    message,
    metadata: { assignerName: assigner.name },
  });

  const targetUser = await getUser(assigneeId);
  if (targetUser?.email) {
    await sendAssignmentEmail({
      to: targetUser.email,
      assignerName: assigner.name,
      recordTitle: record.title,
      workspaceName: workspace.name,
      recordUrl: recordUrl(recordId),
    }).catch((err) => console.error('[Notification] Failed to send assignment email:', err));
  }
}

export async function notifyStatusChange(
  workspaceId: string,
  recordId: string,
  newStatus: string,
  changedByUserId: string,
  oldStatus: string,
): Promise<void> {
  const [changer, record, workspace] = await Promise.all([
    getUser(changedByUserId),
    getRecord(recordId),
    getWorkspace(workspaceId),
  ]);

  if (!changer || !record || !workspace) return;

  const message = `${changer.name} changed "${record.title}" status to ${newStatus}`;

  const members = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  for (const member of members) {
    if (member.userId === changedByUserId) continue;

    await createNotification({
      workspaceId,
      recordId,
      userId: member.userId,
      type: 'status_change',
      message,
      metadata: { changedByName: changer.name, oldStatus, newStatus },
    });

    const targetUser = await getUser(member.userId);
    if (targetUser?.email) {
      await sendStatusChangeEmail({
        to: targetUser.email,
        changerName: changer.name,
        recordTitle: record.title,
        oldStatus,
        newStatus,
        recordUrl: recordUrl(recordId),
      }).catch((err) => console.error('[Notification] Failed to send status email:', err));
    }
  }
}
