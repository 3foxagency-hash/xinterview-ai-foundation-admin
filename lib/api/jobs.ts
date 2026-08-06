import type { InterviewFormat } from '@/lib/validation/job';

export type ApiError = {
  message: string;
  code: string;
};

function delay(ms = 800) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function err(code: string, message: string): ApiError {
  return { code, message } as ApiError;
}

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

// ─── Mock data ───
const PREVIOUS_TITLES = [
  'Senior Frontend Engineer',
  'Product Manager',
  'Full Stack Developer',
  'Data Scientist',
  'UX Designer',
  'DevOps Engineer',
];

const COMPANY_MEMBERS: CompanyMember[] = [
  { id: 'cm_1', name: 'Sarah Chen', email: 'sarah.chen@xinterview.ai', role: 'Admin', initials: 'SC' },
  { id: 'cm_2', name: 'Marcus Reid', email: 'marcus.reid@xinterview.ai', role: 'Manager', initials: 'MR' },
  { id: 'cm_3', name: 'Priya Nair', email: 'priya.nair@xinterview.ai', role: 'Executive', initials: 'PN' },
  { id: 'cm_4', name: 'James Okafor', email: 'james.okafor@xinterview.ai', role: 'Manager', initials: 'JO' },
  { id: 'cm_5', name: 'Elena Volkova', email: 'elena.volkova@xinterview.ai', role: 'Admin', initials: 'EV' },
  { id: 'cm_6', name: 'David Kim', email: 'david.kim@xinterview.ai', role: 'Member', initials: 'DK' },
  { id: 'cm_7', name: 'Aisha Bakr', email: 'aisha.bakr@xinterview.ai', role: 'Member', initials: 'AB' },
  { id: 'cm_8', name: 'Tom Walker', email: 'tom.walker@xinterview.ai', role: 'Manager', initials: 'TW' },
];

const PLAN: PlanInfo = {
  emailNotifications: true,
  smsEnabled: false,
  candidateLimit: 100,
  candidatesUsed: 94,
};

// ─── In-memory store ───
let jobStore: Map<string, Job> = new Map();
let questionsStore: Map<string, Question[]> = new Map();
let teamStore: Map<string, JobTeamMember[]> = new Map();
let inviteStore: Map<string, { firstName: string; lastName: string; email: string }[]> = new Map();

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

// ─── API functions ───
export async function getPreviousJobTitles(): Promise<string[]> {
  await delay(500);
  return [...PREVIOUS_TITLES];
}

/**
 * Templates come from the question library in Settings, so anything created
 * there is immediately offered when building a job.
 */
export async function getQuestionTemplates(): Promise<QuestionTemplate[]> {
  const { getQuestionTemplates: getLibraryTemplates } = await import('@/lib/api/settings');
  const library = await getLibraryTemplates();
  return library.map((t) => ({
    id: t.id,
    name: t.name,
    questionCount: t.questions.length,
  }));
}

export async function getCompanyMembers(): Promise<CompanyMember[]> {
  await delay(500);
  return COMPANY_MEMBERS.filter((m) => ['Admin', 'Manager', 'Executive'].includes(m.role));
}

export async function getPlanInfo(): Promise<PlanInfo> {
  await delay(300);
  return { ...PLAN };
}

export async function createJob(input: {
  format: InterviewFormat;
  title: string;
  timezone: string;
  applicationDeadline: string;
  interviewLanguage: string;
  description: string;
}): Promise<Job> {
  await delay();
  const id = genId('job');
  const job: Job = {
    id,
    title: input.title,
    format: input.format,
    timezone: input.timezone,
    applicationDeadline: input.applicationDeadline,
    interviewLanguage: input.interviewLanguage,
    description: input.description,
    status: 'draft',
    candidateUrl: `https://xinterview.ai/interview/${id}`,
    createdAt: new Date().toISOString(),
  };
  jobStore.set(id, job);
  teamStore.set(id, [
    {
      ...COMPANY_MEMBERS[0],
      notifyOnComplete: true,
      isCreator: true,
    },
  ]);
  return job;
}

export async function getJob(id: string): Promise<Job> {
  await delay(400);
  const job = jobStore.get(id);
  if (!job) throw err('not_found', 'Job not found');
  return { ...job };
}

export async function updateJob(
  id: string,
  patch: Partial<Job>
): Promise<Job> {
  await delay();
  const job = jobStore.get(id);
  if (!job) throw err('not_found', 'Job not found');
  const updated = { ...job, ...patch };
  jobStore.set(id, updated);
  return { ...updated };
}

export async function getQuestions(jobId: string): Promise<Question[]> {
  await delay(400);
  return [...(questionsStore.get(jobId) ?? [])];
}

export async function saveQuestions(
  jobId: string,
  questions: Question[]
): Promise<Question[]> {
  await delay();
  questionsStore.set(jobId, [...questions]);
  return [...questions];
}

export async function getJobTeam(jobId: string): Promise<JobTeamMember[]> {
  await delay(400);
  return [...(teamStore.get(jobId) ?? [])];
}

export async function addJobTeamMembers(
  jobId: string,
  memberIds: string[]
): Promise<JobTeamMember[]> {
  await delay();
  const current = teamStore.get(jobId) ?? [];
  const toAdd = COMPANY_MEMBERS.filter(
    (m) => memberIds.includes(m.id) && !current.some((c) => c.id === m.id)
  ).map((m) => ({ ...m, notifyOnComplete: false, isCreator: false }));
  const updated = [...current, ...toAdd];
  teamStore.set(jobId, updated);
  return [...updated];
}

export async function removeJobTeamMember(
  jobId: string,
  memberId: string
): Promise<JobTeamMember[]> {
  await delay();
  const current = teamStore.get(jobId) ?? [];
  const updated = current.filter((m) => m.id !== memberId || m.isCreator || m.role === 'Admin');
  teamStore.set(jobId, updated);
  return [...updated];
}

