# XInterview — Frontend Architecture & Implementation Standard

**Version:** 2.0 · **Status:** Final — ready for development
**Supersedes:** v1.1 and the v1.2 patch. This is the single document; the earlier ones are archived.
**Applies to:** XInterview admin dashboard and candidate interview experience (Next.js rebuild)
**Audience:** Frontend team · Backend team (Sections 6, 7, 16, 17, 18.8) · Any AI tool generating modules against this standard.

---

## Contents

| # | Section | # | Section |
|---|---|---|---|
| 0 | How to use this document | 16 | Media & lifecycle contract |
| 1 | Architectural principles | 17 | AI report contract |
| 2 | Final stack | 18 | **Internationalization & localization** |
| 3 | System architecture & request paths | 19 | Design system integration |
| 4 | Repository structure | 20 | The five-state contract |
| 5 | Environments & configuration | 21 | Accessibility floor |
| 6 | API contract layer & ownership | 22 | Performance budget |
| 7 | Global API conventions | 23 | Testing strategy |
| 8 | The mock layer | 24 | Observability |
| 9 | Auth & session | 25 | CI/CD |
| 10 | Security standard | 26 | Conventions |
| 11 | Roles, permissions & tenant isolation | 27 | Definition of Done |
| 12 | State management rules | 28 | Build order |
| 13 | Data freshness & concurrency | 29 | Anti-patterns |
| 14 | Data tables | 30 | Version history |
| 15 | Forms | | |

---

## 0. How to use this document

This is the single source of truth for **how the frontend is built**. The XInterview Design System document is the source of truth for **how it looks**. Where they overlap, the Design System wins on visual decisions and this document wins on structure.

Three rules:

1. Every module prompt sent to a code generator references this document. The generator solves the *product requirement* — it does not pick a table library, a fetch pattern, a loading convention or a translation approach. Those are decided here.
2. Every PR is reviewed against Section 27 (Definition of Done).
3. Sections 6, 7, 16, 17 and 18.8 are **shared contracts**. Changing them needs both teams, not a frontend decision.

Above all: **one way to do each thing.** Two competing patterns cost more than either saves — and when modules are generated, a second pattern multiplies rather than adds.

---

## 1. Architectural principles

1. **Mock-first.** The frontend never waits for the backend. Every endpoint exists as a typed mock from day one, and the mocks are the frontend team's own files to edit.
2. **Contract-driven.** The OpenAPI spec is the boundary between teams and the only place API types are declared. No developer ever asserts what they hope an endpoint returns.
3. **The server holds the truth; the URL holds the view.** No global store for server data, no filter or page state trapped in `useState`.
4. **Every screen has five states.** Loading, empty, error, no-permission, populated.
5. **Security is server-side.** UI role checks are ergonomics; middleware and the backend are enforcement.
6. **Machine identifiers on the wire, human language at the edge.** The backend never returns display text. The frontend never invents identifiers.
7. **Strict at the boundary, tolerant where the product is still moving.** Fail the build on API drift — except the AI report schema (Section 17), which is deliberately version-tolerant.
8. **Boring, current, one option.** No experimental libraries in the core path. One choice per concern; deviations need an ADR.

---

## 2. Final stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router)** | RSC by default; `'use client'` at the leaves |
| Language | **TypeScript, `strict: true`** | plus `noUncheckedIndexedAccess` |
| Styling | **Tailwind CSS** | tokens only; **logical properties only** (Section 18.7) |
| Component base | **shadcn/ui**, re-skinned to the Design System | owned in-repo |
| Icons | Geist Icons | one set, no mixing |
| API types | **openapi-typescript** | generated, committed, never hand-edited |
| API client | **openapi-fetch** | infers path, params and response from the spec |
| Server state | **TanStack Query** | caching, retries, invalidation, polling |
| URL state | **nuqs** | filters, tabs, pagination, search, sort |
| Client state | **Zustand**, sparingly | genuinely global UI only |
| Forms | **react-hook-form + Zod** | one schema drives validation and types |
| Tables | **TanStack Table** (headless) | server-side pagination/sort/filter |
| i18n | **next-intl** | ICU messages, RSC-aware, locale-aware formatting |
| Dates | **next-intl formatters + date-fns-tz** | one module; raw `new Date()` banned in components |
| Mocking | **MSW** (+ `@mswjs/data`, scoped — Section 8) | shared by dev, unit tests and E2E |
| Unit / component tests | **Vitest + React Testing Library** | |
| E2E | **Playwright** + `@axe-core/playwright` | |
| Errors & performance | **Sentry** (`@sentry/nextjs`, EU region) | |
| Analytics & flags | **PostHog** (EU) | |
| Captcha | **Cloudflare Turnstile** | managed mode, server-verified |
| Uploads | **Presigned direct-to-storage** | never proxied through Next.js |
| Package manager | **pnpm** · **CI** GitHub Actions | |

**Explicitly rejected:** Redux · Axios · a hand-written generic `apiFetch<T>` (Section 6) · Jest · Cypress · reCAPTCHA · localStorage for tokens · English strings as translation keys (Section 18.3).

---

## 3. System architecture & request paths

```
                          Browser
                             │
                 ┌───────────┴───────────┐
                 │                       │
      credential-handling            data requests
      (BFF — Next.js routes)         (direct to backend)
                 │                       │
      /api/auth/login                GET  /api/v1/jobs
      /api/auth/refresh              POST /api/v1/candidates/:id/stage
      /api/auth/switch-org           ...
      /api/upload/sign
      /api/monitoring                     │
                 │                       │
                 └───────────┬───────────┘
                             │
                     Backend API  /api/v1/*

  Server Components fetch server-side, forwarding the session cookie.

  MSW, when enabled, intercepts BOTH paths — browser fetches via the
  service worker, server fetches via msw/node. Application code is
  byte-for-byte identical either way.
```

**State boundaries** — every piece of state has exactly one home:

```
URL (nuqs)          search · filters · tabs · pagination · sorting
TanStack Query      all server data
React Hook Form     form values, dirty state, validation
Zustand             command palette · sidebar · theme   (nothing else)
useState            ephemeral UI — open/closed, hover
```

### 3.1 Thin BFF — which requests go where

Only these go through Next.js Route Handlers:

| Route | Why it needs the server |
|---|---|
| `/api/auth/*` | Sets and rotates httpOnly cookies; verifies Turnstile with the secret key |
| `/api/upload/sign` | Signs storage URLs with a secret the browser must never see |
| `/api/monitoring` | Sentry tunnel |

Everything else goes **browser → backend directly**, carrying the session cookie.

**Why not proxy everything.** A full proxy adds a serverless hop to every table page, filter change and poll — doubling latency and paying compute to forward bytes. On a screen where a recruiter changes filters twenty times a session, that is the difference between snappy and sluggish.

**What the thin BFF requires:** the API on the same registrable domain (`app.xinterview.com` / `api.xinterview.com`), so a `Domain=.xinterview.com; SameSite=Lax` cookie is sent on data requests, with CORS allowing the app origin with credentials.

**If that is impossible** — API on a genuinely different domain — either use `SameSite=None` (weaker CSRF posture, requires an anti-CSRF token on every mutation) or fall back to a full proxy. **Decide in Phase 0.** It is a one-line change in `client.ts` then, and a painful migration later.

**Server Components** fetch the backend directly, forwarding the cookie:

```ts
// lib/api/server-client.ts
export async function serverApi() {
  const cookie = (await cookies()).toString()
  return createClient<paths>({ baseUrl: `${env.API_BASE_URL}/api/v1`, headers: { cookie } })
}
```

### 3.2 MSW must be enabled in two places

**The MSW service worker only intercepts browser fetches.** A Server Component fetching data never touches it, hits a real API that may not exist, and the page fails while the client-side equivalent works fine. This will bite in Phase 0 if it is not set up correctly:

```ts
// instrumentation.ts
export async function register() {
  if (env.NEXT_PUBLIC_API_MOCKING === 'enabled' && process.env.NEXT_RUNTIME === 'nodejs') {
    const { server } = await import('./src/mocks/server')
    server.listen({ onUnhandledRequest: 'warn' })
  }
}
```

Handlers use wildcard origins (`*/api/v1/jobs`) so one handler set covers browser fetches, server fetches and BFF-internal calls.

---

## 4. Repository structure

Organised by **feature**, not by file type.

```
src/
  app/
    (auth)/login  forgot-password
    (dashboard)/
      layout.tsx                    # shell: sidebar, topbar, org switcher
      jobs/  workflow/[jobId]/  candidates/  reports/  settings/
    interview/[locale]/[token]/     # candidate-facing, locale in the URL
    api/
      auth/login|logout|refresh|switch-org/route.ts
      upload/sign/route.ts
      monitoring/route.ts
    error.tsx  global-error.tsx  not-found.tsx
  features/
    jobs/  workflow/  candidates/  interview/  reports/  auth/
      api/  components/  schemas/  types.ts
  components/
    ui/          # shadcn primitives, re-skinned
    layout/
    patterns/    # DataTable, PageHeader, EmptyState, StateBoundary, ConfirmDialog
  lib/
    api/client.ts  api/server-client.ts  api/generated.ts  api/errors.ts
    auth/session.ts  auth/rbac.ts
    config/env.ts
    i18n/config.ts  i18n/request.ts  i18n/navigation.ts
    utils/datetime.ts  utils/media.ts
  mocks/
    handlers/  repo/  db.ts  scenarios.ts  browser.ts  server.ts
  hooks/
  middleware.ts
messages/
  en-US.json  nl-NL.json  de-DE.json  ...          # one file per locale
tests/  e2e/  setup/
docs/  architecture.md  adr/
openapi.yaml                                        # copied in by CI from the backend repo
```

