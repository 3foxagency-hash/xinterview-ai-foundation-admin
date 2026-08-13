# Mock API layer

MSW (Mock Service Worker) intercepts at the **network** layer, so application
code never knows it is running against mocks. There is no `if (isMock)` branch
anywhere in `app/`, `components/` or `lib/` — that absence is the entire reason
for choosing MSW over mock functions.

When the backend ships an endpoint, you delete a handler and flip one
environment variable. No call site changes.

---

## Quick start

```bash
git clone … && npm install
npm run dev                     # http://localhost:3000
```

**No env setup needed.** `.env.development` is committed with mocking enabled,
so a fresh clone runs against mocks immediately — nothing has to be listening on
`localhost:8080`.

The bottom-left badge shows the current environment and a `MOCK` chip. Click the
chip to switch scenarios.

### Pointing at a real backend

```bash
npm run dev:live                # mocks off for this run only
```

Or create `.env.local` (gitignored, overrides everything):

```bash
NEXT_PUBLIC_API_MOCKING=disabled
NEXT_PUBLIC_API_BASE_URL=https://xdev.xinterview.xyz
```

### Which env file wins

Next.js loads these in order, first match wins:

| File | Committed? | Purpose |
|---|---|---|
| `.env.local` | no — gitignored | Your personal overrides |
| `.env.development` | **yes** | Shared dev defaults: mocks on |
| `.env` | no — gitignored | Legacy; prefer `.env.local` |

`.env.production` deliberately does **not** exist. Production values come from
host/CI secrets, and `NEXT_PUBLIC_APP_ENV=production` forces mocking off no
matter what any env file says.

### Deploy previews

A preview build (Netlify, Vercel) runs `next build`, which does **not** load
`.env.development` — so mocks are off and the app will call whatever
`NEXT_PUBLIC_API_BASE_URL` points at. To get a preview with mocks on, set these
in the host's environment for preview branches:

```
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_MOCKING=enabled
```

That is what lets design and product review a branch without backend
availability.

### Test credentials

> Auth paths follow the agreed target naming (`/auth/tokens`,
> `/user-management/me/`), not the invented `/api/v1/auth/*` used before. See
> `docs/auth-api-real-contract.md` §4.

| Email | Password | Exercises |
|---|---|---|
| `admin@xinterview.ai` | `password123` | Happy path, verified, has company |
| `recruiter@xinterview.ai` | `password123` | Happy path, verified, has company |
| `locked@xinterview.ai` | `password123` | 429 lockout with `Retry-After` (mock-only — the real API has no lockout) |
| `unverified@xinterview.ai` | `password123` | Unverified, no company |
| anything else | — | **404** `{"detail": "Invalid credentials"}` — matches the real API, which uses 404 rather than 401 |

Five consecutive failures against a **real** seeded account locks it for an
hour, so the lockout path is reachable by hand rather than only via the fixture.

### OTP codes

| Code | Result |
|---|---|
| `123456` | Verifies. On `mode: 'signup'` it also flips the account to verified |
| `111111` | 403 `{"detail": "OTP has expired"}` |
| any other | 403 `{"detail": "OTP has mismatch"}` — the real API's exact wording |

OTPs are **6 digits**, confirmed against real verification emails. Resend is
capped at 3 per email; the 4th returns 429.

### Invite slug

`?invite=acme` resolves to Acme Corp. Any other slug returns 404.

**Company onboarding enums** (confirmed against the live API — the wire value is
not the label for `account_type`, and *is* the label for `business_type`):

- `account_type`: `CO` (Corporate) · `AG` (Agency)
- `business_type`: one of 7 long strings, sent verbatim — e.g.
  `Limited Liability Company / LLC / LLP`. The short form `LLC` is **rejected**.

### Jobs / create-job wizard

Seeded job `job_01hxseed` ("Senior Frontend Engineer") exists so later wizard
steps can be opened directly without creating a job first.

