/**
 * User-management wire contract — XInterview backend.
 *
 * Built from three sources, in order of authority:
 *
 *  1. `backend-schema/xinterview-schema.yaml` — the published OpenAPI spec, for
 *     field names and types.
 *  2. `legacy-api-docs/api-documentation/*.md` — for the agreed path renames and
 *     the record of which response fields the frontend never reads.
 *  3. The live dev API, for the profile shape (captured 2026-08-13).
 *
 * As with auth, two deliberate deviations from what dev serves today:
 *
 *  1. PATHS use the legacy docs' suggested names (see UM_PATHS).
 *     `LEGACY_UM_PATHS` records today's names so the switch is one line each.
 *  2. FIELDS the docs list as unused are omitted, so no component can start
 *     depending on one before the backend removes it.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Target paths — what the client calls.
 *
 * The consistent shape the legacy docs argue for is
 * `/user-management/company/{companyId}/<sub-resource>/`: the ID precedes its
 * sub-resource, no URL ends in a bare numeric ID, and no verb appears in a path.
 */
export const UM_PATHS = {
  // Current user
  me: '/user-management/me/',
  myCompanies: '/user-management/my-companies/',
  updateProfile: '/user-management/me/',
  changePassword: '/user-management/me/password/',
  markNotificationsRead: '/user-management/notifications/mark-read/',

  // Company
  company: (companyId: number | string) =>
    `/user-management/company/${companyId}/details/`,
  subscription: (companyId: number | string) =>
    `/user-management/company/${companyId}/subscription/`,
  creditRecords: (companyId: number | string) =>
    `/user-management/company/${companyId}/credit-records/`,
  enableFreeCredits: (companyId: number | string) =>
    `/user-management/company/${companyId}/enable-free-credits/`,

  // Team
  members: (companyId: number | string) =>
    `/user-management/company/${companyId}/members/`,
  member: (companyId: number | string, memberId: number | string) =>
    `/user-management/company/${companyId}/members/${memberId}/`,

  // SMTP
  smtp: (companyId: number | string) =>
    `/user-management/company/${companyId}/smtp-settings/`,
  smtpVerify: (companyId: number | string) =>
    `/user-management/company/${companyId}/smtp-settings/verify/`,

  // Templates
  emailTemplates: (companyId: number | string) =>
    `/user-management/company/${companyId}/templates/email/`,
  emailTemplate: (templateId: number | string) =>
    `/user-management/templates/email/${templateId}/`,
  smsTemplates: (companyId: number | string) =>
    `/user-management/company/${companyId}/templates/sms/`,
  smsTemplate: (templateId: number | string) =>
    `/user-management/templates/sms/${templateId}/`,

  // Career / landing page
  landingPage: (companyId: number | string) =>
    `/user-management/company/${companyId}/landing-page/`,

  // Domain verification
  domainCheckCname: '/user-management/domain-check/cname/',
  domainCheckTxt: (companyId: number | string) =>
    `/user-management/company/${companyId}/domain-check/txt/`,
  trustedOrigins: (companyId: number | string) =>
    `/user-management/company/${companyId}/trusted-origins/`,

  // Billing address
  addresses: (companyId: number | string) =>
    `/user-management/company/${companyId}/addresses/`,
  address: (companyId: number | string, addressId: number | string) =>
    `/user-management/company/${companyId}/addresses/${addressId}/`,

  // Invoices
  billings: (companyId: number | string) =>
    `/user-management/company/${companyId}/billings/`,
  billing: (companyId: number | string, billingId: number | string) =>
    `/user-management/company/${companyId}/billings/${billingId}/`,

  // Coupons
  coupons: (companyId: number | string) =>
    `/user-management/company/${companyId}/coupons/`,

  // Change email — a profile action, so it sits beside me/password/
  changeEmail: '/user-management/me/email/',

  // AI generation. These produce JOB content, so they move out of
  // /user-management/ entirely — see the doc's backend issues.
  generateJobDescription: '/jobs/generate/description/',
  generateJobQuestions: '/jobs/generate/questions/',
  generateEvaluationFactors: '/jobs/generate/evaluation-factors/',

  // Misc
  jobTitles: '/user-management/job-titles/',
} as const;

