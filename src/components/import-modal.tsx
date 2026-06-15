'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  parseCSV,
  parseJSON,
  guessFieldMapping,
  importRecords,
  type ColumnMapping,
} from '@/lib/import-export';
import { FIELDS, ASSIGNEES } from '@/types';
import type { ContentRecord } from '@/types';

type ImportStep = 'upload' | 'mapping' | 'result';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (records: ContentRecord[]) => void;
  existingRecords: ContentRecord[];
}

function ImportModal({ open, onClose, onImport, existingRecords }: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [rawText, setRawText] = useState('');
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = useCallback(() => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setMapping([]);
    setError(null);
    setParsing(false);
    setImporting(false);
    setPreviewRows([]);
    setRawText('');
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const processText = useCallback((text: string, filename?: string) => {
    setParsing(true);
    setError(null);
    setRawText(text);

    setTimeout(() => {
      try {
        let result: { headers: string[]; rows: Record<string, string>[] };
        const ext = filename?.split('.').pop()?.toLowerCase();
        if (ext === 'json') {
          result = parseJSON(text);
        } else {
          result = parseCSV(text);
        }

        if (result.rows.length === 0) {
          setError('No data rows found in the file');
          setParsing(false);
          return;
        }

        setHeaders(result.headers);
        setRows(result.rows);
        setPreviewRows(result.rows.slice(0, 10));
        setMapping(guessFieldMapping(result.headers));
        setStep('mapping');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse file');
      }
      setParsing(false);
    }, 100);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large (max 10MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          processText(text, file.name);
        }
      };
      reader.readAsText(file);
    },
    [processText],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handlePaste = useCallback(() => {
    if (rawText.trim()) {
      processText(rawText);
    }
  }, [rawText, processText]);

  const updateMapping = useCallback((csvColumn: string, field: keyof ContentRecord | null) => {
    setMapping((prev) =>
      prev.map((m) => (m.csvColumn === csvColumn ? { ...m, field } : m)),
    );
  }, []);

  const handleImport = useCallback(() => {
    setImporting(true);
    const errors: string[] = [];

    setTimeout(() => {
      try {
        const imported = importRecords(rows, mapping, existingRecords);
        const valid = imported.filter((r) => r.title !== 'Untitled' || r.notes);
        const skipped = imported.length - valid.length;
        if (skipped > 0) errors.push(`Skipped ${skipped} empty rows`);
        setImportResult({ count: valid.length, errors });
        if (valid.length > 0) onImport(valid);
        setStep('result');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Import failed');
      }
      setImporting(false);
    }, 200);
  }, [rows, mapping, existingRecords, onImport]);

  const mappedFields = useMemo(
    () => mapping.filter((m) => m.field !== null).length,
    [mapping],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] w-full max-w-[720px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--fg)]">Import Data</h2>
            <p className="text-[12px] text-[var(--fg-muted)] mt-0.5">
              {step === 'upload' && 'Upload a CSV, TSV, or JSON file'}
              {step === 'mapping' && `Map ${headers.length} columns to fields (${mappedFields} mapped)`}
              {step === 'result' && 'Import complete'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'border-[var(--border)] hover:border-[var(--fg-muted)]',
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 mx-auto text-[var(--fg-muted)] mb-3">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-[14px] text-[var(--fg)] font-medium mb-1">
                  {isDragging ? 'Drop your file here' : 'Drag & drop a file here'}
                </p>
                <p className="text-[12px] text-[var(--fg-muted)]">
                  or click to browse. Supports CSV, TSV, JSON.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.json,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]" />
                </div>
                <div className="relative flex justify-center text-[12px]">
                  <span className="px-3 bg-[var(--bg)] text-[var(--fg-muted)]">or paste from clipboard</span>
                </div>
              </div>

              <textarea
                placeholder="Paste CSV, TSV, or JSON data here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                className="w-full border border-[var(--border)] rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-[var(--fg)] bg-[var(--surface)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[var(--primary)] font-mono resize-y"
              />
              {rawText.trim() && (
                <button
                  onClick={handlePaste}
                  className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--primary)] text-white text-[13px] font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Parse Pasted Data
                </button>
              )}

              {parsing && (
                <div className="flex items-center gap-2 text-[13px] text-[var(--primary)]">
                  <div className="h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                  Parsing...
                </div>
              )}
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              {/* Preview table */}
              <div className="border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
                <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-[var(--surface)]">
                        {headers.map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-[var(--fg-weak)] border-b border-[var(--border)] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-b border-[var(--border-light)] last:border-0">
                          {headers.map((h) => (
                            <td key={h} className="px-3 py-1.5 text-[var(--fg-weak)] whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis">
                              {row[h] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 10 && (
                  <div className="px-3 py-1.5 text-[11px] text-[var(--fg-muted)] bg-[var(--surface)] border-t border-[var(--border)]">
                    Showing first 10 of {rows.length} rows
                  </div>
                )}
              </div>

              {/* Column mapping */}
              <div>
                <h3 className="text-[13px] font-medium text-[var(--fg)] mb-2">Column Mapping</h3>
                <div className="space-y-2">
                  {mapping.map((m) => (
                    <div key={m.csvColumn} className="flex items-center gap-3">
                      <span className="text-[12px] text-[var(--fg-weak)] w-[140px] truncate font-mono" title={m.csvColumn}>
                        {m.csvColumn}
                      </span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-[var(--fg-muted)] flex-shrink-0">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                      <select
                        value={m.field ?? ''}
                        onChange={(e) =>
                          updateMapping(m.csvColumn, (e.target.value || null) as keyof ContentRecord | null)
                        }
                        className="flex-1 border border-[var(--border)] rounded-[var(--radius-sm)] px-2 py-1 text-[12px] text-[var(--fg)] bg-[var(--bg)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="">-- Skip --</option>
                        {FIELDS.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--fg)] mb-1">
                {importResult.count} record{importResult.count !== 1 ? 's' : ''} imported
              </h3>
              {importResult.errors.length > 0 && (
                <div className="mt-3 text-[12px] text-[var(--fg-muted)]">
                  {importResult.errors.map((e, i) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 px-3 py-2 rounded-[var(--radius-sm)] bg-red-500/10 text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border)]">
          {step === 'mapping' && (
            <button
              onClick={() => setStep('upload')}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-[13px] text-[var(--fg-weak)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-[var(--radius-md)] text-[13px] text-[var(--fg-weak)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            {step === 'result' ? 'Done' : 'Cancel'}
          </button>
          {step === 'mapping' && (
            <button
              onClick={handleImport}
              disabled={importing || mappedFields === 0}
              className={cn(
                'px-4 py-1.5 rounded-[var(--radius-md)] text-[13px] font-medium transition-colors',
                importing || mappedFields === 0
                  ? 'bg-[var(--fg-muted)] text-[var(--bg)] cursor-not-allowed opacity-50'
                  : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]',
              )}
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </span>
              ) : (
                `Import ${rows.length} Record${rows.length !== 1 ? 's' : ''}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { ImportModal };
