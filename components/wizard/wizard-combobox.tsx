'use client';

import * as React from 'react';
import { ChevronDown, Check, Search, AlertCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface WizardComboboxProps {
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  icon?: LucideIcon;
  description?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
}

/**
 * Searchable select for the job wizard. The timezone and language lists are
 * long enough that a plain dropdown is unusable, so this filters as you type
 * and supports full keyboard navigation.
 */
export function WizardCombobox({
  label,
  options,
  value,
  onChange,
  required,
  error,
  icon: Icon,
  description,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  id,
}: WizardComboboxProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const descId = `${fieldId}-desc`;
  const listboxId = `${fieldId}-listbox`;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const optionRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  // Open the list scrolled to whatever is currently selected.
  React.useEffect(() => {
    if (!open) return;
    const idx = filtered.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [open, value, filtered]);

  React.useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  }, []);

  const commit = (opt: ComboboxOption) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) commit(opt);
    } else if (e.key === 'Tab') {
      close();
    }
  };

  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="mb-2 block text-body-sm font-semibold text-heading">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {description && (
        <p id={descId} className="mb-2 text-body-sm text-muted">
          {description}
        </p>
      )}

      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-active-menu-bg">
            <Icon size={16} strokeWidth={1.5} className="text-primary" />
          </div>
        )}
        <button
          ref={triggerRef}
          id={fieldId}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-haspopup="listbox"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : description ? descId : undefined}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            'flex h-12 w-full items-center rounded-md border bg-surface text-left text-body transition-all',
            Icon ? 'pl-12 pr-3' : 'px-3',
            error ? 'border-error' : 'border-border-strong hover:border-border-hover'
          )}
        >
          <span className={cn('truncate', selected ? 'text-heading' : 'text-muted')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={cn('ml-auto shrink-0 text-muted transition-transform', open && 'rotate-180')}
          />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={close} aria-hidden />
            <div
              ref={listRef}
              className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-lg"
              onKeyDown={onListKeyDown}
            >
              <div className="border-b border-border p-2">
                <div className="relative">
                  <Search
                    size={16}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(0);
                    }}
                    placeholder={searchPlaceholder}
                    aria-label={`Search ${label.toLowerCase()}`}
                    aria-controls={listboxId}
                    autoFocus
                    className="h-9 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-body text-heading placeholder:text-muted"
                  />
                </div>
              </div>

              <div id={listboxId} role="listbox" aria-label={label} className="max-h-60 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-center text-body-sm text-muted">
                    No matches for &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  filtered.map((opt, i) => {
                    const isSelected = opt.value === value;
                    const isActive = i === activeIndex;
                    return (
                      <div
                        key={opt.value}
                        ref={(el) => {
                          optionRefs.current[i] = el;
                        }}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => commit(opt)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-body transition-colors',
                          isActive && 'bg-card-hover',
                          isSelected && 'bg-active-menu-bg'
                        )}
                      >
                        <span className={cn('truncate', isSelected ? 'text-primary' : 'text-heading')}>
                          {opt.label}
                        </span>
                        {isSelected && <Check size={16} className="shrink-0 text-primary" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div id={errorId} role="alert" className="mt-1.5 flex items-center gap-1.5 text-body-sm text-error">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
