# Xinterview Dashboard Module — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/dashboard-module-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 13.

---

## 1. Module Summary

The Dashboard is the main screen a user lands on after logging in. It shows every job posting the company has created and lets the user manage them day to day — see how each is performing, invite candidates, pause a job, clone it, archive it, or permanently delete it. Like the old product, it has two views: Active Jobs and Archived Jobs, switchable from the same screen.

This document describes the dashboard as it's meant to work in the new project. Right now, the screen is built and looks complete, but a lot of what happens when you click a button on it is not real yet — actions like archiving, restoring, pausing, or deleting a job currently only show a success message without actually changing anything behind the scenes. This PRD describes the intended, finished behavior, and Section 13 is very explicit about which pieces are genuinely working today versus which ones are still just a convincing appearance of working.

## 2. Scope

This document covers:

- The Active Jobs view (the default view a user sees on login)
- The Archived Jobs view (a tab on the same screen)
- Actions available from either view: invite candidates, preview a job's interview link, pause, reactivate, clone, edit, archive, restore, and permanently delete a job
- The first-time / empty-account experience shown to brand-new companies with no jobs yet
- How the dashboard should relate to the company's subscription plan (job limits, available interview types)

## 3. Product Goals

### 3.1 Business Goals

- Give hiring teams a fast, at-a-glance view of everything they're hiring for.
- Make it easy to keep the active job list clean by archiving jobs that are no longer live.
- Encourage new accounts to create their first job quickly.
- Reduce the chance that a team member loses job or candidate data by accident.

### 3.2 User Experience Goals

- One clear "home base" for managing jobs, with obvious next steps for both new and returning users.
- Consistent look, feel, and available actions whether a job is active or archived.
- Fast loading, with clear feedback while data is loading or an action is processing.
- No surprises: destructive actions should be clearly explained and confirmed before they happen — and once confirmed, they should actually happen.

### 3.3 Security Goals

- A user should only ever see jobs belonging to their own company.
- Every meaningful change to a job's status should be tied to the person who made it and traceable after the fact.
- Permanent, irreversible actions must require deliberate confirmation and should not be easy to trigger by accident.

### 3.4 Compliance Goals

- Follow "privacy by design" — the dashboard should show only the job and candidate summary data a user actually needs, not raw personal data beyond what's necessary.
- Keep an audit trail of destructive or status-changing actions for security and compliance review.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) — in particular, be able to answer "what happens to a candidate's personal data when a job is archived or deleted?" with a clear, documented answer.
- Make sure that permanently deleting a job is a genuine, complete action with a documented effect on the data behind it — not just a confirmation dialog with nothing real happening afterward (see Section 13).

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 16).

## 4. Actors / Users

**Primary Users**

- **New / Trial User** — logs in for the first time with no jobs yet, and should see a welcome/onboarding prompt instead of the regular dashboard.
- **Hiring Team Member** — the everyday user managing jobs: reviewing pipelines, inviting candidates, archiving completed roles.
- **Company Owner / Admin** — currently has the exact same dashboard experience as any other team member; there's no difference in what an Owner can do here versus a regular Member. This is worth a deliberate product decision rather than an accident (see Section 13).

**Secondary Users**

- **Support Team** — helps users who are confused about a missing or archived job.
- **Security / Compliance Team** — reviews audit logs for destructive actions and confirms data-retention behavior for archived/deleted jobs.

**Supporting Services**

- Job data service (job listings, statuses, per-job candidate/response counts)
- Subscription/plan service (job limits, which interview types are available, whether the account has created any jobs yet)
- Candidate and pipeline service (per-job stage counts shown on each job card)

## 5. Global Requirements

### 5.1 Security Requirements

- A user must only ever be able to view or act on jobs that belong to their own company — no cross-company data leakage.
- Every destructive or state-changing action (archive, restore, pause, delete) must be confirmed with a clear dialog before it takes effect, and must genuinely take effect once confirmed.
- Permanently deleting a job must be irreversible, clearly labeled, and should be considered for extra protection — for example, being limited to certain roles — given that it can never be undone.

