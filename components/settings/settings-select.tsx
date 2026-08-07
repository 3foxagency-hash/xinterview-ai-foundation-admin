'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  description?: string;
}

export function SettingsSelect({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  id,
  description,
}: SettingsSelectProps) {
  const generatedId = id ?? React.useId();
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const errorId = `${generatedId}-error`;
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative w-full">
      {label && (
        <label htmlFor={generatedId} className="mb-1.5 block text-body-sm font-medium text-heading">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        id={generatedId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-body transition-all',
          'hover:border-border-strong',
          error ? 'border-error' : 'border-border',
          !selectedOption && 'text-muted'
        )}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} strokeWidth={1.5} className={cn('text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {description && !error && (
        <p className="mt-1 text-body-sm text-muted">{description}</p>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
              }
            }}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface shadow-lg"
          >
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={selected}
                  tabIndex={0}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onChange(opt.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer items-center justify-between px-3 py-2 text-body transition-colors hover:bg-card-hover focus:bg-card-hover focus:outline-none',
                    selected && 'bg-active-menu-bg'
                  )}
                >
                  <span className={selected ? 'text-primary' : 'text-heading'}>{opt.label}</span>
                  {selected && <Check size={14} className="text-primary" />}
                </div>
              );
            })}
          </div>
        </>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
