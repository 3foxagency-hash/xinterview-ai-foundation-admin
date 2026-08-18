'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioCardGroupProps {
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  id?: string;
}

export function RadioCardGroup({
  options,
  value,
  onChange,
  label,
  error,
  id,
}: RadioCardGroupProps) {
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
    <div className="w-full">
      {label && (
        <span className="mb-2 block text-[13px] font-medium text-heading">{label}</span>
      )}
      <div
        role="radiogroup"
        aria-label={label}
        aria-invalid={!!error}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
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
                'relative flex flex-col items-start rounded-lg border px-3 py-3 text-left transition-all',
                selected
                  ? 'border-primary bg-active-menu-bg'
                  : 'border-border-strong bg-surface hover:border-border-hover'
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${groupId}-check`}
                  className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check size={10} strokeWidth={3} className="text-primary-foreground" />
                </motion.span>
              )}
              <span
                className={cn(
                  'text-[14px] font-semibold transition-colors',
                  selected ? 'text-primary' : 'text-heading'
                )}
              >
                {opt.label}
              </span>
              {opt.description && (
                <span className="mt-0.5 text-caption text-muted">{opt.description}</span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-error">
          {error}
        </p>
      )}
    </div>
  );
}
