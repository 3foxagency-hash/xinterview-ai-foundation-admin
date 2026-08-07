/** The signed-in user's own profile — Settings → Profile. */

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

let store: UserProfile = {
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah.chen@xinterview.ai',
  phone: '+1 555 0142',
  jobTitle: 'Talent Acquisition Lead',
  location: 'San Francisco, CA',
  timezone: 'America/Los_Angeles',
  bio: 'Leading technical hiring across engineering and product.',
  avatarUrl: null,
  role: 'Owner',
  organization: 'XInterview',
  status: 'Active',
  joinedOn: 'Jan 15, 2024',
};

export async function getProfile(): Promise<UserProfile> {
  await delay();
  return { ...store };
}

export async function saveProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  await delay(700);
  const next = { ...store, ...patch };
  if (!next.firstName.trim()) throw err('profile_first_name_required');
  if (!next.lastName.trim()) throw err('profile_last_name_required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email.trim())) {
    throw err('profile_email_invalid');
  }
  store = next;
  return { ...store };
}

export const AVATAR_MAX_BYTES = 800 * 1024;
const AVATAR_TYPES = ['image/png', 'image/jpeg'];

/**
 * Reads the file to a data URL so the mock can actually display the avatar.
 * The real endpoint will return a hosted URL instead; callers only care that
 * they get back something assignable to `avatarUrl`.
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
  store = { ...store, avatarUrl };
  return { avatarUrl };
}

/** Mirrors the password policy in lib/validation/auth.ts. */
export async function changePassword(
  current: string,
  next: string,
  confirm: string
): Promise<{ success: boolean }> {
  await delay(800);
  if (!current.trim()) throw err('password_current_required');
  if (next !== confirm) throw err('password_mismatch');
  if (next.length < 8) throw err('password_too_short');
  if (!/[a-z]/.test(next) || !/[A-Z]/.test(next) || !/[0-9]/.test(next) || !/[^A-Za-z0-9]/.test(next)) {
    throw err('password_too_weak');
  }
  if (current === next) throw err('password_same_as_current');
  // The mock treats anything other than this as the wrong current password.
  if (current !== 'Passw0rd!x') throw err('password_current_wrong');
  return { success: true };
}

/** A device signed in to this account — Settings → Password & security. */
export type ActiveSession = {
  id: string;
  device: string;
  kind: 'desktop' | 'mobile';
  location: string;
  lastActive: string;
  /** The session making this request; it can't be revoked from here. */
  current: boolean;
};

let sessionStore: ActiveSession[] = [
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
  store = { ...store };
}
