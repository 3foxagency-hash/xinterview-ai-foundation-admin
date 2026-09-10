import type { InterviewFormat } from '@/lib/validation/job';
import { SCORING_BAND_COLOURS } from '@/lib/constants/scoring-band-colours';
import { CITIES } from '@/lib/constants/locations';
import { PersistentMap } from '@/lib/utils/persistent-map';

/**
 * Jobs API — the create-job wizard flow.
 *
 * There is no backend wired up yet, so this is an in-memory store: state
 * lives in module-level variables and resets on reload. Exported names,
 * signatures and error codes match what a real backend-shaped client would
 * expose, so swapping this module for a real one later touches no call
 * sites. The customisation section below (branding, welcome page, stages, …)
 * follows the same pattern and is migrated separately.
 */

export type ApiError = {
  message: string;
  code: string;
  retryAfter?: number;
};

// ─── Types ───
export type JobStatus = 'draft' | 'active';

export type Job = {
  id: string;
  title: string;
  format: InterviewFormat;
  timezone: string;
  applicationDeadline: string;
  interviewLanguage: string;
  description: string;
  status: JobStatus;
  candidateUrl: string;
  createdAt: string;
  department?: string;
  employmentType?: string;
  experienceLevel?: string;
  locationType?: string;
  location?: string;
  interviewDuration?: string;
  availabilityWindowStart?: string;
  availabilityWindowEnd?: string;
  breakBetweenInterviews?: string;
};

export type QuestionType = 'video' | 'audio' | 'text' | 'single_choice';

export type AnswerOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  retakesAllowed?: number;
  thinkingTime?: string;
  answerTime?: string;
  charLimit?: number;
  options?: AnswerOption[];
};

export type QuestionTemplate = {
  id: string;
  name: string;
  questionCount: number;
  typeBreakdown?: Record<string, number>;
  lastUsedAt?: string;
};

export type CompanyMember = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Executive';
  initials: string;
};

export type JobTeamMember = CompanyMember & {
  notifyOnComplete: boolean;
  isCreator: boolean;
};

export type PlanInfo = {
  emailNotifications: boolean;
  smsEnabled: boolean;
  atsImport: boolean;
  candidateLimit: number;
  candidatesUsed: number;
};

export type BulkInviteResult = {
  invited: number;
  failed: { firstName: string; lastName: string; email: string; reason: string }[];
};

// ─── Error helper ───

function err(code: string, message = code): ApiError {
  return { code, message };
}

function delay(ms = 500) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function ulid(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 20)
      : Math.random().toString(36).slice(2).toUpperCase().padEnd(20, '0');
  return `${Date.now().toString(36).toUpperCase()}${rand}`.slice(0, 26);
}

// ─── Store — persisted to localStorage so a job survives a page refresh
// or a direct URL visit (there's no real backend behind this mock layer) ───

const jobStore = new PersistentMap<Job>('xi_mock_jobs');
const questionStore = new PersistentMap<Question[]>('xi_mock_questions');
const teamStore = new PersistentMap<JobTeamMember[]>('xi_mock_team');

const COMPANY_MEMBERS: CompanyMember[] = [
  { id: 'mem_1', name: 'Priya Shah', email: 'priya.shah@acme.com', role: 'Admin', initials: 'PS' },
  { id: 'mem_2', name: 'Arjun Mehta', email: 'arjun.mehta@acme.com', role: 'Admin', initials: 'AM' },
  { id: 'mem_3', name: 'Neha Verma', email: 'neha.verma@acme.com', role: 'Manager', initials: 'NV' },
  { id: 'mem_4', name: 'Rohan Kapoor', email: 'rohan.kapoor@acme.com', role: 'Manager', initials: 'RK' },
  { id: 'mem_5', name: 'Ananya Iyer', email: 'ananya.iyer@acme.com', role: 'Manager', initials: 'AI' },
  { id: 'mem_6', name: 'Vikram Rao', email: 'vikram.rao@acme.com', role: 'Executive', initials: 'VR' },
  { id: 'mem_7', name: 'Lena Kowalski', email: 'lena.kowalski@acme.com', role: 'Executive', initials: 'LK' },
  { id: 'mem_8', name: 'Tomás Rivera', email: 'tomas.rivera@acme.com', role: 'Manager', initials: 'TR' },
  { id: 'mem_9', name: 'Yuki Tanaka', email: 'yuki.tanaka@acme.com', role: 'Manager', initials: 'YT' },
  { id: 'mem_10', name: 'Grace Okafor', email: 'grace.okafor@acme.com', role: 'Executive', initials: 'GO' },
  { id: 'mem_11', name: 'Noah Bergström', email: 'noah.bergstrom@acme.com', role: 'Manager', initials: 'NB' },
  { id: 'mem_12', name: 'Isabelle Dubois', email: 'isabelle.dubois@acme.com', role: 'Manager', initials: 'ID' },
  { id: 'mem_13', name: 'Ravi Subramaniam', email: 'ravi.subramaniam@acme.com', role: 'Manager', initials: 'RS' },
  { id: 'mem_14', name: 'Hannah Kim', email: 'hannah.kim@acme.com', role: 'Manager', initials: 'HK' },
];

