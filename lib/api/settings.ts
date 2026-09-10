import type { ApiError } from './auth';
import { getMe } from './auth';
import { apiFetch } from './client';
import {
  UM_PATHS,
  type MemberRole,
  type TeamRosterResponse,
  type TeamMemberWire,
  type CreditRecord,
  type Subscription,
  type BillingAddress,
  type TrustedOrigin,
} from './user-management-contract';

const COMPANY_ID = 64;

/**
 * 'Owner' is a client-only synthetic role — the API has no such role, only
 * the wire codes 'MA'/'EX'. Whoever's email matches the signed-in user's
 * admin_companies (company creator) is labeled 'Owner' here.
 */
export type Role = 'Owner' | MemberRole;
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

function initialsOf(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

async function mapRosterToMembers(roster: TeamRosterResponse): Promise<TeamMember[]> {
  const me = await getMe();
  const ownerEmail = me.admin_companies ? me.email : null;

  const fromWire = (m: TeamMemberWire, status: MemberStatus): TeamMember => ({
    id: String(m.id),
    name: `${m.first_name} ${m.last_name}`.trim(),
    email: m.email,
    role: m.email === ownerEmail ? 'Owner' : m.role,
    status,
    joinedAt: m.last_login,
    invitedAt: null,
    initials: initialsOf(m.first_name, m.last_name),
  });

  return [
    ...roster.managers.map((m) => fromWire(m, 'active')),
    ...roster.executives.map((m) => fromWire(m, 'active')),
    ...roster.invitees.map((i) => ({
      id: String(i.id),
      name: i.email,
      email: i.email,
      role: i.role,
      status: 'pending' as const,
      joinedAt: null,
      invitedAt: i.invited_at,
      initials: i.email.slice(0, 2).toUpperCase(),
    })),
  ];
}

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

/**
 * Reads the file to a data URL so the preview can actually display it. The real
 * endpoint will return a hosted URL; callers only need something assignable to
 * an <img src>.
 */
export async function uploadLogo(file: File): Promise<{ logoUrl: string }> {
  const logoUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('logo_read_failed'));
    reader.readAsDataURL(file);
  });
  await delay(700);
  return { logoUrl };
}

/**
 * Answers "is the signed-in person the workspace owner", for role-gating the
 * team/general settings UI. Derives isOwner/role from the real session
 * (getMe()) rather than a hardcoded constant — kept as its own type/function
 * rather than merged with auth-contract's CurrentUser or profile.ts's
 * UserProfile: three shapes for three call sites is the accepted final state.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const me = await getMe();
  const isOwner = me.admin_companies !== null;
  return {
    id: String(me.id),
    name: `${me.first_name} ${me.last_name}`.trim(),
    email: me.email,
    role: isOwner ? 'Owner' : 'MA',
    isOwner,
  };
}

export async function getTeamRoster(): Promise<{ members: TeamMember[]; seatLimit: number }> {
  const roster = await apiFetch<TeamRosterResponse>(UM_PATHS.members(COMPANY_ID));
  const members = await mapRosterToMembers(roster);
  return { members, seatLimit: orgStore.seatLimit };
}

/** Invites a member. The API returns only {message}; re-fetch the roster to see the new invitee. */
export async function inviteMember(email: string, role: MemberRole): Promise<{ sent: boolean }> {
  await apiFetch<{ message: string }>(UM_PATHS.members(COMPANY_ID), {
    method: 'POST',
    body: { email, role },
  });
  return { sent: true };
}

/** No resend endpoint in either doc — kept fully local, always fails. */
export async function resendInvite(_inviteId: string): Promise<{ sent: boolean }> {
  await delay();
  throw err('resend_failed', 'resend_failed');
}

/** DELETE .../members/{id}/ also removes a pending invitee when the id belongs to one. */
export async function cancelInvite(inviteId: string): Promise<{ success: boolean }> {
  await apiFetch(UM_PATHS.member(COMPANY_ID, inviteId), { method: 'DELETE' });
  return { success: true };
}

export async function changeMemberRole(
  memberId: string,
  role: MemberRole
): Promise<{ success: boolean }> {
  await apiFetch(UM_PATHS.member(COMPANY_ID, memberId), { method: 'PUT', body: { role } });
  return { success: true };
}

