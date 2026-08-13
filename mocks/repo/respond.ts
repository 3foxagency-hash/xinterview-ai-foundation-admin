import { HttpResponse } from 'msw';
import type { ErrorBody } from '@/lib/api/contract';

/**
 * Shared response builders. Every handler goes through these so the mock's
 * envelope and error shape match the real contract exactly once, rather than
 * being re-typed (and drifting) in each handler.
 */

let counter = 0;

export function mockRequestId(): string {
  counter += 1;
  return `req_mock_${counter.toString().padStart(4, '0')}`;
}

export function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new HttpResponse(null, { status: 204 });
}

export function fail(
  status: number,
  code: string,
  message: string,
  extra?: Partial<Pick<ErrorBody, 'fieldErrors' | 'retryAfter'>>
) {
  const body: ErrorBody = {
    code,
    message,
    requestId: mockRequestId(),
    ...extra,
  };
  return HttpResponse.json(body, {
    status,
    headers: extra?.retryAfter
      ? { 'retry-after': String(extra.retryAfter) }
      : undefined,
  });
}

export const validationFailed = (
  fieldErrors: Record<string, string>,
  message = 'The submitted data is invalid'
) => fail(422, 'VALIDATION_FAILED', message, { fieldErrors });

export const unauthorized = (code: string, message: string) =>
  fail(401, code, message);

export const forbidden = (message = 'You do not have permission to do that') =>
  fail(403, 'FORBIDDEN', message);

export const notFound = (message = 'Not found') =>
  fail(404, 'NOT_FOUND', message);

export const conflict = (code: string, message: string) =>
  fail(409, code, message);

export const rateLimited = (retryAfter: number, message: string) =>
  fail(429, 'TOO_MANY_ATTEMPTS', message, { retryAfter });

export const serverError = (message = 'Something went wrong on our end') =>
  fail(500, 'INTERNAL_ERROR', message);

/**
 * Randomised latency in a realistic band. Never zero: loading states must be
 * visible during development, or they ship untested.
 */
export function latency(min = 200, max = 600): number {
  return min + Math.floor(Math.random() * (max - min));
}
