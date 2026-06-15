'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge, TypeTag } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { FieldIcon, type IconType } from '@/components/ui/field-icon';
import { GroupHeader } from '@/components/group-header';
import { ASSIGNEES, FIELDS, STATUSES, TYPES } from '@/types';
import type { ContentRecord, FieldDef, Status, ContentType } from '@/types';
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
  const tableRef = useRef<HTMLTableElement>(null);

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

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSort = useCallback(
    (field: keyof ContentRecord) => {
      if (!onSortChange || !sort) return;
      
      if (sort.field === field) {
        // Cycle: asc → desc → none
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

  const renderRecords = (recordsToRender: ContentRecord[]) => (
    <table className="grid-table w-full border-collapse" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th
            className="col-rownum sticky top-0 z-5 bg-[var(--surface)] border-b border-[var(--border)] border-r border-r-[var(--border-light)] flex items-center justify-center text-center text-[11px] text-[var(--fg-muted)]"
            style={{ width: 52 }}
          >
            #
          </th>
          <th
            className="col-checkbox sticky top-0 z-5 bg-[var(--surface)] border-b border-[var(--border)] border-r border-r-[var(--border-light)] flex items-center justify-center"
            style={{ width: 40 }}
          >
            <input
              type="checkbox"
              className="cell-checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              aria-label="Select all"
            />
          </th>
          {FIELDS.map((f) => (
            <th
              key={f.key}
              className={cn(
                'sticky top-0 z-5 bg-[var(--surface)] border-b border-[var(--border)] border-r border-r-[var(--border-light)] flex items-center gap-1.5 px-3 h-[34px] text-[12px] font-medium text-[var(--fg-weak)] tracking-[0.02em] whitespace-nowrap overflow-hidden text-ellipsis select-none last:border-r-0 cursor-pointer hover:bg-[var(--surface-hover)]',
                sort?.field === f.key && 'text-[var(--primary)]',
              )}
              style={{ width: f.width }}
              onClick={() => handleSort(f.key)}
            >
              <FieldIcon type={f.icon as IconType} />
              {f.label}
              {sort?.field === f.key && (
                <span className="ml-1 text-[var(--primary)]">
                  {sort.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {recordsToRender.length === 0 ? (
          <tr>
            <td
              colSpan={FIELDS.length + 2}
              className="py-16 text-center text-[var(--fg-muted)] text-[13px]"
            >
              No records found.
            </td>
          </tr>
        ) : (
          recordsToRender.map((r, i) => {
            const a = ASSIGNEES[r.assignee];
            return (
              <tr
                key={r.id}
                data-record-id={r.id}
                className="hover:[&>td]:bg-[var(--surface-hover)] group"
                onClick={() => onRecordClick?.(r)}
              >
                <td
                  className="col-rownum text-center text-[var(--fg-muted)] text-[12px] bg-[var(--surface)] cursor-pointer w-[52px] group-hover:bg-[var(--border-light)]"
                >
                  {i + 1}
                </td>
                <td
                  className="col-checkbox text-center w-[40px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="cell-checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    aria-label={`Select row ${i + 1}`}
                  />
                </td>

                {/* Title */}
                <td
                  className={cn(
                    'px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0',
                    editingCell?.id === r.id && editingCell.key === 'title' && 'p-0 overflow-visible',
                  )}
                >
                  {editingCell?.id === r.id && editingCell.key === 'title' ? (
                    <input
                      type="text"
                      defaultValue={r.title}
                      autoFocus
                      className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-2.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]"
                      onBlur={(e) => commitEdit(r.id, 'title', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit(r.id, 'title', (e.target as HTMLInputElement).value);
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                    />
                  ) : (
                    <span
                      className="cell-title font-[450] text-[var(--fg)] cursor-pointer hover:text-[var(--primary)] hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(r.id, 'title');
                      }}
                    >
                      {r.title}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td
                  className={cn(
                    'px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0',
                    editingCell?.id === r.id && editingCell.key === 'status' && 'p-0 overflow-visible',
                  )}
                >
                  {editingCell?.id === r.id && editingCell.key === 'status' ? (
                    <select
                      autoFocus
                      defaultValue={r.status}
                      className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]"
                      onBlur={(e) => commitEdit(r.id, 'status', e.target.value)}
                      onChange={(e) => commitEdit(r.id, 'status', e.target.value)}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(r.id, 'status');
                      }}
                    >
                      <StatusBadge status={r.status as Status} />
                    </span>
                  )}
                </td>

                {/* Type */}
                <td
                  className={cn(
                    'px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0',
                    editingCell?.id === r.id && editingCell.key === 'type' && 'p-0 overflow-visible',
                  )}
                >
                  {editingCell?.id === r.id && editingCell.key === 'type' ? (
                    <select
                      autoFocus
                      defaultValue={r.type}
                      className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]"
                      onBlur={(e) => commitEdit(r.id, 'type', e.target.value)}
                      onChange={(e) => commitEdit(r.id, 'type', e.target.value)}
                    >
                      {TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(r.id, 'type');
                      }}
                    >
                      <TypeTag type={r.type as ContentType} />
                    </span>
                  )}
                </td>

                {/* Assignee */}
                <td
                  className={cn(
                    'px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0',
                    editingCell?.id === r.id && editingCell.key === 'assignee' && 'p-0 overflow-visible',
                  )}
                >
                  {editingCell?.id === r.id && editingCell.key === 'assignee' ? (
                    <select
                      autoFocus
                      defaultValue={r.assignee}
                      className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]"
                      onBlur={(e) => commitEdit(r.id, 'assignee', e.target.value)}
                      onChange={(e) => commitEdit(r.id, 'assignee', e.target.value)}
                    >
                      {ASSIGNEES.map((a, idx) => (
                        <option key={idx} value={idx}>{a.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="cell-assignee flex items-center gap-1.5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(r.id, 'assignee');
                      }}
                    >
                      <Avatar initials={a.initials} color={a.color} size="sm" />
                      <span className="text-[var(--fg-weak)]">{a.name}</span>
                    </span>
                  )}
                </td>

                {/* Date */}
                <td
                  className={cn(
                    'px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0',
                    editingCell?.id === r.id && editingCell.key === 'date' && 'p-0 overflow-visible',
                  )}
                >
                  {editingCell?.id === r.id && editingCell.key === 'date' ? (
                    <input
                      type="date"
                      defaultValue={r.date}
                      autoFocus
                      className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]"
                      onBlur={(e) => commitEdit(r.id, 'date', e.target.value)}
                    />
                  ) : (
                    <span
                      className="cell-date text-[var(--fg-weak)] tabular-nums cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(r.id, 'date');
                      }}
                    >
                      {formatDate(r.date)}
                    </span>
                  )}
                </td>

                {/* Word Count */}
                <td
                  className={cn(
                    'px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0',
                    editingCell?.id === r.id && editingCell.key === 'words' && 'p-0 overflow-visible',
                  )}
                >
                  {editingCell?.id === r.id && editingCell.key === 'words' ? (
                    <input
                      type="number"
                      defaultValue={r.words}
                      autoFocus
                      min={0}
                      step={50}
                      className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-1.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)]"
                      onBlur={(e) => commitEdit(r.id, 'words', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit(r.id, 'words', (e.target as HTMLInputElement).value);
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                    />
                  ) : (
                    <span
                      className="cell-number text-[var(--fg)] tabular-nums text-right cursor-pointer block"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(r.id, 'words');
                      }}
                    >
                      {r.words > 0 ? r.words.toLocaleString() : '—'}
                    </span>
                  )}
                </td>

                {/* Featured */}
                <td
                  className={cn(
                    'px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0',
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="cell-checkbox"
                    checked={r.featured}
                    onChange={() => onRecordUpdate?.(r.id, 'featured', !r.featured)}
                    aria-label="Featured"
                  />
                </td>

                {/* Notes */}
                <td
                  className={cn(
                    'px-3 h-[var(--row-h)] text-[13px] whitespace-nowrap overflow-hidden text-ellipsis align-middle relative transition-colors border-b border-b-[var(--border-light)] border-r border-r-[var(--border-light)] last:border-r-0',
                    editingCell?.id === r.id && editingCell.key === 'notes' && 'p-0 overflow-visible',
                  )}
                >
                  {editingCell?.id === r.id && editingCell.key === 'notes' ? (
                    <textarea
                      defaultValue={r.notes}
                      autoFocus
                      className="w-full h-full border-2 border-[var(--primary)] border-radius-0 px-2.5 text-[13px] absolute inset-0 z-[2] bg-[var(--bg)] resize-y"
                      onBlur={(e) => commitEdit(r.id, 'notes', e.target.value)}
                    />
                  ) : (
                    <span
                      className="text-[var(--fg-weak)] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(r.id, 'notes');
                      }}
                    >
                      {r.notes.length > 40 ? r.notes.slice(0, 40) + '...' : r.notes}
                    </span>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {groupedRecords && groupedRecords.length > 1 ? (
          groupedRecords.map((group) => (
            <GroupHeader
              key={group.key}
              groupName={group.key}
              count={group.records.length}
              color={group.color}
            >
              {renderRecords(group.records)}
            </GroupHeader>
          ))
        ) : (
          renderRecords(records)
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center px-5 py-2 border-t border-[var(--border)] text-[12px] text-[var(--fg-muted)] gap-4 bg-[var(--bg)] flex-shrink-0">
        <span>{records.length} record{records.length !== 1 ? 's' : ''}</span>
        {searchQuery && (
          <span>Filtered by &quot;{searchQuery}&quot;</span>
        )}
      </div>
    </div>
  );
}

export { GridView };