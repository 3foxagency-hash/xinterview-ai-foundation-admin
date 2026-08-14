# Job Create & Edit APIs (AI Video Interview)

> Scope: `/jobs/create/` and `/jobs/{uuid}/edit/?activeStep=N` (AI Video Interview type).

---

## /user-management/companies

GET

**Naming:** ⚠️ Missing trailing slash — inconsistent with every other endpoint. Suggested: `/user-management/companies/`

**Unused response fields:**

- `admin_companies.phone_number` — not used anywhere in the codebase.
- `admin_companies.company_website` — not used anywhere in the codebase.
- `admin_companies.is_sub_active` — not used anywhere in the codebase.
- `admin_companies.plan_title` — not used anywhere in the codebase.
- `admin_companies.subscription_date` — not used anywhere in the codebase.

---

## /login/timezones/

GET

**Unused response fields:** None.

---

## /user-management/job-titles/

GET

**Unused response fields:** Any fields beyond `title` — frontend maps only `item.title` from the array.

---

## /login/permission/{companyId}/can_create_job/

GET

**Naming:** ⚠️ Underscores inconsistent with hyphenated convention. `detail` as a success key is confusing (DRF error key used for success). Suggested: `/login/permission/{companyId}/can-create-job/`, return `{ "allowed": true }`.

**Unused response fields:** None — `detail` is the only returned value and it is checked.

---

## /user-management/generate-description/

POST

**Naming:** ⚠️ Verb `generate` in path. Suggested: `POST /user-management/job-description/generate/`

**Unused response fields:** None.

---

## /jobs/

POST

**Naming:** No change needed.

> ⚠️ Response wraps the job in `{ "job": {...}, "team": N }` but `PATCH /jobs/job/{uuid}/` returns the job object directly. Inconsistent — frontend must use different field access paths.

**Unused response fields:**

- `job.thank_you_video` — not used anywhere in the codebase.
- `job.employment_type`, `job.experience_level` — in TypeScript type only; not rendered.
- `team` — auto-created team record ID; not used anywhere.

---

## /jobs/job/{uuid}/

GET / PATCH

**Naming:** ⚠️ `job` segment is redundant under the `/jobs/` prefix. Suggested: `/jobs/{uuid}/`

> `"Timezone"` field uses a capital T — the only field in the entire API with a capital letter. Suggested: `"timezone"`.

**Unused response fields:**

- `employment_type`, `experience_level` — in TypeScript type only; not rendered anywhere.
- `thank_you_video` — not used anywhere in the codebase.

---

## /jobs/question/

GET `?job_id={uuid}` / PATCH `?job_id={uuid}` / DELETE `?job_id={uuid}`

**Naming:** ⚠️ Singular `question` — resource is naturally a list. `job_id` as query param instead of path segment is inconsistent. Suggested: `/jobs/{uuid}/questions/`

**Unused response fields:**

- `created_at` — not rendered or used anywhere.
- `updated_at` — not rendered or used anywhere.

---

## /jobs/bulk-question-create/

POST

**Naming:** ⚠️ Verb `create` in path. Suggested: `POST /jobs/questions/bulk/`

**Unused response fields:**

- `created_at`, `updated_at` (per question) — not used anywhere in the codebase.

---

## /jobs/question-templates

GET `?company_id={id}`

**Naming:** ⚠️ Missing trailing slash. Singular vs plural inconsistency with other template endpoints. Suggested: `/jobs/question-templates/`

**Unused response fields:** None on this page.

---

## /user-management/generate-questions/

POST

**Naming:** ⚠️ Verb `generate` in path. Suggested: `POST /user-management/questions/generate/`

**Unused response fields:**

- `title` (generated job title echo) — stored in a state variable but never rendered in any UI element.

---

## /jobs/ai-include-questions/{uuid}/

PATCH

**Naming:** ⚠️ Verb phrase `ai-include` in path. `questionIds` key uses camelCase in an otherwise snake_case payload. Suggested: `/jobs/{uuid}/questions/ai-scoring/`

**Unused response fields:** Entire response ignored.

---

## /jobs/team/{uuid}/

