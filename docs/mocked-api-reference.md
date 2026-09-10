# Mocked API reference

Every endpoint currently mocked by MSW (`mocks/handlers/auth.ts` and
`mocks/handlers/user-management.ts`), with a sample request payload and
sample response body for each — copy-pasteable for manual testing or writing
a real backend against. See `docs/msw-mocking.md` for the toggle, the
mocked-vs-deferred status table, and the reconciliation notes; this document
is the payload/response reference only.

All paths are relative to `NEXT_PUBLIC_API_BASE_URL` (`http://localhost:8080`
in dev). All bodies are JSON. Auth-required endpoints expect
`Authorization: Bearer <access_token>` — the mock layer additionally reads a
mock-only `X-Mock-User-Email` header (set automatically by
`lib/api/client.ts`) to resolve "the signed-in user," since the fake JWT
carries no real claims.

---

## Auth (`mocks/handlers/auth.ts`)

### `POST /auth/tokens` — login

**Request**

```json
{ "email": "admin@xinterview.ai", "password": "password123" }
```

**Response — `200`**

```json
{
  "access_token": "eyJhbGciOi.a1b2c3.d4e5f6",
  "refresh_token": "eyJhbGciOi.g7h8i9.j0k1l2",
  "last_seen_monitor": "eyJhbGciOi.m3n4o5.p6q7r8"
}
```

**Errors**

| Case | Status | Body |
|---|---|---|
| Wrong password / unknown email | `404` | `{ "detail": "Invalid credentials" }` |
| Locked account (`locked@xinterview.ai`, or 5 failed attempts on any account) | `429` (header `Retry-After: 900`) | `{ "detail": "Too many failed attempts. Try again later." }` |

---

### `POST /auth/register`

**Request**

```json
{
  "email": "new@example.com",
  "password": "Hire@123",
  "first_name": "New",
  "last_name": "User",
  "company": 64
}
```

`company` is optional — only sent when accepting an invite.

**Response — `201`**

```json
{
  "access_token": "eyJhbGciOi.a1b2c3.d4e5f6",
  "refresh_token": "eyJhbGciOi.g7h8i9.j0k1l2",
  "last_seen_monitor": "eyJhbGciOi.m3n4o5.p6q7r8",
  "email": "new@example.com",
  "first_name": "New",
  "last_name": "User",
  "joining_company_details": { "id": 64, "company_name": "Acme Corp" }
}
```

`joining_company_details` is present only when `company` matched a seeded
invite (currently only `id: 64`, "Acme Corp"); omitted otherwise.

**Errors**

| Case | Status | Body |
|---|---|---|
| Duplicate email | `400` | `{ "email": ["Email is already registered."] }` |
| Missing field | `400` | `{ "<field>": ["This field is required."] }` |

---

### `POST /api/token/refresh/`

**Request**

```json
{ "refresh": "eyJhbGciOi.g7h8i9.j0k1l2" }
```

**Response — `200`**

```json
{ "access_token": "eyJhbGciOi.newtoken.xyz789" }
```

**Errors** — `401` `{ "detail": "Token is invalid", "code": "token_not_valid" }` (missing/empty `refresh`).

---

### `GET /user-management/me/` — current user

No body. Requires `Authorization: Bearer`.

**Response — `200`**

```json
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
    "number_of_members": 4,
    "plan_title": "Growth Plan",
    "subscription_date": "2026-07-24T14:08:40.746663Z"
  },
  "managed_companies": [],
  "exe_companies": []
}
```

For `unverified@xinterview.ai`, `is_verified: false`, `company_created: false`,
`admin_companies: null`.

**Errors** — `401` `{ "detail": "Authentication credentials were not provided." }` if no recognized session.

---

### `GET /user-management/my-companies/`

Same auth requirement. **Response — `200`** — the `admin_companies` /
`managed_companies` / `exe_companies` subset of the profile above:

