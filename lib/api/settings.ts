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

// ─── Billing ───

export type UsageMetric = {
  id: string;
  label: string;
  used: number;
  limit: number;
  /** Unit shown after the numbers, e.g. "Jobs", "Members" */
  unit: string;
  /** Sentence shown under the bar */
  note: string;
};

/** One line in the AI credits breakdown popover. */
export type CreditBreakdown = {
  id: string;
  label: string;
  used: number;
  limit: number;
};

export type CurrentPlan = {
  name: string;
  tagline: string;
  activeUntil: string;
  /** Where the AI credit allowance is spent, shown in the info popover. */
  creditBreakdown: CreditBreakdown[];
  /**
   * Id of the matching SubscriptionPlan, or null while on a trial — a trial is
   * not one of the purchasable tiers, so no plan card is marked as current.
   */
  planId: string | null;
  usage: UsageMetric[];
};

export type PlanFeature = {
  label: string;
  included: boolean;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  audience: string;
  monthlyPrice: number;
  /** Per-month price when billed annually */
  annualPrice: number;
  popular?: boolean;
  current?: boolean;
  features: PlanFeature[];
};

/**
 * Plan tiers and features mirror the public pricing page at
 * xinterview.ai/pricing.
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'launch',
    name: 'Launch',
    audience: 'For companies with less than 50 employees',
    monthlyPrice: 85,
    annualPrice: 68,
    features: [
      { label: '5 active jobs', included: true },
      { label: '200 responses', included: true },
      { label: '30 days video storage', included: true },
      { label: '3 users', included: true },
      { label: 'Generate questions using AI', included: true },
      { label: 'Custom shared links', included: false },
      { label: 'White label', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    audience: 'For companies with 50 to 250 employees',
    monthlyPrice: 234,
    annualPrice: 187,
    popular: true,
    features: [
      { label: '15 active jobs', included: true },
      { label: '1000 responses', included: true },
      { label: '60 days video storage', included: true },
      { label: '10 users', included: true },
      { label: 'Generate questions using AI', included: true },
      { label: 'Custom shared links', included: true },
      { label: 'White label', included: false },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    audience: 'For companies with 250 to 500 employees',
    monthlyPrice: 374,
    annualPrice: 299,
    features: [
      { label: 'Unlimited job postings', included: true },
      { label: '2000 responses', included: true },
      { label: '90 days video storage', included: true },
      { label: '30 users', included: true },
      { label: 'Generate questions using AI', included: true },
      { label: 'Custom shared links', included: true },
      { label: 'White label', included: true },
    ],
  },
];

export async function getCurrentPlan(): Promise<CurrentPlan> {
  await delay(500);
  return {
    name: 'Trial',
    tagline: 'A simple start for everyone',
    activeUntil: 'Aug 1, 2027',
    planId: null,
    creditBreakdown: [
      { id: 'questions', label: 'AI question generation', used: 0, limit: 400 },
      { id: 'evaluation', label: 'AI candidate evaluation', used: 0, limit: 400 },
      { id: 'descriptions', label: 'AI job descriptions', used: 0, limit: 200 },
    ],
    usage: [
      {
        id: 'jobs',
        label: 'Jobs',
        used: 2,
        limit: 20,
        unit: 'Jobs',
        note: '18 jobs remaining until your plan requires an update.',
      },
      {
        id: 'teams',
        label: 'Teams',
        used: 1,
        limit: 8,
        unit: 'Members',
        note: '7 team members remaining until your plan requires an update.',
      },
      {
        id: 'credits',
        label: 'AI credits',
        used: 0,
        limit: 1000,
        unit: 'Credits',
        note: 'Upcoming renewal date: Aug 31, 2026.',
      },
      {
        id: 'responses',
        label: 'Responses',
        used: 1,
        limit: 196,
        unit: 'Candidates',
        note: '195 responses remaining until your plan requires an update.',
      },
    ],
  };
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  await delay(500);
  return SUBSCRIPTION_PLANS.map((p) => ({ ...p }));
}

// ─── Question templates (Settings → Question library) ───

export type LibraryQuestion = {
  id: string;
  type: 'video' | 'audio' | 'text' | 'single_choice';
  title: string;
  description: string;
  retakesAllowed?: number;
  thinkingTime?: string;
  answerTime?: string;
  charLimit?: number;
  options?: { id: string; text: string; isCorrect: boolean }[];
};

export type QuestionTemplateRecord = {
  id: string;
  name: string;
  description: string;
  questions: LibraryQuestion[];
  updatedAt: string;
};

function q(
  id: string,
  type: LibraryQuestion['type'],
  title: string,
  description = ''
): LibraryQuestion {
  return {
    id,
    type,
    title,
    description,
    retakesAllowed: 1,
    thinkingTime: '30s',
    answerTime: '2m',
    charLimit: type === 'text' ? 500 : undefined,
    options:
      type === 'single_choice'
        ? [
            { id: `${id}_o1`, text: 'Option A', isCorrect: true },
            { id: `${id}_o2`, text: 'Option B', isCorrect: false },
          ]
        : undefined,
  };
}

const BASE_TEMPLATES: QuestionTemplateRecord[] = [
  {
    id: 'tpl_eng',
    name: 'Engineering screen',
    description: 'General technical screen for software engineering roles.',
    updatedAt: 'Jul 28, 2026',
    questions: [
      q('tq_e1', 'video', 'Tell us about a system you designed end to end.', 'Look for trade-offs and reasoning.'),
      q('tq_e2', 'video', 'Describe a production bug you found and fixed.'),
      q('tq_e3', 'text', 'How would you improve the performance of a slow API endpoint?'),
      q('tq_e4', 'single_choice', 'Which best describes your experience with TypeScript?'),
    ],
  },
  {
    id: 'tpl_pd',
    name: 'Product & design',
    description: 'For product managers, designers and researchers.',
    updatedAt: 'Jul 24, 2026',
    questions: [
      q('tq_p1', 'video', 'Walk us through a product you shipped from idea to launch.'),
      q('tq_p2', 'video', 'How do you decide what not to build?'),
      q('tq_p3', 'text', 'Describe how you would validate a new feature idea.'),
    ],
  },
  {
    id: 'tpl_sales',
    name: 'Sales & GTM',
    description: 'Screening questions for revenue-facing roles.',
    updatedAt: 'Jul 19, 2026',
    questions: [
      q('tq_s1', 'video', 'Tell us about your most challenging deal.'),
      q('tq_s2', 'audio', 'Give a 60-second pitch for a product you love.'),
      q('tq_s3', 'text', 'How do you qualify a new lead?'),
    ],
  },
  {
    id: 'tpl_exec',
    name: 'Executive screening',
    description: 'Leadership and strategy questions for senior hires.',
    updatedAt: 'Jul 11, 2026',
    questions: [
      q('tq_x1', 'video', 'How do you set direction for a team of 50+?'),
      q('tq_x2', 'video', 'Describe a time you changed a strategy mid-flight.'),
    ],
  },
];

let templateStore: QuestionTemplateRecord[] = BASE_TEMPLATES.map((t) => ({
  ...t,
  questions: t.questions.map((x) => ({ ...x })),
}));

export async function getQuestionTemplates(): Promise<QuestionTemplateRecord[]> {
  await delay(500);
  return templateStore.map((t) => ({ ...t, questions: t.questions.map((x) => ({ ...x })) }));
}

export async function createQuestionTemplate(
  name: string,
  description = ''
): Promise<QuestionTemplateRecord> {
  await delay();
  const trimmed = name.trim();
  if (!trimmed) throw err('template_name_required', 'template_name_required');
  if (templateStore.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
    throw err('template_duplicate', 'template_duplicate');
  }
  const record: QuestionTemplateRecord = {
    id: `tpl_${Math.random().toString(36).slice(2, 10)}`,
    name: trimmed,
    description: description.trim(),
    questions: [],
    updatedAt: 'Just now',
  };
  templateStore = [record, ...templateStore];
  return { ...record };
}

export async function renameQuestionTemplate(
  id: string,
  name: string,
  description = ''
): Promise<QuestionTemplateRecord> {
  await delay();
  const trimmed = name.trim();
  if (!trimmed) throw err('template_name_required', 'template_name_required');
  if (
    templateStore.some(
      (t) => t.id !== id && t.name.toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    throw err('template_duplicate', 'template_duplicate');
  }
  const t = templateStore.find((x) => x.id === id);
  if (!t) throw err('template_not_found', 'template_not_found');
  t.name = trimmed;
  t.description = description.trim();
  t.updatedAt = 'Just now';
  return { ...t };
}

export async function deleteQuestionTemplate(id: string): Promise<{ success: boolean }> {
  await delay();
  templateStore = templateStore.filter((t) => t.id !== id);
  return { success: true };
}

export async function saveTemplateQuestions(
  id: string,
  questions: LibraryQuestion[]
): Promise<QuestionTemplateRecord> {
  await delay(600);
  const t = templateStore.find((x) => x.id === id);
  if (!t) throw err('template_not_found', 'template_not_found');
  t.questions = questions.map((x) => ({ ...x }));
  t.updatedAt = 'Just now';
  return { ...t, questions: t.questions.map((x) => ({ ...x })) };
}

// ─── Careers page ───

export type CareerJobListing = {
  id: string;
  title: string;
  /** Expired jobs can't be shown, mirroring the live product */
  expired: boolean;
  visible: boolean;
};

