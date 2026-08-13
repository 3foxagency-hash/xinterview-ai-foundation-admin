# Auth API — new contract

**Verified:** 2026-08-13 against `https://xdev.xinterview.xyz` — every endpoint
called directly, real payloads recorded, then reshaped into the contract below.
**Companion to:** `docs/auth-api-xinterview-existing-with-suggested-changes.md`

This is the contract the **frontend and the mocks use**. It applies the agreed
renames (`/login/*` → `/auth/*`) and drops the fields nothing reads.

Each endpoint below shows three things:

1. **API** — the new path and request body
2. **Mock response** — exactly what the mock returns, byte-for-byte the shape
   the backend should return
3. **Fields removed** — what the live API sends today that the contract drops,
   and why

---

## 1. New contract

### `POST /auth/tokens` — login

Was `POST /login/tokens`.

**Request**

```jsonc
{ "email": "admin@xinterview.ai", "password": "password123" }
```

**Mock response** — `200`

```jsonc
{
  "refresh_token": "eyJhbGciOi...",
  "access_token":  "eyJhbGciOi...",
  "last_seen_monitor": "eyJhbGciOi..."
}
```

**Fields removed**

| Field | Why |
|---|---|
| `email_verified` | Never read from this response. Authoritative on `GET /user-management/me/`. |
| `company_created` | Same — read from the profile, not the token bundle. |

**Errors**

| Case | Status | Body |
|---|---|---|
| Wrong password | `404` | `{"detail": "Invalid credentials"}` |
| Unknown email | `404` | `{"detail": "Invalid credentials"}` — identical, so no account enumeration |
| Missing field | `400` | `{"password": ["This field is required."]}` |
| Lockout *(mock-only)* | `429` | `{"detail": "Too many failed attempts…"}` + `Retry-After` |

> **404, not 401.** Unusual, but it is what the API does, so the mock matches it.
> The missing-field response is **reshaped** — see backend issue 1.

---

### `POST /auth/register`

Was `POST /login/register`.

**Request**

```jsonc
{
  "email": "new@example.com",
  "password": "Hire@123",
  "first_name": "New",
  "last_name": "User",
  "company": 64          // optional — only when accepting an invite
}
```

**Mock response** — `201`

```jsonc
{
  "refresh_token": "...",
  "access_token": "...",
  "last_seen_monitor": "...",
  "email": "new@example.com",
  "first_name": "New",
  "last_name": "User",

  // present only on an invited signup
  "joining_company_details": { "id": 64, "company_name": "Acme Corp" }
}
```

New accounts start **unverified with no company**.

**Fields removed**

| Field | Why |
|---|---|
| `email_verified` | Never read here; always `false` on a fresh signup anyway. |
| `company_created` | Same — always `false` on a fresh signup. |
| `joining_company_details.logo` | The `<Avatar>` using it is commented out. |
| `joining_company_details.account_team_size` | Stored in state, never rendered. |

**Errors**

| Case | Status | Body |
|---|---|---|
| Duplicate email | `400` | `{"email": ["Email is already registered."]}` |
| Missing fields | `400` | One key per missing field, each `["This field is required."]` |

---

### `POST /api/token/refresh/`

Unchanged path.

**Request**

```jsonc
{ "refresh": "eyJhbGciOi..." }
```

**Mock response** — `200`

```jsonc
{ "access_token": "eyJhbGciOi..." }
```

> ⚠️ **The live API returns `access` here**, while login and register return
> `access_token`. The contract standardises on `access_token` — see backend
> issue 4.

**Fields removed**

| Field | Why |
|---|---|
| `refresh` | Never read. The client keeps the refresh token it already holds. |

**Errors** — `401` `{"detail": "Token is invalid", "code": "token_not_valid"}`

---

### `GET /user-management/me/` — current user

Was `GET /user-management/`.

**Mock response** — `200`

```jsonc
{
  "id": 113,
  "email": "admin@xinterview.ai",
  "first_name": "Sarah",
  "last_name": "Chen",
  "timezone": "Asia/Kolkata",
  "language": "English (UK)",
  "profile_pic": null,
  "is_verified": true,
  "notification_skipped": false,
  "company_created": true,
  "has_zoom_account": false,
  "has_google_account": false,
  "has_microsoft_account": false,
  "created_at": "2026-05-18T06:21:49.295045Z",
  "updated_at": "2026-08-06T13:29:30.963544Z",
  "last_login": "2026-05-18T06:22:07.630298Z",
  "admin_companies": {
    "id": 64,
    "company_name": "Acme Corp",
    "is_sub_active": true,
    "account_team_size": "1-10",
    "number_of_members": 2,
    "plan_title": "Growth Plan",
    "subscription_date": "2026-07-24T14:08:40.746663Z"
  },
  "managed_companies": [],
  "exe_companies": []
}
```

