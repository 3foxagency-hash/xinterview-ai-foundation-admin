/* ═══════════════════════════════════════════════════════════
   ISO 3166-1 alpha-2 country code → name + international dial
   code. Backs the phone field's country selector: defaults from
   the candidate's detected location, but every country here is
   selectable so they can pick a different one.
   ═══════════════════════════════════════════════════════════ */

export interface CountryDialInfo {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string;
}

export const COUNTRIES: CountryDialInfo[] = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'IE', name: 'Ireland', dialCode: '+353' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', dialCode: '+977' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'AT', name: 'Austria', dialCode: '+43' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'IS', name: 'Iceland', dialCode: '+354' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'CZ', name: 'Czechia', dialCode: '+420' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421' },
  { code: 'HU', name: 'Hungary', dialCode: '+36' },
  { code: 'RO', name: 'Romania', dialCode: '+40' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359' },
  { code: 'GR', name: 'Greece', dialCode: '+30' },
  { code: 'HR', name: 'Croatia', dialCode: '+385' },
  { code: 'SI', name: 'Slovenia', dialCode: '+386' },
  { code: 'RS', name: 'Serbia', dialCode: '+381' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
  { code: 'BY', name: 'Belarus', dialCode: '+375' },
  { code: 'LT', name: 'Lithuania', dialCode: '+370' },
  { code: 'LV', name: 'Latvia', dialCode: '+371' },
  { code: 'EE', name: 'Estonia', dialCode: '+372' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'IL', name: 'Israel', dialCode: '+972' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'QA', name: 'Qatar', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973' },
  { code: 'OM', name: 'Oman', dialCode: '+968' },
  { code: 'JO', name: 'Jordan', dialCode: '+962' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964' },
  { code: 'IR', name: 'Iran', dialCode: '+98' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { code: 'UG', name: 'Uganda', dialCode: '+256' },
  { code: 'MA', name: 'Morocco', dialCode: '+212' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { code: 'MO', name: 'Macao', dialCode: '+853' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'KH', name: 'Cambodia', dialCode: '+855' },
  { code: 'MM', name: 'Myanmar', dialCode: '+95' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
  { code: 'PE', name: 'Peru', dialCode: '+51' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506' },
  { code: 'PA', name: 'Panama', dialCode: '+507' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502' },
  { code: 'DO', name: 'Dominican Republic', dialCode: '+1' },
  { code: 'JM', name: 'Jamaica', dialCode: '+1' },
  { code: 'CU', name: 'Cuba', dialCode: '+53' },
];

export const DEFAULT_DIAL_CODE = '+1';
export const DEFAULT_COUNTRY = 'US';

const BY_CODE: Record<string, CountryDialInfo> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
);

export function dialCodeForCountry(countryCode: string | null): string {
  if (!countryCode) return DEFAULT_DIAL_CODE;
  return BY_CODE[countryCode.toUpperCase()]?.dialCode ?? DEFAULT_DIAL_CODE;
}

export function countryInfo(countryCode: string): CountryDialInfo | undefined {
  return BY_CODE[countryCode.toUpperCase()];
}
