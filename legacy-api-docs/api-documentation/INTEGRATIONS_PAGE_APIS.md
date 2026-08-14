# Integrations Page APIs

> All calls are authenticated (Bearer token).
> Scope: `/company/cname/` page (`src/views/account/company/Cname.tsx` and its modals).
> Twilio Telephone Integration (`/user-management/telephone-config/`) is excluded from this document.

---

## /login/company/{companyId}

GET

**Naming:** ⚠️ URL ends in a bare numeric ID. Suggested: `/login/company/{companyId}/details/`

**Unused response fields:**

- `ai_feature_enabled` — not referenced anywhere; subscription features are read from the subscription endpoint via Redux.
- `video_storage_provider` — not referenced anywhere in the codebase.
- `partnero_commission_eligible` — not referenced in any component.
- `partnero_partner` — not referenced from the API response; value is read from a browser cookie instead.

---

## /social/keys/

GET

**Naming:** ⚠️ `keys` is ambiguous. Suggested: `/social/api-keys/`

**Unused response fields:** None — `name`, `is_expired`, and `expiry_date` are all displayed in the API keys table.

---

## /social/generate/api-key/{companyId}/

POST

**Naming:** ⚠️ Verb `generate` in path; `generate/api-key/` is an inconsistent sub-path under `/social/`. Suggested: `POST /social/api-keys/{companyId}/`

**Unused response fields:**

- `id` — not read anywhere.
- `created_at` — not read; same content as `created` (duplicate field).
- `prefix` — not read; internal Knox key prefix.
- `hashed_key` — not read; backend-only.
- `created` — not read; duplicate of `created_at`.
- `revoked` — not read; always `false` on creation.
- `company` — not read; already known from the request URL.

> **Missing field:** Frontend reads `res.is_expired` from this response to update the local row, but `is_expired` is not included in the POST response. Add `is_expired` to the POST response for consistency with the GET list.

---

## /social/generate/api-key/{companyId}/{name}/

DELETE

**Naming:** ⚠️ Same verb-path issue as the POST. Suggested: `DELETE /social/api-keys/{companyId}/{name}/`

**Unused response fields:** None — returns 204 No Content; `detail` string is read if present on non-204 responses.

---

## /user-management/company-video-store/{companyId}/

GET / POST / DELETE

**Naming:** ⚠️ `company-video-store` reads like a file storage bucket, not a video provider configuration. Suggested: `/user-management/video-provider/{companyId}/`

**Unused response fields (GET):**

- `company` — not read; always known from the request URL.
- `access_key` — not read or displayed (correctly omitted from UI for security, but this means it is returned in the response and silently discarded).

**Unused response fields (POST):** Entire response not read — a toast is shown and `onSuccess()` triggers a re-fetch.

**Unused response fields (DELETE):** Returns 204 No Content; no fields to read.

---

## /user-management/smtp-settings/{companyId}/

GET

**Naming:** No change needed.

**Unused response fields:**

- `id` — not read.
- `smtp_host` — stored in state but never rendered or passed to the SMTP modal (which uses Redux state).
- `smtp_port` — same.
- `smtp_username` — same.
- `from_name` — same.
- `use_tls` — same.
- `use_ssl` — same.
- `is_verified` — not rendered anywhere on this page.
- `company` — not read; already known from the request URL.

> Only `from_email` is used: it is displayed in the configured SMTP card.

---

## /user-management/smtp-settings/create/{companyId}/

POST

**Naming:** ⚠️ Verb `create` in path; the company ID position after `create` is inconsistent with the GET/PATCH/DELETE paths. Suggested: `POST /user-management/smtp-settings/{companyId}/` (making POST/GET/PATCH/DELETE all share the same path).

**Unused response fields:** Entire response not read — the wizard advances to the next step on success.

---

## /user-management/smtp-settings/{companyId}/

PATCH

**Naming:** No change needed.

**Unused response fields:** Entire response not read — same as POST.

---

## /user-management/smtp-settings/mailersend/{companyId}/

POST

