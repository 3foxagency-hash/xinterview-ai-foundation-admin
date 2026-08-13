# How the mock API works — and how to add a new endpoint

**Audience:** anyone on the frontend team adding an API call
**Prerequisite:** none. This is the practical guide; `mocks/README.md` is the reference.

---

## The one-sentence version

We fake the **network**, not the functions — so when the backend ships, you delete
a mock file and change nothing else.

---

## 1. What actually happens when your component calls an API

Follow a real call through the system. Your component asks for a job:

```tsx
const job = await getJob('job_01hxseed');
```

Here is every layer it passes through:

```
  your component
        │
        │  getJob(id)
        ▼
  lib/api/jobs.ts ─────────────── the function your component imports.
        │                          Thin. It only shapes the request and
        │                          normalizes errors.
        │  api.get('/jobs/job_01hxseed')
        ▼
  lib/api/client.ts ───────────── adds x-request-id, checks the client rate
        │                          limiter and circuit breaker, then calls
        │                          the real global fetch().
        │  fetch('http://localhost:8080/api/v1/jobs/job_01hxseed')
        ▼
  ╔═════════════════════════════════════════════════════════════╗
  ║  THE NETWORK BOUNDARY                                       ║
  ║                                                             ║
  ║  In dev: MSW intercepts here and answers.                   ║
  ║  In prod: the request leaves the machine and hits the API.  ║
  ║                                                             ║
  ║  Everything above this line is IDENTICAL in both cases.     ║
  ╚═════════════════════════════════════════════════════════════╝
        │
        ▼
  mocks/handlers/jobs.ts ──────── matches the URL, validates the request
        │                          
        │  jobsRepo.byId(orgId, id)
        ▼
  mocks/repo/jobs.ts ──────────── the only module allowed to touch storage
        │
        ▼
  mocks/db.ts ─────────────────── in-memory Maps holding the seed data
```

**The important part is the boundary.** Your component, `lib/api/jobs.ts` and
`lib/api/client.ts` contain **zero** awareness that mocking exists. There is no
`if (isMock)` anywhere in the app. That is the entire reason we chose MSW over
writing fake functions.

### Why that matters to you concretely

When the backend finishes the endpoint, the migration is:

1. Change `NEXT_PUBLIC_API_MOCKING=disabled` (or drop the resource from the
   `partial` list).
2. Delete the handler.

**No component changes. No call-site changes. No hunting for `if (isMock)`.**
With the old approach — fake functions in `lib/api/` — you would have rewritten
the function and re-verified every screen that used it.

### Two places, not one

MSW runs in **two separate runtimes**, and both are wired up:

| Runtime | File | Intercepts |
|---|---|---|
| Browser (Service Worker) | `components/providers/msw-bootstrap.tsx` → `mocks/browser.ts` | fetches from Client Components |
| Node | `instrumentation.ts` → `mocks/server.ts` | fetches from Server Components, Route Handlers, tests |

You don't have to think about this when adding an endpoint — **one handler
serves both**, because handler paths start with `*` (see §4). It's documented
here only so the architecture isn't a mystery.

---

## 2. What you give me (or write yourself)

This is the direct answer to your question. To add an endpoint I need **four
things**. Two are essential, two have sensible defaults.

### Essential

**1. The HTTP method and path**

```
GET /api/v1/candidates
POST /api/v1/jobs/{jobId}/publish
```

Write the path as the backend will expose it. Use `{braces}` for parameters.

**2. The success response shape**

Real-ish JSON is perfect — I don't need TypeScript:

```json
{
  "data": {
    "id": "cand_01H...",
    "firstName": "Priya",
    "lastName": "Nair",
    "email": "priya@example.com",
    "stage": "shortlisted",
    "aiScore": 82,
    "appliedAt": "2026-08-01T09:00:00Z"
  }
}
```

> **Note the `data` wrapper.** Every response in this product is enveloped,
> single resources included. Lists add `meta`. See §6.

### Helpful, but I'll assume defaults if you skip them

**3. What can go wrong** — the failure paths you want reachable locally

```
404 CANDIDATE_NOT_FOUND   — unknown id
403 FORBIDDEN             — recruiter viewing another team's candidate
422 VALIDATION_FAILED     — stage is not one of the allowed values
```

If you skip this I'll add validation for required fields plus a 404, because
**the failure states are the ones nobody designs and everybody ships broken.**

**4. Request body / query params** for writes and lists

