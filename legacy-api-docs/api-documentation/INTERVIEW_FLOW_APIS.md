# Interview Flow APIs

> All endpoints use `baseAPI` (unauthenticated). The interview JWT in the URL is the auth mechanism.
> Pages covered: `/direct_invite/[job_id]`, `/interview/[token]`.

---

## Flow

```
/direct_invite/{job_id}/
  GET /jobs/dynamic-info/{job_id}/           ← SSR meta tags
  GET /candidates/direct-link/{job_id}/      ← resolve → redirect to /interview/{token}

/interview/{token}/  (guest token: candidate_id="-1")
  GET /candidates/interview/{token}/
    → candidate_id == -1: Guest Login
        POST /candidates/interview/{token}/
    → candidate exists: Guest Info Preview
        PATCH /candidates/interview/{token}/
    → (optional) email OTP
        GET  /candidates/verify-candidate-otp?candidate_id={id}
        POST /candidates/verify-candidate-otp

→ VIDEO_INTERVIEW
  GET  /candidates/v2/question/{token}
  GET  /candidates/interview/answer/video/{token}/{questionId}/
  [Upload directly to Mux or Bunny.net]
  GET  /candidates/reduce-takes/{token}/?question_id={id}
  POST /candidates/reduce-takes/{token}/
  POST /candidates/interview/answer/video/{token}/{questionId}/
  POST /candidates/interview/answer/audio/{token}/{questionId}/
  POST /candidates/interview/answer/text/{token}/{questionId}/
  POST /candidates/interview/answer/mcq/{token}/{questionId}/

→ LIVEKIT_AI_INTERVIEW (avatar_interview / audio_interview types only)
  POST /candidates/livekit-token/{token}/
  POST /candidates/create-bunny-space/{token}/
  POST /candidates/store-transcript/{token}/

→ Error logging (any step)
  POST /candidates/error-message-log/{token}/
```

---

## /candidates/direct-link/{job_id}/

GET

**Naming:** ⚠️ `direct-link` describes the delivery mechanism, not the resource. Suggested: `/candidates/job/{job_id}/interview-url/`

**Unused response fields:** None.

---

## /jobs/dynamic-info/{job_id}/

GET

**Naming:** ⚠️ `dynamic-info` is vague; the content is static metadata. Suggested: `/jobs/{job_id}/meta/`

**Unused response fields:**