**Fields removed** — all confirmed `null` or constant in every live response

| Field | Live value | Why |
|---|---|---|
| `custom_data` | `null` | Always null |
| `location` | `"Unknown"` | Always the same string |
| `mobile_number` | `null` | Always null |
| `whatsapp_number` | `null` | Always null |
| `is_whatsapp_active` | `false` | Always false |
| `admin_companies.phone_number` | `null` | Always null |
| `admin_companies.company_website` | `null` | Always null |

---

### `GET /user-management/my-companies/`

Was `GET /user-management/companies`.

**Mock response** — `200`: the `admin_companies` / `managed_companies` /
`exe_companies` subset of the profile above, with the same two company fields
removed.

---

### `POST /auth/send-verification-email/`

Was `POST /login/verification-email`. Requires `Authorization: Bearer`.

**Request** — empty body.

**Mock response** — `200`

```jsonc
{ "message": "Verification email sent successfully." }
```

> The live API spells this key **`details`** (plural) here and `detail`
> everywhere else. Normalised to `message` — see backend issue 5.

**Errors** — `401` unauthenticated · `429` after 3 resends per email.

---

### `POST /auth/verify-email/`

Was `POST /login/otp-email-verification`. Requires `Authorization: Bearer`.

**Request**

```jsonc
{ "otp": "123456" }        // 6 digits
```

**Mock response** — `200`

```jsonc
{ "email": "new@example.com", "message": "Email Verified Successfully" }
```

Verifying flips the account to `is_verified: true`.

**Errors**

| Case | Status | Body |
|---|---|---|
| Wrong OTP | `403` | `{"detail": "OTP has mismatch"}` |
| Expired OTP | `403` | `{"detail": "OTP has expired"}` |
| Not signed in | `401` | `{"detail": "Authentication credentials were not provided."}` |

---

### `POST /auth/forgot-password/`

Was `POST /login/reset-password/email/` — the `/email/` suffix was misleading,
since the email is in the body rather than a sub-resource.

**Request**

```jsonc
{ "email": "admin@xinterview.ai" }
```

**Mock response** — `200`, **for any address**

```jsonc
{ "email": "admin@xinterview.ai", "message": "Password reset email sent." }
```

> ⚠️ **The live API returns `400 {"email": ["User account not found."]}` for an
> unknown address**, which lets anyone test whether an account exists. The mock
> deliberately does **not** reproduce that — see backend issue 2.

---

### `POST /auth/reset-password/otp/`

Was `POST /login/rest-password/otp/` — **typo fixed** (`rest` → `reset`).

**Request**

```jsonc
{ "email": "admin@xinterview.ai", "otp": "123456" }
```

**Mock response** — `200`

```jsonc
{ "token": "MTM0?dd8otl-25edc58b02bab648332b46ee73210b65" }
```

Single-use, shaped `<uid>?<signature>`. Opaque — never parse it.

**Errors** — `403` `{"detail": "OTP has mismatch"}` / `"OTP has expired"`.

---

### `POST /auth/reset-password/{token}/`

Was `POST /login/reset-password/{token}/`.

**Request**

```jsonc
{ "password": "NewHire@1234", "re_password": "NewHire@1234" }
```

**Mock response** — `200`

```jsonc
{ "message": "Password changed successfully" }
```

**Errors**

| Case | Status | Body |
|---|---|---|
| Passwords differ | `400` | `{"non_field_errors": ["Password Mismatch"]}` |
| Token reused or expired | `400` | `{"messages": "Token has been expired!, Bad or expired Token"}` |

The token is **single use** — a replayed reset link fails, exactly as in
production.

---

### `POST /auth/last-seen` — upsert

Replaces **both** `POST /login/update_last_seen` and
`POST /login/create_last_seen`. They were one upsert wearing two names.

**Request** — omit the token to create, send it to refresh.

```jsonc
{ "last_seen_monitor": "eyJhbGciOi..." }   // optional
```

**Mock response** — `200`

```jsonc
{ "last_seen_monitor": "eyJhbGciOi...", "expired": false }
```

**Fields removed** — everything except `last_seen_monitor` and `expired`; only
those two are read.

