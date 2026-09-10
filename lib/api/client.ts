/**
 * Real fetch client — the network seam MSW intercepts.
 *
 * See docs/msw-mocking.md. Every function in lib/api/auth.ts, profile.ts and
 * settings.ts that has a doc-covered backend endpoint calls through here
 * instead of resolving locally.
 */

import { getSession, getSessionEmail } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
// No `/api/v1` prefix — none of the documented paths use one.
const API_PREFIX = '';

export type NormalizedApiError = {
  code: string;
  message: string;
  retryAfter?: number;
  fieldErrors?: Record<string, string>;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Attach the bearer token from the current session. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
  /** Per-call status → error-code overrides, for endpoints with no body-level code. */
  statusCodeMap?: Partial<Record<number, string>>;
};

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal, statusCodeMap } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const session = getSession();
    if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
    // Mock-only: the fake JWT carries no identity, so the mock handlers read
    // "the signed-in user" from this header instead of decoding a real token.
    // Real handlers/backends ignore it; harmless once a real backend answers.
    const email = getSessionEmail();
    if (email) headers['X-Mock-User-Email'] = email;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw normalizeNetworkError();
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const json = text ? safeJsonParse(text) : undefined;

  if (!res.ok) {
    throw normalizeErrorEnvelope(res, json, statusCodeMap);
  }
  return json as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function normalizeNetworkError(): NormalizedApiError {
  return { code: 'network_error', message: 'network_error' };
}

/**
 * Normalizes the backend's error envelopes into {code, message, retryAfter?,
 * fieldErrors?} — the shape lib/errors/auth-messages.ts and
 * lib/errors/settings-messages.ts already expect. The docs record five wire
 * shapes across auth + user-management:
 *
 *  1. {detail, code?}                  — login, OTP, refresh, most 401/403/404s
 *  2. {field: [msgs], ...}             — DRF field errors (register, companies)
 *  3. {non_field_errors} / {messages}  — reset-password
 *  4. {error}                          — domain-check/txt, coupons
 *
 * The backend sends no stable machine codes (doc issue), so `statusCodeMap`
 * lets a call site disambiguate by status when the body alone is ambiguous
 * (e.g. login's 429 lockout vs. its 404 invalid-credentials, both {detail}).
 */
export function normalizeErrorEnvelope(
  res: Response,
  json: unknown,
  statusCodeMap: Partial<Record<number, string>> = {}
): NormalizedApiError {
  const retryAfterHeader = res.headers.get('Retry-After');
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;

  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;

    if (typeof obj.detail === 'string') {
      const code =
        typeof obj.code === 'string'
          ? obj.code
          : (statusCodeMap[res.status] ?? inferCodeFromDetail(obj.detail, res.status));
      return { code, message: obj.detail, retryAfter };
    }
    if (typeof obj.messages === 'string') {
      return { code: statusCodeMap[res.status] ?? 'token_invalid', message: obj.messages, retryAfter };
    }
    if (Array.isArray(obj.non_field_errors)) {
      return {
        code: statusCodeMap[res.status] ?? 'password_mismatch',
        message: obj.non_field_errors[0] ?? 'validation_failed',
        retryAfter,
      };
    }
    if (typeof obj.error === 'string') {
      return { code: statusCodeMap[res.status] ?? 'unknown', message: obj.error, retryAfter };
    }

    const fieldErrors: Record<string, string> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val) && typeof val[0] === 'string') fieldErrors[key] = val[0];
    }
    if (Object.keys(fieldErrors).length > 0) {
      const firstMessage = Object.values(fieldErrors)[0]!;
      return { code: 'validation_failed', message: firstMessage, fieldErrors, retryAfter };
    }
  }

  return { code: statusCodeMap[res.status] ?? 'unknown', message: 'unknown', retryAfter };
}

function inferCodeFromDetail(detail: string, status: number): string {
  const d = detail.toLowerCase();
  if (status === 404 && d.includes('invalid credentials')) return 'invalid_credentials';
  if (status === 429) return 'account_locked';
  if (d.includes('otp has mismatch')) return 'otp_mismatch';
  if (d.includes('otp has expired')) return 'token_expired';
  if (d.includes('authentication credentials')) return 'unauthenticated';
  if (d.includes('invalid or has expired')) return 'token_invalid';
  return 'unknown';
}