- `job_description` — fetched in SSR but never rendered on the direct invite page (it's a redirect-only page).
- `meta_tags.meta_title` / `meta_tags.meta_description` — redundant `meta_` prefix inside an object already named `meta_tags`. Suggested field names: `meta_tags.title`, `meta_tags.description`.

---

## /candidates/interview/{token}/

GET / POST / PATCH

**Naming:** No change needed.

**Unused response fields (GET):**

- `welcome_message` — in TypeScript type but not rendered in any interview view component.
- `language` — not rendered anywhere in interview views.
- `id` (numeric, e.g. `410`) — landing-page config numeric ID; not referenced in any interview component.
- `email_candidate` — backend notification flag; not used in the interview UI.
- `sms_candidate` — same.
- `whatsapp_candidate` — same.
- `remind_candidate` — same.
- `sms_remind_candidate` — same.
- `sms_candidate_reminder` — same.
- `whatsapp_candidate_reminder` — same.
- `reject_candidate` — same.
- `reject_candidate_sms` — same.
- `reject_candidate_whatsapp` — same.
- `custom_field` — not rendered in the interview form.
- `auto_review` — not referenced in interview views.
- `use_custom_prompt` — not referenced in interview views.
- `customised_prompt` — not referenced in interview views. Also returns the string `"null"` instead of JSON `null` (Python serialization bug).
- `job` (UUID in response body) — redundant; token already encodes the job_id.
- `meta_image` — returned but never placed in `<Head>` og:image on the interview page.
- `requirements.id` — not referenced.
- `requirements.remind_candidate_state` — not rendered in form.
- `requirements.custom_field_state` — not rendered in form.

> **Field naming notes:**
>
> - `whitelabel` (no underscore) on this endpoint vs `white_label` (with underscore) on the career endpoint — same concept, inconsistent spelling.
> - `company_logo` vs `logo` — guest token response has only `company_logo`; candidate token response has both with the same URL. Inconsistent.
> - `meta_tags.meta_title` / `meta_tags.meta_description` — same redundant prefix issue as career endpoint.
> - `phone_number: "None"` in candidate token responses — Python `None` serialized as the string `"None"` instead of JSON `null`.

**Unused response fields (POST / PATCH):** None — response contains only `url`.

---

## /candidates/verify-candidate-otp

GET `?candidate_id={id}` / POST

**Naming:** ⚠️ The GET triggers a side effect (sends email). Should be a POST. Suggested: separate into `POST /candidates/send-candidate-otp/` and `POST /candidates/verify-candidate-otp/`.

**Unused response fields:** GET — `message` not rendered. POST — response not read.

---

## /candidates/v2/question/{token}

GET

**Naming:** ⚠️ Missing trailing slash — inconsistent with all other endpoints. Suggested: `/candidates/interview/{token}/next-question/`

**Unused response fields:**

- `id` (top-level candidate UUID) — not referenced in VideoInterview; token already encodes the candidate.
- `unanswered_question.created_at` — not rendered.
- `unanswered_question.updated_at` — not rendered.
- `unanswered_question.order` — not used; question ordering comes from array position.
- `unanswered_question.active` — always `true` when returned here; not rendered.
- `unanswered_question.ai_review` — backend evaluation flag; not shown to candidate.
- `unanswered_question.ai_evaluation_done` — not referenced anywhere; not in TypeScript type.
- `unanswered_question.created_by` — not referenced.
- `unanswered_question.job` — redundant (already in token); not referenced.
- `unanswered_question.factors_of_ai_evaluation` — not referenced anywhere; not in TypeScript type.

---

## /candidates/reduce-takes/{token}/

GET `?question_id={id}` / POST

**Naming:** ⚠️ The GET **creates** a `CandidateAnswerTakes` object (side-effectful GET). `reduce-takes` implies decrementing, which is what the POST does. Suggested: `GET /candidates/interview/{token}/question/{id}/takes/`, `POST /candidates/interview/{token}/question/{id}/takes/use/`

**Unused response fields:**

- GET: `message` — not rendered.
- POST: entire response not read.

> **Bug:** POST response key is `"Message"` (capital M); GET uses `"message"` (lowercase). Inconsistent casing.

---

## /candidates/interview/answer/video/{token}/{questionId}/

GET / POST

**Naming:** ⚠️ The GET returns upload credentials, not an existing answer. `answer/video/` implies retrieving an answer. Suggested: `/candidates/interview/{token}/questions/{questionId}/upload-url/`

**Unused response fields:** None.

> **Bug:** `"Completed"` in the POST response uses a capital C — inconsistent with all other lowercase response keys. Suggested: `"completed"`.

---

## /candidates/interview/answer/audio/{token}/{questionId}/

POST

**Unused response fields:** None.

---

## /candidates/interview/answer/text/{token}/{questionId}/

POST

**Unused response fields:** None.

---

## /candidates/interview/answer/mcq/{token}/{questionId}/

POST

**Naming:** ⚠️ `mcq` is an abbreviation inconsistent with the other answer endpoints (`video`, `audio`, `text`). Suggested: `answer/single-choice/`

**Unused response fields:** None.

---

## /candidates/livekit-token/{token}/

POST

**Unused response fields:** None.

---

## /candidates/create-bunny-space/{token}/

POST

**Naming:** ⚠️ `bunny-space` is provider-specific terminology leaking into the API contract. Suggested: `/candidates/interview/{token}/video-recording-slot/`

**Unused response fields:** None.

---

## /candidates/store-transcript/{token}/

POST

**Unused response fields:** None.

---

## /candidates/error-message-log/{token}/

POST

**Naming:** ⚠️ Verbose. Suggested: `/candidates/error-log/{token}/`

**Unused response fields:** None.

---

## Naming Issues Summary

| Endpoint                                       | Issue                                                          | Suggested Fix                                                      |
| ---------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `GET /candidates/direct-link/{job_id}/`        | Name describes mechanism, not resource                         | `/candidates/job/{job_id}/interview-url/`                          |
| `GET /jobs/dynamic-info/{job_id}/`             | "dynamic-info" is vague                                        | `/jobs/{job_id}/meta/`                                             |
| `GET /candidates/v2/question/{token}`          | Missing trailing slash                                         | `/candidates/interview/{token}/next-question/`                     |
| `GET /candidates/verify-candidate-otp`         | Side-effectful GET                                             | Separate into `POST .../send-otp/` + `POST .../verify-otp/`        |
| `GET/POST /candidates/reduce-takes/{token}/`   | GET creates object; name implies decrement                     | `/takes/` + `/takes/use/`                                          |
| `GET /candidates/interview/answer/video/.../`  | GET returns upload credentials, not an answer                  | `/candidates/interview/{token}/questions/{questionId}/upload-url/` |
| `POST /candidates/interview/answer/mcq/.../`   | `mcq` abbreviation; inconsistent with `video`, `audio`, `text` | `answer/single-choice/`                                            |
| `POST /candidates/create-bunny-space/{token}/` | Provider-specific terminology                                  | `/candidates/interview/{token}/video-recording-slot/`              |
| `POST /candidates/error-message-log/{token}/`  | Verbose                                                        | `/candidates/error-log/{token}/`                                   |

---

## Unused Response Fields Summary

### GET /candidates/interview/{token}/

| Field                                                                                                  | Verdict                                                         |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `welcome_message`                                                                                      | Not rendered in any interview view                              |
| `language`                                                                                             | Not rendered in any interview view                              |
| `id` (numeric)                                                                                         | Landing-page config ID — not referenced in interview components |
| `email_candidate`, `sms_candidate`, `whatsapp_candidate`                                               | Backend notification flags — not used in interview UI           |
| `remind_candidate`, `sms_remind_candidate`, `sms_candidate_reminder`                                   | Same                                                            |
| `whatsapp_candidate_reminder`, `reject_candidate`, `reject_candidate_sms`, `reject_candidate_whatsapp` | Same                                                            |
| `custom_field`                                                                                         | Not rendered in interview form                                  |
| `auto_review`, `use_custom_prompt`, `customised_prompt`                                                | Not referenced in interview views                               |
| `job` (UUID in body)                                                                                   | Redundant — already encoded in token                            |
| `linked_phone_config`                                                                                  | Used only in job-settings, not interview views                  |
| `meta_image`                                                                                           | Never placed in `<Head>` on the interview page                  |
| `requirements.id`                                                                                      | Not referenced                                                  |
| `requirements.remind_candidate_state`                                                                  | Not rendered                                                    |
| `requirements.custom_field_state`                                                                      | Not rendered                                                    |

### GET /candidates/v2/question/{token}

| Field                                          | Verdict                                             |
| ---------------------------------------------- | --------------------------------------------------- |
| `id` (top-level candidate UUID)                | Not referenced in VideoInterview                    |
| `unanswered_question.created_at`               | Not rendered                                        |
| `unanswered_question.updated_at`               | Not rendered                                        |
| `unanswered_question.order`                    | Not used; rendering order comes from array position |
| `unanswered_question.active`                   | Always `true` when returned; not rendered           |
| `unanswered_question.ai_review`                | Backend evaluation flag — not shown to candidate    |
| `unanswered_question.ai_evaluation_done`       | Not referenced anywhere; not in TypeScript type     |
| `unanswered_question.created_by`               | Not referenced                                      |
| `unanswered_question.job`                      | Redundant (in token); not referenced                |
| `unanswered_question.factors_of_ai_evaluation` | Not referenced anywhere; not in TypeScript type     |