```json
{
  "admin_companies": {
    "id": 64,
    "company_name": "Acme Corp",
    "is_sub_active": true,
    "account_team_size": "1-10",
    "number_of_members": 4,
    "plan_title": "Growth Plan",
    "subscription_date": "2026-07-24T14:08:40.746663Z"
  },
  "managed_companies": [],
  "exe_companies": []
}
```

---

### `POST /auth/send-verification-email/`

Empty body. Requires `Authorization: Bearer`.

**Response — `200`**

```json
{ "message": "Verification email sent successfully." }
```

**Errors** — `401` unauthenticated.

---

### `POST /auth/verify-email/`

Requires `Authorization: Bearer`.

**Request**

```json
{ "otp": "123456" }
```

**Response — `200`**

```json
{ "email": "new@example.com", "message": "Email Verified Successfully" }
```

**Errors**

| Case | Status | Body |
|---|---|---|
| OTP `111111` | `403` | `{ "detail": "OTP has expired" }` |
| Any other wrong code | `403` | `{ "detail": "OTP has mismatch" }` |
| Not signed in | `401` | `{ "detail": "Authentication credentials were not provided." }` |

---

### `POST /auth/forgot-password/`

**Request**

```json
{ "email": "admin@xinterview.ai" }
```

**Response — `200`**, for any address (no enumeration, by design):

```json
{ "email": "admin@xinterview.ai", "message": "Password reset email sent." }
```

---

### `POST /auth/reset-password/otp/`

**Request**

```json
{ "email": "admin@xinterview.ai", "otp": "123456" }
```

**Response — `200`**

```json
{ "token": "113?a1b2c3d4e5f6" }
```

**Errors** — `403` `{ "detail": "OTP has mismatch" }` or `{ "detail": "OTP has expired" }` (for OTP `111111`).

---

### `POST /auth/reset-password/{token}/`

**Request**

```json
{ "password": "NewHire@1234", "re_password": "NewHire@1234" }
```

**Response — `200`**

```json
{ "message": "Password changed successfully" }
```

**Errors**

