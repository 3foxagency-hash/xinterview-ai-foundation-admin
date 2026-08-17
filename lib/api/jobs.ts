import type { InterviewFormat } from '@/lib/validation/job';

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
};

export type CompanyMember = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Executive' | 'Member';
  initials: string;
};

export type JobTeamMember = CompanyMember & {
  notifyOnComplete: boolean;
  isCreator: boolean;
};

export type PlanInfo = {
  emailNotifications: boolean;
  smsEnabled: boolean;
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

// ─── In-memory store ───

const jobStore = new Map<string, Job>();
const questionStore = new Map<string, Question[]>();
const teamStore = new Map<string, JobTeamMember[]>();

const COMPANY_MEMBERS: CompanyMember[] = [
  { id: 'mem_1', name: 'Sarah Chen', email: 'sarah.chen@xinterview.ai', role: 'Admin', initials: 'SC' },
  { id: 'mem_2', name: 'James Patel', email: 'james.patel@xinterview.ai', role: 'Manager', initials: 'JP' },
  { id: 'mem_3', name: 'Ava Thompson', email: 'ava.thompson@xinterview.ai', role: 'Member', initials: 'AT' },
  { id: 'mem_4', name: 'Diego Morales', email: 'diego.morales@xinterview.ai', role: 'Executive', initials: 'DM' },
];

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  { id: 'tpl_frontend', name: 'Frontend Engineer', questionCount: 5 },
  { id: 'tpl_backend', name: 'Backend Engineer', questionCount: 5 },
  { id: 'tpl_product', name: 'Product Manager', questionCount: 4 },
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
  };
  jobStore.set(id, job);
  teamStore.set(id, [toTeamMember(COMPANY_MEMBERS[0], { isCreator: true })]);
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
  const { title, timezone, applicationDeadline, interviewLanguage, description } =
    patch;
  const next: Job = {
    ...existing,
    ...(title !== undefined ? { title } : {}),
    ...(timezone !== undefined ? { timezone } : {}),
    ...(applicationDeadline !== undefined ? { applicationDeadline } : {}),
    ...(interviewLanguage !== undefined ? { interviewLanguage } : {}),
    ...(description !== undefined ? { description } : {}),
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
  if (target?.isCreator) throw err('validation_failed', 'The job creator cannot be removed');
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

export async function generateJobDescription(
  title: string,
  _language: string
): Promise<string> {
  await delay(1000);
  return `We are looking for a ${title} to join our team. You will collaborate closely with cross-functional partners, own key initiatives end to end, and help raise the bar for quality across the organisation. This role suits someone who is curious, detail-oriented, and energised by solving hard problems with a team.`;
}

export async function generateAiQuestions(
  counts: { video: number; audio: number; text: number; singleChoice: number },
  _jobTitle: string,
  _jobId?: string
): Promise<Question[]> {
  await delay(1200);
  const total = counts.video + counts.audio + counts.text + counts.singleChoice;
  return sampleQuestions(Math.max(1, Math.min(total, 5)));
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

const customStore = new Map<string, Record<string, unknown>>();

function getCustom(jobId: string): Record<string, unknown> {
  if (!customStore.has(jobId)) customStore.set(jobId, {});
  return customStore.get(jobId)!;
}

export async function getBranding(jobId: string): Promise<BrandingInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.branding as BrandingInput) ?? {
    companyTitle: '',
    logoUrl: '',
    primaryColour: '#5B4FE9',
    secondaryColour: '#1F242E',
    theme: 'light',
    font: 'inter',
    modernInterface: false,
  };
}

export async function saveBranding(jobId: string, input: BrandingInput): Promise<BrandingInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.branding = input;
  return input;
}

export async function getWelcomePage(jobId: string): Promise<WelcomePageInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.welcomePage as WelcomePageInput) ?? {
    headline: '',
    subtitle: '',
    estimatedTime: 15,
    introVideoEnabled: false,
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
  return input;
}

export async function getThankYouPage(jobId: string): Promise<ThankYouPageInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.thankYouPage as ThankYouPageInput) ?? {
    title: 'Interview Complete',
    completionMessage: 'Thank you for completing your interview. We\'ll be in touch soon.',
    redirectEnabled: false,
    redirectUrl: '',
    redirectDelay: 5,
  };
}

export async function saveThankYouPage(jobId: string, input: ThankYouPageInput): Promise<ThankYouPageInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.thankYouPage = input;
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
  return input;
}

export async function getScoringLabels(jobId: string): Promise<ScoringLabelsInput> {
  await delay(300);
  const data = getCustom(jobId);
  return (data.scoringLabels as ScoringLabelsInput) ?? {
    bands: [
      { id: 'b1', name: 'Poor', min: 0, max: 40, colour: '#EF4444' },
      { id: 'b2', name: 'Fair', min: 40, max: 70, colour: '#F59E0B' },
      { id: 'b3', name: 'Good', min: 70, max: 100, colour: '#10B981' },
    ],
  };
}

export async function saveScoringLabels(jobId: string, input: ScoringLabelsInput): Promise<ScoringLabelsInput> {
  await delay(400);
  const data = getCustom(jobId);
  data.scoringLabels = input;
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
