import type { ApiError } from './auth';

export type Role = 'Owner' | 'Admin' | 'Member';
export type MemberStatus = 'active' | 'pending';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  joinedAt: string | null;
  invitedAt: string | null;
  initials: string;
};

export type Organization = {
  id: string;
  name: string;
  website: string;
  size: string;
  phone: string;
  companyType: 'Corporate' | 'Agency';
  businessCategory: string;
  logoUrl: string | null;
  seatLimit: number;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isOwner: boolean;
};

function delay(ms = 800) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

let simulateSeatLimit = false;
export function _setSimulateSeatLimit(on: boolean) {
  simulateSeatLimit = on;
}

const CURRENT_USER: CurrentUser = {
  id: 'usr_owner',
  name: 'Sarah Chen',
  email: 'sarah.chen@xinterview.ai',
  role: 'Owner',
  isOwner: true,
};

const BASE_MEMBERS: TeamMember[] = [
  {
    id: 'usr_owner',
    name: 'Sarah Chen',
    email: 'sarah.chen@xinterview.ai',
    role: 'Owner',
    status: 'active',
    joinedAt: '2024-01-15',
    invitedAt: null,
    initials: 'SC',
  },
  {
    id: 'usr_admin_1',
    name: 'Marcus Reid',
    email: 'marcus.reid@xinterview.ai',
    role: 'Admin',
    status: 'active',
    joinedAt: '2024-02-03',
    invitedAt: null,
    initials: 'MR',
  },
  {
    id: 'usr_admin_2',
    name: 'Priya Nair',
    email: 'priya.nair@xinterview.ai',
    role: 'Admin',
    status: 'active',
    joinedAt: '2024-03-12',
    invitedAt: null,
    initials: 'PN',
  },
  {
    id: 'usr_mem_1',
    name: 'James Okafor',
    email: 'james.okafor@xinterview.ai',
    role: 'Member',
    status: 'active',
    joinedAt: '2024-04-20',
    invitedAt: null,
    initials: 'JO',
  },
  {
    id: 'usr_mem_2',
    name: 'Elena Volkova',
    email: 'elena.volkova@xinterview.ai',
    role: 'Member',
    status: 'active',
    joinedAt: '2024-05-08',
    invitedAt: null,
    initials: 'EV',
  },
  {
    id: 'usr_mem_3',
    name: 'David Kim',
    email: 'david.kim@xinterview.ai',
    role: 'Member',
    status: 'active',
    joinedAt: '2024-06-02',
    invitedAt: null,
    initials: 'DK',
  },
  {
    id: 'usr_mem_4',
    name: 'Aisha Bakr',
    email: 'aisha.bakr@xinterview.ai',
    role: 'Member',
    status: 'active',
    joinedAt: '2024-07-10',
    invitedAt: null,
    initials: 'AB',
  },
  {
    id: 'inv_pending_1',
    name: 'Tom Walker',
    email: 'tom.walker@external.com',
    role: 'Member',
    status: 'pending',
    joinedAt: null,
    invitedAt: '2024-08-01',
    initials: 'TW',
  },
  {
    id: 'inv_pending_2',
    name: 'Lina Garcia',
    email: 'lina.garcia@external.com',
    role: 'Admin',
    status: 'pending',
    joinedAt: null,
    invitedAt: '2024-08-03',
    initials: 'LG',
  },
];

const ORG: Organization = {
  id: 'org_1',
  name: 'XInterview',
  website: 'https://xinterview.ai',
  size: '10-50',
  phone: '+1 555 0100',
  companyType: 'Corporate',
  businessCategory: 'Private Limited Company / LTD',
  logoUrl: null,
  seatLimit: 15,
};

let orgStore: Organization = { ...ORG };
let memberStore: TeamMember[] = [...BASE_MEMBERS];

function err(code: string, message: string): ApiError {
  return { code, message } as ApiError;
}

export async function getOrganization(): Promise<Organization> {
  await delay();
  return { ...orgStore };
}

