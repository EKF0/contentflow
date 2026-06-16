'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';

interface RollupFieldProps {
  recordId: string;
  fieldName: string;
  linkedFieldId: string;
  aggregation: 'count' | 'sum' | 'min' | 'max' | 'list';
  className?: string;
}

function toNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (Array.isArray(val)) return val.length;
  return 0;
}

export function RollupField({
  recordId,
  fieldName,
  linkedFieldId,
  aggregation,
  className,
}: RollupFieldProps) {
  const { data: linkedRecords, isLoading } = trpc.link.getLinkedRecords.useQuery(
    { recordId, fieldName },
    { enabled: !!recordId && !!fieldName }
  );

  const displayValue = useMemo(() => {
    if (!linkedRecords || linkedRecords.length === 0) return '';

    const values = linkedRecords
      .map((record) => {
        const cell = record.cellValues?.find((c: { fieldId: string; value: unknown }) => c.fieldId === linkedFieldId);
        return cell?.value;
      })
      .filter((v) => v !== null && v !== undefined);

    if (values.length === 0) return '';

    switch (aggregation) {
      case 'count':
        return String(values.length);
      case 'sum': {
        const sum = values.reduce((acc, val) => acc + toNumber(val), 0);
        return String(sum);
      }
      case 'min': {
        const nums = values.map(toNumber);
        return String(Math.min(...nums));
      }
      case 'max': {
        const nums = values.map(toNumber);
        return String(Math.max(...nums));
      }
      case 'list': {
        const strings = values.map((v) => {
          if (typeof v === 'string') return v;
          if (Array.isArray(v)) return v.join(', ');
          return String(v ?? '');
        });
        return strings.join(', ');
      }
      default:
        return '';
    }
  }, [linkedRecords, linkedFieldId, aggregation]);

  if (isLoading) {
    return (
      <div className={cn('h-[var(--row-h)] flex items-center', className)}>
        <span className="text-[12px] text-[var(--fg-muted)]">Loading...</span>
      </div>
    );
  }

  return (
    <div className={cn('h-[var(--row-h)] flex items-center', className)}>
      <span className="text-[13px] text-[var(--fg)] truncate">
        {displayValue || <span className="text-[var(--fg-muted)]">—</span>}
      </span>
    </div>
  );
}
