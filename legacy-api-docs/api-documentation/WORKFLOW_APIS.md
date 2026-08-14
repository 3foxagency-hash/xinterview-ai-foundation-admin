# Workflow Page APIs

> All calls are authenticated (Bearer token) unless noted.
> Scope: `/jobs/{job_id}/workflow/`

---

## /jobs/active-jobs-workflow/

GET

**Naming:** No change needed.

**Unused response fields:** None.

---

## /candidates/

GET

**Naming:** No change needed.

**Unused response fields:**

- `total_pages` — not read anywhere in the codebase.
- `current_page` — not read anywhere in the codebase.
- `previous` — not read anywhere in the codebase.

---

## /candidates/{candidate_id}/answers/

GET

**Naming:** ⚠️ Path ends in `/answers/` but the response contains far more than just answers (AI review, job metadata, etc.). Suggested: `/candidates/{candidate_id}/profile/`

**Unused response fields:** None confirmed as unused everywhere.

---

## /candidates/stages/{candidate_id}/

PATCH

**Naming:** ⚠️ Bare UUID at end with no trailing descriptor. Suggested: `/candidates/{candidate_id}/stage/`

**Unused response fields:** None — `id` and `workflow_stage` from the response are both read.

---

## /candidates/stages/bulk/

PATCH

**Naming:** No change needed.

**Unused response fields:** Entire response ignored.

---

## /candidates/{candidate_id}/

PATCH / DELETE

**Naming:** No change needed.

**Unused response fields (DELETE):** Entire response ignored.

---

## /candidates/candidates/{candidate_ids}

DELETE

**Naming:** ⚠️ Double `candidates` prefix. IDs placed directly in path (non-standard). Suggested: `/candidates/bulk/` with IDs in the request body.

**Unused response fields:** Entire response ignored.

---

## /candidates/resend-email/

POST

**Naming:** No change needed.

**Unused response fields:** `success` flag not read — only non-error is checked.

---

## /candidates/extend-deadline/

POST

**Naming:** No change needed.

**Unused response fields:** Entire response ignored.

---

## /candidates/overall_rating/{candidate_id}

POST

**Naming:** ⚠️ Bare UUID at end. Underscore inconsistent with hyphenated convention. Suggested: `/candidates/{candidate_id}/overall-rating/`

**Unused response fields:** None — `rating` is read.

---

## /candidates/comments/

GET / POST

**Naming:** No change needed.

**Unused response fields:** None.

---

## /candidates/candidates/{candidate_id}/comments/{comment_id}/

PUT / DELETE

**Naming:** ⚠️ Double `candidates` prefix. Suggested: `/candidates/{candidate_id}/comments/{comment_id}/`

**Unused response fields:** None.

---

## /candidates/guest-comment/{candidate_id}/

GET / POST

**Naming:** No change needed.

**Unused response fields:** None.

---

## /candidates/eval/{candidate_id}/

GET

**Naming:** ⚠️ Bare UUID at end; `eval` is an opaque abbreviation. Suggested: `/candidates/{candidate_id}/evaluations/`

**Unused response fields:** None.

---

## /candidates/candidates/{candidate_id}/evaluations/{evaluation_id}/

PATCH / DELETE

**Naming:** ⚠️ Double `candidates` prefix. Suggested: `/candidates/{candidate_id}/evaluations/{evaluation_id}/`

**Unused response fields:** None.

---

## /candidates/timeline/{candidate_id}/

GET

**Naming:** ⚠️ Bare UUID at end with no trailing descriptor. Suggested: `/candidates/{candidate_id}/timeline/`

**Unused response fields:** None.

---

## /eval/candidate-ai-review/

POST

**Naming:** No change needed.

**Unused response fields:** None — `message` is read to check queue status.

---

## /eval/bulk-candidate-ai-review/

POST

**Naming:** No change needed.

**Unused response fields:** None — `message` is displayed to the user.

---

## /jobs/jobs/{job_id}/factors/

GET

**Naming:** ⚠️ Double `jobs` prefix. Suggested: `/jobs/{job_id}/factors/`

**Unused response fields:** None on this page.

---

## /jobs/manage-factors-questions/

PATCH

**Naming:** ⚠️ Verb-noun compound; no job UUID scoping. Suggested: `PATCH /jobs/{uuid}/factors/question-mapping/`

**Unused response fields:** Entire response ignored.

---

