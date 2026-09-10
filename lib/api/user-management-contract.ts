/**
 * User-management wire contract — XInterview backend.
 *
 * Companion to auth-contract.ts. See backend-docs/usermanagement-api.md.
 *
 * v1 scope: only paths consumed by lib/api/profile.ts and lib/api/settings.ts
 * in this pass (see docs/msw-mocking.md for the full mocked/deferred status
 * per endpoint). Everything else documented in the doc but not wired to a
 * migrated function yet is listed under "Deferred" at the bottom — add it the
 * same way when a screen needs one: type here -> seed in
 * mocks/db/user-management.db.ts -> handler in mocks/handlers/user-management.ts
 * -> client function in lib/api/*.ts.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────────────────────────────────────

export const UM_PATHS = {
  me: '/user-management/me/',
  changePassword: '/user-management/me/password/',
  changeEmail: '/user-management/me/email/',
  myCompanies: '/user-management/my-companies/',

  companyDetails: (companyId: number | string) =>
    `/user-management/company/${companyId}/details/`,
  subscription: (companyId: number | string) =>
    `/user-management/company/${companyId}/subscription/`,
  creditRecords: (companyId: number | string) =>
    `/user-management/company/${companyId}/credit-records/`,
  enableFreeCredits: (companyId: number | string) =>
    `/user-management/company/${companyId}/enable-free-credits/`,

  members: (companyId: number | string) =>
    `/user-management/company/${companyId}/members/`,
  member: (companyId: number | string, memberId: number | string) =>
    `/user-management/company/${companyId}/members/${memberId}/`,

  smtpSettings: (companyId: number | string) =>
    `/user-management/company/${companyId}/smtp-settings/`,
  smtpVerify: (companyId: number | string) =>
    `/user-management/company/${companyId}/smtp-settings/verify/`,

  coupons: (companyId: number | string) => `/user-management/company/${companyId}/coupons/`,

  addresses: (companyId: number | string) => `/user-management/company/${companyId}/addresses/`,
  address: (companyId: number | string, addressId: number | string) =>
    `/user-management/company/${companyId}/addresses/${addressId}/`,

  trustedOrigins: (companyId: number | string) =>
    `/user-management/company/${companyId}/trusted-origins/`,
  domainCheckTxt: (companyId: number | string) =>
    `/user-management/company/${companyId}/domain-check/txt/`,
  domainCheckCname: '/user-management/domain-check/cname/',

  jobTitles: '/user-management/job-titles/',
} as const;

/** What dev actually serves today. Kept so the switch-over is mechanical. */
export const LEGACY_UM_PATHS = {
  me: '/user-management/',
  changePassword: '/user-management/password',
  changeEmail: '/user-management/email',
  myCompanies: '/user-management/companies',
  companyDetails: (companyId: number | string) => `/login/company/${companyId}`,
  subscription: (companyId: number | string) => `/user-management/company/subscription/${companyId}`,
  creditRecords: (companyId: number | string) => `/user-management/credit-records/${companyId}/`,
  enableFreeCredits: (companyId: number | string) => `/user-management/avail-free-credits/${companyId}/`,
  members: (companyId: number | string) => `/user-management/company/members/${companyId}`,
  member: (companyId: number | string, memberId: number | string) =>
    `/user-management/company/member/${companyId}/${memberId}`,
  smtpSettings: (companyId: number | string) => `/user-management/smtp-settings/${companyId}/`,
  smtpVerify: (companyId: number | string) => `/user-management/smtp-settings/${companyId}/verify/`,
  coupons: (companyId: number | string) => `/user-management/coupons/${companyId}/`,
  addresses: (companyId: number | string) => `/user-management/address/${companyId}`,
  address: (companyId: number | string, addressId: number | string) =>
    `/user-management/address/${companyId}/${addressId}`,
  trustedOrigins: () => `/user-management/update-trusted-origin/`,
  domainCheckTxt: (companyId: number | string) => `/user-management/verify-txt-record/${companyId}/`,
  domainCheckCname: '/user-management/verify-cname-record/',
  jobTitles: '/user-management/job-titles/',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types (v1 subset)
// ─────────────────────────────────────────────────────────────────────────────

// GET /user-management/me/ is byte-identical between the auth and
// user-management docs — re-exported, not redefined.
export type { CurrentUser, CompanySummary, MyCompanies } from './auth-contract';

export type UpdateProfileRequestBody = Partial<{
  first_name: string;
  last_name: string;
  timezone: string;
  language: string;
  profile_pic: string | null;
  notification_skipped: boolean;
}>;

export type ChangePasswordRequestBody = { old_password: string; new_password: string };
export type ChangePasswordResponse = { message: string };

export type ChangeEmailRequestBody = { email: string };
export type ChangeEmailResponse = { message: string };

export type CompanyDetails = {
  id: number;
  company_name: string;
  logo: string | null;
  account_type: 'CO' | 'AG';
  account_team_size: string;
  business_type: string;
  company_website: string | null;
  phone_number: string | null;
  created_at: string;
  is_active: boolean;
  domain_name: string | null;
  is_domain_verified: boolean;
};
export type UpdateCompanyDetailsRequestBody = Partial<
  Pick<CompanyDetails, 'company_name' | 'company_website'>
>;

export type SubscriptionPlanSummary = {
  id: number;
  title: string;
  price: string;
  interval: string;
  max_jobs: number | null;
  max_candidates: number;
  max_team_members: number;
};
export type Subscription = {
  id: number;
  plan: SubscriptionPlanSummary;
  total_jobs_created: string;
  total_candidate_interviewed: string;
  total_team_members: string;
  credits: string;
  sms_credits: string;
  renewal_date: string;
  subscription_date: string;
  expiration_date: string;
  status: string;
  auto_bill: boolean;
  cancel_at_period_end: boolean;
  availed_free_credits: boolean;
  ai_feature_enabled: string;
  company: number;
};

export type CreditRecord = {
  expiry_date: string;
  used_credit: number;
  max_allowed: number;
  is_active: boolean;
  is_sub_credit: boolean;
};

export type EnableFreeCreditsResponse = { message: string };

/** Wire role codes — see lib/api/settings.ts for how the client's synthetic 'Owner' role composes with these. */
export const MEMBER_ROLES = [
  { value: 'MA', label: 'Manager' },
  { value: 'EX', label: 'Executive' },
] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number]['value'];

