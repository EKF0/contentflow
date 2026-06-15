import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/backend';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function handleUserCreated(event: WebhookEvent) {
  const data = event.data as unknown as Record<string, unknown>;
  const clerkId = data.id as string | undefined;
  const emailAddresses = data.email_addresses as Array<{ id: string; email_address: string }> | undefined;
  const imageUrl = data.image_url as string | undefined;
  const firstName = data.first_name as string | undefined;
  const lastName = data.last_name as string | undefined;
  const primaryEmailId = data.primary_email_address_id as string | undefined;
  const primaryEmail = emailAddresses?.find((e) => e.id === primaryEmailId);
  const email = primaryEmail?.email_address;

  if (!clerkId || !email) {
    console.error('Missing clerkId or email in user.created webhook');
    return;
  }

  const name = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];

  await db.insert(users).values({
    clerkId,
    email,
    name,
    avatarUrl: imageUrl ?? null,
  });
}

async function handleUserUpdated(event: WebhookEvent) {
  const data = event.data as unknown as Record<string, unknown>;
  const clerkId = data.id as string | undefined;
  const emailAddresses = data.email_addresses as Array<{ id: string; email_address: string }> | undefined;
  const imageUrl = data.image_url as string | undefined;
  const firstName = data.first_name as string | undefined;
  const lastName = data.last_name as string | undefined;
  const primaryEmailId = data.primary_email_address_id as string | undefined;
  const primaryEmail = emailAddresses?.find((e) => e.id === primaryEmailId);
  const email = primaryEmail?.email_address;

  if (!clerkId) return;

  const name = [firstName, lastName].filter(Boolean).join(' ') || undefined;

  await db
    .update(users)
    .set({
      ...(email && { email }),
      ...(name && { name }),
      ...(imageUrl !== undefined && { avatarUrl: imageUrl }),
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, clerkId));
}

async function handleUserDeleted(event: WebhookEvent) {
  const data = event.data as unknown as Record<string, unknown>;
  const clerkId = data.id as string | undefined;
  if (!clerkId) return;

  await db.delete(users).where(eq(users.clerkId, clerkId));
}

export async function POST(req: Request) {
  const headerStore = await headers();
  const svixId = headerStore.get('svix-id');
  const svixTimestamp = headerStore.get('svix-timestamp');
  const svixSignature = headerStore.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt);
        break;
      case 'user.updated':
        await handleUserUpdated(evt);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt);
        break;
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error(`Error processing webhook ${eventType}:`, err);
    return new Response('Internal server error', { status: 500 });
  }
}
