import type { InterviewFormat } from '@/lib/validation/job';
import { api, request } from './client';
import { isApiError } from './errors';
import type {
  WireJob,
  WireQuestion,
  WireQuestionTemplate,
  WireOrgMember,
  WireJobTeamMember,
  WirePlanInfo,
  InviteReadiness,
  BulkInviteResponse,
  PagedEnvelope,
  PublishJobResponse,
} from './contract';

/**
 * Jobs API — the create-job wizard flow.
 *
 * Every function crosses the network. In development MSW intercepts (see
 * mocks/handlers/jobs.ts); against a real backend the same code runs unchanged.
 * There is no `if (isMock)` branch anywhere.
 *
 * Exported types and signatures are unchanged from the previous in-memory
 * implementation, so all existing call sites keep working. The customisation
 * section below (branding, welcome page, stages, …) is still in-memory and is
 * migrated separately.
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

// ─── Error normalization ───

/**
 * Wire code → the lowercase code existing call sites branch on. Mapping lives
 * here so the UI does not churn now and can migrate to wire codes in one sweep
 * later.
 */
const CODE_MAP: Record<string, string> = {
  JOB_NOT_FOUND: 'not_found',
  VALIDATION_FAILED: 'validation_failed',
  FORMAT_NOT_AVAILABLE: 'format_not_available',
  CANDIDATE_LIMIT_REACHED: 'candidate_limit_reached',
  STAGE_LOCKED_REMOVED: 'stage_locked_removed',
  STAGE_LOCKED_RENAMED: 'stage_locked_renamed',
  TEMPLATE_NOT_FOUND: 'not_found',
  CLIENT_RATE_LIMITED: 'rate_limited',
  TOO_MANY_ATTEMPTS: 'rate_limited',
  NETWORK_ERROR: 'network_error',
  CIRCUIT_OPEN: 'network_error',
};

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return {
      code: CODE_MAP[error.code] ?? error.code.toLowerCase(),
      message: error.message,
      ...(error.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
    };
  }
  if (error instanceof Error) return { code: 'unknown', message: error.message };
  return { code: 'unknown', message: 'Something went wrong. Please try again.' };
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Deliberate cancellation is not an API error — let callers ignore it.
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw toApiError(error);
  }
}

/** Drops wire-only fields the UI does not model. */
function toJob(wire: WireJob): Job {
  return {
    id: wire.id,
    title: wire.title,
    format: wire.format as InterviewFormat,
    timezone: wire.timezone,
    applicationDeadline: wire.applicationDeadline,
    interviewLanguage: wire.interviewLanguage,
    description: wire.description,
    status: wire.status,
    candidateUrl: wire.candidateUrl,
    createdAt: wire.createdAt,
  };
}

function ulid(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 20)
      : Math.random().toString(36).slice(2).toUpperCase().padEnd(20, '0');
  return `${Date.now().toString(36).toUpperCase()}${rand}`.slice(0, 26);
}

// ─── API functions ───

/**
 * Previously-used job titles, offered as suggestions.
 *
 * Derived from the org's existing jobs rather than a hardcoded list, so the
 * suggestions reflect real data. Failure is non-fatal: this only powers a
 * convenience affordance, so an empty list is a better outcome than a blocked
 * form.
 */
export async function getPreviousJobTitles(): Promise<string[]> {
  try {
    const page = await request<PagedEnvelope<WireJob>>({
      path: '/jobs',
      query: { pageSize: 100, sort: 'createdAt:desc' },
    });
    return [...new Set(page.data.map((j) => j.title))];
  } catch {
    return [];
  }
}

export async function getQuestionTemplates(): Promise<QuestionTemplate[]> {
  return call(() => api.get<WireQuestionTemplate[]>('/jobs/templates'));
}

export async function getCompanyMembers(): Promise<CompanyMember[]> {
  return call(() => api.get<WireOrgMember[]>('/organisation/members'));
}

export async function getPlanInfo(): Promise<PlanInfo> {
  return call(() => api.get<WirePlanInfo>('/organisation/plan'));
}

export async function createJob(input: {
  format: InterviewFormat;
  title: string;
  timezone: string;
  applicationDeadline: string;
  interviewLanguage: string;
  description: string;
}): Promise<Job> {
  const wire = await call(() =>
    api.post<WireJob>('/jobs', {
      body: input,
      // Creating a job is not idempotent on the server without a key, and the
      // wizard's submit button is exactly where a double-click happens.
      idempotencyKey: ulid(),
    })
  );
  return toJob(wire);
}

