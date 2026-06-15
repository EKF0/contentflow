'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[12px] font-medium text-[var(--fg-weak)] tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-[var(--row-h)] w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[13px] text-[var(--fg)]',
            'placeholder:text-[var(--fg-muted)]',
            'focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
            className,
          )}
          {...props}
        />
        {error && (
          <span className="text-[11px] text-red-500">{error}</span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input, type InputProps };
