# Company Customisation Page APIs

> All calls are authenticated (Bearer token).
> Scope: `/company/customisation/` page (`src/views/account/company/Customisation.tsx`).

---

## /user-management/landing-page/{companyId}/

GET / PATCH

**Naming:** ⚠️ URL ends in a bare numeric ID. Suggested: `/user-management/landing-page/{companyId}/details/`

**Unused response fields (GET):**

- `requirements.custom_field_state` — no UI control reads or writes it; `custom_field` is always forced to `''` in the PATCH payload.
- `whatsapp_candidate` — not in the TypeScript interface, no UI toggle. WhatsApp notifications not yet implemented on frontend. Round-tripped unchanged in every PATCH.
- `whatsapp_candidate_reminder` — same.
- `reject_candidate_whatsapp` — same.
- `auto_review` — not rendered anywhere; round-tripped unchanged in every PATCH.
- `use_custom_prompt` — same.
- `customised_prompt` — same. Also returns the string `"null"` instead of JSON `null` (Python serialization bug).

**Unused response fields (PATCH):**

- JSON path (no file upload): entire response body ignored.
- FormData path (favicon or meta image upload): only `res.favicon` and `res.meta_image` are read; everything else ignored.

---

## /jobs/company-workflow/{companyId}/

GET / POST

**Naming:** ⚠️ `company-workflow` is a compound — the resource is workflow stages scoped to a company. URL ends in a bare numeric ID. Suggested: `/jobs/company/{companyId}/workflow-stages/`

**Unused response fields (GET):**

- `created_at` — not mapped or used anywhere in the component.

**Unused response fields (POST):**

- `title`, `backend_name`, `order`, `created_at`, `company` — all ignored. Only `id` is read from the POST response.

---

## /jobs/company-workflow/{companyId}/{stageId}/

PATCH / DELETE

**Naming:** ⚠️ Two bare numeric IDs at the end. Suggested: `/jobs/company/{companyId}/workflow-stages/{stageId}/`

**Unused response fields (PATCH):** Entire response ignored.

**Unused response fields (DELETE):** No body — 204 No Content.

---

## /jobs/company/{companyId}/reorder-stages/

PATCH

**Naming:** ⚠️ Verb `reorder` in path. Suggested: `POST /jobs/company/{companyId}/workflow-stages/reorder/`

**Unused response fields:** Entire response ignored.

---

## Naming Issues Summary

| Endpoint | Method | Issue | Suggested Fix |
|---|---|---|---|
| `/user-management/landing-page/{companyId}/` | GET / PATCH | Ends in numeric ID | `/user-management/landing-page/{companyId}/details/` |
| `/jobs/company-workflow/{companyId}/` | GET / POST | Compound name; ends in numeric ID | `/jobs/company/{companyId}/workflow-stages/` |
| `/jobs/company-workflow/{companyId}/{stageId}/` | PATCH / DELETE | Two bare IDs | `/jobs/company/{companyId}/workflow-stages/{stageId}/` |
| `/jobs/company/{companyId}/reorder-stages/` | PATCH | Verb in path | `POST /jobs/company/{companyId}/workflow-stages/reorder/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `requirements.custom_field_state` | GET /user-management/landing-page/{companyId}/ | No UI control; `custom_field` always forced to `''` in PATCH |
| `whatsapp_candidate` | GET /user-management/landing-page/{companyId}/ | WhatsApp feature not implemented — no interface type, no UI, round-tripped in PATCH |
| `whatsapp_candidate_reminder` | GET /user-management/landing-page/{companyId}/ | Same |
| `reject_candidate_whatsapp` | GET /user-management/landing-page/{companyId}/ | Same |
| `auto_review` | GET /user-management/landing-page/{companyId}/ | Not in TypeScript interface — no UI, round-tripped in PATCH |
| `use_custom_prompt` | GET /user-management/landing-page/{companyId}/ | Same |
| `customised_prompt` | GET /user-management/landing-page/{companyId}/ | Same. Returns `"null"` string — backend serialization bug |
| `created_at` | GET /jobs/company-workflow/{companyId}/ | Not mapped or used anywhere |
| `title`, `backend_name`, `order`, `created_at`, `company` | POST /jobs/company-workflow/{companyId}/ | Only `id` is read from the POST response |
| Full response | PATCH /jobs/company-workflow/{companyId}/{stageId}/ | Entire response ignored |
| Full response | PATCH /jobs/company/{companyId}/reorder-stages/ | Entire response ignored |
