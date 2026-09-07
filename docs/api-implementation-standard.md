# XInterview — API, Mocking, Testing & Middleware Standard

> **Superseded for auth + user-management by `docs/msw-mocking.md`.** That
> document describes what's actually implemented for those two surfaces
> today (a smaller, root-level MSW setup — no `src/`, no `@mswjs/data`, no
> TanStack Query yet). This document remains the long-term target for
> jobs/candidates/reports mocking and the fuller middleware/testing stack.

**Version:** 1.0 · **Status:** Proposal for review
**Companion to:** `xinterview-frontend-architecture-v2.0.md` (the architecture standard)
**Scope:** How API work actually starts in this repo — the mock layer, the environment switch, the middleware stack, the testing regime, and the review gates that keep feature N+1 from breaking feature N.

This document answers four questions the architecture doc states as principles but does not fully operationalize:

1. **How do we mock** so a feature can be built, reviewed and merged before the backend exists?
2. **How do we switch** between mock / dev / staging / production from one env var?
3. **What middleware** sits in front of every call — retry, dedupe, rate limiting, auth refresh, correlation?
4. **How do we test** so that shipping feature N+1 cannot silently break feature N?

It also records a review of the architecture document, with the changes we propose (Section 9).

---

## 0. Where we actually are

Before proposing anything, the honest starting position — because it changes the recommendation.

| Fact | Number |
|---|---|
| Existing mock API modules (`lib/api/*.ts`) | 9 files, ~2,656 lines |
| Files importing `@/lib/api/*` | 52 |
| `.tsx` files in `app/` + `components/` | 217 |
| Files marked `'use client'` | 173 (~80%) |
| TanStack Query / SWR | not installed |
| Test framework | none installed |
| OpenAPI toolchain | none installed |