| Case | Status | Body |
|---|---|---|
| Passwords differ | `400` | `{ "non_field_errors": ["Password Mismatch"] }` |
| Token is literally `"used"` (mock's stand-in for "already consumed") | `400` | `{ "messages": "Token has been expired!, Bad or expired Token" }` |

---

### `POST /auth/last-seen` — upsert

**Request** (token optional — omit to create, send to refresh)

```json
{ "last_seen_monitor": "eyJhbGciOi.m3n4o5.p6q7r8" }
```

**Response — `200`**

```json
{ "last_seen_monitor": "eyJhbGciOi.m3n4o5.p6q7r8", "expired": false }
```

---

### `POST /companies/` — create company

Requires `Authorization: Bearer`.

**Request**

```json
{
  "company_name": "Acme Corp",
  "account_team_size": "1-10",
  "account_type": "CO",
  "business_type": "Limited Liability Company / LLC / LLP",
  "company_website": "https://acme.example"
}
```

`account_type` is `CO` (Corporate) or `AG` (Agency). `company_website` is optional.

**Response — `201`**

```json
{
  "id": 64,
  "company_name": "Acme Corp",
  "account_type": "CO",
  "business_type": "Limited Liability Company / LLC / LLP",
  "account_team_size": "1-10",
  "created_at": "2026-09-08T10:00:00.000Z"
}
```

**Errors** — `400` `{ "<field>": ["This field is required."] }` per missing required field.

---

### `POST /user-management/{companyId}/join/`

Requires `Authorization: Bearer`. No meaningful request body.

**Response — `200`**

```json
{ "message": "Joined company successfully" }
```

---

### `GET /companies/invite/{slug}`

Mock-only — doesn't exist on the real backend yet.

**Response — `200`** (slug `acme`)

```json
{ "id": 64, "company_name": "Acme Corp" }
```

**Errors** — `404` `{ "detail": "This invite is invalid or has expired." }` for any other slug.

---

## User-management (`mocks/handlers/user-management.ts`)

Company id is hardcoded to **64** in the mock (`{companyId}` in the path is
accepted but ignored — the mock resolves the company from the session, not
the URL, matching the doc's own security note about not trusting the path).

### `PATCH /user-management/me/` — update profile

**Request** — every field optional

```json
{ "first_name": "Sarah-Jane", "last_name": "Chen" }
```

Only `first_name`/`last_name` are actually persisted by the mock;
`timezone`/`language`/`profile_pic`/`notification_skipped` are accepted but
not stored server-side in this pass.

**Response — `200`** — the updated profile, same shape as `GET /user-management/me/`.

---

### `POST /user-management/me/password/` — change password

**Request**

```json
{ "old_password": "password123", "new_password": "NewPass@123" }
```

**Response — `200`**

```json
{ "message": "Password updated successfully" }
```

**Errors**

| Case | Status | Body |
|---|---|---|
| Wrong current password | `400` | `{ "old_password": ["Current password is incorrect."] }` |
| Too short | `400` | `{ "new_password": ["Password must be at least 8 characters."] }` |

---

### `PUT /user-management/me/email/` — change email

**Request**

```json
{ "email": "new.address@example.com" }
```

**Response — `200`**

```json
{ "message": "Email sent successfully to 'new.address@example.com'." }
```

The address is not changed immediately — matches the doc's confirmation-link behavior.

---

### `GET /user-management/company/{companyId}/details/`

No body. **Response — `200`**

```json
{
  "id": 64,
  "company_name": "Acme Corp",
  "logo": null,
  "account_type": "CO",
  "account_team_size": "1-10",
  "business_type": "technology",
  "company_website": "https://acme.example",
  "phone_number": null,
  "created_at": "2026-07-24T14:08:40.746663Z",
  "is_active": true,
  "domain_name": null,
  "is_domain_verified": false
}
```

---

### `PUT /user-management/company/{companyId}/details/`

**Request**

```json
{ "company_name": "Acme Corp", "company_website": "https://acme.example" }
```

**Response — `200`** — the updated record (same shape as the `GET` above).

**Errors** — `400` `{ "company_name": ["This field may not be blank."] }`

---

### `GET /user-management/company/{companyId}/subscription/`

**Response — `200`**

```json
{
  "id": 1,
  "plan": {
    "id": 1,
    "title": "Growth Plan",
    "price": "49.00",
    "interval": "month",
    "max_jobs": null,
    "max_candidates": 100,
    "max_team_members": 10
  },
  "total_jobs_created": "12",
  "total_candidate_interviewed": "94",
  "total_team_members": "4",
  "credits": "6",
  "sms_credits": "120",
  "renewal_date": "2026-09-24T00:00:00Z",
  "subscription_date": "2026-07-24T14:08:40.746663Z",
  "expiration_date": "2026-09-24T00:00:00Z",
  "status": "active",
  "auto_bill": true,
  "cancel_at_period_end": false,
  "availed_free_credits": true,
  "ai_feature_enabled": "true",
  "company": 64
}
```

---

### `GET /user-management/company/{companyId}/credit-records/`

**Response — `200`**

```json
[
  {
    "expiry_date": "2026-09-24T00:00:00Z",
    "used_credit": 94,
    "max_allowed": 100,
    "is_active": true,
    "is_sub_credit": true
  },
  {
    "expiry_date": "2026-12-31T00:00:00Z",
    "used_credit": 0,
    "max_allowed": 25,
    "is_active": true,
    "is_sub_credit": false
  }
]
```

---

### `POST /user-management/company/{companyId}/enable-free-credits/`

No meaningful request body.

**Response — `200`**

```json
{ "message": "Free credits added" }
```

---

### `GET /user-management/company/{companyId}/members/` — team roster

**Response — `200`**

```json
{
  "managers": [
    {
      "id": 501,
      "email": "marcus.reid@xinterview.ai",
      "first_name": "Marcus",
      "last_name": "Reid",
      "role": "MA",
      "profile_pic": null,
      "last_login": "2026-08-10T09:12:00Z"
    },
    {
      "id": 502,
      "email": "priya.nair@xinterview.ai",
      "first_name": "Priya",
      "last_name": "Nair",
      "role": "MA",
      "profile_pic": null,
      "last_login": "2026-08-09T11:45:00Z"
    }
  ],
  "executives": [
    {
      "id": 503,
      "email": "james.okafor@xinterview.ai",
      "first_name": "James",
      "last_name": "Okafor",
      "role": "EX",
      "profile_pic": null,
      "last_login": "2026-08-08T15:20:00Z"
    }
  ],
  "invitees": [
    {
      "id": 601,
      "email": "pending.invite@example.com",
      "role": "EX",
      "invited_at": "2026-08-12T10:00:00Z"
    }
  ]
}
```

`role` wire codes: `MA` = Manager, `EX` = Executive. The signed-in account
owner is not included in this list (matches the doc — see
`lib/api/settings.ts#mapRosterToMembers`, which adds the owner client-side).

---

### `POST /user-management/company/{companyId}/members/` — invite

**Request**

```json
{ "email": "new.person@example.com", "role": "EX" }
```

**Response — `200`**

```json
{ "message": "Invitation sent" }
```

**Errors**

| Case | Status | Body |
|---|---|---|
| Already a member or invited | `400` | `{ "email": ["This person is already a member or has a pending invite."] }` |
| Invalid role | `400` | `{ "role": ["\"ADMIN\" is not a valid choice."] }` |

---

### `PUT /user-management/company/{companyId}/members/{memberId}/` — change role

**Request**

```json
{ "role": "MA" }
```

**Response — `200`** — the updated member:

```json
{
  "id": 503,
  "email": "james.okafor@xinterview.ai",
  "first_name": "James",
  "last_name": "Okafor",
  "role": "MA",
  "profile_pic": null,
  "last_login": "2026-08-08T15:20:00Z"
}
```

**Errors** — `404` `{ "detail": "Not found." }` for an unknown `memberId`.

---

### `DELETE /user-management/company/{companyId}/members/{memberId}/`

No request body. **Response — `204 No Content`**. Also removes a pending
invitee when the id belongs to one.

---

### `GET /user-management/company/{companyId}/smtp-settings/`

**Response — `200`**

```json
{
  "id": 1,
  "smtp_host": "smtp.mailersend.net",
  "smtp_port": 587,
  "smtp_username": "MS_abc123",
  "from_email": "hiring@acme.example",
  "from_name": "Acme Hiring",
  "use_tls": true,
  "use_ssl": false,
  "is_verified": true
}
```

`smtp_password` is write-only and never returned.

**Errors** — `404` `{ "detail": "Not found." }` if no SMTP config has ever been saved. Note: `disconnectSmtp()` in `lib/api/settings.ts` clears SMTP client-side only in this pass (no DELETE endpoint exists in either doc) — so disconnecting in the UI does not make this endpoint start 404ing; it comes back configured on next load. See `docs/msw-mocking.md`.

---

### `POST /user-management/company/{companyId}/smtp-settings/`

**Request**

```json
{
  "smtp_host": "smtp.mailersend.net",
  "smtp_port": 587,
  "smtp_username": "MS_abc123",
  "smtp_password": "secret",
  "from_email": "hiring@acme.example",
  "from_name": "Acme Hiring",
  "use_tls": true,
  "use_ssl": false
}
```

**Response — `201`** — the saved settings, with `is_verified: false` (changing
config invalidates any previous verification):

```json
{
  "id": 1,
  "smtp_host": "smtp.mailersend.net",
  "smtp_port": 587,
  "smtp_username": "MS_abc123",
  "from_email": "hiring@acme.example",
  "from_name": "Acme Hiring",
  "use_tls": true,
  "use_ssl": false,
  "is_verified": false
}
```

**Errors** — `400` `{ "<field>": ["This field is required."] }` per missing required field.

---

### `POST /user-management/company/{companyId}/smtp-settings/verify/`

**Request**

```json
{ "email": "test@example.com" }
```

**Response — `200`**

```json
{ "message": "Test email sent to test@example.com" }
```

---

### `POST /user-management/company/{companyId}/coupons/`

**Request**

```json
{ "coupon_code": "welcome10" }
```

Case-insensitive.

**Response — `200`**

```json
{
  "message": "Coupon applied — 10% off the first year.",
  "coupon": "WELCOME10",
  "plans": []
}
```

Seeded codes: `LAUNCH20` (20% off), `WELCOME10` (10% off).

**Errors** — `404` `{ "error": "Coupon not found" }` for any other code.

---

### `GET /user-management/company/{companyId}/addresses/`

**Response — `200`**

```json
[
  {
    "id": 1,
    "address_line1": "12 Baker Street",
    "address_line2": "Floor 3",
    "city": "Pune",
    "state": "MH",
    "country": "India",
    "country_code": "IN",
    "zip_code": "411001"
  }
]
```

---

### `POST /user-management/company/{companyId}/addresses/`

**Request**

```json
{
  "address_line1": "221B Baker Street",
  "address_line2": "",
  "city": "London",
  "state": "London",
  "country": "United Kingdom",
  "country_code": "GB",
  "zip_code": "NW1 6XE"
}
```

**Response — `201`** — the created record, with a generated `id`.

---

### `PUT /user-management/company/{companyId}/addresses/{addressId}/`

**Request** — same shape as the `POST` body above (full replace; the mock
writes every field, unlike the documented backend bug where
`address_line1`/`address_line2` are silently dropped).

**Response — `200`** — the updated record. **Errors** — `404` `{ "detail": "Not found." }`.

---

### `DELETE /user-management/company/{companyId}/addresses/{addressId}/`

**Response — `200`**

```json
{ "message": "Address deleted" }
```

---

### `GET /user-management/company/{companyId}/trusted-origins/`

**Response — `200`**

```json
{
  "details": {
    "domain": "careers.acme.example",
    "verified": false,
    "verification": [
      {
        "type": "TXT",
        "domain": "careers.acme.example",
        "value": "xinterview-verify=7f3a91c2"
      }
    ]
  }
}
```

---

### `POST /user-management/company/{companyId}/trusted-origins/`

**Request**

```json
{ "domain": "careers.acme.example", "company": 64 }
```

**Response — `200`** — same `{ "details": {...} }` shape as the `GET` above, with a freshly generated TXT value.

**Errors** — `400` `{ "domain": ["Enter a valid domain name."] }`

---

### `DELETE /user-management/company/{companyId}/trusted-origins/`

No request body. **Response — `204 No Content`**.

---

### `POST /user-management/company/{companyId}/domain-check/txt/`

No request body needed (verifies whatever trusted origin is currently set).

**Response — `200`**

```json
{ "message": "Domain verified successfully" }
```

**Errors** — `400` `{ "error": "No TXT record found for this domain." }` if no trusted origin is registered.

---

### `POST /user-management/domain-check/cname/`

No request body.

**Response — `200`**

```json
{ "message": "CNAME record verified" }
```

---

### `GET /user-management/job-titles/`

**Response — `200`**

```json
[
  { "title": "Senior Frontend Engineer" },
  { "title": "Product Manager" }
]
```

---

## Sample cURL for manual testing

```bash
curl -X POST http://localhost:8080/auth/tokens \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@xinterview.ai","password":"password123"}'
```

This only works when the browser's MSW Service Worker is intercepting the
request (i.e., from within the running app) — a bare `curl` from a terminal
hits the real `NEXT_PUBLIC_API_BASE_URL` with nothing listening and will
fail. To exercise handlers from a terminal, use the Vitest suite
(`lib/api/auth.test.ts`, which runs against `mocks/server.ts`) instead.

## Seeded accounts & data

See `docs/msw-mocking.md` → "Seeded test data" for the full list of mock
accounts, OTP codes, invite slugs, and company 64's seeded team/subscription/
SMTP/address/coupon data — reproduced there so it isn't duplicated across two
documents.
