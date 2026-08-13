import { http, HttpResponse, delay } from 'msw';
import { jobsRepo, generateDescription, generateQuestions } from '../repo/jobs';
import { parseListQuery } from '../repo/query';
import { currentOrgId, currentMemberId } from '../repo/session';
import { idempotency } from '../repo/idempotency';
import { applyScenario, isEmptyScenario } from './scenario';
import { ok, created, fail, validationFailed, latency } from '../repo/respond';
import { JOB_ERROR } from '@/lib/api/contract';
import type {
  CreateJobRequest,
  WireQuestion,
  GenerateQuestionsRequest,
  InviteRow,
} from '@/lib/api/contract';

/**
 * Jobs handlers — the create-job wizard flow.
 *
 * Every handler resolves `orgId` from the request and passes it to the repo
 * first, so a job belonging to another tenant reads as missing rather than
 * leaking. Handlers implement real request logic (validation, pagination,
 * immutable format, plan caps, idempotency replay) because a handler that
 * returns one fixture regardless of input teaches the UI nothing and hides
 * every failure path until integration.
 */

const jobNotFound = () =>
  fail(404, JOB_ERROR.JOB_NOT_FOUND, 'That job does not exist or was removed.');

const VALID_FORMATS = ['ai_video', 'ai_avatar', 'ai_voice', 'ai_phone'];
/** Only AI video is enabled on the seeded plan; the rest are gated in the UI. */
const AVAILABLE_FORMATS = ['ai_video'];