GET / PATCH / PUT

**Naming:** ⚠️ `uuid` is a job UUID, not a team UUID — URL reads as if fetching a team by its own ID. Suggested: `/jobs/{uuid}/team/`

**Unused response fields (GET):**

- `id` — team record's own ID; not used anywhere.
- `job` — job UUID echo; not used.
- `notify_recruiters` — stored in state but no UI toggle reads or writes this field specifically.

**Unused response fields (PATCH / PUT):** Entire response ignored — full re-fetch triggered immediately after.

---

## /jobs/team/{uuid}/available/

GET

**Naming:** ⚠️ Same UUID scoping issue as above. Suggested: `/jobs/{uuid}/team/available/`

**Unused response fields:** None.

---

## /jobs/noify-members-on-complete/{uuid}/

PATCH

**Naming:** ⚠️ **Typo** — `noify` should be `notify`. Fix to: `/jobs/notify-members-on-complete/{uuid}/`. Also consider: `/jobs/{uuid}/team/completion-notify/`

> Response key `"Message"` uses capital M — inconsistent with DRF snake_case convention.

**Unused response fields:** Entire response ignored — full re-fetch triggered.

---

## /jobs/landing-page/{uuid}/

GET / PATCH

**Naming:** ⚠️ Bare UUID at end without descriptive segment. Suggested: `/jobs/{uuid}/landing-page/`

**Unused response fields (GET):**

- `whatsapp_candidate`, `whatsapp_candidate_reminder`, `reject_candidate_whatsapp` — WhatsApp feature not implemented on frontend; round-tripped unchanged in every PATCH.
- `requirements.custom_field_state` — no UI control; `custom_field` always forced to `""` in PATCH.

**Unused response fields (PATCH):**

- JSON path: entire response ignored.
- FormData path: only `res.favicon` or `res.meta_image` read; everything else ignored.

---

## /jobs/job-workflow/{uuid}/

GET / POST

**Naming:** ⚠️ `job` prefix redundant under `/jobs/`. Suggested: `/jobs/{uuid}/workflow-stages/`

**Unused response fields (GET):**

- `created_at` — not used.
- `job` — already known from URL.

**Unused response fields (POST):**

- `title`, `backend_name`, `order`, `created_at`, `job` — all ignored. Only `id` is read.

---

## /jobs/job-workflow/{uuid}/{stageId}/

PATCH / DELETE

**Naming:** ⚠️ Two bare IDs. Suggested: `/jobs/{uuid}/workflow-stages/{stageId}/`

**Unused response fields (PATCH):** Entire response ignored.

**Unused response fields (DELETE):** No body — 204 No Content.

---

## /jobs/job/{uuid}/reorder-stages/

PATCH

**Naming:** ⚠️ Verb in path; redundant `job` segment. Suggested: `POST /jobs/{uuid}/workflow-stages/reorder/`

**Unused response fields:** Entire response ignored.

---

## /jobs/ai-evaluation-setup/{uuid}/

GET / PATCH

**Naming:** ⚠️ `setup` vs `config` — inconsistent with other AI config endpoints that use `-config` suffix. Suggested: `/jobs/{uuid}/ai-evaluation-config/`

**Unused response fields:**

- `id` — not read; record always accessed via job UUID in the path.
- `job` — already known from URL.

---

## /jobs/jobs/{uuid}/factors/

GET / POST

**Naming:** ⚠️ Double `jobs` prefix — `/jobs/jobs/{uuid}/factors/`. Suggested: `/jobs/{uuid}/factors/`

**Unused response fields:**

- `ai_evaluation_config` — integer ID linking factor to AI evaluation setup; not used anywhere in the UI.

---

## /jobs/jobs/{uuid}/factors/{factorId}/

PATCH / DELETE

**Naming:** ⚠️ Same double `jobs` prefix. Suggested: `/jobs/{uuid}/factors/{factorId}/`

**Unused response fields:**

- `ai_evaluation_config` — not used anywhere in the UI.

---

## /user-management/generate-factor-evaluation/

POST

