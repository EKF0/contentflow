'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldOptionEditor } from '@/components/field-option-editor';
import {
  FIELD_TYPES,
  type FieldType,
  type FieldTypeInfo,
  getDefaultConfig,
} from '@/lib/field-types';
import { cn } from '@/lib/utils';

interface FieldEditorProps {
  tableId: string;
  fieldId?: string;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'basic', label: 'Basic' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'computed', label: 'Computed' },
] as const;

export function FieldEditor({ tableId, fieldId, onClose }: FieldEditorProps) {
  const isEditing = !!fieldId;

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<FieldType>('text');
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [typeSearch, setTypeSearch] = useState('');

  const utils = trpc.useUtils();

  const { data: existingField } = trpc.table.listFields.useQuery(
    { tableId },
    { enabled: !!fieldId }
  );

  const field = useMemo(() => {
    if (!fieldId || !existingField) return null;
    return existingField.find((f) => f.id === fieldId) ?? null;
  }, [fieldId, existingField]);

  useState(() => {
    if (field) {
      setName(field.name);
      setSelectedType(field.type as FieldType);
      setConfig((field.config as Record<string, unknown>) ?? {});
    }
  });

  const createMutation = trpc.table.createField.useMutation({
    onSuccess: () => {
      utils.table.listFields.invalidate({ tableId });
      onClose();
    },
  });

  const updateMutation = trpc.table.updateField.useMutation({
    onSuccess: () => {
      utils.table.listFields.invalidate({ tableId });
      onClose();
    },
  });

  const fieldType = FIELD_TYPES[selectedType];

  const filteredTypes = useMemo(() => {
    if (!typeSearch) return FIELD_TYPES;
    const search = typeSearch.toLowerCase();
    return Object.fromEntries(
      Object.entries(FIELD_TYPES).filter(
        ([, ft]) =>
          ft.label.toLowerCase().includes(search) ||
          ft.description.toLowerCase().includes(search)
      )
    );
  }, [typeSearch]);

  const handleSave = () => {
    if (!name.trim()) return;

    if (isEditing && fieldId) {
      updateMutation.mutate({
        fieldId,
        name: name.trim(),
        config,
      });
    } else {
      createMutation.mutate({
        tableId,
        name: name.trim(),
        type: selectedType,
        config,
      });
    }
  };

  const handleTypeSelect = (type: FieldType) => {
    setSelectedType(type);
    setConfig(getDefaultConfig(type) as Record<string, unknown>);
  };

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--bg)] border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[15px] font-semibold text-[var(--fg)]">
            {isEditing ? 'Edit Field' : 'Add Field'}
          </h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-lg leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <Input
            label="Field name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Title, Status, Due Date"
            autoFocus
          />

          <div>
            <label className="text-[12px] font-medium text-[var(--fg-weak)] tracking-wide block mb-2">
              Field type
            </label>
            <div className="relative mb-2">
              <Input
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                placeholder="Search types..."
                className="h-8 text-[12px]"
              />
            </div>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const typesInCategory = Object.values(filteredTypes).filter(
                  (ft) => ft.category === cat.id
                );
                if (typesInCategory.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-1">
                      {cat.label}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {typesInCategory.map((ft) => (
                        <button
                          key={ft.id}
                          onClick={() => handleTypeSelect(ft.id)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[12px] text-left transition-colors border',
                            selectedType === ft.id
                              ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
                              : 'border-transparent hover:bg-[var(--surface)] text-[var(--fg)]'
                          )}
                        >
                          <span className="font-medium">{ft.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {fieldType && (
            <div className="space-y-3 p-3 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[12px] font-medium text-[var(--fg)]">{fieldType.label}</div>
              <div className="text-[11px] text-[var(--fg-muted)]">{fieldType.description}</div>

              {selectedType === 'number' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--fg-weak)]">Format</label>
                    <select
                      value={(config.format as string) ?? 'integer'}
                      onChange={(e) => updateConfig('format', e.target.value)}
                      className="w-full h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--fg)]"
                    >
                      <option value="integer">Integer</option>
                      <option value="decimal">Decimal</option>
                      <option value="currency">Currency</option>
                      <option value="percent">Percent</option>
                    </select>
                  </div>
                  {(config.format === 'decimal' || config.format === 'currency') && (
                    <div>
                      <label className="text-[11px] font-medium text-[var(--fg-weak)]">Decimal places</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={(config.decimalPlaces as number) ?? 2}
                        onChange={(e) => updateConfig('decimalPlaces', parseInt(e.target.value) || 0)}
                        className="w-full h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--fg)]"
                      />
                    </div>
                  )}
                  {config.format === 'currency' && (
                    <div>
                      <label className="text-[11px] font-medium text-[var(--fg-weak)]">Currency</label>
                      <select
                        value={(config.currency as string) ?? 'USD'}
                        onChange={(e) => updateConfig('currency', e.target.value)}
                        className="w-full h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--fg)]"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {(selectedType === 'select' || selectedType === 'multi_select') && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[12px] text-[var(--fg)]">
                    <input
                      type="checkbox"
                      checked={(config.allowCustom as boolean) ?? false}
                      onChange={(e) => updateConfig('allowCustom', e.target.checked)}
                      className="rounded"
                    />
                    Allow custom options
                  </label>
                  {selectedType === 'multi_select' && (
                    <div>
                      <label className="text-[11px] font-medium text-[var(--fg-weak)]">Max selections</label>
                      <input
                        type="number"
                        min={1}
                        value={(config.maxSelections as number) ?? ''}
                        onChange={(e) => updateConfig('maxSelections', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="No limit"
                        className="w-full h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--fg)]"
                      />
                    </div>
                  )}
                  <FieldOptionEditor fieldId={fieldId} tableId={tableId} />
                </div>
              )}

              {selectedType === 'date' && (
                <div>
                  <label className="text-[11px] font-medium text-[var(--fg-weak)]">Format</label>
                  <select
                    value={(config.format as string) ?? 'date'}
                    onChange={(e) => updateConfig('format', e.target.value)}
                    className="w-full h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--fg)]"
                  >
                    <option value="date">Date only</option>
                    <option value="datetime">Date & time</option>
                  </select>
                </div>
              )}

              {(selectedType === 'text' || selectedType === 'long_text') && (
                <div>
                  <label className="text-[11px] font-medium text-[var(--fg-weak)]">Max length</label>
                  <input
                    type="number"
                    min={1}
                    value={(config.maxLength as number) ?? ''}
                    onChange={(e) => updateConfig('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="No limit"
                    className="w-full h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--fg)]"
                  />
                </div>
              )}

              {selectedType === 'url' && (
                <label className="flex items-center gap-2 text-[12px] text-[var(--fg)]">
                  <input
                    type="checkbox"
                    checked={(config.requireProtocol as boolean) ?? true}
                    onChange={(e) => updateConfig('requireProtocol', e.target.checked)}
                    className="rounded"
                  />
                  Require protocol (https://)
                </label>
              )}

              {selectedType === 'collaborator' && (
                <label className="flex items-center gap-2 text-[12px] text-[var(--fg)]">
                  <input
                    type="checkbox"
                    checked={(config.multiple as boolean) ?? false}
                    onChange={(e) => updateConfig('multiple', e.target.checked)}
                    className="rounded"
                  />
                  Allow multiple collaborators
                </label>
              )}

              {selectedType === 'phone' && (
                <div>
                  <label className="text-[11px] font-medium text-[var(--fg-weak)]">Format</label>
                  <select
                    value={(config.format as string) ?? 'national'}
                    onChange={(e) => updateConfig('format', e.target.value)}
                    className="w-full h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--fg)]"
                  >
                    <option value="national">National</option>
                    <option value="international">International</option>
                    <option value="e164">E.164</option>
                  </select>
                </div>
              )}

              {selectedType === 'formula' && (
                <div>
                  <label className="text-[11px] font-medium text-[var(--fg-weak)]">Expression</label>
                  <textarea
                    value={(config.expression as string) ?? ''}
                    onChange={(e) => updateConfig('expression', e.target.value)}
                    placeholder='e.g., {Field1} + {Field2}'
                    className="w-full h-16 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[12px] text-[var(--fg)] resize-none font-mono"
                  />
                </div>
              )}
            </div>
          )}

          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Preview</div>
            <div className="text-[13px] text-[var(--fg)]">
              {name || 'Untitled field'} ({fieldType?.label ?? 'Unknown'})
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border)]">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Add Field'}
          </Button>
        </div>
      </div>
    </div>
  );
}
