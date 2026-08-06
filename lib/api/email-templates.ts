/**
 * Email notification templates.
 *
 * Kept separate from the SMS equivalent on purpose: the two will diverge once
 * the real endpoints land, so they do not share a module.
 */

export type ApiError = {
  message: string;
  code: string;
};

function delay(ms = 700) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function err(code: string): ApiError {
  return { code, message: code };
}

export type EmailTemplateId =
  | 'rejection'
  | 'extend_deadline'
  | 'invite_candidate'
  | 'reminder'
  | 'candidate_complete'
  | 'recruiter_complete';

export type EmailTemplate = {
  id: EmailTemplateId;
  name: string;
  description: string;
  /** Who receives it — shown as a badge */
  audience: 'Candidate' | 'Recruiter';
  enabled: boolean;
  subject: string;
  body: string;
};

/** Tokens replaced with real values when the email is sent. */
export const EMAIL_PLACEHOLDERS = [
  '{{ candidate_name }}',
  '{{ job_title }}',
  '{{ user_name }}',
  '{{ user_email }}',
  '{{ company_name }}',
  '{{ company_website }}',
] as const;

const DEFAULTS: EmailTemplate[] = [
  {
    id: 'invite_candidate',
    name: 'Invite candidate',
    description:
      'A formal invitation asking candidates to take part in the interview.',
    audience: 'Candidate',
    enabled: true,
    subject: 'You have been invited to interview for {{ job_title }}',
    body: `<p>Dear {{ candidate_name }},</p><p>You have been invited to complete a one-way interview for the {{ job_title }} position at {{ company_name }}.</p><p>You can complete it whenever suits you — just follow the link below.</p><p>Best regards,<br />{{ user_name }}<br />{{ company_name }}</p>`,
  },
  {
    id: 'reminder',
    name: 'Reminder',
    description:
      'A follow-up reminding candidates of an upcoming date or an unfinished interview.',
    audience: 'Candidate',
    enabled: true,
    subject: 'Reminder: your {{ job_title }} interview',
    body: `<p>Hi {{ candidate_name }},</p><p>This is a friendly reminder to complete your interview for the {{ job_title }} role at {{ company_name }}.</p><p>Best regards,<br />{{ user_name }}</p>`,
  },
  {
    id: 'extend_deadline',
    name: 'Extend deadline',
    description:
      'Tells candidates their application deadline has moved, so they know the new timeline.',
    audience: 'Candidate',
    enabled: true,
    subject: 'Your {{ job_title }} application deadline has been extended',
    body: `<p>Hi {{ candidate_name }},</p><p>Good news — the deadline for the {{ job_title }} position at {{ company_name }} has been extended.</p><p>Best regards,<br />{{ user_name }}</p>`,
  },
  {
    id: 'candidate_complete',
    name: 'Interview complete (candidate)',
    description:
      'Sent to candidates once they finish their interview, with next steps.',
    audience: 'Candidate',
    enabled: true,
    subject: 'Thanks for completing your {{ job_title }} interview',
    body: `<p>Hi {{ candidate_name }},</p><p>Thank you for completing your interview for {{ job_title }} at {{ company_name }}. Our team is reviewing your responses and will be in touch.</p><p>Best regards,<br />{{ user_name }}</p>`,
  },
  {
    id: 'recruiter_complete',
    name: 'Interview complete (recruiter)',
    description:
      'Notifies your team when a candidate finishes, so nobody misses a submission.',
    audience: 'Recruiter',
    enabled: true,
    subject: '{{ candidate_name }} completed their {{ job_title }} interview',
    body: `<p>Hi {{ user_name }},</p><p>{{ candidate_name }} has completed their interview for {{ job_title }}. You can review their responses in {{ company_name }}.</p>`,
  },
  {
    id: 'rejection',
    name: 'Rejection',
    description:
      'Sent automatically when a candidate is moved to the rejected stage.',
    audience: 'Candidate',
    enabled: false,
    subject: 'Update regarding your {{ job_title }} application',
    body: `<p>Dear {{ candidate_name }},</p><p>Thank you for applying for the {{ job_title }} position at {{ company_name }}.</p><p>We carefully reviewed your skills and qualifications and have decided to move forward with another candidate.</p><p>We appreciate the time you invested and encourage you to apply for future openings.</p><p>Best regards,<br />{{ user_name }}<br />{{ company_name }}</p>`,
  },
];

let store: EmailTemplate[] = DEFAULTS.map((t) => ({ ...t }));

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  await delay(500);
  return store.map((t) => ({ ...t }));
}

export async function saveEmailTemplate(
  id: EmailTemplateId,
  patch: Pick<EmailTemplate, 'subject' | 'body'>
): Promise<EmailTemplate> {
  await delay();
  if (!patch.subject.trim()) throw err('email_subject_required');
  if (!patch.body.replace(/<[^>]*>/g, '').trim()) throw err('email_body_required');
  const t = store.find((x) => x.id === id);
  if (!t) throw err('email_template_not_found');
  t.subject = patch.subject;
  t.body = patch.body;
  return { ...t };
}

export async function setEmailTemplateEnabled(
  id: EmailTemplateId,
  enabled: boolean
): Promise<EmailTemplate> {
  await delay(400);
  const t = store.find((x) => x.id === id);
  if (!t) throw err('email_template_not_found');
  t.enabled = enabled;
  return { ...t };
}

export async function resetEmailTemplate(id: EmailTemplateId): Promise<EmailTemplate> {
  await delay();
  const def = DEFAULTS.find((x) => x.id === id);
  const t = store.find((x) => x.id === id);
  if (!def || !t) throw err('email_template_not_found');
  t.subject = def.subject;
  t.body = def.body;
  return { ...t };
}

/** Swaps placeholders for sample values so the preview reads like a real send. */
export function renderEmailPreview(text: string): string {
  return text
    .replace(/\{\{\s*candidate_name\s*\}\}/g, 'Jane Smith')
    .replace(/\{\{\s*job_title\s*\}\}/g, 'Senior Frontend Engineer')
    .replace(/\{\{\s*user_name\s*\}\}/g, 'Sarah Chen')
    .replace(/\{\{\s*user_email\s*\}\}/g, 'sarah.chen@xinterview.ai')
    .replace(/\{\{\s*company_name\s*\}\}/g, 'XInterview')
    .replace(/\{\{\s*company_website\s*\}\}/g, 'https://xinterview.ai');
}

export function _resetEmailTemplateStore() {
  store = DEFAULTS.map((t) => ({ ...t }));
}