**Naming:** ⚠️ Verb `generate` in path; long compound. Suggested: `POST /user-management/evaluation-factors/generate/`

**Unused response fields:**

- `skills[]` — AI-suggested skills array; not stored or displayed anywhere in the frontend.
- `scoring_rubric` — per-score rubric object; not stored or displayed anywhere.

---

## /jobs/manage-factors-questions/

PATCH

**Naming:** ⚠️ Verb-noun compound; no job UUID scoping in the URL. Suggested: `PATCH /jobs/{uuid}/factors/question-mapping/`

**Unused response fields:** Entire response ignored.

---

## /jobs/job-ai-config/{uuid}/

GET

**Naming:** ⚠️ `job` redundant; naming inconsistency with `ai-evaluation-setup`. Suggested: `/jobs/{uuid}/ai-interview-config/`

**Unused response fields:** None when config exists.

---

## /candidates/direct-invite/

POST

**Naming:** ⚠️ Verb in path; takes job UUID but is under `/candidates/`. Suggested: `POST /jobs/{uuid}/invite-link/`

**Unused response fields:** None — `url` is the only returned field and it is used.

---

## /candidates/

POST

**Naming:** No change needed.

**Unused response fields:** None confirmed as unused everywhere — candidate object is used extensively across workflow and interview views.

---

## /candidates/bulk-upload/{jobId}/

POST

**Naming:** ⚠️ `{jobId}` is actually a UUID, not a numeric integer. Suggested: `/candidates/bulk-upload/{jobUuid}/` or `/jobs/{uuid}/candidates/bulk-upload/`

**Unused response fields:** None.

---

## Naming Issues Summary

