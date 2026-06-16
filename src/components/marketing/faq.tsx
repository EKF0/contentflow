'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'How does the free plan work?',
    a: 'The free plan includes up to 3 users, 500 records, grid view access, and 3 templates. No credit card required to sign up. Upgrade anytime to unlock more features.',
  },
  {
    q: 'Can I import data from Airtable or Notion?',
    a: 'Yes. ContentFlow supports CSV import and direct Airtable migration. You can import your tables, fields, and records with one click.',
  },
  {
    q: 'What AI features are included?',
    a: 'Pro and above get AI-powered headline suggestions, content tagging, description generation, and editorial idea brainstorming. The AI learns from your team\'s patterns over time.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'ContentFlow is fully responsive and works great on mobile browsers. A dedicated iOS and Android app is on our roadmap for Q4 2026.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. No long-term contracts. Cancel your subscription anytime from your billing settings. You\'ll keep access until the end of your billing period.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[var(--surface)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-[var(--fg-weak)]">
            Can&apos;t find what you&apos;re looking for?{' '}
            <a href="#contact" className="font-medium text-[var(--primary)] hover:underline">
              Contact our team
            </a>
            .
          </p>
        </div>

        <div className="mt-12 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface)]"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                {faq.q}
                <svg
                  className={`h-4 w-4 shrink-0 text-[var(--fg-muted)] transition-transform ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4 text-sm leading-relaxed text-[var(--fg-weak)]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
