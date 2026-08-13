import { request } from './client';
import { isApiError } from './errors';
import { AUTH_PATHS, AUTH_ERROR_CODE } from './auth-contract';
import type {
  AccountType,
  BusinessType,
  AuthTokens,
  RegisterResponse,
  RefreshResponse,
  CurrentUser,
  MyCompanies,
  JoiningCompanyDetails,
  ForgotPasswordResponse,
  ResetPasswordOtpResponse,
  VerifyEmailResponse,
  LastSeenResponse,
  CreateCompanyRequestBody,
  CreateCompanyResponse,
} from './auth-contract';

/**
 * Auth API — the real XInterview backend contract.
 *
 * Payloads and status codes were captured from the live dev API, so this module
 * talks the backend's actual language: snake_case bodies, unenveloped
 * responses, root-level paths, and three different error shapes.
 *
 * Two things happen at this boundary and nowhere else:
 *
 *  1. **snake_case → camelCase.** Components never see wire casing.
 *  2. **Error normalization.** The backend sends human English in `detail`,
 *     `{field: [...]}`, or `non_field_errors` — with no stable machine codes.
 *     Those become the codes in AUTH_ERROR_CODE here, so components branch on
 *     an identifier instead of on prose a backend reword would silently break.
 */

// ─── Types the UI consumes ───

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type AuthResult = {
  user: AuthUser;
  token: string;
};

export type ApiError = {
  message: string;
  code: string;
  /** Present on 429 only. */
  retryAfter?: number;
  /** Per-field messages, when the backend sent DRF field errors. */
  fieldErrors?: Record<string, string>;
};

export type InviteInfo = {
  company: string;
  inviter: string;
};

export type OtpResult = { verified: boolean };

export type Session = {
  accessToken: string;
  refreshToken: string;
  lastSeenMonitor: string;
};

export type Company = {
  id: number;
  name: string;
  teamSize: string;
  memberCount: number;
  planTitle: string;
  subscriptionActive: boolean;
  subscriptionDate: string;
};

export type UserProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  language: string;
  profilePic: string | null;
  isVerified: boolean;
  notificationSkipped: boolean;
  companyCreated: boolean;
  hasZoomAccount: boolean;
  hasGoogleAccount: boolean;
  hasMicrosoftAccount: boolean;
  adminCompany: Company | null;
  managedCompanies: Company[];
  execCompanies: Company[];
};

// ─── Error normalization ───

/**
 * Derives a stable code from the backend's status + prose.
 *
 * Matching on message text is unavoidable because the API sends no machine
 * codes; confining it to this one function means a backend reword is a one-line
 * fix here rather than a hunt through components.
 */
function codeFromDetail(status: number, message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid credentials')) return AUTH_ERROR_CODE.INVALID_CREDENTIALS;
  if (m.includes('otp has mismatch')) return AUTH_ERROR_CODE.OTP_MISMATCH;
  if (m.includes('otp has expired')) return AUTH_ERROR_CODE.TOKEN_EXPIRED;
  if (m.includes('token is invalid')) return AUTH_ERROR_CODE.TOKEN_INVALID;
  if (m.includes('expired')) return AUTH_ERROR_CODE.TOKEN_EXPIRED;
  if (m.includes('authentication credentials')) return AUTH_ERROR_CODE.UNAUTHENTICATED;
  if (m.includes('not found')) return AUTH_ERROR_CODE.ACCOUNT_NOT_FOUND;
  if (status === 401) return AUTH_ERROR_CODE.UNAUTHENTICATED;
  if (status === 404) return AUTH_ERROR_CODE.INVALID_CREDENTIALS;
  return AUTH_ERROR_CODE.UNKNOWN;
}

/** Flattens `{ email: ["..."] }` into `{ email: "..." }` for setError(). */
function flattenFieldErrors(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key === 'detail' || key === 'code') continue;
    if (Array.isArray(value) && typeof value[0] === 'string') out[key] = value[0];
    else if (typeof value === 'string') out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function toApiError(error: unknown): ApiError {
  if (!isApiError(error)) {
    if (error instanceof Error) {
      return { code: AUTH_ERROR_CODE.UNKNOWN, message: error.message };
    }
    return {
      code: AUTH_ERROR_CODE.UNKNOWN,
      message: 'Something went wrong. Please try again.',
    };
  }

  if (error.code === 'NETWORK_ERROR' || error.code === 'CIRCUIT_OPEN') {
    return { code: AUTH_ERROR_CODE.NETWORK_ERROR, message: error.message };
  }
  if (error.code === 'CLIENT_RATE_LIMITED' || error.status === 429) {
    return {
      code: AUTH_ERROR_CODE.VALIDATION_FAILED,
      message: error.message,
      ...(error.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
    };
  }

  // `raw` carries the untouched body so the three envelopes can be told apart.
  const raw = (error as unknown as { raw?: Record<string, unknown> }).raw;

  // Envelope 3: non-field errors.
  const nonField = raw?.non_field_errors;
  if (Array.isArray(nonField) && typeof nonField[0] === 'string') {
    const message = nonField[0];
    return {
      code: /mismatch/i.test(message)
        ? AUTH_ERROR_CODE.PASSWORD_MISMATCH
        : AUTH_ERROR_CODE.VALIDATION_FAILED,
      message,
    };
  }
  if (typeof raw?.messages === 'string') {
    return { code: AUTH_ERROR_CODE.TOKEN_EXPIRED, message: raw.messages };
  }

  // Envelope 2: DRF field errors.
  const fieldErrors = flattenFieldErrors(raw);
  if (fieldErrors && !raw?.detail) {
    const first = Object.values(fieldErrors)[0];
    const alreadyRegistered = /already registered/i.test(first);
    const notFound = /not found/i.test(first);
    return {
      code: alreadyRegistered
        ? AUTH_ERROR_CODE.ALREADY_REGISTERED
        : notFound
          ? AUTH_ERROR_CODE.ACCOUNT_NOT_FOUND
          : AUTH_ERROR_CODE.VALIDATION_FAILED,
      message: first,
      fieldErrors,
    };
  }

  // Envelope 1: { detail }.
  return {
    code: codeFromDetail(error.status, error.message),
    message: error.message,
  };
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw toApiError(error);
  }
}

