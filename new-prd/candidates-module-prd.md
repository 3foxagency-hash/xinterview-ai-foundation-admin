# Xinterview Candidates Module — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/candidates-module-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 12.

---

## 1. Module Summary

The Candidates module is a single, company-wide directory listing every candidate across every job at once — letting a hiring team search, filter, quickly edit contact details, and remove a candidate, all without first navigating into a specific job. Deeper review work still happens in the per-job pipeline screen; this page remains a fast, cross-job index that hands off to that deeper screen whenever more is needed.

This rebuild keeps the same overall shape as the old product, and genuinely improves on a couple of things — there's now a real loading state and error feedback, and exporting is limited to one job at a time rather than the whole company at once. But it also introduces a new problem that didn't exist before: the way a candidate's pipeline stage is understood on this screen doesn't match how it's understood anywhere else in the product, because there are now three different, disconnected ideas of "what stage is this candidate in" across the app. This PRD describes the module as it should work, and is explicit throughout about where that mismatch needs to be resolved.

## 2. Scope

This document covers:

- Browsing and searching the company-wide candidate list
- Filtering by job and by pipeline stage
- Editing a candidate's basic contact information and stage
- Deleting a candidate
- Exporting the candidate list
- Jumping from a candidate here into their full record in the per-job pipeline review screen

**Not covered here:** reviewing a candidate's recorded answers, transcript, AI evaluation report, comments, and reviews, and moving a candidate between pipeline stages in bulk (all covered in the Workflow PRD); per-job snapshot statistics shown on job cards (Dashboard PRD); company-wide trend reporting over time (Reports PRD).

## 3. Product Goals

### 3.1 Business Goals
- Give hiring teams one place to find any candidate quickly, regardless of which job they applied to.
- Make small corrections to a candidate's contact information or stage fast, without needing to open the specific job they applied to.

### 3.2 User Experience Goals
- Searching and filtering across the entire candidate base should be fast and reliable.
- Filtering by a specific job's stages should show that job's actual stages, not a generic list that may not match.

### 3.3 Security Goals
- Only actions appropriate at a company-wide level (basic info editing, deletion) should be available here — deeper, more sensitive review actions stay properly scoped to a specific job's pipeline screen.
- Deleting a candidate must always require confirmation.

### 3.4 Compliance Goals
- Candidate personal data listed and searchable at this company-wide level needs the same care and protection as the per-job pipeline view.
- Exporting the candidate list must never expose more information, or more capability, than what a hiring team intends to share.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) wherever this module displays, edits, or exports candidate personal data.

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 16).

## 4. Actors / Users

**Primary Users**
- **Recruiter / Hiring Team Member** — searches, filters, edits, and removes candidates across all jobs.

**Secondary Users**
- **Security / Compliance Team** — reviews how candidate data is displayed, edited, and exported at this company-wide level.

**Supporting Services**
- Company-wide candidate directory service
- Job and pipeline-stage data service (to power job and stage filters)
- Subscription/plan service

## 5. Global Requirements

### 5.1 Security Requirements
- Candidate data shown here must only ever reflect the viewing user's own company.
- Deleting a candidate must always require an explicit confirmation step.

### 5.2 Privacy & Compliance Requirements
- Editing a candidate's contact information or stage from this screen must be limited to that candidate's own record, correctly scoped to the job they applied to.
- Any candidate stage value shown here must match exactly what's shown everywhere else in the product for that same candidate — right now, this consistency can't be guaranteed (see Section 12).
- An exported file must only ever contain what's appropriate to leave the platform, and must be limited to a deliberately chosen scope (such as one job at a time) rather than the entire company's candidate base in one action.

### 5.3 Validation Standards
- Editing a candidate's name, email, and phone number must be validated with clear rules before saving.
- Filtering by a specific job's pipeline stages must reliably reflect that job's actual, possibly custom, stage names.

### 5.4 Logging Requirements
At minimum, we should be able to see a record of: candidate information edited, candidate stage changed from this screen, candidate deleted, and candidate list exported.