**Rules.** Features never import each other's internals — cross-feature needs go through `components/patterns` or `lib`. `lib/api/generated.ts` is machine-written. No `utils.ts` dumping ground beyond ~100 lines.

---

## 5. Environments & configuration

| Environment | API | Mocks | Notes |
|---|---|---|---|
| `local` | dev API or mocks | developer's choice | `.env.local`, gitignored |
| `development` | dev API | off | auto-deploy from `main` |
| `staging` | staging API | off | production-like data volumes |
| `production` | production API | **forced off** | manual approval to deploy |

**No `.env.production` or `.env.staging` exists in the repository.** Those values live in host/CI secrets. The repo contains one env file: `.env.example`, keys with no values.

```ts
// lib/config/env.ts
const schema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'development', 'staging', 'production']),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_API_MOCKING: z.enum(['enabled', 'disabled']).default('disabled'),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_GIT_SHA: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1),      // server-only
  SESSION_SECRET: z.string().min(32),
})
export const env = schema.parse(process.env)
```

**Two hard rules:**

1. The production build pipeline **asserts** `NEXT_PUBLIC_API_MOCKING=disabled` as an explicit CI step. A dashboard silently serving mock data to a customer is the worst failure this architecture can produce, so it is guarded by a check, not by memory.
2. A **visible environment badge** renders in the topbar whenever `APP_ENV !== 'production'`, colour-coded, with the API host on hover. This prevents the incident where someone runs a destructive action against production because they forgot which environment the tab was pointing at.

---

## 6. The API contract layer & ownership

This is the fix for "frontend is blocked whenever the backend changes." The backend's deliverable stops being *"the endpoint works"* and becomes *"the spec is updated"* — which lands days before working code.

```
backend publishes openapi.yaml
        ↓
CI generates lib/api/generated.ts        (openapi-typescript)
        ↓
typed client                             (openapi-fetch)
        ↓
feature API functions + Query hooks
        ↓
components
```

### 6.1 Contract ownership

Defined so no change stalls waiting for a meeting, and no change lands silently that breaks the other side.

**Sole ownership** — you change it without asking, and the other team finds out from CI:

| Backend owns | Frontend owns |
|---|---|
| `openapi.yaml` — the file | `mocks/` — handlers, fixtures, scenarios |
| API implementation and response contracts | UI models and view-model mapping |
| Error **codes** and their meanings | Error **messages** shown to users (Section 18.8) |
| Idempotency and conflict enforcement | Query hooks, keys, cache and invalidation |
| Media processing pipeline and its states | URL/view state, forms, all UI state |
| System-generated content (emails) and its localization | `messages/en-US.json` and all UI translation |

**Joint ownership** — neither side changes these alone, and a change requires both leads plus an ADR:

- **Section 7 conventions:** response envelope, pagination and sort syntax, error envelope shape, ID format, datetime format, idempotency.
- **Section 16.1:** media lifecycle states.
- **Section 17:** the AI report envelope (`schemaVersion`, `sections[]`, `status`). Section *types* inside it stay backend-owned and open — that is the point of the tolerant renderer.
- **Section 18.8:** the set of machine identifiers (statuses, roles, error codes, section types) the frontend must have translation keys for.

Backend owns *whether* an endpoint paginates; it does not own *how pagination is spelled*. Changing `?page=` to `?offset=` on one endpoint breaks the single `DataTable` that serves the whole product.

**Nobody owns** `lib/api/generated.ts`. It is machine-written; a hand edit is reverted by CI, not debated.

**Process**

1. Backend changes `openapi.yaml` and opens a PR. **Frontend has review rights on it** — the one moment to say "this will break us" before it is built.
2. CI runs `oasdiff`; a breaking change fails the pipeline regardless of who approved it.
3. Frontend regenerates types, updates mocks, and builds against the spec. The endpoint need not exist yet.
4. When it ships, frontend flips mocking off and it works — or the contract was violated, and CI names the side.

### 6.2 The client is typed by the spec, not the developer

```ts
// lib/api/client.ts
import createClient from 'openapi-fetch'
import type { paths } from './generated'

export const api = createClient<paths>({
  baseUrl: `${env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
  credentials: 'include',
})
```

```ts
// features/jobs/api/jobs.api.ts
export async function listJobs(filters: JobFilters) {
  const { data, error } = await api.GET('/jobs', { params: { query: filters } })
  if (error) throw ApiError.from(error)
  return data                              // type comes from the spec
}
```

```ts
apiFetch<Job[]>('/jobs')     // ❌ a developer asserting what they hope arrives
api.GET('/jobs')             // ✅ the contract deciding
```

The difference is not ergonomics. A hand-written generic re-introduces exactly the drift the OpenAPI pipeline exists to eliminate: the spec changes, the assertion does not, TypeScript reports nothing, production breaks.

### 6.3 Query hooks

Keys declared once per feature, never as ad-hoc strings in components:

```ts
export const jobKeys = {
  all:    (orgId: string) => ['jobs', orgId] as const,
  list:   (orgId: string, f: JobFilters) => [...jobKeys.all(orgId), 'list', f] as const,
  detail: (orgId: string, id: string)    => [...jobKeys.all(orgId), 'detail', id] as const,
}
```

The `orgId` in every key is the defensive half of Section 11's tenant isolation.

### 6.4 Versioning

All endpoints sit under `/api/v1/`, set once in the client `baseUrl`. Individual calls never carry the prefix.

Be honest about what the prefix buys: "v1 for the old frontend, v2 for the new" is not how a lockstep-deployed dashboard works. The prefix is cheap insurance for future external consumers. What actually protects the dashboard is **expand/contract** (add fields freely, never remove or repurpose one in place) plus the **`oasdiff` breaking-change gate in CI**.

---

## 7. Global API conventions

These apply to every endpoint. Agreeing them once is what lets one `DataTable` and one error handler serve the product.

### 7.1 Response envelope

Every response is wrapped, single resources included. A half-wrapped API forces unwrapping logic at every call site.

```json
{ "data": [ ... ], "meta": { "page": 1, "pageSize": 20, "total": 143, "totalPages": 8 } }
{ "data": { "id": "job_01H...", "title": "Senior Frontend Engineer" } }
```

### 7.2 Pagination, filtering, sorting

```
GET /api/v1/candidates
    ?page=2&pageSize=20
    &sort=aiScore:desc,createdAt:asc
    &q=react
    &stage=shortlisted&stage=interviewed        # repeated key = OR
    &createdFrom=2026-07-01&createdTo=2026-07-31
```

- **Offset pagination** for all admin tables — recruiters expect page numbers and a total.
- **Cursor pagination** only for append-only feeds (activity log, comments): `?cursor=&limit=`.
- `pageSize` capped server-side at 100; the client offers 20 / 50 / 100.
- Sort is `field:direction`, comma-separated for multi-sort.
- Filter params map 1:1 onto URL search params, so `nuqs` state and the API query are the same object. No translation layer.

### 7.3 Errors

```json
{ "code": "VALIDATION_FAILED",
  "message": "Job title is required",
  "fieldErrors": { "title": "Required" },
  "requestId": "req_01H..." }
```

`code` is a **stable machine identifier** and the thing the UI branches on and localizes (Section 18.8). `message` is English, developer-facing, and used only as a fallback when no translation key exists. `fieldErrors` maps onto react-hook-form's `setError`. `requestId` is shown in the error state and attached to the Sentry event, so a support conversation traces to one backend log line.

| Status | Meaning | UI behaviour |
|---|---|---|
| 400 / 422 | Validation | inline field errors |
| 401 | Session expired | refresh once, then redirect to login |
| 403 | Not permitted | no-permission state, no retry |
| 404 | Missing | not-found state |
| 409 | Conflict | conflict dialog (Section 13) |
| 429 | Rate limited | message with retry-after |
| 5xx | Server | error state with Retry, reported to Sentry |

### 7.4 Identifiers

Prefixed, opaque strings — `job_01H…`, `cand_01H…`, `int_01H…`. Never sequential integers in URLs: they leak volume and invite enumeration. The frontend treats every ID as opaque and never parses one.

### 7.5 Dates, times and timezones

The convention with the highest real-world cost if you get it wrong, because this product schedules interviews across timezones.

- **Every timestamp on the wire is UTC ISO 8601 with an offset:** `2026-08-11T14:30:00Z`. No naive datetimes.
- **Durations are integer seconds** — `answerDuration: 154`. Not a string, not a float.
- **Calendar-only values** (a job closing date) are plain `YYYY-MM-DD`, never converted between zones.
- The user's **IANA timezone** (`Europe/Amsterdam`) is stored on their profile and returned with the session. Detect with `Intl.DateTimeFormat().resolvedOptions().timeZone` at signup; let them change it.
- Timestamps render in the **viewer's** timezone, with the zone visible where ambiguity matters: *"14:30 CEST"*. Interview invitations show both the candidate's and the interviewer's local time.
- **Timezone is not locale.** A recruiter in Amsterdam may run the UI in `en-US` while sitting in `Europe/Amsterdam`. The locale decides the *format*; the timezone decides the *instant*. Both are needed on every render — see Section 18.6.
- All formatting goes through `lib/utils/datetime.ts`. `new Date(...)` and `toLocaleString()` are banned in components.

Test with a machine clock set to a non-European timezone. It is the only way these bugs surface before a customer finds them.

### 7.6 Idempotency

XInterview sends emails, publishes jobs and triggers AI generation — all irreversible from the user's point of view.

```
Recruiter clicks "Send invitations to 40 candidates"
        ↓  request reaches the backend, invitations are sent
        ↓  response times out on the way back
        ↓  UI shows an error; recruiter clicks again
        ↓  40 candidates receive a second invitation from an employer
