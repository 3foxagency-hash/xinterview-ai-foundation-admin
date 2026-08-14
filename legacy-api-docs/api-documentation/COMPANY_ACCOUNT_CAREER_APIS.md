# Company Account & Career Page APIs

> All calls are authenticated (Bearer token) unless noted.
> Scope: `/company/*` tabs (AccountSettings, SettingTeam, TabBilling, Cname, CareerPage, TemplateEmail, SmsTemplate) plus the global notification call in the top nav.

---

## /login/company/{companyId}

GET

**Naming:** ⚠️ URL ends in a bare numeric ID. Suggested: `/login/company/{companyId}/details/`

**Unused response fields:**

- `ai_feature_enabled` — not referenced from this endpoint. All consumers read from `selectSubscription` (Redux, loaded from the subscription endpoint).
- `video_storage_provider` — not referenced anywhere in the codebase.
- `partnero_commission_eligible` — not referenced in any component.
- `partnero_partner` — not referenced from the API response; value is read from a browser cookie instead.

---

## /user-management/company/{companyId}

PUT

**Naming:** ⚠️ URL ends in a bare numeric ID. Suggested: `/user-management/company/{companyId}/details/`

**Unused response fields:** Entire response ignored — page reloads on success.

---

## /user-management/company/members/{companyId}

GET / POST

**Naming:** ⚠️ URL ends in a bare numeric ID; ID should precede its sub-resource. Suggested: `/user-management/company/{companyId}/members/`

**Unused response fields (GET):** None.

**Unused response fields (POST):** Entire response ignored — list is re-fetched on success.

---

## /user-management/company/member/{companyId}/{memberId}

DELETE

**Naming:** ⚠️ Uses `/member/` (singular) while the list endpoint uses `/members/` (plural). ID ordering is wrong. Suggested: `/user-management/company/{companyId}/members/{memberId}/`

**Unused response fields:** Entire response ignored — list is re-fetched on success.

---

## /user-management/company/members/{companyId}/{memberId}

PUT

**Naming:** Same restructuring as above — `/user-management/company/{companyId}/members/{memberId}/`

> ⚠️ **Dead endpoint.** `updateCompanyMembers` is never imported or called anywhere in the codebase.

---

## /login/permission/{companyId}/can_add_member/

GET

**Naming:** Underscores inconsistent with hyphenated convention. Suggested: `/login/permission/{companyId}/can-add-member/`

**Unused response fields:** Success response entirely ignored — only success/failure is checked.

---

## /user-management/company/subscription/{companyId}

GET

**Naming:** ⚠️ URL ends in a bare numeric ID. Suggested: `/user-management/company/{companyId}/subscription/`

**Unused response fields (top-level):**

- `stripe_transaction_id` — not referenced anywhere in the codebase.
- `ai_agent_config` — not referenced anywhere in the codebase.
- `notification` — not referenced anywhere in the codebase.
- `order_id` — in Redux store initial state and type definitions only; not rendered.
- `auto_bill` — in Redux store initial state and type definitions only; not rendered.
- `sms_credits` (top-level array) — not referenced. Note: `plan.sms_credits` (the number inside `plan`) IS used — these are two different fields with the same name at different nesting levels.
- `subscription_date` — in Redux store initial state and type definitions only; not rendered.
- `total_jobs_created`, `total_candidate_interviewed`, `total_team_members` — in Redux store initial state and type definitions only; not rendered anywhere.
- `renewal_date` — in Redux store initial state only; not rendered.
- `stripe_id` — in Redux store initial state only; not rendered.
- `company` — not referenced in any component.
- `zapier_key` — not referenced anywhere in the codebase.
- `smtp_enabled` — not referenced anywhere in the codebase.
- `expiration_date` — in type definitions only; not rendered.
- `beta_user` — selector and hook exist but the hook is never imported anywhere.

**Unused response fields (`plan` sub-fields):**

- `plan.currency` — not referenced anywhere.
- `plan.paypal` — not referenced anywhere.
- `plan.stripe` — not referenced anywhere.
- `plan.credit_expires_in` — not referenced anywhere. (Different from `plan.sms_credit_expires_in` which IS used.)
- `plan.type_of_credit` — not referenced anywhere.
- `plan.video_storage_provider` — not referenced anywhere.

---

## /user-management/customer/{companyId}/

GET

**Naming:** ⚠️ `customer` is inconsistent with the `/company/` pattern used elsewhere. URL ends in a bare numeric ID. Suggested: `/user-management/company/{companyId}/billing-portal/`

**Unused response fields:** Only `url` is used.

> **Bug:** Returns `"url": "None?prefilled_email=..."` — Python `None` serialized as the string `"None"` instead of a real Stripe URL. Should return JSON `null` when no Stripe customer exists.

---

## /user-management/avail-free-credits/{companyId}/

POST

**Naming:** ⚠️ `avail` is a non-standard verb. URL ends in a bare numeric ID. Suggested: `/user-management/company/{companyId}/enable-free-credits/`

**Unused response fields:** Entire response ignored.

---

## /user-management/credit-records/{companyId}/

GET

**Naming:** ⚠️ URL ends in a bare numeric ID; sits outside the `/company/{companyId}/` hierarchy. Suggested: `/user-management/company/{companyId}/credit-records/`

**Unused response fields:**

- `id` — not displayed in the billing credits popover.
- `company` — not used; already known from the request URL.

---

## /user-management/read-global-notification/

POST

**Naming:** Verb in path; inconsistent with REST conventions. Suggested: `/user-management/notifications/mark-read/`