## 6. Shared Experience Standards
- Works well on both desktop and mobile.
- Search and filter results update quickly and reliably.
- A clear loading state is shown while the list is being fetched, and a clear, distinct message is shown if loading fails.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast throughout.

## 7. User Stories & Requirements

### 7.1 Browsing the Candidate List

**User Story:** As a recruiter, I want to see every candidate across every job in one list.

**How it should work:** A single table lists every candidate for the company, showing their name, which job they applied to, contact details, current pipeline stage, and that job's application deadline, with pagination.

**Acceptance Criteria:** The list accurately reflects every candidate across every job, with reliable pagination, a clear loading state, and a clear error state if it fails to load.

---

### 7.2 Searching & Filtering

**User Story:** As a recruiter, I want to narrow down the candidate list to find who I'm looking for.

**How it should work:** A recruiter can filter by job, filter by pipeline stage, and search by name, email, or job title.

**Acceptance Criteria:** Filtering and searching reliably narrow the list to the correct candidates; selecting a specific job correctly narrows the stage filter to that job's actual stages.

**This is a real, current gap, not just a historical one.** The stage options shown in the filter today are always drawn from one fixed, standard list, regardless of which job is selected — but a job's actual pipeline stages, configured elsewhere in the product, can be renamed and customized per job. If a company renames or adds a stage for a specific job, that custom stage never shows up as a filter option here, and a candidate sitting in that custom stage may not be filterable correctly at all. This needs to be fixed by having this screen genuinely read each job's real, current set of stages instead of assuming one fixed list applies everywhere (see Section 12).

---

### 7.3 Editing a Candidate's Information

**User Story:** As a recruiter, I want to quickly fix a candidate's contact details or move them to a different stage without digging into their specific job.

**How it should work:** An edit form lets a recruiter update a candidate's name, email, and phone number, and now also their pipeline stage directly from this screen.

**Acceptance Criteria:** Edits are validated and saved reliably, with clear confirmation on success, and a clear error message if a save fails.

---

### 7.4 Deleting a Candidate

**User Story:** As a recruiter, I want to remove a candidate from the system entirely.

**How it should work:** Deleting a candidate requires confirming the action first, showing the candidate's name and a clear explanation of what will be removed in the confirmation prompt.

**Acceptance Criteria:** A candidate can only be deleted after explicit confirmation; the deletion is logged.

---

### 7.5 Exporting the Candidate List

**User Story:** As a recruiter, I want to export candidates for a specific job for offline use or sharing with others.

**How it should work:** A recruiter selects a specific job and exports that job's candidates to a file. Exporting the entire company's candidates in one action should not be possible from this screen — a job must be selected first.

**Acceptance Criteria:** An exported file accurately reflects the intended candidates for the selected job; a recruiter cannot export the whole company's data in a single click.

**A real improvement worth noting:** this requirement to select a specific job before exporting is already a meaningful step up from the old product, where the entire company's candidate list could be exported in one click. That said, this restriction currently only exists in the button's own logic and isn't backed up by anything on the server side — it should be treated as the intended rule going forward, not just a convenient frontend habit (see Section 12).

---

### 7.6 Jumping Into Deeper Review

**User Story:** As a recruiter, I want to move from this quick company-wide list into a candidate's full record when I need to review them properly.

**How it should work:** Clicking a candidate's name takes the recruiter directly into that candidate's job in the per-job pipeline review screen.

**Acceptance Criteria:** Clicking through from this list always lands the recruiter on the correct candidate, in the correct job.

## 8. Shared Error Message Principles
- Help the recruiter recover — never dead-end them.
- Never expose internal/technical error details in a user-facing message.
- A failed edit, delete, or list load should always be clearly communicated, not silently ignored.

## 9. Non-Functional Requirements

**Security:** Candidate data strictly scoped to the viewing company; deletion always confirmed.

**Performance:** Search, filtering, and pagination should feel fast even with a large number of candidates.

**Reliability:** No edit, delete, or export action should silently fail without the user knowing.

**Accessibility:** Full keyboard navigation, screen-reader support, and accessible color contrast throughout.