| Endpoint | Method | Issue | Suggested Fix |
|---|---|---|---|
| `/user-management/companies` | GET | Missing trailing slash | `/user-management/companies/` |
| `/login/permission/{id}/can_create_job/` | GET | Underscores; misleading `detail` key | `/login/permission/{id}/can-create-job/` |
| `/user-management/generate-description/` | POST | Verb in path | `/user-management/job-description/generate/` |
| `/user-management/generate-questions/` | POST | Verb in path | `/user-management/questions/generate/` |
| `/user-management/generate-factor-evaluation/` | POST | Verb in path | `/user-management/evaluation-factors/generate/` |
| `/jobs/` | POST | Response wraps job in `{ "job": {...} }` but PATCH returns job directly | Make both consistent |
| `/jobs/job/{uuid}/` | GET, PATCH | `job` segment redundant | `/jobs/{uuid}/` |
| `/jobs/question/` | GET | Singular; query param instead of path | `/jobs/{uuid}/questions/` |
| `/jobs/bulk-question-create/` | POST | Verb in path | `/jobs/questions/bulk/` |
| `/jobs/question/{id}/` | PATCH, DELETE | Singular; query param `job_id` | `/jobs/{uuid}/questions/{id}/` |
| `/jobs/question-templates` | GET | Missing trailing slash | `/jobs/question-templates/` |
| `/jobs/ai-include-questions/{uuid}/` | PATCH | Verb phrase; camelCase in payload | `/jobs/{uuid}/questions/ai-scoring/` |
| `/jobs/team/{uuid}/` | GET, PATCH, PUT | UUID is job UUID, not team UUID | `/jobs/{uuid}/team/` |
| `/jobs/team/{uuid}/available/` | GET | Same UUID scoping issue | `/jobs/{uuid}/team/available/` |
| `/jobs/noify-members-on-complete/{uuid}/` | PATCH | **Typo:** `noify` → `notify` | `/jobs/notify-members-on-complete/{uuid}/` |
| `/jobs/landing-page/{uuid}/` | GET, PATCH | Bare UUID at end | `/jobs/{uuid}/landing-page/` |
| `/jobs/job-workflow/{uuid}/` | GET, POST | Redundant `job`; bare UUID | `/jobs/{uuid}/workflow-stages/` |
| `/jobs/job-workflow/{uuid}/{stageId}/` | PATCH, DELETE | Two bare IDs | `/jobs/{uuid}/workflow-stages/{stageId}/` |
| `/jobs/job/{uuid}/reorder-stages/` | PATCH | Verb in path; redundant `job` | `POST /jobs/{uuid}/workflow-stages/reorder/` |
| `/jobs/ai-evaluation-setup/{uuid}/` | GET, PATCH | `setup` vs `config` inconsistency | `/jobs/{uuid}/ai-evaluation-config/` |
| `/jobs/jobs/{uuid}/factors/` | GET, POST | Double `jobs` prefix | `/jobs/{uuid}/factors/` |
| `/jobs/jobs/{uuid}/factors/{id}/` | PATCH, DELETE | Double `jobs` prefix | `/jobs/{uuid}/factors/{id}/` |
| `/jobs/manage-factors-questions/` | PATCH | Verb-noun; no job scoping | `/jobs/{uuid}/factors/question-mapping/` |
| `/jobs/job-ai-config/{uuid}/` | GET | Redundant `job`; naming inconsistency | `/jobs/{uuid}/ai-interview-config/` |
| `/candidates/direct-invite/` | POST | Verb in path; wrong prefix | `POST /jobs/{uuid}/invite-link/` |
| `/candidates/bulk-upload/{jobId}/` | POST | `{jobId}` is UUID, not integer | `/candidates/bulk-upload/{jobUuid}/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `admin_companies.phone_number`, `.company_website`, `.is_sub_active`, `.plan_title`, `.subscription_date` | GET /user-management/companies | Not used anywhere in the codebase |
| `job.thank_you_video` | POST /jobs/ | Not used anywhere in the codebase |
| `job.employment_type`, `job.experience_level` | POST /jobs/ | TypeScript type only; not rendered |
| `team` | POST /jobs/ | Auto-created team record ID — not read anywhere |
| `employment_type`, `experience_level` | GET/PATCH /jobs/job/{uuid}/ | TypeScript type only; not rendered anywhere |
| `thank_you_video` | GET /jobs/job/{uuid}/ | Not used anywhere in the codebase |
| `created_at`, `updated_at` | Question responses (GET, POST, PATCH) | Not rendered or used anywhere |
| `title` (job title echo) | POST /user-management/generate-questions/ | Stored in state variable but never rendered |
| `skills[]`, `scoring_rubric` | POST /user-management/generate-factor-evaluation/ | Not stored or displayed anywhere |
| Full response | PATCH /jobs/ai-include-questions/{uuid}/ | Ignored |
| `id`, `job` | GET /jobs/team/{uuid}/ | Team record ID and job UUID echo — not read |
| `notify_recruiters` | GET /jobs/team/{uuid}/ | Not used anywhere in the codebase |
| Full response | PATCH and PUT /jobs/team/{uuid}/ | Ignored; full re-fetch triggered |
| Full response | PATCH /jobs/noify-members-on-complete/{uuid}/ | Ignored; full re-fetch triggered |
| `whatsapp_candidate`, `whatsapp_candidate_reminder`, `reject_candidate_whatsapp` | GET /jobs/landing-page/{uuid}/ | WhatsApp feature not implemented; round-tripped in PATCH |
| `requirements.custom_field_state` | GET /jobs/landing-page/{uuid}/ | No UI control; `custom_field` always forced to `""` in PATCH |
| `job` (UUID echo) | GET /jobs/job-workflow/{uuid}/, GET /jobs/ai-evaluation-setup/{uuid}/ | Already known from URL |
| `created_at` | GET /jobs/job-workflow/{uuid}/ | Not used anywhere |
| Fields beyond `id` | POST /jobs/job-workflow/{uuid}/ | Only `id` read from stage create response |
| Full response | PATCH /jobs/job-workflow/{uuid}/{stageId}/, PATCH /jobs/job/{uuid}/reorder-stages/ | Both responses ignored |
| `id` | GET /jobs/ai-evaluation-setup/{uuid}/ | Not read; record accessed via job UUID |
| `ai_evaluation_config` | GET/POST/PATCH /jobs/jobs/{uuid}/factors/ | Not used anywhere in the UI |
| Full response | PATCH /jobs/manage-factors-questions/ | Ignored |