export async function getJob(id: string): Promise<Job> {
  const wire = await call(() => api.get<WireJob>(`/jobs/${encodeURIComponent(id)}`));
  return toJob(wire);
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<Job> {
  // `format`, `status` and identity fields are server-owned after creation;
  // sending them would be rejected or silently ignored.
  const { title, timezone, applicationDeadline, interviewLanguage, description } =
    patch;
  const body = Object.fromEntries(
    Object.entries({
      title,
      timezone,
      applicationDeadline,
      interviewLanguage,
      description,
    }).filter(([, v]) => v !== undefined)
  );

  const wire = await call(() =>
    api.patch<WireJob>(`/jobs/${encodeURIComponent(id)}`, { body })
  );
  return toJob(wire);
}

export async function getQuestions(jobId: string): Promise<Question[]> {
  return call(() =>
    api.get<WireQuestion[]>(`/jobs/${encodeURIComponent(jobId)}/questions`)
  );
}

export async function saveQuestions(
  jobId: string,
  questions: Question[]
): Promise<Question[]> {
  return call(() =>
    api.put<WireQuestion[]>(`/jobs/${encodeURIComponent(jobId)}/questions`, {
      body: { questions },
    })
  );
}

export async function getJobTeam(jobId: string): Promise<JobTeamMember[]> {
  return call(() =>
    api.get<WireJobTeamMember[]>(`/jobs/${encodeURIComponent(jobId)}/team`)
  );
}

export async function addJobTeamMembers(
  jobId: string,
  memberIds: string[]
): Promise<JobTeamMember[]> {
  return call(() =>
    api.post<WireJobTeamMember[]>(`/jobs/${encodeURIComponent(jobId)}/team`, {
      body: { memberIds },
    })
  );
}

export async function removeJobTeamMember(
  jobId: string,
  memberId: string
): Promise<JobTeamMember[]> {
  return call(() =>
    api.delete<WireJobTeamMember[]>(
      `/jobs/${encodeURIComponent(jobId)}/team/${encodeURIComponent(memberId)}`
    )
  );
}

export async function updateTeamMemberNotification(
  jobId: string,
  memberId: string,
  notifyOnComplete: boolean
): Promise<JobTeamMember[]> {
  return call(() =>
    api.patch<WireJobTeamMember[]>(
      `/jobs/${encodeURIComponent(jobId)}/team/${encodeURIComponent(memberId)}`,
      { body: { notifyOnComplete } }
    )
  );
}

export async function getInviteReadiness(jobId: string): Promise<{
  jobDetailsReady: boolean;
  questionCount: number;
  teamCount: number;
  brandingReady: boolean;
}> {
  return call(() =>
    api.get<InviteReadiness>(
      `/jobs/${encodeURIComponent(jobId)}/invite-readiness`
    )
  );
}

export async function sendInvites(
  jobId: string,
  invites: { firstName: string; lastName: string; email: string }[]
): Promise<{ sent: number }> {
  const result = await call(() =>
    api.post<BulkInviteResponse>(
      `/jobs/${encodeURIComponent(jobId)}/invitations`,
      { body: { invites }, idempotencyKey: ulid() }
    )
  );
  return { sent: result.invited };
}

export async function bulkInvite(
  jobId: string,
  rows: { firstName: string; lastName: string; email: string }[]
): Promise<BulkInviteResult> {
  return call(() =>
    api.post<BulkInviteResponse>(
      `/jobs/${encodeURIComponent(jobId)}/invitations`,
      { body: { invites: rows }, idempotencyKey: ulid() }
    )
  );
}

export async function generateJobDescription(
  title: string,
  _language: string
): Promise<string> {
  const result = await call(() =>
    api.post<{ description: string }>('/jobs/descriptions:generate', {
      body: { title, language: _language },
    })
  );
  return result.description;
}

export async function generateAiQuestions(
  counts: { video: number; audio: number; text: number; singleChoice: number },
  jobTitle: string,
  jobId?: string
): Promise<Question[]> {
  // Generation is scoped to a job on the wire; the seeded job stands in when a
  // caller has no id yet, so the signature stays backwards compatible.
  const target = jobId ?? 'job_01hxseed';
  return call(() =>
    api.post<WireQuestion[]>(
      `/jobs/${encodeURIComponent(target)}/questions:generate`,
      { body: { jobTitle, counts } }
    )
  );
}

export async function publishJob(jobId: string): Promise<{
  id: string;
  status: JobStatus;
  publishedAt: string;
}> {
  return call(() =>
    api.post<PublishJobResponse>(
      `/jobs/${encodeURIComponent(jobId)}/publish`,
      { idempotencyKey: ulid() }
    )
  );
}

export async function getTemplateQuestions(templateId: string): Promise<Question[]> {
  return call(() =>
    api.get<WireQuestion[]>(
      `/jobs/templates/${encodeURIComponent(templateId)}/questions`
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Everything below is still the in-memory implementation.
//
// The customisation sections (branding, welcome page, form, thank-you, social,
// experience, notifications, AI evaluation, stages, scoring) have not been
// migrated to MSW yet. They are reused verbatim in Workspace settings, so
// moving them is its own change with its own verification.
//
// `delay` exists only for these; the migrated functions above get their latency
// from the mock handlers instead.
// ─────────────────────────────────────────────────────────────────────────────

function delay(ms = 800) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
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