### 5.2 Privacy & Compliance Requirements

- The dashboard should only display summary-level candidate information (counts, response rates) rather than full candidate personal details.
- Every archive, restore, pause, and delete action should be logged with who performed it and when.
- We need a documented, approved answer for what happens to a candidate's personal data when the job they applied to is archived, and separately, when it's permanently deleted — this matters directly for fulfilling GDPR/CCPA deletion requests.
- Data retention rules for archived jobs should be explicit and enforced, not left indefinite by default.

### 5.3 Validation Standards

- Every destructive action must show a confirmation dialog that clearly states what will happen and that it can't be undone, where applicable.
- The same action should behave consistently regardless of which view (Active or Archive) it's triggered from.
- Loading and empty states should be clear and never leave a user guessing whether something is broken or simply empty.
- **Whatever a confirmation dialog says will happen, must actually happen.** This sounds obvious, but it's the single biggest gap in the dashboard as it stands today — see Section 13.

### 5.4 Logging Requirements

At minimum, we should be able to see a record of: job archived, job restored from archive, job permanently deleted, job paused, job reactivated, job cloned, candidate invited, and job created. Anything that changes or removes data should leave a trace, both for support and for compliance review.

## 6. Shared Experience Standards

These apply to both the Active and Archive views:

- Works well on both desktop and mobile.
- Jobs load with a clear loading indicator, and can be searched, filtered, sorted, and paged through.
- Each job is shown as a card with consistent information: job title, department, interview format, work mode and location, current status, a visual breakdown of candidates by pipeline stage, when it was created, and who created it.
- Actions available on a job are always confirmed before taking effect and give clear success or error feedback afterward — and that feedback must reflect what genuinely happened, not just what was requested.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast, including on status badges.

## 7. User Stories & Requirements

### 7.1 First-Time / Empty Account Experience

**User Story:** As a brand-new user who hasn't created any jobs yet, I want to be clearly guided to create my first job so I can start using the product.

**How it should work:** If the company hasn't created any jobs at all, the dashboard should replace the normal Active/Archive view entirely with a welcome screen encouraging the user to create their first job, with a clear call-to-action. Once at least one job exists, this welcome screen should never appear again.

**Acceptance Criteria:** A company with zero jobs sees a clear, encouraging first-job prompt instead of an empty list; creating a job transitions them permanently to the standard dashboard view.

**Current state:** this welcome screen exists and looks finished, but it isn't actually connected to a brand-new account's real state today — the main dashboard always shows example jobs regardless of whether the company has created any, so the empty-state screen currently has to be visited directly rather than appearing naturally the first time someone logs in with nothing set up (see Section 13).

---

### 7.2 Active Jobs Dashboard

**User Story:** As a hiring team member, I want to see all my currently active (and paused) jobs in one place so I can track and manage my hiring pipelines.

**How it should work:**

- This is the default view a returning user sees.
- Each job card shows the job title, department, interview format, work mode and location, a breakdown of candidates by pipeline stage, how many people have applied and responded, when it was created, and who created it.
- Clicking a pipeline-stage breakdown takes the user directly into that stage of the job's candidate pipeline.
- The list can be searched, filtered by status, sorted, and switched between a list and grid layout, with normal pagination.

**Available Actions:**

- **Invite Candidate** — jump into the flow for inviting someone to this job.
- **Preview** — open a shareable interview link for the job.
- **Edit** — go to the job's edit screen.
- **Pause** — temporarily closes the job to new activity (with confirmation); it can later be reactivated.
- **Archive** — moves the job out of the active list and into the Archive view (with confirmation).
- **Clone** — creates a duplicate of the job to use as a starting point for a new posting. If the company has hit its plan's job-creation limit, this should be blocked with a clear explanation rather than silently failing.

**Acceptance Criteria:** All active and paused jobs for the company are visible and load smoothly; every action listed above works consistently, gives clear feedback, and actually changes the job's real state; a job's pipeline-stage numbers accurately reflect its current candidates.

