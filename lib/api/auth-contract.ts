/**
 * Auth wire contract — XInterview backend.
 *
 * Captured from the live dev API (xdev.xinterview.xyz) on 2026-08-13 by calling
 * every endpoint and recording the real payloads, not inferred from docs.
 *
 * Two deliberate deviations from what dev serves today, both from
 * `docs/auth-api-xinterview-existing-with-suggested-changes.md`:
 *
 *  1. PATHS use the doc's suggested names (see AUTH_PATHS). The frontend builds
 *     against the target contract; `LEGACY_AUTH_PATHS` records what dev serves
 *     now so the rename is a one-line switch, not a migration.
 *  2. FIELDS listed as unused in the doc are omitted from the types below, so
 *     no component can start depending on them before they are removed.
 *
 * Everything else mirrors the real API exactly, including its inconsistencies —
 * a mock that quietly "fixes" the backend teaches the UI the wrong lesson.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────────────────────────────────────

/** Target paths — what the mocks serve and the client calls. */
export const AUTH_PATHS = {
  login: '/auth/tokens',
  register: '/auth/register',
  refresh: '/api/token/refresh/',
  /** Merged upsert, replacing update_last_seen + create_last_seen. */
  lastSeen: '/auth/last-seen',
  forgotPassword: '/auth/forgot-password/',
  /** Typo fixed: `rest-password` → `reset-password`. */
  resetPasswordOtp: '/auth/reset-password/otp/',
  resetPassword: (token: string) =>
    `/auth/reset-password/${encodeURIComponent(token)}/`,
  verifyEmail: '/auth/verify-email/',
  sendVerificationEmail: '/auth/send-verification-email/',
  createCompany: '/companies/',
  /** Joining is a user-scoped action, so it sits under user-management. */
  joinCompany: (companyId: number | string) =>
    `/user-management/${companyId}/join/`,
  me: '/user-management/me/',
  myCompanies: '/user-management/my-companies/',
} as const;

/**
 * What dev actually serves today. Kept so the switch-over is mechanical and the
 * rename request to the backend is unambiguous.
 */
export const LEGACY_AUTH_PATHS = {
  login: '/login/tokens',
  register: '/login/register',
  refresh: '/api/token/refresh/',
  updateLastSeen: '/login/update_last_seen',
  createLastSeen: '/login/create_last_seen',
  forgotPassword: '/login/reset-password/email/',
  resetPasswordOtp: '/login/rest-password/otp/', // sic — typo in production
  verifyEmail: '/login/otp-email-verification',
  sendVerificationEmail: '/login/verification-email',
  createCompany: '/login/company',
  joinCompany: (companyId: number | string) =>
    `/login/join-invited-company/${companyId}/`,
  me: '/user-management/',
  myCompanies: '/user-management/companies',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Session bundle returned by login and register.
 *
 * Real response also carries `email_verified` and `company_created`, which the
 * doc lists as never read from THIS response — omitted here on purpose. They
 * remain available from `GET /user-management/me/`.
 *
 * `last_seen_monitor` is an opaque token echoed back to the last-seen endpoint.
 */
export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  last_seen_monitor: string;
};

/** Register additionally echoes the identity it created. */
export type RegisterResponse = AuthTokens & {
  email: string;
  first_name: string;
  last_name: string;
  /** Present only when signing up through a company invite. */
  joining_company_details?: JoiningCompanyDetails;
};

/**
 * Invite context on an invited signup.
 *
 * `logo` and `account_team_size` are omitted — the doc records the `<Avatar>`
 * using `logo` as commented out, and `account_team_size` as stored but never
 * rendered.
 */
export type JoiningCompanyDetails = {
  id: number;
  company_name: string;
};

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type RegisterRequestBody = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  /** Numeric company id when accepting an invite. */
  company?: number;
};

/**
 * Token refresh.
 *
 * The live API returns a bare `access` here while login returns `access_token`.
 * The doc calls for standardising on `access_token`, so that is what this
 * contract — and the mock — use.
 */
export type RefreshResponse = {
  access_token: string;
};

export type RefreshRequestBody = {
  refresh: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Current user
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Company summary.
 *
 * `phone_number` and `company_website` are omitted — always null in every
 * observed response, and the doc lists both as unused.
 */
export type CompanySummary = {
  id: number;
  company_name: string;
  is_sub_active: boolean;
  account_team_size: string;
  number_of_members: number;
  plan_title: string;
  subscription_date: string;
};

/**
 * Authenticated user profile.
 *
 * Omitted as unused per the doc, all confirmed null/constant against dev:
 * `custom_data`, `location`, `mobile_number`, `whatsapp_number`,
 * `is_whatsapp_active`.
 */
export type CurrentUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  timezone: string;
  language: string;
  profile_pic: string | null;
  is_verified: boolean;
  notification_skipped: boolean;
  company_created: boolean;
  has_zoom_account: boolean;
  has_google_account: boolean;
  has_microsoft_account: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  admin_companies: CompanySummary | null;
  managed_companies: CompanySummary[];
  exe_companies: CompanySummary[];
};