**What exists is a working mock layer at the wrong seam.** [lib/api/jobs.ts](lib/api/jobs.ts) is genuinely good mock work — it has an in-memory store, real validation, deterministic delays, error branches keyed to magic emails, even a locked-stage invariant enforced "server-side" in [lib/api/jobs.ts:619-634](lib/api/jobs.ts#L619-L634). That is more thought than most teams put into mocks.

The problem is not quality, it is **the seam**:

```
Today:      Component → getJob()  ← mocking happens HERE (the function)
Target:     Component → useJob() → api.GET('/jobs/:id') → fetch → ← mocking happens HERE (the network)
```

Mocking at the function seam means that when the backend arrives, **every one of those 2,656 lines is rewritten and all 52 call sites are re-verified**. Mocking at the network seam means the function stays, the handler is deleted, and one env var changes. That is the entire argument for MSW in Section 8 of the architecture doc, and it is correct.

**So the migration is real work, not a greenfield.** Sections 1–3 below are written with that in mind.

---

## 1. The mock layer

### 1.1 Recommendation: MSW, and why not the alternatives

The architecture doc already chose MSW. It is the right call. Recording *why*, so the decision survives the next person who suggests something simpler:

| Option | Verdict |
|---|---|
| **MSW** (Mock Service Worker) | ✅ **Chosen.** Intercepts at the network layer via Service Worker (browser) and `msw/node` (server/tests). Application code contains zero mock awareness. The same handlers serve dev, unit tests, and E2E — write once, use three times. |
| **json-server** | ❌ A separate process serving generic REST over a JSON file. Cannot express auth, idempotency replay, ETags, tenant scoping, or conditional errors without plugins. Also a second thing to run. |
| **Mirage JS** | ❌ Similar model to MSW, but browser-only (no clean `msw/node` equivalent for RSC and Vitest), and maintenance has slowed considerably. |
| **Next.js Route Handlers as mocks** (`app/api/mock/*`) | ❌ Tempting because it needs no new dependency. But it forces mock URLs into application code, cannot intercept Server Component fetches to the *real* backend host, and the routes ship in the production bundle unless carefully excluded. |
| **Current approach — mock functions in `lib/api/`** | ❌ As above: throwaway work, and it never exercises the fetch/serialization/error path that production actually uses. |
| **Prism / openapi-mock** (spec-driven auto-mock) | ⚠️ **Useful supplement, not the primary.** Auto-generates responses from `openapi.yaml`. Zero effort, but returns static example data that ignores the request — the exact anti-pattern in the architecture doc's Section 29.3. Good for a first smoke test on a brand-new endpoint; not good enough to build a screen against. |

**Packages to install:**

```bash
pnpm add -D msw @mswjs/data @faker-js/faker
pnpm dlx msw init public/ --save        # emits public/mockServiceWorker.js
```

### 1.2 Structure

Follow the architecture doc's layout, with one addition (`fixtures/`) that it implies but does not name:

```
src/mocks/
  browser.ts              # setupWorker  — browser runtime
  server.ts               # setupServer  — Node: RSC, Vitest, Playwright
  db.ts                   # @mswjs/data models — flat entities only
  scenarios.ts            # named failure/edge scenarios
  handlers/
    index.ts              # composes all handler arrays, order matters
    auth.ts  jobs.ts  candidates.ts  workflow.ts  reports.ts  settings.ts
  repo/
    jobs.ts  candidates.ts  reports.ts
    query.ts              # ONE paginate / applySort / applyFilters
    idempotency.ts        # key store + replay
    etag.ts               # ETag compute + If-Match check
  fixtures/
    jobs.seed.ts  reports.fixture.ts  ...   # fixed-seed faker + static JSON
```

**The repository layer is the load-bearing part.** Handlers never touch `db` directly:

```
handlers/jobs.ts  →  repo/jobs.ts  →  db.ts or fixtures/
```

Two reasons, both worth the indirection:

1. **Tenant scoping becomes structural.** Every repo function takes `orgId` as its first argument. You cannot forget it, because it will not compile. A mock layer that ignores organisations happily hides the exact cross-tenant leak that is the worst bug this product can ship.
2. **Storage stays reversible.** If `@mswjs/data` turns out to be wrong for reports (it will — see 1.4), you rewrite one folder, not forty handlers.

### 1.3 Handlers implement real request logic

This is the rule that decides whether the mock layer is an asset or a liability. A handler that returns the same fixture regardless of input teaches the UI nothing and hides every pagination, sort and empty-state bug until integration week.

```ts
// src/mocks/handlers/jobs.ts
import { http, HttpResponse, delay } from 'msw'
import { jobsRepo } from '../repo/jobs'
import { parseListQuery } from '../repo/query'
import { idempotency } from '../repo/idempotency'
import { currentOrgId } from '../repo/session'

export const jobHandlers = [
  http.get('*/api/v1/jobs', async ({ request }) => {
    await delay(300)                                    // never mock at zero latency
    const q = parseListQuery(new URL(request.url))      // page, pageSize, sort, filters
    return HttpResponse.json(jobsRepo.list(currentOrgId(request), q))
  }),

  http.post('*/api/v1/jobs', async ({ request }) => {
    const key = request.headers.get('Idempotency-Key')
    if (key && idempotency.has(key)) return idempotency.replay(key)

    const body = await request.json()
    if (!body.title) {
      return HttpResponse.json(
        { code: 'VALIDATION_FAILED', message: 'Job title is required',
          fieldErrors: { title: 'Required' }, requestId: 'req_mock_01' },
        { status: 422 },
      )
    }
    return idempotency.store(key, HttpResponse.json(
      { data: jobsRepo.create(currentOrgId(request), body) }, { status: 201 }))
  }),
]
```

**Non-negotiables for every handler:**

- **Wildcard origin** (`*/api/v1/...`) so one handler set covers browser fetches, RSC fetches and BFF-internal calls.
- **Latency 200–600ms.** Loading states must be visible during development, or they are theoretical and untested.
- **Real filtering, sorting, pagination** via the shared `repo/query.ts` helpers — implementing Section 7.2 of the architecture doc exactly once.
- **An error scenario and an empty scenario per resource.** Most production bugs live in the states nobody looked at.
- **Fixed faker seed** (`faker.seed(20260811)`) — deterministic tests, stable visual-regression screenshots.
- **Typed against `lib/api/generated.ts`.** When the spec changes, the mocks stop compiling. That is the feature, not a nuisance.

### 1.4 Storage split

| Data | Storage | Why |
|---|---|---|
| Jobs, candidates, users, teams, comments, invites | `@mswjs/data` | Flat relational CRUD with real mutations — what it is built for |
| AI reports, interview answers, media metadata | Typed fixture modules + a small `Map` | Nested, mostly read-only, arbitrary `payload` shapes. Forcing these through a relational model costs more than it returns |

### 1.5 Scenarios — the dev panel

Every resource ships switchable scenarios, driven by a header the dev panel sets:

```ts
// src/mocks/scenarios.ts
export type Scenario =
  | 'default' | 'empty' | 'error500' | 'slow'
  | 'forbidden' | 'conflict' | 'rateLimited' | 'partialMedia'
```

A dev-only floating panel (rendered when `APP_ENV !== 'production'`) lets anyone — including design and product reviewing a preview deploy — flip a resource into its empty or error state without touching code. **This is what makes the five-state contract real** rather than aspirational: a reviewer can see all five states in thirty seconds.

### 1.6 MSW must be enabled in two places

The single most common way this setup fails, and it will bite in week one if missed. **The Service Worker only intercepts browser fetches.** A Server Component fetching data never touches it — it hits a real API that may not exist, the page fails, and the client-side equivalent works fine, which makes it look like a mysterious environment bug.

```ts
// instrumentation.ts  (repo root)
export async function register() {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
      && process.env.NEXT_RUNTIME === 'nodejs') {
    const { server } = await import('./src/mocks/server')
    server.listen({ onUnhandledRequest: 'warn' })
  }
}
```

```tsx
// src/components/providers/msw-provider.tsx  (browser side)
'use client'
export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled')
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') return
    import('@/mocks/browser').then(({ worker }) =>
      worker.start({ onUnhandledRequest: 'warn' }).then(() => setReady(true)))
  }, [])
  if (!ready) return null            // must not render children before the worker is live
  return <>{children}</>
}
```

`onUnhandledRequest: 'warn'` is deliberate: an unhandled call logs loudly instead of silently hitting a real host. Set it to `'error'` in the test setup, where a stray call should fail the test.

### 1.7 Migrating from the existing `lib/api/`

The 2,656 lines are not wasted — they are the **spec of what the mocks must do**, written by whoever knew the product best. Migrate per feature, not in a big bang:

| Step | Action |
|---|---|
| 1 | Get the endpoint into `openapi.yaml` (frontend may draft it — see 2.2) and generate types |
| 2 | Port the existing mock function's *logic* into `mocks/repo/<feature>.ts` — the store, validation and error branches move nearly verbatim |
| 3 | Write `mocks/handlers/<feature>.ts` calling that repo |
| 4 | Replace the component's direct `getJob()` call with a `useJob()` Query hook that calls `api.GET('/jobs/{id}')` |
| 5 | Delete `lib/api/<feature>.ts` |

Do this **one feature at a time**, starting with the feature about to get real backend work. Both layers can coexist during the transition — MSW intercepting network calls does not interfere with functions that never make one.

**Preserve from the existing layer:** the magic-value error triggers (`locked@xinterview.ai`, OTP `000000`) are excellent and should become scenarios or handler branches. The `_resetJobsStore()` pattern maps directly onto MSW's `db.reset()` in test teardown.

---

## 2. Environment & the mock switch

### 2.1 Two axes, not one

Your ask was: "if the env file says `mock`, mocks work; if `dev`, development works." The important refinement is that these are **two independent axes**, and collapsing them into one variable costs you the most useful configuration.

```
NEXT_PUBLIC_APP_ENV       local | development | staging | production   ← which backend, which keys, which badge
NEXT_PUBLIC_API_MOCKING   enabled | disabled                            ← where the data comes from
```

Why they must be separate: the highest-value configuration in this whole setup is **`APP_ENV=development` + `API_MOCKING=enabled`** — pointed at dev infrastructure, but serving mock data because the endpoint you need does not exist yet. A single `API_MODE=mock|dev|prod` variable cannot express that. You would also lose the ability to run E2E against staging config with mocked media, and preview deploys with mocks on (Section 6).

**Per-resource override, for the case that actually happens:** three of five endpoints are live, two are not.

```bash
NEXT_PUBLIC_API_MOCKING=partial
NEXT_PUBLIC_MOCK_RESOURCES=reports,media      # everything else hits the real API
```

The handler index filters itself by that list. This is the difference between "mocks on or off" and a team that can integrate incrementally — which is what integration week actually looks like.

### 2.2 Validated env config

```ts
// src/lib/config/env.ts
import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'development', 'staging', 'production']),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_API_MOCKING: z.enum(['enabled', 'disabled', 'partial']).default('disabled'),
  NEXT_PUBLIC_MOCK_RESOURCES: z.string().optional(),      // csv, only read when 'partial'
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_GIT_SHA: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1),                // server-only
  SESSION_SECRET: z.string().min(32),
})

export const env = schema.parse(process.env)
export const isMocking = env.NEXT_PUBLIC_API_MOCKING !== 'disabled'
```

Parsing at module load means a missing or malformed variable **fails the build**, not a page at 2am.

**Three hard rules:**

1. **The production build asserts `NEXT_PUBLIC_API_MOCKING=disabled` as an explicit CI step.** A dashboard silently serving mock data to a customer is the worst failure this architecture can produce. Guard it with a check, not with memory.
2. **A visible environment badge** in the topbar whenever `APP_ENV !== 'production'` — colour-coded, API host on hover, and it says `MOCK` when mocking is on. This prevents both "I ran a destructive action against prod" and "I demoed mock data to a customer and called it real."
3. **One env file in the repo: `.env.example`**, keys with no values. No `.env.production`, no `.env.staging` — those live in host/CI secrets.

```bash
# .env.example
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_MOCKING=enabled
NEXT_PUBLIC_MOCK_RESOURCES=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
SESSION_SECRET=
```

```jsonc
// package.json scripts
"dev":       "next dev",                                    // reads .env.local
"dev:mock":  "NEXT_PUBLIC_API_MOCKING=enabled next dev",
"dev:live":  "NEXT_PUBLIC_API_MOCKING=disabled next dev",
```

### 2.3 The contract pipeline — and the answer to "the backend is behind"

```
backend publishes openapi.yaml
        ↓  CI copies it into the frontend repo
lib/api/generated.ts          (openapi-typescript — machine-written, never hand-edited)
        ↓
typed client                  (openapi-fetch)
        ↓
feature api functions + Query hooks
        ↓
components
```

The point of this pipeline is that **the backend's deliverable stops being "the endpoint works" and becomes "the spec is updated"** — which lands days or weeks before working code. The frontend builds against the spec, mocks the behaviour, and ships the screen. When the endpoint appears, mocking flips off and it works — or the contract was violated, and CI names which side broke it.

**The realistic amendment we propose (see 9.2):** in practice the backend will sometimes not have written the spec either. So — **frontend may draft the spec.** When we need an endpoint that does not exist:

1. Frontend writes the proposed path, params and response into `openapi.yaml` under an `x-status: proposed` extension.
2. Opens a PR on the spec, tagging the backend lead.
3. Builds against it immediately with mocks — no waiting.
4. Backend accepts, amends, or rejects. On amendment, the generated types change, the mocks stop compiling, and the fix is localized to the handler and the hook.

This inverts the blocking direction. Without it, "mock-first" still bottlenecks on someone else writing YAML.

```bash
pnpm add -D openapi-typescript oasdiff
pnpm add openapi-fetch
```

```jsonc
"api:types": "openapi-typescript ./openapi.yaml -o ./src/lib/api/generated.ts",
"api:check": "pnpm api:types && git diff --exit-code src/lib/api/generated.ts",
"api:diff":  "oasdiff breaking .openapi-baseline.yaml openapi.yaml --fail-on ERR",
```

---

## 3. The API client & middleware stack

This is your rate-limiting question, generalized. **Do not scatter these concerns across call sites.** They belong in one composed middleware chain, applied once.

### 3.1 The stack, outermost to innermost

```
     component
         │
   ┌─────▼─────────────────────────────────────────┐
   │  TanStack Query   retry · dedupe · cache      │  ← handles most of "the same call
   │                   staleTime · invalidation    │     going out again and again"
   ├───────────────────────────────────────────────┤
   │  openapi-fetch middleware chain               │
   │    1. correlation   x-request-id, traceparent │
   │    2. auth          401 → single-flight refresh
   │    3. idempotency   Idempotency-Key on POST   │
   │    4. rate limit    client-side token bucket  │  ← your security middleware
   │    5. circuit break open after N consecutive 5xx
   │    6. error normal. → ApiError (code/message/ │
   │                        fieldErrors/requestId) │
   │    7. telemetry     Sentry breadcrumb + timing│
   ├───────────────────────────────────────────────┤
   │  fetch                                        │
   └───────────────────────────────────────────────┘
```

### 3.2 The client

```ts
// src/lib/api/client.ts
import createClient from 'openapi-fetch'
import type { paths } from './generated'
import { env } from '@/lib/config/env'

export const api = createClient<paths>({
  baseUrl: `${env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
  credentials: 'include',
})

