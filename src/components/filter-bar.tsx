'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { ASSIGNEES, STATUSES, TYPES } from '@/types';
import type { FilterState } from '@/hooks/use-search';
import type { Status, ContentType } from '@/types';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

function FilterBar({ filters, onFiltersChange, className }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeFilterCount = [
    filters.status.length > 0,
    filters.type.length > 0,
    filters.assignee.length > 0,
    filters.dateRange !== null,
    filters.featured !== null,
  ].filter(Boolean).length;

  const handleStatusChange = useCallback(
    (status: Status, checked: boolean) => {
      const newStatuses = checked
        ? [...filters.status, status]
        : filters.status.filter((s) => s !== status);
      onFiltersChange({ ...filters, status: newStatuses });
    },
    [filters, onFiltersChange],
  );

  const handleTypeChange = useCallback(
    (type: ContentType, checked: boolean) => {
      const newTypes = checked
        ? [...filters.type, type]
        : filters.type.filter((t) => t !== type);
      onFiltersChange({ ...filters, type: newTypes });
    },
    [filters, onFiltersChange],
  );

  const handleAssigneeChange = useCallback(
    (assignee: number, checked: boolean) => {
      const newAssignees = checked
        ? [...filters.assignee, assignee]
        : filters.assignee.filter((a) => a !== assignee);
      onFiltersChange({ ...filters, assignee: newAssignees });
    },
    [filters, onFiltersChange],
  );

  const handleDateRangeChange = useCallback(
    (field: 'start' | 'end', value: string) => {
      const newDateRange = filters.dateRange || { start: '', end: '' };
      newDateRange[field] = value;
      onFiltersChange({
        ...filters,
        dateRange: newDateRange.start || newDateRange.end ? newDateRange : null,
      });
    },
    [filters, onFiltersChange],
  );

  const handleFeaturedChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({ ...filters, featured: checked ? true : null });
    },
    [filters, onFiltersChange],
  );

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      status: [],
      type: [],
      assignee: [],
      dateRange: null,
      featured: null,
    });
  }, [onFiltersChange]);

  return (
    <div
      className={cn(
        'border-b border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-200',
        isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0',
        className,
      )}
    >
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-[var(--primary)] text-white text-[11px] font-medium px-1.5">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[12px] text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                aria-label="Clear all filters"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
              aria-expanded={isExpanded}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <h4 className="text-[12px] font-medium text-[var(--fg-weak)] mb-2">Status</h4>
            <div className="flex flex-col gap-1.5">
              {STATUSES.map((status) => (
                <Checkbox
                  key={status}
                  label={status}
                  checked={filters.status.includes(status)}
                  onChange={(e) => handleStatusChange(status, e.target.checked)}
                />
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <h4 className="text-[12px] font-medium text-[var(--fg-weak)] mb-2">Type</h4>
            <div className="flex flex-col gap-1.5">
              {TYPES.map((type) => (
                <Checkbox
                  key={type}
                  label={type}
                  checked={filters.type.includes(type)}
                  onChange={(e) => handleTypeChange(type, e.target.checked)}
                />
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          <div>
            <h4 className="text-[12px] font-medium text-[var(--fg-weak)] mb-2">Assignee</h4>
            <div className="flex flex-col gap-1.5">
              {ASSIGNEES.map((assignee, index) => (
                <Checkbox
                  key={index}
                  label={assignee.name}
                  checked={filters.assignee.includes(index)}
                  onChange={(e) => handleAssigneeChange(index, e.target.checked)}
                />
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h4 className="text-[12px] font-medium text-[var(--fg-weak)] mb-2">Date Range</h4>
            <div className="flex flex-col gap-2">
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                aria-label="Start date"
                className="w-full border border-[var(--border)] rounded-[var(--radius-sm)] px-2 py-1 text-[12px] text-[var(--fg)] bg-[var(--bg)]"
              />
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                aria-label="End date"
                className="w-full border border-[var(--border)] rounded-[var(--radius-sm)] px-2 py-1 text-[12px] text-[var(--fg)] bg-[var(--bg)]"
              />
            </div>
          </div>

          {/* Featured Filter */}
          <div>
            <h4 className="text-[12px] font-medium text-[var(--fg-weak)] mb-2">Featured</h4>
            <Checkbox
              label="Featured only"
              checked={filters.featured === true}
              onChange={(e) => handleFeaturedChange(e.target.checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { FilterBar };