| Behaviour | How to trigger |
|---|---|
| Validation errors | Title under 2 chars; a deadline that is not `YYYY-MM-DD` |
| Plan-gated format | Create with `ai_avatar` / `ai_voice` / `ai_phone` → 403 `FORMAT_NOT_AVAILABLE`. Only `ai_video` is enabled |
| Immutable format | `PATCH /jobs/:id` with a new `format` — silently ignored, as after creation the format is fixed |
| Untitled question | Save a question with a blank title → field error naming the index |
| Team invariant | Removing the creator is a no-op; the roster keeps them |
| Duplicate / invalid invites | Bulk invite with a malformed email, a repeat in the batch, or an already-invited address → reported per row, the rest still succeed |
| Plan cap | Seeded plan is 94/100. Invite 10 candidates → 6 accepted, 4 failed with a limit reason |
| Idempotency replay | Send the same `Idempotency-Key` twice to `POST /jobs` or `/invitations` → the original response, not a second job or second email |

Cross-tenant isolation is testable via the dev-only `x-mock-org-id` header: a job
created in the seeded org reads as **404** under a different org id. The app never
sends that header — tenant scoping must not be client-selectable — it exists so
the isolation itself can be asserted in tests.

---

## Environment switch

`APP_ENV` and `API_MOCKING` are **independent axes**. Collapsing them into one
variable would lose the most useful setup in daily work: dev config pointed at
dev infrastructure, but mock data because the endpoint does not exist yet.

```bash
NEXT_PUBLIC_APP_ENV=local|development|staging|production
NEXT_PUBLIC_API_MOCKING=enabled|disabled|partial
NEXT_PUBLIC_MOCK_RESOURCES=auth,jobs        # only read when partial
```

`partial` is what integration week actually looks like — endpoints going live
one at a time:

```bash
# auth is live on the backend; everything else still mocked
NEXT_PUBLIC_API_MOCKING=partial
NEXT_PUBLIC_MOCK_RESOURCES=jobs,candidates,reports
```

Mocking is **force-disabled whenever `APP_ENV=production`**, regardless of the
mocking flag, in three independent places: `lib/config/env.ts`,
`instrumentation.ts`, and the build-time constants in the providers.

---

## Scenarios

Switchable from the dev panel; applies to the next request, no reload.

| Scenario | Effect |
|---|---|
| `default` | Happy path |
| `empty` | List endpoints return zero records |
| `error500` | Every call returns 500 |
| `slow` | 3s latency, for testing loading states |
| `forbidden` | Every call returns 403 |
| `rateLimited` | 429 with `retryAfter` |
| `offline` | Genuine network failure — exercises `NETWORK_ERROR` |

This is what makes the five-state contract real rather than aspirational: a
reviewer sees the empty and error states in seconds without editing code, and
most production bugs live in exactly the states nobody looked at.

---

## Structure

```
mocks/
  browser.ts          setupWorker — Client Component fetches
  server.ts           setupServer — RSC, Route Handlers, tests
  db.ts               in-memory store + seed data
  scenarios.ts        scenario state, persisted to localStorage
  handlers/
    index.ts          registry; filters itself by MOCK_RESOURCES
    scenario.ts       applies the active scenario before any handler logic
    auth.ts           auth endpoints
    jobs.ts           job wizard: setup, questions, team, invitations
  repo/
    auth.ts           \
    jobs.ts            > the only modules that touch the store
    query.ts          parseListQuery / applySort / applyFilters / paginate
    idempotency.ts    key store + replay
    session.ts        resolves orgId and acting member for a request
    respond.ts        shared envelope + error builders
```

### Migrated so far

| Resource | Status |
|---|---|
| `auth` | Fully mocked via MSW, against the **real backend contract** captured from dev — see `docs/auth-api-real-contract.md` |
| `jobs` — wizard: create, read, update, questions, team, invitations, plan | Fully mocked via MSW |
| `jobs` — customisation: branding, welcome, form, thank-you, social, experience, notifications, AI evaluation, stages, scoring | **Still in-memory** in the lower half of `lib/api/jobs.ts` |
| `candidates`, `reports`, `settings`, `profile`, `workspaces`, `email/sms templates` | **Still in-memory** in their own `lib/api/*` modules |