/** Team members every new job starts with, alongside its owner — mirrors a
 *  small hiring team already collaborating, so the Team step isn't empty
 *  the first time a job is created. */
const DEFAULT_TEAM_MEMBER_IDS = ['mem_2', 'mem_3', 'mem_4', 'mem_5', 'mem_6'];

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  { id: 'tpl_frontend', name: 'Frontend Engineer', questionCount: 5, typeBreakdown: { video: 3, text: 1, single_choice: 1 }, lastUsedAt: '2026-08-20T10:00:00Z' },
  { id: 'tpl_backend', name: 'Backend Engineer', questionCount: 5, typeBreakdown: { video: 2, audio: 1, text: 1, single_choice: 1 }, lastUsedAt: '2026-08-15T14:30:00Z' },
  { id: 'tpl_product', name: 'Product Manager', questionCount: 4, typeBreakdown: { video: 2, text: 2 }, lastUsedAt: '2026-08-10T09:15:00Z' },
];

function sampleQuestions(count = 5): Question[] {
  const bank: Question[] = [
    { id: 'q_1', type: 'video', title: 'Tell us about yourself', description: 'A brief introduction covering your background and what draws you to this role.', retakesAllowed: 1, thinkingTime: '00:30', answerTime: '02:00' },
    { id: 'q_2', type: 'video', title: 'Describe a challenging project', description: 'Walk through a project that pushed your skills and how you approached it.', retakesAllowed: 1, thinkingTime: '00:30', answerTime: '03:00' },
    { id: 'q_3', type: 'text', title: 'Why this role?', description: 'What interests you about this position specifically?', charLimit: 500 },
    { id: 'q_4', type: 'audio', title: 'Describe your ideal team', description: 'What does a productive team environment look like to you?', retakesAllowed: 1, thinkingTime: '00:20', answerTime: '01:30' },
    { id: 'q_5', type: 'single_choice', title: 'Preferred working style', description: 'Which best describes how you like to work?', options: [
      { id: 'opt_1', text: 'Independently, with clear goals', isCorrect: false },
      { id: 'opt_2', text: 'Collaboratively, in constant sync', isCorrect: false },
      { id: 'opt_3', text: 'A mix of both', isCorrect: false },
    ] },
  ];
  return bank.slice(0, count);
}

function toTeamMember(m: CompanyMember, overrides: Partial<JobTeamMember> = {}): JobTeamMember {
  return { ...m, notifyOnComplete: true, isCreator: false, ...overrides };
}

// ─── API functions ───

/** Previously-used job titles, offered as suggestions. */
export async function getPreviousJobTitles(): Promise<string[]> {
  await delay(150);
  return [...new Set([...jobStore.values()].map((j) => j.title))];
}

/** Place search for the job location field — filters the curated city list. */
export async function searchPlaces(query: string): Promise<string[]> {
  await delay(150);
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CITIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
}

export async function getQuestionTemplates(): Promise<QuestionTemplate[]> {
  await delay(200);
  return QUESTION_TEMPLATES;
}

export async function getCompanyMembers(): Promise<CompanyMember[]> {
  await delay(200);
  return COMPANY_MEMBERS;
}

