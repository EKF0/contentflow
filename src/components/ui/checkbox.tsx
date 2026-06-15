'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="inline-flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            'h-4 w-4 rounded-[3px] border-[1.5px] border-[var(--border)] appearance-none cursor-pointer',
            'checked:bg-[var(--primary)] checked:border-[var(--primary)]',
            'checked:bg-[url("data:image/svg+xml,%3Csvg width=\'10\' height=\'8\' viewBox=\'0 0 10 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 4L3.5 6.5L9 1\' stroke=\'white\' stroke-width=\'1.8\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")] checked:bg-no-repeat checked:bg-center',
            'transition-all duration-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1',
            className,
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-[13px] text-[var(--fg)] cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox, type CheckboxProps };