```

The frontend cannot distinguish "never arrived" from "arrived, response lost." Only the server can, and only if the client supplies a key.

**The rule: every POST that can cause an external side effect carries an `Idempotency-Key` header.**

```
POST /api/v1/jobs/:id/invitations
Idempotency-Key: 01J8XQ4M2K7VN3B5RTPWZC9YF0
```

Required on: sending invitations · publishing a job · generating or regenerating a report · creating a share link · bulk stage moves · billing actions · resending anything. Not required on idempotent updates (PUT/PATCH with `If-Match`), deletes, or reads.

**Server contract.** Store the key for 24 hours with its response. A repeat within that window returns the **original response** — not a new action, not an error. Keys are scoped per organisation. A key reused with a different body is a 422; that is a client bug, not a retry.

**Client contract — the subtlety that makes it work.** The key is generated **once per user intent, not once per request.** Mint it when the form opens or the action is armed, keep it across every retry of that intent, and replace it only after confirmed success. A key regenerated on retry is exactly as useless as no key.

```ts
export function useIdempotentMutation<TBody, TData>(fn, options) {
  const keyRef = useRef(ulid())
  return useMutation({
    mutationFn: (body: TBody) => fn(body, keyRef.current),
    onSuccess: (...args) => { keyRef.current = ulid(); options?.onSuccess?.(...args) },
    retry: 0,                                 // the key is a safety net, not the strategy
    ...options,
  })
}
```

For the Create Job wizard the key is minted with the draft and **persisted alongside it**, so a publish retried after a page reload is still recognised as the same intent.

Also required, because they are cheaper and catch most of the same cases: disable the trigger while pending · confirm anything that emails candidates · never auto-retry a non-idempotent mutation (`retry: 0` is TanStack Query's mutation default — do not override it) · surface `requestId` on failure so support can check whether the action landed.

---

## 8. The mock layer

MSW intercepts at the network level, so application code never knows it is running against mocks — no `if (isMock)` branch, ever. That absence is the whole reason for choosing MSW.

```
mocks/
  handlers/   auth.ts  jobs.ts  candidates.ts  workflow.ts  reports.ts  index.ts
  repo/       jobs.ts  candidates.ts  reports.ts  query.ts
  db.ts       # @mswjs/data — flat entities only
  scenarios.ts  # empty · error500 · slow · forbidden · conflict · duplicate_submit
  browser.ts  server.ts
```

### 8.1 Handlers never touch storage directly

```
handlers/jobs.ts  →  repo/jobs.ts  →  storage (whatever it is)
```

```ts
// mocks/repo/jobs.ts
export const jobsRepo = {
  list:   (orgId: string, q: ListQuery) => Page<Job>,
  byId:   (orgId: string, id: string) => Job | undefined,
  create: (orgId: string, input: CreateJobInput) => Job,
  update: (orgId: string, id: string, patch: Partial<Job>, ifMatch?: string) => Job | ConflictError,
}
```

Every repo function takes `orgId` **first**. Tenant scoping becomes structurally impossible to forget — which matters, because a mock layer that ignores organisations will happily hide the exact cross-tenant bug Section 11 exists to prevent.

With this boundary, swapping storage is one folder rather than forty files. That is the insurance; the library choice underneath becomes reversible and therefore low-stakes.

### 8.2 Storage split

| Data | Storage | Why |
|---|---|---|
| Jobs, candidates, users, teams, comments | `@mswjs/data` | Flat relational CRUD with real mutations — what it is good at |
| AI reports, interview answers, media metadata | Plain typed fixture modules + a small in-memory map | Nested, mostly read-only, arbitrary `payload` shapes; forcing these through a relational mock model costs more than it returns |

Shared helpers live in `mocks/repo/query.ts` — one `paginate`, one `applySort`, one `applyFilters`, implementing Section 7.2 exactly once. This keeps handlers short and every mock consistent with the real API's semantics.

### 8.3 Handler standards

```ts
// mocks/handlers/jobs.ts
export const jobHandlers = [
  http.get('*/api/v1/jobs', async ({ request }) => {
    await delay(300)                                   // never mock at zero latency
    const q = parseListQuery(new URL(request.url))     // shared parser
    return HttpResponse.json(jobsRepo.list(currentOrgId(request), q))
  }),

  http.post('*/api/v1/jobs', async ({ request }) => {
    const key = request.headers.get('Idempotency-Key')
    if (key && idempotency.has(key)) return idempotency.replay(key)   // Section 7.6

    const body = (await request.json()) as CreateJobInput
    if (!body.title) {
      return HttpResponse.json(
        { code: 'VALIDATION_FAILED', message: 'Job title is required',
          fieldErrors: { title: 'Required' }, requestId: 'req_mock' },
        { status: 422 },
      )
    }
    return idempotency.store(key, HttpResponse.json(
      { data: jobsRepo.create(currentOrgId(request), body) }, { status: 201 }))
  }),
]
```

- Handlers implement **real request logic** — filtering, pagination, sorting, validation, conflicts, idempotency replay. A handler returning one fixture regardless of input teaches the UI nothing and hides every pagination bug until integration.
- Latency of 200–600ms, so loading states are visible during development rather than theoretical.
- Every resource ships an **error scenario and an empty scenario**, switchable from a dev-only panel. Most production bugs live in states nobody looked at.
- Seed data uses faker with a **fixed seed** — deterministic tests, stable visual-regression screenshots.
- Handlers are typed against `lib/api/generated.ts`. When the spec changes, mocks stop compiling. That is the intended behaviour.

### 8.4 ETags in mocks

Conflicts must be reproducible locally, or Section 13's conflict dialog is dead code nobody has ever seen:

```ts
const etag = (r: { id: string; updatedAt: string }) => `W/"${r.id}-${r.updatedAt}"`

if (ifMatch && ifMatch !== etag(current)) {
  return conflict({ changedBy: current.updatedBy, changedAt: current.updatedAt })
}
```

**Ownership:** `mocks/` belongs to the frontend team. Backend does not review it. This is the file you edit instead of filing a ticket and waiting.

---

## 9. Auth & session

**BFF pattern:** the browser never holds a token.

```
POST /api/auth/login   (Next.js Route Handler)
  1. verify the Turnstile token with Cloudflare
  2. rate-limit check (IP + email)
  3. call the backend /api/v1/auth/login
  4. set httpOnly session + refresh cookies
  5. return { user, role, orgId, timezone, locale }
```

```ts
// app/api/auth/login/route.ts
export async function POST(req: Request) {
  const { email, password, turnstileToken } = await req.json()

  if (!(await verifyTurnstile(turnstileToken, ipOf(req))))
    return json({ code: 'CAPTCHA_FAILED' }, 400)
  if (await isRateLimited(ipOf(req), email))
    return json({ code: 'TOO_MANY_ATTEMPTS' }, 429)

  const { accessToken, refreshToken, user } = await backendLogin(email, password)
  const jar = await cookies()

  jar.set('session', accessToken, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 15,
  })
  jar.set('refresh', refreshToken, {
    httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth', maxAge: 60 * 60 * 24 * 7,
  })

  return json({ data: user })
}
```

**Why not store the JWT the backend returns?** Anything readable by JavaScript is readable by *injected* JavaScript. An httpOnly cookie survives an XSS bug; localStorage hands the attacker a session.

**Session rules**

- Access token 15 minutes; refresh token rotated on every use, with reuse detection revoking the family.
- Refresh is **single-flight** — one in-flight refresh shared across callers and tabs, never a parallel storm on page load.
- Idle timeout at 30 minutes, warning modal at 28. Admin dashboards get left open on unattended laptops.
- Logout clears cookies **and** calls `queryClient.clear()`. Otherwise the next person at that machine sees cached candidate data.

**Route protection**

```ts
// middleware.ts
export async function middleware(req: NextRequest) {
  const session = await getSession(req)
  const { pathname } = req.nextUrl

  if (!session && !isPublic(pathname)) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
  if (session && isAuthRoute(pathname)) return NextResponse.redirect(new URL('/jobs', req.url))
  if (session && !canAccessRoute(session.role, pathname))
    return NextResponse.redirect(new URL('/forbidden', req.url))

  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
```

---

## 10. Security standard

**Captcha — Cloudflare Turnstile.** Managed mode on login, forgot-password and every public candidate-facing form. **Verified server-side** in the Route Handler — a client-only captcha stops nothing, since a bot posts straight to the API. Widget resets on failed submit; a used token cannot be replayed. Cloudflare's test keys (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`) in local, staging and CI, so E2E exercises the real flow instead of a stub.