**Naming:** ⚠️ Provider name `mailersend` hardcoded in the path. This requires a new URL for every new SMTP provider. Suggested: unify with the standard SMTP create endpoint (`POST /user-management/smtp-settings/{companyId}/`) and pass `"provider": "mailersend"` in the request body.

> The response shape for this endpoint differs from the standard SMTP create — it returns only `{ smtp_username, from_email, from_name }`, omitting `id`, `smtp_host`, `smtp_port`, `use_tls`, `use_ssl`, `is_verified`, `company`. This asymmetry makes clients treat the two endpoints differently even though they manage the same resource.

**Unused response fields:** Entire response not read.

---

## /user-management/smtp-settings/{companyId}/verify/

POST

**Naming:** No change needed.

**Unused response fields:**

- `status` — not read; only `message` is displayed in the success toast.

---

## /user-management/smtp-settings/{companyId}/

DELETE

**Naming:** No change needed.

**Unused response fields:** Returns 204 No Content; no fields to read.

---

## /user-management/sms-configuration/{companyId}/list/

GET

**Naming:** ⚠️ `/list/` suffix is non-RESTful — GET on a collection already implies a list. Suggested: `GET /user-management/sms-configuration/{companyId}/`

**Unused response fields:**

- `company` — not read; already known from the request URL.
- `provider` — not read or displayed anywhere.
- `whatsapp_enabled` — not rendered; hardcoded to `false` when sending updates.
- `whatsapp_verified` — not rendered anywhere.

---

## /user-management/sms-configuration/create/

POST

**Naming:** ⚠️ Verb `create` in path; no company ID in URL (company is sent in body instead). Suggested: `POST /user-management/sms-configuration/{companyId}/`

> **Request field typo:** `reciepient_number` should be `recipient_number`.

**Unused response fields:**

- `id` — not read from the POST response (only used from the GET list response for delete/update operations).
- `company` — not read.
- `provider` — not read.
- `phone_number` — not read (already known from the form).
- `account_sid` — not read.
- `whatsapp_enabled` — not read.
- `whatsapp_verified` — not read.

> Only `sms_verified` is read — it determines whether the success or failure toast is shown.

---

## /user-management/sms-configuration/{id}/

PATCH

**Naming:** No change needed.

**Unused response fields:**

- `id`, `company`, `provider`, `phone_number`, `account_sid`, `whatsapp_enabled`, `whatsapp_verified` — none read.

> Only `sms_verified` is read — same as POST.

---

## /user-management/sms-configuration/{id}/

DELETE

**Naming:** No change needed.

**Unused response fields:** Entire response not read.

---

## /user-management/verify-cname-record/

POST

**Naming:** ⚠️ Verb-heavy action phrase. Suggested: `POST /user-management/domain-check/cname/`

**Unused response fields:** Only the HTTP status code is checked (`res.status == 200`). Any success response body is ignored. The `error` string from error responses is read and displayed.

---

## /user-management/update-trusted-origin/

POST

**Naming:** ⚠️ Verb in path; the resource is a domain/trusted origin, not an update action. Suggested: `POST /user-management/trusted-origins/`

**Unused response fields:** None — `res.data.details.verified` and `res.data.details.verification[0].value` are both read and used to decide the next UI step.

---

## /user-management/verify-txt-record/{companyId}/

POST

**Naming:** ⚠️ Verb-heavy; inconsistent with `verify-cname-record` (cname check has no `{companyId}` in path, TXT check does). Suggested: `POST /user-management/domain-check/txt/{companyId}/`

**Unused response fields:** None — `res.data.message` (success) and `err.response.data.error` (error, parsed for TXT token) are both read.

---

## /user-management/update-trusted-origin/{companyId}

DELETE

**Naming:** ⚠️ Verb in path; missing trailing slash; inconsistent with the POST sibling. Suggested: `DELETE /user-management/trusted-origins/{companyId}/`

**Unused response fields:** None — `res.data.message` is shown in the success toast.

---

## Naming Issues Summary

