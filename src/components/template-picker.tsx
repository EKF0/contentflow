'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BUILT_IN_TEMPLATES } from '@/lib/templates/built-in';

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

export function TemplatePicker({ open, onClose, onSelect }: TemplatePickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-[var(--bg)] rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden border border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Choose a Template</h2>
          <p className="text-sm text-[var(--fg-muted)] mt-1">
            Start with a pre-built workflow or create from scratch
          </p>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh]">
          {BUILT_IN_TEMPLATES.map(template => (
            <button
              key={template.id}
              className={cn(
                'p-4 rounded-lg border text-left transition-all',
                selectedId === template.id
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface)]',
              )}
              onClick={() => setSelectedId(template.id)}
            >
              <div className="font-medium text-sm">{template.name}</div>
              <div className="text-xs text-[var(--fg-muted)] mt-1">
                {template.description}
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {template.payload.statuses.map(status => (
                  <span
                    key={status}
                    className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--surface)] text-[var(--fg-muted)]"
                  >
                    {status}
                  </span>
                ))}
              </div>
            </button>
          ))}

          <button
            className={cn(
              'p-4 rounded-lg border text-left transition-all border-dashed',
              selectedId === 'blank'
                ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                : 'border-[var(--border)] hover:border-[var(--primary)]',
            )}
            onClick={() => setSelectedId('blank')}
          >
            <div className="font-medium text-sm">Start from Scratch</div>
            <div className="text-xs text-[var(--fg-muted)] mt-1">
              Empty workspace with default fields
            </div>
          </button>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!selectedId}
            onClick={() => {
              if (selectedId) {
                onSelect(selectedId);
                onClose();
              }
            }}
          >
            Use Template
          </Button>
        </div>
      </div>
    </div>
  );
}
