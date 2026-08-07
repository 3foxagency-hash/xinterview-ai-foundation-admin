'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function SegmentedControl({ options, value, onChange, id }: SegmentedControlProps) {
  const groupId = id ?? React.useId();
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (idx + 1) % options.length;
      refs.current[next]?.focus();
      onChange(options[next].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (idx - 1 + options.length) % options.length;
      refs.current[prev]?.focus();
      onChange(options[prev].value);
    }
  };

  return (
    <div
      role="radiogroup"
      id={groupId}
      className="inline-flex w-full rounded-md border border-border bg-muted-bg p-1"
    >
      {options.map((opt, idx) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => { refs.current[idx] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'flex h-8 flex-1 items-center justify-center rounded-sm px-3 text-body font-medium transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
              selected
                ? 'bg-surface text-heading shadow-sm'
                : 'text-muted hover:text-bodyText'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