export type CareerPageConfig = {
  showLogo: boolean;
  buttonColor: string;
  secondaryColor: string;
  welcomeMessage: string;
  thankYouNote: string;
  faviconUrl: string | null;
  previewImageUrl: string | null;
  metaTitle: string;
  metaDescription: string;
  listings: CareerJobListing[];
};

export const CAREER_META_TITLE_MAX = 60;
export const CAREER_META_DESCRIPTION_MAX = 160;

const CAREER_PAGE_ID = '89edb3fc-4729-4d38-a8de-1396c9570a6a';

let careerStore: CareerPageConfig = {
  showLogo: true,
  buttonColor: '#5B4FE9',
  secondaryColor: '#1F242E',
  welcomeMessage: '<h1>Careers</h1>',
  thankYouNote:
    '<p>Our hiring process is built on trust, transparency, and equal opportunity. Let&rsquo;s succeed together.</p>',
  faviconUrl: null,
  previewImageUrl: null,
  metaTitle: 'Your Career Starts Here | Build a Better Future',
  metaDescription:
    'Discover exciting career opportunities with us. Join a supportive, growth-driven team and build a brighter future.',
  listings: [
    { id: 'job_a', title: 'Senior Frontend Engineer', expired: false, visible: true },
    { id: 'job_b', title: 'Product Manager', expired: false, visible: true },
    { id: 'job_c', title: 'Data Scientist', expired: false, visible: false },
    { id: 'job_d', title: 'UX Designer', expired: true, visible: false },
  ],
};

