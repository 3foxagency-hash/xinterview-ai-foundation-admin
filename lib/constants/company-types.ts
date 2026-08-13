import { BUSINESS_TYPES, ACCOUNT_TYPES } from '@/lib/api/auth-contract';

/**
 * Company category options for the onboarding form.
 *
 * Re-exported from the API contract rather than maintained separately: the wire
 * value IS the full label, so a shortened or reworded option here would be
 * rejected by the backend as `"X" is not a valid choice.`
 *
 * Confirmed against the live API on 2026-08-13.
 */
export const COMPANY_TYPES = BUSINESS_TYPES;

export type CompanyType = (typeof COMPANY_TYPES)[number];

/**
 * Corporate vs Agency. The wire value is the two-letter code; the label is
 * display-only and must not be sent.
 */
export const ACCOUNT_TYPE_OPTIONS = ACCOUNT_TYPES;

export type { AccountType } from '@/lib/api/auth-contract';
