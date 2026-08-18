'use client';

import * as React from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countryCodes, type CountryCode } from '@/lib/constants/country-codes';

/** ISO 3166-1 alpha-2 → regional-indicator emoji flag. */
function flagFor(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const DEFAULT_COUNTRY = 'US';

/**
 * Splits a stored E.164-ish value ("+91 98765 43210") into a country and the
 * national part. Longest dial code wins so "+1-242" beats "+1".
 */
function parseValue(value: string): { country: CountryCode; national: string } {
  const fallback =
    countryCodes.find((c) => c.code === DEFAULT_COUNTRY) ?? countryCodes[0];
  const trimmed = (value ?? '').trim();
  if (!trimmed.startsWith('+')) return { country: fallback, national: trimmed };

  const compact = trimmed.replace(/[\s-]/g, '');
  let best: CountryCode | null = null;
  for (const c of countryCodes) {
    const dial = c.dialCode.replace(/[\s-]/g, '');
    if (!compact.startsWith(dial)) continue;
    const bestDial = best?.dialCode.replace(/[\s-]/g, '') ?? '';
    // Longest dial code wins ("+1-242" beats "+1"). On an exact tie prefer the
    // default country, so a plain "+1" shows US rather than whichever country
    // happens to come first alphabetically.
    if (
      !best ||
      dial.length > bestDial.length ||
      (dial.length === bestDial.length && c.code === DEFAULT_COUNTRY)
    ) {
      best = c;
    }
  }
  if (!best) return { country: fallback, national: trimmed };
  const dial = best.dialCode.replace(/[\s-]/g, '');
  return { country: best, national: compact.slice(dial.length) };
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  error,
  id,
  placeholder = 'Enter phone number',
}: PhoneInputProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const listboxId = `${fieldId}-countries`;

  const parsed = React.useMemo(() => parseValue(value), [value]);
  const [country, setCountry] = React.useState<CountryCode>(parsed.country);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Keep the selected country in step when the value changes from outside
  // (initial load, Discard).
  React.useEffect(() => {
    setCountry(parsed.country);
  }, [parsed.country]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countryCodes;
    return countryCodes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [query]);

  const commitCountry = (c: CountryCode) => {
    setCountry(c);
    setOpen(false);
    setQuery('');
    onChange(`${c.dialCode} ${parsed.national}`.trim());
    triggerRef.current?.focus();
  };

  const onNationalChange = (national: string) => {
    const digits = national.replace(/[^\d\s-]/g, '');
    onChange(`${country.dialCode} ${digits}`.trim());
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          'flex h-10 w-full items-center rounded-md border bg-surface transition-all focus-within:ring-[3px] focus-within:ring-primary/[0.12]',
          error ? 'border-error' : 'border-border-strong focus-within:border-primary hover:border-border-hover'
        )}
      >
        {/* Country selector */}
        <div className="relative shrink-0">
          <button
            ref={triggerRef}
            type="button"
            aria-label={`Country code: ${country.name} ${country.dialCode}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            onClick={() => setOpen((o) => !o)}
            className="flex h-full items-center gap-1.5 rounded-l-md border-r border-border px-2.5 text-body-sm text-heading transition-colors hover:bg-card-hover"
          >
            <span aria-hidden className="text-[16px] leading-none">
              {flagFor(country.code)}
            </span>
            <span className="tabular-nums">{country.dialCode}</span>
            <ChevronDown size={14} className={cn('text-muted transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
              <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[280px] overflow-hidden rounded-md border border-border bg-surface shadow-lg">
                <div className="border-b border-border p-2">
                  <div className="relative">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search country or code"
                      aria-label="Search country"
                      autoFocus
                      className="h-8 w-full rounded-md border border-border-strong bg-surface pl-8 pr-2 text-body-sm text-heading placeholder:text-muted"
                    />
                  </div>
                </div>
                <div id={listboxId} role="listbox" className="max-h-56 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-3 text-center text-body-sm text-muted">No matches</p>
                  ) : (
                    filtered.map((c) => {
                      const selected = c.code === country.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => commitCountry(c)}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm transition-colors hover:bg-card-hover',
                            selected && 'bg-active-menu-bg'
                          )}
                        >
                          <span aria-hidden className="text-[16px] leading-none">
                            {flagFor(c.code)}
                          </span>
                          <span className={cn('flex-1 truncate', selected ? 'text-primary' : 'text-heading')}>
                            {c.name}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted">{c.dialCode}</span>
                          {selected && <Check size={14} className="shrink-0 text-primary" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <input
          id={fieldId}
          type="tel"
          inputMode="tel"
          value={parsed.national}
          onChange={(e) => onNationalChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 rounded-r-md bg-transparent px-3 text-body text-heading placeholder:text-muted"
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