**Rate limiting.** Login: 5 per email / 15 min, 20 per IP / 15 min. Forgot-password and OTP resend: 3 per hour per email. Responses always generic — never reveal whether an email exists.

**Headers** (`next.config.ts`):

| Header | Value |
|---|---|
| `Content-Security-Policy` | nonce-based, `strict-dynamic`; allowlist Turnstile, Sentry, PostHog, media CDN |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(self), microphone=(self)` — the interview flow needs these; nothing else does |

**PII discipline.** You process resumes, video, audio and transcripts under GDPR:

- No candidate name, email, answer text or transcript in any log, analytics event or error report.
- Sentry Session Replay masks all text and blocks all media (Section 24).
- Media served only via signed, expiring URLs — never a permanent public link.
- Components rendering candidate PII carry `data-sentry-mask`.
- Support a hard-delete path for a candidate's data. Right-to-erasure is not optional for an EU HR product.

**Other.** CSRF: `SameSite` cookies plus an origin check in every mutating Route Handler · `dangerouslySetInnerHTML` banned, rich text sanitised with DOMPurify at the boundary · `pnpm audit --audit-level=high` in CI, Dependabot weekly · uploads validated client-side for UX and server-side for safety.

---

## 11. Roles, permissions & tenant isolation

```ts
// lib/auth/rbac.ts
export const PERMISSIONS = {
  'job:create':       ['owner', 'admin', 'recruiter'],
  'job:delete':       ['owner', 'admin'],
  'candidate:review': ['owner', 'admin', 'recruiter', 'interviewer'],
  'candidate:share':  ['owner', 'admin', 'recruiter'],
  'report:view':      ['owner', 'admin', 'recruiter', 'interviewer'],
  'settings:billing': ['owner'],
  'team:manage':      ['owner', 'admin'],
} as const

export const can = (role: Role, perm: Permission) => PERMISSIONS[perm].includes(role)
```

```tsx
<Can perm="job:delete"><Button variant="destructive">{t('deleteJob')}</Button></Can>
```

Three layers, all required: **UI** hides what you cannot do · **middleware** blocks the route · **backend** rejects the request. Only the third is security; the first two are courtesy.

### Tenant isolation

Cached data crossing an organisation boundary is a data-leak bug that passes every test written against a single org. Two defences:

1. **The active org lives in the session cookie**, set server-side. Switching is a round-trip to `/api/auth/switch-org` that re-issues the cookie — never a client-selectable header the browser can tamper with.
2. **Org switch clears everything:** `queryClient.clear()`, reset Zustand, then a **hard navigation**. A soft router push leaves RSC payloads and in-flight requests from the previous org alive.

```ts
async function switchOrg(orgId: string) {
  await api.POST('/auth/switch-org', { body: { orgId } })
  queryClient.clear()
  window.location.assign('/jobs')
}
```

Every query key is additionally scoped by `orgId` (Section 6.3) as a second line of defence. Belt and braces, because the failure mode is a confidentiality breach, not a rendering glitch.

---

## 12. State management rules

| Kind of state | Home | Example |
|---|---|---|
| Server data | TanStack Query | job list, candidate detail, AI report |
| View state | URL via nuqs | stage tab, filters, page, search, sort |
| Form state | react-hook-form | wizard fields, settings |
| Ephemeral UI | `useState` | dropdown open, hover |
| Global UI | Zustand | command palette, sidebar, theme |

**Banned:** copying server data into `useState`. It desynchronises the moment anything mutates.

**Why URL state matters more than it sounds.** A recruiter filters the pipeline to *"Shortlisted · Frontend role · sorted by AI score"* and sends the link to a hiring manager. If that state lived in React, the link opens a default table and the feature is quietly broken. Because filter params map 1:1 onto API query params (Section 7.2), the same object drives the URL and the request — no translation layer.

```tsx
const [stage, setStage] = useQueryState('stage', { defaultValue: 'all' })
const [page, setPage]   = useQueryState('page', parseAsInteger.withDefault(1))
```

**Multi-step wizard (Create Job).** Step in the URL (`?step=questions`), all five steps inside one `FormProvider`, draft autosaved to the server on each step change, idempotency key persisted with the draft. Never hold a five-step wizard purely in memory — a refresh must not destroy fifteen minutes of work.

---

## 13. Data freshness & concurrency

Workflow is a shared screen: several reviewers on one pipeline, moving candidates and commenting simultaneously. Both problems below affect the API contract, so they are decided **before** Phase 1.

### Live updates

**v1: polling.** Simple, cache-friendly, no new infrastructure.

```ts
useQuery({
  queryKey: workflowKeys.list(orgId, jobId, filters),
  queryFn : () => listPipeline(jobId, filters),
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,     // don't poll a hidden tab
  refetchOnWindowFocus: true,             // the highest-value refetch there is
})
```

**v2: SSE**, once collaboration pressure justifies it. One `EventSource` on `/api/v1/events`, events patched into the Query cache by key. Chosen over WebSockets because the traffic is one-directional. Mutations still go over HTTP.

Your own mutations invalidate immediately; polling is for *other people's* changes.

### Concurrent edits

Without conflict detection you get silent last-write-wins, and someone's decision disappears.

- Every mutable resource returns `updatedAt` and an `ETag`.
- Mutations send `If-Match: <etag>`.
- The backend returns **409** on mismatch, including who changed it and when.
- The UI shows a conflict dialog: *"Sarah moved this candidate to Interviewed 2 minutes ago. Reload to see the latest, or keep your change."* Never a silent overwrite, never a dead end.

### Optimistic updates

Use for **cheap, reversible, high-frequency** actions: stage moves, star/flag, marking read. Never for job publishing, invitations, or anything that triggers an email — a rolled-back optimistic update after a real email went out is worse than a spinner.

```ts
onMutate: async (next) => {
  await queryClient.cancelQueries({ queryKey })
  const previous = queryClient.getQueryData(queryKey)
  queryClient.setQueryData(queryKey, applyLocally(previous, next))
  return { previous }
},
onError: (_e, _v, ctx) => queryClient.setQueryData(queryKey, ctx.previous),
onSettled: () => queryClient.invalidateQueries({ queryKey }),
```

---

## 14. Data tables

Every list screen uses the one `DataTable` pattern component. Building the fourth bespoke table is how design consistency dies — and with generated modules, the fourth table arrives in week three.

Required: server-side pagination, sort and filter, all in the URL · column visibility toggle · row selection with a bulk-action bar · sticky header · skeleton rows matching real row height · empty state with a primary action · error state with retry and `requestId` · full keyboard navigation · card layout below `md` · all column headers and cell labels translated (Section 18).

Never fetch 5,000 rows and filter client-side. It works beautifully with seed data and dies on the first real customer.

---

## 15. Forms

One Zod schema per form, colocated in `features/<x>/schemas`, used for validation *and* as the TypeScript type.

```ts
export const createJobSchema = z.object({
  title: z.string().min(3, 'validation.title.tooShort'),      // key, not English text
  department: z.string().min(1, 'validation.department.required'),
  location: z.string().min(1, 'validation.location.required'),
  interviewType: z.literal('ai_video'),
})
export type CreateJobInput = z.infer<typeof createJobSchema>
```

Zod messages are **translation keys**, resolved at render. Otherwise validation text is the one place English leaks back into a localized product.

Rules: validate on blur, revalidate on change · disable submit only while submitting, never because the form is "invalid" — that hides *why* · map API `fieldErrors` onto `setError` · focus the first invalid field on failed submit · confirm before leaving a dirty form · every field has a real `<label>`, never a placeholder pretending to be one.

---

## 16. Media & lifecycle contract

XInterview is a video product. Media is not a detail bolted on at the end — it is the part most likely to lose a customer, because it fails on the candidate's side where nobody is watching.

### 16.1 Upload path

**Presigned, direct-to-storage. Never proxied through Next.js.**

```
client → POST /api/upload/sign                  (Route Handler authorises, returns presigned URL)
client → PUT  <storage presigned URL>           (bytes go straight to S3/Bunny)
client → POST /api/v1/interviews/:id/answers    (registers the object key)
```

Routing video through a serverless function hits body-size and duration limits at exactly the wrong moment, and you pay twice for the bandwidth.

| Concern | Standard |
|---|---|
| Recording format | WebM/VP9 where supported, MP4/H.264 fallback for Safari — detect with `MediaRecorder.isTypeSupported` |
| Chunking | Recorded and uploaded in ~5s chunks, not one blob at the end |
| Resumability | Chunks retry independently with exponential backoff; a dropped connection resumes rather than restarts |
| Local buffering | Chunks held in IndexedDB until acknowledged — a tab crash mid-interview must be recoverable |
| Playback | Signed URLs, 15-minute expiry, re-signed on demand. Never a permanent public link |
| Resumes / documents | PDF and DOCX only, 10MB cap, validated client-side for UX and server-side for safety |
| Images | Resized client-side before upload; `next/image` with explicit dimensions on render |
| Progress | Real byte-level progress, never a fake animation |

**The failure case that actually matters: a candidate's upload fails mid-interview on hotel wifi.**

1. Chunks continue buffering locally while the network is down.
2. A non-alarming banner: *"Connection unstable — your answers are saved and will upload automatically."*
3. Background retry with backoff; the interview continues.
4. If the connection has not returned by the end, the thank-you page holds and keeps retrying, with a clear explanation and a manual retry.
5. Only after repeated failure is the candidate told to contact the recruiter — with a reference ID.

The device-check step tests **camera, microphone and a bandwidth floor**, and **warns rather than blocks**. Blocking a qualified candidate over a bandwidth reading is worse than a degraded recording.

### 16.2 Processing lifecycle

The pipeline has several stages that fail independently, and the recruiter can use the output of the early ones before the later ones finish:

```
capture → upload → storage → transcode → transcription → AI evaluation → report
```

A transcript is useful on its own. Waiting to show anything until the AI report is ready wastes the most common case, where transcription succeeded and evaluation is still running or has failed.

**Per-answer state:**

```
RECORDING → UPLOADING → UPLOADED → QUEUED → PROCESSING → READY
                 │                              │
                 └──────→ UPLOAD_FAILED         └──→ PROCESSING_FAILED
                          (retryable)                (retryable | permanent)
