import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, invoices, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status,
): 'active' | 'canceled' | 'past_due' {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
    default:
      return 'canceled';
  }
}

function mapTierFromPrice(
  priceId: string | null | undefined,
): 'free' | 'pro' | 'team' | 'enterprise' {
  if (!priceId) return 'free';
  if (priceId.includes('pro')) return 'pro';
  if (priceId.includes('team')) return 'team';
  if (priceId.includes('enterprise')) return 'enterprise';
  return 'free';
}

async function handleCheckoutCompleted(event: Stripe.Checkout.SessionCompletedEvent) {
  const session = event.data.object;
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  const subscriptionId = session.subscription as string | null;
  const customerId = session.customer as string | null;

  if (!subscriptionId) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const tier = mapTierFromPrice(priceId);

  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      tier,
      status: 'active',
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        tier,
        status: 'active',
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        updatedAt: new Date(),
      },
    });
}

async function handleInvoicePaid(event: Stripe.InvoicePaidEvent) {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription as string | null;
  const customerId = invoice.customer as string | null;

  if (!customerId) return;

  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);

  await db.insert(invoices).values({
    userId: existingSub?.userId ?? '',
    subscriptionId: existingSub?.id ?? null,
    stripeInvoiceId: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'paid',
  });
}

async function handleSubscriptionUpdated(event: Stripe.CustomerSubscriptionUpdatedEvent) {
  const subscription = event.data.object;
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const tier = mapTierFromPrice(priceId);
  const status = mapSubscriptionStatus(subscription.status);

  await db
    .update(subscriptions)
    .set({
      tier,
      status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

async function handleSubscriptionDeleted(event: Stripe.CustomerSubscriptionDeletedEvent) {
  const subscription = event.data.object;

  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

export async function POST(req: Request) {
  const headerStore = await headers();
  const signature = headerStore.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const body = await req.text();

  let event: ReturnType<typeof constructWebhookEvent>;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event as Stripe.Checkout.SessionCompletedEvent);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event as Stripe.InvoicePaidEvent);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event as Stripe.CustomerSubscriptionUpdatedEvent);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event as Stripe.CustomerSubscriptionDeletedEvent);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error processing Stripe webhook ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
