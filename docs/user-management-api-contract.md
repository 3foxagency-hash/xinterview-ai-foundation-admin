# User-management API — new contract

**Built from:** `backend-schema/xinterview-schema.yaml` (field names and types) ·
`legacy-api-docs/api-documentation/*.md` (path renames and the record of which
fields the frontend never reads) · the live dev API, for the profile shape.
**Companion to:** `docs/auth-api-real-contract.md`

This is the contract the **frontend and the mocks use**. It applies the legacy
docs' agreed renames and drops the fields nothing reads.

Each endpoint below shows three things:

1. **API** — the new path and request body
2. **Mock response** — exactly what the mock returns, byte-for-byte the shape
   the backend should return
3. **Fields removed** — what the live API sends today that the contract drops,
   and why

---

## 1. New contract

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
  "admin_companies": { /* CompanySummary */ },
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

### `PATCH /user-management/me/` — update profile

Same path, now with an explicit write shape.

**Request** — every field optional

```jsonc
{
  "first_name": "Sarah-Jane",
  "last_name": "Chen",
  "timezone": "Europe/London",
  "language": "English (UK)",
  "profile_pic": "https://…",
  "notification_skipped": true
}
```

**Mock response** — `200`, the updated profile (same shape as `GET`).

**Fields removed from the request**

| Field | Why |
|---|---|
| `location` | Accepted by the API but always `"Unknown"`; nothing writes it |
| `custom_data` | Accepted but always `null` |
| `last_login` | Server-owned; a client should not be able to set it |

**Errors** — `400` `{"first_name": ["This field may not be blank."]}`

---

### `POST /user-management/me/password/` — change password

Was `POST /user-management/password`.

**Request**

```jsonc
{ "old_password": "password123", "new_password": "NewPass@123" }
```

**Mock response** — `200`

```jsonc
{ "message": "Password updated successfully" }
```

**Errors**

| Case | Status | Body |
|---|---|---|
| Wrong current password | `400` | `{"old_password": ["Current password is incorrect."]}` |
| Too short | `400` | `{"new_password": ["Password must be at least 8 characters."]}` |

---

### `GET /user-management/my-companies/`

Was `GET /user-management/companies`.

**Mock response** — `200`: the `admin_companies` / `managed_companies` /
`exe_companies` subset of the profile, with the same two company fields removed.

**Fields removed** — none beyond those. The legacy doc records this response as
used across multiple pages.

---

### `GET /user-management/company/{companyId}/details/`

Was `GET /login/company/{companyId}` — a company read is not an auth action, and
the URL ended in a bare numeric ID.

**Mock response** — `200`

```jsonc
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

**Fields removed**

| Field | Why |
|---|---|
| `ai_feature_enabled` | Read from the subscription endpoint instead (all consumers use `selectSubscription`) |
| `video_storage_provider` | Not referenced anywhere in the codebase |
| `partnero_partner` | Read from a browser cookie, not this response |
| `partnero_commission_eligible` | Not referenced in any component |
| `stripe_id` | Billing internals; no screen reads it |
| `category` · `subcategory` | Always `null` |

---

### `PUT /user-management/company/{companyId}/details/`

Was `PUT /user-management/company/{companyId}`.

**Request** — partial update

```jsonc
{ "company_name": "Acme Corp", "company_website": "https://acme.example" }
```

**Mock response** — `200`, the updated company.

> The legacy doc records the live response as **entirely ignored** — the page
> reloads on success. The mock returns the updated record anyway, so the UI can
> stop reloading and just re-render.

**Errors** — `400` `{"company_name": ["This field may not be blank."]}`

---

### `GET /user-management/company/{companyId}/subscription/`

Was `GET /user-management/company/subscription/{companyId}`.

**Mock response** — `200`

```jsonc
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

**Fields removed**

| Field | Why |
|---|---|
| `stripe_transaction_id` | Not referenced anywhere in the codebase |
| `stripe_id` · `stripe_customer_id` | Billing internals |
| `order_id` | Not read |
| `plan.currency` | Not referenced anywhere |
| `ai_agent_config` | Not read by any settings screen |
| `beta_user` | Not read |
| `grace_until` | Not read |
| `notification` | Not read |
| `domain_name` | Duplicated from the company record |

---

### `GET /user-management/company/{companyId}/credit-records/`

Was `GET /user-management/credit-records/{companyId}/` — the record sits under
the company, so it belongs in that hierarchy.

**Mock response** — `200`