export type TeamMemberWire = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: MemberRole;
  profile_pic: string | null;
  last_login: string;
};
export type TeamInviteeWire = {
  id: number;
  email: string;
  role: MemberRole;
  invited_at: string;
};
export type TeamRosterResponse = {
  managers: TeamMemberWire[];
  executives: TeamMemberWire[];
  invitees: TeamInviteeWire[];
};
export type InviteMemberRequestBody = { email: string; role: MemberRole };
export type InviteMemberResponse = { message: string };
export type ChangeMemberRoleRequestBody = { role: MemberRole };
export type ChangeMemberRoleResponse = TeamMemberWire;

export type SmtpSettings = {
  id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  use_ssl: boolean;
  is_verified: boolean;
};
export type SaveSmtpSettingsRequestBody = {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  use_ssl: boolean;
};
export type SmtpVerifyRequestBody = { email: string };
export type SmtpVerifyResponse = { message: string };

export type ApplyCouponRequestBody = { coupon_code: string };
export type ApplyCouponResponse = { message: string; coupon: string; plans: unknown[] };

export type BillingAddress = {
  id: number;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  country_code: string;
  zip_code: string;
};
export type SaveBillingAddressRequestBody = Omit<BillingAddress, 'id'>;
export type DeleteAddressResponse = { message: string };

export type TrustedOriginVerification = { type: 'TXT'; domain: string; value: string };
export type TrustedOrigin = {
  domain: string;
  verified: boolean;
  verification: TrustedOriginVerification[];
};
export type AddTrustedOriginResponse = { details: TrustedOrigin };
export type AddTrustedOriginRequestBody = { domain: string; company: number };

export type DomainCheckResponse = { message: string };
export type JobTitle = { title: string };

/**
 * Errors — normalized centrally in lib/api/client.ts. See its
 * normalizeErrorEnvelope() doc comment for the full list of wire shapes.
 */
export type UmErrorBody =
  | { detail: string }
  | Record<string, string[]>
  | { non_field_errors?: string[]; messages?: string }
  | { error: string };

/**
 * DEFERRED — documented in backend-docs/usermanagement-api.md but not wired to
 * any migrated function in this pass:
 *   - GET|POST|PATCH|DELETE templates/email/, templates/sms/ (email-templates.ts
 *     / sms-templates.ts keep their own local mock — their closed-union ids are
 *     structurally incompatible with the doc's numeric list; needs its own
 *     future migration)
 *   - GET|PATCH .../landing-page/
 *   - GET .../billings/, GET .../billings/{billingId}/
 *   - POST .../notifications/mark-read/
 *   - /jobs/generate/* (out of scope — belongs to lib/api/jobs.ts)
 */
