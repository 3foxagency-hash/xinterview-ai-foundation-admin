import { z } from 'zod';
import { emailSchema } from '@/lib/validation/auth';

// ─── Interview formats ───
export const INTERVIEW_FORMATS = ['ai_video', 'ai_avatar', 'ai_voice', 'ai_phone', 'text'] as const;
export type InterviewFormat = (typeof INTERVIEW_FORMATS)[number];

export const interviewFormatSchema = z.enum(INTERVIEW_FORMATS);

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const LOCATION_TYPES = ['on_site', 'hybrid', 'remote'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export const experienceLevelSchema = z.enum(EXPERIENCE_LEVELS);
export const locationTypeSchema = z.enum(LOCATION_TYPES);

// ─── Step 1: Job setup ───
export const jobSetupSchema = z
  .object({
    format: interviewFormatSchema,
    title: z
      .string()
      .min(2, 'Enter a job title.')
      .max(120, 'Job title must be 120 characters or fewer'),
    department: z.string().max(80).default(''),
    employmentType: employmentTypeSchema.optional(),
    experienceLevel: experienceLevelSchema.optional(),
    locationType: locationTypeSchema.default('remote'),
    location: z.string().max(120).default(''),
    interviewDuration: z.string().default('30'),
    timezone: z.string().min(1, 'Select a timezone.'),
    applicationDeadline: z.string().min(1, 'Choose an application deadline.'),
    interviewLanguage: z.string().min(1, 'Select an interview language.'),
    availabilityWindowStart: z.string().default(''),
    availabilityWindowEnd: z.string().default(''),
    breakBetweenInterviews: z.string().default(''),
    description: z.string().default(''),
  })
  .superRefine((data, ctx) => {
    if (
      (data.locationType === 'on_site' || data.locationType === 'hybrid') &&
      !data.location?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location'],
        message: 'Add a location, or set this role to Remote.',
      });
    }
    if (data.applicationDeadline) {
      const date = new Date(data.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['applicationDeadline'],
          message: 'Pick a date in the future.',
        });
      }
    }
  });
export type JobSetupInput = z.infer<typeof jobSetupSchema>;

// ─── Step 2: Questions ───
export const QUESTION_TYPES = ['video', 'audio', 'text', 'single_choice'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const questionTypeSchema = z.enum(QUESTION_TYPES);

export const answerOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  title: z
    .string()
    .min(2, 'Question title must be at least 2 characters')
    .max(180, 'Question title must be 180 characters or fewer'),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or fewer')
    .optional()
    .default(''),
  retakesAllowed: z.number().min(0).max(3).optional(),
  thinkingTime: z.string().optional(),
  answerTime: z.string().optional(),
  charLimit: z.number().min(50).max(5000).optional(),
  options: z.array(answerOptionSchema).optional(),
});

export const questionsSchema = z
  .array(questionSchema)
  .min(1, 'At least one question is required');

export type Question = z.infer<typeof questionSchema>;
export type AnswerOption = z.infer<typeof answerOptionSchema>;

// ─── Step 5: Invites ───
export const inviteRowSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
});
export type InviteRow = z.infer<typeof inviteRowSchema>;

export const invitesSchema = z.array(inviteRowSchema);

// ─── AI generation ───
export const aiQuestionGenSchema = z
  .object({
    video: z.number().min(0).max(10),
    audio: z.number().min(0).max(10),
    text: z.number().min(0).max(10),
    singleChoice: z.number().min(0).max(10),
  })
  .refine(
    (data) => data.video + data.audio + data.text + data.singleChoice > 0,
    'Select at least one question to generate'
  )
  .refine(
    (data) => data.video + data.audio + data.text + data.singleChoice <= 10,
    'Maximum 10 questions per generation'
  );

export type AiQuestionGenInput = z.infer<typeof aiQuestionGenSchema>;

// ─── Step 4: Customisation — Branding ───
export const brandingSchema = z.object({
  /** Shown beside the logo on candidate-facing pages. */
  companyTitle: z.string().max(60, 'Company title must be 60 characters or fewer').default(''),
  logoUrl: z.string().default(''),
  primaryColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex colour').default('#5B4FE9'),
  /** Used for headings and accents beside the primary button colour. */
  secondaryColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex colour').default('#1F242E'),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  font: z.enum(['inter', 'roboto', 'opendyslexic', 'lato', 'poppins', 'sourcesans']).default('inter'),
  modernInterface: z.boolean().default(false),
});
export type BrandingInput = z.infer<typeof brandingSchema>;

// ─── Customisation — Welcome page ───
export const welcomePageSchema = z.object({
  headline: z.string().min(1, 'Headline is required').max(50, 'Headline must be 50 characters or fewer'),
  subtitle: z.string().max(150, 'Subtitle must be 150 characters or fewer').default(''),
  estimatedTime: z.number().min(1, 'Must be at least 1 minute').max(120, 'Must be 120 minutes or fewer'),
  introVideoEnabled: z.boolean().default(false),
  introVideoUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  introNoteEnabled: z.boolean().default(false),
  introNoteTitle: z.string().max(100).default(''),
  introNoteBody: z.string().default(''),
});
export type WelcomePageInput = z.infer<typeof welcomePageSchema>;

