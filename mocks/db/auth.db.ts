/**
 * Seeded in-memory data for the auth surface. See backend-docs/auth-api.md
 * "Mock test data" — these values are reproduced verbatim so manual testing
 * matches the doc exactly.
 */

export type MockAuthUser = {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  hasCompany: boolean;
  locked: boolean;
  companyId: number | null;
};

const SEED_USERS: Record<string, MockAuthUser> = {
  'admin@xinterview.ai': {
    id: 113,
    email: 'admin@xinterview.ai',
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Chen',
    verified: true,
    hasCompany: true,
    locked: false,
    companyId: 64,
  },
  'recruiter@xinterview.ai': {
    id: 114,
    email: 'recruiter@xinterview.ai',
    password: 'password123',
    firstName: 'Marcus',
    lastName: 'Reid',
    verified: true,
    hasCompany: true,
    locked: false,
    companyId: 64,
  },
  'locked@xinterview.ai': {
    id: 115,
    email: 'locked@xinterview.ai',
    password: 'password123',
    firstName: 'Locked',
    lastName: 'Account',
    verified: true,
    hasCompany: true,
    locked: true,
    companyId: 64,
  },
  'unverified@xinterview.ai': {
    id: 116,
    email: 'unverified@xinterview.ai',
    password: 'password123',
    firstName: 'New',
    lastName: 'User',
    verified: false,
    hasCompany: false,
    locked: false,
    companyId: null,
  },
};

export const OTP_CODES = { valid: '123456', expired: '111111' };
export const INVITE_SLUGS: Record<string, { id: number; company_name: string }> = {
  acme: { id: 64, company_name: 'Acme Corp' },
};

const LOCKOUT_THRESHOLD = 5;

let users: Record<string, MockAuthUser> = clone(SEED_USERS);
let failedLoginCounts: Record<string, number> = {};
let nextUserId = 200;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function findUser(email: string): MockAuthUser | undefined {
  return users[email.toLowerCase()];
}

export function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId?: number;
}): MockAuthUser {
  const user: MockAuthUser = {
    id: nextUserId++,
    email: input.email,
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    verified: false,
    hasCompany: input.companyId !== undefined,
    locked: false,
    companyId: input.companyId ?? null,
  };
  users[input.email.toLowerCase()] = user;
  return user;
}

export function setVerified(email: string, verified: boolean) {
  const user = users[email.toLowerCase()];
  if (user) user.verified = verified;
}

export function setCompany(email: string, companyId: number) {
  const user = users[email.toLowerCase()];
  if (user) {
    user.hasCompany = true;
    user.companyId = companyId;
  }
}

export function recordFailedLogin(email: string) {
  const key = email.toLowerCase();
  failedLoginCounts[key] = (failedLoginCounts[key] ?? 0) + 1;
}

export function clearFailedLogins(email: string) {
  delete failedLoginCounts[email.toLowerCase()];
}

export function isLockedOut(email: string): boolean {
  const key = email.toLowerCase();
  const user = users[key];
  return Boolean(user?.locked) || (failedLoginCounts[key] ?? 0) >= LOCKOUT_THRESHOLD;
}

let pendingOtp: Record<string, string> = {};
export function issueOtp(email: string, code: string = OTP_CODES.valid) {
  pendingOtp[email.toLowerCase()] = code;
}
export function peekOtp(email: string): string | undefined {
  return pendingOtp[email.toLowerCase()];
}

export function resetAuthDb() {
  users = clone(SEED_USERS);
  failedLoginCounts = {};
  pendingOtp = {};
  nextUserId = 200;
}