**Unused response fields:** Entire response ignored.

---

## /career/career_page/{uuid}/jobs/

GET

**Naming:** ⚠️ `career_page` within the `/career/` prefix is redundant. `/jobs/` suffix misleads — response is the full career page config, not just job listings. Suggested: `GET /career/{uuid}/`

**Unused response fields:**

- `c_name` — not referenced anywhere in the codebase.
- `career_intro_video` — not referenced anywhere in the codebase.
- `company` — numeric company ID; not referenced in any component.

> `meta_tags.meta_title` / `meta_tags.meta_description` — redundant `meta_` prefix. Suggested: `meta_tags.title`, `meta_tags.description`.

---

## /career/career_page/{uuid}/

PUT

**Naming:** ⚠️ Same redundancy as above. Suggested: `PUT /career/{uuid}/`

**Unused response fields:** Entire response ignored — success shows a toast.

---

## /jobs/options-for-career-page/

GET

**Unused response fields:** None.

---

## /jobs/job/{id}/

PATCH (career page modal — toggle `in_career_page`)

**Unused response fields:** Entire response ignored.

---

## Naming Issues Summary

| Endpoint | Method | Issue | Suggested Fix |
|---|---|---|---|
| `/login/company/{companyId}` | GET | Ends in numeric ID | `/login/company/{companyId}/details/` |
| `/login/permission/{companyId}/can_add_member/` | GET | Underscores | `/login/permission/{companyId}/can-add-member/` |
| `/user-management/company/{companyId}` | PUT | Ends in numeric ID | `/user-management/company/{companyId}/details/` |
| `/user-management/company/members/{companyId}` | GET/POST | ID after sub-resource | `/user-management/company/{companyId}/members/` |
| `/user-management/company/member/{companyId}/{memberId}` | DELETE | Singular vs plural; wrong ID ordering | `/user-management/company/{companyId}/members/{memberId}/` |
| `/user-management/company/members/{companyId}/{memberId}` | PUT | Wrong ID ordering (also dead code) | `/user-management/company/{companyId}/members/{memberId}/` |
| `/user-management/company/subscription/{companyId}` | GET | Ends in numeric ID | `/user-management/company/{companyId}/subscription/` |
| `/user-management/customer/{companyId}/` | GET | `customer` inconsistent; ends in numeric ID | `/user-management/company/{companyId}/billing-portal/` |
| `/user-management/avail-free-credits/{companyId}/` | POST | Non-standard verb; ends in numeric ID | `/user-management/company/{companyId}/enable-free-credits/` |
| `/user-management/credit-records/{companyId}/` | GET | Ends in numeric ID; outside company hierarchy | `/user-management/company/{companyId}/credit-records/` |
| `/user-management/read-global-notification/` | POST | Verb in path | `/user-management/notifications/mark-read/` |
| `/career/career_page/{uuid}/jobs/` | GET | `career_page` redundant; `jobs` suffix misleading | `/career/{uuid}/` |
| `/career/career_page/{uuid}/` | PUT | `career_page` redundant | `/career/{uuid}/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `ai_feature_enabled` | GET /login/company/{companyId} | All consumers read from subscription Redux store instead |
| `video_storage_provider` | GET /login/company/{companyId} | Not referenced anywhere in codebase |
| `partnero_commission_eligible`, `partnero_partner` | GET /login/company/{companyId} | Not referenced in any component |
| `id`, `company` | GET /user-management/credit-records/{companyId}/ | Not displayed in credit popover |
| `stripe_transaction_id`, `ai_agent_config`, `notification` | GET /user-management/company/subscription/{companyId} | Not referenced anywhere in codebase |
| `order_id`, `auto_bill`, `subscription_date` | GET /user-management/company/subscription/{companyId} | Redux store initial state and types only — not rendered |
| `total_jobs_created`, `total_candidate_interviewed`, `total_team_members` | GET /user-management/company/subscription/{companyId} | Redux store initial state and types only — not rendered |
| `renewal_date`, `stripe_id`, `expiration_date` | GET /user-management/company/subscription/{companyId} | Redux store and types only — not rendered |
| `company` | GET /user-management/company/subscription/{companyId} | Not referenced in any component |
| `zapier_key`, `smtp_enabled` | GET /user-management/company/subscription/{companyId} | Not referenced anywhere in codebase |
| `beta_user` | GET /user-management/company/subscription/{companyId} | Selector and hook exist but hook is never imported anywhere |
| `sms_credits` (top-level array) | GET /user-management/company/subscription/{companyId} | Not referenced — distinct from `plan.sms_credits` number which IS used |
| `plan.currency`, `plan.paypal`, `plan.stripe` | GET /user-management/company/subscription/{companyId} | Not referenced anywhere in codebase |
| `plan.credit_expires_in`, `plan.type_of_credit`, `plan.video_storage_provider` | GET /user-management/company/subscription/{companyId} | Not referenced anywhere in codebase |
| `c_name`, `career_intro_video`, `company` | GET /career/career_page/{uuid}/jobs/ | Not referenced anywhere in codebase |
| Full response | PUT /user-management/company/{companyId} | Ignored — page reloads |
| Full response | POST /user-management/company/members/{companyId} | Ignored — list re-fetched |
| Full response | DELETE /user-management/company/member/{companyId}/{memberId} | Ignored — list re-fetched |
| Full response | POST /user-management/avail-free-credits/{companyId}/ | Ignored |
| Full response | PUT /career/career_page/{uuid}/ | Ignored — toast only |
| Full response | PATCH /jobs/job/{id}/ (career page toggle) | Ignored |