**Current state:** the layout, search, filtering, sorting, and pagination are genuinely built and work well. However, every action button on a job card today only shows a success message — none of them actually pause, archive, clone, restore, or delete a job behind the scenes yet (see Section 13). This is the most important gap to close before this module can be considered done.

---

### 7.3 Archived Jobs Dashboard

**User Story:** As a hiring team member, I want to see jobs I've archived so I can reference them later or clean them up permanently when they're no longer needed.

**How it should work:**

- Reached via the "Archived jobs" tab on the same dashboard screen.
- Shows the same style of job card as the Active view, with the pipeline-stage breakdown shown for reference but not clickable.
- **Restore** should be available on every archived job, moving it back to the Active view.
- **Delete** should permanently and irreversibly remove the job, only after a clear confirmation dialog.

**Acceptance Criteria:** All archived jobs for the company are visible and load smoothly; restoring a job genuinely moves it back to Active; deleting a job requires explicit confirmation, cannot be undone, and is logged.

**Current state:** unlike the old product, a "Restore" option is now visibly present on every archived job — this is a real improvement in the design over the old version, where restoring wasn't offered as an option at all. However, clicking it today, like every other dashboard action, only shows a success message without actually moving the job anywhere (see Section 13). So the intent is right, but the underlying behavior still needs to be built.

## 8. Shared Error Message Principles

- Help the user recover — never dead-end them.
- Never expose internal or technical error details in a user-facing message.
- Clearly distinguish "there's genuinely nothing here" from "something failed to load."
- Always give the user a clear next step when an action fails.

## 9. Non-Functional Requirements

**Security:** Strict company-level data isolation; destructive actions require confirmation and should be genuinely auditable.

**Performance:** Smooth loading and searching even with a large number of jobs; fast, real responses to actions like archive/pause/clone.

**Reliability:** A failed data load should never look identical to "you have no jobs," and a confirmed action should never silently fail to actually happen.

**Accessibility:** Full keyboard navigation, screen-reader support, accessible labels and color contrast on all cards, badges, and action menus.

**Auditability:** Every status-changing or destructive action on a job should leave a structured, searchable log entry, tied to the user who performed it.

## 10. Assumptions & Constraints

- The dashboard is scoped to jobs only; broader hiring analytics/metrics live in the separate Reports area.
- A user currently sees the same dashboard and the same available actions regardless of their role within the company — there is no role-based restriction on destructive actions today.
- The dashboard should reflect whichever part of the company (see the naming note below) the user currently has selected, and should update if that selection changes.

