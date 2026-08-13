/**
 * The wire contract, shared by the real client and the mock handlers.
 *
 * Both sides import these types, so a handler that returns the wrong shape
 * fails to compile. When the backend publishes an OpenAPI spec, this file is
 * replaced by the generated types and everything downstream keeps working.
 */

/** Every response is wrapped, single resources included. */
export type Envelope<T> = { data: T };

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PagedEnvelope<T> = { data: T[]; meta: PageMeta };

/**
 * Error envelope. `code` is a stable machine identifier and the thing the UI
 * branches on; `message` is developer-facing English used as a fallback.
 * `requestId` is surfaced in error states so support traces to one log line.
 */
export type ErrorBody = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  requestId: string;
  /** Seconds until a rate-limited caller may retry. */
  retryAfter?: number;
};

// ─── Auth ───

export type UserRole = 'owner' | 'admin' | 'recruiter' | 'interviewer';

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId: string;
  /** IANA timezone, e.g. Europe/Amsterdam. */
  timezone: string;
  locale: string;
  emailVerified: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
  remember?: boolean;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type OtpVerifyRequest = {
  email: string;
  code: string;
  mode: 'signup' | 'reset';
};

export type OtpResendRequest = {
  email: string;
  mode: 'signup' | 'reset';
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
};

export type InviteInfo = {
  slug: string;
  company: string;
  inviter: string;
};

export type CreateWorkspaceRequest = {
  companyName: string;
  companySize: string;
  companyType: string;
  companyWebsite?: string;
};

export type Workspace = {
  id: string;
  name: string;
  size: string;
  type: string;
  website?: string;
};

// ─── Jobs ───

export type JobStatus = 'draft' | 'active';

export type InterviewFormatWire =
  | 'ai_video'
  | 'ai_avatar'
  | 'ai_voice'
  | 'ai_phone';

export type WireJob = {
  id: string;
  orgId: string;
  title: string;
  format: InterviewFormatWire;
  timezone: string;
  /** Calendar-only value: plain YYYY-MM-DD, never timezone-converted. */
  applicationDeadline: string;
  interviewLanguage: string;
  description: string;
  status: JobStatus;
  candidateUrl: string;
  /** UTC ISO 8601 with offset. */
  createdAt: string;
  updatedAt: string;
};

export type CreateJobRequest = {
  title: string;
  format: InterviewFormatWire;
  timezone: string;
  applicationDeadline: string;
  interviewLanguage: string;
  description?: string;
};

export type QuestionTypeWire = 'video' | 'audio' | 'text' | 'single_choice';

export type WireAnswerOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type WireQuestion = {
  id: string;
  type: QuestionTypeWire;
  title: string;
  description: string;
  retakesAllowed?: number;
  thinkingTime?: string;
  answerTime?: string;
  charLimit?: number;
  options?: WireAnswerOption[];
};

export type WireQuestionTemplate = {
  id: string;
  name: string;
  questionCount: number;
};

export type GenerateQuestionsRequest = {
  jobTitle: string;
  counts: {
    video: number;
    audio: number;
    text: number;
    singleChoice: number;
  };
};

export type OrgRole = 'Admin' | 'Manager' | 'Executive' | 'Member';

export type WireOrgMember = {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
  initials: string;
};

export type WireJobTeamMember = WireOrgMember & {
  notifyOnComplete: boolean;
  isCreator: boolean;
};

export type WirePlanInfo = {
  emailNotifications: boolean;
  smsEnabled: boolean;
  candidateLimit: number;
  candidatesUsed: number;
};

export type InviteReadiness = {
  jobDetailsReady: boolean;
  questionCount: number;
  teamCount: number;
  brandingReady: boolean;
};

export type InviteRow = {
  firstName: string;
  lastName: string;
  email: string;
};

export type BulkInviteResponse = {
  invited: number;
  failed: (InviteRow & { reason: string })[];
};

export type PublishJobResponse = {
  id: string;
  status: JobStatus;
  /** UTC ISO 8601. */
  publishedAt: string;
};

/** Stable error codes the jobs UI branches on. */
export const JOB_ERROR = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_ALREADY_PUBLISHED: 'JOB_ALREADY_PUBLISHED',
  JOB_INCOMPLETE: 'JOB_INCOMPLETE',
  CANDIDATE_LIMIT_REACHED: 'CANDIDATE_LIMIT_REACHED',
  STAGE_LOCKED_REMOVED: 'STAGE_LOCKED_REMOVED',
  STAGE_LOCKED_RENAMED: 'STAGE_LOCKED_RENAMED',
  FORMAT_NOT_AVAILABLE: 'FORMAT_NOT_AVAILABLE',
} as const;

export type JobErrorCode = (typeof JOB_ERROR)[keyof typeof JOB_ERROR];

/** Stable error codes the auth UI branches on. */
export const AUTH_ERROR = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_UNVERIFIED: 'EMAIL_UNVERIFIED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  ALREADY_REGISTERED: 'ALREADY_REGISTERED',
  INVALID_OTP: 'INVALID_OTP',
  EXPIRED_OTP: 'EXPIRED_OTP',
  OTP_ATTEMPTS_EXCEEDED: 'OTP_ATTEMPTS_EXCEEDED',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  INVALID_INVITE: 'INVALID_INVITE',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR)[keyof typeof AUTH_ERROR];
