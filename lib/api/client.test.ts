import { describe, it, expect } from 'vitest';
import { normalizeErrorEnvelope } from './client';

function fakeResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response(null, { status, headers });
}

describe('normalizeErrorEnvelope', () => {
  it('normalizes {detail} into {code, message}', () => {
    const result = normalizeErrorEnvelope(fakeResponse(404), { detail: 'Invalid credentials' });
    expect(result).toEqual({ code: 'invalid_credentials', message: 'Invalid credentials', retryAfter: undefined });
  });

  it('normalizes {detail, code} — explicit code passes through', () => {
    const result = normalizeErrorEnvelope(fakeResponse(401), {
      detail: 'Token is invalid',
      code: 'token_not_valid',
    });
    expect(result).toEqual({ code: 'token_not_valid', message: 'Token is invalid', retryAfter: undefined });
  });

  it('normalizes {field: [msgs]} DRF field errors', () => {
    const result = normalizeErrorEnvelope(fakeResponse(400), {
      email: ['Email is already registered.'],
    });
    expect(result).toEqual({
      code: 'validation_failed',
      message: 'Email is already registered.',
      fieldErrors: { email: 'Email is already registered.' },
      retryAfter: undefined,
    });
  });

  it('normalizes {non_field_errors}', () => {
    const result = normalizeErrorEnvelope(fakeResponse(400), {
      non_field_errors: ['Password Mismatch'],
    });
    expect(result).toEqual({ code: 'password_mismatch', message: 'Password Mismatch', retryAfter: undefined });
  });

  it('normalizes {messages}', () => {
    const result = normalizeErrorEnvelope(fakeResponse(400), {
      messages: 'Token has been expired!, Bad or expired Token',
    });
    expect(result).toEqual({
      code: 'token_invalid',
      message: 'Token has been expired!, Bad or expired Token',
      retryAfter: undefined,
    });
  });

  it('normalizes {error}', () => {
    const result = normalizeErrorEnvelope(fakeResponse(400), {
      error: 'No TXT record found for this domain.',
    });
    expect(result).toEqual({ code: 'unknown', message: 'No TXT record found for this domain.', retryAfter: undefined });
  });

  it('reads Retry-After for a 429', () => {
    const result = normalizeErrorEnvelope(fakeResponse(429, { 'Retry-After': '900' }), {
      detail: 'Too many failed attempts…',
    });
    expect(result.retryAfter).toBe(900);
    expect(result.code).toBe('account_locked');
  });

  it('applies a statusCodeMap override even when a code can be inferred', () => {
    const result = normalizeErrorEnvelope(
      fakeResponse(404),
      { detail: 'This invite is invalid or has expired.' },
      { 404: 'invite_not_found' }
    );
    expect(result.code).toBe('invite_not_found');
  });

  it('falls back to unknown for an unrecognized shape', () => {
    const result = normalizeErrorEnvelope(fakeResponse(500), { whatever: true });
    expect(result.code).toBe('unknown');
  });
});
