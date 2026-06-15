'use client';

import { cn } from '@/lib/utils';
import { ASSIGNEES } from '@/types';
import { AvatarStack } from '@/components/ui/avatar';

function TopBar({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        'flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-2 flex-shrink-0 min-h-[48px]',
        className,
      )}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[13px] text-[var(--fg-weak)]">
        <span>ContentFlow</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <polyline points="9,18 15,12 9,6" />
        </svg>
        <strong className="font-semibold text-[var(--fg)]">Editorial Planner</strong>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <AvatarStack members={ASSIGNEES} />
        <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--primary)] px-3.5 py-[5px] text-[13px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[var(--primary-hover)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>
      </div>
    </header>
  );
}

export { TopBar };