```
POST body: { "stage": "interviewed", "note": "Strong on system design" }
GET query: ?page=1&pageSize=20&sort=aiScore:desc&stage=shortlisted&q=react
```

### A complete request, as an example of what to send me

> Add `GET /api/v1/candidates` — paginated list.
> Filter by `stage`, search by name/email via `q`, sort by `aiScore` or `appliedAt`.
> Row: `{ id, firstName, lastName, email, stage, aiScore, appliedAt }`.
> `aiScore` is null until the interview is evaluated.
> Stages: `invited | in_progress | review | shortlisted | hired | rejected`.
> Seed ~30 candidates across stages so pagination is real.
> Errors: 422 on an unknown stage filter.

That is enough for me to build the whole thing.

### What I do NOT need

- TypeScript interfaces — I write those from your JSON
- The real backend to exist
- An OpenAPI spec
- Any decision about folder structure, latency, or error envelope shape — those
  are already settled

---

## 3. "The backend hasn't built it yet" — the exact scenario

This is the case the whole setup exists for, so let's be precise about it.

**Situation:** Tomorrow the backend team agrees they'll build
`POST /api/v1/jobs/{jobId}/publish`. It doesn't exist on any server. You need to
build the Publish button **today**.

**What you do:**

1. Agree the shape with the backend — a Slack message is enough at this stage:

   > `POST /api/v1/jobs/{jobId}/publish` → `{ data: { id, status: "active", publishedAt } }`
   > 409 `JOB_ALREADY_PUBLISHED` if it's already live.
   > 422 `JOB_INCOMPLETE` with `fieldErrors` if it has no questions.

2. Add the mock (§4 walks through it, ~20 minutes).

3. **Build the entire feature.** Loading state, success toast, the 409 dialog,
   the "add questions first" error. All of it, against the mock.

4. Ship it behind a feature flag, or merge it — your call.

5. When the backend deploys, flip mocking off for that resource. If the contract
   matches, it just works. If it doesn't, the mismatch is a five-minute fix in
   one handler, not a rebuild.

**You are never blocked.** And the pressure moves to the right place: the
backend's deliverable becomes *"agree the contract"*, which takes an afternoon,
rather than *"ship working code"*, which takes a sprint.

### Recommended: write it down in `openapi.yaml`

If you want this to scale past a handful of endpoints, put the proposed shape in
a spec file marked as proposed:

```yaml
/jobs/{jobId}/publish:
  post:
    x-status: proposed        # frontend-drafted, backend has not confirmed
    summary: Publish a job
```

Then it's a PR the backend lead reviews, rather than a Slack message that scrolls
away. This is the "frontend may propose the spec" amendment from the
architecture review — worth adopting, but not required to start.

---

## 4. Walkthrough: adding an endpoint, start to finish

Real example. We'll add **`POST /api/v1/jobs/{jobId}/publish`**, the one from §3.

> **This example is already implemented in the repo** — the code below is copied
> from the working implementation, not written for illustration. You can read the
> finished version in `mocks/handlers/jobs.ts` and call `publishJob(jobId)` today.
>
> Verified behaviour: publishing without questions → 422 · publishing twice →
> 409 · unknown id → 404 · another org's job → 404 · repeated
> `Idempotency-Key` → replays the original response.

### Step 1 — Add the types to `lib/api/contract.ts`

This file is the shared contract: both the app and the mocks import from it, so a
handler returning the wrong shape **fails to compile**. That is the point.

```ts
// lib/api/contract.ts

export type PublishJobResponse = {
  id: string;
  status: JobStatus;
  publishedAt: string;       // UTC ISO 8601
};

// Add the new codes to the existing JOB_ERROR block:
export const JOB_ERROR = {
  // ...existing codes
  JOB_ALREADY_PUBLISHED: 'JOB_ALREADY_PUBLISHED',
  JOB_INCOMPLETE: 'JOB_INCOMPLETE',
} as const;
```

> Error codes are **stable machine identifiers**, always SCREAMING_SNAKE. The UI
> branches on `code`, never on the human-readable `message` — messages get
> reworded, codes don't.

### Step 2 — Add the business logic to the repo

Handlers never touch storage directly. They go through a repo, and **every repo
function takes `orgId` first**:

```ts
// mocks/repo/jobs.ts — add to the jobsRepo object

publish(orgId: string, jobId: string):
  | { ok: true; job: WireJob }
  | { ok: false; reason: 'not_found' | 'already_published' | 'no_questions' } {

  const store = db();
  const job = store.jobs.get(jobId);

  // orgId check is why it comes first: another tenant's job must read as
  // missing, never as forbidden — a 403 confirms the job exists.
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
}
```

