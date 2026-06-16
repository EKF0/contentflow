'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

type AssistantAction = 'rewrite' | 'expand' | 'summarize' | 'improve' | 'seo';

interface AIAssistantToolbarProps {
  visible: boolean;
  position: { top: number; left: number };
  selectedText: string;
  onAction: (action: AssistantAction, text: string) => void;
  onDismiss: () => void;
}

export function AIAssistantToolbar({
  visible,
  position,
  selectedText,
  onAction,
  onDismiss,
}: AIAssistantToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showToneSelector, setShowToneSelector] = useState(false);

  const handleDismiss = useCallback(
    (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowToneSelector(false);
        onDismiss();
      }
    },
    [onDismiss],
  );

  useEffect(() => {
    if (visible) {
      document.addEventListener('mousedown', handleDismiss);
      return () => document.removeEventListener('mousedown', handleDismiss);
    }
  }, [visible, handleDismiss]);

  if (!visible || !selectedText.trim()) return null;

  const actions: { key: AssistantAction; label: string; icon: string }[] = [
    {
      key: 'rewrite',
      label: 'Rewrite',
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    },
    {
      key: 'expand',
      label: 'Expand',
      icon: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
    },
    {
      key: 'summarize',
      label: 'Summarize',
      icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12',
    },
    {
      key: 'improve',
      label: 'Improve',
      icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
    },
    {
      key: 'seo',
      label: 'SEO',
      icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    },
  ];

  const tones = [
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'concise', label: 'Concise' },
    { value: 'professional', label: 'Professional' },
  ] as const;

  const handleRewriteClick = () => {
    setShowToneSelector(!showToneSelector);
  };

  const handleToneSelect = (tone: 'formal' | 'casual' | 'concise' | 'professional') => {
    setShowToneSelector(false);
    onAction('rewrite', selectedText);
    void tone;
  };

  return (
    <div
      ref={toolbarRef}
      className={cn(
        'fixed z-[200] flex items-center gap-0.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-1 shadow-lg',
        'animate-in fade-in zoom-in-95 duration-150',
      )}
      style={{
        top: position.top,
        left: Math.min(position.left, window.innerWidth - 360),
      }}
    >
      {actions.map((action) => (
        <div key={action.key} className="relative">
          <button
            onClick={() => {
              if (action.key === 'rewrite') {
                handleRewriteClick();
              } else {
                onAction(action.key, selectedText);
              }
            }}
            className={cn(
              'flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--fg)] transition-colors',
              'hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]',
              action.key === 'rewrite' && showToneSelector && 'bg-[var(--primary)]/10 text-[var(--primary)]',
            )}
            title={action.label}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
            </svg>
            {action.label}
          </button>

          {action.key === 'rewrite' && showToneSelector && (
            <div className="absolute top-full left-0 z-[210] mt-1 flex flex-col gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] p-1 shadow-lg">
              {tones.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => handleToneSelect(tone.value)}
                  className="rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] font-medium text-[var(--fg)] transition-colors hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                >
                  {tone.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
