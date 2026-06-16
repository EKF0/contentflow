export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface Plan {
  id: PlanTier;
  name: string;
  description: string;
  price: number | null;
  priceInterval: 'month' | 'year' | null;
  maxRecords: number | null;
  maxUsers: number | null;
  features: string[];
  stripePriceId?: string;
  stripeYearlyPriceId?: string;
  isPopular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals and small projects getting started with content planning.',
    price: 0,
    priceInterval: null,
    maxRecords: 100,
    maxUsers: 1,
    features: [
      'Up to 100 records',
      '1 user',
      'Grid, Kanban, and Calendar views',
      'Basic templates',
      'Import & Export',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For content professionals who need more power and AI assistance.',
    price: 8,
    priceInterval: 'month',
    maxRecords: 10_000,
    maxUsers: 1,
    isPopular: true,
    features: [
      'Up to 10,000 records',
      '1 user',
      'Everything in Free',
      'AI writing assistant',
      'Advanced automations',
      'Custom field types',
      'Priority support',
    ],
    stripePriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For teams that collaborate on content across the organization.',
    price: 12,
    priceInterval: 'month',
    maxRecords: null,
    maxUsers: 10,
    features: [
      'Unlimited records',
      'Up to 10 team members',
      'Everything in Pro',
      'Real-time collaboration',
      'Team workspaces',
      'Role-based permissions',
      'Admin dashboard',
    ],
    stripePriceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_TEAM_YEARLY_PRICE_ID,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations with custom needs and security requirements.',
    price: null,
    priceInterval: null,
    maxRecords: null,
    maxUsers: null,
    features: [
      'Everything in Team',
      'Unlimited team members',
      'SSO / SAML authentication',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Audit logs',
      'Custom data retention',
    ],
  },
];

export function getPlanByTier(tier: PlanTier): Plan | undefined {
  return PLANS.find((p) => p.id === tier);
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return `$${price}`;
}
