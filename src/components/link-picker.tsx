'use client';

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LinkPickerProps {
  recordId: string;
  fieldName: string;
  linkedTableId: string;
  multiple?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  className?: string;
}

export function LinkPicker({
  recordId,
  fieldName,
  linkedTableId,
  multiple = false,
  value,
  onChange,
  className,
}: LinkPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const utils = trpc.useUtils();

  const { data: searchResults } = trpc.link.searchTargetRecords.useQuery(
    { tableId: linkedTableId, query: searchQuery, excludeRecordId: recordId },
    { enabled: isSearching && searchQuery.length >= 0 }
  );

  const currentLinkedIds = useMemo(() => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }, [value]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
  }, []);

  const handleSelect = useCallback((targetRecordId: string) => {
    if (multiple) {
      const newValue = Array.isArray(value) ? [...value, targetRecordId] : [targetRecordId];
      onChange(newValue);
    } else {
      onChange(targetRecordId);
    }
    setIsSearching(false);
    setSearchQuery('');
  }, [multiple, value, onChange]);

  const handleRemove = useCallback((targetId: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((id) => id !== targetId));
    } else {
      onChange('');
    }
  }, [multiple, value, onChange]);

  const handleCreateAndLink = useCallback(async () => {
    if (!newTitle.trim()) return;

    const record = await utils.client.record.create.mutate({
      tableId: linkedTableId,
      title: newTitle.trim(),
    });

    await utils.client.link.create.mutate({
      sourceRecordId: recordId,
      targetRecordId: record.id,
      fieldName,
    });

    if (multiple) {
      const newValue = Array.isArray(value) ? [...value, record.id] : [record.id];
      onChange(newValue);
    } else {
      onChange(record.id);
    }

    setNewTitle('');
    setShowCreateNew(false);
    setIsSearching(false);
  }, [newTitle, linkedTableId, recordId, fieldName, multiple, value, onChange, utils]);

  return (
    <div className={cn('space-y-1', className)}>
      {currentLinkedIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {currentLinkedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-[11px] font-medium"
            >
              <span className="max-w-[120px] truncate">{id.slice(0, 8)}...</span>
              <button
                onClick={() => handleRemove(id)}
                className="ml-0.5 hover:text-[var(--primary-hover)]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsSearching(true)}
          placeholder="Search records..."
          className="h-7 text-[12px]"
        />

        {isSearching && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-lg max-h-40 overflow-y-auto">
            {searchResults && searchResults.length > 0 ? (
              searchResults.map((record) => (
                <button
                  key={record.id}
                  onClick={() => handleSelect(record.id)}
                  className="w-full px-3 py-1.5 text-left text-[12px] text-[var(--fg)] hover:bg-[var(--surface)] truncate"
                >
                  {record.title}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-[11px] text-[var(--fg-muted)]">
                No records found
              </div>
            )}

            <div className="border-t border-[var(--border)]">
              {!showCreateNew ? (
                <button
                  onClick={() => setShowCreateNew(true)}
                  className="w-full px-3 py-1.5 text-left text-[12px] text-[var(--primary)] hover:bg-[var(--surface)]"
                >
                  + Create and link new record
                </button>
              ) : (
                <div className="p-2 space-y-1">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Record title"
                    className="h-7 text-[12px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateAndLink();
                      if (e.key === 'Escape') setShowCreateNew(false);
                    }}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCreateNew(false)}
                      className="h-6 text-[11px]"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateAndLink}
                      disabled={!newTitle.trim()}
                      className="h-6 text-[11px]"
                    >
                      Create & Link
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => { setIsSearching(false); setSearchQuery(''); }}
              className="w-full px-3 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--surface)] border-t border-[var(--border)]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