api.use(correlationMiddleware)
api.use(authRefreshMiddleware)
api.use(idempotencyMiddleware)
api.use(rateLimitMiddleware)
api.use(circuitBreakerMiddleware)
api.use(errorNormalizerMiddleware)
api.use(telemetryMiddleware)
```

Feature functions stay thin, and the *spec* decides the types — not the developer:

```ts
// src/features/jobs/api/jobs.api.ts
export async function listJobs(filters: JobFilters) {
  const { data, error } = await api.GET('/jobs', { params: { query: filters } })
  if (error) throw ApiError.from(error)
  return data
}
```

```ts
apiFetch<Job[]>('/jobs')     // ❌ a developer asserting what they hope arrives
api.GET('/jobs')             // ✅ the contract deciding
```

This is not an ergonomics preference. A hand-written generic re-introduces exactly the drift the OpenAPI pipeline exists to eliminate: the spec changes, the assertion does not, TypeScript reports nothing, production breaks.

### 3.3 Frontend rate limiting — what it should and should not be

Your instinct is right, with one correction on the mechanism. **Frontend rate limiting is a stampede guard, not a security control.** Anyone can open devtools and bypass it. Its job is to stop *your own UI* from hammering the backend when something goes wrong — a render loop, a retry storm, a user rage-clicking a failing button. The backend's limiter is the actual enforcement.

Three layers, and **most of the work is done by layer 1**:

**Layer 1 — TanStack Query configuration.** Before writing any custom limiter, configure this correctly. It eliminates the majority of duplicate-call problems by design:

```ts
// src/lib/api/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,              // identical calls within 30s serve from cache
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.status === 429) return false          // never retry a rate limit
          if (error.status >= 400 && error.status < 500) return false  // 4xx is not transient
        }
        return failureCount < 2
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),  // exponential backoff
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: false,         // opt in per query, never globally
    },
    mutations: {
      retry: 0,                       // TanStack's default — do not override
    },
  },
})
```

Query already de-duplicates in-flight requests with the same key, so ten components mounting at once produce one network call. **That is the single highest-value line in this section**, and it costs nothing.

**Layer 2 — a token bucket per endpoint**, for the pathological cases Query cannot see (mutations fired in a loop, imperative calls):

```ts
// src/lib/api/middleware/rate-limit.ts
const buckets = new Map<string, { tokens: number; last: number }>()