```jsonc
[
  { "expiry_date": "2026-09-24T00:00:00Z", "used_credit": 94, "max_allowed": 100, "is_active": true,  "is_sub_credit": true  },
  { "expiry_date": "2026-12-31T00:00:00Z", "used_credit": 0,  "max_allowed": 25,  "is_active": true,  "is_sub_credit": false }
]
```

**Fields removed**

| Field | Why |
|---|---|
| `id` | Not displayed in the billing credits popover |
| `company` | Already known from the request URL |

---

### `POST /user-management/company/{companyId}/enable-free-credits/`

Was `POST /user-management/avail-free-credits/{companyId}/` — `avail` is not a
standard verb.

**Mock response** — `200`

```jsonc
{ "message": "Free credits added" }
```

**Fields removed** — the whole live body is ignored; the mock returns a message
so the UI can show a toast instead of guessing.

**Errors** — `400` `{"detail": "Free credits have already been claimed."}`

---

### `GET /user-management/company/{companyId}/members/` — team roster

Was `GET /user-management/company/members/{companyId}` — the ID should precede
its sub-resource.

**Mock response** — `200`

```jsonc
{
  "managers": [
    { "id": 501, "email": "marcus.reid@xinterview.ai", "first_name": "Marcus",
      "last_name": "Reid", "role": "MA", "profile_pic": null,
      "last_login": "2026-08-10T09:12:00Z" }
  ],
  "executives": [ /* same shape, role "EX" */ ],
  "invitees": [
    { "id": 601, "email": "pending.invite@example.com", "role": "EX",
      "invited_at": "2026-08-12T10:00:00Z" }
  ]
}
```

> **The grouping is preserved deliberately.** The API returns three arrays
> rather than a flat list with a `role` field, and the team screen renders them
> as separate sections — flattening here would mean re-grouping in the UI.

**Role values** — wire codes, not labels

| Wire value | Label |
|---|---|
| `MA` | Manager |
| `EX` | Executive |

**Fields removed** — none. The legacy doc records this response as fully used.

---

### `POST /user-management/company/{companyId}/members/` — invite

**Request**

```jsonc
{ "email": "new.person@example.com", "role": "EX" }
```

**Mock response** — `200`

```jsonc
{ "message": "Invitation sent" }
```

**Fields removed** — the live response is ignored entirely; the list is
re-fetched on success.

**Errors**

| Case | Status | Body |
|---|---|---|
| Already a member or invited | `400` | `{"email": ["This person is already a member or has a pending invite."]}` |
| Invalid role | `400` | `{"role": ["\"ADMIN\" is not a valid choice."]}` |

---

### `PUT /user-management/company/{companyId}/members/{memberId}/` — change role

**Request** — `{ "role": "MA" }`

**Mock response** — `200`, the updated member.

> The live API returns an empty body. The mock returns the member so the UI can
> update in place rather than re-fetching the whole roster.

---

### `DELETE /user-management/company/{companyId}/members/{memberId}/`

Was `DELETE /user-management/company/member/{companyId}/{memberId}` — note the
live path uses **singular** `/member/` while the list uses plural `/members/`.

**Mock response** — `204 No Content`.

Also removes a **pending invitee** when the id belongs to one, so cancelling an
invite and removing a member are the same call.

---

### `GET /user-management/company/{companyId}/smtp-settings/`

Was `GET /user-management/smtp-settings/{companyId}/`.

**Mock response** — `200`

