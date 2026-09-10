import { resetAuthDb } from '../db/auth.db';
import { resetUserManagementDb } from '../db/user-management.db';

/** Resets every mock db to its seed state — call between Vitest tests. */
export function resetAllMockDb() {
  resetAuthDb();
  resetUserManagementDb();
}