export async function removeMember(memberId: string): Promise<{ success: boolean }> {
  const roster = await apiFetch<TeamRosterResponse>(UM_PATHS.members(COMPANY_ID));
  const members = await mapRosterToMembers(roster);
  const member = members.find((m) => m.id === memberId);
  // 'Owner' is a client-only synthetic role the server doesn't know about —
  // this guard must stay client-side, it cannot move server-side.
  if (member?.role === 'Owner') {
    throw err('removal_failed', 'removal_failed');
  }
  await apiFetch(UM_PATHS.member(COMPANY_ID, memberId), { method: 'DELETE' });
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
  /** ISO date behind `activeUntil`, so the UI can derive a countdown. */
  activeUntilIso: string;
  /** True while on a free trial rather than a paid tier. */
  isTrial: boolean;
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

/** Raw credit-record list — GET .../credit-records/. Used internally by getCurrentPlan(). */
export async function getCreditRecords(): Promise<CreditRecord[]> {
  return apiFetch<CreditRecord[]>(UM_PATHS.creditRecords(COMPANY_ID));
}

/** Wired, not yet surfaced in the UI. */
export async function enableFreeCredits(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(UM_PATHS.enableFreeCredits(COMPANY_ID), { method: 'POST' });
}

export async function getCurrentPlan(): Promise<CurrentPlan> {
  const [subscription, credits] = await Promise.all([
    apiFetch<Subscription>(UM_PATHS.subscription(COMPANY_ID)),
    getCreditRecords(),
  ]);

  return {
    name: subscription.plan.title,
    tagline: 'A simple start for everyone',
    activeUntil: new Date(subscription.expiration_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    activeUntilIso: subscription.expiration_date,
    isTrial: subscription.status === 'trial',
    planId: subscription.status === 'trial' ? null : String(subscription.plan.id),
    creditBreakdown: credits.map((c, i) => ({
      id: `credit_${i}`,
      label: c.is_sub_credit ? 'Subscription credits' : 'Bonus credits',
      used: c.used_credit,
      limit: c.max_allowed,
    })),
    // No doc equivalent for this per-resource usage rollup — stays local/fabricated.
    usage: [
      {
        id: 'jobs',
        label: 'Jobs',
        used: Number(subscription.total_jobs_created),
        limit: subscription.plan.max_jobs ?? 999,
        unit: 'Jobs',
        note: `Upcoming renewal date: ${new Date(subscription.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
      },
      {
        id: 'teams',
        label: 'Teams',
        used: Number(subscription.total_team_members),
        limit: subscription.plan.max_team_members,
        unit: 'Members',
        note: `${Math.max(subscription.plan.max_team_members - Number(subscription.total_team_members), 0)} team members remaining until your plan requires an update.`,
      },
      {
        id: 'credits',
        label: 'AI credits',
        used: credits.reduce((sum, c) => sum + c.used_credit, 0),
        limit: credits.reduce((sum, c) => sum + c.max_allowed, 0),
        unit: 'Credits',
        note: `Upcoming renewal date: ${new Date(subscription.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
      },
      {
        id: 'responses',
        label: 'Responses',
        used: Number(subscription.total_candidate_interviewed),
        limit: subscription.plan.max_candidates,
        unit: 'Candidates',
        note: `${Math.max(subscription.plan.max_candidates - Number(subscription.total_candidate_interviewed), 0)} responses remaining until your plan requires an update.`,
      },
    ],
  };
}

/** No "browse available plans" endpoint in either doc — kept fully local. */
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
  department?: string;
  location?: string;
  mode?: 'Remote' | 'Hybrid' | 'On-site';
  type?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
};

export type CareerPageConfig = {
  showLogo: boolean;
  buttonColor: string;
  secondaryColor: string;
  backgroundColor: string;
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
  backgroundColor: '#FFFFFF',
  welcomeMessage: '<h1>Careers</h1>',
  thankYouNote:
    '<p>Our hiring process is built on trust, transparency, and equal opportunity. Let&rsquo;s succeed together.</p>',
  faviconUrl: null,
  previewImageUrl: null,
  metaTitle: 'Your Career Starts Here | Build a Better Future',
  metaDescription:
    'Discover exciting career opportunities with us. Join a supportive, growth-driven team and build a brighter future.',
  listings: [
    { id: 'job_a', title: 'Senior Frontend Engineer', expired: false, visible: true, department: 'Engineering', location: 'London, United Kingdom', mode: 'Hybrid', type: 'Full-time' },
    { id: 'job_b', title: 'Product Manager', expired: false, visible: true, department: 'Product', location: 'Remote', mode: 'Remote', type: 'Full-time' },
    { id: 'job_c', title: 'Data Analyst', expired: false, visible: true, department: 'Data', location: 'Bangalore, India', mode: 'Hybrid', type: 'Full-time' },
    { id: 'job_d', title: 'UI/UX Designer', expired: false, visible: true, department: 'Design', location: 'Remote', mode: 'Remote', type: 'Contract' },
    { id: 'job_e', title: 'Backend Engineer', expired: false, visible: true, department: 'Engineering', location: 'Berlin, Germany', mode: 'Hybrid', type: 'Full-time' },
    { id: 'job_f', title: 'Data Scientist', expired: false, visible: false, department: 'Data', location: 'Berlin, Germany', mode: 'On-site', type: 'Full-time' },
    { id: 'job_g', title: 'UX Researcher', expired: true, visible: false, department: 'Design', location: 'Amsterdam, Netherlands', mode: 'Remote', type: 'Part-time' },
  ],
};

export function getCareerPageUrl(id: string = CAREER_PAGE_ID): string {
  return `https://xinterview.ai/careers/${id}`;
}

export function getCareerPageId(): string {
  return CAREER_PAGE_ID;
}

/** Appearance fields the public page can't fetch on its own yet (no
 *  workspace-scoped backend), so the settings page hands them over as query
 *  params — this is a stopgap until `/careers/[id]` reads a real API and
 *  these can be dropped. */
export const CAREER_APPEARANCE_PARAMS = [
  'showLogo',
  'buttonColor',
  'secondaryColor',
  'backgroundColor',
] as const;

export function getCareerPreviewUrl(
  config: Pick<CareerPageConfig, (typeof CAREER_APPEARANCE_PARAMS)[number]>,
  id: string = CAREER_PAGE_ID
): string {
  const params = new URLSearchParams({
    showLogo: String(config.showLogo),
    buttonColor: config.buttonColor,
    secondaryColor: config.secondaryColor,
    backgroundColor: config.backgroundColor,
  });
  return `${getCareerPageUrl(id)}?${params.toString()}`;
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

export type PublicCareerPage = {
  config: CareerPageConfig;
  companyName: string;
  logoUrl: string | null;
};

/** Public, unauthenticated read used by the `/careers/[id]` page. Returns
 *  `null` when the id doesn't match a published careers page. */
export async function getPublicCareerPage(id: string): Promise<PublicCareerPage | null> {
  await delay(400);
  if (id !== CAREER_PAGE_ID) return null;
  return {
    config: { ...careerStore, listings: careerStore.listings.map((l) => ({ ...l })) },
    companyName: orgStore.name,
    logoUrl: orgStore.logoUrl,
  };
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

/** smtp/smtpConnected come from the real endpoint; customDomain/brandingRemoved/zapierActive stay local — no doc coverage. */
export async function getIntegrations(): Promise<IntegrationState> {
  await delay(200);
  const smtp = await apiFetch<{
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    from_email: string;
    from_name: string;
    use_tls: boolean;
  } | null>(UM_PATHS.smtpSettings(COMPANY_ID)).catch(() => null);

  return {
    ...integrationStore,
    smtpConnected: smtp !== null,
    smtp: smtp
      ? {
          provider: 'smtp',
          host: smtp.smtp_host,
          port: String(smtp.smtp_port),
          username: smtp.smtp_username,
          password: '',
          fromEmail: smtp.from_email,
          fromName: smtp.from_name,
          useTls: smtp.use_tls,
        }
      : null,
  };
}

export async function saveSmtpConfig(config: SmtpConfig): Promise<IntegrationState> {
  if (config.provider === 'smtp') {
    if (!config.host.trim()) throw err('smtp_host_required', 'smtp_host_required');
    if (!config.port.trim()) throw err('smtp_port_required', 'smtp_port_required');
    if (!config.username.trim()) throw err('smtp_username_required', 'smtp_username_required');
    if (!config.password.trim()) throw err('smtp_password_required', 'smtp_password_required');
  }
  if (!config.fromEmail.trim()) throw err('smtp_from_required', 'smtp_from_required');

  // The wire shape has no `provider` field — both variants map onto the same
  // flat smtp_* body; `provider` stays a client-only field that only drives
  // which inputs the form shows.
  await apiFetch(UM_PATHS.smtpSettings(COMPANY_ID), {
    method: 'POST',
    body: {
      smtp_host: config.host,
      smtp_port: Number(config.port),
      smtp_username: config.username,
      smtp_password: config.password,
      from_email: config.fromEmail,
      from_name: config.fromName,
      use_tls: config.useTls,
      use_ssl: false,
    },
  });
  integrationStore = { ...integrationStore, smtpConnected: true };
  return getIntegrations();
}

export async function sendSmtpTestEmail(to: string): Promise<{ sent: boolean }> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    throw err('smtp_test_failed', 'smtp_test_failed');
  }
  await apiFetch(UM_PATHS.smtpVerify(COMPANY_ID), { method: 'POST', body: { email: to } });
  return { sent: true };
}

/** No disconnect/DELETE endpoint in either doc (only GET/POST/verify exist) — kept local. */
export async function disconnectSmtp(): Promise<IntegrationState> {
  await delay();
  integrationStore = { ...integrationStore, smtp: null, smtpConnected: false };
  return { ...integrationStore };
}

/**
 * No clean doc equivalent: the doc's "trusted origins" (CORS allow-list +
 * TXT verification, see getTrustedOrigins() below) is a different concept
 * from this careers-page subdomain/apex setting — kept fully local.
 */
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

/**
 * The success response has no numeric discount field, only a human message
 * ("Coupon applied — 20% off the first year.") — discountPct is derived
 * client-side from the known seeded codes so the function's external return
 * type stays unchanged. Revisit if the backend ever adds a structured field.
 */
export async function applyCoupon(code: string): Promise<{ discountPct: number }> {
  const normalised = code.trim().toUpperCase();
  if (!normalised) throw err('coupon_invalid', 'coupon_invalid');
  await apiFetch<{ message: string; coupon: string }>(UM_PATHS.coupons(COMPANY_ID), {
    method: 'POST',
    body: { coupon_code: normalised },
    statusCodeMap: { 404: 'coupon_invalid' },
  });
  const KNOWN_DISCOUNTS: Record<string, number> = { LAUNCH20: 20, WELCOME10: 10 };
  return { discountPct: KNOWN_DISCOUNTS[normalised] ?? 0 };
}

// ─── Billing addresses — wired, not yet surfaced in any UI ───

export async function getAddresses(): Promise<BillingAddress[]> {
  return apiFetch<BillingAddress[]>(UM_PATHS.addresses(COMPANY_ID));
}

export async function addAddress(
  body: Omit<BillingAddress, 'id'>
): Promise<BillingAddress> {
  return apiFetch<BillingAddress>(UM_PATHS.addresses(COMPANY_ID), { method: 'POST', body });
}

export async function updateAddress(
  addressId: number,
  body: Omit<BillingAddress, 'id'>
): Promise<BillingAddress> {
  return apiFetch<BillingAddress>(UM_PATHS.address(COMPANY_ID, addressId), {
    method: 'PUT',
    body,
  });
}

export async function deleteAddress(addressId: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(UM_PATHS.address(COMPANY_ID, addressId), {
    method: 'DELETE',
  });
}

// ─── Trusted origins — wired, not yet surfaced in any UI ───
//
// Different concept from saveCustomDomain/removeCustomDomain above: this is a
// CORS-style allowed-origin list for the careers-page embed, verified via a
// TXT DNS record, per backend-docs/usermanagement-api.md.

export async function getTrustedOrigins(): Promise<TrustedOrigin> {
  const result = await apiFetch<{ details: TrustedOrigin }>(UM_PATHS.trustedOrigins(COMPANY_ID));
  return result.details;
}

export async function addTrustedOrigin(domain: string): Promise<TrustedOrigin> {
  const result = await apiFetch<{ details: TrustedOrigin }>(UM_PATHS.trustedOrigins(COMPANY_ID), {
    method: 'POST',
    body: { domain, company: COMPANY_ID },
  });
  return result.details;
}

export async function removeTrustedOrigin(): Promise<{ success: boolean }> {
  await apiFetch(UM_PATHS.trustedOrigins(COMPANY_ID), { method: 'DELETE' });
  return { success: true };
}

export async function verifyDomainTxt(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(UM_PATHS.domainCheckTxt(COMPANY_ID), { method: 'POST' });
}

export function _resetSettingsStore() {
  orgStore = { ...ORG };
}