export function getCareerPageUrl(): string {
  return `https://xinterview.ai/careers/${CAREER_PAGE_ID}`;
}

export function getCareerEmbedCode(): string {
  return `<iframe src="${getCareerPageUrl()}" width="100%" height="600" frameborder="0"></iframe>`;
}

export async function getCareerPage(): Promise<CareerPageConfig> {
  await delay(500);
  return { ...careerStore, listings: careerStore.listings.map((l) => ({ ...l })) };
}

export async function saveCareerPage(
  config: CareerPageConfig
): Promise<CareerPageConfig> {
  await delay();
  if (config.metaTitle.length > CAREER_META_TITLE_MAX) {
    throw err('career_meta_title_long', 'career_meta_title_long');
  }
  if (config.metaDescription.length > CAREER_META_DESCRIPTION_MAX) {
    throw err('career_meta_description_long', 'career_meta_description_long');
  }
  careerStore = { ...config, listings: config.listings.map((l) => ({ ...l })) };
  return { ...careerStore, listings: careerStore.listings.map((l) => ({ ...l })) };
}

export function _resetCareerStore() {
  careerStore = { ...careerStore };
}

// ─── Integrations ───

export type ApiKey = {
  id: string;
  name: string;
  /** Masked for display; the full value is only returned once at creation. */
  maskedKey: string;
  expiresAt: string | null;
  createdAt: string;
};

export type SmtpConfig = {
  provider: 'mailersend' | 'smtp';
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  useTls: boolean;
};

export type IntegrationState = {
  smtpConnected: boolean;
  smtp: SmtpConfig | null;
  customDomain: { subdomain: string; domain: string } | null;
  brandingRemoved: boolean;
  zapierActive: boolean;
};

let apiKeyStore: ApiKey[] = [];
let integrationStore: IntegrationState = {
  smtpConnected: false,
  smtp: null,
  customDomain: null,
  brandingRemoved: false,
  zapierActive: false,
};

export async function getApiKeys(): Promise<ApiKey[]> {
  await delay(400);
  return apiKeyStore.map((k) => ({ ...k }));
}

