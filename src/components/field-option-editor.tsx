'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FieldOptionEditorProps {
  fieldId?: string;
  tableId: string;
}

const PRESET_COLORS = [
  '#1b61c9',
  '#fcb400',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#06b6d4',
  '#84cc16',
  '#6b7280',
];

export function FieldOptionEditor({ fieldId, tableId }: FieldOptionEditorProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const utils = trpc.useUtils();

  const { data: options } = trpc.table.listFieldOptions.useQuery(
    { fieldId: fieldId! },
    { enabled: !!fieldId }
  );

  const createMutation = trpc.table.createFieldOption.useMutation({
    onSuccess: () => {
      utils.table.listFieldOptions.invalidate({ fieldId: fieldId! });
      setNewLabel('');
    },
  });

  const updateMutation = trpc.table.updateFieldOption.useMutation({
    onSuccess: () => {
      utils.table.listFieldOptions.invalidate({ fieldId: fieldId! });
      setEditingId(null);
    },
  });

  const deleteMutation = trpc.table.deleteFieldOption.useMutation({
    onSuccess: () => {
      utils.table.listFieldOptions.invalidate({ fieldId: fieldId! });
    },
  });

  const handleAdd = () => {
    if (!newLabel.trim() || !fieldId) return;
    createMutation.mutate({
      fieldId,
      label: newLabel.trim(),
      color: newColor,
      sortOrder: options?.length ?? 0,
    });
  };

  const handleUpdateLabel = (optionId: string) => {
    if (editLabel.trim()) {
      updateMutation.mutate({ optionId, label: editLabel.trim() });
    }
  };

  if (!fieldId) {
    return (
      <div className="text-[12px] text-[var(--fg-muted)] py-2">
        Save the field first to add options.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-medium text-[var(--fg-weak)]">Options</label>

      <div className="space-y-1">
        {options?.map((option) => (
          <div
            key={option.id}
            className="flex items-center gap-2 py-1 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg)] group"
          >
            <div
              className="h-3 w-3 rounded-full flex-shrink-0 cursor-pointer"
              style={{ backgroundColor: option.color ?? '#6b7280' }}
            />
            {editingId === option.id ? (
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={() => handleUpdateLabel(option.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateLabel(option.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                className="h-6 py-0 px-1 text-[12px] flex-1"
              />
            ) : (
              <span
                className="flex-1 text-[12px] text-[var(--fg)] cursor-pointer"
                onDoubleClick={() => {
                  setEditingId(option.id);
                  setEditLabel(option.label);
                }}
              >
                {option.label}
              </span>
            )}
            <button
              className="hidden group-hover:block text-[var(--fg-muted)] hover:text-red-500 p-0.5"
              onClick={() => deleteMutation.mutate({ optionId: option.id })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <div
            className="h-6 w-6 rounded-full border border-[var(--border)] cursor-pointer"
            style={{ backgroundColor: newColor }}
            onClick={() => {
              const idx = PRESET_COLORS.indexOf(newColor);
              setNewColor(PRESET_COLORS[(idx + 1) % PRESET_COLORS.length]);
            }}
            title="Click to cycle color"
          />
        </div>
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New option..."
          className="h-7 text-[12px] flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAdd}
          disabled={!newLabel.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
