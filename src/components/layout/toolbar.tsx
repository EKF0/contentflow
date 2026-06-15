'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { FIELDS } from '@/types';
import type { ViewType } from './app-shell';
import type { ContentRecord } from '@/types';
import type { SortState, GroupState } from '@/hooks/use-search';
import type { SavedView } from '@/hooks/use-views';
import { ExportMenu } from '@/components/export-menu';
import { ViewSwitcher } from '@/components/view-switcher';

interface ToolbarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filterVisible: boolean;
  onFilterToggle: () => void;
  activeFilterCount: number;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  group: GroupState;
  onGroupChange: (group: GroupState) => void;
  onImportClick?: () => void;
  records?: ContentRecord[];
  filteredRecords?: ContentRecord[];
  views?: SavedView[];
  activeViewId?: string | null;
  activeViewName?: string | null;
  onLoadView?: (id: string) => void;
  onSaveView?: () => void;
  onDeleteView?: (id: string) => void;
  onRenameView?: (id: string, name: string) => void;
  onResetView?: () => void;
  className?: string;
}

function Toolbar({
  activeView,
  onViewChange,
  searchQuery = '',
  onSearchChange,
  filterVisible,
  onFilterToggle,
  activeFilterCount,
  sort,
  onSortChange,
  group,
  onGroupChange,
  onImportClick,
  records = [],
  filteredRecords = [],
  views = [],
  activeViewId = null,
  activeViewName = null,
  onLoadView,
  onSaveView,
  onDeleteView,
  onRenameView,
  onResetView,
  className,
}: ToolbarProps) {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
      if (groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) {
        setGroupMenuOpen(false);
      }
    };

    if (sortMenuOpen || groupMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortMenuOpen, groupMenuOpen]);

  const handleSortSelect = useCallback(
    (field: string | null) => {
      if (field === null) {
        onSortChange({ field: null, direction: 'asc' });
      } else if (sort.field === field) {
        onSortChange({
          field: sort.field,
          direction: sort.direction === 'asc' ? 'desc' : 'asc',
        });
      } else {
        onSortChange({ field: field as keyof import('@/types').ContentRecord, direction: 'asc' });
      }
      setSortMenuOpen(false);
    },
    [sort, onSortChange],
  );

  const handleGroupSelect = useCallback(
    (field: string | null) => {
      onGroupChange({ field: field as keyof import('@/types').ContentRecord | null });
      setGroupMenuOpen(false);
    },
    [onGroupChange],
  );

  return (
    <div className="flex flex-col flex-shrink-0">
      <div
        className={cn(
          'flex items-center gap-0.5 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-1.5',
          className,
        )}
      >
        {/* View switcher */}
        <ViewSwitcher
          views={views}
          activeViewId={activeViewId}
          activeViewName={activeViewName}
          onLoadView={onLoadView ?? (() => {})}
          onSaveView={onSaveView ?? (() => {})}
          onDeleteView={onDeleteView ?? (() => {})}
          onRenameView={onRenameView ?? (() => {})}
          onResetView={onResetView ?? (() => {})}
        />

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-[var(--border)]" />

        {/* View tabs */}
        <div className="flex gap-0.5 mr-3" role="tablist" aria-label="View selector">
          <ViewTab
            active={activeView === 'grid'}
            onClick={() => onViewChange('grid')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            }
            label="Grid"
          />
          <ViewTab
            active={activeView === 'kanban'}
            onClick={() => onViewChange('kanban')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="12" rx="1" />
                <rect x="17" y="3" width="5" height="15" rx="1" />
              </svg>
            }
            label="Kanban"
          />
          <ViewTab
            active={activeView === 'calendar'}
            onClick={() => onViewChange('calendar')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            label="Calendar"
          />
        </div>

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-[var(--border)]" />

        {/* Filter button with badge */}
        <div className="relative">
          <ToolbarButton
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
              </svg>
            }
            label="Filter"
            onClick={onFilterToggle}
            active={filterVisible}
            badge={activeFilterCount > 0 ? activeFilterCount : undefined}
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative" ref={sortMenuRef}>
          <ToolbarButton
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19,12 12,19 5,12" />
              </svg>
            }
            label="Sort"
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
            active={sort.field !== null}
          />
          {sortMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-50 min-w-[180px] py-1">
              <div className="px-3 py-1.5 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                Sort by
              </div>
              <button
                onClick={() => handleSortSelect(null)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)]',
                  sort.field === null && 'text-[var(--primary)] font-medium',
                )}
              >
                None
              </button>
              {FIELDS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleSortSelect(f.key)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)] flex items-center justify-between',
                    sort.field === f.key && 'text-[var(--primary)] font-medium',
                  )}
                >
                  <span>{f.label}</span>
                  {sort.field === f.key && (
                    <span className="text-[var(--fg-muted)]">{sort.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Group dropdown */}
        <div className="relative" ref={groupMenuRef}>
          <ToolbarButton
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            }
            label="Group"
            onClick={() => setGroupMenuOpen(!groupMenuOpen)}
            active={group.field !== null}
          />
          {groupMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-50 min-w-[180px] py-1">
              <div className="px-3 py-1.5 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                Group by
              </div>
              <button
                onClick={() => handleGroupSelect(null)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)]',
                  group.field === null && 'text-[var(--primary)] font-medium',
                )}
              >
                None
              </button>
              {FIELDS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleGroupSelect(f.key)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)]',
                    group.field === f.key && 'text-[var(--primary)] font-medium',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Import button */}
        <ToolbarButton
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          }
          label="Import"
          onClick={onImportClick}
        />

        {/* Export menu */}
        <ExportMenu records={records} filteredRecords={filteredRecords} />

        {/* Search */}
        <div className="ml-1 flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-shrink-0 text-[var(--fg-muted)]">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search records..."
            aria-label="Search records"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full border-none bg-transparent text-[13px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-muted)] py-0.5"
          />
        </div>
      </div>
    </div>
  );
}

interface ViewTabProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function ViewTab({ active, onClick, icon, label }: ViewTabProps) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] tracking-[0.01em] transition-all',
        active
          ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium'
          : 'text-[var(--fg-weak)] hover:bg-[var(--surface)] hover:text-[var(--fg)] font-normal',
      )}
    >
      <span className="[&>svg]:h-[15px] [&>svg]:w-[15px]">{icon}</span>
      {label}
    </button>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}

function ToolbarButton({ icon, label, onClick, active = false, badge }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-[5px] rounded-[var(--radius-sm)] px-2.5 py-[5px] text-[13px] transition-all relative',
        active
          ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium'
          : 'text-[var(--fg-weak)] hover:bg-[var(--surface)] hover:text-[var(--fg)]',
      )}
    >
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {label}
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-[var(--primary)] text-white text-[10px] font-medium flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </button>
  );
}

export { Toolbar };