```

```json
{
  "answerId": "ans_01H...",
  "state": "PROCESSING",
  "progress": { "uploadedBytes": 8412000, "totalBytes": 8412000 },
  "artifacts": {
    "video":      { "state": "READY", "durationSeconds": 154 },
    "transcript": { "state": "READY", "language": "nl-NL" },
    "evaluation": { "state": "PROCESSING" }
  },
  "failure": null,
  "updatedAt": "2026-08-11T14:32:11Z"
}
```

**Artifacts have their own states.** This is the part that matters: `video: READY, transcript: READY, evaluation: FAILED` is a real and common outcome. The UI shows a playable video and a readable transcript with a retry on the AI section — not a blanket "processing failed" that hides two working artifacts.

**Rolled-up interview state** (server-computed, so two screens never disagree):

| State | Meaning | Workflow list |
|---|---|---|
| `IN_PROGRESS` | Candidate is recording | "In progress" |
| `PROCESSING` | All answers in, pipeline running | "Processing" + spinner |
| `PARTIAL` | Some artifacts ready, some failed | "Ready · 1 issue", still openable |
| `READY` | Everything complete | "Ready to review" |
| `FAILED` | Nothing usable | "Failed" + retry, plus a support reference |

**Failure envelope:**

```json
{ "failure": { "stage": "transcription", "code": "AUDIO_TOO_QUIET",
               "retryable": true, "occurredAt": "2026-08-11T14:33:02Z" } }
```

`stage` and `retryable` are what the UI branches on; `code` is what it localizes (Section 18.8). Retryable failures get a Retry button; permanent ones get an explanation and a path forward (re-invite the candidate) rather than a dead end.

**Frontend rules**

- Poll while any state is non-terminal, with **backoff**: 5s for the first minute, 15s to five minutes, 30s thereafter. Stop on a terminal state.
- After 10 minutes in `PROCESSING`, tell the recruiter it is taking longer than usual and that they will be emailed — then keep polling quietly. An indefinite spinner is how a customer concludes the product is broken.
- Every non-terminal state has a designed screen. `QUEUED` especially: *"3 interviews ahead of this one"* beats a spinner, and is only possible if the backend returns queue position — **so ask for it now.**
- Never block the whole page on the slowest artifact. Stream in what is ready.

---

## 17. AI report contract

This schema will change more than any other, because the AI capability itself is still evolving. So this is the deliberate exception to "strict at the boundary": **the report renderer is version-tolerant by design.**

```ts
export const reportSchema = z.object({
  schemaVersion: z.number(),
  generatedAt: z.string(),
  model: z.string(),                    // which model produced it — needed for auditability
  language: z.string(),                 // the language the report was generated in
  status: z.enum(['pending', 'ready', 'failed']),
  overall: z.object({
    score: z.number().min(0).max(100).nullable(),
    summary: z.string(),
  }).optional(),
  sections: z.array(z.object({
    id: z.string(),
    type: z.string(),                   // NOT an enum — deliberately open
    title: z.string(),                  // backend fallback title
    payload: z.unknown(),               // validated per-renderer, not up front
  })),
})
```

```tsx
const RENDERERS: Record<string, ReportSectionRenderer> = {
  competency_scores: CompetencyScores,
  transcript_highlights: TranscriptHighlights,
  strengths_concerns: StrengthsConcerns,
  communication: CommunicationAnalysis,
}

function ReportSection({ section }: { section: Section }) {
  const Renderer = RENDERERS[section.type] ?? UnknownSection   // never crashes on a new type
  return (
    <ErrorBoundary fallback={<SectionFailed title={section.title} />}>
      <Renderer section={section} />
    </ErrorBoundary>
  )
}
```

**Why not a strict enum:** the backend ships a new section type on a Tuesday. With a strict schema every report fails to parse and the most valuable screen goes blank. With this, the new section renders as a titled generic block until the frontend catches up, and everything else is unaffected. Each section is independently error-bounded, so one malformed payload degrades one card rather than the page.

**Localization interaction (Section 18).** Known section types use translation keys (`reports.sections.competencyScores`). Unknown types have no key, so `UnknownSection` falls back to the backend-supplied `title` as-is. This is the one sanctioned place where server text reaches the UI, and it exists precisely so an unknown type degrades to something readable rather than a blank card.

**Also required**

- `status: 'pending'` is a real UI state — reports generate asynchronously and can take minutes. Poll with backoff, show progress, never an infinite spinner.
- `status: 'failed'` offers regeneration and says what a recruiter can do meanwhile (read the transcript).
- Every AI-generated conclusion is visibly labelled as AI output and traceable to the answer it came from. Under the EU AI Act, AI-assisted hiring is high-risk: your customers will be asked to justify decisions, and *"the model said 72"* is not defensible without the evidence behind it.
- Scores never render without their basis — one click from a competency score to the answer that produced it.
- Reports are exportable (PDF). Hiring managers forward them; without an export they will screenshot it.

---

## 18. Internationalization & localization

Built in Phase 0, not retrofitted. Retrofitting i18n across twenty modules means touching every file in the product, and the retrofit is exactly the kind of sweeping mechanical change that generated code gets subtly wrong.

### 18.1 Four content classes — the most important distinction in this section

| Class | Examples | Rule |
|---|---|---|
| **A. Product UI** | "Create job", "No candidates found", "Save changes", column headers, validation messages | Fully translated. The Claude translation agent may propose these. |
| **B. System-generated** | Invitation emails, interview reminders, notification text | Localized **server-side at send time, in the recipient's locale** — not the actor's. Backend owns these catalogs; the API contract carries `recipientLocale`. |
| **C. Customer-created** | Job descriptions, interview questions a recruiter wrote, custom stage names, company bios | **Never auto-translated. Never modified.** Rendered exactly as entered. |
| **D. AI-generated** | Transcripts, AI report summaries, competency rationales | Generated in a declared language and **tagged with it**. Never post-translated. |

Class C is where most products get this wrong. If a recruiter writes *"Tell us about your experience building React applications"*, that string is customer data, not UI copy. It never enters `messages/`, never passes through a translation agent, and never changes because someone switched the dashboard to German.

Class D deserves its own rule because of the audit requirement: **a transcript is evidence.** It is in the language the candidate actually spoke, and translating it destroys its evidentiary value under the EU AI Act's justification requirements. Offer a *"view translation"* affordance if customers ask, rendered alongside the original and clearly labelled — never in place of it.

The AI report is generated in the recruiter's locale at generation time and stores `language`. If a different recruiter with a different locale opens it later, they see the report in its generated language with a label saying so — **not a silent re-translation of a hiring assessment.**

### 18.2 Library, routing and locale resolution

**next-intl**, chosen for ICU message support, RSC awareness, and locale-aware date and number formatting in one dependency.

**Locale routing is a hybrid, and deliberately so:**

| Surface | Locale source | Why |
|---|---|---|
| Admin dashboard | User profile preference → cookie | Authenticated, not SEO-indexed. URL prefixes would complicate every internal link and every E2E selector for no benefit. |
| Candidate interview flow | **URL segment** — `/interview/[locale]/[token]` | Public, shareable, sessionless. The candidate's language comes from the invitation, and the link must carry it. |

**The candidate's locale is not the recruiter's locale.** It is configured per job (or per invitation) and travels with the invitation link. A Dutch agency hiring in Spain sends Spanish invitations from a Dutch dashboard. Getting this wrong means candidates receive interview instructions in a language they do not read — and they simply do not complete the interview.

Resolution order for the dashboard: user profile setting → cookie → `Accept-Language` → `en-US`.

```ts
// lib/i18n/config.ts
export const LOCALES = [
  { code: 'en-US', name: 'English',    direction: 'ltr' },
  { code: 'nl-NL', name: 'Nederlands', direction: 'ltr' },
  { code: 'de-DE', name: 'Deutsch',    direction: 'ltr' },
  { code: 'ar',    name: 'العربية',     direction: 'rtl' },
] as const