**A scoping question worth resolving early:** the product has a "Workspace" switcher in its navigation, letting a user move between different hiring contexts inside their company. Right now, switching between workspaces has no effect at all on the dashboard — the same jobs are shown no matter which workspace is selected. Product needs to decide whether jobs should belong to a specific workspace (so switching workspaces genuinely changes what's shown here), or whether jobs are meant to be company-wide regardless of workspace. This is a foundational decision that affects how the dashboard, and several other modules, should ultimately behave (see Section 13 and Section 15).

## 11. Dependencies

- Job data service (listings, statuses, stats)
- Candidate and pipeline service (per-job stage counts)
- Subscription/plan service (job limits, available interview types, first-job detection for the empty state)
- Shared confirmation-dialog and notification components used across both views

## 12. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3.

1. **Every action button on the dashboard — pause, reactivate, archive, restore, clone, delete — currently only displays a success message without actually doing anything.** A user could click "Archive" on a job, see it say "Job archived," and the job would still be sitting in the Active list a moment later. This is by far the most significant gap in this module and needs to be the top priority: these actions need to be wired up to genuinely change a job's state, not just simulate having done so.
2. **A job's real-world lifecycle status doesn't line up cleanly with what the rest of the product understands a job's status to be.** The screen where a job is actually created and edited only knows about two states — being a draft, or being active — with no built-in idea of "paused," "archived," or "expired." The dashboard, meanwhile, displays and manages exactly those extra states. Before the actions in gap #1 can be properly built, the whole product needs one single, agreed set of states a job can be in, understood the same way everywhere.
3. **There's no real first-time experience yet.** The dedicated "create your first job" welcome screen exists and looks right, but a brand-new account with genuinely zero jobs doesn't actually land on it today — the main dashboard always shows example job data regardless of whether any real jobs exist. This needs to be connected properly so a new company's real, empty state is what triggers the welcome screen.
4. **Switching between different parts of the company (workspaces) has no effect on the dashboard.** The jobs shown stay the same no matter which workspace is selected in the navigation. Product needs to decide whether a job belongs to a specific workspace or is shared company-wide, and the dashboard needs to reflect that decision consistently.
5. **There's no way to check whether a company has hit a plan-based limit on the number of jobs it can create.** The idea of a job limit exists in how the product is structured, but nothing on the dashboard actually checks or enforces it today — a company could clone or create jobs indefinitely without ever being told they've reached a cap.
6. **Every team member currently has identical access to destructive dashboard actions regardless of their role.** Given that permanently deleting an archived job can never be undone, Product and Security should decide whether this should be limited to Owners/Admins rather than every team member.
7. **There's no dashboard-level summary of hiring activity across every job** — the numbers shown at the top of the dashboard today are fixed placeholder figures, not calculated from the real job list. This should either be built to reflect real numbers, or intentionally left to the separate Reports area, but it shouldn't stay as static placeholder text.
8. **We don't yet have a clear, written answer for what happens to a candidate's personal data when their job posting is archived or permanently deleted.** This needs to be resolved and documented for GDPR/CCPA deletion-request handling before this module can be considered fully compliant.
9. **There's no distinct "something went wrong" state if the job list ever fails to load** — only a loading state and a normal/empty result are handled today. A real failure to load would currently look no different to the user than "you have no jobs."

## 13. Open Questions

- Should jobs belong to a specific workspace, meaning switching workspaces changes what the dashboard shows — or should jobs remain company-wide regardless of workspace? This affects more than just the dashboard and should be settled early.
- What should the single, agreed set of job lifecycle states be (draft, active, paused, archived, expired, deleted), so every part of the product — job creation, the dashboard, reporting — uses the same shared understanding?
- Should permanently deleting a job be restricted to certain roles, given it's irreversible?
- What is the intended data-retention period for archived jobs, and for permanently deleted jobs' associated candidate data?
- Should the dashboard show any real, calculated account-wide summary metrics, or should that remain exclusively in the Reports area?
- How should a company be told they've reached a plan-based job-creation limit, and at what point in the flow should that be surfaced?

## 14. Out of Scope

Not included in this version: the broader Reports/analytics area, job creation and editing screens themselves, candidate-level detail screens, and pipeline-management screens (all reachable from the dashboard, but each with its own PRD).

## 15. Analytics Events

We should be tracking: job archived, job restored, job permanently deleted, job paused, job reactivated, job cloned, candidate invited from dashboard, job preview link generated, first job created (onboarding completion).

## 16. Definition of Done

This module is ready to consider complete when:

- Product has approved the requirements, including answers to the Open Questions in Section 13, especially the workspace-scoping and job-status questions, since those affect the rest of the product too.
- Design has finalized the UX for role-based restrictions and for a real account-wide summary, if one is added.
- Engineering has made every dashboard action (pause, reactivate, archive, restore, clone, delete) genuinely functional, and confirmed the first-time empty state reflects a real account's actual data.
- QA has test cases covering every flow in Section 7 and every gap in Section 12, and has specifically verified that every action button does what its confirmation dialog says it will.
- Security has reviewed permission boundaries around destructive actions and confirmed company-level (and, once decided, workspace-level) data isolation.
- Legal/Privacy has approved the data-retention and deletion behavior for archived and deleted jobs, and confirmed this module's data handling is reflected in our privacy notice.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.