**Why `orgId` first, always?** Because you cannot forget it — it won't compile.
A mock that ignores organisations happily hides the exact cross-tenant leak that
is the worst bug this product can ship, and it passes every test written against
a single org.

### Step 3 — Add the handler

```ts
// mocks/handlers/jobs.ts — add to the jobHandlers array

http.post('*/api/v1/jobs/:jobId/publish', async ({ request, params }) => {
  // 1. Scenario first, always. Lets the dev panel force 500 / offline / slow.
  const scenario = await applyScenario();
  if (scenario) return scenario;

  const orgId = currentOrgId(request);
  const key = request.headers.get('Idempotency-Key');

  // 2. Idempotency — publishing emails candidates, so a double-submit must
  //    replay the original response rather than firing a second time.
  if (idempotency.has(orgId, key)) return idempotency.replay(orgId, key!);

  // 3. Do the work through the repo.
  const result = jobsRepo.publish(orgId, String(params.jobId));

  // 4. Map outcomes onto the HTTP contract.
  if (!result.ok) {
    switch (result.reason) {
      case 'not_found':
        return fail(404, JOB_ERROR.JOB_NOT_FOUND,
          'That job does not exist or was removed.');
      case 'already_published':
        return fail(409, JOB_ERROR.JOB_ALREADY_PUBLISHED,
          'This job is already published.');
      case 'no_questions':
        return validationFailed(
          { questions: 'Add at least one question before publishing' },
          'This job is not ready to publish',
        );
    }
  }

  return idempotency.store(orgId, key, ok({
    id: result.job.id,
    status: result.job.status,
    publishedAt: result.job.updatedAt,
  }));
}),
```

**Three things to copy every time:**

| Line | Why |
|---|---|
| `applyScenario()` **first** | Without it the dev panel can't force this endpoint into error/offline/slow, and its failure states stay untested |
| `currentOrgId(request)` → repo | Tenant scoping |
| `Idempotency-Key` on side-effecting POSTs | A retried publish must not email candidates twice |

> **Path ordering matters.** MSW matches handlers in array order, so a literal
> path must be registered **before** a parameterised one that would also match.
> `/jobs/templates` sits above `/jobs/:jobId` in our array — otherwise
> `templates` would be captured as a `jobId`.

### Step 4 — Add the client function

```ts
// lib/api/jobs.ts

export async function publishJob(jobId: string): Promise<{
  id: string; status: JobStatus; publishedAt: string;
}> {
  return call(() =>
    api.post<PublishJobResponse>(
      `/jobs/${encodeURIComponent(jobId)}/publish`,
      { idempotencyKey: ulid() },
    )
  );
}
```

`call()` converts a thrown `ApiError` into the shape our components branch on.
`encodeURIComponent` because ids come from the URL.

### Step 5 — Use it

```tsx
try {
  await publishJob(jobId);
  toast.success('Published');
} catch (err) {
  const error = err as ApiError;
  if (error.code === 'job_already_published') {
    // refresh — someone else published it
  } else if (error.code === 'validation_failed') {
    setBanner(error.message);
  } else {
    setBanner('Could not publish. Please try again.');
  }
}
```

### That's it — five files

```
lib/api/contract.ts        types + error codes
mocks/repo/jobs.ts         business logic          ← orgId first
mocks/handlers/jobs.ts     HTTP mapping            ← applyScenario first
lib/api/jobs.ts            client function
your component             use it
```

**A brand-new resource** (say `candidates`) adds two more steps: create
`mocks/repo/candidates.ts` + `mocks/handlers/candidates.ts`, then register it:

```ts
// mocks/handlers/index.ts
const REGISTRY: Record<string, RequestHandler[]> = {
  auth: authHandlers,
  jobs: jobHandlers,
  candidates: candidateHandlers,   // ← the key is the name used in
};                                 //   NEXT_PUBLIC_MOCK_RESOURCES
```

---

## 5. The rules, and the reasoning

Six rules. Each exists because of a specific failure.

### 1. Handlers must implement real logic

```ts
// ✗ Useless
http.get('*/api/v1/candidates', () => ok(ONE_FIXTURE));

// ✓ Real
http.get('*/api/v1/candidates', async ({ request }) => {
  const q = parseListQuery(new URL(request.url));
  return HttpResponse.json(candidatesRepo.list(currentOrgId(request), q));
});
```

A handler that ignores the request makes everything look finished while teaching
the UI nothing. Every pagination bug, every empty state, every sort — all hidden
until integration week, when you find them all at once.

