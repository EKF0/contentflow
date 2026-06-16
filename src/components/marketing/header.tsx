'use client';

import Link from 'next/link';
import { useState } from 'react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#docs', label: 'Docs' },
  { href: '#blog', label: 'Blog' },
];

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-[var(--fg)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-sm font-bold text-white">
            CF
          </span>
          ContentFlow
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--fg-weak)] transition-colors hover:text-[var(--fg)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-[var(--fg-weak)] transition-colors hover:text-[var(--fg)]"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
          >
            Start Free Trial
          </Link>
        </div>

        <button
          className="flex items-center justify-center md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6 text-[var(--fg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--bg)] px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--fg-weak)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
            <Link
              href="/sign-in"
              className="rounded-[var(--radius-md)] px-3 py-2 text-center text-sm font-medium text-[var(--fg-weak)]"
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setMobileOpen(false)}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
