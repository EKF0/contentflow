'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';

interface LookupFieldProps {
  recordId: string;
  fieldName: string;
  linkedFieldId: string;
  className?: string;
}

export function LookupField({
  recordId,
  fieldName,
  linkedFieldId,
  className,
}: LookupFieldProps) {
  const { data: linkedRecords, isLoading } = trpc.link.getLinkedRecords.useQuery(
    { recordId, fieldName },
    { enabled: !!recordId && !!fieldName }
  );

  const displayValue = useMemo(() => {
    if (!linkedRecords || linkedRecords.length === 0) return '';

    const firstRecord = linkedRecords[0];
    const cell = firstRecord.cellValues?.find((c: { fieldId: string; value: unknown }) => c.fieldId === linkedFieldId);
    if (!cell) return '';

    const val = cell.value;
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  }, [linkedRecords, linkedFieldId]);

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