### 2. Never mock at zero latency

`applyScenario()` already adds 200–600ms. Don't bypass it. If mocks answer
instantly, your loading skeletons are never visible during development, which
means they ship untested — and they're the first thing a user on a slow
connection sees.

### 3. Handlers go through repos, never storage

Keeps the storage choice reversible and makes `orgId` scoping structural. If we
swap the in-memory Maps for something else, that's one folder — not forty
handlers.

### 4. Paths start with `*`

```ts
http.post('*/api/v1/jobs', ...)     // ✓
http.post('/api/v1/jobs', ...)      // ✗ misses server-side calls
```

The wildcard makes one handler match browser fetches, Server Component fetches
and any internal call — instead of three near-identical handler sets that drift.

### 5. Every resource ships an error and an empty path

The dev panel's scenarios give you this almost free once `applyScenario()` is
the first line. **Most production bugs live in the states nobody looked at.**

### 6. Errors use stable codes, not messages

```ts
if (error.code === 'job_already_published')     // ✓ survives copy edits
if (error.message === 'This job is already…')   // ✗ breaks on rewording
```

---

## 6. Response shapes — the conventions

Agreed once so one `DataTable` and one error handler can serve the whole product.

**Single resource** — always enveloped, even for one object:

```json
{ "data": { "id": "job_01H...", "title": "Senior Frontend Engineer" } }
```

**List** — envelope plus `meta`:

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "pageSize": 20, "total": 143, "totalPages": 8 }
}
```

**Error** — always these four fields:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Job title is required",
  "fieldErrors": { "title": "Required" },
  "requestId": "req_mock_0042"
}
```

- `code` — what the UI branches on and eventually translates
- `message` — developer-facing English, a fallback
- `fieldErrors` — maps straight onto react-hook-form's `setError`
- `requestId` — shown in error states; traces one complaint to one log line

