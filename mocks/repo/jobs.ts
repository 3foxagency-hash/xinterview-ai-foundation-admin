import {
  db,
  QUESTION_TEMPLATES,
  type MockJob,
  type MockQuestion,
} from '../db';
import {
  applyFilters,
  applySearch,
  applySort,
  paginate,
  type ListQuery,
} from './query';
import type {
  WireJob,
  WireQuestion,
  WireOrgMember,
  WireJobTeamMember,
  WirePlanInfo,
  WireQuestionTemplate,
  CreateJobRequest,
  InviteReadiness,
  InviteRow,
  BulkInviteResponse,
} from '@/lib/api/contract';

/**
 * Jobs repository.
 *
 * Every function takes `orgId` FIRST. Tenant scoping is therefore structural —
 * you cannot forget it, because it will not compile. That matters more here than
 * anywhere else: a mock layer that ignores organisations happily hides the exact
 * cross-tenant leak that is the worst bug this product can ship.
 *
 * Handlers never reach past this module into the store.
 */

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toWire(job: MockJob): WireJob {
  return { ...job };
}

export const jobsRepo = {
  list(orgId: string, query: ListQuery) {
    const all = [...db().jobs.values()].filter((j) => j.orgId === orgId);
    const searched = applySearch(all, query.q, ['title']);
    const filtered = applyFilters(searched, query.filters, ['status', 'format']);
    const sorted = applySort(
      filtered,
      query.sort.length > 0
        ? query.sort
        : [{ field: 'createdAt', direction: 'desc' }]
    );
    const page = paginate(sorted, query.page, query.pageSize);
    return { data: page.data.map(toWire), meta: page.meta };
  },

  byId(orgId: string, jobId: string): WireJob | undefined {
    const job = db().jobs.get(jobId);
    // The orgId check is the point of taking it first: a job from another
    // tenant must read as missing, not as forbidden.
    if (!job || job.orgId !== orgId) return undefined;
    return toWire(job);
  },

  create(orgId: string, input: CreateJobRequest, creatorMemberId: string): WireJob {
    const jobId = id('job');
    const timestamp = nowIso();
    const job: MockJob = {
      id: jobId,
      orgId,
      title: input.title,
      format: input.format,
      timezone: input.timezone,
      applicationDeadline: input.applicationDeadline,
      interviewLanguage: input.interviewLanguage,
      description: input.description ?? '',
      status: 'draft',
      candidateUrl: `https://xinterview.ai/interview/${jobId}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const store = db();
    store.jobs.set(jobId, job);
    store.questions.set(jobId, []);
    store.invites.set(jobId, []);
    // The creator is on the team from the start and cannot be removed.
    store.teams.set(jobId, [
      { memberId: creatorMemberId, notifyOnComplete: true, isCreator: true },
    ]);

    return toWire(job);
  },

  update(
    orgId: string,
    jobId: string,
    patch: Partial<CreateJobRequest & { status: MockJob['status'] }>
  ): WireJob | undefined {
    const store = db();
    const job = store.jobs.get(jobId);
    if (!job || job.orgId !== orgId) return undefined;

    // Format is immutable after creation — the UI states this ("You can't
    // change this after the job is created"), so the mock enforces it rather
    // than letting a stray patch through.
    const { format: _ignored, ...allowed } = patch;

    const updated: MockJob = { ...job, ...allowed, updatedAt: nowIso() };
    store.jobs.set(jobId, updated);
    return toWire(updated);
  },

  publish(
    orgId: string,
    jobId: string
  ):
    | { ok: true; job: MockJob }
    | { ok: false; reason: 'not_found' | 'already_published' | 'no_questions' } {
    const store = db();
    const job = store.jobs.get(jobId);

    // The orgId check is why it comes first: another tenant's job must read as
    // missing, never as forbidden — a 403 would confirm the job exists.
    if (!job || job.orgId !== orgId) return { ok: false, reason: 'not_found' };
    if (job.status === 'active') return { ok: false, reason: 'already_published' };

    const questions = store.questions.get(jobId) ?? [];
    if (questions.length === 0) return { ok: false, reason: 'no_questions' };

    const published: MockJob = {
      ...job,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    store.jobs.set(jobId, published);
    return { ok: true, job: published };
  },

  // ─── Questions ───

  questions(orgId: string, jobId: string): WireQuestion[] | undefined {
    if (!jobsRepo.byId(orgId, jobId)) return undefined;
    return [...(db().questions.get(jobId) ?? [])];
  },

  saveQuestions(
    orgId: string,
    jobId: string,
    questions: WireQuestion[]
  ): WireQuestion[] | undefined {
    if (!jobsRepo.byId(orgId, jobId)) return undefined;
    const store = db();
    store.questions.set(jobId, questions.map((q) => ({ ...q }) as MockQuestion));
    // Saving questions is a real edit to the job.
    const job = store.jobs.get(jobId);
    if (job) store.jobs.set(jobId, { ...job, updatedAt: nowIso() });
    return [...(store.questions.get(jobId) ?? [])];
  },

  templates(_orgId: string): WireQuestionTemplate[] {
    return QUESTION_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      questionCount: t.questions.length,
    }));
  },

  /**
   * Template questions get fresh ids, so editing them inside a job never
   * mutates the shared template.
   */
  templateQuestions(_orgId: string, templateId: string): WireQuestion[] | undefined {
    const template = QUESTION_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return undefined;
    return template.questions.map((q) => ({
      ...q,
      id: id('q'),
      options: q.options?.map((o) => ({ ...o, id: id('opt') })),
    }));
  },

  // ─── Team ───

  members(orgId: string): WireOrgMember[] {
    return [...db().members.values()]
      .filter((m) => m.orgId === orgId)
      // Only these roles can be assigned to a job team.
      .filter((m) => m.role === 'Admin' || m.role === 'Manager' || m.role === 'Executive')
      .map(({ orgId: _o, ...rest }) => rest);
  },

  team(orgId: string, jobId: string): WireJobTeamMember[] | undefined {
    if (!jobsRepo.byId(orgId, jobId)) return undefined;
    const store = db();
    const roster = store.teams.get(jobId) ?? [];
    return roster.flatMap((entry) => {
      const member = store.members.get(entry.memberId);
      if (!member || member.orgId !== orgId) return [];
      const { orgId: _o, ...rest } = member;
      return [
        {
          ...rest,
          notifyOnComplete: entry.notifyOnComplete,
          isCreator: entry.isCreator,
        },
      ];
    });
  },

  addTeamMembers(
    orgId: string,
    jobId: string,
    memberIds: string[]
  ): WireJobTeamMember[] | undefined {
    if (!jobsRepo.byId(orgId, jobId)) return undefined;
    const store = db();
    const roster = store.teams.get(jobId) ?? [];
    const existing = new Set(roster.map((r) => r.memberId));

    for (const memberId of memberIds) {
      const member = store.members.get(memberId);
      // Silently skip unknown members and cross-tenant ids rather than
      // half-applying the batch.
      if (!member || member.orgId !== orgId || existing.has(memberId)) continue;
      roster.push({ memberId, notifyOnComplete: false, isCreator: false });
      existing.add(memberId);
    }

    store.teams.set(jobId, roster);
    return jobsRepo.team(orgId, jobId);
  },

  removeTeamMember(
    orgId: string,
    jobId: string,
    memberId: string
  ): WireJobTeamMember[] | undefined {
    if (!jobsRepo.byId(orgId, jobId)) return undefined;
    const store = db();
    const roster = store.teams.get(jobId) ?? [];
    // The creator stays. Enforced here rather than only in the UI, so the
    // invariant holds however the request arrives.
    store.teams.set(
      jobId,
      roster.filter((r) => r.memberId !== memberId || r.isCreator)
    );
    return jobsRepo.team(orgId, jobId);
  },

  setTeamNotification(
    orgId: string,
    jobId: string,
    memberId: string,
    notifyOnComplete: boolean
  ): WireJobTeamMember[] | undefined {
    if (!jobsRepo.byId(orgId, jobId)) return undefined;
    const store = db();
    const roster = store.teams.get(jobId) ?? [];
    store.teams.set(
      jobId,
      roster.map((r) => (r.memberId === memberId ? { ...r, notifyOnComplete } : r))
    );
    return jobsRepo.team(orgId, jobId);
  },

  // ─── Plan & invitations ───

  plan(orgId: string): WirePlanInfo {
    const plan = db().plans.get(orgId);
    return {
      emailNotifications: plan?.emailNotifications ?? true,
      smsEnabled: plan?.smsEnabled ?? false,
      candidateLimit: plan?.candidateLimit ?? 100,
      candidatesUsed: plan?.candidatesUsed ?? 0,
    };
  },

  readiness(orgId: string, jobId: string): InviteReadiness | undefined {
    const job = jobsRepo.byId(orgId, jobId);
    if (!job) return undefined;
    const store = db();
    return {
      jobDetailsReady: Boolean(job.title),
      questionCount: (store.questions.get(jobId) ?? []).length,
      teamCount: (store.teams.get(jobId) ?? []).length,
      brandingReady: false,
    };
  },

  /**
   * Validates a batch of invitations and reports per-row failures.
   *
   * Returning partial success rather than rejecting the whole upload is what
   * the bulk-invite screen is built around — one bad row in a CSV of 200 must
   * not discard the other 199.
   */
  invite(
    orgId: string,
    jobId: string,
    rows: InviteRow[]
  ): BulkInviteResponse | undefined {
    if (!jobsRepo.byId(orgId, jobId)) return undefined;

    const store = db();
    const existing = store.invites.get(jobId) ?? [];
    const existingEmails = new Set(existing.map((e) => e.email.toLowerCase()));
    const seen = new Set<string>();

    const accepted: InviteRow[] = [];
    const failed: BulkInviteResponse['failed'] = [];

    for (const row of rows) {
      const email = row.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        failed.push({ ...row, reason: 'Invalid email address' });
      } else if (seen.has(email)) {
        failed.push({ ...row, reason: 'Duplicate in this upload' });
      } else if (existingEmails.has(email)) {
        failed.push({ ...row, reason: 'Already invited' });
      } else {
        accepted.push(row);
        seen.add(email);
      }
    }

    // Respect the plan cap: accept up to the remaining allowance and report the
    // rest as failures, so the UI can show exactly which candidates were left.
    const plan = jobsRepo.plan(orgId);
    const remaining = Math.max(0, plan.candidateLimit - plan.candidatesUsed);
    const within = accepted.slice(0, remaining);
    for (const row of accepted.slice(remaining)) {
      failed.push({ ...row, reason: 'Candidate limit reached on your plan' });
    }

    const timestamp = nowIso();
    store.invites.set(jobId, [
      ...existing,
      ...within.map((r) => ({ ...r, invitedAt: timestamp })),
    ]);

    const planRecord = store.plans.get(orgId);
    if (planRecord) {
      store.plans.set(orgId, {
        ...planRecord,
        candidatesUsed: planRecord.candidatesUsed + within.length,
      });
    }

    return { invited: within.length, failed };
  },
};

// ─── AI generation ───
// Deterministic rather than random: a wizard that produces different questions
// on every run cannot be screenshot-tested or reasoned about.

export function generateDescription(title: string): string {
  return (
    `<h2>About the role</h2><p>We are looking for a ${title} to join our growing team. ` +
    `In this role, you will collaborate closely with cross-functional partners to deliver ` +
    `impactful work.</p><h3>Responsibilities</h3><ul><li>Lead and own key projects ` +
    `end-to-end</li><li>Collaborate with stakeholders to define priorities</li><li>Drive ` +
    `quality and continuous improvement</li></ul><h3>Requirements</h3><ul><li>Proven ` +
    `experience in a similar role</li><li>Strong communication and problem-solving ` +
    `skills</li><li>Bachelor's degree or equivalent experience</li></ul>`
  );
}

export function generateQuestions(counts: {
  video: number;
  audio: number;
  text: number;
  singleChoice: number;
}): WireQuestion[] {
  const out: WireQuestion[] = [];
  let n = 0;

  for (let i = 0; i < counts.video; i++) {
    n++;
    out.push({
      id: id('q'),
      type: 'video',
      title: `Video question ${n}: Tell us about your experience relevant to this role.`,
      description: 'Record a 2-minute response covering your background and key achievements.',
      retakesAllowed: 2,
      thinkingTime: '30s',
      answerTime: '2min',
    });
  }
  for (let i = 0; i < counts.audio; i++) {
    n++;
    out.push({
      id: id('q'),
      type: 'audio',
      title: `Audio question ${n}: Describe a challenge you overcame and what you learned.`,
      description: 'Record an audio response of up to 2 minutes.',
      retakesAllowed: 1,
      thinkingTime: '15s',
      answerTime: '2min',
    });
  }
  for (let i = 0; i < counts.text; i++) {
    n++;
    out.push({
      id: id('q'),
      type: 'text',
      title: `Text question ${n}: What attracts you to this position?`,
      description: 'Write your answer in up to 500 characters.',
      answerTime: '5min',
      charLimit: 500,
    });
  }
  for (let i = 0; i < counts.singleChoice; i++) {
    n++;
    out.push({
      id: id('q'),
      type: 'single_choice',
      title: `Choice question ${n}: Which methodology do you prefer for managing projects?`,
      description: 'Select the single best answer.',
      options: [
        { id: id('opt'), text: 'Agile / Scrum', isCorrect: true },
        { id: id('opt'), text: 'Waterfall', isCorrect: false },
        { id: id('opt'), text: 'Kanban', isCorrect: false },
      ],
    });
  }

  return out;
}