/** What dev actually serves today. */
export const LEGACY_UM_PATHS = {
  me: '/user-management/',
  myCompanies: '/user-management/companies',
  updateProfile: '/user-management/',
  changePassword: '/user-management/password',
  markNotificationsRead: '/user-management/read-global-notification/',
  company: (id: number | string) => `/user-management/company/${id}`,
  subscription: (id: number | string) =>
    `/user-management/company/subscription/${id}`,
  creditRecords: (id: number | string) => `/user-management/credit-records/${id}/`,
  enableFreeCredits: (id: number | string) =>
    `/user-management/avail-free-credits/${id}/`,
  members: (id: number | string) => `/user-management/company/members/${id}`,
  // sic — singular `/member/` on delete, plural `/members/` on list
  member: (companyId: number | string, memberId: number | string) =>
    `/user-management/company/member/${companyId}/${memberId}`,
  smtp: (id: number | string) => `/user-management/smtp-settings/${id}/`,
  smtpCreate: (id: number | string) =>
    `/user-management/smtp-settings/create/${id}/`,
  smtpVerify: (id: number | string) =>
    `/user-management/smtp-settings/${id}/verify/`,
  emailTemplates: (id: number | string) =>
    `/user-management/templates/email/${id}`,
  emailTemplate: (id: number | string) => `/user-management/template/email/${id}`,
  smsTemplates: (id: number | string) => `/user-management/templates/sms/${id}`,
  smsTemplate: (id: number | string) => `/user-management/template/sms/${id}`,
  landingPage: (id: number | string) => `/user-management/landing-page/${id}/`,
  domainCheckCname: '/user-management/verify-cname-record/',
  domainCheckTxt: (id: number | string) =>
    `/user-management/verify-txt-record/${id}/`,
  trustedOrigins: '/user-management/update-trusted-origin/',
  jobTitles: '/user-management/job-titles/',
  addresses: (id: number | string) => `/user-management/address/${id}`,
  address: (companyId: number | string, addressId: number | string) =>
    `/user-management/address/${companyId}/${addressId}`,
  billings: (id: number | string) => `/user-management/company/billings/${id}`,
  billing: (companyId: number | string, billingId: number | string) =>
    `/user-management/company/billings/${companyId}/${billingId}`,
  coupons: (id: number | string) => `/user-management/coupons/${id}/`,
  changeEmail: '/user-management/email',
  generateJobDescription: '/user-management/generate-description/',
  generateJobQuestions: '/user-management/generate-questions/',
  generateEvaluationFactors: '/user-management/generate-factor-evaluation/',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `PATCH /user-management/me/` request.
 *
 * `location` and `custom_data` are accepted by the API but omitted here — the
 * docs record them as always `"Unknown"` / `null`, so nothing writes them.
 */
export type UpdateProfileRequest = {
  first_name?: string;
  last_name?: string;
  timezone?: string;
  language?: string;
  profile_pic?: string;
  notification_skipped?: boolean;
};

export type ChangePasswordRequest = {
  old_password: string;
  new_password: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Company
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full company record.
 *
 * Omitted as unused, per COMPANY_ACCOUNT_CAREER_APIS.md: `ai_feature_enabled`
 * (read from the subscription instead), `video_storage_provider`,
 * `partnero_partner` (read from a cookie), `partnero_commission_eligible`,
 * plus `stripe_id`, `category` and `subcategory`, which no screen reads.
 */
export type CompanyDetails = {
  id: number;
  company_name: string;
  logo: string | null;
  account_type: string;
  account_team_size: string;
  business_type: string;
  company_website: string | null;
  phone_number: string | null;
  created_at: string;
  is_active: boolean;
  domain_name: string | null;
  is_domain_verified: boolean;
};

export type UpdateCompanyRequest = Partial<
  Pick<
    CompanyDetails,
    | 'company_name'
    | 'logo'
    | 'account_type'
    | 'account_team_size'
    | 'business_type'
    | 'company_website'
    | 'phone_number'
    | 'domain_name'
  >
>;

/**
 * Subscription plan.
 *
 * `plan.currency` is omitted — the docs record it as never referenced.
 */
export type SubscriptionPlan = {
  id: number;
  title: string;
  price: string;
  interval: string;
  max_jobs: number | null;
  max_candidates: number | null;
  max_team_members: number | null;
};

/**
 * Company subscription.
 *
 * Omitted as unused: `stripe_transaction_id`, `stripe_id`,
 * `stripe_customer_id`, `order_id`, `ai_agent_config`, `beta_user`,
 * `grace_until`, `notification`, `domain_name` (duplicated on the company).
 */
export type Subscription = {
  id: number;
  plan: SubscriptionPlan;
  total_jobs_created: string;
  total_candidate_interviewed: string;
  total_team_members: string;
  credits: string;
  sms_credits: string;
  renewal_date: string | null;
  subscription_date: string | null;
  expiration_date: string | null;
  status: string;
  auto_bill: boolean;
  cancel_at_period_end: boolean;
  availed_free_credits: boolean;
  ai_feature_enabled: string;
  company: number;
};

/**
 * Credit record.
 *
 * `id` and `company` are omitted — the docs record `id` as not displayed in the
 * billing popover, and `company` is already known from the request URL.
 */
export type CreditRecord = {
  expiry_date: string;
  used_credit: number;
  max_allowed: number;
  is_active: boolean;
  is_sub_credit: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────────────────────────────────────

export type CompanyMemberRole = 'MA' | 'EX';

/** Wire values are two-letter codes; the labels are display-only. */
export const MEMBER_ROLES = [
  { value: 'MA', label: 'Manager' },
  { value: 'EX', label: 'Executive' },
] as const;

export type CompanyMember = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: CompanyMemberRole;
  profile_pic: string | null;
  last_login: string | null;
};

export type CompanyInvitee = {
  id: number;
  email: string;
  role: CompanyMemberRole;
  invited_at: string;
};

/**
 * The API groups the roster by role rather than returning a flat list with a
 * `role` field. Preserved as-is: the team screen renders the groups separately.
 */
export type MembersResponse = {
  managers: CompanyMember[];
  executives: CompanyMember[];
  invitees: CompanyInvitee[];
};

export type InviteMemberRequest = {
  email: string;
  role: CompanyMemberRole;
};

export type ChangeMemberRoleRequest = {
  role: CompanyMemberRole;
};

// ─────────────────────────────────────────────────────────────────────────────
// SMTP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SMTP settings.
 *
 * `company` is omitted — always known from the request URL. `smtp_password` is
 * write-only and never returned, which is correct.
 */
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

export type SmtpSettingsRequest = {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  use_ssl: boolean;
};

export type SmtpVerifyRequest = {
  email: string;
};

/** Only `message` is read; the docs record `status` as unused. */
export type SmtpVerifyResponse = {
  message: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

/** `company` is omitted — known from the request URL. */
export type EmailTemplate = {
  id: number;
  title: string;
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
};

export type EmailTemplateRequest = {
  title?: string;
  subject: string;
  body: string;
  is_active: boolean;
};

export type SmsTemplate = {
  id: number;
  title: string;
  body: string;
  is_active: boolean;
};

export type SmsTemplateRequest = {
  title?: string;
  body: string;
  is_active: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Landing / career page
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Career landing page configuration.
 *
 * The live endpoint returns 43 fields. Only what the career, branding, welcome
 * and thank-you screens actually read is kept; `requirements.custom_field_state`
 * is dropped per the docs (no UI control reads or writes it).
 */
export type LandingPage = {
  id: number;
  title: string;
  sub_title: string;
  colour: string;
  secondary_colour: string;
  logo: string | null;
  favicon: string | null;
  require_logo: boolean;
  intro_note: string;
  outro_note: string;
  starting_instructions: string;
  ending_instructions: string;
  require_starting_instructions: boolean;
  require_intro_video: boolean;
  intro_video: string | null;
  redirect_url: string | null;
  blur_effect: boolean;
  switch_tab: boolean;
  full_screen: boolean;
  copy_paste: boolean;
  email_candidate: boolean;
  sms_candidate: boolean;
  remind_candidate: number;
  reject_candidate: boolean;
  company_privacy_policy_display: boolean;
  company_privacy_policy: string | null;
  company_terms_and_conditions_display: boolean;
  company_terms_and_conditions: string | null;
};

export type UpdateLandingPageRequest = Partial<Omit<LandingPage, 'id'>>;

// ─────────────────────────────────────────────────────────────────────────────
// Domain verification
// ─────────────────────────────────────────────────────────────────────────────

export type TrustedOriginRequest = {
  domain: string;
  company: number;
};

/**
 * Trusted-origin response.
 *
 * The docs confirm both `details.verified` and
 * `details.verification[0].value` are read, so the nesting is preserved.
 */
export type TrustedOriginResponse = {
  details: {
    verified: boolean;
    verification: { type: string; domain: string; value: string }[];
  };
};

export type DomainCheckResponse = {
  message: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────────────────────────────────────

/** Only `title` is read; any other field on the row is ignored. */
export type JobTitle = {
  title: string;
};


// ─────────────────────────────────────────────────────────────────────────────
// Billing address
// ─────────────────────────────────────────────────────────────────────────────

/** Captured live: the API returns exactly these 8 fields. */
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

export type BillingAddressRequest = Omit<BillingAddress, 'id'>;

// ─────────────────────────────────────────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Plan summary on an invoice.
 *
 * The live API nests a **35-field** plan object here — every entitlement flag
 * the account has. An invoice list only ever shows which plan was billed, so
 * everything except identity is dropped.
 */
export type InvoicePlan = {
  id: number;
  title: string;
};

/**
 * Invoice.
 *
 * The live API returns 25 fields; 11 are dropped as unused — see the doc.
 * `hosted_invoice_url` and `invoice_pdf_url` are kept because the billing table
 * links to them, even though both are empty strings on the dev data.
 */
export type Invoice = {
  id: number;
  plan: InvoicePlan;
  invoice_number: string;
  amount: string;
  currency: string;
  payment_status: string;
  payment_method: string;
  payment_date: string | null;
  date: string;
  billing_type: string;
  quantity: number;
  hosted_invoice_url: string;
  invoice_pdf_url: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Coupons
// ─────────────────────────────────────────────────────────────────────────────

export type ApplyCouponRequest = {
  coupon_code: string;
};

/**
 * Coupon redemption.
 *
 * `path` is dropped from both the success and error shapes — it is `null` in
 * every observed response and reads like a server-side debugging artefact.
 */
export type ApplyCouponResponse = {
  message: string;
  coupon: string;
  plans: unknown[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Change email
// ─────────────────────────────────────────────────────────────────────────────

export type ChangeEmailRequest = {
  email: string;
};

/**
 * The live API returns `{ details }` here — the same plural typo as the auth
 * verification endpoint. Normalised to `message`, as everywhere else.
 */
export type ChangeEmailResponse = {
  message: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// AI generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * These three produce **job** content, so the target paths move them under
 * `/jobs/generate/*`. Request and response shapes below were captured live —
 * the OpenAPI spec is **wrong** for all three (it documents `title` where the
 * API wants `job_title`, and a full Job object where the API returns generated
 * text). See the doc's backend issues.
 */

export type GenerateJobDescriptionRequest = {
  job_title: string;
};

/** Live response: a summary plus two bullet lists — not a Job object. */
export type GenerateJobDescriptionResponse = {
  summary: string;
  responsibilities: string[];
  requirements: string[];
};

export type GenerateJobQuestionsRequest = {
  job_title: string;
  /** Spec calls this `questions`; the API rejects that and wants `total`. */
  total: number;
};

export type GeneratedQuestion = {
  /** Observed: `"text"` and `"single correct"`. */
  question_type: string;
  title: string;
  options: string[] | null;
};

export type GenerateJobQuestionsResponse = {
  title: string;
  questions: GeneratedQuestion[];
};

/**
 * Evaluation factors.
 *
 * The live API requires a `job_id` for an existing job, so this shape comes
 * from the spec plus the jobs contract rather than a live capture.
 */
export type GenerateEvaluationFactorsRequest = {
  job_id: number | string;
};

export type GeneratedFactor = {
  name: string;
  description: string;
  weight: number;
};

export type GenerateEvaluationFactorsResponse = {
  factors: GeneratedFactor[];
};

/** Stable error codes the user-management UI branches on. */
export const UM_ERROR_CODE = {
  VALIDATION_FAILED: 'validation_failed',
  NOT_FOUND: 'not_found',
  FORBIDDEN: 'forbidden',
  MEMBER_ALREADY_INVITED: 'member_already_invited',
  LAST_ADMIN: 'last_admin',
  SMTP_VERIFY_FAILED: 'smtp_verify_failed',
  COUPON_NOT_FOUND: 'coupon_not_found',
  EMAIL_TAKEN: 'email_taken',
  GENERATION_FAILED: 'generation_failed',
  DOMAIN_NOT_VERIFIED: 'domain_not_verified',
  UNAUTHENTICATED: 'unauthenticated',
  NETWORK_ERROR: 'network_error',
  UNKNOWN: 'unknown',
} as const;

export type UmErrorCode = (typeof UM_ERROR_CODE)[keyof typeof UM_ERROR_CODE];
