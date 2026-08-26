'use client';

import * as React from 'react';

/**
 * Detects the candidate's country from their IP address (no permission
 * prompt, unlike the browser Geolocation API) so the phone field can
 * default to their real dial code and flag instead of a hardcoded +1.
 * Resolves to null on any failure — callers should fall back to a
 * sensible default rather than blocking on this.
 */
export function useDetectedCountry(): string | null {
  const [country, setCountry] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    fetch('https://ipapi.co/json/')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { country_code?: string } | null) => {
        if (!cancelled && data?.country_code) {
          setCountry(data.country_code);
        }
      })
      .catch(() => {
        // Silently keep the default — this is a nice-to-have, not required.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return country;
}
