/**
 * Seeded in-memory data for the user-management surface. See
 * backend-docs/usermanagement-api.md "Mock test data" — reproduced verbatim
 * (company id 64 / "Acme Corp", signed in as admin@xinterview.ai).
 */

import type {
  TeamMemberWire,
  TeamInviteeWire,
  SmtpSettings,
  Subscription,
  CreditRecord,
  BillingAddress,
  TrustedOrigin,
} from '@/lib/api/user-management-contract';

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// ─── Company details ───

export const COMPANY_ID = 64;

export const SEED_COMPANY = {
  id: 64,
  company_name: 'Acme Corp',
  logo: null as string | null,
  account_type: 'CO' as const,
  account_team_size: '1-10',
  business_type: 'technology',
  company_website: 'https://acme.example',
  phone_number: null as string | null,
  created_at: '2026-07-24T14:08:40.746663Z',
  is_active: true,
  domain_name: null as string | null,
  is_domain_verified: false,
};
let companyStore = clone(SEED_COMPANY);
export function getCompany() {
  return clone(companyStore);
}
export function updateCompany(patch: Partial<typeof companyStore>) {
  companyStore = { ...companyStore, ...patch };
  return clone(companyStore);
}

// ─── Team roster ───

const SEED_MANAGERS: TeamMemberWire[] = [
  {
    id: 501,
    email: 'marcus.reid@xinterview.ai',
    first_name: 'Marcus',
    last_name: 'Reid',
    role: 'MA',
    profile_pic: null,
    last_login: '2026-08-10T09:12:00Z',
  },
  {
    id: 502,
    email: 'priya.nair@xinterview.ai',
    first_name: 'Priya',
    last_name: 'Nair',
    role: 'MA',
    profile_pic: null,
    last_login: '2026-08-09T11:45:00Z',
  },
];
const SEED_EXECUTIVES: TeamMemberWire[] = [
  {
    id: 503,
    email: 'james.okafor@xinterview.ai',
    first_name: 'James',
    last_name: 'Okafor',
    role: 'EX',
    profile_pic: null,
    last_login: '2026-08-08T15:20:00Z',
  },
];
const SEED_INVITEES: TeamInviteeWire[] = [
  {
    id: 601,
    email: 'pending.invite@example.com',
    role: 'EX',
    invited_at: '2026-08-12T10:00:00Z',
  },
];

let managers = clone(SEED_MANAGERS);
let executives = clone(SEED_EXECUTIVES);
let invitees = clone(SEED_INVITEES);
let nextMemberId = 700;

export function getRoster() {
  return { managers: clone(managers), executives: clone(executives), invitees: clone(invitees) };
}

export function findMember(memberId: number) {
  return (
    managers.find((m) => m.id === memberId) ??
    executives.find((m) => m.id === memberId) ??
    invitees.find((m) => m.id === memberId)
  );
}

export function inviteMember(email: string, role: 'MA' | 'EX'): { alreadyExists: boolean } {
  const exists =
    managers.some((m) => m.email.toLowerCase() === email.toLowerCase()) ||
    executives.some((m) => m.email.toLowerCase() === email.toLowerCase()) ||
    invitees.some((m) => m.email.toLowerCase() === email.toLowerCase());
  if (exists) return { alreadyExists: true };
  invitees.push({ id: nextMemberId++, email, role, invited_at: new Date().toISOString() });
  return { alreadyExists: false };
}

export function changeMemberRole(memberId: number, role: 'MA' | 'EX'): TeamMemberWire | null {
  for (const list of [managers, executives]) {
    const idx = list.findIndex((m) => m.id === memberId);
    if (idx !== -1) {
      list[idx] = { ...list[idx]!, role };
      return clone(list[idx]!);
    }
  }
  return null;
}

export function removeMember(memberId: number): boolean {
  const beforeManagers = managers.length;
  const beforeExecutives = executives.length;
  const beforeInvitees = invitees.length;
  managers = managers.filter((m) => m.id !== memberId);
  executives = executives.filter((m) => m.id !== memberId);
  invitees = invitees.filter((m) => m.id !== memberId);
  return (
    managers.length !== beforeManagers ||
    executives.length !== beforeExecutives ||
    invitees.length !== beforeInvitees
  );
}

// ─── Subscription & credits ───

