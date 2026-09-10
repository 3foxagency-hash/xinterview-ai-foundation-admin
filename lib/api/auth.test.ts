import { describe, it, expect } from 'vitest';
import { login, verifyOtp, getInvite, setSession } from './auth';

describe('login', () => {
  it('succeeds for a seeded account', async () => {
    const result = await login('admin@xinterview.ai', 'password123');
    expect(result.user.email).toBe('admin@xinterview.ai');
    expect(result.token).toBeTruthy();
  });

  it('rejects the wrong password with invalid_credentials', async () => {
    await expect(login('admin@xinterview.ai', 'wrong')).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
  });

  it('locks out the seeded locked account with a 429 and retryAfter', async () => {
    await expect(login('locked@xinterview.ai', 'password123')).rejects.toMatchObject({
      code: 'account_locked',
      retryAfter: 900,
    });
  });
});

describe('verifyOtp', () => {
  it('accepts the valid OTP for signup', async () => {
    setSession({ accessToken: 'tok', refreshToken: 'r', lastSeenMonitor: 'l' }, 'unverified@xinterview.ai');
    const result = await verifyOtp('unverified@xinterview.ai', '123456', 'signup');
    expect(result.verified).toBe(true);
  });

  it('reports expired for the expired OTP', async () => {
    setSession({ accessToken: 'tok', refreshToken: 'r', lastSeenMonitor: 'l' }, 'unverified@xinterview.ai');
    await expect(verifyOtp('unverified@xinterview.ai', '111111', 'signup')).rejects.toMatchObject({
      code: 'token_expired',
    });
  });

  it('reports mismatch for any other code', async () => {
    setSession({ accessToken: 'tok', refreshToken: 'r', lastSeenMonitor: 'l' }, 'unverified@xinterview.ai');
    await expect(verifyOtp('unverified@xinterview.ai', '000000', 'signup')).rejects.toMatchObject({
      code: 'otp_mismatch',
    });
  });
});

describe('getInvite', () => {
  it('resolves the seeded "acme" slug', async () => {
    const invite = await getInvite('acme');
    expect(invite.company).toBe('Acme Corp');
  });

  it('404s for an unknown slug', async () => {
    await expect(getInvite('nope')).rejects.toMatchObject({ code: 'invite_not_found' });
  });
});