export async function getPlanInfo(): Promise<PlanInfo> {
  await delay(150);
  return {
    emailNotifications: true,
    smsEnabled: true,
    atsImport: true,
    candidateLimit: 100,
    candidatesUsed: jobStore.size * 3,
  };
}

export async function createJob(input: {
  format: InterviewFormat;
  title: string;
  timezone: string;
  applicationDeadline: string;
  interviewLanguage: string;
  description: string;
  department?: string;
  employmentType?: string;
  experienceLevel?: string;
  locationType?: string;
  location?: string;
  interviewDuration?: string;
  availabilityWindowStart?: string;
  availabilityWindowEnd?: string;
  breakBetweenInterviews?: string;
}): Promise<Job> {
  await delay(500);
  if (!input.title.trim()) throw err('validation_failed', 'Title is required');

  const id = `job_${ulid()}`;
  const job: Job = {
    id,
    title: input.title,
    format: input.format,
    timezone: input.timezone,
    applicationDeadline: input.applicationDeadline,
    interviewLanguage: input.interviewLanguage,
    description: input.description,
    status: 'draft',
    candidateUrl: `https://apply.xinterview.ai/j/${id}`,
    createdAt: new Date().toISOString(),
    department: input.department,
    employmentType: input.employmentType,
    experienceLevel: input.experienceLevel,
    locationType: input.locationType,
    location: input.location,
    interviewDuration: input.interviewDuration,
    availabilityWindowStart: input.availabilityWindowStart,
    availabilityWindowEnd: input.availabilityWindowEnd,
    breakBetweenInterviews: input.breakBetweenInterviews,
  };
  jobStore.set(id, job);
  const defaultMembers = DEFAULT_TEAM_MEMBER_IDS
    .map((mid) => COMPANY_MEMBERS.find((m) => m.id === mid))
    .filter((m): m is CompanyMember => m !== undefined)
    .map((m) => toTeamMember(m, { notifyOnComplete: m.id !== 'mem_5' }));
  teamStore.set(id, [toTeamMember(COMPANY_MEMBERS[0], { isCreator: true }), ...defaultMembers]);
  return job;
}