export async function createApiKey(
  name: string,
  expiresAt: string | null
): Promise<{ key: ApiKey; secret: string }> {
  await delay();
  const trimmed = name.trim();
  if (!trimmed) throw err('api_key_name_required', 'api_key_name_required');
  if (apiKeyStore.some((k) => k.name.toLowerCase() === trimmed.toLowerCase())) {
    throw err('api_key_duplicate', 'api_key_duplicate');
  }
  const secret = `xi_live_${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
  const key: ApiKey = {
    id: `key_${Math.random().toString(36).slice(2, 10)}`,
    name: trimmed,
    maskedKey: `${secret.slice(0, 11)}••••••••${secret.slice(-4)}`,
    expiresAt: expiresAt || null,
    createdAt: 'Just now',
  };
  apiKeyStore = [key, ...apiKeyStore];
  return { key, secret };
}

export async function deleteApiKey(id: string): Promise<{ success: boolean }> {
  await delay();
  apiKeyStore = apiKeyStore.filter((k) => k.id !== id);
  return { success: true };
}

export async function getIntegrations(): Promise<IntegrationState> {
  await delay(400);
  return { ...integrationStore };
}

export async function saveSmtpConfig(config: SmtpConfig): Promise<IntegrationState> {
  await delay();
  if (config.provider === 'smtp') {
    if (!config.host.trim()) throw err('smtp_host_required', 'smtp_host_required');
    if (!config.port.trim()) throw err('smtp_port_required', 'smtp_port_required');
    if (!config.username.trim()) throw err('smtp_username_required', 'smtp_username_required');
    if (!config.password.trim()) throw err('smtp_password_required', 'smtp_password_required');
  }
  if (!config.fromEmail.trim()) throw err('smtp_from_required', 'smtp_from_required');
  integrationStore = { ...integrationStore, smtp: config, smtpConnected: true };
  return { ...integrationStore };
}

export async function sendSmtpTestEmail(to: string): Promise<{ sent: boolean }> {
  await delay(1000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    throw err('smtp_test_failed', 'smtp_test_failed');
  }
  return { sent: true };
}

export async function disconnectSmtp(): Promise<IntegrationState> {
  await delay();
  integrationStore = { ...integrationStore, smtp: null, smtpConnected: false };
  return { ...integrationStore };
}

export async function saveCustomDomain(
  subdomain: string,
  domain: string
): Promise<IntegrationState> {
  await delay();
  if (!subdomain.trim()) throw err('domain_subdomain_required', 'domain_subdomain_required');
  if (!/^[a-z0-9-]+$/i.test(subdomain.trim())) {
    throw err('domain_subdomain_invalid', 'domain_subdomain_invalid');
  }
  if (!/^[a-z0-9-]+\.[a-z]{2,}$/i.test(domain.trim())) {
    throw err('domain_apex_invalid', 'domain_apex_invalid');
  }
  integrationStore = {
    ...integrationStore,
    customDomain: { subdomain: subdomain.trim(), domain: domain.trim() },
  };
  return { ...integrationStore };
}

export async function removeCustomDomain(): Promise<IntegrationState> {
  await delay();
  integrationStore = { ...integrationStore, customDomain: null };
  return { ...integrationStore };
}

export async function setBrandingRemoved(removed: boolean): Promise<IntegrationState> {
  await delay(500);
  integrationStore = { ...integrationStore, brandingRemoved: removed };
  return { ...integrationStore };
}

export async function setZapierActive(active: boolean): Promise<IntegrationState> {
  await delay(500);
  integrationStore = { ...integrationStore, zapierActive: active };
  return { ...integrationStore };
}

export function _resetIntegrationsStore() {
  apiKeyStore = [];
  integrationStore = {
    smtpConnected: false,
    smtp: null,
    customDomain: null,
    brandingRemoved: false,
    zapierActive: false,
  };
}

export async function applyCoupon(code: string): Promise<{ discountPct: number }> {
  await delay();
  const normalised = code.trim().toUpperCase();
  if (!normalised) throw err('coupon_invalid', 'coupon_invalid');
  if (normalised !== 'LAUNCH20') throw err('coupon_invalid', 'coupon_invalid');
  return { discountPct: 20 };
}

export function _resetSettingsStore() {
  orgStore = { ...ORG };
  memberStore = [...BASE_MEMBERS];
  simulateSeatLimit = false;
}
