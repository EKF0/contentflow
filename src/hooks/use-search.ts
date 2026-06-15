'use client';

import { useState, useEffect, useMemo } from 'react';
import { ASSIGNEES } from '@/types';
import type { ContentRecord, Status, ContentType } from '@/types';

export interface FilterState {
  status: Status[];
  type: ContentType[];
  assignee: number[];
  dateRange: { start: string; end: string } | null;
  featured: boolean | null;
}

export interface SortState {
  field: keyof ContentRecord | null;
  direction: 'asc' | 'desc';
}

export interface GroupState {
  field: keyof ContentRecord | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function useSearch(
  records: ContentRecord[],
  searchQuery: string,
  filters: FilterState,
  sort: SortState,
  group: GroupState,
) {
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredRecords = useMemo(() => {
    let result = records;

    // Apply search
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.status.toLowerCase().includes(query) ||
          r.type.toLowerCase().includes(query) ||
          ASSIGNEES[r.assignee].name.toLowerCase().includes(query) ||
          r.notes.toLowerCase().includes(query),
      );
    }

    // Apply filters
    if (filters.status.length > 0) {
      result = result.filter((r) => filters.status.includes(r.status as Status));
    }
    if (filters.type.length > 0) {
      result = result.filter((r) => filters.type.includes(r.type as ContentType));
    }
    if (filters.assignee.length > 0) {
      result = result.filter((r) => filters.assignee.includes(r.assignee));
    }
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        result = result.filter((r) => r.date >= filters.dateRange!.start);
      }
      if (filters.dateRange.end) {
        result = result.filter((r) => r.date <= filters.dateRange!.end);
      }
    }
    if (filters.featured !== null) {
      result = result.filter((r) => r.featured === filters.featured);
    }

    // Apply sort
    if (sort.field) {
      result = [...result].sort((a, b) => {
        const aVal = a[sort.field!];
        const bVal = b[sort.field!];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
        }

        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [records, debouncedSearch, filters, sort]);

  // Group records
  const groupedRecords = useMemo(() => {
    if (!group.field) {
      return [{ key: 'All', records: filteredRecords, color: 'var(--primary)' }];
    }

    const groups = new Map<string, ContentRecord[]>();
    const colorMap: Record<string, string> = {
      Idea: 'var(--fg-muted)',
      Drafting: 'var(--primary)',
      'In Review': 'var(--accent)',
      Published: 'var(--success)',
      Archived: 'var(--fg-muted)',
      Blog: 'var(--primary)',
      Newsletter: 'var(--purple)',
      Social: 'var(--pink)',
      Video: 'var(--danger)',
      Podcast: 'var(--orange)',
    };

    filteredRecords.forEach((r) => {
      const value = String(r[group.field!]);
      if (!groups.has(value)) {
        groups.set(value, []);
      }
      groups.get(value)!.push(r);
    });

    const sortedEntries = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return sortedEntries.map(([key, records]) => ({
      key,
      records,
      color: colorMap[key] || 'var(--primary)',
    }));
  }, [filteredRecords, group.field]);

  return {
    filteredRecords,
    groupedRecords,
    debouncedSearch,
  };
}

export { useSearch, useDebounce };