| Endpoint | Issue | Suggested Fix |
|---|---|---|
| `GET /login/company/{companyId}` | Bare numeric ID at end | `/login/company/{companyId}/details/` |
| `GET /social/keys/` | `keys` is ambiguous | `/social/api-keys/` |
| `POST /social/generate/api-key/{companyId}/` | Verb in path; non-standard sub-path | `POST /social/api-keys/{companyId}/` |
| `DELETE /social/generate/api-key/{companyId}/{name}/` | Same verb-path issue | `DELETE /social/api-keys/{companyId}/{name}/` |
| `GET/POST/DELETE /user-management/company-video-store/{companyId}/` | Misleading resource name | `/user-management/video-provider/{companyId}/` |
| `POST /user-management/smtp-settings/create/{companyId}/` | Verb `create` in path; inconsistent ID position | `POST /user-management/smtp-settings/{companyId}/` |
| `POST /user-management/smtp-settings/mailersend/{companyId}/` | Provider name in path; asymmetric response shape | Unify with standard SMTP POST; pass `"provider"` in body |
| `GET /user-management/sms-configuration/{companyId}/list/` | `/list/` suffix is non-RESTful | `GET /user-management/sms-configuration/{companyId}/` |
| `POST /user-management/sms-configuration/create/` | Verb in path; company in body instead of URL | `POST /user-management/sms-configuration/{companyId}/` |
| `POST /user-management/verify-cname-record/` | Verb-heavy action phrase | `POST /user-management/domain-check/cname/` |
| `POST /user-management/update-trusted-origin/` | Verb in path | `POST /user-management/trusted-origins/` |
| `DELETE /user-management/update-trusted-origin/{companyId}` | Verb in path; missing trailing slash | `DELETE /user-management/trusted-origins/{companyId}/` |
| `POST /user-management/verify-txt-record/{companyId}/` | Verb-heavy; inconsistent with CNAME path | `POST /user-management/domain-check/txt/{companyId}/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `ai_feature_enabled` | GET /login/company/{companyId} | Not referenced anywhere |
| `video_storage_provider` | GET /login/company/{companyId} | Not referenced anywhere |
| `partnero_commission_eligible` | GET /login/company/{companyId} | Not referenced anywhere |
| `partnero_partner` | GET /login/company/{companyId} | Read from cookie instead |
| `id`, `created_at`, `prefix`, `hashed_key`, `created`, `revoked`, `company` | POST /social/generate/api-key/{companyId}/ | Not read |
| `company` | GET /user-management/company-video-store/{companyId}/ | Already known from URL |
| `access_key` | GET /user-management/company-video-store/{companyId}/ | Not displayed; returned in response but silently discarded |
| Full response | POST /user-management/company-video-store/{companyId}/ | Not read |
| `id`, `smtp_host`, `smtp_port`, `smtp_username`, `from_name`, `use_tls`, `use_ssl`, `is_verified`, `company` | GET /user-management/smtp-settings/{companyId}/ | Stored in state but never rendered or passed to the edit modal |
| Full response | POST /user-management/smtp-settings/create/{companyId}/ | Not read |
| Full response | PATCH /user-management/smtp-settings/{companyId}/ | Not read |
| Full response | POST /user-management/smtp-settings/mailersend/{companyId}/ | Not read |
| `status` | POST /user-management/smtp-settings/{companyId}/verify/ | Not read; only `message` is used |
| `company`, `provider`, `whatsapp_enabled`, `whatsapp_verified` | GET /user-management/sms-configuration/{companyId}/list/ | Not read anywhere |
| `id`, `company`, `provider`, `phone_number`, `account_sid`, `whatsapp_enabled`, `whatsapp_verified` | POST /user-management/sms-configuration/create/ | Not read |
| `id`, `company`, `provider`, `phone_number`, `account_sid`, `whatsapp_enabled`, `whatsapp_verified` | PATCH /user-management/sms-configuration/{id}/ | Not read |
| Full response | DELETE /user-management/sms-configuration/{id}/ | Not read |
| Success body | POST /user-management/verify-cname-record/ | Only HTTP status code is checked |