## /candidates/answers/{answer_id}/transcript/

GET

**Naming:** No change needed.

**Unused response fields:** None.

---

## /candidates/manual_transcript/individual/{answer_id}/

POST

**Naming:** ⚠️ Underscore in `manual_transcript` inconsistent with hyphenated convention. Bare UUID at end. Suggested: `/candidates/answers/{answer_id}/transcript/generate/`

**Unused response fields:** Entire response ignored.

---

## /candidates/manual_transcript/{candidate_id}/

POST

**Naming:** ⚠️ Same underscore issue; asymmetric with per-answer variant. Suggested: `/candidates/{candidate_id}/transcript/generate-all/`

**Unused response fields:** Entire response ignored.

---

## /candidates/mux-generate-static-rendition/{candidate_id}/

POST

**Naming:** ⚠️ Bare UUID at end; inconsistent hyphen vs underscore with `manual_transcript`. Suggested: `/candidates/{candidate_id}/video-rendition/generate/`

**Unused response fields:** Entire response ignored.

---

## /candidates/intiate-telephonic-interview/{token}/

POST

**Naming:** ⚠️ **Typo** — `intiate` should be `initiate`. Fix to: `/candidates/initiate-telephonic-interview/{token}/`

**Unused response fields:** Entire response ignored.

---

## Naming Issues Summary

| Endpoint | Issue | Suggested Fix |
|---|---|---|
| `/candidates/{candidate_id}/answers/` | `/answers/` misleading — response is full profile | `/candidates/{candidate_id}/profile/` |
| `/candidates/stages/{candidate_id}/` | Bare UUID at end | `/candidates/{candidate_id}/stage/` |
| `DELETE /candidates/candidates/{candidate_ids}` | Double `candidates` prefix; IDs in path | `/candidates/bulk/` with body |
| `/candidates/overall_rating/{candidate_id}` | Bare UUID; underscore | `/candidates/{candidate_id}/overall-rating/` |
| `/candidates/candidates/{id}/comments/{comment_id}/` | Double `candidates` prefix | `/candidates/{candidate_id}/comments/{comment_id}/` |
| `/candidates/eval/{candidate_id}/` | Bare UUID; `eval` opaque | `/candidates/{candidate_id}/evaluations/` |
| `/candidates/candidates/{id}/evaluations/{evaluation_id}/` | Double `candidates` prefix | `/candidates/{candidate_id}/evaluations/{evaluation_id}/` |
| `/candidates/timeline/{candidate_id}/` | Bare UUID at end | `/candidates/{candidate_id}/timeline/` |
| `/jobs/jobs/{job_id}/factors/` | Double `jobs` prefix | `/jobs/{job_id}/factors/` |
| `/jobs/manage-factors-questions/` | Verb-noun; no job scoping | `/jobs/{uuid}/factors/question-mapping/` |
| `/candidates/manual_transcript/individual/{answer_id}/` | Underscore; bare UUID | `/candidates/answers/{answer_id}/transcript/generate/` |
| `/candidates/manual_transcript/{candidate_id}/` | Underscore; asymmetric name | `/candidates/{candidate_id}/transcript/generate-all/` |
| `/candidates/mux-generate-static-rendition/{candidate_id}/` | Bare UUID; inconsistent naming | `/candidates/{candidate_id}/video-rendition/generate/` |
| `/candidates/intiate-telephonic-interview/{token}/` | **Typo:** `intiate` → `initiate` | `/candidates/initiate-telephonic-interview/{token}/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `total_pages`, `current_page`, `previous` | GET /candidates/ | Not read anywhere in the codebase |
| Full response | PATCH /candidates/stages/bulk/ | Ignored |
| Full response | DELETE /candidates/{candidate_id}/ | Ignored |
| Full response | DELETE /candidates/candidates/{candidate_ids} | Ignored |
| `success` | POST /candidates/resend-email/ | Not read — only non-error checked |
| Full response | POST /candidates/extend-deadline/ | Ignored |
| Full response | PATCH /jobs/manage-factors-questions/ | Ignored |
| Full response | POST /candidates/manual_transcript/individual/{answer_id}/ | Ignored |
| Full response | POST /candidates/manual_transcript/{candidate_id}/ | Ignored |
| Full response | POST /candidates/mux-generate-static-rendition/{candidate_id}/ | Ignored |
| Full response | POST /candidates/intiate-telephonic-interview/{token}/ | Ignored |