The in-memory modules keep working unchanged. Migrate them one resource at a
time — MSW intercepting network calls does not interfere with functions that
never make one.

**Handlers never touch the store directly.** They go through `repo/*`. That
boundary keeps the storage choice reversible — replacing the in-memory Maps is
one file, not every handler.

Every repo function for a tenant-scoped resource takes `orgId` **first**, so
tenant scoping is a compile-time property rather than a discipline. Auth is the
documented exception: you cannot know the org until the user is identified, so
`orgId` comes out of the resolved user instead.

---

## Adding an endpoint

1. Add the request/response types to `lib/api/contract.ts`.
2. Add repo functions in `mocks/repo/<resource>.ts` — `orgId` first.
3. Add handlers in `mocks/handlers/<resource>.ts`, calling `applyScenario()`
   first.
4. Register the resource in `mocks/handlers/index.ts`.
5. Add the client function in `lib/api/<resource>.ts` using `api.get`/`api.post`.

### Handler rules

- **Wildcard origin** — `*/api/v1/...` so one handler set covers browser
  fetches, RSC fetches and BFF-internal calls.
- **Latency 200–600ms** via `latency()`. Never zero: loading states must be
  visible in development or they ship untested.
- **Real request logic** — actual filtering, sorting, pagination and validation.
  A handler returning one fixture regardless of input teaches the UI nothing and
  hides every pagination bug until integration.
- **Empty and error scenarios** ship with every resource.

---

## Three gotchas that cost real time here

### 1. DevTools shows an empty Response tab

Chrome frequently fails to render the body for requests fulfilled by a Service
Worker. **The response is not empty** — it just is not displayed.

Every mocked call is therefore logged to the console with its body:

```
⇄ MSW  POST /auth/tokens  200 · 493ms
   Response: { access_token: "eyJ…", refresh_token: "eyJ…", … }
```

`__msw.log(false)` silences it. See `docs/mock-api-guide.md` §7 for the other
two ways to read the body.

### 2. MSW must be enabled in two places

The Service Worker **only intercepts browser fetches**. A Server Component
bypasses it entirely, hits a real API that may not exist, and fails — while the
client-side equivalent works fine. That asymmetry looks like a mysterious
environment bug.

Browser half: `components/providers/msw-bootstrap.tsx`
Server half: `instrumentation.ts`

### 3. Turbopack is required for dev

`npm run dev` uses `--turbopack` deliberately. Webpack cannot resolve the subpath
export conditions `@mswjs/interceptors` relies on inside the instrumentation
bundle, and fails with:

```
Module not found: Package path ./ClientRequest is not exported
```

`serverExternalPackages` does not cover the instrumentation bundle, and routing
the import through `createRequire` fails too because webpack cannot process
`node:module`. Turbopack resolves it correctly. **Do not remove the
`--turbopack` flag** without re-verifying server-side interception.

`@mswjs/data` is also deliberately **not** used: it is CJS-only, and mixing it
with the ESM `msw` build produces `ERR_REQUIRE_ESM_RACE_CONDITION` in the
instrumentation context. Plain typed Maps in `db.ts` avoid this and keep the
dependency surface small.

---

## Production safety

Mock code must never reach a customer. Three layers:

1. `isMocking` in `lib/config/env.ts` is false when `APP_ENV=production`.
2. `instrumentation.ts` returns early on production.
3. The providers gate on **build-time constants** and reach their bodies only
   through `React.lazy`, so the bundler eliminates the reference entirely.

Layer 3 is the subtle one. A render-time `if` is **not** sufficient — the
bundler keeps any component body it can see, along with its dynamic imports.
That is why `msw-provider.tsx` and `dev-mock-panel.tsx` are thin shells around
lazily-loaded modules.

Verified by `npm run guard:mocks` after a build, which fails if any mock
fingerprint is reachable from a route:

```bash
npm run build:prod        # next build + the guard
```

Wire this into CI as a required step for production builds.
