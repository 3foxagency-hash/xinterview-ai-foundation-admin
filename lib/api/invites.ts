import { getJob } from './jobs';

/**
 * Invite / publish API — Step 5 of the create-job wizard.
 *
 * Same in-memory-store pattern as the rest of lib/api/: state lives in
 * module-level Maps and resets on reload. See the header comment in
 * jobs.ts for why that's deliberate.
 */

export type ApiError = { message: string; code: string };

function err(code: string, message = code): ApiError {
  return { code, message };
}

function delay(ms = 400) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function genId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

// ─── Link settings ───

export type LinkSettings = {
  active: boolean;
  /** ISO date (yyyy-MM-dd). Defaults to the job's application deadline. */
  expiryDate: string;
  limitEnabled: boolean;
  limitCount: number;
  requireEmail: boolean;
};

const linkStore = new Map<string, LinkSettings>();

async function getLinkDefaults(jobId: string): Promise<LinkSettings> {
  const job = await getJob(jobId).catch(() => null);
  return {
    active: false,
    expiryDate: job?.applicationDeadline ?? '',
    limitEnabled: false,
    limitCount: 100,
    requireEmail: true,
  };
}

export async function getLinkSettings(jobId: string): Promise<LinkSettings> {
  await delay(200);
  if (!linkStore.has(jobId)) linkStore.set(jobId, await getLinkDefaults(jobId));
  return { ...linkStore.get(jobId)! };
}

export async function updateLinkSettings(
  jobId: string,
  patch: Partial<LinkSettings>
): Promise<LinkSettings> {
  await delay(350);
  const current = linkStore.get(jobId) ?? (await getLinkDefaults(jobId));
  const next = { ...current, ...patch };
  linkStore.set(jobId, next);
  return { ...next };
}

// ─── Custom fields ───

export type CustomFieldType = 'text' | 'number' | 'date' | 'url';

export type CustomField = {
  id: string;
  label: string;
  type: CustomFieldType;
};

const customFieldStore = new Map<string, CustomField[]>();

export async function getCustomFields(jobId: string): Promise<CustomField[]> {
  await delay(150);
  return customFieldStore.get(jobId) ?? [];
}

export async function createCustomField(
  jobId: string,
  input: { label: string; type: CustomFieldType }
): Promise<CustomField> {
  await delay(300);
  if (!input.label.trim()) throw err('validation_failed', 'A field label is required');
  const field: CustomField = { id: genId('field'), label: input.label.trim(), type: input.type };
  const current = customFieldStore.get(jobId) ?? [];
  customFieldStore.set(jobId, [...current, field]);
  return field;
}

// ─── Invite candidates (email entry, bulk upload and ATS import all land here) ───

export type InviteMethod = 'email' | 'bulk' | 'ats';
export type InviteStatus =
  | 'queued'
  | 'sent'
  | 'opened'
  | 'started'
  | 'completed'
  | 'bounced'
  | 'revoked';

export type InviteCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  method: InviteMethod;
  status: InviteStatus;
  /** Name of the ATS this candidate was imported from, e.g. "Greenhouse". */
  source?: string;
  customFields?: Record<string, string>;
  sentAt?: string;
  lastResendAt?: string;
};

const inviteStore = new Map<string, InviteCandidate[]>();

function getStore(jobId: string): InviteCandidate[] {
  if (!inviteStore.has(jobId)) inviteStore.set(jobId, []);
  return inviteStore.get(jobId)!;
}

export async function getInviteCandidates(jobId: string): Promise<InviteCandidate[]> {
  await delay(250);
  return [...getStore(jobId)];
}

async function isDraft(jobId: string): Promise<boolean> {
  const job = await getJob(jobId).catch(() => null);
  return (job?.status ?? 'draft') === 'draft';
}

export async function addInviteCandidates(
  jobId: string,
  method: InviteMethod,
  rows: { firstName: string; lastName: string; email: string; customFields?: Record<string, string>; source?: string }[]
): Promise<InviteCandidate[]> {
  await delay(400);
  const draft = await isDraft(jobId);
  const additions: InviteCandidate[] = rows.map((r) => ({
    id: genId('inv'),
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    method,
    status: draft ? 'queued' : 'sent',
    customFields: r.customFields,
    source: r.source,
    sentAt: draft ? undefined : new Date().toISOString(),
  }));
  const current = getStore(jobId);
  inviteStore.set(jobId, [...current, ...additions]);
  return additions;
}

export async function removeInviteCandidate(jobId: string, id: string): Promise<void> {
  await delay(250);
  const current = getStore(jobId);
  inviteStore.set(jobId, current.filter((c) => c.id !== id));
}

