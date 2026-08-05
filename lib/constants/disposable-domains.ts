export const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.com',
  'yopmail.com',
] as const;

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.includes(domain as (typeof DISPOSABLE_DOMAINS)[number]);
}
