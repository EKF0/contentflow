'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { List, useListRef } from 'react-window';
import { cn } from '@/lib/utils';
import { StatusBadge, TypeTag } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { FieldIcon, type IconType } from '@/components/ui/field-icon';
import { GroupHeader } from '@/components/group-header';
import { ASSIGNEES, FIELDS, STATUSES, TYPES } from '@/types';
import type { ContentRecord, Status, ContentType } from '@/types';
import type { SortState, GroupState } from '@/hooks/use-search';

interface GridViewProps {
  records: ContentRecord[];
  groupedRecords?: Array<{ key: string; records: ContentRecord[]; color: string }>;
  searchQuery?: string;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  onRecordClick?: (record: ContentRecord) => void;
  onRecordUpdate?: (id: number, field: string, value: unknown) => void;
}

const ROW_HEIGHT = 36;

function GridView({
  records,
  groupedRecords,
  searchQuery,
  sort,
  onSortChange,
  onRecordClick,
  onRecordUpdate,
}: GridViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: number; key: string } | null>(null);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  }, [records, selectedIds.size]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startEdit = useCallback((id: number, key: string) => {
    setEditingCell({ id, key });
  }, []);

  const commitEdit = useCallback((id: number, key: string, value: string) => {
    setEditingCell(null);
    onRecordUpdate?.(id, key, value);
  }, [onRecordUpdate]);

  const formatDate = useCallback((d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const handleSort = useCallback(
    (field: keyof ContentRecord) => {
      if (!onSortChange || !sort) return;
      if (sort.field === field) {
        if (sort.direction === 'asc') {
          onSortChange({ field, direction: 'desc' });
        } else {
          onSortChange({ field: null, direction: 'asc' });
        }
      } else {
        onSortChange({ field, direction: 'asc' });
      }
    },
    [sort, onSortChange],
  );

  const allSelected = records.length > 0 && selectedIds.size === records.length;

  const headerRow = useMemo(
    () => (
      <thead>
        <tr>
          <th className="col-rownum sticky top-0 z-5 bg-[var(--surface)] border-b border-[var(--border)] border-r border-r-[var(--border-light)] flex items-center justify-center text-center text-[11px] text-[var(--fg-muted)]" style={{ width: 52 }} scope="col">
            #
          </th>
          <th className="col-checkbox sticky top-0 z-5 bg-[var(--surface)] border-b border-[var(--border)] border-r border-r-[var(--border-light)] flex items-center justify-center" style={{ width: 40 }} scope="col">
            <input type="checkbox" className="cell-checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all rows" />
          </th>
          {FIELDS.map((f) => (
            <th
              key={f.key}
              className={cn('sticky top-0 z-5 bg-[var(--surface)] border-b border-[var(--border)] border-r border-r-[var(--border-light)] flex items-center gap-1.5 px-3 h-[34px] text-[12px] font-medium text-[var(--fg-weak)] tracking-[0.02em] whitespace-nowrap overflow-hidden text-ellipsis select-none last:border-r-0 cursor-pointer hover:bg-[var(--surface-hover)]', sort?.field === f.key && 'text-[var(--primary)]')}
              style={{ width: f.width }}
              onClick={() => handleSort(f.key)}
              scope="col"
              aria-sort={sort?.field === f.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <FieldIcon type={f.icon as IconType} />
              {f.label}
              {sort?.field === f.key && <span className="ml-1 text-[var(--primary)]" aria-hidden="true">{sort.direction === 'asc' ? '↑' : '↓'}</span>}
            </th>
          ))}
        </tr>
      </thead>
    ),
    [allSelected, toggleSelectAll, sort, handleSort],
  );

  const GridRow = useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const r = records[index];
      if (!r) return null;
      const a = ASSIGNEES[r.assignee];
      return (
        <div style={style} className="contents">
          <tr
            key={r.id}
            data-record-id={r.id}
            className="hover:[&>td]:bg-[var(--surface-hover)] group"
            onClick={() => onRecordClick?.(r)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRecordClick?.(r);
              }
            }}
          >
            <td className="col-rownum text-center text-[var(--fg-muted)] text-[12px] bg-[var(--surface)] cursor-pointer w-[52px] group-hover:bg-[var(--border-light)]">{index + 1}</td>
            <td className="col-checkbox text-center w-[40px]" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" className="cell-checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} aria-label={`Select row ${index + 1}: ${r.title}`} />
            </td>

            <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'title' && 'p-0 overflow-visible')}>
              {editingCell?.id === r.id && editingCell.key === 'title' ? (
                <input type="text" defaultValue={r.title} autoFocus className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-2.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" aria-label={`Edit title for row ${index + 1}`} onBlur={(e) => commitEdit(r.id, 'title', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(r.id, 'title', (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingCell(null); }} />
              ) : (
                <span className="cell-title font-[450] text-[var(--fg)] cursor-pointer hover:text-[var(--primary)] hover:underline" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'title'); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(r.id, 'title'); } }} tabIndex={0} role="button" aria-label={`Edit title: ${r.title}`}>{r.title}</span>
              )}
            </td>

            <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'status' && 'p-0 overflow-visible')}>
              {editingCell?.id === r.id && editingCell.key === 'status' ? (
                <select autoFocus defaultValue={r.status} className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" aria-label={`Edit status for row ${index + 1}`} onBlur={(e) => commitEdit(r.id, 'status', e.target.value)} onChange={(e) => commitEdit(r.id, 'status', e.target.value)}>
                  {STATUSES.map(s => (<option key={s} value={s}>{s}</option>))}
                </select>
              ) : (
                <span className="cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'status'); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(r.id, 'status'); } }} tabIndex={0} role="button" aria-label={`Edit status: ${r.status}`}><StatusBadge status={r.status as Status} /></span>
              )}
            </td>

            <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'type' && 'p-0 overflow-visible')}>
              {editingCell?.id === r.id && editingCell.key === 'type' ? (
                <select autoFocus defaultValue={r.type} className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" aria-label={`Edit type for row ${index + 1}`} onBlur={(e) => commitEdit(r.id, 'type', e.target.value)} onChange={(e) => commitEdit(r.id, 'type', e.target.value)}>
                  {TYPES.map(t => (<option key={t} value={t}>{t}</option>))}
                </select>
              ) : (
                <span className="cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'type'); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(r.id, 'type'); } }} tabIndex={0} role="button" aria-label={`Edit type: ${r.type}`}><TypeTag type={r.type as ContentType} /></span>
              )}
            </td>

            <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'assignee' && 'p-0 overflow-visible')}>
              {editingCell?.id === r.id && editingCell.key === 'assignee' ? (
                <select autoFocus defaultValue={r.assignee} className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" aria-label={`Edit assignee for row ${index + 1}`} onBlur={(e) => commitEdit(r.id, 'assignee', e.target.value)} onChange={(e) => commitEdit(r.id, 'assignee', e.target.value)}>
                  {ASSIGNEES.map((a, idx) => (<option key={idx} value={idx}>{a.name}</option>))}
                </select>
              ) : (
                <span className="cell-assignee flex items-center gap-1.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'assignee'); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(r.id, 'assignee'); } }} tabIndex={0} role="button" aria-label={`Edit assignee: ${a.name}`}>
                  <Avatar initials={a.initials} color={a.color} size="sm" />
                  <span className="text-[var(--fg-weak)]">{a.name}</span>
                </span>
              )}
            </td>

            <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'date' && 'p-0 overflow-visible')}>
              {editingCell?.id === r.id && editingCell.key === 'date' ? (
                <input type="date" defaultValue={r.date} autoFocus className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" aria-label={`Edit date for row ${index + 1}`} onBlur={(e) => commitEdit(r.id, 'date', e.target.value)} />
              ) : (
                <span className="cell-date text-[var(--fg-weak)] tabular-nums cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'date'); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(r.id, 'date'); } }} tabIndex={0} role="button" aria-label={`Edit date: ${formatDate(r.date)}`}>{formatDate(r.date)}</span>
              )}
            </td>

            <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'words' && 'p-0 overflow-visible')}>
              {editingCell?.id === r.id && editingCell.key === 'words' ? (
                <input type="number" defaultValue={r.words} autoFocus min={0} step={50} className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" aria-label={`Edit word count for row ${index + 1}`} onBlur={(e) => commitEdit(r.id, 'words', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(r.id, 'words', (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingCell(null); }} />
              ) : (
                <span className="cell-number text-[var(--fg)] tabular-nums text-right cursor-pointer block" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'words'); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(r.id, 'words'); } }} tabIndex={0} role="button" aria-label={`Edit word count: ${r.words > 0 ? r.words.toLocaleString() : 'empty'}`}>{r.words > 0 ? r.words.toLocaleString() : '—'}</span>
              )}
            </td>

            <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0')} onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" className="cell-checkbox" checked={r.featured} onChange={() => onRecordUpdate?.(r.id, 'featured', !r.featured)} aria-label={`Featured: ${r.title}`} />
            </td>

            <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'notes' && 'p-0 overflow-visible')}>
              {editingCell?.id === r.id && editingCell.key === 'notes' ? (
                <textarea defaultValue={r.notes} autoFocus className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-2.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)] resize-y" aria-label={`Edit notes for row ${index + 1}`} onBlur={(e) => commitEdit(r.id, 'notes', e.target.value)} />
              ) : (
                <span className="text-[var(--fg-weak)] cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'notes'); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(r.id, 'notes'); } }} tabIndex={0} role="button" aria-label={`Edit notes: ${r.notes.length > 40 ? r.notes.slice(0, 40) + '...' : r.notes}`}>{r.notes.length > 40 ? r.notes.slice(0, 40) + '...' : r.notes}</span>
              )}
            </td>
          </tr>
        </div>
      );
    },
    [records, selectedIds, editingCell, onRecordClick, toggleSelect, startEdit, commitEdit, formatDate, onRecordUpdate],
  );

  if (groupedRecords && groupedRecords.length > 1) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {groupedRecords.map((group) => (
            <GroupHeader key={group.key} groupName={group.key} count={group.records.length} color={group.color}>
              <table className="grid-table w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                {headerRow}
                <tbody>
                  {group.records.length === 0 ? (
                    <tr><td colSpan={FIELDS.length + 2} className="py-16 text-center text-[var(--fg-muted)] text-[13px]">No records found.</td></tr>
                  ) : (
                    group.records.map((r, i) => {
                      const a = ASSIGNEES[r.assignee];
                      return (
                        <tr key={r.id} data-record-id={r.id} className="hover:[&>td]:bg-[var(--surface-hover)] group" onClick={() => onRecordClick?.(r)}>
                          <td className="col-rownum text-center text-[var(--fg-muted)] text-[12px] bg-[var(--surface)] cursor-pointer w-[52px] group-hover:bg-[var(--border-light)]">{i + 1}</td>
                          <td className="col-checkbox text-center w-[40px]" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="cell-checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} aria-label={`Select row ${i + 1}`} />
                          </td>
                          <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'title' && 'p-0 overflow-visible')}>
                            {editingCell?.id === r.id && editingCell.key === 'title' ? (
                              <input type="text" defaultValue={r.title} autoFocus className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-2.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" onBlur={(e) => commitEdit(r.id, 'title', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(r.id, 'title', (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingCell(null); }} />
                            ) : (
                              <span className="cell-title font-[450] text-[var(--fg)] cursor-pointer hover:text-[var(--primary)] hover:underline" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'title'); }}>{r.title}</span>
                            )}
                          </td>
                          <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'status' && 'p-0 overflow-visible')}>
                            {editingCell?.id === r.id && editingCell.key === 'status' ? (
                              <select autoFocus defaultValue={r.status} className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" onBlur={(e) => commitEdit(r.id, 'status', e.target.value)} onChange={(e) => commitEdit(r.id, 'status', e.target.value)}>
                                {STATUSES.map(s => (<option key={s} value={s}>{s}</option>))}
                              </select>
                            ) : (
                              <span className="cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'status'); }}><StatusBadge status={r.status as Status} /></span>
                            )}
                          </td>
                          <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'type' && 'p-0 overflow-visible')}>
                            {editingCell?.id === r.id && editingCell.key === 'type' ? (
                              <select autoFocus defaultValue={r.type} className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" onBlur={(e) => commitEdit(r.id, 'type', e.target.value)} onChange={(e) => commitEdit(r.id, 'type', e.target.value)}>
                                {TYPES.map(t => (<option key={t} value={t}>{t}</option>))}
                              </select>
                            ) : (
                              <span className="cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'type'); }}><TypeTag type={r.type as ContentType} /></span>
                            )}
                          </td>
                          <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'assignee' && 'p-0 overflow-visible')}>
                            {editingCell?.id === r.id && editingCell.key === 'assignee' ? (
                              <select autoFocus defaultValue={r.assignee} className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" onBlur={(e) => commitEdit(r.id, 'assignee', e.target.value)} onChange={(e) => commitEdit(r.id, 'assignee', e.target.value)}>
                                {ASSIGNEES.map((a, idx) => (<option key={idx} value={idx}>{a.name}</option>))}
                              </select>
                            ) : (
                              <span className="cell-assignee flex items-center gap-1.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'assignee'); }}>
                                <Avatar initials={a.initials} color={a.color} size="sm" />
                                <span className="text-[var(--fg-weak)]">{a.name}</span>
                              </span>
                            )}
                          </td>
                          <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'date' && 'p-0 overflow-visible')}>
                            {editingCell?.id === r.id && editingCell.key === 'date' ? (
                              <input type="date" defaultValue={r.date} autoFocus className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" onBlur={(e) => commitEdit(r.id, 'date', e.target.value)} />
                            ) : (
                              <span className="cell-date text-[var(--fg-weak)] tabular-nums cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'date'); }}>{formatDate(r.date)}</span>
                            )}
                          </td>
                          <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'words' && 'p-0 overflow-visible')}>
                            {editingCell?.id === r.id && editingCell.key === 'words' ? (
                              <input type="number" defaultValue={r.words} autoFocus min={0} step={50} className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]" onBlur={(e) => commitEdit(r.id, 'words', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(r.id, 'words', (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingCell(null); }} />
                            ) : (
                              <span className="cell-number text-[var(--fg)] tabular-nums text-right cursor-pointer block" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'words'); }}>{r.words > 0 ? r.words.toLocaleString() : '—'}</span>
                            )}
                          </td>
                          <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0')} onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="cell-checkbox" checked={r.featured} onChange={() => onRecordUpdate?.(r.id, 'featured', !r.featured)} aria-label="Featured" />
                          </td>
                          <td className={cn('px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0', editingCell?.id === r.id && editingCell.key === 'notes' && 'p-0 overflow-visible')}>
                            {editingCell?.id === r.id && editingCell.key === 'notes' ? (
                              <textarea defaultValue={r.notes} autoFocus className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-2.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)] resize-y" onBlur={(e) => commitEdit(r.id, 'notes', e.target.value)} />
                            ) : (
                              <span className="text-[var(--fg-weak)] cursor-pointer" onClick={(e) => { e.stopPropagation(); startEdit(r.id, 'notes'); }}>{r.notes.length > 40 ? r.notes.slice(0, 40) + '...' : r.notes}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </GroupHeader>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {records.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--fg-muted)] text-[13px]">No records found.</div>
        ) : (
          <table className="grid-table w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            {headerRow}
            <tbody>
              <List
                rowCount={records.length}
                rowHeight={ROW_HEIGHT}
                rowComponent={GridRow}
                rowProps={{}}
                overscanCount={10}
                style={{ height: Math.min(records.length * ROW_HEIGHT, 600) }}
                className="focus:outline-none"
              />
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center px-5 py-2 border-t border-[var(--border)] text-[12px] text-[var(--fg-muted)] gap-4 bg-[var(--bg)] flex-shrink-0" role="status" aria-live="polite">
        <span>{records.length} record{records.length !== 1 ? 's' : ''}</span>
        {searchQuery && (
          <span>Filtered by &quot;{searchQuery}&quot;</span>
        )}
      </div>
    </div>
  );
}

export { GridView };
