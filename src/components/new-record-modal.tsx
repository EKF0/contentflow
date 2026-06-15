'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { STATUSES, TYPES, ASSIGNEES } from '@/types';
import type { Status, ContentType } from '@/types';

interface NewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; status: Status; type: ContentType; assignee: number }) => void;
}

function NewRecordModal({ isOpen, onClose, onCreate }: NewRecordModalProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('Idea');
  const [type, setType] = useState<ContentType>('Blog');
  const [assignee, setAssignee] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setTitle('');
    setStatus('Idea');
    setType('Blog');
    setAssignee(0);

    setTimeout(() => inputRef.current?.focus(), 50);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), status, type, assignee });
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/30 transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="New record"
        className={cn(
          'fixed top-1/2 left-1/2 z-[201] w-[420px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2',
          'rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-lg)]',
          'animate-in fade-in zoom-in-95 duration-150',
        )}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">New Record</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--surface)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--fg-weak)]">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--fg-weak)] mb-1.5">Title</label>
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter record title..."
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--fg-weak)] mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--fg-weak)] mb-1.5">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ContentType)}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--fg-weak)] mb-1.5">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(Number(e.target.value))}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
              >
                {ASSIGNEES.map((a, idx) => (
                  <option key={idx} value={idx}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-sm)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--fg-weak)] hover:bg-[var(--surface)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className={cn(
                'rounded-[var(--radius-sm)] px-4 py-1.5 text-[13px] font-medium transition-colors',
                title.trim()
                  ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                  : 'bg-[var(--surface)] text-[var(--fg-muted)] cursor-not-allowed',
              )}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export { NewRecordModal };
