/**
 * Shared response-body builders for the backend's error envelope shapes, so
 * handlers stay declarative and exercise the exact shapes
 * lib/api/client.ts#normalizeErrorEnvelope must handle. See
 * backend-docs/auth-api.md and usermanagement-api.md section 2 ("Backend
 * issues found") for why there are this many shapes.
 */

export function detailError(detail: string, code?: string) {
  return code ? { detail, code } : { detail };
}

export function fieldError(fields: Record<string, string>) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, [v]]));
}

export function messagesError(messages: string) {
  return { messages };
}

export function nonFieldError(messages: string[]) {
  return { non_field_errors: messages };
}

export function plainError(error: string) {
  return { error };
}
