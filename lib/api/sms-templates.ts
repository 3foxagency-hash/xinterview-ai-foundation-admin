/**
 * SMS notification templates.
 *
 * Intentionally a full copy of the email module rather than a shared
 * abstraction — the two APIs will diverge, and SMS already differs: plain text
 * instead of HTML, no subject line, and a segment-based length limit.
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

export type SmsTemplateId =
  | 'rejection'
  | 'extend_deadline'
  | 'invite_candidate'
  | 'reminder'
  | 'candidate_complete'
  | 'recruiter_complete';

export type SmsTemplate = {
  id: SmsTemplateId;
  name: string;
  description: string;
  audience: 'Candidate' | 'Recruiter';
  enabled: boolean;
  /** Plain text — SMS has no subject and no markup */
  body: string;
};

export const SMS_PLACEHOLDERS = [
  '{{ candidate_name }}',
  '{{ job_title }}',
  '{{ user_name }}',
  '{{ company_name }}',
] as const;

/** A single GSM-7 segment; longer messages bill as multiple parts. */
export const SMS_SEGMENT_LENGTH = 160;
export const SMS_MAX_LENGTH = 480;

export function smsSegments(body: string): number {
  return Math.max(1, Math.ceil(body.length / SMS_SEGMENT_LENGTH));
}

const DEFAULTS: SmsTemplate[] = [
  {
    id: 'invite_candidate',
    name: 'Invite candidate',
    description: 'Texts candidates a link to start their interview.',
    audience: 'Candidate',
    enabled: true,
    body: 'Hi {{ candidate_name }}, you have been invited to interview for {{ job_title }} at {{ company_name }}. Start here:',
  },
  {
    id: 'reminder',
    name: 'Reminder',
    description: 'Nudges candidates who have not finished their interview.',
    audience: 'Candidate',
    enabled: true,
    body: 'Hi {{ candidate_name }}, a reminder to finish your {{ job_title }} interview at {{ company_name }}.',
  },
  {
    id: 'extend_deadline',
    name: 'Extend deadline',
    description: 'Tells candidates their deadline has moved.',
    audience: 'Candidate',
    enabled: false,
    body: 'Hi {{ candidate_name }}, your deadline for the {{ job_title }} role at {{ company_name }} has been extended.',
  },
  {
    id: 'candidate_complete',
    name: 'Interview complete (candidate)',
    description: 'Confirms to candidates that their interview came through.',
    audience: 'Candidate',
    enabled: false,
    body: 'Thanks {{ candidate_name }}! We have received your {{ job_title }} interview and will be in touch.',
  },
  {
    id: 'recruiter_complete',
    name: 'Interview complete (recruiter)',
    description: 'Alerts your team the moment a candidate submits.',
    audience: 'Recruiter',
    enabled: false,
    body: '{{ candidate_name }} just completed their {{ job_title }} interview. Review it in {{ company_name }}.',
  },
  {
    id: 'rejection',
    name: 'Rejection',
    description: 'Sent when a candidate is moved to the rejected stage.',
    audience: 'Candidate',
    enabled: false,
    body: 'Hi {{ candidate_name }}, thank you for your interest in {{ job_title }} at {{ company_name }}. We are moving forward with other candidates.',
  },
];

let store: SmsTemplate[] = DEFAULTS.map((t) => ({ ...t }));

export async function getSmsTemplates(): Promise<SmsTemplate[]> {
  await delay(500);
  return store.map((t) => ({ ...t }));
}

export async function saveSmsTemplate(
  id: SmsTemplateId,
  patch: Pick<SmsTemplate, 'body'>
): Promise<SmsTemplate> {
  await delay();
  if (!patch.body.trim()) throw err('sms_body_required');
  if (patch.body.length > SMS_MAX_LENGTH) throw err('sms_body_too_long');
  const t = store.find((x) => x.id === id);
  if (!t) throw err('sms_template_not_found');
  t.body = patch.body;
  return { ...t };
}

export async function setSmsTemplateEnabled(
  id: SmsTemplateId,
  enabled: boolean
): Promise<SmsTemplate> {
  await delay(400);
  const t = store.find((x) => x.id === id);
  if (!t) throw err('sms_template_not_found');
  t.enabled = enabled;
  return { ...t };
}

export async function resetSmsTemplate(id: SmsTemplateId): Promise<SmsTemplate> {
  await delay();
  const def = DEFAULTS.find((x) => x.id === id);
  const t = store.find((x) => x.id === id);
  if (!def || !t) throw err('sms_template_not_found');
  t.body = def.body;
  return { ...t };
}

export function renderSmsPreview(text: string): string {
  return text
    .replace(/\{\{\s*candidate_name\s*\}\}/g, 'Jane Smith')
    .replace(/\{\{\s*job_title\s*\}\}/g, 'Senior Frontend Engineer')
    .replace(/\{\{\s*user_name\s*\}\}/g, 'Sarah Chen')
    .replace(/\{\{\s*company_name\s*\}\}/g, 'XInterview');
}

export function _resetSmsTemplateStore() {
  store = DEFAULTS.map((t) => ({ ...t }));
}
