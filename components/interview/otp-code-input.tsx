'use client';

import * as React from 'react';

interface OtpCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Six single-character inputs sitting on a bottom rule, not a boxed
 * field. Digit presence and native :focus drive every visual state
 * (see the CSS) rather than a separately tracked "which cell is
 * active" flag, so the styling always matches wherever the candidate
 * actually has focus — including after a click into an arbitrary cell.
 */
export function OtpCodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  disabled,
  autoFocus,
}: OtpCodeInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('');

  React.useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string) => {
    const joined = next.slice(0, length);
    onChange(joined);
    if (joined.length === length) onComplete?.(joined);
  };

  const writeAt = (index: number, chars: string[]) => {
    const next = value.padEnd(index, ' ').split('');
    chars.forEach((c, i) => {
      next[index + i] = c;
    });
    commit(next.join('').replace(/ /g, '').slice(0, length));
    const landingIndex = Math.min(index + chars.length, length - 1);
    inputRefs.current[landingIndex]?.focus();
  };

  const handleChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      const next = value.split('');
      next[index] = '';
      commit(next.join(''));
      return;
    }
    writeAt(index, raw.split(''));
  };

  const handleKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = value.split('');
      if (next[index]) {
        next[index] = '';
        commit(next.join(''));
      } else if (index > 0) {
        next[index - 1] = '';
        commit(next.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!text) return;
    e.preventDefault();
    writeAt(index, text.split(''));
  };

  return (
    <div
      className={`iv-otp-row${error ? ' iv-otp-row-error' : ''}`}
      role="group"
      aria-label="Verification code"
    >
      {Array.from({ length }).map((_, i) => (
        <div key={i} className="iv-otp-cell">
          <input
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            pattern="[0-9]*"
            maxLength={1}
            value={digits[i] ?? ''}
            onChange={handleChange(i)}
            onKeyDown={handleKeyDown(i)}
            onPaste={handlePaste(i)}
            disabled={disabled}
            aria-label={`Digit ${i + 1} of ${length}`}
            className={`iv-otp-digit${digits[i] ? ' iv-otp-digit-filled' : ''}`}
          />
        </div>
      ))}
    </div>
  );
}
