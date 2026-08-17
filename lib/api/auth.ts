import { AUTH_ERROR_CODE } from './auth-contract';
import type { AccountType, BusinessType } from './auth-contract';

/**
 * Auth API — in-memory stand-in.
 *
 * There is no backend wired up yet, so every function here resolves locally:
 * any email/password combination signs in successfully, and state (session,
 * profile, companies) lives in module-level variables that reset on reload.
 *
 * Exported names, signatures and error codes are kept identical to the real
 * backend-shaped implementation, so swapping this module for a real one later
 * touches no call sites.
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

// ─── Session & profile storage ───
// Held in memory only, seeded fresh on every reload.

let session: Session | null = null;

let profile: UserProfile = {
  id: 1,
  email: '',
  firstName: '',
  lastName: '',
  timezone: 'America/Los_Angeles',
  language: 'en',
  profilePic: null,
  isVerified: true,
  notificationSkipped: false,
  companyCreated: false,
  hasZoomAccount: false,
  hasGoogleAccount: false,
  hasMicrosoftAccount: false,
  adminCompany: null,
  managedCompanies: [],
  execCompanies: [],
};

export function getSession(): Session | null {
  return session;
}

export function setSession(next: Session | null): void {
  session = next;
}

function ulid(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2);
  return `usr_${rand}`.slice(0, 26);
}

function seedSession(): Session {
  return {
    accessToken: ulid(),
    refreshToken: ulid(),
    lastSeenMonitor: ulid(),
  };
}

function nameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split('@')[0] ?? 'there';
  const [first, ...rest] = local.split(/[._-]+/).filter(Boolean);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    firstName: first ? cap(first) : 'Jordan',
    lastName: rest.length ? cap(rest.join(' ')) : 'Rivera',
  };
}

// ─── API functions ───

export async function login(
  email: string,
  _password: string,
  _rememberMe = false
): Promise<AuthResult> {
  await delay();

  setSession(seedSession());
  const { firstName, lastName } = nameFromEmail(email);
  profile = { ...profile, email, firstName, lastName };

  return {
    user: { id: String(profile.id), email, firstName, lastName },
    token: session!.accessToken,
  };
}

export async function register(
  email: string,
  _password: string,
  firstName: string,
  lastName: string,
  companyId?: number
): Promise<AuthResult> {
  await delay();

  setSession(seedSession());
  profile = {
    ...profile,
    email,
    firstName,
    lastName,
    companyCreated: companyId !== undefined,
  };

  return {
    user: { id: String(profile.id), email, firstName, lastName },
    token: session!.accessToken,
  };
}

/** Exchanges the refresh token for a new access token. */
export async function refreshSession(): Promise<string> {
  await delay(200);
  if (!session) throw { code: AUTH_ERROR_CODE.UNAUTHENTICATED, message: 'No session' };
  session = { ...session, accessToken: ulid() };
  return session.accessToken;
}

export async function getProfile(): Promise<UserProfile> {
  await delay(200);
  return { ...profile };
}

export async function getMyCompanies(): Promise<{
  adminCompany: Company | null;
  managedCompanies: Company[];
  execCompanies: Company[];
}> {
  await delay(200);
  return {
    adminCompany: profile.adminCompany,
    managedCompanies: profile.managedCompanies,
    execCompanies: profile.execCompanies,
  };
}

export async function forgotPassword(
  email: string
): Promise<{ sent: boolean; email: string }> {
  await delay();
  return { sent: true, email };
}

/**
 * Verifies a 6-digit OTP. Any code is accepted.
 */
export async function verifyOtp(
  email: string,
  _code: string,
  mode: 'signup' | 'reset' = 'signup'
): Promise<OtpResult> {
  await delay();
  if (mode === 'reset') pendingResetToken = ulid();
  else profile = { ...profile, isVerified: true };
  return { verified: true };
}

let pendingResetToken: string | null = null;

export function getPendingResetToken(): string | null {
  return pendingResetToken;
}

export async function resendOtp(
  email: string,
  mode: 'signup' | 'reset' = 'signup'
): Promise<{ sent: boolean; email: string }> {
  if (mode === 'reset') return forgotPassword(email);
  await delay();
  return { sent: true, email };
}

export async function resetPassword(
  _token: string,
  _password: string,
  _rePassword?: string
): Promise<{ success: boolean }> {
  await delay();
  pendingResetToken = null;
  return { success: true };
}

export async function getInvite(_slug: string): Promise<InviteInfo> {
  await delay(300);
  return { company: 'XInterview', inviter: 'A teammate' };
}

export async function createWorkspace(
  companyName: string,
  companySize: string,
  companyType: BusinessType,
  companyWebsite?: string,
  accountType: AccountType = 'CO'
): Promise<{ success: boolean; workspaceId: string }> {
  await delay(700);
  const company: Company = {
    id: 1,
    name: companyName,
    teamSize: companySize,
    memberCount: 1,
    planTitle: 'Trial',
    subscriptionActive: true,
    subscriptionDate: new Date().toISOString(),
  };
  profile = { ...profile, companyCreated: true, adminCompany: company };
  return { success: true, workspaceId: String(company.id) };
}

export async function joinWorkspace(
  _companyId: string | number
): Promise<{ success: boolean }> {
  await delay(500);
  profile = { ...profile, companyCreated: true };
  return { success: true };
}

/** Upserts the last-seen monitor. */
export async function touchLastSeen(): Promise<{ expired: boolean }> {
  await delay(100);
  if (session) session.lastSeenMonitor = ulid();
  return { expired: false };
}

/** Logout is client-side: the session is simply dropped. */
export async function logout(): Promise<{ success: boolean }> {
  setSession(null);
  pendingResetToken = null;
  return { success: true };
}
