import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { resolveInitialTimezone, getCompanyDefaultTimezone } from './timezones';

describe('resolveInitialTimezone — §5.1 priority order', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefers a saved job timezone over everything else', () => {
    const result = resolveInitialTimezone({ savedTimezone: 'Asia/Tokyo' });
    expect(result).toEqual({ timezone: 'Asia/Tokyo', source: 'saved' });
  });

  it('ignores a saved timezone that is not in the curated list', () => {
    // Falls through to device detection rather than trusting garbage input.
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () => ({ resolvedOptions: () => ({ timeZone: 'Asia/Singapore' }) }) as unknown as Intl.DateTimeFormat
    );
    const result = resolveInitialTimezone({ savedTimezone: 'Not/A_Real_Zone' });
    expect(result).toEqual({ timezone: 'Asia/Singapore', source: 'detected' });
  });

  it('falls back to the device zone when there is no saved value', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) }) as unknown as Intl.DateTimeFormat
    );
    const result = resolveInitialTimezone({ savedTimezone: null });
    expect(result).toEqual({ timezone: 'America/New_York', source: 'detected' });
  });

  it('falls back to the company default when the device zone is unsupported', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () => ({ resolvedOptions: () => ({ timeZone: 'Not/A_Real_Zone' }) }) as unknown as Intl.DateTimeFormat
    );
    const result = resolveInitialTimezone({ savedTimezone: null, companyTimezone: 'Asia/Tokyo' });
    expect(result).toEqual({ timezone: 'Asia/Tokyo', source: 'company' });
  });

  it('falls back to GMT when detection fails and the company default is also unsupported', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl unsupported');
    });
    const result = resolveInitialTimezone({ savedTimezone: null, companyTimezone: 'Not/A_Real_Zone' });
    expect(result).toEqual({ timezone: 'Europe/London', source: 'company' });
  });

  it('falls through silently (no throw) when Intl detection itself throws', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl unsupported');
    });
    expect(() => resolveInitialTimezone({ savedTimezone: null })).not.toThrow();
  });

  it('uses the real company default when none is passed explicitly', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl unsupported');
    });
    const result = resolveInitialTimezone({ savedTimezone: null });
    expect(result.timezone).toBe(getCompanyDefaultTimezone());
    expect(result.source).toBe('company');
  });
});

// Exercises the exact ref-guarded "detect once, never re-detect over a
// manual choice" pattern job-details-form.tsx uses around this resolver —
// mirrored here in a tiny standalone component so it's testable without
// rendering the full form and its many child dependencies.
function TimezoneField({ savedTimezone }: { savedTimezone: string | null }) {
  const [timezone, setTimezone] = React.useState(savedTimezone ?? getCompanyDefaultTimezone());
  const [source, setSource] = React.useState<'saved' | 'detected' | 'company' | 'manual'>(
    savedTimezone ? 'saved' : 'company'
  );
  const detectedOnceRef = React.useRef(false);

  React.useEffect(() => {
    if (detectedOnceRef.current || savedTimezone) return;
    detectedOnceRef.current = true;
    const result = resolveInitialTimezone({ savedTimezone: null });
    setTimezone(result.timezone);
    setSource(result.source === 'saved' ? 'company' : result.source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return React.createElement(
    'div',
    { 'data-testid': 'timezone-field' },
    React.createElement('span', { 'data-testid': 'timezone-value' }, timezone),
    React.createElement('span', { 'data-testid': 'timezone-source' }, source),
    React.createElement(
      'button',
      {
        onClick: () => {
          setTimezone('Asia/Dubai');
          setSource('manual');
        },
      },
      'set manual'
    )
  );
}

describe('resolveInitialTimezone — manual override is never re-detected (component-level)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects once on mount, then a manual choice survives a re-render untouched', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) }) as unknown as Intl.DateTimeFormat
    );

    const { getByTestId, getByText, rerender } = render(
      React.createElement(TimezoneField, { savedTimezone: null })
    );

    expect(getByTestId('timezone-value').textContent).toBe('America/New_York');
    expect(getByTestId('timezone-source').textContent).toBe('detected');

    act(() => {
      getByText('set manual').click();
    });
    expect(getByTestId('timezone-value').textContent).toBe('Asia/Dubai');
    expect(getByTestId('timezone-source').textContent).toBe('manual');

    // Re-rendering (e.g. an unrelated prop/state change elsewhere in the
    // form) must not re-run detection and clobber the manual choice.
    rerender(React.createElement(TimezoneField, { savedTimezone: null }));
    expect(getByTestId('timezone-value').textContent).toBe('Asia/Dubai');
    expect(getByTestId('timezone-source').textContent).toBe('manual');
  });

  it('never runs detection at all when a saved job timezone exists', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) }) as unknown as Intl.DateTimeFormat
    );

    const { getByTestId } = render(React.createElement(TimezoneField, { savedTimezone: 'Asia/Tokyo' }));

    expect(getByTestId('timezone-value').textContent).toBe('Asia/Tokyo');
    expect(getByTestId('timezone-source').textContent).toBe('saved');
  });
});
