'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { formatShortcut, type Modifier } from '@/hooks/use-keyboard-shortcuts';

interface ShortcutGroup {
  category: string;
  shortcuts: Array<{
    modifiers: Modifier[];
    key: string;
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Navigation',
    shortcuts: [
      { modifiers: ['meta'], key: 'K', description: 'Command palette' },
      { modifiers: ['meta'], key: 'F', description: 'Focus search' },
      { modifiers: [], key: 'ArrowUp', description: 'Previous row' },
      { modifiers: [], key: 'ArrowDown', description: 'Next row' },
      { modifiers: [], key: 'Enter', description: 'Open record' },
      { modifiers: [], key: 'Escape', description: 'Close panel / Cancel' },
    ],
  },
  {
    category: 'Actions',
    shortcuts: [
      { modifiers: ['meta'], key: 'N', description: 'New record' },
      { modifiers: ['meta'], key: 'Z', description: 'Undo (coming soon)' },
    ],
  },
  {
    category: 'View',
    shortcuts: [
      { modifiers: ['meta'], key: '/', description: 'Show shortcuts' },
    ],
  },
];

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

function ShortcutHelp({ isOpen, onClose }: ShortcutHelpProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/30 transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={overlayRef}
        role="dialog"
        aria-label="Keyboard shortcuts"
        className={cn(
          'fixed top-1/2 left-1/2 z-[201] w-[440px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2',
          'rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-lg)]',
          'animate-in fade-in zoom-in-95 duration-150',
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--surface)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--fg-weak)]">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category}>
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-[var(--fg-muted)] mb-2.5">
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.description}
                    className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--surface)]"
                  >
                    <span className="text-[13px] text-[var(--fg)]">{s.description}</span>
                    <kbd className="flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[12px] font-mono text-[var(--fg-weak)]">
                      {formatShortcut(s.modifiers, s.key)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export { ShortcutHelp, SHORTCUT_GROUPS };
