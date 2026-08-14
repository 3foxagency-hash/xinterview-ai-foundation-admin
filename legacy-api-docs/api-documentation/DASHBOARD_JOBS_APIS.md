# Dashboard — Active & Archive Jobs APIs

> All calls are authenticated (Bearer token).

---

## /jobs/active/

GET / POST

**Naming (GET):** No change needed.

**Unused response fields (GET):**

- `total_pages` — never read.
- `current_page` — never read.
- `previous` — never read.
- `invited_candidates` (per job) — never rendered.
- `started_candidates` (per job) — never rendered.
- `workflow[stage].backend_name` (per job) — never used in any render or logic.

**Naming (POST):** No change needed.

> ⚠️ This POST endpoint is never called by the frontend. The frontend uses `POST /jobs/archived/` with `status: "active"` to re-activate archived jobs instead.

**Unused response fields (POST):** Entire response unused — this endpoint is not called at all.

---

## /jobs/archived/

GET

**Naming:** No change needed.

**Unused response fields (GET):**

- `total_pages` — never read.
- `current_page` — never read.
- `previous` — never read.
- `invited_candidates` (per job) — never rendered.
- `started_candidates` (per job) — never rendered.
- `workflow[stage].backend_name` (per job) — never used.
- `workflow[stage].id` — not used in the archive view (stage cards are display-only).
- `status` (per job) — never read in the archive view.

POST

**Naming:** ⚠️ Same URL as GET but performs a completely different action — moves a job to archived status. Suggested: `POST /jobs/{jobId}/archive/`

**Unused response fields (POST):** Entire response ignored — list is re-fetched.

---

## /jobs/job/{jobId}/

GET / PATCH / DELETE

**Naming:** No change recommended.

> `"Timezone"` field uses an uppercase `T` — inconsistent with the lowercase naming of every other field in the API. Should be `"timezone"`.

**Unused response fields (PATCH):** Entire response ignored — frontend updates local state from the submitted value.

**Unused response fields (DELETE):** No response body fields read.

---

## /jobs/clone/{jobId}/

POST

**Naming:** Verb in the URL path. Suggested: `POST /jobs/{jobId}/clone/`

**Unused response fields:** Entire response ignored — list is re-fetched.

---

## /candidates/direct-invite/

POST

**Naming:** No change recommended.

**Unused response fields:** None — `url` is the only field returned and it is used.

---

## Naming Issues Summary

| Endpoint | Method | Issue | Suggested Fix |
|---|---|---|---|
| `/jobs/archived/` | POST | Same URL as GET, different purpose | `POST /jobs/{jobId}/archive/` |
| `/jobs/clone/{jobId}/` | POST | Verb in path | `POST /jobs/{jobId}/clone/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `total_pages`, `current_page`, `previous` | GET /jobs/active/ and /jobs/archived/ | Never read |
| `invited_candidates`, `started_candidates` | Both list endpoints | Never rendered |
| `workflow[stage].backend_name` | Both list endpoints | Never used in dashboard |
| `workflow[stage].id` | GET /jobs/archived/ only | Not used in archive view |
| `status` | GET /jobs/archived/ only | Status dropdown is commented out in archive view |
| Full PATCH response body | PATCH /jobs/job/{jobId}/ | Entirely ignored |
| Full clone response body | POST /jobs/clone/{jobId}/ | Entirely ignored |
| Full archive action response body | POST /jobs/archived/ | Entirely ignored |