export async function getJob(id: string): Promise<Job> {
  await delay(200);
  const job = jobStore.get(id);
  if (!job) throw err('not_found', 'Job not found');
  return job;
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<Job> {
  await delay(400);
  const existing = jobStore.get(id);
  if (!existing) throw err('not_found', 'Job not found');

  // `format`, `status` and identity fields are server-owned after creation;
  // patching them here would be rejected or silently ignored by a real API.
  const {
    title,
    timezone,
    applicationDeadline,
    interviewLanguage,
    description,
    department,
    employmentType,
    experienceLevel,
    locationType,
    location,
    interviewDuration,
    availabilityWindowStart,
    availabilityWindowEnd,
    breakBetweenInterviews,
  } = patch;
  const next: Job = {
    ...existing,
    ...(title !== undefined ? { title } : {}),
    ...(timezone !== undefined ? { timezone } : {}),
    ...(applicationDeadline !== undefined ? { applicationDeadline } : {}),
    ...(interviewLanguage !== undefined ? { interviewLanguage } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(department !== undefined ? { department } : {}),
    ...(employmentType !== undefined ? { employmentType } : {}),
    ...(experienceLevel !== undefined ? { experienceLevel } : {}),
    ...(locationType !== undefined ? { locationType } : {}),
    ...(location !== undefined ? { location } : {}),
    ...(interviewDuration !== undefined ? { interviewDuration } : {}),
    ...(availabilityWindowStart !== undefined ? { availabilityWindowStart } : {}),
    ...(availabilityWindowEnd !== undefined ? { availabilityWindowEnd } : {}),
    ...(breakBetweenInterviews !== undefined ? { breakBetweenInterviews } : {}),
  };
  jobStore.set(id, next);
  return next;
}

export async function getQuestions(jobId: string): Promise<Question[]> {
  await delay(250);
  return questionStore.get(jobId) ?? [];
}

export async function saveQuestions(
  jobId: string,
  questions: Question[]
): Promise<Question[]> {
  await delay(400);
  questionStore.set(jobId, questions);
  return questions;
}

export async function getJobTeam(jobId: string): Promise<JobTeamMember[]> {
  await delay(200);
  return teamStore.get(jobId) ?? [];
}

export async function addJobTeamMembers(
  jobId: string,
  memberIds: string[]
): Promise<JobTeamMember[]> {
  await delay(400);
  const current = teamStore.get(jobId) ?? [];
  const existingIds = new Set(current.map((m) => m.id));
  const additions = memberIds
    .filter((id) => !existingIds.has(id))
    .map((id) => COMPANY_MEMBERS.find((m) => m.id === id))
    .filter((m): m is CompanyMember => m !== undefined)
    .map((m) => toTeamMember(m));
  const next = [...current, ...additions];
  teamStore.set(jobId, next);
  return next;
}

export async function removeJobTeamMember(
  jobId: string,
  memberId: string
): Promise<JobTeamMember[]> {
  await delay(300);
  const current = teamStore.get(jobId) ?? [];
  const target = current.find((m) => m.id === memberId);
  if (target?.isCreator) throw err('validation_failed', 'The job owner cannot be removed');
  if (target?.role === 'Admin') throw err('validation_failed', 'Company admins always have access to every job');
  const next = current.filter((m) => m.id !== memberId);
  teamStore.set(jobId, next);
  return next;
}

export async function updateTeamMemberNotification(
  jobId: string,
  memberId: string,
  notifyOnComplete: boolean
): Promise<JobTeamMember[]> {
  await delay(300);
  const current = teamStore.get(jobId) ?? [];
  const next = current.map((m) =>
    m.id === memberId ? { ...m, notifyOnComplete } : m
  );
  teamStore.set(jobId, next);
  return next;
}

export async function getInviteReadiness(jobId: string): Promise<{
  jobDetailsReady: boolean;
  questionCount: number;
  teamCount: number;
  brandingReady: boolean;
}> {
  await delay(200);
  const job = jobStore.get(jobId);
  const questionCount = (questionStore.get(jobId) ?? []).length;
  const teamCount = (teamStore.get(jobId) ?? []).length;
  return {
    jobDetailsReady: Boolean(job),
    questionCount,
    teamCount,
    brandingReady: true,
  };
}

export async function sendInvites(
  _jobId: string,
  invites: { firstName: string; lastName: string; email: string }[]
): Promise<{ sent: number }> {
  await delay(600);
  return { sent: invites.length };
}

export async function bulkInvite(
  _jobId: string,
  rows: { firstName: string; lastName: string; email: string }[]
): Promise<BulkInviteResult> {
  await delay(600);
  return { invited: rows.length, failed: [] };
}

export async function generateJobDescription(title: string, language: string): Promise<string> {
  await delay(1000);
  // Mock failure case so the ai_error retry path is reachable without a real backend.
  if (Math.random() < 0.15) {
    throw new Error('generation_failed');
  }
  return [
    '<h2>Summary</h2>',
    `<p>We are looking for a ${title} to join our team. This role suits someone who is curious, detail-oriented, and energised by solving hard problems with a team. Interviews for this role are conducted in ${language}.</p>`,
    '<h2>Responsibilities</h2>',
    '<ul><li>Own key initiatives end to end, from scoping through delivery.</li><li>Collaborate closely with cross-functional partners across the organisation.</li><li>Help raise the bar for quality in everything the team ships.</li></ul>',
    '<h2>Requirements</h2>',
    `<ul><li>Proven experience in a similar ${title} role.</li><li>Strong communication skills and comfort working with ambiguity.</li><li>A track record of delivering high-quality work independently.</li></ul>`,
  ].join('');
}

const AI_QUESTION_BANK: Record<QuestionType, Array<Omit<Question, 'id'>>> = {
  video: [
    { type: 'video', title: 'Tell us about your experience in this field', description: 'A brief introduction covering your background and what draws you to this role.', retakesAllowed: 1, thinkingTime: '30s', answerTime: '2min' },
    { type: 'video', title: 'Describe a challenging project you led', description: 'Walk through a project that pushed your skills and how you approached it.', retakesAllowed: 1, thinkingTime: '30s', answerTime: '3min' },
    { type: 'video', title: 'Walk us through a recent problem you solved', description: 'Share the context, your approach, and the outcome.', retakesAllowed: 1, thinkingTime: '45s', answerTime: '3min' },
    { type: 'video', title: 'Where do you see yourself in three years?', description: 'Share your career goals and how this role fits into them.', retakesAllowed: 1, thinkingTime: '30s', answerTime: '2min' },
    { type: 'video', title: 'How do you handle tight deadlines?', description: 'Describe your approach to prioritising work under pressure.', retakesAllowed: 1, thinkingTime: '30s', answerTime: '2min' },
  ],
  audio: [
    { type: 'audio', title: 'Describe your ideal team environment', description: 'What does a productive team environment look like to you?', retakesAllowed: 1, thinkingTime: '20s', answerTime: '1min' },
    { type: 'audio', title: 'Describe a time you handled conflict at work', description: 'How did you approach the situation and what was the result?', retakesAllowed: 1, thinkingTime: '30s', answerTime: '2min' },
    { type: 'audio', title: 'How do you stay organised across multiple priorities?', description: 'Talk through the tools or habits you rely on.', retakesAllowed: 1, thinkingTime: '20s', answerTime: '1min' },
  ],
  text: [
    { type: 'text', title: 'Why are you interested in this role?', description: 'What interests you about this position specifically?', charLimit: 500 },
    { type: 'text', title: 'What are your salary expectations?', description: 'Please provide a range and any relevant context.', charLimit: 300 },
    { type: 'text', title: 'Do you have any questions for us?', description: 'Anything you would like to know about the role or team.', charLimit: 500 },
  ],
  single_choice: [
    { type: 'single_choice', title: 'How do you prefer to work?', description: 'Which best describes your preferred working style?', options: [
      { id: `aio_${Date.now()}_a`, text: 'Independently with clear goals', isCorrect: false },
      { id: `aio_${Date.now()}_b`, text: 'Collaboratively in constant sync', isCorrect: false },
      { id: `aio_${Date.now()}_c`, text: 'A mix of both', isCorrect: true },
      { id: `aio_${Date.now()}_f`, text: 'It depends on the project', isCorrect: false },
    ] },
    { type: 'single_choice', title: 'Are you willing to relocate?', description: 'Let us know your relocation preferences.', options: [
      { id: `aio_${Date.now()}_d`, text: 'Yes, I am willing to relocate', isCorrect: true },
      { id: `aio_${Date.now()}_e`, text: 'No, I prefer remote only', isCorrect: false },
      { id: `aio_${Date.now()}_g`, text: 'Open to relocation for the right role', isCorrect: false },
      { id: `aio_${Date.now()}_h`, text: 'Only within my current region', isCorrect: false },
    ] },
  ],
};

/** Options are trimmed to the requested count (min 2, max 4), keeping the
 *  template's marked-correct option whenever it survives the trim. */
function buildOptions(
  template: Array<{ text: string; isCorrect: boolean }>,
  optionsPerChoice: number,
  uidRef: { current: number }
): Array<{ id: string; text: string; isCorrect: boolean }> {
  const count = Math.max(2, Math.min(4, optionsPerChoice));
  const trimmed = template.slice(0, count);
  if (!trimmed.some((o) => o.isCorrect) && trimmed.length > 0) {
    trimmed[0] = { ...trimmed[0], isCorrect: true };
  }
  return trimmed.map((o) => ({ ...o, id: `aio_${Date.now()}_${uidRef.current++}` }));
}

export async function generateAiQuestions(
  counts: { video: number; audio: number; text: number; singleChoice: number },
  jobTitle: string,
  _jobId?: string,
  focus?: string,
  optionsPerChoice = 3
): Promise<Question[]> {
  await delay(1200);
  const requested: Array<[QuestionType, number]> = [
    ['video', counts.video],
    ['audio', counts.audio],
    ['text', counts.text],
    ['single_choice', counts.singleChoice],
  ];

  const results: Question[] = [];
  const uidRef = { current: 0 };
  for (const [type, count] of requested) {
    const pool = AI_QUESTION_BANK[type];
    if (!pool.length) continue;
    for (let i = 0; i < count; i++) {
      // Cycle through the pool if more of a type is requested than we have
      // canned drafts for, so counts are always honoured exactly.
      const template = pool[i % pool.length];
      const isFirstVideo = type === 'video' && i === 0;
      results.push({
        ...template,
        id: `aiq_${Date.now()}_${uidRef.current++}`,
        title: isFirstVideo ? `Tell us about your experience as a ${jobTitle}` : template.title,
        description: isFirstVideo && focus ? `Focus: ${focus}` : template.description,
        options: template.options
          ? buildOptions(template.options, optionsPerChoice, uidRef)
          : undefined,
      });
    }
  }
  return results;
}

export async function publishJob(jobId: string): Promise<{
  id: string;
  status: JobStatus;
  publishedAt: string;
}> {
  await delay(500);
  const job = jobStore.get(jobId);
  if (!job) throw err('not_found', 'Job not found');
  const publishedAt = new Date().toISOString();
  jobStore.set(jobId, { ...job, status: 'active' });
  return { id: jobId, status: 'active', publishedAt };
}

export async function getTemplateQuestions(templateId: string): Promise<Question[]> {
  await delay(300);
  const template = QUESTION_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw err('not_found', 'Template not found');
  return sampleQuestions(template.questionCount);
}

export async function saveQuestionTemplate(name: string, questions: Question[]): Promise<QuestionTemplate> {
  await delay(500);
  const id = `tpl_${ulid().toLowerCase()}`;
  const typeBreakdown: Record<string, number> = {};
  for (const q of questions) {
    typeBreakdown[q.type] = (typeBreakdown[q.type] ?? 0) + 1;
  }
  const template: QuestionTemplate = {
    id,
    name,
    questionCount: questions.length,
    typeBreakdown,
    lastUsedAt: new Date().toISOString(),
  };
  QUESTION_TEMPLATES.push(template);
  return template;
}

export async function getTemplateDetails(templateId: string): Promise<{ template: QuestionTemplate; questions: Question[] }> {
  await delay(300);
  const template = QUESTION_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw err('not_found', 'Template not found');
  const questions = await getTemplateQuestions(templateId);
  return { template, questions };
}

// ─────────────────────────────────────────────────────────────────────────────
// Everything below is still the in-memory implementation.
//
// The customisation sections (branding, welcome page, form, thank-you, social,
// experience, notifications, AI evaluation, stages, scoring) have not been
// migrated to a real backend yet. They are reused verbatim in Workspace
// settings, so moving them is its own change with its own verification.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Customisation API ───
import type {
  BrandingInput,
  WelcomePageInput,
  FormSettingsInput,
  ThankYouPageInput,
  SocialPreviewInput,
  InterviewExperienceInput,
  NotificationsInput,
  AiEvaluationInput,
  ScoringLabelsInput,
  StagesInput,
  EvaluationFactor,
  QuestionScoring,
} from '@/lib/validation/job';

const customStore = new PersistentMap<Record<string, unknown>>('xi_mock_customisation');

function getCustom(jobId: string): Record<string, unknown> {
  if (!customStore.has(jobId)) customStore.set(jobId, {});
  return customStore.get(jobId)!;
}

/** Setters mutate the object `getCustom` returns in place, then call this to
 *  write the change back through the store so it actually persists. */
function setCustom(jobId: string, data: Record<string, unknown>) {
  customStore.set(jobId, data);
}

export async function getBranding(jobId: string): Promise<BrandingInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.branding as BrandingInput) ?? {
    companyTitle: '',
    logoUrl: '',
    primaryColour: '#5B4FE9',
    secondaryColour: '#1F242E',
    theme: 'auto',
    font: 'inter',
    modernInterface: false,
  };
}

