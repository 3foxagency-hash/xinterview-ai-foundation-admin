import { authRepo } from './auth';
import { decodeBase64Url } from './base64';
import { db } from '../db';
import type { MockUser } from '../db';

/**
 * Resolves the caller from the Authorization header.
 *
 * The mock JWT embeds the numeric user id, so a token issued by one mocked
 * login identifies that user on every later call. Shared between the auth and
 * user-management handlers — without it, each resource would re-implement the
 * same parse and they would drift.
 */
export function authenticate(request: Request): MockUser | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const parts = header.slice(7).split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as {
      user_id?: string;
    };
    if (!payload.user_id) return null;
    return authRepo.findById(Number(payload.user_id));
  } catch {
    return null;
  }
}

/**
 * The company the authenticated user belongs to, as a numeric id.
 *
 * Every user-management handler scopes on this rather than trusting the
 * `{companyId}` in the URL — otherwise any authenticated user could read
 * another company's data by editing the path, which is exactly the cross-tenant
 * leak the repo layer's `companyId`-first rule exists to prevent.
 */
export function currentCompanyId(user: MockUser): number | null {
  const org = db().organisations.get(user.orgId);
  return org?.numericId ?? null;
}
