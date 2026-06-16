import { z } from 'zod';
import { eq, and, desc, count, sum } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  subscriptions,
  invoices,
  records,
  workspaceMembers,
  attachments,
} from '@/lib/db/schema';
import { PLANS, getPlanByTier, type PlanTier } from '@/lib/plans';
import {
  stripe,
  createCheckoutSession,
  createPortalSession,
} from '@/lib/stripe';

export const billingRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const [subscription] = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.dbUser.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!subscription) {
      return {
        tier: 'free' as const,
        status: 'active' as const,
        currentPeriodEnd: null,
        subscription: null,
      };
    }

    return {
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      subscription,
    };
  }),

  getPlans: protectedProcedure.query(() => {
    return PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      priceInterval: plan.priceInterval,
      maxRecords: plan.maxRecords,
      maxUsers: plan.maxUsers,
      features: plan.features,
      isPopular: plan.isPopular,
      hasCheckout: !!plan.stripePriceId,
    }));
  }),

  createCheckout: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['pro', 'team']),
        yearly: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const plan = getPlanByTier(input.tier);
      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      const priceId = input.yearly
        ? plan.stripeYearlyPriceId
        : plan.stripePriceId;

      if (!priceId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Checkout not available for this plan',
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const session = await createCheckoutSession({
        userId: ctx.dbUser.id,
        email: ctx.dbUser.email,
        priceId,
        successUrl: `${baseUrl}/dashboard/billing?success=true`,
        cancelUrl: `${baseUrl}/dashboard/billing?canceled=true`,
      });

      return { url: session.url };
    }),

  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const [subscription] = await ctx.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, ctx.dbUser.id),
          eq(subscriptions.status, 'active'),
        ),
      )
      .limit(1);

    if (!subscription?.stripeCustomerId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No active subscription found',
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await createPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${baseUrl}/dashboard/billing`,
    });

    return { url: session.url };
  }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const [subscription] = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.dbUser.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const tier: PlanTier = (subscription?.tier as PlanTier) || 'free';
    const plan = getPlanByTier(tier);

    const memberships = await ctx.db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, ctx.dbUser.id));

    const workspaceIds = memberships.map((m) => m.workspaceId);

    let totalRecords = 0;
    let totalStorage = 0;

    if (workspaceIds.length > 0) {
      const [recordCount] = await ctx.db
        .select({ total: count() })
        .from(records)
        .where(eq(records.workspaceId, workspaceIds[0]));

      const [storageCount] = await ctx.db
        .select({ total: sum(attachments.size) })
        .from(attachments)
        .where(eq(attachments.workspaceId, workspaceIds[0]));

      totalRecords = recordCount?.total ?? 0;
      totalStorage = Number(storageCount?.total ?? 0);
    }

    return {
      records: {
        used: totalRecords,
        limit: plan?.maxRecords ?? null,
        percentage: plan?.maxRecords
          ? Math.round((totalRecords / plan.maxRecords) * 100)
          : null,
      },
      storage: {
        used: totalStorage,
        limit: tier === 'free' ? 100 * 1024 * 1024 : tier === 'pro' ? 5 * 1024 * 1024 * 1024 : null,
        percentage: tier === 'free'
          ? Math.round((totalStorage / (100 * 1024 * 1024)) * 100)
          : tier === 'pro'
            ? Math.round((totalStorage / (5 * 1024 * 1024 * 1024)) * 100)
            : null,
      },
      team: {
        used: memberships.length,
        limit: plan?.maxUsers ?? null,
      },
      tier,
    };
  }),

  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    const userInvoices = await ctx.db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, ctx.dbUser.id))
      .orderBy(desc(invoices.createdAt))
      .limit(24);

    return userInvoices;
  }),
});
