'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { PLANS, formatPrice, type PlanTier } from '@/lib/plans';
import { formatBytes, getUsageColor } from '@/lib/billing-config';
import { Check, ExternalLink, Loader2, Sparkles, Users, Zap } from 'lucide-react';

export function BillingSettings() {
  const [yearly, setYearly] = useState(false);

  const { data: subscription, isLoading: subLoading } = trpc.billing.getSubscription.useQuery();
  const { data: plans } = trpc.billing.getPlans.useQuery();
  const { data: usage } = trpc.billing.getUsage.useQuery();
  const { data: invoices } = trpc.billing.getInvoices.useQuery();

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const createPortal = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  if (subLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentTier = (subscription?.tier || 'free') as PlanTier;
  const currentPlan = PLANS.find((p) => p.id === currentTier);

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Current Plan</h3>
            <p className="text-sm text-muted-foreground">
              Manage your subscription and billing
            </p>
          </div>
          {currentTier !== 'free' && subscription?.subscription?.stripeCustomerId && (
            <button
              onClick={() => createPortal.mutate()}
              disabled={createPortal.isPending}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              {createPortal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage Subscription
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {currentPlan?.name || 'Free'}
          </span>
          <span className="text-sm text-muted-foreground">
            {currentPlan?.price === 0
              ? 'Free forever'
              : `$${currentPlan?.price}/user/mo`}
          </span>
        </div>

        {subscription?.currentPeriodEnd && (
          <p className="mt-2 text-sm text-muted-foreground">
            Renews on{' '}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Usage */}
      {usage && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Usage</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <UsageCard
              icon={<Zap className="h-4 w-4" />}
              label="Records"
              used={usage.records.used}
              limit={usage.records.limit}
              percentage={usage.records.percentage}
              format={(v) => v.toLocaleString()}
            />
            <UsageCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Storage"
              used={usage.storage.used}
              limit={usage.storage.limit}
              percentage={usage.storage.percentage}
              format={formatBytes}
            />
            <UsageCard
              icon={<Users className="h-4 w-4" />}
              label="Team"
              used={usage.team.used}
              limit={usage.team.limit}
              percentage={null}
              format={(v) => v.toLocaleString()}
            />
          </div>
        </div>
      )}

      {/* Plan Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${!yearly ? 'font-medium' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className="relative h-6 w-11 rounded-full bg-primary"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              yearly ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className={`text-sm ${yearly ? 'font-medium' : 'text-muted-foreground'}`}>
          Yearly
          <span className="ml-1 text-xs text-emerald-600">Save 20%</span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {(plans || PLANS).map((plan) => {
          const isCurrent = plan.id === currentTier;
          const isUpgrade =
            PLANS.findIndex((p) => p.id === plan.id) >
            PLANS.findIndex((p) => p.id === currentTier);

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border p-6 ${
                plan.isPopular
                  ? 'border-primary shadow-md'
                  : isCurrent
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}

              <h4 className="text-lg font-semibold">{plan.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-4">
                <span className="text-3xl font-bold">
                  {plan.price !== null ? formatPrice(plan.price) : 'Custom'}
                </span>
                {plan.priceInterval && (
                  <span className="text-sm text-muted-foreground">
                    /user/{yearly ? 'year' : 'month'}
                  </span>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-md bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    Current Plan
                  </button>
                ) : plan.id === 'enterprise' ? (
                  <a
                    href="mailto:sales@contentflow.app"
                    className="block w-full rounded-md border px-4 py-2 text-center text-sm font-medium hover:bg-accent"
                  >
                    Contact Sales
                  </a>
                ) : isUpgrade && plan.hasCheckout ? (
                  <button
                    onClick={() =>
                      createCheckout.mutate({ tier: plan.id as 'pro' | 'team', yearly })
                    }
                    disabled={createCheckout.isPending}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {createCheckout.isPending ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground"
                  >
                    Not Available
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice History */}
      {invoices && invoices.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Invoice History</h3>
          <div className="mt-4 divide-y">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-muted-foreground">{invoice.status}</p>
                </div>
                <span className="font-medium">
                  ${(invoice.amount / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsageCard({
  icon,
  label,
  used,
  limit,
  percentage,
  format,
}: {
  icon: React.ReactNode;
  label: string;
  used: number;
  limit: number | null;
  percentage: number | null;
  format: (v: number) => string;
}) {
  const display = limit !== null ? `${format(used)} / ${format(limit)}` : `${format(used)} / Unlimited`;
  const colorClass = getUsageColor(percentage);

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${colorClass}`}>
        {display}
      </p>
      {percentage !== null && (
        <div className="mt-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{percentage}% used</p>
        </div>
      )}
    </div>
  );
}
