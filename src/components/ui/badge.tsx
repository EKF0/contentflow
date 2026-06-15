'use client';

import { cn } from '@/lib/utils';
import type { Status, ContentType } from '@/types';

const statusStyles: Record<Status, string> = {
  Idea: 'bg-[var(--status-idea-bg)] text-[var(--status-idea)]',
  Drafting: 'bg-[var(--status-drafting-bg)] text-[var(--status-drafting)]',
  'In Review': 'bg-[var(--status-review-bg)] text-[var(--status-review)]',
  Published: 'bg-[var(--status-published-bg)] text-[var(--status-published)]',
  Archived: 'bg-[var(--status-archived-bg)] text-[var(--status-archived)]',
};

const typeStyles: Record<ContentType, string> = {
  Blog: 'bg-[var(--type-blog-bg)] text-[var(--type-blog)]',
  Newsletter: 'bg-[var(--type-newsletter-bg)] text-[var(--type-newsletter)]',
  Social: 'bg-[var(--type-social-bg)] text-[var(--type-social)]',
  Video: 'bg-[var(--type-video-bg)] text-[var(--type-video)]',
  Podcast: 'bg-[var(--type-podcast-bg)] text-[var(--type-podcast)]',
};

const statusDotColors: Record<Status, string> = {
  Idea: 'bg-[var(--status-idea)]',
  Drafting: 'bg-[var(--status-drafting)]',
  'In Review': 'bg-[var(--status-review)]',
  Published: 'bg-[var(--status-published)]',
  Archived: 'bg-[var(--status-archived)]',
};

interface StatusBadgeProps {
  status: Status;
  showDot?: boolean;
  className?: string;
}

function StatusBadge({ status, showDot = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-[0.01em]',
        statusStyles[status],
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            'h-2 w-2 rounded-full flex-shrink-0',
            statusDotColors[status],
          )}
        />
      )}
      {status}
    </span>
  );
}

interface TypeTagProps {
  type: ContentType;
  className?: string;
}

function TypeTag({ type, className }: TypeTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-[11px] font-medium tracking-[0.02em]',
        typeStyles[type],
        className,
      )}
    >
      {type}
    </span>
  );
}

export { StatusBadge, TypeTag, statusDotColors };
