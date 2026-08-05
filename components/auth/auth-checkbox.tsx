'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthCheckboxProps {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function AuthCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
  className,
}: AuthCheckboxProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          checked
            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
            : 'border-border-strong bg-background hover:border-primary/50'
        )}
      >
        {checked && (
          <Check size={13} strokeWidth={3} className="animate-in fade-in zoom-in duration-150" />
        )}
      </button>
      <label
        htmlFor={id}
        className="text-[13px] text-bodyText cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
}