```jsonc
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

**Fields removed**

| Field | Why |
|---|---|
| `company` | Already known from the request URL |
| `id` | Legacy doc records it as not read — kept here only because delete/update address the record by company, so it is harmless |

`smtp_password` is **write-only** and never returned. That is correct behaviour
and the mock preserves it.

---

### `POST /user-management/company/{companyId}/smtp-settings/`

Replaces `POST /user-management/smtp-settings/create/{companyId}/` — the verb
`create` in the path is redundant on a POST, and the ID position was
inconsistent with the sibling GET/PATCH/DELETE.

It also replaces `POST /user-management/smtp-settings/mailersend/{companyId}/`,
which hardcoded a provider name in the path and would need a new URL for every
provider. Provider now belongs in the body.

**Request**

```jsonc
{
  "smtp_host": "smtp.mailersend.net", "smtp_port": 587,
  "smtp_username": "MS_abc123", "smtp_password": "secret",
  "from_email": "hiring@acme.example", "from_name": "Acme Hiring",
  "use_tls": true, "use_ssl": false
}
```

**Mock response** — `201`, the saved settings with **`is_verified: false`** —
changing the configuration invalidates any previous verification.

**Errors** — `400` with one key per missing field.

---

### `POST /user-management/company/{companyId}/smtp-settings/verify/`

Was `POST /user-management/smtp-settings/{companyId}/verify/`.

**Request** — `{ "email": "test@example.com" }`

**Mock response** — `200`

```jsonc
{ "message": "Test email sent to test@example.com" }
```

**Fields removed**

| Field | Why |
|---|---|
| `status` | Not read; only `message` is shown in the success toast |

---

### `GET|POST /user-management/company/{companyId}/templates/email/`

Was `/user-management/templates/email/{companyId}`.

**Mock response (GET)** — `200`

```jsonc
[
  { "id": 701, "title": "Interview invitation",
    "subject": "You are invited to interview at {{company}}",
    "body": "<p>Hi {{first_name}},</p>…", "is_active": true,
    "created_at": "2026-07-01T09:00:00Z" }
]
```

**Fields removed**

| Field | Why |
|---|---|
| `company` | Already known from the request URL |

---

### `GET|PATCH|DELETE /user-management/templates/email/{templateId}/`

Was `/user-management/template/email/{emailTempId}` — **singular `template`** on
the item route while the collection uses plural `templates`.

`PATCH` accepts `subject`, `body`, `is_active`. `DELETE` returns `204`.

---

### `GET|POST /user-management/company/{companyId}/templates/sms/` · `GET|PATCH|DELETE /user-management/templates/sms/{templateId}/`

Same restructuring as the email templates. SMS templates have no `subject`.

**Fields removed** — `company`, as above.

---

### `GET|PATCH /user-management/company/{companyId}/landing-page/`

Was `/user-management/landing-page/{companyId}/`.

**Mock response** — `200`, 28 fields covering the career, branding, welcome and
thank-you screens:

```jsonc
{
  "id": 1,
  "title": "Welcome to your interview",
  "sub_title": "It should take about 15 minutes.",
  "colour": "#5B4FE9",
  "secondary_colour": "#1F242E",
  "logo": null, "favicon": null, "require_logo": true,
  "intro_note": "", "outro_note": "",
  "starting_instructions": "Find a quiet space and check your camera.",
  "ending_instructions": "Thank you — we will be in touch.",
  "require_starting_instructions": true,
  "require_intro_video": false, "intro_video": null,
  "redirect_url": null,
  "blur_effect": false, "switch_tab": true, "full_screen": false, "copy_paste": true,
  "email_candidate": true, "sms_candidate": false,
  "remind_candidate": 3, "reject_candidate": false,
  "company_privacy_policy_display": false, "company_privacy_policy": null,
  "company_terms_and_conditions_display": false, "company_terms_and_conditions": null
}
```

**Fields removed** — the live endpoint returns **43** fields; 15 are dropped

| Field | Why |
|---|---|
| `requirements.custom_field_state` | No UI control reads or writes it |
| `agency` | Not read by any customisation screen |
| `meta_tags` · `meta_image` | Social preview is configured elsewhere |
| `custom_field` | Superseded by the form-settings screen |
| `sms_remind_candidate` · `sms_candidate_reminder` · `whatsapp_candidate_reminder` | Reminder config collapsed into `remind_candidate` |
| `whatsapp_candidate` · `reject_candidate_sms` · `reject_candidate_whatsapp` | WhatsApp is not in the product yet |
| `auto_review` · `use_custom_prompt` · `customised_prompt` | AI evaluation is configured per job, not per company |
| `company` | Already known from the request URL |

---

### `GET|POST|DELETE /user-management/company/{companyId}/trusted-origins/`

Was `POST /user-management/update-trusted-origin/` and
`DELETE /user-management/update-trusted-origin/{companyId}` — a verb in the
path, and the pair was inconsistent (POST had no company ID, DELETE had no
trailing slash).

**Request (POST)** — `{ "domain": "careers.acme.example", "company": 64 }`

**Mock response** — `200`

```jsonc
{
  "details": {
    "verified": false,
    "verification": [
      { "type": "TXT", "domain": "careers.acme.example",
        "value": "xinterview-verify=7f3a91c2" }
    ]
  }
}
```

**Fields removed** — none. The legacy doc confirms both `details.verified` and
`details.verification[0].value` are read, so the nesting is preserved.

**Errors** — `400` `{"domain": ["Enter a valid domain name."]}`

---

### `POST /user-management/company/{companyId}/domain-check/txt/`

Was `POST /user-management/verify-txt-record/{companyId}/`.

**Mock response** — `200` `{ "message": "Domain verified successfully" }`
**Errors** — `400` `{ "error": "No TXT record found for this domain." }`

> The error key is **`error`**, not `detail` — the legacy doc records the
> frontend parsing `err.response.data.error` for the TXT token, so the mock
> matches. A fourth error envelope; see backend issue 3.

---

### `POST /user-management/domain-check/cname/`

Was `POST /user-management/verify-cname-record/`.

**Mock response** — `200` `{ "message": "CNAME record verified" }`

**Fields removed** — the whole body; only the HTTP status is checked.

---

### `GET /user-management/job-titles/`

Unchanged path.

**Mock response** — `200`

```jsonc
[{ "title": "Senior Frontend Engineer" }, { "title": "Product Manager" }]
```

**Fields removed** — every field except `title`. The frontend maps only
`item.title`.

---

### `POST /user-management/notifications/mark-read/`

Was `POST /user-management/read-global-notification/` — a verb in the path.

**Mock response** — `200` `{ "message": "Notifications marked as read" }`

**Fields removed** — the whole live body is ignored.

---

### `GET|POST /user-management/company/{companyId}/addresses/` — billing address

Was `POST /user-management/address/{companyId}` (POST only — `GET` on that path
returns **405**, so there was no way to list addresses).

**Request (POST)**

```jsonc
{
  "address_line1": "12 Baker Street", "address_line2": "Floor 3",
  "city": "Pune", "state": "MH", "country": "India",
  "country_code": "IN", "zip_code": "411001"
}
```

**Mock response** — `201`

```jsonc
{
  "id": 1,
  "address_line1": "12 Baker Street", "address_line2": "Floor 3",
  "city": "Pune", "state": "MH", "country": "India",
  "country_code": "IN", "zip_code": "411001"
}
```

**Fields removed** — none. Captured live; the API returns exactly these 8.

---

### `GET|PUT|DELETE /user-management/company/{companyId}/addresses/{addressId}/`

Was `/user-management/address/{companyId}/{addressId}`.

`DELETE` → `200 {"message": "Address deleted"}`.

> ⚠️ **The live `PUT` silently ignores `address_line1` and `address_line2`.**
> Confirmed by sending both and re-reading the record: `city`, `state`,
> `country_code` and `zip_code` all updated; the two street lines did not. The
> mock writes **every** field, which is what a correct implementation does — see
> backend issue 9.

---

### `GET /user-management/company/{companyId}/billings/` — invoices

Was `GET /user-management/company/billings/{companyId}`.

**Mock response** — `200`, newest first

```jsonc
[
  {
    "id": 56,
    "plan": { "id": 7, "title": "Flagship" },
    "invoice_number": "1784735877-P7",
    "amount": "50.00",
    "currency": "usd",
    "payment_status": "paid",
    "payment_method": "stripe",
    "payment_date": "2026-07-22T16:01:00Z",
    "date": "2026-07-22T15:57:57.568997Z",
    "billing_type": "subscription",
    "quantity": 1,
    "hosted_invoice_url": "https://invoice.stripe.example/i/inv_56",
    "invoice_pdf_url": "https://invoice.stripe.example/i/inv_56/pdf"
  }
]
```

**Fields removed** — the live API returns **25** fields per invoice plus a
**35-field** nested `plan`; 12 + 33 are dropped

| Field | Live value | Why |
|---|---|---|
| `stripe_customer_id` · `stripe_subscription_id` · `stripe_payment_intent_id` · `stripe_invoice_id` | `null` | Payment-processor internals |
| `session_id` | 66-char string | Checkout-session internal |
| `billing_reason` | `""` | Empty on every observed invoice |
| `period_start` · `period_end` | `null` | Never populated |
| `billing_address_snapshot` | `null` | Never populated |
| `credit_package` · `coupon` | `null` | Never populated |
| `company` | `"743355"` | Already known from the request URL |
| `plan.*` — 33 entitlement flags | `number_of_users`, `white_label`, `cname`, `avatar_allowed`, … | An invoice list shows **which plan was billed**, not what it unlocks. Trimmed to `{id, title}` |

`hosted_invoice_url` and `invoice_pdf_url` are kept even though both are `""` on
dev data — the billing table links to them.

---

### `GET /user-management/company/{companyId}/billings/{billingId}/`

Same shape, single record.

---

### `POST /user-management/company/{companyId}/coupons/`

Was `POST /user-management/coupons/{companyId}/`.

**Request** — `{ "coupon_code": "LAUNCH20" }` (case-insensitive)

**Mock response** — `200`

```jsonc
{
  "message": "Coupon applied — 20% off the first year.",
  "coupon": "LAUNCH20",
  "plans": []
}
```

**Fields removed**

| Field | Live value | Why |
|---|---|---|
| `path` | `null` | `null` on both success and error; reads like a server-side debugging artefact |

**Errors** — `404` `{"error": "Coupon not found"}`

> The error key is **`error`** with no `detail` — a **fifth** envelope. See
> backend issue 3.

**Seeded codes:** `LAUNCH20` (20% off) · `WELCOME10` (10% off).

---

### `PUT /user-management/me/email/` — change email

Was `PUT /user-management/email` — despite the name it is a profile action, so
it belongs beside `me/password/`.

**Request** — `{ "email": "new.address@example.com" }`

**Mock response** — `200`

```jsonc
{ "message": "Email sent successfully to 'new.address@example.com'." }
```

The address is **not** changed immediately — a confirmation link is sent, and
the mock matches that by not mutating the profile.

**Fields removed**

| Field | Why |
|---|---|
| `details` | The live API uses the plural typo here too. Normalised to `message` — see backend issue 6 in the auth doc |

**Errors** — `400` on an invalid address, or one already in use.

---

### `POST /jobs/generate/description/` — AI job description

Was `POST /user-management/generate-description/`. Moved out of
`/user-management/` entirely: it produces **job** content.

**Request** — `{ "job_title": "Senior Frontend Engineer" }`

**Mock response** — `200`

```jsonc
{
  "summary": "We are seeking a Senior Frontend Engineer to design, build and maintain…",
  "responsibilities": ["Own the delivery of …", "…"],
  "requirements": ["Proven experience in …", "…"]
}
```

> ⚠️ **The OpenAPI spec is wrong for this endpoint.** It documents the request
> as `{title, description, requirement, benefits}` and the response as a full
> **Job** object (24 fields). The live API rejects `title` with
> `400 "Some Error occurred, try again later, 'job_title'"` and returns the
> three-field shape above. Captured live — see backend issue 10.

---

### `POST /jobs/generate/questions/` — AI questions

Was `POST /user-management/generate-questions/`.

**Request** — `{ "job_title": "Data Scientist", "total": 4 }`

**Mock response** — `200`

```jsonc
{
  "title": "Data Scientist",
  "questions": [
    { "question_type": "text", "title": "Describe a challenging problem…", "options": null },
    { "question_type": "single correct", "title": "Which approach…", "options": ["…", "…", "…"] }
  ]
}
```

Observed `question_type` values: **`text`** and **`single correct`** (with a
space — not `single_choice`, which is what the jobs contract uses internally).

> ⚠️ **Spec is wrong here too.** It documents the request as
> `{title, questions}`; the live API requires **`job_title`** and **`total`**,
> and rejects the spec's names with a Pydantic validation dump.

Mock output is **deterministic** — the same request returns the same questions,
so screenshots and tests stay stable.

---

### `POST /jobs/generate/evaluation-factors/` — AI evaluation factors

Was `POST /user-management/generate-factor-evaluation/`.

**Request** — `{ "job_id": "job_01hxseed" }`

**Mock response** — `200`

```jsonc
{
  "factors": [
    { "name": "Technical depth", "description": "Understands core concepts…", "weight": 30 },
    { "name": "Communication",   "description": "Expresses ideas clearly…",   "weight": 25 },
    { "name": "Problem solving", "description": "Approaches problems…",       "weight": 25 },
    { "name": "Cultural fit",    "description": "Aligns with team values…",   "weight": 20 }
  ]
}
```

Weights total 100.

> The live API requires a `job_id` for an existing job, so this response shape
> comes from the spec plus the jobs contract rather than a live capture — the
> only endpoint in §1 not confirmed against a real response. The spec's claim
> that it returns a full Job object is almost certainly wrong, as with its two
> siblings.

---

### Mock test data

Sign in as `admin@xinterview.ai` / `password123` (company id **64**).

| Resource | Seeded |
|---|---|
| Team | 2 managers, 1 executive, 1 pending invitee |
| Subscription | Growth Plan · 6 credits · 94/100 candidates used |
| Credit records | 2 rows, so the popover renders a list |
| SMTP | Configured and verified, `smtp.mailersend.net` |
| Email templates | 3 (one inactive) |
| SMS templates | 2 (one inactive) |
| Landing page | Fully populated |
| Trusted origin | `careers.acme.example`, **unverified** — so the verify flow is reachable |
| Billing address | 1 address |
| Invoices | 3 — paid, unpaid and a credit top-up, so every status badge renders |
| Coupons | `LAUNCH20` · `WELCOME10` |

**Mock-only behaviour:** domain verification always succeeds once a domain is
registered — a real DNS lookup cannot resolve locally. Use the dev panel's
`error500` scenario to exercise the failure path.

---

## 2. Backend issues found

Additional to the ones in `docs/auth-api-real-contract.md`.

### 🔴 1. Company scoping is taken from the URL

Every endpoint carries `{companyId}` in the path, but the caller's company is
already determined by their token. Unless the backend checks that the two match,
any authenticated user can read another company's members, subscription, SMTP
credentials and templates by editing the URL.

**The mock deliberately does not trust the path** — it resolves the company from
the session and ignores the `{companyId}` segment. Worth confirming the backend
does the same; if it does, the segment is redundant and could be dropped
entirely.

### 🟠 2. Singular vs plural on the same resource

```
GET    /user-management/company/members/{companyId}          ← plural
DELETE /user-management/company/member/{companyId}/{memberId} ← singular
GET    /user-management/templates/email/{companyId}          ← plural
PATCH  /user-management/template/email/{emailTempId}         ← singular
```

Both pairs address the same resource. The collection/item split should not
change the noun.

### 🟠 3. A fourth error envelope

`POST /user-management/verify-txt-record/{companyId}/` returns
`{"error": "…"}` — not `{detail}`, not `{field: [msgs]}`, not
`{non_field_errors}`. That is four shapes across the API; see auth issue 4.

### 🔴 9. `PUT` on an address silently drops two fields

Sending a full address to `PUT /user-management/address/{companyId}/{addressId}`
updates `city`, `state`, `country_code` and `zip_code` — but **`address_line1`
and `address_line2` are ignored**. Confirmed by writing both and re-reading the
record. It returns `200`, so a user sees "saved" while the street address stays
unchanged.

The mock writes every field.

### 🔴 10. The spec is wrong for all three `generate-*` endpoints

| | Spec says | The API actually does |
|---|---|---|
| `generate-description` request | `{title, description, requirement, benefits}` | `{job_title}` |
| `generate-description` response | a full **Job** object, 24 fields | `{summary, responsibilities[], requirements[]}` |
| `generate-questions` request | `{title, questions}` | `{job_title, total}` |
| `generate-questions` response | `{title, questions}` | matches |

Sending the spec's field names returns a raw **Pydantic validation dump**:

```jsonc
{ "details": "Some Error occurred, try again later, 2 validation errors for
   GenerateQuestionsPayload\njob_title\n  Field required [type=missing, …]" }
```

Two problems: the spec cannot be trusted for these endpoints, and the error
leaks an internal validator's stack trace as user-facing text. The mock uses the
**live** shapes.

### 🟡 4. Verbs in paths

`avail-free-credits`, `read-global-notification`, `verify-cname-record`,
`verify-txt-record`, `update-trusted-origin`, `smtp-settings/create`. Each
describes an action rather than a resource; the HTTP method already carries the
verb.

### 🟡 5. Provider name hardcoded in a path

`POST /user-management/smtp-settings/mailersend/{companyId}/` needs a new URL for
every SMTP provider added. The provider belongs in the request body.

### 🟡 6. URLs ending in a bare numeric ID

`/user-management/company/{companyId}`, `/company/subscription/{companyId}`,
`/credit-records/{companyId}/`, `/customer/{companyId}/`. A trailing ID with no
sub-resource reads as a collection filter rather than a specific record; adding
`/details/` (or moving the ID before its sub-resource) removes the ambiguity.

### 🟡 7. `/list/` suffix

`GET /user-management/sms-configuration/{companyId}/list/` — a GET on a
collection already implies a list.

### 🟢 8. `customer` vs `company`

`/user-management/customer/{companyId}/` is the only endpoint calling the same
entity a *customer*. Only `url` is read from its response.

---

## 3. Agreed target paths

**The mocks serve the target column.** `LEGACY_UM_PATHS` in
`lib/api/user-management-contract.ts` records the current column, so switching
back is one line per endpoint.

The shape the legacy docs argue for is
`/user-management/company/{companyId}/<sub-resource>/`: the ID precedes its
sub-resource, no URL ends in a bare numeric ID, and no verb appears in a path.

| Today (dev) | Target | Change |
|---|---|---|
| `GET /user-management/` | `GET /user-management/me/` | reads like an admin panel |
| `PATCH /user-management/` | `PATCH /user-management/me/` | same |
| `POST /user-management/password` | `POST /user-management/me/password/` | user-scoped |
| `GET /user-management/companies` | `GET /user-management/my-companies/` | ambiguous scope |
| `GET /login/company/{companyId}` | `GET /user-management/company/{companyId}/details/` | not an auth action; bare ID |
| `PUT /user-management/company/{companyId}` | `PUT /user-management/company/{companyId}/details/` | bare ID |
| `GET /user-management/company/subscription/{companyId}` | `GET /user-management/company/{companyId}/subscription/` | ID before sub-resource |
| `GET /user-management/credit-records/{companyId}/` | `GET /user-management/company/{companyId}/credit-records/` | outside the company hierarchy |
| `POST /user-management/avail-free-credits/{companyId}/` | `POST /user-management/company/{companyId}/enable-free-credits/` | non-standard verb |
| `GET|POST /user-management/company/members/{companyId}` | `…/company/{companyId}/members/` | ID before sub-resource |
| `DELETE /user-management/company/member/{companyId}/{memberId}` | `…/company/{companyId}/members/{memberId}/` | singular → plural |
| `GET|PATCH|DELETE /user-management/smtp-settings/{companyId}/` | `…/company/{companyId}/smtp-settings/` | ID before sub-resource |
| `POST /user-management/smtp-settings/create/{companyId}/` | `POST …/company/{companyId}/smtp-settings/` | verb in path |
| `POST /user-management/smtp-settings/mailersend/{companyId}/` | `POST …/company/{companyId}/smtp-settings/` | provider in path |
| `POST /user-management/smtp-settings/{companyId}/verify/` | `POST …/company/{companyId}/smtp-settings/verify/` | ID before sub-resource |
| `GET|POST /user-management/templates/email/{companyId}` | `…/company/{companyId}/templates/email/` | ID before sub-resource |
| `GET|PATCH|DELETE /user-management/template/email/{id}` | `…/templates/email/{id}/` | singular → plural |
| `GET|POST /user-management/templates/sms/{companyId}` | `…/company/{companyId}/templates/sms/` | ID before sub-resource |
| `GET|PATCH|DELETE /user-management/template/sms/{id}` | `…/templates/sms/{id}/` | singular → plural |
| `GET|PATCH /user-management/landing-page/{companyId}/` | `…/company/{companyId}/landing-page/` | ID before sub-resource |
| `POST /user-management/update-trusted-origin/` | `POST …/company/{companyId}/trusted-origins/` | verb in path |
| `DELETE /user-management/update-trusted-origin/{companyId}` | `DELETE …/company/{companyId}/trusted-origins/` | verb; missing trailing slash |
| `POST /user-management/verify-cname-record/` | `POST /user-management/domain-check/cname/` | verb-heavy |
| `POST /user-management/verify-txt-record/{companyId}/` | `POST …/company/{companyId}/domain-check/txt/` | verb-heavy; inconsistent with the CNAME sibling |
| `POST /user-management/read-global-notification/` | `POST /user-management/notifications/mark-read/` | verb in path |
| `POST /user-management/address/{companyId}` | `GET|POST …/company/{companyId}/addresses/` | ID before sub-resource; `GET` was 405 |
| `GET|PUT|DELETE /user-management/address/{companyId}/{addressId}` | `…/company/{companyId}/addresses/{addressId}/` | ID before sub-resource |
| `GET /user-management/company/billings/{companyId}` | `GET …/company/{companyId}/billings/` | ID before sub-resource |
| `GET /user-management/company/billings/{companyId}/{id}` | `GET …/company/{companyId}/billings/{billingId}/` | same |
| `POST /user-management/coupons/{companyId}/` | `POST …/company/{companyId}/coupons/` | outside the company hierarchy |
| `PUT /user-management/email` | `PUT /user-management/me/email/` | a profile action, like `me/password/` |
| `POST /user-management/generate-description/` | `POST /jobs/generate/description/` | produces **job** content, not user-management |
| `POST /user-management/generate-questions/` | `POST /jobs/generate/questions/` | same |
| `POST /user-management/generate-factor-evaluation/` | `POST /jobs/generate/evaluation-factors/` | same |
| `GET /user-management/job-titles/` | *unchanged* | — |

### Documented but not mocked

Present in the legacy docs and the spec, left out of this pass because no screen
in the rebuild consumes them yet:

| Endpoint | Why deferred |
|---|---|
| `/user-management/company-video-store/{companyId}/` | Video provider config — no UI in the rebuild yet |
| `/user-management/sms-configuration/*` | Twilio/SMS provider config — belongs with the SMS work |
| `/user-management/customer/{companyId}/` | Only `url` is read; used by a billing-portal redirect |
| `/user-management/generate-*` (description, questions, factors) | AI generation — belongs with the jobs wizard |
| `/user-management/departments/*` · `/agent-config/*` · `/address/*` | Not reachable from any current screen |

Add them the same way when a screen needs one: types → repo (`companyId` first)
→ handler (`applyScenario()` first) → client function.

---

## 4. In the spec but not in this contract

`backend-schema/xinterview-schema.yaml` publishes **55 user-management paths /
88 operations**. Sections 1–3 now cover **34 paths / 56 operations**.

The remaining **21 paths / 32 operations** are listed here so nothing is
invisible. None is referenced anywhere the legacy docs record, so they are
probably backend- or integration-only surface.

Shapes below are read straight from the spec — they are **not** filtered for
unused fields, because no consumer has been analysed yet. Apply the same
treatment as Sections 1–2 when one is picked up.

> **Note on spec accuracy.** Three endpoints that *were* in this section are now
> mocked (§1), and for all three the spec's documented request and response were
> **wrong** — see backend issue 10. Verify against the live API before building
> on any shape below.

### 4.1 Not referenced by the legacy frontend

Twenty-one paths with no mention in the legacy docs. Most look like backend,
integration or candidate-side surface rather than admin UI.

| Method | Path | Purpose (inferred) |
|---|---|---|
| `GET` | `/user-management/accept-invite/{uidb64}/{token}` | Email invite link landing → `{messages}` |
| `POST` | `/user-management/verify-email/` | Distinct from `/auth/verify-email/`; overlap worth querying |
| `POST` | `/user-management/phone-number/` | Sets `phone_number` + `whatsapp_number` on the profile |
| `GET` | `/user-management/credits-logs/` | Credit ledger: `entry_type`, `delta`, `reason`, `source`, `actor` |
| `GET` `POST` | `/user-management/departments/{companyId}` | Department CRUD — `{id, title, company}` |
| `GET` `PATCH` `DELETE` | `/user-management/departments/{companyId}/{id}` | |
| `POST` | `/user-management/agent-config/` | AI agent provider keys: `stt_*`, `llm_*`, `tts_*`, `avatar_key` |
| `GET` `PATCH` | `/user-management/agent-config/{id}/` | Response omits every `*_key` — write-only, which is correct |
| `GET` | `/user-management/livekit-agent-config/{candidateId}/` | Candidate-side; returns no documented body |
| `GET` | `/user-management/communication/{companyId}/configurations/` | Twilio/SIP config list |
| `POST` | `…/configurations/create/` | `{provider, name, number}` |
| `GET` `DELETE` | `…/configurations/{id}/` | |
| `PATCH` | `…/configurations/{id}/phone/` | Phone channel: `account_sid`, `auth_token`, `domain_name`, `user_name`, `password` |
| `PATCH` | `…/configurations/{id}/sms/` | SMS channel |
| `PATCH` | `…/configurations/{id}/whatsapp/` | WhatsApp channel |
| `GET` | `/user-management/shareable-link/branding/{companyId}/` | `favicon`, `meta_image`, `meta_tags` |
| `PATCH` | `/user-management/shareable-link/branding/{id}/update/` | Note: `{id}` here, `{companyId}` on the GET |
| `GET` `POST` | `/user-management/templates/event/{companyId}` | Event templates — `{id, title, body, company}` |
| `GET` `PATCH` `DELETE` | `/user-management/template/event/{tempId}` | |
| `GET` `POST` | `/user-management/templates/whatsapp/{companyId}` | WhatsApp templates — uses `details`, not `body` |
| `GET` `PATCH` `DELETE` | `/user-management/template/whatsapp/{tempId}` | |

**Notes**

- **Event and WhatsApp templates** are the same resource family as the email and
  SMS templates in §1, with the identical singular/plural inconsistency
  (`/templates/…` collection, `/template/…` item). When they are mocked they
  should follow §3's target naming. WhatsApp templates name their content field
  `details` while email/SMS use `body` — worth aligning.
- **`/communication/…/configurations/`** is the modern replacement for the
  legacy `/sms-configuration/*` endpoints listed under "Documented but not
  mocked" in §3. Both exist in the spec; confirm which is current before
  building against either.
- **`/shareable-link/branding/`** takes `{companyId}` on `GET` but `{id}` on
  `PATCH` — the same object addressed two ways.
- **`POST /user-management/verify-email/`** overlaps
  `POST /auth/verify-email/` (§1 of the auth contract). Two email-verification
  endpoints in different namespaces is worth a question to the backend.

### 4.2 Coverage summary

| | Paths | Operations |
|---|---|---|
| Covered by this contract (§1–3) | 34 | 56 |
| Not referenced anywhere (§4) | 21 | 32 |
| **Spec total** | **55** | **88** |

Regenerate this comparison after any spec update:

```bash
npm run api:types    # refresh the generated types first
```
