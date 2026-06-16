'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ContentRecord } from '@/types';

interface GroupHeaderProps {
  groupName: string;
  count: number;
  color: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function GroupHeader({ groupName, count, color, children, defaultExpanded = true }: GroupHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <div className="group-section">
      <button
        onClick={toggleExpand}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-colors',
          'sticky top-0 z-10',
        )}
        aria-expanded={isExpanded}
        aria-label={`${groupName} group, ${count} records`}
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 8%, var(--bg))`,
        }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-[13px] font-medium text-[var(--fg)]">{groupName}</span>
        <span className="text-[12px] text-[var(--fg-muted)]">{count} records</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            'h-4 w-4 text-[var(--fg-muted)] ml-auto transition-transform',
            isExpanded && 'rotate-180',
          )}
          aria-hidden="true"
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>
      {isExpanded && (
        <div className="group-records">
          {children}
        </div>
      )}
    </div>
  );
}

interface GroupedGridViewProps {
  groups: Array<{ key: string; records: ContentRecord[]; color: string }>;
  renderRecords: (records: ContentRecord[]) => React.ReactNode;
}

function GroupedGridView({ groups, renderRecords }: GroupedGridViewProps) {
  return (
    <div className="grouped-grid">
      {groups.map((group) => (
        <GroupHeader
          key={group.key}
          groupName={group.key}
          count={group.records.length}
          color={group.color}
        >
          {renderRecords(group.records)}
        </GroupHeader>
      ))}
    </div>
  );
}

export { GroupHeader, GroupedGridView };