import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch, useDebounce } from '@/hooks/use-search';
import type { ContentRecord } from '@/types';

const SAMPLE_RECORDS: ContentRecord[] = [
  {
    id: 1,
    title: 'Getting Started with React',
    status: 'Published',
    type: 'Blog',
    assignee: 0,
    date: '2024-06-15',
    words: 2500,
    featured: true,
    notes: 'Comprehensive intro guide',
  },
  {
    id: 2,
    title: 'Q2 Newsletter',
    status: 'Drafting',
    type: 'Newsletter',
    assignee: 1,
    date: '2024-07-01',
    words: 1200,
    featured: false,
    notes: 'Quarterly recap',
  },
  {
    id: 3,
    title: 'Product Demo Video',
    status: 'In Review',
    type: 'Video',
    assignee: 2,
    date: '2024-07-10',
    words: 800,
    featured: false,
    notes: '',
  },
  {
    id: 4,
    title: 'Social Media Campaign',
    status: 'Published',
    type: 'Social',
    assignee: 0,
    date: '2024-06-20',
    words: 500,
    featured: true,
    notes: 'Summer campaign',
  },
  {
    id: 5,
    title: 'Tech Talk Podcast',
    status: 'Idea',
    type: 'Podcast',
    assignee: 3,
    date: '2024-08-01',
    words: 0,
    featured: false,
    notes: '',
  },
];

const EMPTY_FILTERS = {
  status: [],
  type: [],
  assignee: [],
  dateRange: null,
  featured: null,
};

const EMPTY_SORT = { field: null as keyof ContentRecord | null, direction: 'asc' as const };
const EMPTY_GROUP = { field: null as keyof ContentRecord | null };

// ─── useDebounce ─────────────────────────────────────────────

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('b');
  });

  it('cancels pending update on new input', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(300));

    expect(result.current).toBe('c');
  });
});

// ─── useSearch: search ───────────────────────────────────────

describe('useSearch search', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns all records when search is empty', () => {
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, EMPTY_SORT, EMPTY_GROUP),
    );
    expect(result.current.filteredRecords).toHaveLength(SAMPLE_RECORDS.length);
  });

  it('filters by title', () => {
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, 'React', EMPTY_FILTERS, EMPTY_SORT, EMPTY_GROUP),
    );
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.filteredRecords).toHaveLength(1);
    expect(result.current.filteredRecords[0].title).toBe('Getting Started with React');
  });

  it('filters by status', () => {
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, 'Published', EMPTY_FILTERS, EMPTY_SORT, EMPTY_GROUP),
    );
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.filteredRecords).toHaveLength(2);
  });

  it('filters by notes', () => {
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, 'quarterly', EMPTY_FILTERS, EMPTY_SORT, EMPTY_GROUP),
    );
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.filteredRecords).toHaveLength(1);
    expect(result.current.filteredRecords[0].title).toBe('Q2 Newsletter');
  });

  it('is case-insensitive', () => {
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, 'REACT', EMPTY_FILTERS, EMPTY_SORT, EMPTY_GROUP),
    );
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.filteredRecords).toHaveLength(1);
  });

  it('debounces search input', () => {
    const { result, rerender } = renderHook(
      ({ query }) => useSearch(SAMPLE_RECORDS, query, EMPTY_FILTERS, EMPTY_SORT, EMPTY_GROUP),
      { initialProps: { query: '' } },
    );

    rerender({ query: 'React' });
    expect(result.current.filteredRecords).toHaveLength(SAMPLE_RECORDS.length);

    act(() => vi.advanceTimersByTime(300));
    expect(result.current.filteredRecords).toHaveLength(1);
  });
});

// ─── useSearch: filters ──────────────────────────────────────

describe('useSearch filters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filters by status array', () => {
    const filters = { ...EMPTY_FILTERS, status: ['Published' as const] };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', filters, EMPTY_SORT, EMPTY_GROUP),
    );
    expect(result.current.filteredRecords).toHaveLength(2);
  });

  it('filters by type array', () => {
    const filters = { ...EMPTY_FILTERS, type: ['Blog' as const, 'Newsletter' as const] };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', filters, EMPTY_SORT, EMPTY_GROUP),
    );
    expect(result.current.filteredRecords).toHaveLength(2);
  });

  it('filters by assignee', () => {
    const filters = { ...EMPTY_FILTERS, assignee: [0] };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', filters, EMPTY_SORT, EMPTY_GROUP),
    );
    expect(result.current.filteredRecords).toHaveLength(2);
  });

  it('filters by date range', () => {
    const filters = {
      ...EMPTY_FILTERS,
      dateRange: { start: '2024-07-01', end: '2024-07-31' },
    };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', filters, EMPTY_SORT, EMPTY_GROUP),
    );
    expect(result.current.filteredRecords).toHaveLength(2);
  });

  it('filters by featured', () => {
    const filters = { ...EMPTY_FILTERS, featured: true };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', filters, EMPTY_SORT, EMPTY_GROUP),
    );
    expect(result.current.filteredRecords).toHaveLength(2);
  });

  it('combines multiple filters with AND logic', () => {
    const filters = {
      ...EMPTY_FILTERS,
      status: ['Published' as const],
      type: ['Blog' as const],
    };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', filters, EMPTY_SORT, EMPTY_GROUP),
    );
    expect(result.current.filteredRecords).toHaveLength(1);
    expect(result.current.filteredRecords[0].title).toBe('Getting Started with React');
  });

  it('combines search and filters', () => {
    const filters = { ...EMPTY_FILTERS, status: ['Published' as const] };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, 'Social', filters, EMPTY_SORT, EMPTY_GROUP),
    );
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.filteredRecords).toHaveLength(1);
    expect(result.current.filteredRecords[0].title).toBe('Social Media Campaign');
  });
});

