# MSW mocking — auth + user-management

**Status:** Implemented. **Scope:** the two backend contract docs —
`backend-docs/auth-api.md` and `backend-docs/usermanagement-api.md`. Jobs,
candidates and reports are **not** covered here; they still run on the
function-level mocks in `lib/api/jobs.ts` etc. See
`docs/api-implementation-standard.md` for the long-term target covering those
surfaces — this document supersedes it for the auth/user-management pass only.

## What this is

Two backend docs describe a renamed, cleaned-up API contract
(`/login/*` → `/auth/*`, etc.) that doesn't exist on a real backend yet. This
sets up [MSW](https://mswjs.io) to mock that contract at the network layer —
real `fetch()` calls, intercepted before they leave the browser — and wires
three existing mock modules (`lib/api/auth.ts`, `profile.ts`, `settings.ts`)
to call through a real client (`lib/api/client.ts`) instead of resolving
in-memory. The mock/real switch is one env var; no application code branches
on whether mocking is on.

## How to toggle mocking

```bash
NEXT_PUBLIC_API_MOCKING=enabled     # default — both surfaces mocked
NEXT_PUBLIC_API_MOCKING=disabled    # everything hits NEXT_PUBLIC_API_BASE_URL for real
NEXT_PUBLIC_API_MOCKING=partial     # only NEXT_PUBLIC_MOCK_RESOURCES is mocked
NEXT_PUBLIC_MOCK_RESOURCES=auth,user-management   # csv, read only in 'partial'
```

Set these in `.env.local`. **Restart `npm run dev` after changing them** —
`mocks/handlers/index.ts` reads `process.env` once, at module-eval time, to
build the active handler list. There's no runtime toggle in this pass.

When a resource is excluded, calls for it fall straight through to a real
`fetch()` against `NEXT_PUBLIC_API_BASE_URL`. Today that's
`http://localhost:8080` with nothing listening, so they fail as
`network_error` — which is the point: it proves the switch is real plumbing,
not decoration, for the day a real backend answers at that URL.

## How to add a new mocked endpoint

1. Add the path (and `LEGACY_*` path, if it's renamed) plus request/response
   types to `lib/api/auth-contract.ts` or `lib/api/user-management-contract.ts`.
2. Seed any fixture data it needs in `mocks/db/auth.db.ts` or
   `mocks/db/user-management.db.ts`.
3. Add a handler in `mocks/handlers/auth.ts` or `user-management.ts` that
   reads/writes that db module — never a static fixture, so pagination/error
   paths stay real.
4. Add or update the client function in `lib/api/auth.ts`, `profile.ts` or
   `settings.ts` that calls `apiFetch()` against the new path.

## Status per endpoint

**Legend:** ✅ Mocked & surfaced · 🔌 Mocked, not yet surfaced in any UI ·
⏸️ Deferred, no UI consumer · 🔧 Deferred, needs a type redesign first.

### Auth (`backend-docs/auth-api.md`)

| Endpoint | Status | Notes |
|---|---|---|
| `POST /auth/tokens` | ✅ | `login()`, incl. lockout after 5 fails |
| `POST /auth/register` | ✅ | `register()` |
| `POST /api/token/refresh/` | 🔌 | Handler exists; no caller refreshes yet (single-session, no refresh loop wired) |
| `GET /user-management/me/` | ✅ | `getMe()` / `getProfile()` |
| `GET /user-management/my-companies/` | 🔌 | Handler exists; no caller reads it directly (subsumed by `getMe()`) |
| `POST /auth/send-verification-email/` | ✅ | `resendOtp(mode: 'signup')` |
| `POST /auth/verify-email/` | ✅ | `verifyOtp(mode: 'signup')` |
| `POST /auth/forgot-password/` | ✅ | `forgotPassword()` |
| `POST /auth/reset-password/otp/` | ✅ | `verifyOtp(mode: 'reset')` |
| `POST /auth/reset-password/{token}/` | ✅ | `resetPassword()` — now uses the real token from the OTP step, not a hardcoded stub |
| `POST /auth/last-seen` | 🔌 | Handler exists; no caller invokes it yet |
| `POST /companies/` | ✅ | `createWorkspace()` |
| `POST /user-management/{companyId}/join/` | ✅ | `joinWorkspace()` |
| `GET /companies/invite/{slug}` | ✅ | `getInvite()` — mock-only, matches the doc's note that this endpoint doesn't exist on the real backend yet |

### User-management (`backend-docs/usermanagement-api.md`)

| Endpoint | Status | Notes |
|---|---|---|
| `PATCH /user-management/me/` | ✅ | `profile.ts#saveProfile()` (real-field subset only) |
| `POST /user-management/me/password/` | ✅ | `profile.ts#changePassword()` |
| `PUT /user-management/me/email/` | 🔌 | `profile.ts#changeEmail()` — wired, not exposed in the profile UI yet |
| `GET/PUT company/{id}/details/` | 🔌 | Handlers + db exist; no settings screen reads company details directly yet |
| `GET company/{id}/subscription/` | ✅ | Composed into `settings.ts#getCurrentPlan()` |
| `GET company/{id}/credit-records/` | ✅ | `settings.ts#getCreditRecords()`, also composed into `getCurrentPlan()` |
| `POST company/{id}/enable-free-credits/` | 🔌 | `settings.ts#enableFreeCredits()` — wired, no "claim free credits" UI yet |
| `GET/POST/PUT/DELETE company/{id}/members/` | ✅ | `settings.ts` team functions |
| `GET/POST company/{id}/smtp-settings/` + `/verify/` | ✅ | `settings.ts#saveSmtpConfig`, `sendSmtpTestEmail` |
| `POST company/{id}/coupons/` | ✅ | `settings.ts#applyCoupon()` |
| `GET/POST company/{id}/addresses/` + item CRUD | 🔌 | `settings.ts` address functions — wired, no billing-address UI yet |
| `GET/POST/DELETE company/{id}/trusted-origins/` | 🔌 | `settings.ts#getTrustedOrigins/addTrustedOrigin/removeTrustedOrigin` — a different concept from the existing `saveCustomDomain`; no UI built for it yet |
| `POST company/{id}/domain-check/txt/` | 🔌 | `settings.ts#verifyDomainTxt()` |
| `POST domain-check/cname/` | ⏸️ | No caller — CNAME verification isn't part of any current flow |
| `GET job-titles/` | ⏸️ | No caller — `jobs.ts` has an unrelated local suggestion list |
| `POST notifications/mark-read/` | ⏸️ | No caller |
| `GET/PATCH landing-page/` | ⏸️ | No caller — the careers customisation screens use their own local mock |
| `GET billings/`, `billings/{id}/` | ⏸️ | No caller — billing page shows plan/credits only, not an invoice list |
| `GET/POST/PATCH/DELETE templates/email/`, `templates/sms/` | 🔧 | `lib/api/email-templates.ts` / `sms-templates.ts` use closed literal-union ids (6 fixed values); the doc's numeric, variable-length, `is_active`-flagged list needs a type redesign, done as its own pass |
| `/jobs/generate/*` | ⏸️ | Out of scope — belongs to `lib/api/jobs.ts`, already has separate mock equivalents |
| Everything under "documented but not mocked" in the usermanagement doc (departments, agent-config, communications, event/whatsapp templates, etc.) | ⏸️ | Out of scope, no UI consumer |

`saveCustomDomain`/`removeCustomDomain` and `disconnectSmtp`/`resendInvite`/
`getSubscriptionPlans`/`copyInviteLink`/`uploadAvatar`/`getSessions`/
`revokeSession` stay fully local — none has a matching endpoint in either doc.

## Seeded test data

### Auth

| Email | Password | Gives you |
|---|---|---|
| `admin@xinterview.ai` | `password123` | Verified, has company (id 64, "Acme Corp") |
| `recruiter@xinterview.ai` | `password123` | Verified, has company |
| `locked@xinterview.ai` | `password123` | Always 429 (also triggers generically after 5 failed logins on any account) |
| `unverified@xinterview.ai` | `password123` | Unverified, no company |

OTP `123456` verifies · `111111` is expired · anything else is a mismatch.
Invite slug `acme` resolves to "Acme Corp"; anything else 404s.

### User-management (company 64, "Acme Corp")

- Team: 2 managers (Marcus Reid, Priya Nair), 1 executive (James Okafor), 1 pending invitee.
- Subscription: Growth Plan, 6 credits, 94/100 candidates used.
- Credit records: 2 rows.
- SMTP: configured and verified, `smtp.mailersend.net`.
- Trusted origin: `careers.acme.example`, unverified (so the verify flow is reachable).
- Billing address: 1, in Pune, India.
- Coupons: `LAUNCH20` (20% off), `WELCOME10` (10% off).

## Error envelope normalization

The backend sends five different error shapes across the two docs:
`{detail}` (login, OTP, refresh), `{field: [msgs]}` (register, companies),
`{non_field_errors}` / `{messages}` (reset-password), and `{error}`
(domain-check/txt, coupons). `lib/api/client.ts#normalizeErrorEnvelope`
converts all five into the one shape every error mapper already expects —
`{code, message, retryAfter?, fieldErrors?}` — so
`lib/errors/auth-messages.ts` and `lib/errors/settings-messages.ts` needed no
changes. A new mocked endpoint's handler should return one of those five
shapes; if it needs a sixth, extend the normalizer, not the callers.

## Reconciliation decisions

A few things don't map 1:1 between the old mock code and the real contract.
Recorded here so the code's shape doesn't look arbitrary later:

- **Four different "current user" types exist** (`auth.ts`'s `UserProfile`,
  `profile.ts`'s `UserProfile`, `auth-contract.ts`'s `CurrentUser`,
  `settings.ts`'s `CurrentUser`) and are kept as four rather than merged —
  each serves a different screen and is now sourced from real mocked data
  where the doc covers it. `profile.ts`'s `UserProfile` in particular is a
  blend: `firstName`/`lastName`/`email`/`timezone`/`avatarUrl` come from
  `GET /user-management/me/`; `phone`/`jobTitle`/`bio`/`role`/`organization`/
  `status`/`joinedOn` have no backend equivalent and stay local.
- **Team roles adopt the wire codes.** `settings.ts`'s `Role` changed from
  `'Owner' | 'Admin' | 'Member'` to `'Owner' | 'MA' | 'EX'`. `'Owner'` is a
  client-only synthetic role — the API has no such role — assigned to
  whichever member's email matches the signed-in user's `admin_companies`
  owner. `removeMember`'s "can't remove the owner" guard therefore has to
  stay client-side; the server has no concept of it.
- **`inviteMember` no longer fabricates a member.** The real endpoint
  returns `{message}` only, so the function re-fetches the roster after a
  successful invite instead of constructing a fake `TeamMember` locally.
- **The `resetPassword('mock-token', ...)` bug is fixed.** `auth.ts` now
  exports `getPendingResetToken()`, populated by the OTP-verify step, and
  `app/(auth)/reset-password/page.tsx` uses it instead of a hardcoded string.
- **Coupon discount % is derived client-side.** The real success response
  has no numeric discount field, only a message
  ("Coupon applied — 20% off the first year."). `applyCoupon()` still calls
  the real endpoint (so invalid codes correctly 404), but maps the known
  seeded codes to a percentage afterward. Revisit if the backend adds a
  structured field.
- **`saveCustomDomain`/`removeCustomDomain` were not merged into the doc's
  "trusted origins."** They're different concepts — this file's custom
  subdomain for the careers page vs. the doc's CORS-style allow-list with TXT
  verification — so both now exist side by side; trusted origins are wired
  but have no UI yet.
- **Email/SMS templates were not migrated.** `lib/api/email-templates.ts` /
  `sms-templates.ts` use closed literal-union ids; the doc's shape is a
  numeric, variable-length list. Migrating requires a type redesign, kept as
  a separate future pass rather than bundled in here.

## Architecture notes

- **No RSC/`instrumentation.ts` wiring.** Every page consuming these two
  surfaces is a Client Component, so only `mocks/browser.ts` (via
  `components/providers/msw-provider.tsx`, mounted in `app/layout.tsx`) is
  needed for the running app. `mocks/server.ts` exists solely for Vitest
  (`vitest.setup.ts`) — it is not wired into the Next.js app. If a Server
  Component or Route Handler starts calling these surfaces, add
  `instrumentation.ts` per MSW's Node-server docs at that point.
- **No `@mswjs/data`, no faker.** Total seeded record count is small and
  fixed (a few dozen records across both surfaces); flat mutable objects in
  `mocks/db/*.ts` are simpler and sufficient. Revisit if jobs/candidates/
  reports mocking is tackled later with hundreds of records.
- **Session is in-memory only** (`lib/api/auth.ts`), no cookies or
  `localStorage` — consistent with how the app already worked before this
  change, and avoids persisting anything before a real session/attempt id
  exists.
- **`X-Mock-User-Email` header.** The mock issues fake JWTs that carry no
  real identity, so `lib/api/client.ts` attaches this header (alongside the
  bearer token) so handlers can look up "the signed-in user." It's mock-only
  plumbing — real handlers/backends ignore an unrecognized header, so it's
  harmless once a real backend is answering.
