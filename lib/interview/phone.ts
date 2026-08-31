/** Shared phone-number masking for every ai_phone screening screen
 *  (verification, scheduling, call status). Kept in one place after
 *  duplicating it twice already — the original single-string regex
 *  version couldn't tell a 2-digit country code from a 3-digit one
 *  apart, so this takes them as separate arguments instead, matching
 *  how the application form's phone field already stores them via
 *  CountryCodeSelect. */

/** ("+31", "612344218") → "+31 6 •• •• 42 18" */
export function maskPhoneNumber(countryCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, '');
  if (digits.length <= 5) return `${countryCode} ${digits}`;

  const visibleStart = digits.slice(0, 1);
  const middle = digits.slice(1, -4);
  const end = digits.slice(-4);
  const maskedMiddle = (middle.match(/.{1,2}/g) ?? []).map((g) => '•'.repeat(g.length)).join(' ');
  const endGroups = (end.match(/.{1,2}/g) ?? [end]).join(' ');

  return `${countryCode} ${visibleStart} ${maskedMiddle} ${endGroups}`;
}
