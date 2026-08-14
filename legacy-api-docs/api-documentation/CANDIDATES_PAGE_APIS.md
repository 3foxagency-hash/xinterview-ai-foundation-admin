# Candidates Page APIs

> All calls are authenticated (Bearer token).
> Scope: `/candidates/` page (`src/pages/candidates/index.tsx`).

---

## /candidates/pool/{companyId}/

GET

**Naming:** ⚠️ URL ends in a bare numeric company ID. Suggested: `/candidates/{companyId}/pool/`

**Unused response fields (envelope):**

- `total_pages` — not referenced anywhere in the codebase.
- `current_page` — not referenced anywhere in the codebase.
- `previous` — not referenced anywhere in the codebase.
- `results.unique_stages` — returned on every paginated call but never read from this response; stage options are always fetched via separate dedicated endpoints.

**Unused response fields (per-candidate):**

- `ratings_count` — in TypeScript type definitions only; not referenced in any component.
- `ratings` — in TypeScript type definitions only; not referenced in any component.
- `review_error` — in TypeScript type definitions only; not referenced in any component.
- `total_rating` — in TypeScript type and local interface only; not rendered in any component.
- `custom_value` — in TypeScript type definitions only; not referenced in any component.
- `linkedin` — in TypeScript type definitions only; not referenced in any component.
- `referrer` — not referenced anywhere in the codebase.

---

## /jobs/job/{companyId}/unique-stages/

GET

**Naming:** ⚠️ `/jobs/job/` implies a job UUID follows, but this receives a numeric company ID. Suggested: `/jobs/company/{companyId}/unique-stages/`

**Unused response fields:** None beyond `title` per stage item — only `title` is consumed.

> **Bug:** Returns one entry per candidate, not distinct values. A company with 30 candidates in "invited" returns 30 identical `{ "title": "invited" }` objects. The backend should return distinct values only.

---

## Naming Issues Summary

| Endpoint | Issue | Suggested Fix |
|---|---|---|
| `/candidates/pool/{companyId}/` | Bare numeric ID in path | `/candidates/{companyId}/pool/` |
| `/jobs/job/{companyId}/unique-stages/` | `/jobs/job/` implies job UUID; receives company ID | `/jobs/company/{companyId}/unique-stages/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `total_pages`, `current_page`, `previous` | GET /candidates/pool/{companyId}/ | Not referenced anywhere in the codebase |
| `results.unique_stages` | GET /candidates/pool/{companyId}/ | Never read from this response; fetched separately |
| `ratings_count`, `ratings`, `review_error` | GET /candidates/pool/{companyId}/ | TypeScript type definitions only |
| `total_rating`, `custom_value`, `linkedin` | GET /candidates/pool/{companyId}/ | TypeScript type / local interface only; not rendered |
| `referrer` | GET /candidates/pool/{companyId}/ | Not referenced anywhere in the codebase |