export async function saveBranding(jobId: string, input: BrandingInput): Promise<BrandingInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.branding = input;
  setCustom(jobId, data);
  return input;
}

export async function getWelcomePage(jobId: string): Promise<WelcomePageInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.welcomePage as WelcomePageInput) ?? {
    headline: '',
    subtitle: '',
    estimatedTime: 15,
    introVideoEnabled: true,
    introVideoUrl: '',
    introNoteEnabled: false,
    introNoteTitle: '',
    introNoteBody: '',
  };
}

export async function saveWelcomePage(jobId: string, input: WelcomePageInput): Promise<WelcomePageInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.welcomePage = input;
  setCustom(jobId, data);
  return input;
}

export async function getFormSettings(jobId: string): Promise<FormSettingsInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.formSettings as FormSettingsInput) ?? {
    firstName: 'required',
    lastName: 'required',
    email: 'required',
    phone: 'optional',
    resume: 'optional',
    linkedin: 'off',
    portfolio: 'off',
    privacyPolicyEnabled: false,
    privacyPolicyUrl: '',
    termsEnabled: false,
    termsUrl: '',
  };
}

export async function saveFormSettings(jobId: string, input: FormSettingsInput): Promise<FormSettingsInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.formSettings = input;
  setCustom(jobId, data);
  return input;
}