const SEED_SUBSCRIPTION: Subscription = {
  id: 1,
  plan: {
    id: 1,
    title: 'Growth Plan',
    price: '49.00',
    interval: 'month',
    max_jobs: null,
    max_candidates: 100,
    max_team_members: 10,
  },
  total_jobs_created: '12',
  total_candidate_interviewed: '94',
  total_team_members: '4',
  credits: '6',
  sms_credits: '120',
  renewal_date: '2026-09-24T00:00:00Z',
  subscription_date: '2026-07-24T14:08:40.746663Z',
  expiration_date: '2026-09-24T00:00:00Z',
  status: 'active',
  auto_bill: true,
  cancel_at_period_end: false,
  availed_free_credits: true,
  ai_feature_enabled: 'true',
  company: 64,
};
let subscription = clone(SEED_SUBSCRIPTION);
export function getSubscription() {
  return clone(subscription);
}
export function enableFreeCredits() {
  subscription = { ...subscription, availed_free_credits: true };
}

const SEED_CREDIT_RECORDS: CreditRecord[] = [
  { expiry_date: '2026-09-24T00:00:00Z', used_credit: 94, max_allowed: 100, is_active: true, is_sub_credit: true },
  { expiry_date: '2026-12-31T00:00:00Z', used_credit: 0, max_allowed: 25, is_active: true, is_sub_credit: false },
];
export function getCreditRecords() {
  return clone(SEED_CREDIT_RECORDS);
}

// ─── SMTP settings ───

const SEED_SMTP: SmtpSettings = {
  id: 1,
  smtp_host: 'smtp.mailersend.net',
  smtp_port: 587,
  smtp_username: 'MS_abc123',
  from_email: 'hiring@acme.example',
  from_name: 'Acme Hiring',
  use_tls: true,
  use_ssl: false,
  is_verified: true,
};
let smtp: SmtpSettings | null = clone(SEED_SMTP);
export function getSmtp() {
  return smtp ? clone(smtp) : null;
}
export function saveSmtp(next: Omit<SmtpSettings, 'id' | 'is_verified'>) {
  smtp = { id: smtp?.id ?? 1, ...next, is_verified: false };
  return clone(smtp);
}

// ─── Coupons ───

export const COUPONS: Record<string, number> = { LAUNCH20: 20, WELCOME10: 10 };

// ─── Billing addresses ───

let addresses: BillingAddress[] = [
  {
    id: 1,
    address_line1: '12 Baker Street',
    address_line2: 'Floor 3',
    city: 'Pune',
    state: 'MH',
    country: 'India',
    country_code: 'IN',
    zip_code: '411001',
  },
];
let nextAddressId = 2;
export function getAddresses() {
  return clone(addresses);
}
export function addAddress(body: Omit<BillingAddress, 'id'>) {
  const record = { id: nextAddressId++, ...body };
  addresses.push(record);
  return clone(record);
}
export function updateAddress(id: number, body: Omit<BillingAddress, 'id'>) {
  const idx = addresses.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  addresses[idx] = { id, ...body };
  return clone(addresses[idx]);
}
export function deleteAddress(id: number): boolean {
  const before = addresses.length;
  addresses = addresses.filter((a) => a.id !== id);
  return addresses.length !== before;
}

// ─── Trusted origins ───

let trustedOrigin: TrustedOrigin | null = {
  domain: 'careers.acme.example',
  verified: false,
  verification: [
    { type: 'TXT', domain: 'careers.acme.example', value: 'xinterview-verify=7f3a91c2' },
  ],
};
export function getTrustedOrigin() {
  return trustedOrigin ? clone(trustedOrigin) : null;
}
export function addTrustedOrigin(domain: string) {
  trustedOrigin = {
    domain,
    verified: false,
    verification: [{ type: 'TXT', domain, value: `xinterview-verify=${Math.random().toString(16).slice(2, 10)}` }],
  };
  return clone(trustedOrigin);
}
export function removeTrustedOrigin() {
  trustedOrigin = null;
}
export function verifyTrustedOriginTxt(): boolean {
  if (!trustedOrigin) return false;
  trustedOrigin = { ...trustedOrigin, verified: true };
  return true;
}

export const JOB_TITLES = [{ title: 'Senior Frontend Engineer' }, { title: 'Product Manager' }];

// ─── Reset (Vitest teardown) ───

export function resetUserManagementDb() {
  companyStore = clone(SEED_COMPANY);
  managers = clone(SEED_MANAGERS);
  executives = clone(SEED_EXECUTIVES);
  invitees = clone(SEED_INVITEES);
  nextMemberId = 700;
  subscription = clone(SEED_SUBSCRIPTION);
  smtp = clone(SEED_SMTP);
  addresses = [
    {
      id: 1,
      address_line1: '12 Baker Street',
      address_line2: 'Floor 3',
      city: 'Pune',
      state: 'MH',
      country: 'India',
      country_code: 'IN',
      zip_code: '411001',
    },
  ];
  nextAddressId = 2;
  trustedOrigin = {
    domain: 'careers.acme.example',
    verified: false,
    verification: [
      { type: 'TXT', domain: 'careers.acme.example', value: 'xinterview-verify=7f3a91c2' },
    ],
  };
}
