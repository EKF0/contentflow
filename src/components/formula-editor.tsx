'use client';

import { useState, useMemo, useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FORMULA_TEMPLATES, extractFieldRefs } from '@/lib/formula-engine';
import { cn } from '@/lib/utils';

interface FormulaEditorProps {
  tableId: string;
  recordId?: string;
  value: string;
  returnType?: 'text' | 'number' | 'date';
  onChange: (expression: string) => void;
  onReturnTypeChange?: (type: 'text' | 'number' | 'date') => void;
  className?: string;
}

const FUNCTIONS = [
  'SUM', 'COUNT', 'IF', 'CONCAT', 'DATE_DIFF', 'ROUND',
  'UPPER', 'LOWER', 'MIN', 'MAX', 'ABS', 'LEN', 'TRIM',
  'LEFT', 'RIGHT', 'MID', 'AND', 'OR', 'NOT', 'NOW', 'TODAY',
];

export function FormulaEditor({
  tableId,
  recordId,
  value,
  returnType = 'text',
  onChange,
  onReturnTypeChange,
  className,
}: FormulaEditorProps) {
  const [showFunctionPicker, setShowFunctionPicker] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const { data: validation } = trpc.formula.validate.useQuery(
    { expression: value },
    { enabled: value.length > 0 }
  );

  const { data: tableFields } = trpc.table.listFields.useQuery(
    { tableId },
    { enabled: !!tableId }
  );

  const { data: previewResult } = trpc.formula.preview.useQuery(
    { recordId: recordId ?? '', expression: value, returnType },
    { enabled: !!recordId && value.length > 0 && validation?.valid !== false }
  );

  const referencedFields = useMemo(() => extractFieldRefs(value), [value]);

  const insertText = useCallback((text: string) => {
    onChange(value + text);
  }, [value, onChange]);

  const insertFunction = useCallback((func: string) => {
    const templates: Record<string, string> = {
      SUM: 'SUM({})',
      COUNT: 'COUNT({})',
      IF: 'IF({} = "value", "true", "false")',
      CONCAT: 'CONCAT({}, {})',
      DATE_DIFF: 'DATE_DIFF({}, {}, "days")',
      ROUND: 'ROUND({}, 2)',
      UPPER: 'UPPER({})',
      LOWER: 'LOWER({})',
      MIN: 'MIN({}, {})',
      MAX: 'MAX({}, {})',
      ABS: 'ABS({})',
      LEN: 'LEN({})',
      TRIM: 'TRIM({})',
      LEFT: 'LEFT({}, 5)',
      RIGHT: 'RIGHT({}, 5)',
      MID: 'MID({}, 0, 5)',
      AND: 'AND({}, {})',
      OR: 'OR({}, {})',
      NOT: 'NOT({})',
      NOW: 'NOW()',
      TODAY: 'TODAY()',
    };
    insertText(templates[func] ?? `${func}()`);
    setShowFunctionPicker(false);
  }, [insertText]);

  const insertFieldRef = useCallback((fieldName: string) => {
    insertText(`{${fieldName}}`);
    setShowFieldPicker(false);
  }, [insertText]);

  const insertTemplate = useCallback((expression: string) => {
    onChange(expression);
    setShowTemplates(false);
  }, [onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setShowFunctionPicker(!showFunctionPicker); setShowFieldPicker(false); setShowTemplates(false); }}
          className="text-[11px]"
        >
          Functions
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setShowFieldPicker(!showFieldPicker); setShowFunctionPicker(false); setShowTemplates(false); }}
          className="text-[11px]"
        >
          Fields
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setShowTemplates(!showTemplates); setShowFunctionPicker(false); setShowFieldPicker(false); }}
          className="text-[11px]"
        >
          Templates
        </Button>
        <div className="ml-auto">
          <select
            value={returnType}
            onChange={(e) => onReturnTypeChange?.(e.target.value as 'text' | 'number' | 'date')}
            className="h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] text-[var(--fg)]"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
        </div>
      </div>

      {showFunctionPicker && (
        <div className="grid grid-cols-4 gap-1 p-2 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] max-h-32 overflow-y-auto">
          {FUNCTIONS.map((func) => (
            <button
              key={func}
              onClick={() => insertFunction(func)}
              className="px-2 py-1 text-[11px] font-mono text-[var(--fg)] hover:bg-[var(--primary-soft)] rounded text-left"
            >
              {func}
            </button>
          ))}
        </div>
      )}

      {showFieldPicker && tableFields && (
        <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] max-h-32 overflow-y-auto">
          {tableFields.length === 0 ? (
            <div className="text-[11px] text-[var(--fg-muted)]">No fields available</div>
          ) : (
            <div className="space-y-0.5">
              {tableFields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => insertFieldRef(field.name)}
                  className="w-full px-2 py-1 text-[11px] text-[var(--fg)] hover:bg-[var(--primary-soft)] rounded text-left flex items-center gap-2"
                >
                  <span className="font-mono text-[var(--fg-muted)]">{field.name}</span>
                  <span className="text-[var(--fg-muted)]">({field.type})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showTemplates && (
        <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] max-h-32 overflow-y-auto">
          <div className="space-y-0.5">
            {FORMULA_TEMPLATES.map((template) => (
              <button
                key={template.label}
                onClick={() => insertTemplate(template.expression)}
                className="w-full px-2 py-1 text-[11px] text-left hover:bg-[var(--primary-soft)] rounded"
              >
                <span className="text-[var(--fg)]">{template.label}</span>
                <span className="text-[var(--fg-muted)] ml-2 font-mono">{template.expression}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='e.g., CONCAT({Title}, " - ", {Status})'
        className={cn(
          'w-full h-20 rounded-[var(--radius-sm)] border bg-[var(--bg)] px-2 py-1 text-[12px] text-[var(--fg)] resize-none font-mono',
          validation?.valid === false
            ? 'border-red-500 focus:border-red-500'
            : 'border-[var(--border)] focus:border-[var(--primary)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]'
        )}
      />

      {validation && !validation.valid && validation.error && (
        <div className="text-[11px] text-red-500 flex items-center gap-1">
          <span className="font-medium">Error:</span> {validation.error}
        </div>
      )}

      {referencedFields.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {referencedFields.map((ref) => (
            <span
              key={ref}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--primary-soft)] text-[var(--primary)]"
            >
              {ref}
            </span>
          ))}
        </div>
      )}

      {recordId && value && validation?.valid !== false && previewResult && (
        <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-0.5">
            Preview
          </div>
          <div className="text-[12px] text-[var(--fg)] font-mono">
            {previewResult.error ? (
              <span className="text-red-500">{previewResult.error}</span>
            ) : (
              String(previewResult.value ?? '')
            )}
          </div>
        </div>
      )}
    </div>
  );
}
