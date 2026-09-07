/**
 * The signed-in user's own profile — Settings → Profile.
 *
 * This is a display-model blend: `firstName`/`lastName`/`email`/`timezone`/
 * `avatarUrl` come from the real GET /user-management/me/ (via getMe()) each
 * call; `phone`/`jobTitle`/`location`/`bio`/`role`/`organization`/`status`/
 * `joinedOn` have no equivalent in backend-docs/usermanagement-api.md and stay
 * local-only. Don't assume the whole shape round-trips to a backend.
 */

import { apiFetch } from './client';
import { UM_PATHS } from './user-management-contract';
import { getMe } from './auth';

function delay(ms = 600) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function err(code: string) {
  return { code, message: code };
}

export type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  location: string;
  timezone: string;
  bio: string;
  avatarUrl: string | null;
  role: string;
  organization: string;
  status: 'Active' | 'Invited' | 'Suspended';
  joinedOn: string;
};

type LocalFields = Pick<
  UserProfile,
  'phone' | 'jobTitle' | 'location' | 'bio' | 'role' | 'organization' | 'status' | 'joinedOn'
>;

const SEED_LOCAL: LocalFields = {
  phone: '+1 555 0142',
  jobTitle: 'Talent Acquisition Lead',
  location: 'San Francisco, CA',
  bio: 'Leading technical hiring across engineering and product.',
  role: 'Owner',
  organization: 'XInterview',
  status: 'Active',
  joinedOn: 'Jan 15, 2024',
};

let localStore: LocalFields = { ...SEED_LOCAL };

export async function getProfile(): Promise<UserProfile> {
  await delay();
  const me = await getMe();
  return {
    firstName: me.first_name,
    lastName: me.last_name,
    email: me.email,
    timezone: me.timezone,
    avatarUrl: me.profile_pic,
    ...localStore,
  };
}

export async function saveProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  await delay(700);

  if (patch.firstName !== undefined && !patch.firstName.trim()) {
    throw err('profile_first_name_required');
  }
  if (patch.lastName !== undefined && !patch.lastName.trim()) {
    throw err('profile_last_name_required');
  }
  if (patch.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email.trim())) {
    throw err('profile_email_invalid');
  }

  const remoteKeys = ['firstName', 'lastName', 'timezone', 'avatarUrl'] as const;
  const remotePatch: Record<string, unknown> = {};
  if (patch.firstName !== undefined) remotePatch.first_name = patch.firstName;
  if (patch.lastName !== undefined) remotePatch.last_name = patch.lastName;
  if (patch.timezone !== undefined) remotePatch.timezone = patch.timezone;
  if (patch.avatarUrl !== undefined) remotePatch.profile_pic = patch.avatarUrl;

  if (Object.keys(remotePatch).length > 0) {
    await apiFetch(UM_PATHS.me, { method: 'PATCH', body: remotePatch });
  }

  const localPatch: Partial<LocalFields> = {};
  for (const key of Object.keys(patch) as (keyof UserProfile)[]) {
    if (!remoteKeys.includes(key as (typeof remoteKeys)[number]) && key in localStore) {
      (localPatch as Record<string, unknown>)[key] = patch[key];
    }
  }
  localStore = { ...localStore, ...localPatch };

  return getProfile();
}

export const AVATAR_MAX_BYTES = 800 * 1024;
const AVATAR_TYPES = ['image/png', 'image/jpeg'];

/**
 * No avatar-upload endpoint exists in the docs (profile_pic is a plain string
 * field set via PATCH, not a multipart upload) — kept entirely local.
 * Reads the file to a data URL so this in-memory flow can actually display
 * the avatar; a real upload endpoint would return a hosted URL instead.
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  if (!AVATAR_TYPES.includes(file.type)) throw err('avatar_type_invalid');
  if (file.size > AVATAR_MAX_BYTES) throw err('avatar_too_large');

  const avatarUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(err('avatar_read_failed'));
    reader.readAsDataURL(file);
  });

  await delay(600);
  await apiFetch(UM_PATHS.me, { method: 'PATCH', body: { profile_pic: avatarUrl } });
  return { avatarUrl };
}

export async function changePassword(
  current: string,
  next: string,
  confirm: string
): Promise<{ success: boolean }> {
  if (!current.trim()) throw err('password_current_required');
  if (next !== confirm) throw err('password_mismatch');
  if (next.length < 8) throw err('password_too_short');
  if (!/[a-z]/.test(next) || !/[A-Z]/.test(next) || !/[0-9]/.test(next) || !/[^A-Za-z0-9]/.test(next)) {
    throw err('password_too_weak');
  }
  if (current === next) throw err('password_same_as_current');

  await apiFetch<{ message: string }>(UM_PATHS.changePassword, {
    method: 'POST',
    body: { old_password: current, new_password: next },
  });
  return { success: true };
}

/** Sends a confirmation link; the address is not changed until it's clicked. */
export async function changeEmail(email: string): Promise<{ sent: boolean }> {
  await apiFetch<{ message: string }>(UM_PATHS.changeEmail, { method: 'PUT', body: { email } });
  return { sent: true };
}

/** A device signed in to this account — Settings → Password & security. No doc equivalent; stays local. */
export type ActiveSession = {
  id: string;
  device: string;
  kind: 'desktop' | 'mobile';
  location: string;
  lastActive: string;
  /** The session making this request; it can't be revoked from here. */
  current: boolean;
};

const SEED_SESSIONS: ActiveSession[] = [
  {
    id: 'ses_1',
    device: 'Chrome on macOS',
    kind: 'desktop',
    location: 'San Francisco, US',
    lastActive: 'Active now',
    current: true,
  },
  {
    id: 'ses_2',
    device: 'Safari on iPhone',
    kind: 'mobile',
    location: 'San Francisco, US',
    lastActive: 'Yesterday at 6:41 PM',
    current: false,
  },
  {
    id: 'ses_3',
    device: 'Firefox on Windows',
    kind: 'desktop',
    location: 'Austin, US',
    lastActive: '3 days ago',
    current: false,
  },
];

let sessionStore: ActiveSession[] = [...SEED_SESSIONS];

export async function getSessions(): Promise<ActiveSession[]> {
  await delay(500);
  return sessionStore.map((s) => ({ ...s }));
}

export async function revokeSession(id: string): Promise<{ success: boolean }> {
  await delay(600);
  const target = sessionStore.find((s) => s.id === id);
  if (!target) throw err('session_not_found');
  if (target.current) throw err('session_is_current');
  sessionStore = sessionStore.filter((s) => s.id !== id);
  return { success: true };
}

export function _resetProfileStore() {
  localStore = { ...SEED_LOCAL };
  sessionStore = [...SEED_SESSIONS];
}
