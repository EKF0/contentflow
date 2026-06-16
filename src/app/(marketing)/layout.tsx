import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'ContentFlow — Editorial Content Planner for Teams',
  description:
    'Plan, collaborate, and publish content across every channel. Grid views, Kanban boards, and calendars — powered by AI suggestions your team will actually use.',
  openGraph: {
    title: 'ContentFlow — Editorial Content Planner for Teams',
    description:
      'Plan, collaborate, and publish content across every channel.',
    type: 'website',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-auto">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <MarketingHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