const LIMITS: Record<string, { rate: number; burst: number }> = {
  default:            { rate: 10, burst: 20 },   // per second, per endpoint pattern
  'POST /invitations': { rate: 1,  burst: 3  },   // side-effecting: tight
  'POST /reports/*/generate': { rate: 1, burst: 2 },
}

export const rateLimitMiddleware: Middleware = {
  async onRequest({ request, schemaPath }) {
    const key = `${request.method} ${schemaPath}`
    if (!take(key)) {
      throw new ApiError({
        code: 'CLIENT_RATE_LIMITED',
        message: 'Too many requests from this client',
        status: 429,
      })
    }
  },
}
```

When this trips it should also **log to Sentry as a warning** — a client-side limiter firing means there is a bug in the calling code, and you want to know about it rather than silently smoothing it over.

**Layer 3 — circuit breaker.** After N consecutive 5xx on one endpoint, stop calling it for a cooldown and fail fast with a designed error state. This is what prevents a backend outage from turning into a self-inflicted DDoS from a hundred open dashboards all polling and retrying.

```ts
// open after 5 consecutive failures, half-open probe after 30s
const BREAKER = { threshold: 5, cooldownMs: 30_000 }
```

**Plus the cheap UI-level guards that catch most cases in practice:** disable the trigger while a mutation is pending · debounce search inputs at 300ms · never poll a hidden tab (`refetchIntervalInBackground: false`) · back off polling intervals over time (5s for the first minute, 15s to five minutes, 30s thereafter).

### 3.4 Auth refresh — single-flight

The subtle bug: a page loads, eight queries fire, all eight get 401, all eight call refresh. Seven of them fail because the refresh token rotated, and the user is logged out on page load.

```ts
// src/lib/api/middleware/auth-refresh.ts
let inflight: Promise<void> | null = null

export const authRefreshMiddleware: Middleware = {
  async onResponse({ response, request }) {
    if (response.status !== 401 || request.url.includes('/auth/')) return response
    inflight ??= fetch('/api/auth/refresh', { method: 'POST' })
      .then(r => { if (!r.ok) throw new Error('refresh failed') })
      .finally(() => { inflight = null })
    try {
      await inflight
      return fetch(request.clone())          // retry once
    } catch {
      window.location.assign('/login')
      return response
    }
  },
}
```

One in-flight refresh, shared by every caller. Retry the original request exactly once — never loop.

### 3.5 Idempotency — keyed per intent, not per request

The failure this prevents: a recruiter clicks "Send invitations to 40 candidates", the request lands, the response times out, the UI shows an error, they click again, and forty candidates get a second invitation from an employer.

**The rule: every POST with an external side effect carries an `Idempotency-Key`, minted once per user intent.**

```ts
export function useIdempotentMutation<TBody, TData>(fn, options) {
  const keyRef = useRef(ulid())
  return useMutation({
    mutationFn: (body: TBody) => fn(body, keyRef.current),
    onSuccess: (...args) => { keyRef.current = ulid(); options?.onSuccess?.(...args) },
    retry: 0,
    ...options,
  })
}
```

The subtlety that makes it work: **a key regenerated on retry is exactly as useless as no key.** Mint it when the form opens, keep it across every retry of that intent, replace it only after confirmed success. For the Create Job wizard, persist the key alongside the server-side draft so a publish retried after a page reload is still recognised as the same intent.

Required on: invitations · publishing a job · generating/regenerating a report · creating a share link · bulk stage moves · billing actions · resending anything.

### 3.6 Correlation IDs

Every request carries `x-request-id`. Every error response returns `requestId`. That ID is rendered in the error state, attached to the Sentry event, and quoted in support conversations — so one customer complaint traces to one backend log line. This costs about fifteen lines and is the single biggest debugging-time saver on the list.

---

## 4. Testing strategy — "feature N+1 must not break feature N"

This was your central question. The answer is not "write more tests"; it is **four gates of increasing cost, ordered so that the cheapest catches the most.**

```
        ╱  E2E — Playwright        ╲     ~16 specs · critical journeys · minutes
      ╱  Integration — Vitest + MSW  ╲   ~100 · feature slices · seconds
    ╱  Unit — Vitest                   ╲ as many as useful · pure logic · milliseconds
  ╱  Static — TS strict, ESLint, oasdiff ╲ every save · free