/** Auth responses are NOT enveloped — no `{ data }` wrapper. */
function auth<T>(
  path: string,
  init: Omit<Parameters<typeof request>[0], 'path' | 'versioned'> = {}
): Promise<T> {
  return request<T>({ ...init, path, versioned: false });
}

// ─── Mapping helpers ───

function toCompany(c: {
  id: number;
  company_name: string;
  account_team_size: string;
  number_of_members: number;
  plan_title: string;
  is_sub_active: boolean;
  subscription_date: string;
}): Company {
  return {
    id: c.id,
    name: c.company_name,
    teamSize: c.account_team_size,
    memberCount: c.number_of_members,
    planTitle: c.plan_title,
    subscriptionActive: c.is_sub_active,
    subscriptionDate: c.subscription_date,
  };
}

function toSession(t: AuthTokens): Session {
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    lastSeenMonitor: t.last_seen_monitor,
  };
}

// ─── Session storage ───
// Held in memory only. A token in localStorage is readable by injected script;
// the backend does not yet set httpOnly cookies, so in-memory is the safest
// option available without a BFF.

let session: Session | null = null;

export function getSession(): Session | null {
  return session;
}

export function setSession(next: Session | null): void {
  session = next;
}

function authHeaders(): Record<string, string> {
  return session ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

// ─── API functions ───

export async function login(
  email: string,
  password: string,
  _rememberMe = false
): Promise<AuthResult> {
  const tokens = await call(() =>
    auth<AuthTokens>(AUTH_PATHS.login, {
      method: 'POST',
      body: { email, password },
    })
  );

  setSession(toSession(tokens));

  // The login response carries no identity, so the profile is fetched to build
  // AuthUser. `email_verified` / `company_created` are deliberately not read
  // from the token response — they are authoritative on the profile.
  const profile = await getProfile();
  return {
    user: {
      id: String(profile.id),
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
    },
    token: tokens.access_token,
  };
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  companyId?: number
): Promise<AuthResult> {
  const response = await call(() =>
    auth<RegisterResponse>(AUTH_PATHS.register, {
      method: 'POST',
      body: {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        ...(companyId !== undefined ? { company: companyId } : {}),
      },
    })
  );

  setSession(toSession(response));

  return {
    user: {
      id: response.email,
      email: response.email,
      firstName: response.first_name,
      lastName: response.last_name,
    },
    token: response.access_token,
  };
}

/** Exchanges the refresh token for a new access token. */
export async function refreshSession(): Promise<string> {
  if (!session) throw { code: AUTH_ERROR_CODE.UNAUTHENTICATED, message: 'No session' };
  const result = await call(() =>
    auth<RefreshResponse>(AUTH_PATHS.refresh, {
      method: 'POST',
      body: { refresh: session!.refreshToken },
    })
  );
  session = { ...session, accessToken: result.access_token };
  return result.access_token;
}

export async function getProfile(): Promise<UserProfile> {
  const u = await call(() =>
    auth<CurrentUser>(AUTH_PATHS.me, { headers: authHeaders() })
  );
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    timezone: u.timezone,
    language: u.language,
    profilePic: u.profile_pic,
    isVerified: u.is_verified,
    notificationSkipped: u.notification_skipped,
    companyCreated: u.company_created,
    hasZoomAccount: u.has_zoom_account,
    hasGoogleAccount: u.has_google_account,
    hasMicrosoftAccount: u.has_microsoft_account,
    adminCompany: u.admin_companies ? toCompany(u.admin_companies) : null,
    managedCompanies: u.managed_companies.map(toCompany),
    execCompanies: u.exe_companies.map(toCompany),
  };
}

export async function getMyCompanies(): Promise<{
  adminCompany: Company | null;
  managedCompanies: Company[];
  execCompanies: Company[];
}> {
  const c = await call(() =>
    auth<MyCompanies>(AUTH_PATHS.myCompanies, { headers: authHeaders() })
  );
  return {
    adminCompany: c.admin_companies ? toCompany(c.admin_companies) : null,
    managedCompanies: c.managed_companies.map(toCompany),
    execCompanies: c.exe_companies.map(toCompany),
  };
}

