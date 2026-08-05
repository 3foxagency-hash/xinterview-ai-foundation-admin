export type PasswordCheck = {
  label: string;
  test: (v: string) => boolean;
};

export const passwordChecks: PasswordCheck[] = [
  { label: '8+ characters', test: (v) => v.length >= 8 },
  { label: 'Uppercase', test: (v) => /[A-Z]/.test(v) },
  { label: 'Lowercase', test: (v) => /[a-z]/.test(v) },
  { label: 'Number', test: (v) => /[0-9]/.test(v) },
  { label: 'Special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function getPasswordChecks(value: string): { label: string; passed: boolean }[] {
  return passwordChecks.map((c) => ({ label: c.label, passed: c.test(value) }));
}

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Strength mirrors the zod policy in lib/validation/auth.ts: every check must
 * pass before a password reads as "Strong". Anything short of all five is at
 * most "Good", so the meter can never contradict the submit-time error.
 */
export function getPasswordStrength(value: string): StrengthLevel {
  if (!value) return 0;
  const passed = passwordChecks.filter((c) => c.test(value)).length;
  if (passed <= 1) return 1;
  if (passed === 2) return 2;
  if (passed < passwordChecks.length) return 3;
  return 4;
}

export const strengthConfig: Record<
  StrengthLevel,
  { label: string; segments: number; color: string }
> = {
  0: { label: '', segments: 0, color: 'bg-border' },
  1: { label: 'Very weak', segments: 1, color: 'bg-error' },
  2: { label: 'Weak', segments: 2, color: 'bg-warning' },
  3: { label: 'Good', segments: 3, color: 'bg-primary' },
  4: { label: 'Strong', segments: 4, color: 'bg-success' },
};
