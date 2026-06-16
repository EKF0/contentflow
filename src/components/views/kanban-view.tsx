'use client';

import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { StatusBadge, TypeTag } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ASSIGNEES, STATUSES } from '@/types';
import type { ContentRecord, Status, ContentType } from '@/types';

const statusDotColors: { [K in Status]: string } = {
  Idea: 'bg-[var(--status-idea)]',
  Drafting: 'bg-[var(--status-drafting)]',
  'In Review': 'bg-[var(--status-review)]',
  Published: 'bg-[var(--status-published)]',
  Archived: 'bg-[var(--status-archived)]',
};

const CHUNK_SIZE = 50;

interface KanbanViewProps {
  records: ContentRecord[];
  onRecordClick?: (record: ContentRecord) => void;
}

function KanbanView({ records, onRecordClick }: KanbanViewProps) {
  const [loadedCounts, setLoadedCounts] = useState<Record<string, number>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const loadingRefs = useRef<Record<string, IntersectionObserver | null>>({});

  const cardsByStatus = useMemo(() => {
    const grouped: Record<string, ContentRecord[]> = {};
    STATUSES.forEach(s => { grouped[s] = []; });
    records.forEach(r => {
      if (grouped[r.status]) {
        grouped[r.status].push(r);
      }
    });
    return grouped;
  }, [records]);

  const getVisibleCards = useCallback((status: string) => {
    const allCards = cardsByStatus[status] || [];
    const count = loadedCounts[status] || CHUNK_SIZE;
    return allCards.slice(0, count);
  }, [cardsByStatus, loadedCounts]);

  const loadMore = useCallback((status: string) => {
    setLoadedCounts(prev => {
      const current = prev[status] || CHUNK_SIZE;
      const allCards = cardsByStatus[status] || [];
      if (current >= allCards.length) return prev;
      return { ...prev, [status]: current + CHUNK_SIZE };
    });
  }, [cardsByStatus]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    STATUSES.forEach(status => {
      const sentinel = document.getElementById(`sentinel-${status}`);
      if (!sentinel) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMore(status);
          }
        },
        { threshold: 0.1, rootMargin: '100px' },
      );

      observer.observe(sentinel);
      observers.push(observer);
      loadingRefs.current[status] = observer;
    });

    return () => {
      observers.forEach(o => o.disconnect());
    };
  }, [loadMore, records]);

  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    STATUSES.forEach(s => {
      initialCounts[s] = CHUNK_SIZE;
    });
    setLoadedCounts(initialCounts);
  }, []);

  const formatDateShort = useCallback((d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--fg-muted)] text-[13px]">
        No records found.
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-3 px-5 py-4 overflow-x-auto">
      {STATUSES.map((status) => {
        const allCards = cardsByStatus[status] || [];
        const visibleCards = getVisibleCards(status);
        const hasMore = visibleCards.length < allCards.length;

        return (
          <div
            key={status}
            className="kanban-column min-w-[280px] w-[280px] flex-shrink-0 flex flex-col bg-[var(--surface)] rounded-[var(--radius-lg)] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3.5 py-3 text-[13px] font-semibold tracking-[0.01em]">
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${statusDotColors[status]}`} aria-hidden="true" />
              {status}
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-[10px] bg-[var(--border-light)] text-[11px] font-medium text-[var(--fg-weak)] px-1.5" aria-label={`${allCards.length} cards`}>
                {allCards.length}
              </span>
              <span className="flex-1" />
              <button
                className="w-[22px] h-[22px] flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--fg-muted)] transition-all hover:bg-[var(--border-light)] hover:text-[var(--fg)]"
                aria-label={`Add card to ${status}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <div
              ref={(el) => { scrollRefs.current[status] = el; }}
              className="flex-1 overflow-y-auto px-2 pb-3 flex flex-col gap-1.5"
              role="list"
              aria-label={`${status} cards`}
            >
              {visibleCards.map(r => {
                const a = ASSIGNEES[r.assignee];
                return (
                  <div
                    key={r.id}
                    className="kanban-card bg-[var(--bg)] rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-sm)] cursor-pointer transition-all duration-150 border border-[var(--border-light)] hover:shadow-[var(--shadow-md)] hover:-translate-y-px"
                    onClick={() => onRecordClick?.(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRecordClick?.(r);
                      }
                    }}
                    tabIndex={0}
                    role="listitem"
                    aria-label={`${r.title}, ${r.type}, ${r.status}${r.featured ? ', Featured' : ''}`}
                  >
                    <div className="text-[13px] font-[450] leading-relaxed mb-2 text-[var(--fg)]">
                      {r.title}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <TypeTag type={r.type as ContentType} />
                      {r.featured && (
                        <span
                          className="inline-flex px-[7px] py-px rounded-[var(--radius-sm)] text-[11px] font-medium tracking-[0.02em]"
                          style={{
                            background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                            color: 'var(--accent)',
                          }}
                          aria-label="Featured"
                        >
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDateShort(r.date)}
                      </span>

                      {r.words > 0 && (
                        <span className="text-[11px] text-[var(--fg-muted)]">
                          {r.words.toLocaleString()}w
                        </span>
                      )}

                      <Avatar initials={a.initials} color={a.color} name={a.name} size="sm" className="!h-6 !w-6 !text-[10px]" />
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div id={`sentinel-${status}`} className="flex items-center justify-center py-2">
                  <div className="flex items-center gap-2 text-[12px] text-[var(--fg-muted)]">
                    <div className="h-4 w-4 border-2 border-[var(--fg-muted)] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span>Loading more...</span>
                  </div>
                </div>
              )}

              {!hasMore && allCards.length > CHUNK_SIZE && (
                <div className="text-center py-2 text-[11px] text-[var(--fg-muted)]">
                  All {allCards.length} cards loaded
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { KanbanView };