```

**Do not chase a coverage percentage.** Cover the flows where a bug costs a customer. A 90% coverage number made of tests that assert `expect(true).toBe(true)` is worse than 40% of tests that actually fail when the product breaks.

### 4.1 Gate 1 — static (free, catches the most)

This is the gate that does the heavy lifting for "don't break the previous feature," and it is nearly free.

| Check | Catches |
|---|---|
| `tsc --noEmit` with `strict` + `noUncheckedIndexedAccess` | Every type-level break from a contract change |
| `oasdiff` breaking-change gate | Backend removing or repurposing a field, before it reaches the app |
| Generated-types drift check | Someone hand-editing `generated.ts` |
| ESLint: no literal user-facing strings | i18n rot |
| ESLint: no physical direction utilities (`ml-`, `left-`) | RTL-impossible layout |
| ESLint: no arbitrary Tailwind values | Six slightly different greys |

**Fix `tsconfig.json` first.** Current config has `"target": "es5"` (wrong for a 2026 Next.js app — it bloats output and breaks async debugging) and is missing `noUncheckedIndexedAccess`:

```jsonc
{
  "target": "ES2022",
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true
}
```

**Also remove `eslint.ignoreDuringBuilds: true` from [next.config.js](next.config.js).** Lint rules that do not block the build are documentation, not enforcement.

### 4.2 Gate 2 — unit (Vitest)

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Test the logic where a bug is silent:

- Zod schemas, including the invalid cases
- `can(role, permission)` permission logic
- Filter → query-param mapping
- **Timezone formatting with the machine clock set to a non-European zone** — the only way these bugs surface before a customer finds them
- ICU plural output at 0, 1 and 2 for every plural message
- Report renderer fallback on an unknown section type
- Idempotency key stability across retries
- The wizard reducer

**Test what a user sees and does** — `getByRole`, `getByLabelText` — never internal state. Tests coupled to implementation break on every refactor and get deleted, which is worse than not having them.

### 4.3 Gate 3 — integration (Vitest + RTL + MSW)

This is the tier that actually prevents regressions, and the tier most teams skip. It renders a real feature slice against real MSW handlers — the same ones dev uses.

```ts
// src/features/jobs/__tests__/job-list.test.tsx
import { server } from '@/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => { server.resetHandlers(); db.reset() })
afterAll(() => server.close())

it('shows the empty state and its primary action', async () => {
  server.use(scenarios.jobs.empty)
  render(<JobList />, { wrapper: TestProviders })
  expect(await screen.findByRole('heading', { name: /no jobs yet/i })).toBeVisible()
  expect(screen.getByRole('button', { name: /create your first job/i })).toBeEnabled()
})

