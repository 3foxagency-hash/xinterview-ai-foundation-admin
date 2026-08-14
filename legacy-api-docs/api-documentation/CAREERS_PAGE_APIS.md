# Careers Page APIs

> Public page — no auth token. Uses `baseAPI` (unauthenticated).
> Scope: `src/pages/careers/[_id]/index.tsx`

---

## /career/career_page/{uuid}/jobs/

GET

**Naming:** ⚠️ Multiple issues.

- `career_page` uses an underscore — inconsistent with the hyphenated convention used across the rest of the API. Should be `career-page`.
- The path ends in `/jobs/` but the response is a full career page config object that also happens to include a `jobs` array. The name suggests it only returns jobs.
- Suggested: `/career/career-page/{uuid}/`
- `meta_tags.meta_title` and `meta_tags.meta_description` have a redundant `meta_` prefix inside an object already named `meta_tags`. Suggested field names: `meta_tags.title`, `meta_tags.description`.

**Unused response fields:**

- `c_name` — not referenced anywhere in the codebase.
- `id` — the career page UUID. Redundant: the page already knows the UUID from the URL path parameter. Not read from the response in any component.
- `career_intro_video` — not referenced anywhere in the codebase.
- `company` — numeric company ID. Not read from the response in any component.

---

## Naming Issues Summary

| Issue | Current | Suggested |
|---|---|---|
| Underscore in path segment | `/career/career_page/{uuid}/jobs/` | `/career/career-page/{uuid}/` |
| Endpoint named after one array field | `/jobs/` | Remove — resource is the full page config |
| Redundant prefix inside nested object | `meta_tags.meta_title`, `meta_tags.meta_description` | `meta_tags.title`, `meta_tags.description` |

---

## Unused Response Fields Summary

| Field | Verdict |
|---|---|
| `c_name` | Not referenced anywhere in the codebase |
| `id` | Redundant — same value as the UUID path parameter; not read from response |
| `career_intro_video` | Not referenced anywhere in the codebase |
| `company` | Not referenced anywhere in the codebase |