---

### `POST /companies/` — create company

Was `POST /login/company` — creating a company is not an auth action.
Requires `Authorization: Bearer`.

**Request** — all four fields are required

```jsonc
{
  "company_name": "Acme Corp",
  "account_team_size": "1-10",
  "account_type": "CO",
  "business_type": "Limited Liability Company / LLC / LLP",
  "company_website": "https://acme.example"   // optional
}
```

**Enum values** — confirmed against the live API

`account_type` — the wire value is a **two-letter code**; `Corporate`/`Agency`
are display labels only and are rejected:

| Wire value | Label |
|---|---|
| `CO` | Corporate |
| `AG` | Agency |

`business_type` — the wire value **is** the full label, sent verbatim.
Shortening one (e.g. `LLC`) is rejected:

`Partnership` · `Sole Proprietorship` · `Public Limited Company` ·
`Private Limited Company / LTD / C-Corp / S-Corp / BV` ·
`Limited Liability Company / LLC / LLP` · `Non-Governmental Organization` ·
`Governmental Organization`

**Mock response** — `201`

```jsonc
{
  "id": 88,
  "company_name": "Acme Corp",
  "account_type": "CO",
  "business_type": "Limited Liability Company / LLC / LLP",
  "account_team_size": "1-10",
  "created_at": "2026-08-13T08:19:53.413847Z"
}
```

**Fields removed** — the live API returns **17** fields; 11 are dropped

| Field | Live value | Why |
|---|---|---|
| `company_website` | `null` | Always null on create |
| `phone_number` | `null` | Always null on create |
| `category` | `null` | Always null |
| `subcategory` | `null` | Always null |
| `is_active` | `true` | Internal state, not read by onboarding |
| `domain_name` | `"dev.xinterview.xyz"` | Infrastructure |
| `is_domain_verified` | `true` | Infrastructure |
| `ai_feature_enabled` | `true` | Infrastructure |
| `video_storage_provider` | `"bunny"` | Infrastructure |
| `partnero_partner` | `null` | Infrastructure |
| `partnero_commission_eligible` | `false` | Infrastructure |

**Errors** — `400` with one key per missing field.

---

### `POST /user-management/{companyId}/join/`

Was `POST /login/join-invited-company/{companyId}/` — joining is a user-scoped
action, so it belongs under `/user-management/`. Requires
`Authorization: Bearer`.

**Mock response** — `200`

```jsonc
{ "message": "Joined company successfully" }
```

**Fields removed** — the whole live body is ignored; the client returns
`{ success: true }`.

---

### `GET /companies/invite/{slug}` — 🆕 frontend-proposed

**Does not exist on the backend.** The signup page has to resolve an invite slug
from the link *before* the user has a token, and no endpoint does that today.

**Mock response** — `200`

```jsonc
{ "id": 64, "company_name": "Acme Corp" }
```

**Errors** — `404` `{"detail": "This invite is invalid or has expired."}`

> Needs a backend decision. Until then it is mock-only, so mocking cannot be
> switched off for the invited-signup flow.

---

### Mock test data

| Email | Password | Gives you |
|---|---|---|
| `admin@xinterview.ai` | `password123` | Verified, has company |
| `recruiter@xinterview.ai` | `password123` | Verified, has company |
| `locked@xinterview.ai` | `password123` | 429 lockout |
| `unverified@xinterview.ai` | `password123` | Unverified, no company |

OTP `123456` verifies · `111111` expired · anything else → `OTP has mismatch`.
Invite slug `acme` resolves; anything else 404s.

**Mock-only behaviour** (absent from the live API, marked as such in code):
account lockout after 5 failed logins, and `GET /companies/invite/{slug}`.

---

## 2. Backend issues found

Worth raising with the backend team. Ordered by impact.

### 🔴 1. Validation errors return a stringified Python repr

```jsonc
{ "detail": "{'password': [ErrorDetail(string='This field is required.', code='required')]}" }
```

`POST /auth/tokens` serialises a Python dict into a string. The frontend cannot
parse this into per-field messages without regex-ing a `repr()`. Other endpoints
(`/auth/register`, `/companies/`) already return proper DRF field errors —
**this one should match them.** The mock returns the corrected shape.

### 🔴 2. Forgot-password leaks account existence

```
known address   → 200 {"message": "Password reset email sent."}
unknown address → 400 {"email": ["User account not found."]}
```

An unauthenticated enumeration oracle: anyone can test whether an address has an
account. Login already handles this correctly (same 404 either way); this
endpoint should always report success. **The mock does not reproduce this.**