export const DEFAULT_LOCALE = 'en-US'
export type Locale = (typeof LOCALES)[number]['code']
```

### 18.3 English is canonical

`messages/en-US.json` is the source of truth. Developers add keys **only** to English; they never hand-edit eight files.

**Keys are stable identifiers, namespaced by feature — never English text.**

```json
{
  "Jobs": {
    "createJob": "Create job",
    "deleteJob": "Delete job",
    "empty": { "title": "No jobs yet", "action": "Create your first job" }
  },
  "Workflow": { "moveCandidate": "Move candidate" },
  "Reports": { "aiScore": "AI score" }
}
```

```json
{ "Create job": "Create job" }     // ❌ never
```

English-as-key breaks the moment the English copy is reworded: every locale silently falls back, and nobody notices until a customer reports a half-English screen. Namespaces mirror feature folders, so `features/jobs/` uses `useTranslations('Jobs')` and key ownership is obvious.

### 18.4 No hardcoded user-facing strings

```tsx
<Button>Create job</Button>          // ❌ fails lint
<Button>{t('createJob')}</Button>    // ✅
```

Enforced by `eslint-plugin-i18next` (`no-literal-string`) scoped to `src/features` and `src/components`, as a **CI-blocking error**. Allowlist: `data-testid`, `aria-*` values that are identifiers, and Class C customer content rendered from data.

**Instruction for any AI coding agent, to be included verbatim in every module prompt:**

> Never introduce a user-facing string directly into JSX/TSX. Add a key to `messages/en-US.json` under the feature's namespace and reference it with `t()`. Do not add keys to any other locale file. Do not translate customer-created content.

Server Components use `getTranslations`, Client Components `useTranslations`. Mixing them up either breaks the build or ships the whole catalog into the client bundle — the second is silent, so it is checked in the bundle-size review (Section 22).

### 18.5 ICU messages and pluralization

```json
{
  "candidatesSelected": "{count, plural, =0 {No candidates} =1 {1 candidate} other {# candidates}}",
  "interviewsRemaining": "{count, plural, one {# interview left} other {# interviews left}}"
}
```

Manual `count === 1 ? 'candidate' : 'candidates'` is banned. English has two plural forms; Polish has four and Arabic has six. Hand-rolled logic is not merely inelegant — it is **wrong** in most of the languages you will eventually add, and the bug is invisible to anyone who only reads English.

Same for gendered and ordinal messages: ICU `select` and `selectordinal`, never string concatenation. **Never build a sentence from fragments** — word order differs by language, and a concatenated sentence cannot be translated correctly no matter how good the translator is.

### 18.6 Locale ≠ timezone

Two independent axes, both required on every timestamp render:

```
Locale  nl-NL          →  format:  11-08-2026 14:30 · 1.234,56 · € 1.234,56
Timezone Europe/Amsterdam →  instant: which wall-clock moment 14:30Z maps to
```

A recruiter may run the UI in `en-US` while sitting in `Europe/Amsterdam`, or vice versa. Both are stored on the profile, both are returned with the session, and both are passed to every formatter.

```ts
// lib/utils/datetime.ts — the only place formatting happens
export const formatDateTime = (iso: string, locale: Locale, tz: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium', timeStyle: 'short', timeZone: tz,
  }).format(new Date(iso))