// ─── Customisation — Form settings ───
export const fieldRequirementSchema = z.enum(['off', 'optional', 'required']);
export type FieldRequirement = z.infer<typeof fieldRequirementSchema>;

export const formSettingsSchema = z.object({
  firstName: fieldRequirementSchema.default('required'),
  lastName: fieldRequirementSchema.default('required'),
  email: fieldRequirementSchema.default('required'),
  phone: fieldRequirementSchema.default('optional'),
  resume: fieldRequirementSchema.default('optional'),
  linkedin: fieldRequirementSchema.default('off'),
  portfolio: fieldRequirementSchema.default('off'),
  privacyPolicyEnabled: z.boolean().default(false),
  privacyPolicyUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  termsEnabled: z.boolean().default(false),
  termsUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});
export type FormSettingsInput = z.infer<typeof formSettingsSchema>;

// ─── Customisation — Thank you page ───
export const thankYouPageSchema = z.object({
  title: z.string().max(50, 'Title must be 50 characters or fewer').default('Interview Complete'),
  completionMessage: z.string().default(''),
  redirectEnabled: z.boolean().default(false),
  redirectUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  redirectDelay: z.number().min(0).max(30).default(5),
});
export type ThankYouPageInput = z.infer<typeof thankYouPageSchema>;

// ─── Customisation — Social preview ───
/** Limits match the live product, which mirrors search-engine truncation. */
export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 160;

export const socialPreviewSchema = z.object({
  faviconUrl: z.string().default(''),
  shareImageUrl: z.string().default(''),
  previewTitle: z.string().max(META_TITLE_MAX).default(''),
  previewDescription: z.string().max(META_DESCRIPTION_MAX).default(''),
});
export type SocialPreviewInput = z.infer<typeof socialPreviewSchema>;

// ─── Customisation — Interview experience ───
export const interviewExperienceSchema = z.object({
  tabSwitchDetection: z.boolean().default(true),
  disableCopyPaste: z.boolean().default(true),
  enforceFullScreen: z.boolean().default(false),
  candidateInstructions: z.string().default(''),
});
export type InterviewExperienceInput = z.infer<typeof interviewExperienceSchema>;

// ─── Customisation — Emails & notifications ───
export const channelSettingsSchema = z.object({
  notifyOnCompletion: z.boolean().default(true),
  remindAfterDays: z.boolean().default(false),
  remindDays: z.number().min(1).max(30).default(3),
  rejectionMessageEnabled: z.boolean().default(false),
  rejectionMessage: z.string().default(''),
});
export type ChannelSettings = z.infer<typeof channelSettingsSchema>;

export const notificationsSchema = z.object({
  email: channelSettingsSchema,
  sms: channelSettingsSchema,
});
export type NotificationsInput = z.infer<typeof notificationsSchema>;

// ─── Customisation — AI evaluation ───
export const rubricLevelSchema = z.object({
  level: z.number().min(1).max(5),
  description: z.string().min(1, 'Each rubric level needs a description'),
});
export type RubricLevel = z.infer<typeof rubricLevelSchema>;

export const evaluationFactorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Factor name is required').max(60),
  description: z.string().max(200).default(''),
  keywords: z.array(z.string()).default([]),
  weight: z.number().min(0).max(100),
  rubric: z.array(rubricLevelSchema).length(5),
});
export type EvaluationFactor = z.infer<typeof evaluationFactorSchema>;

export const questionScoringSchema = z.object({
  questionId: z.string(),
  factorIds: z.array(z.string()).default([]),
  excludedFromScoring: z.boolean().default(false),
});
export type QuestionScoring = z.infer<typeof questionScoringSchema>;

export const aiEvaluationSchema = z.object({
  positionLevel: z.enum(['entry', 'mid', 'senior', 'executive']).default('mid'),
  strictness: z.enum(['lenient', 'moderate', 'strict']).default('moderate'),
  automaticEvaluation: z.boolean().default(false),
  factors: z.array(evaluationFactorSchema).max(4),
  questionScoring: z.array(questionScoringSchema),
});
export type AiEvaluationInput = z.infer<typeof aiEvaluationSchema>;

// ─── Customisation — Scoring labels ───
/**
 * Pipeline stages.
 *
 * Four stage names are fixed because the product keys behaviour off them —
 * `invited`, `in progress`, `review` and `rejected` are set by the system as a
 * candidate moves through an interview, so renaming or removing them would
 * break that wiring. This mirrors the live product, which disables those four
 * inputs and offers no delete or drag handle on them.
 */
export const LOCKED_STAGE_NAMES = ['Invited', 'In progress', 'Review', 'Rejected'] as const;

export const stageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Stage name is required').max(30, 'Keep stage names under 30 characters'),
  /** System stages cannot be renamed, reordered or deleted. */
  locked: z.boolean().default(false),
});
export type Stage = z.infer<typeof stageSchema>;

export const stagesSchema = z.object({
  stages: z.array(stageSchema).min(1),
});
export type StagesInput = z.infer<typeof stagesSchema>;

export const scoringBandSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Band name is required').max(30),
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
  colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
export type ScoringBand = z.infer<typeof scoringBandSchema>;

export const scoringLabelsSchema = z.object({
  bands: z.array(scoringBandSchema).min(2).max(5),
});
export type ScoringLabelsInput = z.infer<typeof scoringLabelsSchema>;
