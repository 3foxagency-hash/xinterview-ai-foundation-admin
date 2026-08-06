'use client';

import * as React from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyFieldProps {
  label: string;
  value: string;
  helper?: string;
  id?: string;
}

/** Read-only value with a copy button — used for the careers embed code and URL. */
export function CopyField({ label, value, helper, id }: CopyFieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to the clipboard');
    }
  };

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-body-sm font-medium text-heading">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={fieldId}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-muted-bg px-3 font-mono text-body-sm text-heading focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-border-strong px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {helper && <p className="mt-1.5 text-body-sm text-muted">{helper}</p>}
    </div>
  );
}
