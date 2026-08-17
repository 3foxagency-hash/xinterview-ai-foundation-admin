import { apiOrigin, API_V1 } from '@/lib/config/env';
import { ApiError } from './errors';
import type { ErrorBody } from './contract';
import {
  take,
  isCircuitOpen,
  recordSuccess,
  recordFailure,
} from './rate-limit';

/**
 * The single fetch path for all API calls.
 *
 * Applied in order: correlation → rate limit → circuit breaker → fetch →
 * error normalization.
 */

export type RequestOptions = {
  /** Path relative to the API origin, e.g. '/auth/tokens'. */
  path: string;
  /**
   * Prefix the path with /api/v1. Defaults to true for the resources still on
   * the invented contract; auth passes false because the real backend serves
   * those routes at the root.
   */
  versioned?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Forwarded so callers can cancel — filter changes, autosave, search. */
  signal?: AbortSignal;
  /** Minted once per user intent for side-effecting POSTs. */
  idempotencyKey?: string;
  headers?: Record<string, string>;
};

function requestId(): string {
  // Correlation ID: rendered in error states, attached to telemetry, quoted in
  // support conversations — so one complaint traces to one backend log line.
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 20)
      : Math.random().toString(36).slice(2, 14);
  return `req_${rand}`;
}

function buildUrl(
  path: string,
  query: RequestOptions['query'],
  versioned: boolean
): string {
  const url = new URL(`${apiOrigin}${versioned ? API_V1 : ''}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const {
    path,
    method = 'GET',
    body,
    query,
    signal,
    idempotencyKey,
    versioned = true,
  } = options;

  // Bucket by method + path template so /jobs/abc and /jobs/def share a bucket.
  const bucketKey = `${method} ${path.replace(/\/[\w-]{8,}/g, '/*')}`;

  if (isCircuitOpen(bucketKey)) {
    throw new ApiError({
      code: 'CIRCUIT_OPEN',
      message: 'This service is temporarily unavailable. Retrying shortly.',
      status: 503,
    });
  }

  if (!take(bucketKey)) {
    // A tripped client limiter means a bug in the calling code — surface it.
    console.warn(`[api] client rate limit tripped for ${bucketKey}`);
    throw ApiError.clientRateLimited(bucketKey);
  }

  const headers: Record<string, string> = {
    'x-request-id': requestId(),
    ...options.headers,
  };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query, versioned), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
      signal,
    });
  } catch (cause) {
    // Propagate deliberate cancellation untouched so callers can ignore it.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    recordFailure(bucketKey);
    throw ApiError.network(cause);
  }

  if (!response.ok) {
    let errorBody: Partial<ErrorBody> | null = null;
    try {
      errorBody = (await response.json()) as Partial<ErrorBody>;
    } catch {
      // Non-JSON error body (proxy error page, gateway timeout).
    }

    // Only server failures count toward the breaker; 4xx is the caller's fault.
    if (response.status >= 500) recordFailure(bucketKey);
    else recordSuccess(bucketKey);

    // Retry-After is an HTTP header, not a body field — read it here so every
    // resource gets it without each one re-implementing the parse.
    const retryHeader = Number(response.headers.get('retry-after'));
    const withRetry =
      Number.isFinite(retryHeader) && retryHeader > 0
        ? { ...(errorBody ?? {}), retryAfter: retryHeader }
        : errorBody;

    throw ApiError.from(withRetry, response.status);
  }

  recordSuccess(bucketKey);

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Unwraps the `{ data }` envelope for callers that only want the payload. */
export async function requestData<T>(options: RequestOptions): Promise<T> {
  const result = await request<{ data: T }>(options);
  return result.data;
}

export const api = {
  get: <T>(path: string, o?: Omit<RequestOptions, 'path' | 'method'>) =>
    requestData<T>({ ...o, path, method: 'GET' }),
  post: <T>(path: string, o?: Omit<RequestOptions, 'path' | 'method'>) =>
    requestData<T>({ ...o, path, method: 'POST' }),
  put: <T>(path: string, o?: Omit<RequestOptions, 'path' | 'method'>) =>
    requestData<T>({ ...o, path, method: 'PUT' }),
  patch: <T>(path: string, o?: Omit<RequestOptions, 'path' | 'method'>) =>
    requestData<T>({ ...o, path, method: 'PATCH' }),
  delete: <T>(path: string, o?: Omit<RequestOptions, 'path' | 'method'>) =>
    requestData<T>({ ...o, path, method: 'DELETE' }),
};
