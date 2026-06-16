import Link from 'next/link';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For solo creators and small experiments.',
    features: ['Up to 3 users', '500 records', 'Grid view', '3 templates', 'Community support'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/user/mo',
    description: 'For growing teams who need more power.',
    features: [
      'Unlimited users',
      'Unlimited records',
      'All views (Grid, Kanban, Calendar)',
      'AI Suggestions',
      'All templates',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$18',
    period: '/user/mo',
    description: 'For teams that need advanced collaboration.',
    features: [
      'Everything in Pro',
      'Real-time collaboration',
      'Analytics dashboard',
      'Custom fields & automations',
      'Integrations (Slack, Zapier)',
      'Admin controls',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations with custom needs.',
    features: [
      'Everything in Team',
      'SSO & SAML',
      'Audit logs',
      'Dedicated support',
      'Custom contracts',
      'API access',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-[var(--surface)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-[var(--fg-weak)]">
            Start free. Upgrade when you&apos;re ready. No hidden fees.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border p-6 transition-all ${
                tier.highlighted
                  ? 'border-[var(--primary)] bg-[var(--bg)] shadow-[var(--shadow-lg)]'
                  : 'border-[var(--border)] bg-[var(--bg)]'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              <h3 className="text-lg font-semibold text-[var(--fg)]">{tier.name}</h3>
              <p className="mt-1 text-sm text-[var(--fg-weak)]">{tier.description}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[var(--fg)]">{tier.price}</span>
                {tier.period && (
                  <span className="text-sm text-[var(--fg-muted)]">{tier.period}</span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[var(--fg-weak)]">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-published)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.name === 'Enterprise' ? '#contact' : '/sign-up'}
                className={`mt-6 block w-full rounded-[var(--radius-md)] px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                  tier.highlighted
                    ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                    : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
