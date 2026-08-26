'use client';

import * as React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, countryInfo, DEFAULT_COUNTRY } from '@/lib/interview/country-codes';

type FlagComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;
const FlagMap = Flags as unknown as Record<string, FlagComponent>;

interface CountryCodeSelectProps {
  value: string; // ISO country code, e.g. "US"
  onChange: (countryCode: string) => void;
}

export function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const rootRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const selected = countryInfo(value) ?? countryInfo(DEFAULT_COUNTRY)!;
  const SelectedFlag = FlagMap[selected.code];

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase() === q,
    );
  }, [query]);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      // Focus after the popover mounts.
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const handleSelect = (countryCode: string) => {
    onChange(countryCode);
    setOpen(false);
  };

  return (
    <div className="iv-country-select" ref={rootRef}>
      <button
        type="button"
        className="iv-country-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${selected.name} ${selected.dialCode}`}
      >
        {SelectedFlag && <SelectedFlag className="iv-phone-flag" aria-hidden="true" />}
        <span>{selected.dialCode}</span>
        <ChevronDown size={12} strokeWidth={1.5} className="iv-country-trigger-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="iv-country-popover" role="listbox" aria-label="Select country code">
          <div className="iv-country-search-row">
            <Search size={14} strokeWidth={1.5} className="iv-country-search-icon" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              className="iv-country-search-input"
              placeholder="Search country or code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="iv-country-list">
            {filtered.length === 0 && (
              <div className="iv-country-empty">No matches</div>
            )}
            {filtered.map((c) => {
              const Flag = FlagMap[c.code];
              return (
                <button
                  key={c.code}
                  type="button"
                  role="option"
                  aria-selected={c.code === selected.code}
                  className={`iv-country-option ${c.code === selected.code ? 'active' : ''}`}
                  onClick={() => handleSelect(c.code)}
                >
                  {Flag && <Flag className="iv-phone-flag" aria-hidden="true" />}
                  <span className="iv-country-option-name">{c.name}</span>
                  <span className="iv-country-option-code">{c.dialCode}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