// ─── useSearch: sort ─────────────────────────────────────────

describe('useSearch sort', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sorts by title ascending', () => {
    const sort = { field: 'title' as keyof ContentRecord, direction: 'asc' as const };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, sort, EMPTY_GROUP),
    );
    const titles = result.current.filteredRecords.map((r) => r.title);
    expect(titles).toEqual([...titles].sort());
  });

  it('sorts by title descending', () => {
    const sort = { field: 'title' as keyof ContentRecord, direction: 'desc' as const };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, sort, EMPTY_GROUP),
    );
    const titles = result.current.filteredRecords.map((r) => r.title);
    expect(titles).toEqual([...titles].sort().reverse());
  });

  it('sorts by words ascending', () => {
    const sort = { field: 'words' as keyof ContentRecord, direction: 'asc' as const };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, sort, EMPTY_GROUP),
    );
    const words = result.current.filteredRecords.map((r) => r.words);
    expect(words).toEqual([0, 500, 800, 1200, 2500]);
  });

  it('sorts by words descending', () => {
    const sort = { field: 'words' as keyof ContentRecord, direction: 'desc' as const };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, sort, EMPTY_GROUP),
    );
    const words = result.current.filteredRecords.map((r) => r.words);
    expect(words).toEqual([2500, 1200, 800, 500, 0]);
  });

  it('sorts by date', () => {
    const sort = { field: 'date' as keyof ContentRecord, direction: 'asc' as const };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, sort, EMPTY_GROUP),
    );
    const dates = result.current.filteredRecords.map((r) => r.date);
    expect(dates).toEqual([...dates].sort());
  });
});

// ─── useSearch: group ────────────────────────────────────────

describe('useSearch group', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns single group when no grouping', () => {
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, EMPTY_SORT, EMPTY_GROUP),
    );
    expect(result.current.groupedRecords).toHaveLength(1);
    expect(result.current.groupedRecords[0].key).toBe('All');
    expect(result.current.groupedRecords[0].records).toHaveLength(SAMPLE_RECORDS.length);
  });

  it('groups by status', () => {
    const group = { field: 'status' as keyof ContentRecord };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, EMPTY_SORT, group),
    );
    const keys = result.current.groupedRecords.map((g) => g.key);
    expect(keys).toContain('Published');
    expect(keys).toContain('Drafting');
    expect(keys).toContain('In Review');
    expect(keys).toContain('Idea');
  });

  it('groups by type', () => {
    const group = { field: 'type' as keyof ContentRecord };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, EMPTY_SORT, group),
    );
    const keys = result.current.groupedRecords.map((g) => g.key);
    expect(keys).toContain('Blog');
    expect(keys).toContain('Newsletter');
    expect(keys).toContain('Video');
    expect(keys).toContain('Social');
    expect(keys).toContain('Podcast');
  });

  it('sorts groups alphabetically', () => {
    const group = { field: 'status' as keyof ContentRecord };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, EMPTY_SORT, group),
    );
    const keys = result.current.groupedRecords.map((g) => g.key);
    expect(keys).toEqual([...keys].sort());
  });

  it('groups with correct record counts', () => {
    const group = { field: 'status' as keyof ContentRecord };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', EMPTY_FILTERS, EMPTY_SORT, group),
    );
    const published = result.current.groupedRecords.find((g) => g.key === 'Published');
    expect(published?.records).toHaveLength(2);
  });

  it('combines group with filters', () => {
    const group = { field: 'status' as keyof ContentRecord };
    const filters = { ...EMPTY_FILTERS, type: ['Blog' as const] };
    const { result } = renderHook(() =>
      useSearch(SAMPLE_RECORDS, '', filters, EMPTY_SORT, group),
    );
    const allGroupRecords = result.current.groupedRecords.flatMap((g) => g.records);
    expect(allGroupRecords).toHaveLength(1);
  });
});
