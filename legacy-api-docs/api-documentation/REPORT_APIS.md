# Report Page APIs

> All calls are authenticated (Bearer token).
> Scope: `/report/` page (`src/pages/report/index.tsx`).

---

## /jobs/active-jobs-workflow/

GET

**Naming:** No change needed.

**Unused response fields:** None.

---

## /candidates/report/{companyId}/

GET

**Naming:** ⚠️ URL ends in a bare numeric company ID. Suggested: `/candidates/{companyId}/report/stats/`

> Parameter name inconsistency: this endpoint uses `joined_at_after` / `joined_at_before` while `/candidates/report_datewise/{companyId}/` uses `start_after` / `end_before` for the same date range concept. Standardize.

**Unused response fields:**

- `via` (and all sub-fields `invite`, `direct-link`, `bulk-invite`) — invite-source breakdown; not rendered anywhere on the page.
- `invited_candidates` — in TypeScript type only; not rendered.
- `started_candidates` — in TypeScript type only; not rendered.
- `responded_candidates` — in TypeScript type only; not rendered.
- `response_percentage` — not displayed anywhere on the report page.

---

## /candidates/report_datewise/{companyId}/

GET

**Naming:** ⚠️ `report_datewise` uses an underscore — inconsistent with the hyphenated convention. URL ends in a bare numeric company ID. Suggested: `/candidates/{companyId}/report/daily/`

**Unused response fields:** None.

---

## Naming Issues Summary

| Endpoint | Issue | Suggested Fix |
|---|---|---|
| `/candidates/report/{companyId}/` | Bare numeric ID in path | `/candidates/{companyId}/report/stats/` |
| `/candidates/report_datewise/{companyId}/` | Underscore in name; bare numeric ID | `/candidates/{companyId}/report/daily/` |
| `start_after` / `end_before` vs `joined_at_after` / `joined_at_before` | Same date range, two different parameter names across sibling endpoints | Standardize to one pair |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `via`, `via.invite`, `via.direct-link`, `via.bulk-invite` | GET /candidates/report/{companyId}/ | Not displayed anywhere on this page |
| `invited_candidates` | GET /candidates/report/{companyId}/ | TypeScript type only; not rendered |
| `started_candidates` | GET /candidates/report/{companyId}/ | TypeScript type only; not rendered |
| `responded_candidates` | GET /candidates/report/{companyId}/ | TypeScript type only; not rendered |
| `response_percentage` | GET /candidates/report/{companyId}/ | Not displayed anywhere on the report page |