export const jobHandlers = [
  // ─── GET /jobs — paginated list ───
  http.get('*/api/v1/jobs', async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const orgId = currentOrgId(request);
    const query = parseListQuery(new URL(request.url));

    if (isEmptyScenario()) {
      return HttpResponse.json({
        data: [],
        meta: { page: 1, pageSize: query.pageSize, total: 0, totalPages: 1 },
      });
    }

    // Returns the full envelope (data + meta), not just data.
    return HttpResponse.json(jobsRepo.list(orgId, query));
  }),

  // ─── POST /jobs/descriptions:generate ───
  // Registered before /jobs/:id so the literal path wins over the parameter.
  http.post('*/api/v1/jobs/descriptions:generate', async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as { title?: string };
    if (!body.title || body.title.trim().length < 2) {
      return validationFailed({ title: 'A job title is required' });
    }

    // AI generation is slow in reality; a fast mock hides the loading state.
    await delay(1200);
    return ok({ description: generateDescription(body.title.trim()) });
  }),

  // ─── GET /jobs/templates ───
  http.get('*/api/v1/jobs/templates', async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;
    return ok(jobsRepo.templates(currentOrgId(request)));
  }),

  // ─── GET /jobs/templates/:templateId/questions ───
  http.get('*/api/v1/jobs/templates/:templateId/questions', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const questions = jobsRepo.templateQuestions(
      currentOrgId(request),
      String(params.templateId)
    );
    if (!questions) return fail(404, 'TEMPLATE_NOT_FOUND', 'That template does not exist.');
    return ok(questions);
  }),

  // ─── POST /jobs — create ───
  http.post('*/api/v1/jobs', async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const orgId = currentOrgId(request);
    const key = request.headers.get('Idempotency-Key');

    // A repeat within the window returns the original response, not a second
    // job. This is what makes a double-submitted wizard safe.
    if (idempotency.has(orgId, key)) return idempotency.replay(orgId, key!);

    const body = (await request.json()) as CreateJobRequest;

    const fieldErrors: Record<string, string> = {};
    if (!body.title || body.title.trim().length < 2) {
      fieldErrors.title = 'Job position must be at least 2 characters';
    }
    if (!body.format) fieldErrors.format = 'Select an interview format';
    else if (!VALID_FORMATS.includes(body.format)) {
      fieldErrors.format = 'Unknown interview format';
    }
    if (!body.timezone) fieldErrors.timezone = 'Select a timezone';
    if (!body.applicationDeadline) {
      fieldErrors.applicationDeadline = 'Pick an application deadline';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(body.applicationDeadline)) {
      // Calendar-only value: a datetime here means the client converted a zone.
      fieldErrors.applicationDeadline = 'Deadline must be a plain YYYY-MM-DD date';
    }
    if (!body.interviewLanguage) {
      fieldErrors.interviewLanguage = 'Select an interview language';
    }
    if (Object.keys(fieldErrors).length > 0) return validationFailed(fieldErrors);

    if (!AVAILABLE_FORMATS.includes(body.format)) {
      return fail(
        403,
        JOB_ERROR.FORMAT_NOT_AVAILABLE,
        'That interview format is not available on your current plan.'
      );
    }

    const job = jobsRepo.create(orgId, body, currentMemberId(request));
    return idempotency.store(orgId, key, created(job));
  }),

  // ─── GET /jobs/:jobId ───
  http.get('*/api/v1/jobs/:jobId', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const job = jobsRepo.byId(currentOrgId(request), String(params.jobId));
    if (!job) return jobNotFound();
    return ok(job);
  }),

  // ─── PATCH /jobs/:jobId ───
  http.patch('*/api/v1/jobs/:jobId', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as Partial<CreateJobRequest>;

    if (body.title !== undefined && body.title.trim().length < 2) {
      return validationFailed({ title: 'Job position must be at least 2 characters' });
    }
    if (
      body.applicationDeadline !== undefined &&
      body.applicationDeadline !== '' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(body.applicationDeadline)
    ) {
      return validationFailed({
        applicationDeadline: 'Deadline must be a plain YYYY-MM-DD date',
      });
    }

    const job = jobsRepo.update(
      currentOrgId(request),
      String(params.jobId),
      body
    );
    if (!job) return jobNotFound();
    return ok(job);
  }),

  // ─── POST /jobs/:jobId/publish ───
  // Publishing emails candidates, so it carries an Idempotency-Key.
  http.post('*/api/v1/jobs/:jobId/publish', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const orgId = currentOrgId(request);
    const key = request.headers.get('Idempotency-Key');
    if (idempotency.has(orgId, key)) return idempotency.replay(orgId, key!);

    const result = jobsRepo.publish(orgId, String(params.jobId));

    if (!result.ok) {
      switch (result.reason) {
        case 'not_found':
          return jobNotFound();
        case 'already_published':
          return fail(
            409,
            JOB_ERROR.JOB_ALREADY_PUBLISHED,
            'This job is already published.'
          );
        case 'no_questions':
          return validationFailed(
            { questions: 'Add at least one question before publishing' },
            'This job is not ready to publish'
          );
      }
    }

    return idempotency.store(
      orgId,
      key,
      ok({
        id: result.job.id,
        status: result.job.status,
        publishedAt: result.job.updatedAt,
      })
    );
  }),

  // ─── GET /jobs/:jobId/questions ───
  http.get('*/api/v1/jobs/:jobId/questions', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const questions = jobsRepo.questions(
      currentOrgId(request),
      String(params.jobId)
    );
    if (!questions) return jobNotFound();
    return ok(isEmptyScenario() ? [] : questions);
  }),

  // ─── PUT /jobs/:jobId/questions ───
  http.put('*/api/v1/jobs/:jobId/questions', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as { questions: WireQuestion[] };
    if (!Array.isArray(body.questions)) {
      return validationFailed({ questions: 'Expected a list of questions' });
    }

    // Every question needs a title; the UI flags these per-question, so the
    // mock reports which index failed rather than a single global message.
    const untitled = body.questions.findIndex((q) => !q.title?.trim());
    if (untitled !== -1) {
      return validationFailed(
        { [`questions.${untitled}.title`]: 'A question title is required' },
        'Every question needs a title'
      );
    }

    const saved = jobsRepo.saveQuestions(
      currentOrgId(request),
      String(params.jobId),
      body.questions
    );
    if (!saved) return jobNotFound();
    return ok(saved);
  }),

  // ─── POST /jobs/:jobId/questions:generate ───
  http.post('*/api/v1/jobs/:jobId/questions:generate', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const orgId = currentOrgId(request);
    if (!jobsRepo.byId(orgId, String(params.jobId))) return jobNotFound();

    const body = (await request.json()) as GenerateQuestionsRequest;
    const counts = body.counts ?? { video: 0, audio: 0, text: 0, singleChoice: 0 };
    const total =
      counts.video + counts.audio + counts.text + counts.singleChoice;

    if (total < 1) {
      return validationFailed({ counts: 'Ask for at least one question' });
    }
    if (total > 20) {
      return validationFailed({ counts: 'You can generate at most 20 questions at once' });
    }

    await delay(1400);
    return ok(generateQuestions(counts));
  }),

  // ─── GET /jobs/:jobId/team ───
  http.get('*/api/v1/jobs/:jobId/team', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const team = jobsRepo.team(currentOrgId(request), String(params.jobId));
    if (!team) return jobNotFound();
    return ok(team);
  }),

  // ─── POST /jobs/:jobId/team ───
  http.post('*/api/v1/jobs/:jobId/team', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as { memberIds: string[] };
    if (!Array.isArray(body.memberIds) || body.memberIds.length === 0) {
      return validationFailed({ memberIds: 'Select at least one team member' });
    }

    const team = jobsRepo.addTeamMembers(
      currentOrgId(request),
      String(params.jobId),
      body.memberIds
    );
    if (!team) return jobNotFound();
    return ok(team);
  }),

  // ─── DELETE /jobs/:jobId/team/:memberId ───
  http.delete('*/api/v1/jobs/:jobId/team/:memberId', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const team = jobsRepo.removeTeamMember(
      currentOrgId(request),
      String(params.jobId),
      String(params.memberId)
    );
    if (!team) return jobNotFound();
    return ok(team);
  }),

  // ─── PATCH /jobs/:jobId/team/:memberId ───
  http.patch('*/api/v1/jobs/:jobId/team/:memberId', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as { notifyOnComplete: boolean };
    if (typeof body.notifyOnComplete !== 'boolean') {
      return validationFailed({ notifyOnComplete: 'Expected true or false' });
    }

    const team = jobsRepo.setTeamNotification(
      currentOrgId(request),
      String(params.jobId),
      String(params.memberId),
      body.notifyOnComplete
    );
    if (!team) return jobNotFound();
    return ok(team);
  }),

  // ─── GET /jobs/:jobId/invite-readiness ───
  http.get('*/api/v1/jobs/:jobId/invite-readiness', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const readiness = jobsRepo.readiness(
      currentOrgId(request),
      String(params.jobId)
    );
    if (!readiness) return jobNotFound();
    return ok(readiness);
  }),

  // ─── POST /jobs/:jobId/invitations ───
  // Sends real emails in production, so it carries an Idempotency-Key.
  http.post('*/api/v1/jobs/:jobId/invitations', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const orgId = currentOrgId(request);
    const key = request.headers.get('Idempotency-Key');
    if (idempotency.has(orgId, key)) return idempotency.replay(orgId, key!);

    const body = (await request.json()) as { invites: InviteRow[] };
    if (!Array.isArray(body.invites) || body.invites.length === 0) {
      return validationFailed({ invites: 'Add at least one candidate' });
    }

    // Bulk uploads are slower than a single invite.
    if (body.invites.length > 5) await delay(latency(600, 1200));

    const result = jobsRepo.invite(orgId, String(params.jobId), body.invites);
    if (!result) return jobNotFound();

    return idempotency.store(orgId, key, ok(result));
  }),

  // ─── GET /organisation/members ───
  http.get('*/api/v1/organisation/members', async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;
    return ok(jobsRepo.members(currentOrgId(request)));
  }),

  // ─── GET /organisation/plan ───
  http.get('*/api/v1/organisation/plan', async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;
    return ok(jobsRepo.plan(currentOrgId(request)));
  }),
];