**List query conventions** (already implemented in `mocks/repo/query.ts` — reuse,
don't reinvent):

```
?page=2&pageSize=20
&sort=aiScore:desc,createdAt:asc      comma-separated, field:direction
&q=react                              free-text search
&stage=shortlisted&stage=interviewed  repeated key = OR
```

`pageSize` is capped server-side at 100.

**Helpers available in handlers** — from `mocks/repo/respond.ts`:

| Helper | Produces |
|---|---|
| `ok(data)` | 200 `{ data }` |
| `created(data)` | 201 `{ data }` |
| `noContent()` | 204 |
| `validationFailed(fieldErrors, message?)` | 422 |
| `fail(status, code, message, extra?)` | anything else |
| `rateLimited(retryAfter, message)` | 429 with `retry-after` |
| `notFound()` / `forbidden()` / `conflict()` | 404 / 403 / 409 |

---

## 7. Running and debugging

```bash
npm run dev        # mocks on
npm run dev:live   # mocks off, real API
```

### Test credentials

| Email | Password | Gives you |
|---|---|---|
| `admin@xinterview.ai` | `password123` | Happy path, `owner` |
| `recruiter@xinterview.ai` | `password123` | Happy path, `recruiter` |
| `locked@xinterview.ai` | `password123` | 429 lockout |
| `unverified@xinterview.ai` | `password123` | 403 unverified |

OTP `123456` works · `000000` invalid · `111111` expired.
Seeded job: `job_01hxseed`.

### The dev panel

Bottom-left badge. Shows the environment and a `MOCK` chip; click it to switch
scenario — `empty`, `error500`, `slow`, `forbidden`, `rateLimited`, `offline`.
Applies to the next request, no reload.

**Use this before calling a screen done.** It's how you see all five states in
thirty seconds instead of commenting out code.

### Seeing the response body (empty Response tab)

**Chrome often shows an empty Response tab for MSW calls.** The body really is
there — the debugging protocol returns it — but the Network panel frequently
fails to render responses fulfilled by a Service Worker rather than fetched over
the wire. This is a DevTools limitation, not a broken mock.

Three ways to see it, easiest first.

**1. The console log — on by default, no setup.** Every mocked call is logged as
a collapsed group with status, timing, the parsed response body, and the request
body on writes:

```
⇄ MSW  POST /auth/tokens  200 · 493ms
   Response: { access_token: "eyJ…", refresh_token: "eyJ…", last_seen_monitor: "eyJ…" }
   Request:  { email: "admin@xinterview.ai", password: "password123" }
   URL: http://localhost:8080/auth/tokens
```

Turn it off with `__msw.log(false)` in the console, back on with
`__msw.log(true)`. Implemented in `mocks/log-responses.ts`.

Two advantages over the Network panel: it survives navigation with **Preserve
log**, and the console's filter box searches response *bodies*, which the
Network panel's filter does not.

**2. Check the Network filter.** With `Fetch/XHR` selected you may be looking at
the Service Worker's pass-through record rather than the real response. Click
**All** and find the entry **without** the gear icon — that one has the body.

**3. MSW's own group.** MSW logs a collapsed group per request
(`[MSW] 16:56:55 POST … (200 OK)`); expand it for a `Response` object carrying
the body.

### Reading the console

```
[MSW] 13:56:44 POST http://localhost:8080/auth/tokens (404 Not Found)
```

This means **the mock worked** and deliberately returned 404 — which is what the
real backend returns for bad credentials. A `[MSW]` prefix always means
interception succeeded; it is never itself an error.

```
[MSW] Warning: intercepted a request without a matching request handler:
  • GET /api/v1/candidates
```

**This one matters.** No handler matched. Usually: a typo in the path, a missing
`*` prefix, the resource not registered in `index.ts`, or ordering — a
parameterised path swallowing a literal one. We filter Next.js's own RSC and
asset traffic out of these warnings, so anything you see here is a real gap.

### Partial mocking — the integration-week setting

When the backend ships endpoints one at a time:

```bash
# .env.local — auth is live now; keep mocking the rest
NEXT_PUBLIC_API_MOCKING=partial
NEXT_PUBLIC_MOCK_RESOURCES=jobs,candidates
```

Resource names are the keys in `mocks/handlers/index.ts`.

### Common problems

| Symptom | Cause |
|---|---|
| `Warning: without a matching request handler` | Path typo · missing `*` · not registered in `index.ts` · a `:param` route registered above a literal one |
| Change to a handler does nothing | Hard-refresh (⌘⇧R) — the Service Worker caches |
| Works in the browser, fails server-side | `instrumentation.ts` didn't start. Check for `[msw] server-side mocking active` on boot, and that you're on `npm run dev` (Turbopack is required) |
| Mock data survives across tests | Call `resetDb()` in teardown |
| Blank page on load | The worker failed to start — check the console; it fails open and logs |

---

## 8. Migration status

| Resource | State |
|---|---|
| `auth` | Mocked via MSW |
| `jobs` — wizard (create, read, update, questions, team, invitations, plan) | Mocked via MSW |
| `jobs` — customisation (branding, welcome, stages, scoring, …) | Still in-memory, lower half of `lib/api/jobs.ts` |
| `candidates`, `reports`, `settings`, `profile`, `workspaces`, templates | Still in-memory in their own `lib/api/*` modules |

**The two styles coexist safely** — MSW intercepts network calls, and the
in-memory functions never make one. Migrate a resource when you next touch it,
not in a big-bang sweep.

**To migrate one:** the existing in-memory code is your specification. Its
validation and error branches move nearly verbatim into a repo, the handler wraps
them in HTTP, and the `lib/api/*` function swaps its body for a `fetch`, keeping
its signature so call sites don't change. That last part is what kept all 22
files importing `@/lib/api/jobs` untouched when we migrated the wizard.

---

## 9. Before you open the PR

- [ ] Types added to `lib/api/contract.ts`, not inline in the handler
- [ ] Handler calls `applyScenario()` as its **first** line
- [ ] Repo function takes `orgId` first
- [ ] Handler reads the request — real filtering/sorting/pagination, not a fixture
- [ ] Path starts with `*`
- [ ] Literal paths registered above parameterised ones
- [ ] Side-effecting POST sends an `Idempotency-Key`
- [ ] Error codes are SCREAMING_SNAKE and added to the resource's error block
- [ ] Empty and error scenarios checked via the dev panel
- [ ] `npx tsc --noEmit` clean
- [ ] Nothing from `mocks/*` is statically imported by app code

That last one is worth explaining: it is the mistake that shipped mock
credentials into a production bundle here once already. A render-time
`if (!enabled) return null` is **not** enough — the bundler keeps any component
body it can see, including its dynamic imports. That's why
`msw-provider.tsx` and `dev-mock-panel.tsx` are thin shells around
`React.lazy`. `npm run build:prod` runs the guard that catches it.

---

## Related

- `mocks/README.md` — reference: credentials, scenarios, structure, gotchas
- `docs/api-implementation-standard.md` — the standard and its reasoning