**Auditability:** Every edit, deletion, and export should be traceable to who did it and when.

## 10. Assumptions & Constraints
- This page provides company-wide visibility and light-touch actions; deeper review and pipeline management remain the responsibility of the per-job pipeline screen.
- There is no bulk selection or bulk action on this page today — every action here applies to one candidate at a time, unlike the per-job pipeline screen, which does support bulk actions.
- Whether candidate data should be scoped by workspace, in addition to by company, is an open architectural question shared with the Dashboard module (see Section 12).

## 11. Dependencies
- Company-wide candidate directory service
- Job and pipeline-stage data service
- Subscription/plan service

## 12. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3.

1. **There are currently three different, disconnected ideas of "what stage is a candidate in" across the product**, and they don't reference each other at all. One lives on this Candidates screen (a single fixed list of stages that never changes). Another lives in the settings area where a company can actually customize its pipeline stages per job. A third lives inside the per-job pipeline review screen itself. Because none of these three talk to each other, a stage renamed or customized in one place has no effect on what this screen shows or filters by. This is the most important structural gap in this module and needs to be resolved by settling on one single, shared understanding of a candidate's stage that every part of the product reads from and writes to consistently.
2. **The stage filter on this screen doesn't actually reflect a selected job's real, custom stages** — it always shows the same fixed list. This is really a direct consequence of gap #1, but is worth calling out on its own since it's the most visible symptom of the problem.
3. **The rule limiting export to one job at a time exists only in the export button's own logic**, not as something the backend itself enforces. This is a real improvement in intent over the old product, but it should become a genuine, backend-enforced limit rather than something that only holds as long as nobody bypasses the button.
4. **There's no bulk selection or bulk action available on this page** — no way to move, reject, or delete multiple candidates at once, unlike the per-job pipeline screen. Worth confirming whether this is an intentional scope decision.
5. **Candidate data on this screen isn't scoped by workspace** — if the product decides jobs and candidates should belong to a specific workspace (an open question shared with the Dashboard module), this screen would need to filter accordingly, which it doesn't do today.
6. **The ability to generate and share a candidate's profile with someone outside the hiring team, available from the old product's equivalent screen, doesn't currently exist as a working option here** — it exists only in the per-job pipeline screen instead. Worth confirming with Product whether that's the intended split, or whether this screen should offer it too.

## 13. Open Questions
- What should the one, shared definition of a candidate's pipeline stage be, and how should every part of the product (this screen, job-level stage settings, the per-job pipeline screen) read and write it consistently?
- Should the one-job-at-a-time export limit be enforced by the backend, not just the button?
- Should bulk actions (move, reject, delete) be added to this page, consistent with the per-job pipeline screen?
- Should candidate data be filtered by workspace, once the broader workspace-scoping question is settled?
- Should sharing a candidate's profile externally be available from this screen as well as from the per-job pipeline screen?

## 14. Out of Scope
Not included in this version: reviewing a candidate's recorded answers, transcript, AI evaluation report, comments, reviews, and bulk pipeline-stage moves (Workflow PRD); per-job snapshot statistics (Dashboard PRD); company-wide trend reporting (Reports PRD).

## 15. Analytics Events
We should be tracking: candidate list viewed, candidate searched/filtered, candidate information edited, candidate stage changed from this screen, candidate deleted, candidate list exported, candidate opened in the per-job pipeline screen from this list.

## 16. Definition of Done
This module is ready to consider complete when:
- Product has approved the requirements, including answers to the Open Questions in Section 13 — especially settling on one shared definition of a candidate's pipeline stage.
- Design has finalized the UX for a stage filter that reflects each job's real, custom stages.
- Engineering has resolved the three-way stage-model mismatch, made the export job-limit backend-enforced, and confirmed workspace-scoping behavior once that broader question is settled.
- QA has test cases covering every flow in Section 7, including the specific stage-filter mismatch identified in Section 12.
- Security has specifically reviewed the export feature for unintended data exposure.
- Legal/Compliance has confirmed the export behavior is safe before this feature is relied on broadly.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.
