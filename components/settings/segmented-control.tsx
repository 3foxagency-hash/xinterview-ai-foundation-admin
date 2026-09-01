'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  /** Overall control height — 'md' (default, 40px) matches settings-page controls; 'lg' (48px) matches the h-12 inputs/selects used in the job wizard. */
  size?: 'md' | 'lg';
}

export function SegmentedControl({ options, value, onChange, id, size = 'md' }: SegmentedControlProps) {
  const generatedId = React.useId();
  const groupId = id ?? generatedId;
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
      className={cn(
        'inline-flex w-full items-center rounded-md border border-border bg-muted-bg p-1',
        size === 'lg' ? 'h-12' : 'h-10'
      )}
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
              'flex h-full flex-1 items-center justify-center rounded-sm px-3 text-body font-medium transition-all',
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
