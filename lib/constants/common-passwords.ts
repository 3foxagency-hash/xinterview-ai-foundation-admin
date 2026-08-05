export const COMMON_PASSWORDS = [
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'letmein',
  'welcome1',
  'admin123',
  'changeme',
  'iloveyou',
  'football123',
  'monkey123',
  'abc12345',
] as const;

export function isCommonPassword(pwd: string): boolean {
  return COMMON_PASSWORDS.includes(pwd.toLowerCase() as (typeof COMMON_PASSWORDS)[number]);
}
