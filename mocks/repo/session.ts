import { DEFAULT_ORG_ID } from '../db';

/**
 * Resolves the acting organisation and user for a mocked request.
 *
 * The real backend reads these from the session cookie, which the browser never
 * gets to choose. Mocks cannot verify a cookie, so this returns the seeded org
 * unless a dev-only override header is present.
 *
 * The override exists so cross-tenant isolation is *testable*: a test can ask
 * for another org and assert that jobs from the seeded org read as missing.
 * It is deliberately a header the app itself never sends — production tenant
 * scoping must never be client-selectable.
 */

export const ORG_OVERRIDE_HEADER = 'x-mock-org-id';
export const USER_OVERRIDE_HEADER = 'x-mock-user-id';

/** Member id treated as the acting user, and therefore a job's creator. */
const DEFAULT_MEMBER_ID = 'cm_1';

export function currentOrgId(request: Request): string {
  return request.headers.get(ORG_OVERRIDE_HEADER) ?? DEFAULT_ORG_ID;
}

export function currentMemberId(request: Request): string {
  return request.headers.get(USER_OVERRIDE_HEADER) ?? DEFAULT_MEMBER_ID;
}
