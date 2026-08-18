'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthSelectOption {
  value: string;
  label: string;
}

export interface AuthSelectProps {
  label?: string;
  description?: string;
  error?: string;
  options: AuthSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export function AuthSelect({
  label,
  description,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  id,
  disabled,
  searchable = false,
}: AuthSelectProps) {
  const generatedId = id ?? React.useId();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listboxId = `${generatedId}-listbox`;
  const errorId = `${generatedId}-error`;

  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selectedOption = options.find((o) => o.value === value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label
          htmlFor={generatedId}
          className="mb-2 block text-[13px] font-medium text-heading"
        >
          {label}
        </label>
      )}
      {description && (
        <p className="mb-2 text-caption text-muted">{description}</p>
      )}
      <button
        ref={triggerRef}
        id={generatedId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onKeyDown={handleKeyDown}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-lg border bg-surface px-4 py-2 text-body text-heading transition-all duration-200',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ?'border-error'
            : 'border-border-strong hover:border-border-hover'
        )}
      >
        <span className={cn(!selectedOption && 'text-muted')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          className={cn('text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            id={listboxId}
            onKeyDown={handleListKeyDown}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface shadow-lg"
          >
            {searchable && (
              <div className="sticky top-0 border-b border-border bg-surface p-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-body text-heading placeholder:text-muted"
                  autoFocus
                />
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-body-sm text-muted">No results</div>
            ) : (
              filtered.map((opt) => {
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
                      setQuery('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onChange(opt.value);
                        setOpen(false);
                        setQuery('');
                        triggerRef.current?.focus();
                      }
                    }}
                    className={cn(
                      'flex cursor-pointer items-center justify-between px-4 py-2.5 text-body text-heading transition-colors hover:bg-card-hover focus:bg-card-hover focus:outline-none',
                      selected && 'bg-active-menu-bg'
                    )}
                  >
                    <span>{opt.label}</span>
                    {selected && (
                      <Check size={16} strokeWidth={2} className="text-primary" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {error && (
        <div id={errorId} role="alert" className="mt-2 flex items-center gap-1.5 text-[13px] text-error">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
