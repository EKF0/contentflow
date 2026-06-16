import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--bg)] pb-16 pt-20 sm:pb-24 sm:pt-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--primary)]/[0.04] to-transparent" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            Now in public beta
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[var(--fg)] sm:text-5xl lg:text-6xl">
            The editorial content planner
            <br className="hidden sm:block" />
            {' '}for modern teams
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--fg-weak)]">
            Plan, collaborate, and publish content across every channel. Grid views, Kanban boards,
            and calendars — powered by AI suggestions your team will actually use.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-lg)]"
            >
              Start Free Trial
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--fg)] transition-all hover:bg-[var(--surface-hover)]"
            >
              <svg className="mr-2 h-4 w-4 text-[var(--fg-weak)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Demo
            </a>
          </div>

          <p className="mt-4 text-xs text-[var(--fg-muted)]">
            No credit card required. Free plan includes up to 3 users.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl">
          <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[var(--status-review)]" />
              <span className="h-3 w-3 rounded-full bg-[var(--status-published)]" />
              <span className="h-3 w-3 rounded-full bg-[var(--fg-muted)]" />
              <span className="ml-3 text-xs text-[var(--fg-muted)]">app.contentflow.io/dashboard</span>
            </div>
            <div className="grid grid-cols-12 gap-0">
              <div className="col-span-3 border-r border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="mb-2 h-6 w-24 rounded bg-[var(--primary)]/10" />
                <div className="space-y-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-5 rounded bg-[var(--border-light)]" />
                  ))}
                </div>
              </div>
              <div className="col-span-9 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-8 w-24 rounded bg-[var(--primary)]/10" />
                  <div className="h-8 w-8 rounded bg-[var(--surface-hover)]" />
                  <div className="h-8 w-8 rounded bg-[var(--surface-hover)]" />
                </div>
                <div className="space-y-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex h-8 items-center gap-2">
                      <div className="h-4 w-4 rounded-sm border border-[var(--border)]" />
                      <div className="h-4 flex-1 rounded bg-[var(--border-light)]" />
                      <div className="h-4 w-20 rounded bg-[var(--border-light)]" />
                      <div className="h-4 w-16 rounded bg-[var(--border-light)]" />
                      <div className="h-4 w-24 rounded bg-[var(--border-light)]" />
                      <div className="h-4 w-16 rounded bg-[var(--border-light)]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