it('surfaces requestId in the error state', async () => {
  server.use(scenarios.jobs.error500)
  render(<JobList />, { wrapper: TestProviders })
  expect(await screen.findByText(/req_mock/)).toBeVisible()
})
```

**Because the handlers are shared, a contract change breaks the dev environment and the test suite simultaneously.** That is the mechanism by which the mock layer pays for itself twice.

### 4.4 Gate 4 — E2E (Playwright)

```bash
pnpm add -D @playwright/test @axe-core/playwright
```

Sixteen specs, run against MSW, covering the journeys where a bug costs a customer:

1. Login with Turnstile → dashboard
2. Login failure → clear error, no session leak
3. Rate limit engages after repeated failures
4. Logout clears session; back button does not restore the dashboard
5. Create Job wizard, all five steps, publish
6. Wizard refresh mid-way → draft restored
7. Wizard validation blocks progress with a clear message
8. **Double-submit of an invitation sends one email** (idempotency)
9. Candidate device check → interview → thank-you page
10. Interview upload survives a simulated network drop
11. Workflow filter/sort/paginate state survives reload and is shareable
12. Conflicting edit produces the 409 dialog, not a silent overwrite
13. Media `PARTIAL`: video and transcript render while evaluation shows failed + retry
14. Open AI report, comment, export
15. **Org switch clears cached data from the previous org**
16. Recruiter cannot reach billing (UI hidden *and* direct URL redirects)

One Playwright project per role (`admin`, `recruiter`, `interviewer`), each reusing a stored auth state so login runs once, not sixteen times.

**Rules:** no `waitForTimeout` — wait on a role or a response · no test depends on another's leftovers · **a flaky test is fixed or deleted the same week**, never re-run until green. A suite people do not trust is a suite people ignore, and then it is pure cost.

### 4.5 The regression net, specifically

Mapping your question — "how do I know feature N+1 didn't break feature N" — onto concrete mechanisms:

| Mechanism | What it catches |
|---|---|
| TypeScript strict + generated types | Contract drift, at compile time |
| `oasdiff` in CI | Backend breaking the contract, before merge |
| Shared MSW handlers | A mock change that breaks another feature fails that feature's tests |
| Integration tests per feature slice | Behavioural regressions in the feature you did not touch |
| E2E on 16 journeys | Cross-feature breaks (auth, org switch, navigation) |
| Visual regression (`toHaveScreenshot`) | Unintended design drift — the class of break tests never catch |
| Bundle-size check per route | Performance regressions, which are invisible until a customer complains |
| Feature flags | Half-finished work merges to `main` without shipping to customers |

**Feature flags deserve emphasis** for a rebuild specifically. They let you merge continuously — which keeps PRs small and reviewable — without exposing incomplete modules. Small PRs are themselves a regression-prevention mechanism, and the cheapest one available.

---

## 5. Definition of Done for any API work

A pull request touching API integration is not done until every line is true. This is the checklist the reviewer reads.

**Contract**
- [ ] Endpoint exists in `openapi.yaml` (`x-status: proposed` is acceptable); types regenerated, not hand-written
- [ ] No `any`, no `as` assertion on a response body
- [ ] Response envelope, pagination, sort and error shape follow the global conventions

**Mocks**
- [ ] MSW handler exists and goes through `mocks/repo/*`, never storage directly
- [ ] Repo functions take `orgId` first
- [ ] Handler implements real filtering / sorting / pagination — not a static fixture
- [ ] Empty and error scenarios ship with it
- [ ] Latency 200–600ms

**Client**
- [ ] Server state in TanStack Query; query keys declared in the feature's `keys` object and scoped by `orgId`
- [ ] View state (filters, page, sort, tab) in the URL, not `useState`
- [ ] No server data copied into `useState`
- [ ] Side-effecting POSTs send an `Idempotency-Key` minted once per intent
- [ ] Mutations send `If-Match`; 409 shows the conflict dialog

**States**
- [ ] All five states implemented: loading (skeleton matching real layout), empty, error (with retry + `requestId`), no-permission, populated
- [ ] Non-terminal states (`PROCESSING`, `QUEUED`) have designed screens and polling backs off

**Security**
- [ ] Permission checked in UI **and** middleware (backend is the actual enforcement)
- [ ] No PII in logs, analytics events or Sentry payloads
- [ ] No token in `localStorage`

**Tests**
- [ ] Integration test covering happy path + one failure path
- [ ] E2E if the change touches one of the 16 critical journeys
- [ ] Typecheck, lint and existing suite all pass

---

## 6. CI pipeline

```yaml
jobs:
  contract:  generate types from openapi.yaml · fail if generated file drifts
             oasdiff — FAIL on a breaking spec change
             enum coverage — FAIL if any API enum lacks a translation key
  quality:   tsc --noEmit · eslint (all blocking rules) · prettier --check
  i18n:      key parity · ICU validity · interpolation vars · duplicate keys
  unit:      vitest run
  build:     next build (fails on any type or env error)
  e2e:       playwright, 4 shards, traces uploaded on failure
  a11y:      axe scan on key screens
  security:  pnpm audit --audit-level=high
  guard:     assert NEXT_PUBLIC_API_MOCKING=disabled   (production build only)
```

**Every PR gets a preview deployment with mocks enabled.** Design and product review the real thing instead of a screenshot, and reviewers never need backend availability. This is one of the highest-return items in the entire setup and it falls out of the mock layer for free.

---

## 7. Suggested order of work

Sequenced so each step unblocks the next, and so the riskiest assumption is tested earliest.

| Step | Work | Why here |
|---|---|---|
| 1 | Fix `tsconfig` (`ES2022`, `noUncheckedIndexedAccess`); remove `ignoreDuringBuilds`; add Prettier | Everything downstream depends on the compiler being honest |
| 2 | `env.ts` with Zod validation · `.env.example` · environment badge | The mock switch needs somewhere to live |
| 3 | Install MSW · `browser.ts` / `server.ts` / `instrumentation.ts` · **prove it intercepts both a client and an RSC fetch** | This is the assumption most likely to be wrong. Test it on day one, not in week six |
| 4 | `openapi.yaml` (even a stub) · type generation · `openapi-fetch` client | The contract seam |
| 5 | Middleware chain: correlation → auth → idempotency → rate limit → breaker → error normalizer | Applies to every call written afterwards |
| 6 | TanStack Query + `queryClient` config + `QueryProvider` | Removes most duplicate-call problems by configuration |
| 7 | Repo layer + first feature migrated end-to-end (**suggest: jobs**) | Proves the whole path on real, existing code |
| 8 | Vitest + RTL + first integration tests against the shared handlers | The regression net starts here |
| 9 | Playwright + auth setup + first 3 E2E specs | |
| 10 | CI pipeline with all gates | Makes every rule above enforcement rather than documentation |
| 11 | Migrate remaining `lib/api/*` features one at a time | Incremental, low-risk, no big bang |

**Step 3 is the one to do today.** If MSW cannot cleanly intercept both a Client Component fetch and a Server Component fetch in this specific Next.js 15 setup, the entire plan changes shape — and you want to find that out before ten features are built on the assumption.

---

## 8. Anti-patterns

1. **Mocking at the function seam instead of the network seam.** Throwaway work, and it never exercises fetch, serialization or error handling.
2. **Mocks that ignore the request.** Everything looks finished; the UI learns nothing about pagination, empty states or failure.
3. **MSW enabled only in the browser.** Server Components bypass the Service Worker and hit an API that may not exist. Looks like a mysterious environment bug.
4. **Hand-written API types or manual generics.** They drift from the spec within two sprints, silently.
5. **`if (isMock)` branches in application code.** The moment one appears, the mock layer has failed at its only job.
6. **Idempotency keys regenerated on retry.** No better than none; the failure is 40 duplicate emails to candidates.
7. **Client rate limiting treated as security.** It is a stampede guard. Devtools bypasses it in five seconds.
8. **Retrying 4xx.** Never transient. Retrying a 429 specifically makes the problem worse.
9. **Parallel refresh calls on 401.** Logs the user out on page load. Single-flight or nothing.
10. **Server data copied into `useState`.** Desynchronises the moment anything mutates.
11. **Filters and tabs in React state.** Breaks link sharing, the back button, and E2E.
12. **Tests written after the module is "done."** Tests written last are written to pass, not to catch.
13. **Flaky tests re-run until green.** A suite nobody trusts is pure cost.
14. **Org switch without clearing the cache.** A confidentiality breach that passes every single-org test.
15. **Two ways to do one thing.** The most expensive item here, and the easiest to let happen.

---

## 9. Review of `xinterview-frontend-architecture-v2.0.md`

**Overall assessment: this is a strong document — well above the norm for internal frontend standards.** It is opinionated in the right places, gives reasons rather than rules, and correctly identifies the failure modes specific to *this* product (tenant leaks, duplicate candidate emails, timezone bugs in interview scheduling, partial media states, EU AI Act auditability). Sections 16 (media lifecycle), 17 (tolerant AI report rendering) and 18 (i18n) are genuinely excellent and reflect real experience.

The notes below are refinements, not objections. Roughly in order of how much they matter.

### 9.1 The gap that matters most: it assumes a greenfield repo

**Severity: high.** Section 28 says *"Phase 0 — nothing else starts until this is complete"* and Section 4 specifies a `src/` layout. Neither matches this repository. There are 217 component files, no `src/` directory, ~2,656 lines of function-level mocks consumed by 52 files, and 173 files marked `'use client'` — against a stack choice of RSC-by-default.

Read literally, Phase 0 halts all work for weeks and then demands a large mechanical refactor. That is not going to happen, and a standard that gets ignored on contact with the repo stops being a standard at all.

**Proposed change.** Add a **Phase 0.5 — Migration** section that:

- Declares which Phase 0 items are **blocking** (the three lint rules, i18n foundation, env validation, tsconfig strictness — the things that cannot be retrofitted without touching every file) versus **incremental** (folder structure, RSC conversion, mock migration).
- Sanctions **coexistence**: MSW handlers and legacy `lib/api/*` functions running side by side, feature by feature.
- Decides `src/` explicitly — either migrate now in one commit (cheap: it is one `git mv` plus a `tsconfig` path) or amend Section 4 to the current root-level layout. Leaving it ambiguous guarantees both layouts appear in the tree.
- Acknowledges the `'use client'` reality and defines the target: new features RSC-first, existing ones converted opportunistically, not in a sweep.

### 9.2 Mock-first still blocks on the backend writing the spec

**Severity: high.** Section 6 is the answer to "frontend is blocked when backend is behind" — but it relocates the block rather than removing it. Section 6.1 gives the backend **sole ownership** of `openapi.yaml`, and 6.1's process starts with *"Backend changes openapi.yaml."* If the backend has not written the spec, the frontend has no types, and mock-first stops.

**Proposed change.** Add a fourth ownership category — **frontend-proposed**:

> Frontend may add a **proposed** endpoint to `openapi.yaml` marked `x-status: proposed`, and build against it immediately. Backend accepts, amends, or rejects within one sprint. A proposed endpoint cannot be deployed with mocking disabled — CI fails the production build if any `x-status: proposed` path is reachable in a non-mocked build.

That last clause is what makes it safe: proposals cannot silently become production dependencies.

### 9.3 Middleware is under-specified

**Severity: medium.** Section 6.2 shows a bare `createClient` and Section 10 covers server-side rate limiting on auth routes. Between them there is no defined client-side middleware chain — so retry policy, 401 refresh, correlation IDs, client rate limiting and error normalization each get invented per feature, which is exactly the "two ways to do one thing" that Section 29.22 names as the most expensive anti-pattern.

**Proposed change.** Add a section specifying the ordered middleware chain (Section 3 of this document), including single-flight refresh, the retry policy (never retry 4xx, never retry 429, exponential backoff on 5xx), and the circuit breaker.

### 9.4 No cancellation / abort policy

**Severity: medium.** Nothing addresses `AbortSignal`. On the workflow screen — where the doc itself notes a recruiter changes filters twenty times a session — rapid filter changes produce overlapping requests, and a slow earlier response can land after a fast later one and overwrite it. TanStack Query handles the common case, but imperative calls, the wizard's autosave, and search-as-you-type all need explicit handling.

**Proposed change.** State that every API function accepts and forwards an `AbortSignal`, that search inputs debounce at 300ms and abort the previous request, and that autosave cancels its in-flight predecessor.

### 9.5 Offline and network-loss handling is limited to the interview flow

**Severity: medium.** Section 16 handles candidate-side network loss well. The admin dashboard has no equivalent — a recruiter mid-way through the five-step wizard on hotel wifi hits the same conditions, and the doc's own mandate to autosave the draft to the server on each step change is exactly what fails offline.

**Proposed change.** Add an offline standard for the dashboard: an online/offline indicator, mutation queueing or clear failure with retry, a global "connection lost" banner, and a rule that autosave failure is surfaced rather than silent.

### 9.6 The environment table conflates two axes

**Severity: medium.** Section 5's table gives `local` "developer's choice" and marks `development` mocks "off". This misses the most useful configuration in daily work — dev environment, mocks on, because the endpoint does not exist yet.

**Proposed change.** Make `APP_ENV` and `API_MOCKING` explicitly orthogonal, and add `partial` mocking with a per-resource list (Section 2.1 of this document). Integration is not a single flip; it is five endpoints going live one at a time.

### 9.7 Testing has no policy for time, cost, or flakiness ownership

**Severity: medium.** Section 23 is good on *what* to test. It omits three operational realities: E2E suites grow to 20+ minutes and get skipped; the "fix or delete within a week" rule has no owner; and there is no guidance on running a subset locally versus the full suite in CI.

**Proposed change.** Add a testing budget: unit + integration under 60s locally, E2E under 10 minutes sharded in CI, a named rotating owner for flake triage, and `test:affected` for local runs.

### 9.8 No API performance budget

**Severity: low–medium.** Section 22 budgets LCP, INP, CLS and bundle size — all client-side. Nothing budgets the API interaction itself, and on a data-heavy dashboard that is where the perceived latency actually lives.

**Proposed change.** Add: p75 list endpoint under 500ms · maximum 4 parallel requests per screen on initial load · **no waterfalls — a request that depends on another's response is a design bug** · prefetch on row hover · every polling interval declared with its backoff.

### 9.9 Feature flags are named but not specified

**Severity: low–medium.** Section 24 says *"feature flags gate every module during the rebuild"* — a load-bearing claim, since it is what allows continuous merge without shipping half-built modules. But there is no flag naming convention, no default-state rule, no removal policy, and no statement on server-versus-client evaluation. Unremoved flags are how a codebase accumulates permanent dead branches.

**Proposed change.** Specify: naming (`module.jobs.wizard-v2`), default off, evaluated server-side where possible to avoid flicker, an owner and a removal date per flag, and a CI warning on flags older than 90 days.

### 9.10 The AI report contract needs a size and streaming rule

**Severity: low.** Section 17's tolerant renderer is the right design. But `payload: z.unknown()` with an open section list has no size bound — a report with 40 sections and long transcript highlights can be several megabytes, and Section 22 budgets the bundle but not the payload.

**Proposed change.** Add: sections paginate or lazy-load beyond a threshold · transcript highlights fetch separately from the report envelope · the report endpoint declares a maximum response size in the spec.

### 9.11 Smaller notes

- **Section 3.1** — the "same registrable domain" decision is correctly flagged as Phase 0, but there is no named owner or deadline. It has a long tail (CORS, cookie domain, CSRF posture) and should be assigned to a person with a date, not to a phase.
- **Section 7.2** — repeated-key OR semantics (`?stage=a&stage=b`) should state the array serialization format explicitly in the spec (`style: form, explode: true`), or client and server will disagree on the wire format eventually.
- **Section 9** — "idle timeout 30 minutes, warning at 28" needs a rule for what happens to unsaved form state at timeout. Discarding a half-finished wizard silently is a bad outcome for a 15-minute form.
- **Section 11** — `PERMISSIONS` is a flat role list. There is no mention of resource-level permissions ("this recruiter can only see jobs they own"), which HR products almost always need eventually. Worth deciding now whether that is in scope, because retrofitting it touches every query.
- **Section 14** — `DataTable` requirements do not mention CSV/Excel export. Recruiters will ask for it within the first month, and bolting export onto a table pattern afterwards is more invasive than designing for it.
- **Section 18.9** — the translation agent is well-scoped. Add a cost ceiling and a batch cadence, or it will run on every merge to `main` and generate PR noise.
- **Section 25** — the pipeline has no total time budget. Nine sequential jobs on every PR will exceed 20 minutes; specify what runs on PR versus on merge, and what runs in parallel.
- **Section 2** — no state-machine library is chosen, yet the product has at least three genuine state machines (interview recording, media processing, the wizard). Either name one (XState is the obvious candidate) or state explicitly that reducers are the standard, so it does not get decided three different ways.

### 9.12 What to keep exactly as written

Worth saying explicitly, so a revision does not weaken them:

- **Section 8's repository layer and `orgId`-first rule.** Making tenant scoping a compile-time property rather than a discipline is the single best structural decision in the document.
- **Section 17's tolerant renderer.** Correct and unusual — most teams learn this the hard way after a backend release blanks their most valuable screen.
- **Section 16.2's per-artifact states.** `video: READY, transcript: READY, evaluation: FAILED` really is the common case, and a blanket "processing failed" really does hide two working artifacts.
- **Section 18.1's four content classes.** Class C and D are exactly where products get localization wrong, and the evidentiary argument about transcripts is right.
- **Section 7.6's per-intent idempotency key.** The detail that a key regenerated on retry is useless is the part everyone misses.
- **Section 29's anti-pattern list.** Ordered by likelihood, which makes it genuinely usable in review rather than decorative.

---

## 10. Open decisions

These need an answer before the work starts. Each one is cheap now and expensive in three months.

| # | Decision | Options | Owner |
|---|---|---|---|
| 1 | Same registrable domain for app and API? | `api.xinterview.com` + `app.xinterview.com` (preferred) · different domains + CSRF tokens · full proxy | Backend lead + DevOps |
| 2 | Adopt `src/` layout or amend Section 4? | Migrate now (one commit) · amend the doc | Frontend lead |
| 3 | Can frontend propose spec endpoints? | Yes with `x-status: proposed` (recommended) · no | Both leads |
| 4 | Migration order for the 9 existing mock modules | Suggest: jobs → auth → candidates → settings → rest | Frontend team |
| 5 | Resource-level permissions in v1? | Role-only now · resource-scoped from the start | Product |
| 6 | State machine library? | XState · plain reducers (recommended) | Frontend lead |
| 7 | Backend rate limits — what are the actual numbers? | Needed to configure the client-side buckets sensibly | Backend lead |
| 8 | Does the backend support `Idempotency-Key` and `If-Match`? | Both are assumed throughout the architecture doc; neither works without server support | Backend lead |

**Decision 8 is the one to confirm first.** Sections 7.6 and 13 of the architecture document — idempotency and conflict handling — are entirely dependent on server-side support. If the backend has not planned for either, two significant parts of the standard are currently describing behaviour that cannot exist.