export async function updateOrganization(
  patch: Partial<Organization>
): Promise<Organization> {
  await delay();
  orgStore = { ...orgStore, ...patch };
  return { ...orgStore };
}

export async function uploadLogo(_file: File): Promise<{ logoUrl: string }> {
  await delay(1000);
  return { logoUrl: 'mock://logo' };
}

export async function getCurrentUser(): Promise<CurrentUser> {
  await delay(300);
  return { ...CURRENT_USER };
}

export async function getTeamRoster(): Promise<{ members: TeamMember[]; seatLimit: number }> {
  await delay();
  if (simulateSeatLimit) {
    const filler: TeamMember[] = Array.from({ length: 6 }, (_, i) => ({
      id: `usr_fill_${i}`,
      name: `Filler Member ${i + 1}`,
      email: `filler${i + 1}@xinterview.ai`,
      role: 'Member' as Role,
      status: 'active' as MemberStatus,
      joinedAt: '2024-07-01',
      invitedAt: null,
      initials: `F${i + 1}`,
    }));
    memberStore = [...BASE_MEMBERS, ...filler];
  } else {
    memberStore = [...BASE_MEMBERS];
  }
  return { members: memberStore, seatLimit: orgStore.seatLimit };
}

export async function inviteMember(
  email: string,
  role: 'Admin' | 'Member'
): Promise<TeamMember> {
  await delay();
  const existing = memberStore.find((m) => m.email.toLowerCase() === email.toLowerCase());
  if (existing && existing.status === 'active') {
    throw err('already_member', 'already_member');
  }
  if (existing && existing.status === 'pending') {
    throw err('already_invited', 'already_invited');
  }
  const seatsUsed = memberStore.length;
  if (seatsUsed >= orgStore.seatLimit) {
    throw err('seat_limit_reached', 'seat_limit_reached');
  }
  const [localPart] = email.split('@');
  const name = localPart.charAt(0).toUpperCase() + localPart.slice(1).split('.')[0];
  const initials = name.slice(0, 2).toUpperCase();
  const newMember: TeamMember = {
    id: `inv_${Math.random().toString(36).slice(2, 10)}`,
    name,
    email,
    role,
    status: 'pending',
    joinedAt: null,
    invitedAt: new Date().toISOString().slice(0, 10),
    initials,
  };
  memberStore = [...memberStore, newMember];
  return newMember;
}

export async function resendInvite(inviteId: string): Promise<{ sent: boolean }> {
  await delay();
  const invite = memberStore.find((m) => m.id === inviteId);
  if (!invite || invite.status !== 'pending') {
    throw err('resend_failed', 'resend_failed');
  }
  return { sent: true };
}

export async function cancelInvite(inviteId: string): Promise<{ success: boolean }> {
  await delay();
  const invite = memberStore.find((m) => m.id === inviteId);
  if (!invite || invite.status !== 'pending') {
    throw err('cancel_invite_failed', 'cancel_invite_failed');
  }
  memberStore = memberStore.filter((m) => m.id !== inviteId);
  return { success: true };
}

export async function changeMemberRole(
  memberId: string,
  role: 'Admin' | 'Member'
): Promise<{ success: boolean }> {
  await delay();
  const member = memberStore.find((m) => m.id === memberId);
  if (!member) {
    throw err('role_change_failed', 'role_change_failed');
  }
  memberStore = memberStore.map((m) =>
    m.id === memberId ? { ...m, role } : m
  );
  return { success: true };
}

export async function removeMember(memberId: string): Promise<{ success: boolean }> {
  await delay();
  const member = memberStore.find((m) => m.id === memberId);
  if (!member || member.role === 'Owner') {
    throw err('removal_failed', 'removal_failed');
  }
  memberStore = memberStore.filter((m) => m.id !== memberId);
  return { success: true };
}

export function copyInviteLink(inviteId: string): string {
  return `https://xinterview.ai/invite/${inviteId}`;
}

export function _resetSettingsStore() {
  orgStore = { ...ORG };
  memberStore = [...BASE_MEMBERS];
  simulateSeatLimit = false;
}