export async function getThankYouPage(jobId: string): Promise<ThankYouPageInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.thankYouPage as ThankYouPageInput) ?? {
    title: 'Thank you for completing your interview. We\'ll be in touch soon.',
    completionMessage: '',
    redirectEnabled: false,
    redirectUrl: '',
    redirectDelay: 5,
  };
}

export async function saveThankYouPage(jobId: string, input: ThankYouPageInput): Promise<ThankYouPageInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.thankYouPage = input;
  setCustom(jobId, data);
  return input;
}

export async function getSocialPreview(jobId: string): Promise<SocialPreviewInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.socialPreview as SocialPreviewInput) ?? {
    faviconUrl: '',
    shareImageUrl: '',
    previewTitle: '',
    previewDescription: '',
  };
}

export async function saveSocialPreview(jobId: string, input: SocialPreviewInput): Promise<SocialPreviewInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.socialPreview = input;
  setCustom(jobId, data);
  return input;
}

export async function getInterviewExperience(jobId: string): Promise<InterviewExperienceInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.interviewExperience as InterviewExperienceInput) ?? {
    tabSwitchDetection: true,
    disableCopyPaste: true,
    enforceFullScreen: false,
    candidateInstructions: '',
  };
}

export async function saveInterviewExperience(jobId: string, input: InterviewExperienceInput): Promise<InterviewExperienceInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.interviewExperience = input;
  setCustom(jobId, data);
  return input;
}