export async function forgotPassword(
  email: string
): Promise<{ sent: boolean; email: string }> {
  const result = await call(() =>
    auth<ForgotPasswordResponse>(AUTH_PATHS.forgotPassword, {
      method: 'POST',
      body: { email },
    })
  );
  return { sent: true, email: result.email };
}

/**
 * Verifies a 6-digit OTP.
 *
 * Signup verification is authenticated and returns nothing useful; password
 * reset is unauthenticated and returns a single-use token, which is stashed for
 * the subsequent resetPassword call.
 */
export async function verifyOtp(
  email: string,
  code: string,
  mode: 'signup' | 'reset' = 'signup'
): Promise<OtpResult> {
  if (mode === 'reset') {
    const result = await call(() =>
      auth<ResetPasswordOtpResponse>(AUTH_PATHS.resetPasswordOtp, {
        method: 'POST',
        body: { email, otp: code },
      })
    );
    pendingResetToken = result.token;
    return { verified: true };
  }

  await call(() =>
    auth<VerifyEmailResponse>(AUTH_PATHS.verifyEmail, {
      method: 'POST',
      body: { otp: code },
      headers: authHeaders(),
    })
  );
  return { verified: true };
}

/**
 * Reset token from the OTP step.
 *
 * Held here rather than passed through the UI because the reset screen's
 * existing signature takes an email, not a token, and the backend requires the
 * token in the path.
 */
let pendingResetToken: string | null = null;

export function getPendingResetToken(): string | null {
  return pendingResetToken;
}

export async function resendOtp(
  email: string,
  mode: 'signup' | 'reset' = 'signup'
): Promise<{ sent: boolean; email: string }> {
  if (mode === 'reset') return forgotPassword(email);

  await call(() =>
    auth<{ message: string }>(AUTH_PATHS.sendVerificationEmail, {
      method: 'POST',
      body: {},
      headers: authHeaders(),
    })
  );
  return { sent: true, email };
}

export async function resetPassword(
  token: string,
  password: string,
  rePassword?: string
): Promise<{ success: boolean }> {
  const resetToken = token || pendingResetToken;
  if (!resetToken) {
    throw {
      code: AUTH_ERROR_CODE.TOKEN_INVALID,
      message: 'This reset link is invalid or has expired. Please request a new one.',
    } as ApiError;
  }

  await call(() =>
    auth<{ message: string }>(AUTH_PATHS.resetPassword(resetToken), {
      method: 'POST',
      body: { password, re_password: rePassword ?? password },
    })
  );

  // Single use — drop it so a retry cannot silently reuse a spent token.
  pendingResetToken = null;
  return { success: true };
}

export async function getInvite(slug: string): Promise<InviteInfo> {
  const invite = await call(() =>
    auth<JoiningCompanyDetails>(`/companies/invite/${encodeURIComponent(slug)}`)
  );
  return { company: invite.company_name, inviter: 'A teammate' };
}

export async function createWorkspace(
  companyName: string,
  companySize: string,
  companyType: BusinessType,
  companyWebsite?: string,
  accountType: AccountType = 'CO'
): Promise<{ success: boolean; workspaceId: string }> {
  const body: CreateCompanyRequestBody = {
    company_name: companyName,
    account_team_size: companySize,
    // `business_type` is sent verbatim — the wire value IS the long label, so
    // shortening it client-side would be rejected as an invalid choice.
    business_type: companyType,
    // 'CO' (Corporate) or 'AG' (Agency); the two-letter code is the wire value.
    account_type: accountType,
    ...(companyWebsite ? { company_website: companyWebsite } : {}),
  };

  const result = await call(() =>
    auth<CreateCompanyResponse>(AUTH_PATHS.createCompany, {
      method: 'POST',
      body,
      headers: authHeaders(),
    })
  );
  return { success: true, workspaceId: String(result.id) };
}

export async function joinWorkspace(
  companyId: string | number
): Promise<{ success: boolean }> {
  await call(() =>
    auth<{ message: string }>(AUTH_PATHS.joinCompany(companyId), {
      method: 'POST',
      body: {},
      headers: authHeaders(),
    })
  );
  return { success: true };
}

/** Upserts the last-seen monitor. Replaces update_last_seen + create_last_seen. */
export async function touchLastSeen(): Promise<{ expired: boolean }> {
  const result = await call(() =>
    auth<LastSeenResponse>(AUTH_PATHS.lastSeen, {
      method: 'POST',
      body: session?.lastSeenMonitor
        ? { last_seen_monitor: session.lastSeenMonitor }
        : {},
      headers: authHeaders(),
    })
  );
  if (session) session.lastSeenMonitor = result.last_seen_monitor;
  return { expired: result.expired };
}

/**
 * Logout is client-side: the backend exposes no logout endpoint, so the session
 * is simply dropped. A real implementation should also revoke the refresh token.
 */
export async function logout(): Promise<{ success: boolean }> {
  setSession(null);
  pendingResetToken = null;
  return { success: true };
}

export { isApiError };
