'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { toCSV, toJSON } from '@/lib/import-export';
import type { ContentRecord } from '@/types';

interface ExportMenuProps {
  records: ContentRecord[];
  filteredRecords: ContentRecord[];
}

function ExportMenu({ records, filteredRecords }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('filtered');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const dataToExport = exportScope === 'filtered' ? filteredRecords : records;

  const download = useCallback((content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportCSV = useCallback(() => {
    setExporting('csv');
    setTimeout(() => {
      const csv = toCSV(dataToExport);
      download(csv, 'contentflow-export.csv', 'text/csv;charset=utf-8');
      setExporting(null);
      setOpen(false);
    }, 100);
  }, [dataToExport, download]);

  const handleExportJSON = useCallback(() => {
    setExporting('json');
    setTimeout(() => {
      const json = toJSON(dataToExport);
      download(json, 'contentflow-export.json', 'application/json');
      setExporting(null);
      setOpen(false);
    }, 100);
  }, [dataToExport, download]);

  const handleCopyClipboard = useCallback(async () => {
    setExporting('clipboard');
    try {
      const text = toCSV(dataToExport);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: create temporary textarea
      const ta = document.createElement('textarea');
      ta.value = toCSV(dataToExport);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setExporting(null);
    setOpen(false);
  }, [dataToExport]);

  const hasFilter = filteredRecords.length < records.length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-[5px] rounded-[var(--radius-sm)] px-2.5 py-[5px] text-[13px] transition-all',
          open
            ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium'
            : 'text-[var(--fg-weak)] hover:bg-[var(--surface)] hover:text-[var(--fg)]',
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-50 min-w-[200px] py-1" role="menu" aria-label="Export options">
          {/* Export scope */}
          {hasFilter && (
            <>
              <div className="px-3 py-1.5 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                Export scope
              </div>
              <button
                onClick={() => setExportScope('filtered')}
                role="menuitemradio"
                aria-checked={exportScope === 'filtered'}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)] flex items-center gap-2',
                  exportScope === 'filtered' && 'text-[var(--primary)] font-medium',
                )}
              >
                <span className={cn('h-3 w-3 rounded-full border-2 flex items-center justify-center', exportScope === 'filtered' ? 'border-[var(--primary)]' : 'border-[var(--border)]')}>
                  {exportScope === 'filtered' && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />}
                </span>
                Filtered ({filteredRecords.length})
              </button>
              <button
                onClick={() => setExportScope('all')}
                role="menuitemradio"
                aria-checked={exportScope === 'all'}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)] flex items-center gap-2',
                  exportScope === 'all' && 'text-[var(--primary)] font-medium',
                )}
              >
                <span className={cn('h-3 w-3 rounded-full border-2 flex items-center justify-center', exportScope === 'all' ? 'border-[var(--primary)]' : 'border-[var(--border)]')}>
                  {exportScope === 'all' && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />}
                </span>
                All ({records.length})
              </button>
              <div className="mx-3 my-1 h-px bg-[var(--border)]" />
            </>
          )}

          {/* Export actions */}
          <div className="px-3 py-1.5 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
            Export as
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting === 'csv'}
            role="menuitem"
            className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)] flex items-center gap-2"
          >
            {exporting === 'csv' ? (
              <span className="h-3.5 w-3.5 border-2 border-[var(--fg-muted)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-[var(--fg-muted)]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            )}
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={exporting === 'json'}
            role="menuitem"
            className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)] flex items-center gap-2"
          >
            {exporting === 'json' ? (
              <span className="h-3.5 w-3.5 border-2 border-[var(--fg-muted)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-[var(--fg-muted)]">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            )}
            JSON
          </button>
          <div className="mx-3 my-1 h-px bg-[var(--border)]" />
          <button
            onClick={handleCopyClipboard}
            disabled={exporting === 'clipboard'}
            role="menuitem"
            className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--surface-hover)] flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" className="h-3.5 w-3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : exporting === 'clipboard' ? (
              <span className="h-3.5 w-3.5 border-2 border-[var(--fg-muted)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-[var(--fg-muted)]">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export { ExportMenu };
