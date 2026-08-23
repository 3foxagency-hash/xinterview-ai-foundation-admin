'use client';

import * as React from 'react';

interface UnderlineFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
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
    <div className="iv-field">
      <label htmlFor={fieldId} className="iv-field-label">
        {label}
        {required && (
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
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="iv-field-input"
        />
      </div>
      {error && (
        <span className="iv-field-error" role="alert" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
});