export async function updateTeamMemberNotification(
  jobId: string,
  memberId: string,
  notifyOnComplete: boolean
): Promise<JobTeamMember[]> {
  await delay(300);
  const current = teamStore.get(jobId) ?? [];
  const updated = current.map((m) =>
    m.id === memberId ? { ...m, notifyOnComplete } : m
  );
  teamStore.set(jobId, updated);
  return [...updated];
}

export async function getInviteReadiness(jobId: string): Promise<{
  jobDetailsReady: boolean;
  questionCount: number;
  teamCount: number;
  brandingReady: boolean;
}> {
  await delay(300);
  const job = jobStore.get(jobId);
  const questions = questionsStore.get(jobId) ?? [];
  const team = teamStore.get(jobId) ?? [];
  return {
    jobDetailsReady: !!job?.title,
    questionCount: questions.length,
    teamCount: team.length,
    brandingReady: false,
  };
}

export async function sendInvites(
  jobId: string,
  invites: { firstName: string; lastName: string; email: string }[]
): Promise<{ sent: number }> {
  await delay();
  const existing = inviteStore.get(jobId) ?? [];
  inviteStore.set(jobId, [...existing, ...invites]);
  return { sent: invites.length };
}

export async function bulkInvite(
  jobId: string,
  rows: { firstName: string; lastName: string; email: string }[]
): Promise<BulkInviteResult> {
  await delay(1200);
  const valid: typeof rows = [];
  const failed: BulkInviteResult['failed'] = [];
  const seen = new Set<string>();
  const existing = inviteStore.get(jobId) ?? [];
  const existingEmails = new Set(existing.map((e) => e.email.toLowerCase()));

  for (const row of rows) {
    const emailLower = row.email.toLowerCase();
    if (!row.email.includes('@')) {
      failed.push({ ...row, reason: 'Invalid email address' });
    } else if (seen.has(emailLower)) {
      failed.push({ ...row, reason: 'Duplicate in this upload' });
    } else if (existingEmails.has(emailLower)) {
      failed.push({ ...row, reason: 'Already invited' });
    } else {
      valid.push(row);
      seen.add(emailLower);
    }
  }

  inviteStore.set(jobId, [...existing, ...valid]);
  return { invited: valid.length, failed };
}

export async function generateJobDescription(
  title: string,
  _language: string
): Promise<string> {
  await delay(1400);
  return `<h2>About the role</h2><p>We are looking for a ${title} to join our growing team. In this role, you will collaborate closely with cross-functional partners to deliver impactful work.</p><h3>Responsibilities</h3><ul><li>Lead and own key projects end-to-end</li><li>Collaborate with stakeholders to define priorities</li><li>Drive quality and continuous improvement</li></ul><h3>Requirements</h3><ul><li>Proven experience in a similar role</li><li>Strong communication and problem-solving skills</li><li>Bachelor's degree or equivalent experience</li></ul>`;
}

export async function generateAiQuestions(
  counts: { video: number; audio: number; text: number; singleChoice: number },
  _jobTitle: string
): Promise<Question[]> {
  await delay(1600);
  const questions: Question[] = [];
  let idx = 0;

  for (let i = 0; i < counts.video; i++) {
    idx++;
    questions.push({
      id: genId('q'),
      type: 'video',
      title: `Video question ${idx}: Tell us about your experience relevant to this role.`,
      description: 'Record a 2-minute response covering your background and key achievements.',
      retakesAllowed: 2,
      thinkingTime: '30s',
      answerTime: '2min',
    });
  }
  for (let i = 0; i < counts.audio; i++) {
    idx++;
    questions.push({
      id: genId('q'),
      type: 'audio',
      title: `Audio question ${idx}: Describe a challenge you overcame and what you learned.`,
      description: 'Record an audio response of up to 2 minutes.',
      retakesAllowed: 1,
      thinkingTime: '15s',
      answerTime: '2min',
    });
  }
  for (let i = 0; i < counts.text; i++) {
    idx++;
    questions.push({
      id: genId('q'),
      type: 'text',
      title: `Text question ${idx}: What attracts you to this position?`,
      description: 'Write your answer in up to 500 characters.',
      answerTime: '5min',
      charLimit: 500,
    });
  }
  for (let i = 0; i < counts.singleChoice; i++) {
    idx++;
    questions.push({
      id: genId('q'),
      type: 'single_choice',
      title: `Choice question ${idx}: Which methodology do you prefer for managing projects?`,
      description: 'Select the single best answer.',
      options: [
        { id: genId('opt'), text: 'Agile / Scrum', isCorrect: true },
        { id: genId('opt'), text: 'Waterfall', isCorrect: false },
        { id: genId('opt'), text: 'Kanban', isCorrect: false },
      ],
    });
  }

  return questions;
}

/**
 * Pulls a template's questions from the Settings question library and gives
 * each one a fresh id so editing them in a job never mutates the template.
 */
export async function getTemplateQuestions(templateId: string): Promise<Question[]> {
  const { getQuestionTemplates: getLibraryTemplates } = await import('@/lib/api/settings');
  const library = await getLibraryTemplates();
  const template = library.find((t) => t.id === templateId);
  if (!template) return [];
  return template.questions.map((q) => ({
    ...q,
    id: genId('q'),
    options: q.options?.map((o) => ({ ...o, id: genId('opt') })),
  })) as Question[];
}

export function _resetJobsStore() {
  jobStore = new Map();
  questionsStore = new Map();
  teamStore = new Map();
  inviteStore = new Map();
}

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
    logoUrl: '',
    primaryColour: '#5B4FE9',
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
    requireHumanReview: true,
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