export async function updateInviteCandidateEmail(
  jobId: string,
  id: string,
  email: string
): Promise<InviteCandidate> {
  await delay(300);
  const current = getStore(jobId);
  const target = current.find((c) => c.id === id);
  if (!target) throw err('not_found', 'Candidate not found');
  // Fixing a bounced address puts it back in line to be (re)sent.
  const updated: InviteCandidate = { ...target, email, status: 'queued' };
  inviteStore.set(
    jobId,
    current.map((c) => (c.id === id ? updated : c))
  );
  return updated;
}

const RESEND_COOLDOWN_MS = 60_000;

export async function resendInvite(jobId: string, id: string): Promise<InviteCandidate> {
  await delay(400);
  const current = getStore(jobId);
  const target = current.find((c) => c.id === id);
  if (!target) throw err('not_found', 'Candidate not found');
  if (target.lastResendAt && Date.now() - new Date(target.lastResendAt).getTime() < RESEND_COOLDOWN_MS) {
    throw err('rate_limited', 'This invite was just resent. Try again shortly.');
  }
  const updated: InviteCandidate = {
    ...target,
    status: 'sent',
    lastResendAt: new Date().toISOString(),
  };
  inviteStore.set(
    jobId,
    current.map((c) => (c.id === id ? updated : c))
  );
  return updated;
}

export async function revokeInvite(jobId: string, id: string): Promise<InviteCandidate> {
  await delay(350);
  const current = getStore(jobId);
  const target = current.find((c) => c.id === id);
  if (!target) throw err('not_found', 'Candidate not found');
  const updated: InviteCandidate = { ...target, status: 'revoked' };
  inviteStore.set(
    jobId,
    current.map((c) => (c.id === id ? updated : c))
  );
  return updated;
}

/** All queued invites send when the job publishes. Returns how many went out. */
export async function sendQueuedInvites(jobId: string): Promise<number> {
  await delay(500);
  const current = getStore(jobId);
  const now = new Date().toISOString();
  let sentCount = 0;
  const next = current.map((c) => {
    if (c.status === 'queued') {
      sentCount++;
      return { ...c, status: 'sent' as InviteStatus, sentAt: now };
    }
    return c;
  });
  inviteStore.set(jobId, next);
  return sentCount;
}

export const RESEND_COOLDOWN_SECONDS = RESEND_COOLDOWN_MS / 1000;

// ─── ATS import ───

export type AtsConnection = {
  connected: boolean;
  name?: string;
};

export type AtsStage = { id: string; name: string };
export type AtsSource = { id: string; name: string; stages: AtsStage[] };
export type AtsCandidate = { id: string; name: string; email: string; stage: string };

const atsStore = new Map<string, AtsConnection>();

const ATS_SOURCES: AtsSource[] = [
  {
    id: 'src_frontend',
    name: 'Frontend Engineer — Greenhouse',
    stages: [
      { id: 'stage_new', name: 'New applicants' },
      { id: 'stage_screen', name: 'Phone screen' },
    ],
  },
  {
    id: 'src_referrals',
    name: 'Employee referrals',
    stages: [{ id: 'stage_ref', name: 'Awaiting review' }],
  },
];

const ATS_CANDIDATES: Record<string, AtsCandidate[]> = {
  stage_new: [
    { id: 'ats_1', name: 'Felix Okonkwo', email: 'felix.okonkwo@example.com', stage: 'New applicants' },
    { id: 'ats_2', name: 'Sana Malik', email: 'sana.malik@example.com', stage: 'New applicants' },
    { id: 'ats_3', name: 'Theo Andersen', email: 'theo.andersen@example.com', stage: 'New applicants' },
  ],
  stage_screen: [
    { id: 'ats_4', name: 'Priya Deshmukh', email: 'priya.deshmukh@example.com', stage: 'Phone screen' },
  ],
  stage_ref: [
    { id: 'ats_5', name: 'Carlos Jimenez', email: 'carlos.jimenez@example.com', stage: 'Awaiting review' },
  ],
};

export async function getAtsConnection(): Promise<AtsConnection> {
  await delay(200);
  return atsStore.get('company') ?? { connected: false };
}

/** Dev-only stand-in for the real OAuth flow this step never runs itself. */
export async function connectAtsForDemo(): Promise<AtsConnection> {
  await delay(500);
  const connection: AtsConnection = { connected: true, name: 'Greenhouse' };
  atsStore.set('company', connection);
  return connection;
}

export async function getAtsSources(): Promise<AtsSource[]> {
  await delay(300);
  return ATS_SOURCES;
}

export async function getAtsCandidates(stageId: string): Promise<AtsCandidate[]> {
  await delay(350);
  return ATS_CANDIDATES[stageId] ?? [];
}