export async function getNotifications(jobId: string): Promise<NotificationsInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.notifications as NotificationsInput) ?? {
    email: {
      notifyOnCompletion: true,
      remindAfterDays: false,
      remindDays: 3,
      rejectionMessageEnabled: false,
      rejectionMessage: '',
    },
    sms: {
      notifyOnCompletion: false,
      remindAfterDays: false,
      remindDays: 3,
      rejectionMessageEnabled: false,
      rejectionMessage: '',
    },
  };
}

export async function saveNotifications(jobId: string, input: NotificationsInput): Promise<NotificationsInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.notifications = input;
  setCustom(jobId, data);
  return input;
}

export async function getAiEvaluation(jobId: string): Promise<AiEvaluationInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.aiEvaluation as AiEvaluationInput) ?? {
    positionLevel: 'mid',
    strictness: 'moderate',
    automaticEvaluation: false,
    factors: [],
    questionScoring: [],
  };
}

export async function saveAiEvaluation(jobId: string, input: AiEvaluationInput): Promise<AiEvaluationInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.aiEvaluation = input;
  setCustom(jobId, data);
  return input;
}

export async function getStages(jobId: string): Promise<StagesInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.stages as StagesInput) ?? {
    stages: [
      { id: 's1', name: 'Invited', locked: true },
      { id: 's2', name: 'In progress', locked: true },
      { id: 's3', name: 'Review', locked: true },
      { id: 's4', name: 'Shortlisted', locked: false },
      { id: 's5', name: 'Live interview', locked: false },
      { id: 's6', name: 'Hired', locked: false },
      { id: 's7', name: 'Rejected', locked: true },
    ],
  };
}

export async function saveStages(jobId: string, input: StagesInput): Promise<StagesInput> {
  await delay(400);
  const data = getCustom(jobId);
  // Guard the invariant server-side too: a locked stage cannot be renamed or
  // dropped, whatever the client sends.
  const existing = ((data.stages as StagesInput) ?? null)?.stages ?? null;
  if (existing) {
    for (const prev of existing.filter((s) => s.locked)) {
      const still = input.stages.find((s) => s.id === prev.id);
      if (!still) throw { code: 'stage_locked_removed', message: 'stage_locked_removed' };
      if (still.name !== prev.name) throw { code: 'stage_locked_renamed', message: 'stage_locked_renamed' };
    }
  }
  data.stages = input;
  setCustom(jobId, data);
  return input;
}