export type MyCompanies = {
  admin_companies: CompanySummary | null;
  managed_companies: CompanySummary[];
  exe_companies: CompanySummary[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Email verification & password reset
// ─────────────────────────────────────────────────────────────────────────────

/** OTPs are 6 digits, confirmed against the real verification emails. */
export const OTP_LENGTH = 6;

export type SendVerificationEmailResponse = {
  /**
   * The live API spells this `details` here and `detail` elsewhere. Normalised
   * to `message`, matching every other success body in this contract.
   */
  message: string;
};

export type VerifyEmailRequestBody = {
  otp: string;
};

export type VerifyEmailResponse = {
  email: string;
  message: string;
};

export type ForgotPasswordRequestBody = {
  email: string;
};

export type ForgotPasswordResponse = {
  email: string;
  message: string;
};

export type ResetPasswordOtpRequestBody = {
  email: string;
  otp: string;
};

/** Single-use reset token, shaped `<uid>?<signature>`. Opaque — never parse it. */
export type ResetPasswordOtpResponse = {
  token: string;
};

export type ResetPasswordRequestBody = {
  password: string;
  re_password: string;
};

export type ResetPasswordResponse = {
  message: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Last seen
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merged upsert of update_last_seen + create_last_seen.
 *
 * Creating omits the token; refreshing sends the one previously issued. The doc
 * notes only `last_seen_monitor` is ever read, so `expired` is kept solely
 * because the session-expiry check depends on it.
 */
export type LastSeenRequestBody = {
  last_seen_monitor?: string;
};

export type LastSeenResponse = {
  last_seen_monitor: string;
  expired: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Company onboarding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Company type. Wire values are two-letter codes, confirmed against the live
 * API — `Corporate`/`Agency` are display labels only and are rejected.
 */
export const ACCOUNT_TYPES = [
  { value: 'CO', label: 'Corporate' },
  { value: 'AG', label: 'Agency' },
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number]['value'];

/**
 * Company category. The wire value IS the full label — these long strings are
 * sent verbatim, so they must not be shortened or reworded client-side.
 */
export const BUSINESS_TYPES = [
  'Partnership',
  'Sole Proprietorship',
  'Public Limited Company',
  'Private Limited Company / LTD / C-Corp / S-Corp / BV',
  'Limited Liability Company / LLC / LLP',
  'Non-Governmental Organization',
  'Governmental Organization',
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export type CreateCompanyRequestBody = {
  company_name: string;
  account_team_size: string;
  account_type: AccountType;
  business_type: BusinessType;
  company_website?: string;
};

/**
 * Real 201 response. The API returns 17 fields; the ones below are what the
 * onboarding flow needs. Infrastructure fields (`domain_name`,
 * `video_storage_provider`, `partnero_*`, `category`, `subcategory`,
 * `is_domain_verified`, `ai_feature_enabled`, `is_active`) are omitted — see
 * docs/auth-api-real-contract.md.
 */
export type CreateCompanyResponse = {
  id: number;
  company_name: string;
  account_type: AccountType;
  business_type: BusinessType;
  account_team_size: string;
  created_at: string;
};

export type JoinCompanyResponse = {
  message: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The live API uses three different error envelopes. All three are reproduced
 * in the mocks, because code that only handles one will break on the others.
 *
 *  1. Detail      `{ "detail": "Invalid credentials" }`
 *  2. Field       `{ "email": ["Email is already registered."] }`
 *  3. Non-field   `{ "non_field_errors": ["Password Mismatch"] }`
 *                 `{ "messages": "Token has been expired!, Bad or expired Token" }`
 */
export type DetailError = { detail: string; code?: string };
export type FieldError = Record<string, string[]>;
export type NonFieldError = {
  non_field_errors?: string[];
  messages?: string;
};

export type AuthErrorBody = DetailError | FieldError | NonFieldError;

/**
 * Client-side codes the UI branches on.
 *
 * The backend does not send stable machine codes — it sends human English in
 * `detail`. These are derived at the client boundary from status + message, so
 * components never match on prose that a backend reword would silently break.
 */
export const AUTH_ERROR_CODE = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  VALIDATION_FAILED: 'validation_failed',
  ALREADY_REGISTERED: 'already_registered',
  ACCOUNT_NOT_FOUND: 'account_not_found',
  OTP_MISMATCH: 'otp_mismatch',
  TOKEN_INVALID: 'token_invalid',
  TOKEN_EXPIRED: 'token_expired',
  PASSWORD_MISMATCH: 'password_mismatch',
  UNAUTHENTICATED: 'unauthenticated',
  NETWORK_ERROR: 'network_error',
  UNKNOWN: 'unknown',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];
