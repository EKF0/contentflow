import { db } from '@/lib/db';
import {
  automations,
  records,
  cellValues,
  fields,
  notifications,
  workspaceMembers,
  users,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type TriggerType = 'status_change' | 'date_arrived' | 'field_updated' | 'created';

type TriggerEvent = {
  type: TriggerType;
  recordId: string;
  fieldId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  changedBy?: string;
};

type Condition = {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'before' | 'after';
  value: unknown;
};

type AutomationAction =
  | { type: 'notify'; userIds: string[]; message: string }
  | { type: 'assign'; userIds: string[] }
  | { type: 'update_field'; fieldId: string; value: unknown }
  | { type: 'send_email'; to: string[]; subject: string; body: string }
  | { type: 'webhook'; url: string; method: 'GET' | 'POST'; body?: unknown };

export async function evaluateTrigger(
  trigger: TriggerType,
  record: { id: string; createdAt: Date },
  event: TriggerEvent,
): Promise<boolean> {
  if (trigger === 'created') {
    return event.type === 'created';
  }
  if (trigger === 'status_change') {
    return event.type === 'status_change';
  }
  if (trigger === 'date_arrived') {
    if (event.type !== 'date_arrived') return false;
    const now = new Date();
    const fieldValue = event.newValue;
    if (typeof fieldValue === 'string') {
      const date = new Date(fieldValue);
      return date <= now;
    }
    return false;
  }
  if (trigger === 'field_updated') {
    return event.type === 'field_updated' && event.fieldId != null;
  }
  return false;
}

export async function evaluateConditions(
  conditions: Condition[],
  recordId: string,
): Promise<boolean> {
  if (conditions.length === 0) return true;

  const cells = await db
    .select()
    .from(cellValues)
    .where(eq(cellValues.recordId, recordId));

  const cellMap = new Map<string, unknown>();
  for (const cell of cells) {
    cellMap.set(cell.fieldId, cell.value);
  }

  for (const condition of conditions) {
    const cellValue = cellMap.get(condition.fieldId);

    switch (condition.operator) {
      case 'equals':
        if (cellValue !== condition.value) return false;
        break;
      case 'not_equals':
        if (cellValue === condition.value) return false;
        break;
      case 'contains':
        if (typeof cellValue === 'string' && typeof condition.value === 'string') {
          if (!cellValue.includes(condition.value)) return false;
        } else {
          return false;
        }
        break;
      case 'before':
        if (typeof cellValue === 'string' && typeof condition.value === 'string') {
          if (new Date(cellValue) >= new Date(condition.value)) return false;
        } else {
          return false;
        }
        break;
      case 'after':
        if (typeof cellValue === 'string' && typeof condition.value === 'string') {
          if (new Date(cellValue) <= new Date(condition.value)) return false;
        } else {
          return false;
        }
        break;
    }
  }

  return true;
}

export async function executeActions(
  actions: AutomationAction[],
  recordId: string,
  workspaceId: string,
  event: TriggerEvent,
): Promise<void> {
  const [record] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);

  if (!record) return;

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'notify': {
          for (const userId of action.userIds) {
            await db.insert(notifications).values({
              workspaceId,
              recordId,
              userId,
              type: 'system',
              message: action.message.replace('{record}', record.title),
              metadata: { automationEvent: event.type },
            });
          }
          break;
        }
        case 'assign': {
          const [field] = await db
            .select()
            .from(fields)
            .where(
              and(
                eq(fields.tableId, record.tableId),
                eq(fields.type, 'collaborator'),
              ),
            )
            .limit(1);

          if (field) {
            const existingCell = await db
              .select()
              .from(cellValues)
              .where(
                and(
                  eq(cellValues.recordId, recordId),
                  eq(cellValues.fieldId, field.id),
                ),
              )
              .limit(1);

            const currentAssignees: string[] =
              existingCell && Array.isArray(existingCell[0]?.value)
                ? (existingCell[0].value as string[])
                : [];

            const newAssignees = [
              ...new Set([...currentAssignees, ...action.userIds]),
            ];

            if (existingCell && existingCell[0]) {
              await db
                .update(cellValues)
                .set({ value: newAssignees, updatedAt: new Date() })
                .where(
                  and(
                    eq(cellValues.recordId, recordId),
                    eq(cellValues.fieldId, field.id),
                  ),
                );
            } else {
              await db.insert(cellValues).values({
                recordId,
                fieldId: field.id,
                value: newAssignees,
              });
            }
          }
          break;
        }
        case 'update_field': {
          const existingCell = await db
            .select()
            .from(cellValues)
            .where(
              and(
                eq(cellValues.recordId, recordId),
                eq(cellValues.fieldId, action.fieldId),
              ),
            )
            .limit(1);

          if (existingCell && existingCell[0]) {
            await db
              .update(cellValues)
              .set({ value: action.value, updatedAt: new Date() })
              .where(
                and(
                  eq(cellValues.recordId, recordId),
                  eq(cellValues.fieldId, action.fieldId),
                ),
              );
          } else {
            await db.insert(cellValues).values({
              recordId,
              fieldId: action.fieldId,
              value: action.value,
            });
          }
          break;
        }
        case 'send_email': {
          console.log(
            `[Automation] Sending email to ${action.to.join(',')}: ${action.subject}`,
          );
          break;
        }
        case 'webhook': {
          console.log(
            `[Automation] Webhook to ${action.url}: ${action.method}`,
          );
          break;
        }
      }
    } catch (err) {
      console.error(`[Automation] Error executing action ${action.type}:`, err);
    }
  }
}

export async function processRecordEvent(
  event: TriggerEvent,
): Promise<void> {
  const [record] = await db
    .select()
    .from(records)
    .where(eq(records.id, event.recordId))
    .limit(1);

  if (!record) return;

  const activeAutomations = await db
    .select()
    .from(automations)
    .where(
      and(
        eq(automations.workspaceId, record.workspaceId),
        eq(automations.isActive, true),
      ),
    );

  for (const automation of activeAutomations) {
    const triggerMatched = await evaluateTrigger(
      automation.trigger as TriggerType,
      record,
      event,
    );

    if (!triggerMatched) continue;

    const conditions = (automation.conditions as Condition[]) ?? [];
    const conditionsMet = await evaluateConditions(
      conditions,
      record.id,
    );

    if (!conditionsMet) continue;

    const actions = (automation.actions as AutomationAction[]) ?? [];
    await executeActions(actions, record.id, record.workspaceId, event);
  }
}
