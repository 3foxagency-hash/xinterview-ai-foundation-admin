import { apiFetch } from './client';
import { AUTH_PATHS, type CurrentUser as WireCurrentUser } from './auth-contract';
import type { AccountType, BusinessType } from './auth-contract';

/**
 * Auth API.
 *
 * Calls the real fetch client (lib/api/client.ts), intercepted by MSW when
 * mocking is enabled (see docs/msw-mocking.md). Session state lives in a
 * module-level variable only — no cookies, no localStorage — so it resets on
 * reload, same as before this file called a real endpoint.
 */

function delay(ms = 500) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

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

// ─── Session storage ───
// Held in memory only, seeded fresh on every reload.

let session: (Session & { email: string }) | null = null;
let pendingResetToken: string | null = null;

export function setSession(next: Session | null, email?: string): void {
  session = next ? { ...next, email: email ?? session?.email ?? '' } : null;
}

export function getSession(): Session | null {
  return session;
}

/** Mock-only: lets lib/api/client.ts identify "the signed-in user" to MSW handlers. */
export function getSessionEmail(): string | null {
  return session?.email ?? null;
}

export function getPendingResetToken(): string | null {
  return pendingResetToken;
}

type WireCompanySummary = NonNullable<WireCurrentUser['admin_companies']>;

function companyFromWire(c: WireCompanySummary): Company {
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

function profileFromWire(u: WireCurrentUser): UserProfile {
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
    adminCompany: u.admin_companies ? companyFromWire(u.admin_companies) : null,
    managedCompanies: u.managed_companies.map(companyFromWire),
    execCompanies: u.exe_companies.map(companyFromWire),
  };
}

// ─── API functions ───

export async function login(
  email: string,
  password: string,
  _rememberMe = false
): Promise<AuthResult> {
  const tokens = await apiFetch<{ access_token: string; refresh_token: string; last_seen_monitor: string }>(
    AUTH_PATHS.login,
    {
      method: 'POST',
      body: { email, password },
      auth: false,
      statusCodeMap: { 404: 'invalid_credentials', 429: 'account_locked' },
    }
  );
  setSession(
    { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, lastSeenMonitor: tokens.last_seen_monitor },
    email
  );
  const me = await getMe();
  return {
    user: { id: String(me.id), email: me.email, firstName: me.first_name, lastName: me.last_name },
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
  const result = await apiFetch<{
    access_token: string;
    refresh_token: string;
    last_seen_monitor: string;
    email: string;
    first_name: string;
    last_name: string;
  }>(AUTH_PATHS.register, {
    method: 'POST',
    body: { email, password, first_name: firstName, last_name: lastName, company: companyId },
    auth: false,
  });
  setSession(
    { accessToken: result.access_token, refreshToken: result.refresh_token, lastSeenMonitor: result.last_seen_monitor },
    email
  );
  return {
    user: { id: '0', email: result.email, firstName: result.first_name, lastName: result.last_name },
    token: result.access_token,
  };
}

/** Fetches the real current-user shape (snake_case, wire-accurate). */
export async function getMe(): Promise<WireCurrentUser> {
  return apiFetch<WireCurrentUser>(AUTH_PATHS.me);
}

/** Thin adapter over getMe() — keeps the camelCase shape existing callers expect. */
export async function getProfile(): Promise<UserProfile> {
  const me = await getMe();
  return profileFromWire(me);
}

export async function forgotPassword(
  email: string
): Promise<{ sent: boolean; email: string }> {
  const result = await apiFetch<{ email: string; message: string }>(AUTH_PATHS.forgotPassword, {
    method: 'POST',
    body: { email },
    auth: false,
  });
  return { sent: true, email: result.email };
}

/** Verifies a 6-digit OTP against the real endpoint for the given mode. */
export async function verifyOtp(
  email: string,
  code: string,
  mode: 'signup' | 'reset' = 'signup'
): Promise<OtpResult> {
  if (mode === 'reset') {
    const result = await apiFetch<{ token: string }>(AUTH_PATHS.resetPasswordOtp, {
      method: 'POST',
      body: { email, otp: code },
      auth: false,
    });
    pendingResetToken = result.token;
  } else {
    await apiFetch<{ email: string; message: string }>(AUTH_PATHS.verifyEmail, {
      method: 'POST',
      body: { otp: code },
    });
  }
  return { verified: true };
}

export async function resendOtp(
  email: string,
  mode: 'signup' | 'reset' = 'signup'
): Promise<{ sent: boolean; email: string }> {
  if (mode === 'reset') return forgotPassword(email);
  await apiFetch<{ message: string }>(AUTH_PATHS.sendVerificationEmail, { method: 'POST', body: {} });
  return { sent: true, email };
}

export async function resetPassword(
  token: string,
  password: string,
  rePassword?: string
): Promise<{ success: boolean }> {
  await apiFetch<{ message: string }>(AUTH_PATHS.resetPassword(token), {
    method: 'POST',
    body: { password, re_password: rePassword ?? password },
    auth: false,
  });
  pendingResetToken = null;
  return { success: true };
}

export async function getInvite(slug: string): Promise<InviteInfo> {
  const invite = await apiFetch<{ id: number; company_name: string }>(AUTH_PATHS.inviteBySlug(slug), {
    auth: false,
    statusCodeMap: { 404: 'invite_not_found' },
  });
  return { company: invite.company_name, inviter: 'A teammate' };
}

export async function createWorkspace(
  companyName: string,
  companySize: string,
  companyType: BusinessType,
  companyWebsite?: string,
  accountType: AccountType = 'CO'
): Promise<{ success: boolean; workspaceId: string }> {
  const result = await apiFetch<{
    id: number;
    company_name: string;
    account_type: AccountType;
    business_type: BusinessType;
    account_team_size: string;
    created_at: string;
  }>(AUTH_PATHS.createCompany, {
    method: 'POST',
    body: {
      company_name: companyName,
      account_team_size: companySize,
      account_type: accountType,
      business_type: companyType,
      company_website: companyWebsite,
    },
  });
  return { success: true, workspaceId: String(result.id) };
}

export async function joinWorkspace(companyId: string | number): Promise<{ success: boolean }> {
  await apiFetch<{ message: string }>(AUTH_PATHS.joinCompany(companyId), { method: 'POST' });
  return { success: true };
}

/** Logout is client-side: the session is simply dropped. No doc endpoint exists. */
export async function logout(): Promise<{ success: boolean }> {
  await delay(0);
  setSession(null);
  pendingResetToken = null;
  return { success: true };
}
