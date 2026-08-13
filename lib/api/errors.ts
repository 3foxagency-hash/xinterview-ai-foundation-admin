import type { ErrorBody } from './contract';

/**
 * Normalized API error. Every failure that leaves the client is one of these,
 * so call sites branch on `code` and never inspect raw fetch internals.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;
  readonly requestId?: string;
  readonly retryAfter?: number;
  /**
   * The untouched response body.
   *
   * Kept because this backend uses three different error envelopes, and only
   * the raw shape distinguishes DRF field errors from `{ detail }`. Normalizing
   * happens per-resource, so the generic client must not discard it.
   */
  readonly raw?: Record<string, unknown>;

  constructor(init: {
    code: string;
    message: string;
    status: number;
    fieldErrors?: Record<string, string>;
    requestId?: string;
    retryAfter?: number;
    raw?: Record<string, unknown>;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.code = init.code;
    this.status = init.status;
    this.fieldErrors = init.fieldErrors;
    this.requestId = init.requestId;
    this.retryAfter = init.retryAfter;
    this.raw = init.raw;
  }

  static from(body: Partial<ErrorBody> | null, status: number): ApiError {
    const raw = (body ?? undefined) as Record<string, unknown> | undefined;
    // `detail` is this backend's message field; `message` is the enveloped
    // contract's. Falling back across both keeps one client serving both.
    const message =
      (typeof raw?.detail === 'string' ? raw.detail : undefined) ??
      body?.message ??
      'Request failed';
    return new ApiError({
      code: body?.code ?? 'UNKNOWN',
      message,
      status,
      fieldErrors: body?.fieldErrors,
      requestId: body?.requestId,
      retryAfter: body?.retryAfter,
      raw,
    });
  }

  /** Network failure, DNS, CORS, offline — no HTTP response arrived. */
  static network(cause?: unknown): ApiError {
    return new ApiError({
      code: 'NETWORK_ERROR',
      message:
        cause instanceof Error
          ? cause.message
          : 'Could not reach the server. Check your connection.',
      status: 0,
    });
  }

  /** Client-side limiter tripped — indicates a bug in the calling code. */
  static clientRateLimited(endpoint: string): ApiError {
    return new ApiError({
      code: 'CLIENT_RATE_LIMITED',
      message: `Too many requests to ${endpoint} from this client`,
      status: 429,
    });
  }

  get isRetryable(): boolean {
    // 4xx is never transient; 429 must not be hammered.
    if (this.status === 429) return false;
    if (this.status >= 400 && this.status < 500) return false;
    return true;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
