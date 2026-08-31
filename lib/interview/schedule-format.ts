/** Shared formatting for the call-scheduling flow (scheduling screen
 *  and the call-status screen that reads the same choice back). Kept
 *  in one place so "Thursday 4 September" / "09:30" / the timezone
 *  label are computed identically everywhere they're shown, rather
 *  than three near-copies drifting apart. */

/** Date → "Thursday 4 September" — locale-independent day/month order
 *  and no comma, built from three separate Intl calls rather than one
 *  locale string (ICU's en-GB output for this exact shape isn't
 *  consistent about the comma across environments). */
export function formatScheduleDateLabel(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday} ${date.getDate()} ${month}`;
}

/** (9, 30) → "09:30" */
export function formatTimeLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** "Europe/Amsterdam" → "Europe/Amsterdam · CEST (GMT+2)" — falls back
 *  to a single value when the abbreviation and offset are identical
 *  (some ICU builds have no named abbreviation for a zone and resolve
 *  'short' to the offset too, which would otherwise print the
 *  redundant "GMT+2 (GMT+2)"). */
export function formatTimezoneLabel(tz: string): string {
  const region = tz.replace(/_/g, ' ');
  const now = new Date();
  const abbr =
    new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? '';
  const offset =
    new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? '';
  if (!abbr || abbr === offset) return `${region} · ${offset || abbr}`;
  return `${region} · ${abbr} (${offset})`;
}

/** "Europe/Amsterdam" → "CEST" (or "GMT+2" on ICU builds with no named
 *  abbreviation for the zone) — just the abbreviation half of the
 *  label above, for places that only need that part. */
export function formatTimezoneAbbr(tz: string): string {
  return (
    new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value ?? tz
  );
}