export const formatNumber   = (n: number, locale: Locale) => ...
export const formatCurrency = (amount: number, currency: string, locale: Locale) => ...
export const formatDuration = (seconds: number, locale: Locale) => ...    // 154 → "2m 34s"
export const formatRelative = (iso: string, locale: Locale, tz: string) => ...
```

Currency carries its **own** code from the API (`{ amount: 4900, currency: 'EUR' }`) and is never inferred from the locale. A US-locale recruiter viewing a euro invoice must see euros.

### 18.7 RTL-ready, not RTL-shipped

The honest position: making the codebase RTL-*capable* is nearly free at the start and brutally expensive to retrofit. Making it RTL-*complete* — QA, icon mirroring, chart direction, design review in Arabic — is real work that should wait for a real customer.

**Do now, in Phase 0:**

- `<html lang={locale} dir={direction}>` driven by the locale config.
- **Logical Tailwind properties only.** `ms-4` / `me-4` / `ps-6` / `pe-6` / `start-0` / `end-0` — never `ml-4`, `mr-4`, `pl-6`, `left-0`. Enforced by an ESLint rule banning the physical variants in feature code, exactly as arbitrary colour values are banned in Section 19.
- `text-start` / `text-end` instead of `text-left` / `text-right`.
- Directional icons (chevrons, arrows, back buttons) resolved through one `<DirectionalIcon>` helper that flips on RTL, so the rule lives in one file.

**Defer until a customer needs it:** Arabic translation, RTL visual QA, chart and timeline direction, RTL screenshots in the visual-regression suite.

This is cheap insurance now against an expensive rewrite later — the sidebar, tables, drawers, dialogs, candidate cards, workflow stages and report layouts are all directional, and there will be far more of them in six months.

### 18.8 The backend stays language-neutral

**The API returns machine identifiers. The frontend supplies the words.**

```json
{ "status": "shortlisted" }             // ✅
{ "status": "Auf der Auswahlliste" }    // ❌
```

```
status = "shortlisted"  →  t('candidateStatus.shortlisted')  →  "Shortlisted"
```

Applies to: candidate and job statuses · roles and permissions · error codes (Section 7.3) · media lifecycle states and failure codes (Section 16.2) · AI report section types (Section 17) · event and audit-log types · notification types.

Every enum value the backend can return must have a translation key. **CI enforces this**: a script reads the enums from `openapi.yaml` and fails if any value lacks a key in `en-US.json`. This is why the enum set is jointly owned (Section 6.1) — the backend adding a status without telling anyone produces a raw `in_review_pending` string in a customer's UI.

Error handling follows the same rule: `t('errors.' + code)`, falling back to the API's English `message` only when no key exists, and reporting the missing key to Sentry so it gets added.

### 18.9 The translation agent

Yes — use Claude as an automated translation PR agent, with `en-US.json` canonical, CI as the authority, and the agent as a proposer rather than a decider.

**Scope.** The agent may write to `messages/*.json` (except `en-US.json`) and nothing else. It has no permission to touch application code. This is enforced by CI path rules, not by instruction — an agent PR touching `src/` is rejected automatically.

**Job:**

1. Read `messages/en-US.json`
2. Diff against each target locale
3. Translate missing or changed values
4. **Preserve ICU variables** (`{name}`, `{count}`) exactly — a translation dropping `{count}` is rejected
5. Preserve rich-text tags and placeholders
6. Preserve the key structure; never rename, reorder or remove keys
7. Validate JSON and ICU syntax
8. Run the translation test suite
9. Open or update one PR per batch, labelled `i18n`

**Rules the agent must follow:**

- Never translate Class C or Class D content (18.1). It cannot reach them anyway — they are not in `messages/`, which is exactly why the scope restriction is drawn there.
- Never touch `en-US.json`. English changes come from developers.
- Translations for **legal and consent copy** — GDPR consent, AI disclosure notices, terms, data-retention text — are marked `"reviewRequired": true` in a sidecar `messages/meta.json` and **must have human or legal review before merge**. A machine-translated consent notice is a compliance risk, not a convenience.
- Every machine translation is recorded in `messages/meta.json` with `source: "machine"` and the date, so reviewed and unreviewed strings are distinguishable later. Human edits flip it to `source: "human"`.
- Preserve product nouns and brand terms from a glossary file (`XInterview`, `Workflow`, `AI Report`) — untranslated unless the glossary says otherwise.

**A human reviews and merges.** The agent proposes; CI validates; a person approves. That ordering is the whole design.

### 18.10 Translation CI gates

**Hard failures:**

| Check | Why |
|---|---|
| Missing key in any locale | Half-translated screens |
| Extra key not in `en-US.json` | Dead strings accumulating |
| Invalid JSON | Breaks the build at runtime, not compile time |
| Invalid ICU syntax | Throws on render, in production, in one locale |
| Missing interpolation variable | `"Hello , you have candidates."` |
| Broken rich-text tag | Renders raw markup |
| Duplicate key | Silent overwrite |
| Unsupported locale file | Ships a locale nothing can select |
| Enum value with no translation key (18.8) | Raw `in_review_pending` in the UI |
| Hardcoded string in `src/` (18.4) | The rule with no teeth otherwise |

**Warnings:** translation identical to English (possibly untranslated) · unusually short or long relative to source · new English key not yet translated · a `reviewRequired` string still marked `source: machine`.

CI is the authority. The agent is an assistant.

### 18.11 Testing i18n

- **Pseudo-localization locale** (`en-XA`) available in development: `[Ĉŕéáţé ĵöƀ ~~~~]`. Accented characters expose hardcoded strings instantly; the padding exposes layout that breaks on longer languages. German runs roughly 30% longer than English and is what usually overflows a button.
- One E2E spec runs the full Create Job flow in `nl-NL` — catching not just translation gaps but date, number and layout assumptions.
- Visual-regression baselines include one screen in the pseudo-locale.
- Unit tests assert ICU plural output at `0`, `1` and `2` for every plural message.
- The candidate interview flow is tested in a locale different from the recruiter's session locale, because that is the real-world case and the one most likely to be wired wrong.

---

## 19. Design system integration

The XInterview Design System document (Geist/Vercel direction) is authoritative and strictly followed. This section covers only how it is **enforced in code**.

**Three layers, in order:**

1. **Tokens** — CSS custom properties for colour, spacing, radius, shadow, type scale. Light and dark. Nothing else defines a value.
2. **Primitives** — `components/ui/*`: shadcn re-skinned to the tokens.
3. **Patterns** — `components/patterns/*`: `PageHeader`, `DataTable`, `EmptyState`, `StateBoundary`, `FilterBar`, `ConfirmDialog`, `StatCard`.

**Enforced by lint, as CI-blocking errors:**

- No arbitrary Tailwind values (`text-[#333]`, `p-[13px]`) in feature code. A missing value is added to the token set, not inlined.
- No physical direction utilities (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`) — logical properties only (Section 18.7).
- No literal user-facing strings (Section 18.4).

These three rules are what stop a module-by-module generated build from drifting into six slightly different greys, an un-RTL-able layout, and a half-translated product. They cost nothing on day one and cannot be applied retroactively without touching every file.

**Copy rules** (they shape the design as much as spacing does): sentence case everywhere · buttons name what happens — "Create job", never "Submit" · an action keeps its name through the whole flow, so a "Publish" button produces a "Published" toast · errors state what went wrong and how to fix it, and never apologise · empty states are an invitation to act, not a shrug. Write English copy for translatability: full sentences in one key, no concatenation, no idioms, no puns.

---

## 20. The five-state contract

Every screen and every meaningful component handles all five. This is the first thing a reviewer checks.

| State | Requirement |
|---|---|
| **Loading** | Skeleton matching the real layout's shape and height. No full-page spinners, no layout shift on arrival. |
| **Empty** | Icon or illustration, one line of explanation, one primary action. *"No candidates yet — invite your first candidate."* |
| **Error** | What failed, what to do, a Retry button, and the `requestId` in small text for support. Never a raw stack trace or a bare "Something went wrong." |
| **No permission** | Explains the restriction and who to ask. Not a 404, not a blank page. |
| **Populated** | The designed screen. |

Error boundaries sit at the **segment** level: `app/(dashboard)/workflow/error.tsx` keeps the shell and sidebar alive when the workflow panel fails. A single root boundary that blanks the whole app is worse than the error it catches.

---

## 21. Accessibility floor

Not a polish phase — a build requirement, and increasingly a procurement requirement in enterprise HR sales.

- Every interactive element keyboard-reachable with a visible focus ring (the Design System's focus token; `outline: none` banned).
- Modals and drawers trap focus and restore it to the trigger on close.
- Contrast 4.5:1 for body text, 3:1 for large text and UI borders — **in both themes**. Verify dark mode explicitly; that is where it usually fails.
- Status never conveyed by colour alone. A pipeline stage badge carries a label, not just a hue.
- Live regions announce async results: *"Job created"*, *"3 candidates moved to Shortlisted"* — translated, like everything else.
- `prefers-reduced-motion` respected on every transition.
- Forms: labels bound to inputs, errors linked via `aria-describedby`, `aria-invalid` set.
- The candidate interview flow gets extra scrutiny — captions on playback, keyboard-operable recording controls, no time limits that cannot be extended.
- `@axe-core/playwright` runs on the top ten screens in CI; serious and critical violations fail the build.

---

## 22. Performance budget

| Metric | Budget |
|---|---|
| LCP (dashboard, p75) | < 2.0s |
| INP | < 200ms |
| CLS | < 0.1 |
| First-load JS per route | < 200KB gzipped |
| Table interaction (filter → paint) | < 100ms |
| Interview page ready (device check → recording) | < 3s |

How the budget is held: Server Components by default with `'use client'` at the leaves · dynamic imports for the video player, charts and rich-text editor · `next/image` everywhere with explicit dimensions · `next/font` self-hosting Geist · `<Suspense>` streaming for slow panels · prefetch on row hover so detail views feel instant · `@next/bundle-analyzer` reviewed at every module merge, not at the end.

**Message catalogs count against this budget.** Ship only the active locale, split by namespace where a route needs it. The common failure is importing the whole catalog into a Client Component and shipping every namespace to every route — check for it in the bundle review, since nothing else will catch it.

The AI report and the interview player are where this budget is actually tested. Design both for streaming from the start.

---

## 23. Testing strategy

```
        ╱ E2E — Playwright ╲          ~16 specs, critical journeys only
      ╱ Integration — Vitest ╲        ~100, feature slices against MSW
    ╱  Unit — Vitest           ╲      as many as useful, pure logic
```

**Do not chase a coverage percentage.** Cover the flows where a bug costs a customer.

**Unit / integration (Vitest + RTL + MSW).** Query and mutation hooks · Zod schemas including invalid cases · `can()` permission logic · the wizard reducer · filter → query-param mapping · **timezone formatting with the machine clock in a non-European zone** · ICU plurals at 0/1/2 · report renderer fallback on an unknown section type · idempotency key stability across retries. Test what a user sees and does (`getByRole`, `getByLabelText`), never internal state.

**E2E (Playwright) — the sixteen that matter:**

1. Login with Turnstile → dashboard
2. Login failure → clear error, no session leak
3. Rate limit engages after repeated failures
4. Logout clears session; back button does not restore the dashboard
5. Create Job wizard, all five steps, publish
6. Wizard refresh mid-way → draft restored
7. Wizard validation blocks progress with a clear message
8. Double-submit of an invitation sends **one** email (idempotency)
9. Candidate device check → interview → thank you page
10. Interview upload survives a simulated network drop (offline → online)
11. Workflow: filter, sort, paginate — state survives reload and is shareable
12. Conflicting edit produces the 409 dialog, not a silent overwrite
13. Media `PARTIAL` state: video and transcript render while evaluation shows failed + retry
14. Open the AI report, add a comment, export
15. **Org switch clears cached data from the previous org**
16. Recruiter cannot reach billing (UI hidden *and* direct URL redirects); plus the full Create Job flow in `nl-NL`, and an axe scan across the ten main screens in both themes

```ts
// tests/setup/auth.setup.ts — log in once, reuse everywhere
setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('admin@xinterview.test')
  await page.getByLabel('Password').fill('test-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/jobs')
  await page.context().storageState({ path: 'tests/.auth/admin.json' })
})
```

One Playwright project per role (`admin`, `recruiter`, `interviewer`), each reusing its own storage state. Config: `retries: 2` in CI, `trace: 'on-first-retry'`, `fullyParallel: true`, sharded across 4 runners.

**Rules:** no `waitForTimeout` — wait on a role or a response · no test depends on another's leftovers · a flaky test is fixed or deleted the same week, never re-run until green · selectors use roles and labels, so they survive copy changes and work across locales.

**Visual regression:** `toHaveScreenshot()` on ~10 key screens in both themes plus one pseudo-locale screen, mock data on a fixed faker seed.

---

## 24. Observability

**Sentry — install it, and configure it deliberately.** Defaults will either exhaust the quota or leak candidate PII.

```ts
Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  environment: env.NEXT_PUBLIC_APP_ENV,
  release: env.NEXT_PUBLIC_GIT_SHA,

  tracesSampleRate: isProd ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.0,        // don't record everyone
  replaysOnErrorSampleRate: 1.0,        // record the sessions that broke

  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true, maskAllInputs: true }),
  ],

  ignoreErrors: ['ResizeObserver loop limit exceeded', 'AbortError', /^Non-Error promise rejection/],

  beforeSend(event) {
    scrubHeaders(event, ['authorization', 'cookie', 'x-api-key'])
    scrubPII(event)                     // emails, candidate names, transcript text
    return event
  },
})
```

Also required: **EU data region** · source maps uploaded and stripped from the client bundle · `tunnelRoute: '/monitoring'` so ad blockers don't silently drop reports · releases tagged with the git SHA · `requestId` and `locale` attached to every API error event · alerts to Slack, thresholded so they stay meaningful.

**PostHog** (EU-hosted) covers product analytics, funnels and feature flags. Track events, never PII: `job_created`, `wizard_step_completed`, `wizard_abandoned`, `interview_started`, `interview_abandoned`, `upload_retry`, `report_viewed`, `missing_translation_key`.

`interview_abandoned` with its step property is the single most valuable metric this product has — it tells you exactly where candidates give up, which is where revenue leaks. `upload_retry` is second: a rise there is a media problem surfacing before support tickets do.

**Feature flags** gate every module during the rebuild, so half-finished work merges to `main` without shipping to customers.

---

## 25. CI/CD

```yaml
jobs:
  contract:  generate types from openapi.yaml · fail if the generated file drifts
             oasdiff — FAIL on a breaking spec change
             enum coverage — FAIL if any API enum lacks a translation key
  quality:   typecheck · eslint (incl. no-literal-string, logical-properties,
             no-arbitrary-values) · prettier --check
  i18n:      key parity · ICU validity · interpolation variables · duplicate keys
  unit:      vitest run --coverage
  build:     next build  (fails on any type or env error)
  e2e:       playwright, 4 shards, traces uploaded on failure
  a11y:      axe scan on key screens
  security:  pnpm audit --audit-level=high
  guard:     assert NEXT_PUBLIC_API_MOCKING=disabled   (production build only)
```

Every PR gets a preview deployment **with mocks enabled**, so design and product review the real thing instead of a screenshot, and reviewers never need backend availability. `main` deploys to development automatically, staging on merge, production on a tagged release with manual approval.

Agent-authored PRs (`i18n` label) run the same pipeline and are additionally rejected if they touch any path outside `messages/`.

---

## 26. Conventions

- **Branches:** `feat/workflow-stage-tabs`, `fix/login-captcha-reset`
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `i18n:`)
- **PRs:** under ~400 lines where possible · screenshots for UI changes, both themes · DoD checklist ticked
- **Naming:** components `PascalCase.tsx`, hooks `use-thing.ts`, everything else `kebab-case`
- **Comments** explain *why*, never *what*
- **ADRs** in `docs/adr/` for any deviation from Section 2 — one page: context, decision, consequences

---

## 27. Definition of Done — per module

A module is not finished until every line is true:

**Design & UX**
- [ ] Matches the XInterview Design System — tokens only, no hardcoded values
- [ ] All five states implemented (loading, empty, error, no-permission, populated)
- [ ] Responsive from 360px up; light and dark both verified
- [ ] Keyboard navigable, focus visible, axe clean
- [ ] Copy reviewed against Section 19

**Data & contracts**
- [ ] Types generated from the OpenAPI spec — no hand-written API types, no manual generics
- [ ] MSW handlers go through `mocks/repo/*` (never storage directly), take `orgId` first, and ship error + empty scenarios
- [ ] Pagination, filter and sort follow Section 7.2 exactly
- [ ] Any POST with an external side effect sends an `Idempotency-Key` generated once per intent
- [ ] Mutations send `If-Match`; 409 shows the conflict dialog
- [ ] Non-terminal media/report states have designed screens, and polling backs off
- [ ] Data requests go directly to the backend; only auth, upload signing and monitoring use BFF routes

**State & forms**
- [ ] Server state in Query (keys scoped by `orgId`), view state in the URL
- [ ] Forms validated with Zod, messages as translation keys, API `fieldErrors` mapped
- [ ] Permissions enforced in UI **and** middleware

**i18n**
- [ ] Zero hardcoded user-facing strings; all keys added to `en-US.json` only
- [ ] Plurals use ICU, not manual logic
- [ ] Dates, numbers and currency go through the locale-aware formatters
- [ ] Logical properties only — no `ml-`/`mr-`/`left-`/`right-`
- [ ] Every new API enum value has a translation key
- [ ] Customer-created content rendered as entered, never translated

**Quality**
- [ ] Unit tests on logic; at least one E2E on the happy path
- [ ] No console errors or warnings
- [ ] Route's first-load JS within budget
- [ ] Behind a feature flag until sign-off

---

## 28. Build order

### Phase 0 — Foundation. Nothing else starts until this is complete.

| Group | Items |
|---|---|
| **Base** | Repo · TypeScript strict · pnpm · ESLint/Prettier with all three blocking rules |
| **Design** | Design tokens (light + dark) · shadcn re-skinned · the five state components · `DataTable` pattern |
| **Contract** | `openapi.yaml` in CI · type generation · `oasdiff` gate · `openapi-fetch` client · server client · error contract · idempotency helper |
| **Mocks** | MSW browser + node (`instrumentation.ts`) · repository layer · `@mswjs/data` for flat entities · scenarios · fixed-seed fixtures |
| **Auth** | BFF routes · Turnstile · rate limiting · middleware · RBAC matrix · org switching with cache clear |
| **i18n** | next-intl setup · locale config with `direction` · `en-US.json` skeleton · hybrid routing (cookie for dashboard, URL for interview) · locale-aware formatters · enum-coverage check · translation CI gates · pseudo-locale · agent scope rules |
| **Platform** | Env validation + environment badge · `datetime` utilities · Sentry · PostHog · feature flags |
| **CI** | Full pipeline · preview deploys with mocks · Playwright auth setup |

Every hour skipped here is repaid with interest in every module afterwards. When module code is generated by an AI tool, **Phase 0 is what the generator conforms to** — without it, each module invents its own table, loading convention, fetch pattern and string handling, and you spend the rebuild reconciling them instead of building.

The three lint rules and the i18n foundation are singled out because they are the only items on this list that **cannot be added later without touching every file in the product**.

### Phases 1–5

| Phase | Module | What it proves |
|---|---|---|
| **1** | Create Job wizard | Forms, multi-step URL state, drafts, validation, idempotency. The hardest form in the product — doing it first proves the patterns. |
| **2** | Workflow / pipeline | Tables, filters, URL state, permissions, comments, share links, polling, conflict handling. The screen your customers live in. |
| **3** | Candidate interview experience | Device checks, media permissions, chunked recording, network resilience, candidate locale. Highest risk — test on real mid-range Android over a throttled network, not a desktop browser on office wifi. |
| **4** | AI report, candidates list, settings, team, billing, notifications | Tolerant rendering, media lifecycle states, the long tail. |
| **5** | Hardening | Performance pass against Section 22 · full a11y audit · visual-regression baselines · load test · penetration test before enterprise sales conversations. |

---

## 29. Anti-patterns

In rough order of likelihood:

1. **Building modules before Phase 0 is complete.** Guarantees three DataTables and four button variants.
2. **Hand-written API types or manual generics.** They drift from the spec within two sprints and nobody notices until production.
3. **Mocks that ignore the request.** They make everything look finished and teach the UI nothing about pagination, empty states or failure.
4. **Server data copied into `useState`.** Stale lists after every mutation.
5. **Filters and tabs in React state.** Breaks link sharing, breaks the back button, breaks E2E.
6. **Hardcoded strings shipped "temporarily."** They are never removed, and the retrofit touches every file.
7. **Manual plural logic.** Correct in English, wrong in most languages you will add, invisible to anyone reading English.
8. **Auto-translating customer or AI-generated content.** Corrupts recruiter-written questions and destroys the evidentiary value of transcripts.
9. **Physical direction utilities (`ml-`, `left-`).** Cheap to avoid now, an entire redesign to fix later.
10. **Naive datetimes, or conflating locale with timezone.** Interviews an hour off, and the bug reports come from customers rather than tests.
11. **Proxying all data requests through Next.js.** Doubles latency on the busiest screen and pays compute to forward bytes.
12. **MSW enabled only in the browser.** Server Components bypass the service worker and hit an API that may not exist — the failure looks like a mysterious environment bug.
13. **Idempotency keys regenerated on retry.** No better than none, and the failure is 40 duplicate emails to candidates.
14. **A single "processing failed" state for media.** Hides a working video and transcript because the AI step failed.
15. **Mock handlers reaching into storage directly.** Makes the storage choice irreversible and lets org scoping be forgotten one handler at a time.
16. **Org switch without clearing the cache.** A confidentiality breach that passes every single-org test.
17. **A strict enum on AI report section types.** One backend release blanks the most valuable screen in the product.
18. **`'use client'` at the top of a page.** Discards the reason for choosing the App Router.
19. **Permission checks only in the UI.** A hidden button is not access control.
20. **Sentry at default settings.** Quota gone in a week, candidate PII in your error reports.
21. **Tests written after the module is "done."** Tests written last are written to pass, not to catch.
22. **Two ways to do one thing.** The most expensive item on this list, and the easiest to let happen.

---

## 30. Version history

| Version | Change | Rationale |
|---|---|---|
| 1.0 | Initial standard | — |
| 1.1 | `openapi-fetch` replaces generic `apiFetch<T>` | A hand-written generic re-introduces the drift the OpenAPI pipeline exists to prevent |
| 1.1 | `/api/v1/` prefix **plus** an `oasdiff` breaking-change gate | The prefix alone doesn't protect a lockstep-deployed dashboard; the CI gate does |
| 1.1 | Four environments; no `.env.production` in the repo; visible env badge | Removes manual `.env` editing and the prod-mistaken-for-dev incident |
| 1.1 | Section 7 — global API conventions, including the timezone standard | One `DataTable` and one error handler can serve the whole product |
| 1.1 | Section 16 media handling · Section 17 tolerant AI report · Section 13 freshness and conflicts · Section 11 tenant isolation | The four highest-risk areas of this specific product |
| 1.2 | Contract ownership matrix with joint ownership and frontend review rights on spec PRs | Prevents both stalling and silent breakage |
| 1.2 | Thin-BFF request paths made explicit; MSW required in `instrumentation.ts` | v1.1 was ambiguous; Server Components bypass the service worker |
| 1.2 | Mock repository layer; `@mswjs/data` scoped to flat entities | Makes the storage choice reversible and org scoping structural |
| 1.2 | `Idempotency-Key` on side-effecting POSTs, keyed per intent | Stops duplicate invitations to candidates |
| 1.2 | Per-artifact media states and a failure envelope | Transcript-ready-but-evaluation-failed is common and must degrade gracefully |
| **2.0** | **Section 18 — internationalization and localization**, with four content classes, hybrid locale routing, ICU, locale≠timezone, RTL-ready, language-neutral API, scoped translation agent, CI gates | i18n cannot be retrofitted across twenty modules without touching every file |
| **2.0** | Two new blocking lint rules: no literal strings, logical properties only | The only Phase 0 items that cannot be applied retroactively |
| **2.0** | Zod validation messages become translation keys; enum-coverage CI check | The two places English otherwise leaks back into a localized product |
| **2.0** | All previous documents consolidated into this one | One source of truth, per Section 0 |

---

**Maintenance.** This document lives at `docs/architecture.md`. Changes to Section 2, or to the shared contracts in Sections 6, 7, 16, 17 and 18.8, require an ADR and backend agreement. Review at the end of every phase.

**The architecture is complete. Start Phase 0.**
