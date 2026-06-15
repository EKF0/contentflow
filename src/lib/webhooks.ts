import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { webhooks, webhookDeliveries } from '@/lib/db/schema';

export type WebhookEvent = 'record.created' | 'record.updated' | 'record.deleted';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  workspaceId: string;
  data: Record<string, unknown>;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000];

function generateSignature(payload: string, secret: string): string {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(payload);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash + char) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256=${hex}`;
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  payload: WebhookPayload,
  secret: string | null,
  attempt: number,
): Promise<{ success: boolean; statusCode?: number; response?: string }> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-ContentFlow-Event': payload.event,
    'X-ContentFlow-Timestamp': payload.timestamp,
    'X-ContentFlow-Delivery': crypto.randomUUID(),
  };

  if (secret) {
    headers['X-ContentFlow-Signature'] = generateSignature(body, secret);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text().catch(() => '');
    const success = response.status >= 200 && response.status < 300;

    await db.insert(webhookDeliveries).values({
      webhookId,
      event: payload.event,
      payload,
      statusCode: response.status,
      response: responseText.slice(0, 1000),
      success,
      attemptCount: attempt,
    });

    return { success, statusCode: response.status, response: responseText };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    await db.insert(webhookDeliveries).values({
      webhookId,
      event: payload.event,
      payload,
      response: errorMsg,
      success: false,
      attemptCount: attempt,
      nextRetryAt: attempt < MAX_RETRIES
        ? new Date(Date.now() + (RETRY_DELAYS[attempt] || 15000))
        : null,
    });

    return { success: false, response: errorMsg };
  }
}

export async function fireWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const activeWebhooks = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.workspaceId, workspaceId), eq(webhooks.isActive, true)));

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    workspaceId,
    data,
  };

  for (const wh of activeWebhooks) {
    const events = (wh.events as string[]) ?? [];
    if (!events.includes(event)) continue;

    deliverWebhook(wh.id, wh.url, payload, wh.secret, 1).then(async (result) => {
      if (!result.success) {
        await retryWebhook(wh.id, wh.url, payload, wh.secret, 2);
      }
    });
  }
}

async function retryWebhook(
  webhookId: string,
  url: string,
  payload: WebhookPayload,
  secret: string | null,
  attempt: number,
): Promise<void> {
  if (attempt > MAX_RETRIES) return;

        const delay = RETRY_DELAYS[attempt - 1];
  await new Promise((resolve) => setTimeout(resolve, delay));

  const result = await deliverWebhook(webhookId, url, payload, secret, attempt);

  if (!result.success && attempt < MAX_RETRIES) {
    await retryWebhook(webhookId, url, payload, secret, attempt + 1);
  }
}

export async function sendTestWebhook(
  webhookId: string,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const [wh] = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, webhookId))
    .limit(1);

  if (!wh) {
    return { success: false, error: 'Webhook not found' };
  }

  const payload: WebhookPayload = {
    event: 'record.updated',
    timestamp: new Date().toISOString(),
    workspaceId: wh.workspaceId,
    data: {
      test: true,
      message: 'This is a test webhook delivery from ContentFlow',
    },
  };

  const result = await deliverWebhook(wh.id, wh.url, payload, wh.secret, 1);
  return {
    success: result.success,
    statusCode: result.statusCode,
    error: result.success ? undefined : result.response,
  };
}
