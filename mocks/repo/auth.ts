import { db, DEFAULT_ORG_ID, type MockUser } from '../db';
import { encodeBase64Url } from './base64';
import type {
  CurrentUser,
  CompanySummary,
  MyCompanies,
  AuthTokens,
  RegisterResponse,
  JoiningCompanyDetails,
  CreateCompanyRequestBody,
  CreateCompanyResponse,
} from '@/lib/api/auth-contract';

/**
 * Auth repository — modelled on the real XInterview backend.
 *
 * Shapes were captured from the live dev API, so the mock reproduces the real
 * contract rather than an idealised one. Handlers call these functions and
 * never touch the store directly.
 *
 * Auth is the one resource where org scoping cannot be a leading argument (you
 * do not know the company until the user is identified), so it comes out of the
 * resolved user rather than going in.
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 60 * 1000;
const OTP_MAX_RESENDS = 3;

/** The OTP that verifies in mocks. Real OTPs are 6 digits, as here. */
export const VALID_OTP = '123456';
export const EXPIRED_OTP = '111111';

/** Opaque JWT-ish strings, long enough that nothing tries to parse them. */
function fakeJwt(kind: string, userId: number): string {
  const payload = encodeBase64Url(
    JSON.stringify({ token_type: kind, user_id: String(userId) })
  );
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.${'x'.repeat(43)}`;
}

function tokensFor(user: MockUser): AuthTokens {
  return {
    access_token: fakeJwt('access', user.numericId),
    refresh_token: fakeJwt('refresh', user.numericId),
    last_seen_monitor: fakeJwt('last_seen', user.numericId),
  };
}

function companyOf(user: MockUser): CompanySummary | null {
  const org = db().organisations.get(user.orgId);
  if (!org || !user.companyCreated) return null;
  return {
    id: org.numericId,
    company_name: org.name,
    is_sub_active: true,
    account_team_size: org.size,
    number_of_members: 2,
    plan_title: 'Growth Plan',
    subscription_date: '2026-07-24T14:08:40.746663Z',
  };
}

export type LoginOutcome =
  | { kind: 'ok'; user: MockUser }
  | { kind: 'invalid_credentials' }
  | { kind: 'locked'; retryAfterSeconds: number };

export const authRepo = {
  findByEmail(email: string): MockUser | null {
    const target = email.trim().toLowerCase();
    for (const user of db().users.values()) {
      if (user.email === target) return user;
    }
    return null;
  },

  findById(numericId: number): MockUser | null {
    for (const user of db().users.values()) {
      if (user.numericId === numericId) return user;
    }
    return null;
  },

  /**
   * Applies real lockout accounting so the UI's lockout branch is reachable
   * locally. The live API has no lockout, so this is a mock-only affordance —
   * documented in docs/auth-api-real-contract.md rather than assumed.
   */
  login(email: string, password: string): LoginOutcome {
    const user = authRepo.findByEmail(email);

    if (user?.lockedUntil && user.lockedUntil > Date.now()) {
      return {
        kind: 'locked',
        retryAfterSeconds: Math.ceil((user.lockedUntil - Date.now()) / 1000),
      };
    }

    if (!user || user.password !== password) {
      if (user) {
        user.failedAttempts += 1;
        if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockedUntil = Date.now() + LOCKOUT_MS;
          return { kind: 'locked', retryAfterSeconds: LOCKOUT_MS / 1000 };
        }
      }
      return { kind: 'invalid_credentials' };
    }

    user.failedAttempts = 0;
    user.lockedUntil = null;
    return { kind: 'ok', user };
  },

  tokensFor,

  emailTaken(email: string): boolean {
    return authRepo.findByEmail(email) !== null;
  },

  register(input: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    company?: number;
  }): RegisterResponse {
    const store = db();
    const numericId =
      Math.max(0, ...[...store.users.values()].map((u) => u.numericId)) + 1;

    const user: MockUser = {
      id: `usr_${numericId}`,
      numericId,
      email: input.email.trim().toLowerCase(),
      password: input.password,
      firstName: input.first_name,
      lastName: input.last_name,
      role: 'owner',
      orgId: DEFAULT_ORG_ID,
      timezone: 'Asia/Kolkata',
      locale: 'English (UK)',
      // New signups are unverified and have no company, matching the real API.
      emailVerified: false,
      companyCreated: false,
      notificationSkipped: false,
      failedAttempts: 0,
      lockedUntil: null,
    };
    store.users.set(user.id, user);

    const response: RegisterResponse = {
      ...tokensFor(user),
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
    };

    // Invite signups additionally echo the company being joined.
    if (input.company !== undefined) {
      const invite = authRepo.companyById(input.company);
      if (invite) response.joining_company_details = invite;
    }

    return response;
  },

  companyById(numericId: number): JoiningCompanyDetails | null {
    for (const org of db().organisations.values()) {
      if (org.numericId === numericId) {
        return { id: org.numericId, company_name: org.name };
      }
    }
    return null;
  },

  companyBySlug(slug: string): JoiningCompanyDetails | null {
    for (const org of db().organisations.values()) {
      if (org.inviteSlug === slug) {
        return { id: org.numericId, company_name: org.name };
      }
    }
    return null;
  },

  markVerified(email: string): MockUser | null {
    const user = authRepo.findByEmail(email);
    if (!user) return null;
    user.emailVerified = true;
    return user;
  },

  setPassword(email: string, password: string): boolean {
    const user = authRepo.findByEmail(email);
    if (!user) return false;
    user.password = password;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    return true;
  },

  /** Shape of GET /user-management/me/ — unused fields already stripped. */
  currentUser(user: MockUser): CurrentUser {
    return {
      id: user.numericId,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      timezone: user.timezone,
      language: user.locale,
      profile_pic: null,
      is_verified: user.emailVerified,
      notification_skipped: user.notificationSkipped,
      company_created: user.companyCreated,
      has_zoom_account: false,
      has_google_account: false,
      has_microsoft_account: false,
      created_at: '2026-05-18T06:21:49.295045Z',
      updated_at: '2026-08-06T13:29:30.963544Z',
      last_login: '2026-05-18T06:22:07.630298Z',
      admin_companies: companyOf(user),
      managed_companies: [],
      exe_companies: [],
    };
  },

  myCompanies(user: MockUser): MyCompanies {
    return {
      admin_companies: companyOf(user),
      managed_companies: [],
      exe_companies: [],
    };
  },

  createCompany(
    user: MockUser,
    input: CreateCompanyRequestBody
  ): CreateCompanyResponse {
    const store = db();
    const numericId =
      Math.max(0, ...[...store.organisations.values()].map((o) => o.numericId)) +
      1;
    const orgId = `org_${numericId}`;

    store.organisations.set(orgId, {
      id: orgId,
      numericId,
      name: input.company_name,
      size: input.account_team_size,
      type: input.business_type,
      website: input.company_website ?? null,
      inviteSlug: null,
      inviterName: null,
    });

    user.orgId = orgId;
    user.companyCreated = true;

    // Echoes back what was created. The live API returns 17 fields here; the
    // other 11 are infrastructure the onboarding flow never reads.
    return {
      id: numericId,
      company_name: input.company_name,
      account_type: input.account_type,
      business_type: input.business_type,
      account_team_size: input.account_team_size,
      created_at: new Date().toISOString(),
    };
  },

  joinCompany(user: MockUser, companyNumericId: number): boolean {
    for (const org of db().organisations.values()) {
      if (org.numericId === companyNumericId) {
        user.orgId = org.id;
        user.companyCreated = true;
        return true;
      }
    }
    return false;
  },
};

// ─── Password-reset tokens ───
// Single-use, `<uid>?<signature>` shaped, matching the real API. Consumed on
// success so a replayed link fails exactly as production does.

const RESET_KEY = '__xinterview_mock_reset_tokens__';

function resetTokens(): Map<string, string> {
  const g = globalThis as typeof globalThis & { [RESET_KEY]?: Map<string, string> };
  if (!g[RESET_KEY]) g[RESET_KEY] = new Map();
  return g[RESET_KEY];
}

export const resetTokenRepo = {
  issue(email: string): string {
    const uid = encodeBase64Url(email).slice(0, 6);
    const token = `${uid}?dd8otl-${Math.random().toString(16).slice(2, 34)}`;
    resetTokens().set(token, email.toLowerCase());
    return token;
  },
  /** Returns the email and burns the token — reset links are single use. */
  consume(token: string): string | null {
    const email = resetTokens().get(token);
    if (!email) return null;
    resetTokens().delete(token);
    return email;
  },
  reset(): void {
    resetTokens().clear();
  },
};

// ─── OTP resend accounting ───

const RESEND_KEY = '__xinterview_mock_otp__';

function resendCounts(): Map<string, number> {
  const g = globalThis as typeof globalThis & {
    [RESEND_KEY]?: Map<string, number>;
  };
  if (!g[RESEND_KEY]) g[RESEND_KEY] = new Map();
  return g[RESEND_KEY];
}

export const otpRepo = {
  /** Returns false once the caller has exhausted their resends. */
  recordResend(email: string): boolean {
    const counts = resendCounts();
    const key = email.toLowerCase();
    const next = (counts.get(key) ?? 0) + 1;
    counts.set(key, next);
    return next <= OTP_MAX_RESENDS;
  },
  reset(): void {
    resendCounts().clear();
  },
  maxResends: OTP_MAX_RESENDS,
};
