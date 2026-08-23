'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';
import { strings } from '@/lib/interview/strings';

interface UnderlineFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  locked?: boolean;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  leftSlot?: React.ReactNode;
  onBlur?: () => void;
}

export const UnderlineField = React.forwardRef<
  HTMLInputElement,
  UnderlineFieldProps
>(function UnderlineField(
  {
    label,
    name,
    type = 'text',
    value,
    onChange,
    required,
    locked,
    error,
    placeholder,
    autoComplete,
    leftSlot,
    onBlur,
  },
  ref,
) {
  const fieldId = `iv-field-${name}`;
  const errorId = `${fieldId}-error`;

  return (
    <div className={`iv-field ${locked ? 'iv-field-locked' : ''}`}>
      <label htmlFor={fieldId} className="iv-field-label">
        {label}
        {required && !locked && (
          <span aria-hidden="true" style={{ marginLeft: '2px' }}>
            *
          </span>
        )}
      </label>
      <div className="iv-field-row">
        {leftSlot && <div className="iv-phone-code">{leftSlot}</div>}
        <input
          ref={ref}
          id={fieldId}
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={locked}
          required={required && !locked}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="iv-field-input"
        />
        {locked && (
          <Lock
            size={14}
            strokeWidth={1.5}
            className="iv-field-lock-icon"
            aria-label={strings.fieldLocked}
          />
        )}
      </div>
      {error && (
        <span className="iv-field-error" role="alert" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
});