export async function getScoringLabels(jobId: string): Promise<ScoringLabelsInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.scoringLabels as ScoringLabelsInput) ?? {
    bands: [
      { id: 'b1', name: 'Poor', min: 0, max: 40, colour: SCORING_BAND_COLOURS[3] },
      { id: 'b2', name: 'Fair', min: 40, max: 70, colour: SCORING_BAND_COLOURS[2] },
      { id: 'b3', name: 'Good', min: 70, max: 100, colour: SCORING_BAND_COLOURS[0] },
    ],
  };
}

export async function saveScoringLabels(jobId: string, input: ScoringLabelsInput): Promise<ScoringLabelsInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.scoringLabels = input;
  setCustom(jobId, data);
  return input;
}

// AI generation for evaluation factors
export async function generateEvaluationFactors(
  jobTitle: string,
  positionLevel: string,
  questionTitles: string[]
): Promise<{ factors: EvaluationFactor[]; questionScoring: QuestionScoring[] }> {
  await delay(1200);
  const factorId = (n: number) => `factor_${n}`;
  const baseFactors: EvaluationFactor[] = [
    {
      id: factorId(1),
      name: 'Technical depth',
      description: 'Demonstrates understanding of core concepts and applies them effectively.',
      keywords: ['architecture', 'design patterns', 'best practices', 'scalability'],
      weight: 30,
      rubric: [
        { level: 1, description: 'Unable to explain basic concepts related to the role.' },
        { level: 2, description: 'Surface-level understanding; struggles with applied questions.' },
        { level: 3, description: 'Solid grasp of fundamentals; can handle most practical scenarios.' },
        { level: 4, description: 'Deep understanding; connects concepts across domains.' },
        { level: 5, description: 'Expert-level insight; introduces novel approaches and trade-offs.' },
      ],
    },
    {
      id: factorId(2),
      name: 'Communication',
      description: 'Expresses ideas clearly and structures responses logically.',
      keywords: ['clarity', 'structure', 'conciseness', 'articulation'],
      weight: 25,
      rubric: [
        { level: 1, description: 'Responses are unclear or disorganised.' },
        { level: 2, description: 'Some structure but tangential or hard to follow.' },
        { level: 3, description: 'Clear and organised; main points come through.' },
        { level: 4, description: 'Well-structured with natural flow and precise language.' },
        { level: 5, description: 'Exceptional clarity; tailors complexity to the audience.' },
      ],
    },
    {
      id: factorId(3),
      name: 'Problem solving',
      description: 'Approaches problems methodically and considers alternatives.',
      keywords: ['analysis', 'reasoning', 'trade-offs', 'creativity'],
      weight: 25,
      rubric: [
        { level: 1, description: 'Jumps to conclusions without analysing the problem.' },
        { level: 2, description: 'Identifies the problem but solution is simplistic.' },
        { level: 3, description: 'Methodical approach; considers a couple of alternatives.' },
        { level: 4, description: 'Evaluates trade-offs and picks a well-justified path.' },
        { level: 5, description: 'Novel, well-reasoned solutions under ambiguity.' },
      ],
    },
    {
      id: factorId(4),
      name: 'Cultural fit',
      description: 'Aligns with team values and working style.',
      keywords: ['collaboration', 'ownership', 'feedback', 'growth mindset'],
      weight: 20,
      rubric: [
        { level: 1, description: 'Values clearly misalign with the team culture.' },
        { level: 2, description: 'Neutral; hard to tell from the responses.' },
        { level: 3, description: 'Generally aligned; some evidence of shared values.' },
        { level: 4, description: 'Strong alignment; gives concrete examples of fit.' },
        { level: 5, description: 'Perfect fit; elevates team culture and values.' },
      ],
    },
  ];

  const questionScoring: QuestionScoring[] = questionTitles.map((_, i) => ({
    questionId: `q_${i}`,
    factorIds: i % 2 === 0 ? [factorId(1), factorId(3)] : [factorId(2), factorId(4)],
    excludedFromScoring: false,
  }));

  return { factors: baseFactors, questionScoring };
}
