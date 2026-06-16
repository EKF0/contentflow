import Link from 'next/link';

export function CTASection() {
  return (
    <section className="bg-[var(--bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
          Ready to transform your content workflow?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--fg-weak)]">
          Join hundreds of teams planning and publishing with ContentFlow. Start your free trial today.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--primary)] px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-lg)]"
          >
            Get Started Free
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#contact"
            className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--border)] px-8 py-3.5 text-sm font-semibold text-[var(--fg)] transition-all hover:bg-[var(--surface)]"
          >
            Talk to Sales
          </a>
        </div>
      </div>
    </section>
  );
}