### 🔴 3. Raw Postgres errors leak to the client

Creating a second company for an account that already has one returns the
database error verbatim, including the internal constraint name and the primary
key value:

```jsonc
{
  "detail": "duplicate key value violates unique constraint \"login_company_admin_id_key\"\nDETAIL:  Key (admin_id)=(113) already exists.\n"
}
```

This exposes schema internals to any authenticated caller and is unusable as UI
copy. Should be a `409` with a stable code, e.g.
`{"code": "COMPANY_ALREADY_EXISTS", "detail": "This account already has a company."}`.

### 🟠 4. Three different error envelopes

| Shape | Example | Used by |
|---|---|---|
| `{detail}` | `{"detail": "Invalid credentials"}` | login, OTP, refresh |
| `{field: [msgs]}` | `{"email": ["Email is already registered."]}` | register, company |
| `{non_field_errors}` / `{messages}` | `{"messages": "Token has been expired!…"}` | reset-password |

Every client must handle all three. One envelope would remove a whole class of
bugs. The frontend normalises all three in `lib/api/auth.ts` — survivable, but it
is doing work the API should.

### 🟠 5. `access` vs `access_token`

`/auth/tokens` and `/auth/register` return `access_token`;
`/api/token/refresh/` returns `access`. Standardise on `access_token`.

### 🟡 6. `details` vs `detail`

`POST /auth/send-verification-email/` returns `details` (plural); everything else
uses `detail`. Almost certainly a typo.

### 🟡 7. No stable machine error codes

Errors carry human English only (`"OTP has mismatch"`), so the frontend must
match on prose. A backend reword silently breaks client branching — and these
strings are also untranslatable. Stable codes (`OTP_MISMATCH`) alongside the
message would fix both.

### 🟡 8. Enum values are not discoverable from the API

`account_type` / `business_type` reject invalid values without listing valid
ones, and `OPTIONS` exposes no choices. **Now unblocked** — the values came from
the existing dev project's form code and were confirmed against the API — but a
new client still cannot discover them without reading another codebase.

### 🟢 9. `/login/tokens` has no trailing slash

Every other route does. Cosmetic, but the kind of inconsistency that costs
someone an afternoon.

---

## 3. Agreed target paths

The `/login/*` prefix is replaced by `/auth/*` — these are authentication
routes, not a "login" resource — and joining a company moves under
`/user-management/`, since it is a user-scoped action.

**The mocks serve the target column.** `LEGACY_AUTH_PATHS` in
`lib/api/auth-contract.ts` records the current column, so switching back is one
line per endpoint if the backend cannot adopt these yet.

| Today (dev) | Target | Change |
|---|---|---|
| `POST /login/tokens` | `POST /auth/tokens` | prefix |
| `POST /login/register` | `POST /auth/register` | prefix |
| `POST /api/token/refresh/` | `POST /api/token/refresh/` | — (returns `access_token`, not `access`) |
| `POST /login/update_last_seen` | `POST /auth/last-seen` | prefix · merged |
| `POST /login/create_last_seen` | `POST /auth/last-seen` | prefix · merged into one upsert |
| `POST /login/reset-password/email/` | `POST /auth/forgot-password/` | prefix · `/email/` suffix was misleading |
| `POST /login/rest-password/otp/` | `POST /auth/reset-password/otp/` | prefix · **typo fixed** |
| `POST /login/reset-password/{token}/` | `POST /auth/reset-password/{token}/` | prefix |
| `POST /login/otp-email-verification` | `POST /auth/verify-email/` | prefix · verbose name |
| `POST /login/verification-email` | `POST /auth/send-verification-email/` | prefix · reversed word order |
| `POST /login/company` | `POST /companies/` | not an auth action |
| `POST /login/join-invited-company/{companyId}/` | `POST /user-management/{companyId}/join/` | user-scoped action |
| `GET /user-management/` | `GET /user-management/me/` | reads like an admin panel |
| `GET /user-management/companies` | `GET /user-management/my-companies/` | ambiguous scope |
| — | `GET /companies/invite/{slug}` | 🆕 frontend-proposed, does not exist yet |

Candidate endpoints from the source doc, unchanged here because they are outside
the auth scope of this pass:

| Today | Target |
|---|---|
| `POST /candidates/guest-otp` | `POST /candidates/guest/send-otp/` |
| `POST /candidates/out-verify` | `POST /candidates/guest/verify-otp/` |
