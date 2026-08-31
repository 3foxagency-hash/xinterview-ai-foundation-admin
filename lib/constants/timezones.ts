export type Timezone = {
  key: string;
  label: string;
};

export const timezones: Timezone[] = [
  { key: 'Etc/GMT+12', label: '(GMT-12:00) International Date Line West' },
  { key: 'Pacific/Midway', label: '(GMT-11:00) Midway Island, Samoa' },
  { key: 'Pacific/Honolulu', label: '(GMT-10:00) Hawaii' },
  { key: 'US/Alaska', label: '(GMT-09:00) Alaska' },
  { key: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US & Canada)' },
  { key: 'America/Tijuana', label: '(GMT-08:00) Tijuana, Baja California' },
  { key: 'US/Arizona', label: '(GMT-07:00) Arizona' },
  { key: 'America/Chihuahua', label: '(GMT-07:00) Chihuahua, La Paz, Mazatlan' },
  { key: 'US/Mountain', label: '(GMT-07:00) Mountain Time (US & Canada)' },
  { key: 'America/Chicago', label: '(GMT-06:00) Central Time (US & Canada)' },
  { key: 'America/Mexico_City', label: '(GMT-06:00) Guadalajara, Mexico City, Monterrey' },
  { key: 'Canada/Saskatchewan', label: '(GMT-06:00) Saskatchewan' },
  { key: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { key: 'America/Bogota', label: '(GMT-05:00) Bogota, Lima, Quito, Rio Branco' },
  { key: 'America/Caracas', label: '(GMT-04:00) Caracas' },
  { key: 'America/Halifax', label: '(GMT-04:00) Atlantic Time (Canada)' },
  { key: 'America/Santiago', label: '(GMT-04:00) Santiago' },
  { key: 'America/St_Johns', label: '(GMT-03:30) Newfoundland' },
  { key: 'America/Sao_Paulo', label: '(GMT-03:00) Brasilia' },
  { key: 'America/Argentina/Buenos_Aires', label: '(GMT-03:00) Buenos Aires, Georgetown' },
  { key: 'Atlantic/South_Georgia', label: '(GMT-02:00) Mid-Atlantic' },
  { key: 'Atlantic/Azores', label: '(GMT-01:00) Azores' },
  { key: 'Atlantic/Cape_Verde', label: '(GMT-01:00) Cape Verde Is.' },
  { key: 'Europe/London', label: '(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London' },
  { key: 'Europe/Berlin', label: '(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' },
  { key: 'Europe/Paris', label: '(GMT+01:00) Brussels, Copenhagen, Madrid, Paris' },
  { key: 'Europe/Sofia', label: '(GMT+02:00) Athens, Bucharest, Istanbul' },
  { key: 'Asia/Jerusalem', label: '(GMT+02:00) Jerusalem' },
  { key: 'Asia/Kuwait', label: '(GMT+03:00) Kuwait, Riyadh, Baghdad' },
  { key: 'Europe/Moscow', label: '(GMT+03:00) Moscow, St. Petersburg, Volgograd' },
  { key: 'Asia/Tehran', label: '(GMT+03:30) Tehran' },
  { key: 'Asia/Dubai', label: '(GMT+04:00) Abu Dhabi, Muscat' },
  { key: 'Asia/Karachi', label: '(GMT+05:00) Karachi, Dushanbe, Malé, Tashkent' },
  { key: 'Asia/Calcutta', label: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { key: 'Asia/Kathmandu', label: '(GMT+05:45) Kathmandu' },
  { key: 'Asia/Dhaka', label: '(GMT+06:00) Dhaka, Thimphu' },
  { key: 'Asia/Bangkok', label: '(GMT+07:00) Bangkok, Hanoi, Jakarta' },
  { key: 'Asia/Shanghai', label: '(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi' },
  { key: 'Asia/Singapore', label: '(GMT+08:00) Kuala Lumpur, Singapore' },
  { key: 'Asia/Tokyo', label: '(GMT+09:00) Osaka, Sapporo, Tokyo' },
  { key: 'Australia/Sydney', label: '(GMT+10:00) Canberra, Melbourne, Sydney' },
  { key: 'Pacific/Auckland', label: '(GMT+12:00) Auckland, Wellington' },
  { key: 'Pacific/Fiji', label: '(GMT+12:00) Fiji, Kamchatka, Marshall Is.' },
  { key: 'Pacific/Tongatapu', label: "(GMT+13:00) Nuku'alofa" },
];

const TIMEZONE_KEYS = new Set(timezones.map((t) => t.key));

/**
 * The browser's IANA zone, but only when it is one we actually offer.
 * Falls back to GMT so the select never opens with an unmatched value.
 */
export function getDefaultTimezone(): string {
  const fallback = 'Europe/London';
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return resolved && TIMEZONE_KEYS.has(resolved) ? resolved : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Mock company-level default — this repo has no workspace-settings timezone
 * field yet, so this stands in for it until one exists.
 */
export function getCompanyDefaultTimezone(): string {
  return 'Europe/Berlin';
}

export type TimezoneSource = 'saved' | 'detected' | 'company';

/**
 * The create-job wizard's timezone priority chain: a saved job value wins,
 * then the device's own zone, then the company default, then GMT as the
 * last resort. Kept pure (no React) so it's unit-testable without rendering.
 */
export function resolveInitialTimezone(opts: {
  savedTimezone?: string | null;
  companyTimezone?: string;
}): { timezone: string; source: TimezoneSource } {
  const { savedTimezone, companyTimezone = getCompanyDefaultTimezone() } = opts;

  if (savedTimezone && TIMEZONE_KEYS.has(savedTimezone)) {
    return { timezone: savedTimezone, source: 'saved' };
  }

  try {
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (device && TIMEZONE_KEYS.has(device)) {
      return { timezone: device, source: 'detected' };
    }
  } catch {
    // Detection unsupported/failed — fall through to the company default.
  }

  const fallback = TIMEZONE_KEYS.has(companyTimezone) ? companyTimezone : 'Europe/London';
  return { timezone: fallback, source: 'company' };
}
