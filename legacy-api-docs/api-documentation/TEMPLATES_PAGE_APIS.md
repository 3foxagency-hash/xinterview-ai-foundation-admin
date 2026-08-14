# Templates Page APIs

> All calls are authenticated (Bearer token).
> Scope: `/company/templates/` page (`src/views/account/company/TabProperty.tsx`).

---

## /jobs/question-templates

GET / POST

**Naming:** ⚠️ `company_id` is passed as a query parameter (`?company_id=64`) rather than as a path segment — inconsistent with the rest of the API. Missing trailing slash. Suggested: `/jobs/question-templates/{companyId}/`

**Unused response fields:**

- `created_at` (template level) — not referenced anywhere in the codebase.
- `order` (template level) — not read from the response. Visual order is determined by array position; when saving a reorder, the frontend computes `order` from the loop index, not from `template.order`.

---

## /jobs/question-template/{id}/

PUT / DELETE

**Naming:** ⚠️ Issues.

- Singular `question-template` (no `s`) while the list endpoint uses plural `question-templates` — inconsistent.
- `company_id` is again a query parameter (`?company_id=64`) — inconsistent with the individual question endpoints which put company ID in the path.
- Suggested: `PUT /jobs/question-templates/{companyId}/{id}/`, `DELETE /jobs/question-templates/{companyId}/{id}/`

**Unused response fields (PUT):**

- `created_at` (template level) — not referenced.
- `order` (template level) — not read from response.
- `created_at` (question level, within `questions` array) — not referenced.
- `updated_at` (question level) — not referenced.
- `order` (question level) — not read from response; rendering order comes from array position.
- `created_by` (question level) — not referenced anywhere in the codebase; always `null`.

**Unused response fields (DELETE):** No body — 204 No Content.

---

## /jobs/question-temp/{companyId}/{questionId}/

PUT / DELETE

**Naming:** ⚠️ Issues.

- `question-temp` is an opaque abbreviation. `temp` could mean "temporary" or "template" — ambiguous.
- This endpoint operates on an individual question within a template — entirely different from the template-level endpoints above. The naming gives no indication of this relationship.
- The company ID is in the URL path here, but in a query param (`?company_id=`) on the template endpoints — inconsistent.
- Suggested: `/jobs/question-templates/{companyId}/questions/{questionId}/`

**Unused response fields (PUT):**

- `created_at` — not referenced.
- `updated_at` — not referenced.
- `order` — not read from response.
- `created_by` — not referenced; always `null`.

**Unused response fields (DELETE):** No body — 204 No Content.

---

## Naming Issues Summary

| Endpoint | Method | Issue | Suggested Fix |
|---|---|---|---|
| `/jobs/question-templates?company_id={companyId}` | GET / POST | Company ID as query param; missing trailing slash | `/jobs/question-templates/{companyId}/` |
| `/jobs/question-template/{id}/?company_id={companyId}` | PUT / DELETE | Singular vs plural; company ID as query param | `/jobs/question-templates/{companyId}/{id}/` |
| `/jobs/question-temp/{companyId}/{questionId}/` | PUT / DELETE | `question-temp` is ambiguous; inconsistent company ID location | `/jobs/question-templates/{companyId}/questions/{questionId}/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `created_at` (template level) | GET/POST /jobs/question-templates, PUT /jobs/question-template/{id}/ | Not referenced anywhere in the codebase |
| `order` (template level) | GET/POST /jobs/question-templates, PUT /jobs/question-template/{id}/ | Not read from response; reorder uses loop index |
| `created_at`, `updated_at` (question level) | PUT /jobs/question-template/{id}/ (nested), PUT /jobs/question-temp/…/ | Not referenced anywhere in the codebase |
| `order` (question level) | PUT /jobs/question-template/{id}/ (nested), PUT /jobs/question-temp/…/ | Not read from response; rendering order comes from array position |
| `created_by` | PUT /jobs/question-template/{id}/ (nested), PUT /jobs/question-temp/…/ | Not referenced anywhere in the codebase; always `null` |
