'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { SavedView } from '@/hooks/use-views';

interface ViewSwitcherProps {
  views: SavedView[];
  activeViewId: string | null;
  activeViewName: string | null;
  onLoadView: (id: string) => void;
  onSaveView: () => void;
  onDeleteView: (id: string) => void;
  onRenameView: (id: string, name: string) => void;
  onResetView: () => void;
}

function ViewSwitcher({
  views,
  activeViewId,
  activeViewName,
  onLoadView,
  onSaveView,
  onDeleteView,
  onRenameView,
  onResetView,
}: ViewSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [manageOpen, setManageOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setManageOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleSelect = useCallback(
    (id: string) => {
      onLoadView(id);
      setOpen(false);
    },
    [onLoadView],
  );

  const handleDefault = useCallback(() => {
    onResetView();
    setOpen(false);
  }, [onResetView]);

  const handleSaveNew = useCallback(() => {
    onSaveView();
    setOpen(false);
  }, [onSaveView]);

  const startRename = useCallback((view: SavedView) => {
    setRenamingId(view.id);
    setRenameValue(view.name);
    setManageOpen(false);
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRenameView(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, onRenameView]);

  const handleDelete = useCallback(
    (id: string) => {
      onDeleteView(id);
      setManageOpen(false);
    },
    [onDeleteView],
  );

  const displayName = activeViewName ?? 'Default';

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-[5px] text-[13px] transition-all',
            open
              ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium'
              : 'text-[var(--fg-weak)] hover:bg-[var(--surface)] hover:text-[var(--fg)]',
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {displayName}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-[var(--fg-muted)]">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-50 min-w-[220px] py-1">
            <div className="px-3 py-1.5 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Views
            </div>
            <button
              onClick={handleDefault}
              className={cn(
                'w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)]',
                activeViewId === null && 'text-[var(--primary)] font-medium',
              )}
            >
              Default
            </button>
            {views.map((v) => (
              <button
                key={v.id}
                onClick={() => handleSelect(v.id)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)] flex items-center justify-between',
                  activeViewId === v.id && 'text-[var(--primary)] font-medium',
                )}
              >
                <span className="truncate">{v.name}</span>
              </button>
            ))}

            <div className="mx-3 my-1 h-px bg-[var(--border)]" />

            <button
              onClick={handleSaveNew}
              className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)] flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-[var(--fg-muted)]">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Save as new view
            </button>
            {views.length > 0 && (
              <button
                onClick={() => setManageOpen(!manageOpen)}
                className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)] flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-[var(--fg-muted)]">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Manage views
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rename input overlay */}
      {renamingId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setRenamingId(null)} />
          <div className="relative bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-4 w-[300px]">
            <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">Rename view</label>
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenamingId(null);
              }}
              className="w-full border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] text-[var(--fg)] bg-[var(--bg)] focus:outline-none focus:border-[var(--primary)]"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setRenamingId(null)}
                className="px-3 py-1.5 text-[13px] text-[var(--fg-weak)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-sm)]"
              >
                Cancel
              </button>
              <button
                onClick={commitRename}
                className="px-3 py-1.5 text-[13px] font-medium bg-[var(--primary)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--primary-hover)]"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { ViewSwitcher };
