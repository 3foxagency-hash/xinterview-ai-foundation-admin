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
};

function delay(ms = 800) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function fakeUser(email: string): AuthUser {
  const [localPart] = email.split('@');
  const firstName = localPart.charAt(0).toUpperCase() + localPart.slice(1).split('.')[0] || 'User';
  return {
    id: `usr_${Math.random().toString(36).slice(2, 10)}`,
    email,
    firstName,
    lastName: 'Demo',
  };
}

export async function login(
  email: string,
  _password: string,
  _rememberMe = false
): Promise<AuthResult> {
  await delay();
  if (email === 'locked@xinterview.ai') {
    throw { message: 'Too many failed attempts. Your account is locked. Please contact your administrator or try again later.', code: 'account_locked' } as ApiError;
  }
  if (email === 'unverified@xinterview.ai') {
    throw { message: 'Please verify your email before signing in. Check your inbox for a verification link.', code: 'unverified' } as ApiError;
  }
  if (email === 'rate@xinterview.ai') {
    throw { message: 'Too many sign-in attempts. Please try again in 60 seconds.', code: 'rate_limited', retryAfter: 60 } as ApiError & { retryAfter: number };
  }
  return {
    user: fakeUser(email),
    token: `tok_${Math.random().toString(36).slice(2)}`,
  };
}

export async function register(
  email: string,
  _password: string,
  firstName: string,
  lastName: string
): Promise<AuthResult> {
  await delay();
  if (email === 'taken@xinterview.ai') {
    throw {
      message: 'An account with this email may already exist. Try signing in or use a different email.',
      code: 'already_registered',
    } as ApiError;
  }
  return {
    user: { id: `usr_${Math.random().toString(36).slice(2, 10)}`, email, firstName, lastName },
    token: `tok_${Math.random().toString(36).slice(2)}`,
  };
}

export async function forgotPassword(email: string): Promise<{ sent: boolean; email: string }> {
  await delay();
  return { sent: true, email };
}

export type OtpResult = { verified: boolean };

export async function verifyOtp(
  email: string,
  code: string,
  _mode: 'signup' | 'reset' = 'signup'
): Promise<OtpResult> {
  await delay();
  if (code === '000000') {
    throw { message: 'The code you entered is invalid. Please double-check and try again.', code: 'invalid_otp' } as ApiError;
  }
  if (code === '111111') {
    throw { message: 'This code has expired. Please request a new one.', code: 'expired_otp' } as ApiError;
  }
  if (code !== '123456') {
    throw { message: 'The code you entered is invalid. Please double-check and try again.', code: 'invalid_otp' } as ApiError;
  }
  return { verified: true };
}

export async function resetPassword(
  token: string,
  _password: string
): Promise<{ success: boolean }> {
  await delay();
  if (!token) throw { message: 'This reset link is invalid or has expired. Please request a new one.', code: 'invalid_reset_token' } as ApiError;
  return { success: true };
}

const resendCounts = new Map<string, number>();

export async function resendOtp(
  email: string,
  _mode: 'signup' | 'reset' = 'signup'
): Promise<{ sent: boolean; email: string }> {
  await delay();
  const count = (resendCounts.get(email) ?? 0) + 1;
  resendCounts.set(email, count);
  if (count > 3) {
    throw {
      message: 'You have requested too many codes. Please contact support or try again later.',
      code: 'otp_attempts_exceeded',
    } as ApiError;
  }
  return { sent: true, email };
}

export type InviteInfo = {
  company: string;
  inviter: string;
};

export async function getInvite(slug: string): Promise<InviteInfo> {
  await delay(500);
  if (slug === 'acme') {
    return { company: 'Acme Corp', inviter: 'Sarah Chen' };
  }
  throw { message: 'This invite is invalid or has expired.', code: 'invalid_invite' } as ApiError;
}

export async function createWorkspace(
  companyName: string,
  companySize: string,
  companyType: string,
  companyWebsite?: string
): Promise<{ success: boolean; workspaceId: string }> {
  await delay();
  return {
    success: true,
    workspaceId: `ws_${Math.random().toString(36).slice(2, 10)}`,
  };
}

export async function joinWorkspace(_slug: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function logout(): Promise<{ success: boolean }> {
  await delay(300);
  return { success: true };
}

export function _resetResendCounters() {
  resendCounts.clear();
}
