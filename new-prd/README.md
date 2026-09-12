# New Project PRDs — Tracker

This folder holds the PRD documents for the **rebuilt** Xinterview admin product — a new version of the platform referenced in `../prd/` (the old project's PRDs), rebuilt with new styling, a restructured Settings/Workspace split, and a shift of business logic from frontend to backend wherever possible.

These documents describe the **new** project as it is being built, not the old one. Where the old PRDs are used as a reference, differences are called out explicitly (especially: what used to be validated/decided on the frontend that now belongs on the backend).

## Status Legend

- ⬜ Not started
- 🟨 In progress
- ✅ Drafted — awaiting review
- ✔️ Reviewed & approved

## Module List

### Core Product Flow

| # | File | Status | Notes |
|---|---|---|---|
| 1 | `auth-module-prd.md` | ✅ | Sign up, email verification, company setup, login, forgot/reset password. Rewritten in plain, non-technical language (no endpoint paths/payloads) per feedback — awaiting your review. |
| 2 | `dashboard-module-prd.md` | ✅ | Active/Archive jobs dashboard. Drafted — awaiting your review. |
| 3 | `create-job-module-prd.md` | ✅ | Job creation wizard. Drafted — awaiting your review. |
| 4 | `candidates-module-prd.md` | ✅ | Company-wide candidate directory. Drafted — awaiting your review. |
| 5 | `workflow-module-prd.md` | ✅ | Per-job candidate pipeline review. Drafted — awaiting your review. |
| 6 | `candidate-interview-module-prd.md` | ✅ | Candidate-facing interview experience. Drafted — awaiting your review. |
| 7 | `reports-module-prd.md` | ✅ | Hiring analytics/trends. Drafted — awaiting your review. |
| 8 | `profile-module-prd.md` | ✅ | Individual's own account/profile. Drafted — awaiting your review. |

### Settings — Account & Company-Level

| # | File | Status | Notes |
|---|---|---|---|
| 9 | `settings-general-team-prd.md` | ✅ | Company details + team roster/invites. Drafted — awaiting your review. |
| 10 | `settings-security-prd.md` | ⬜ | Note: the real code's `settings/security` route (password change + active sessions) was documented inside `profile-module-prd.md` instead, since it's personal-account-scoped, not company-scoped. Revisit whether this module is still needed as a separate doc, or should be merged/retitled. |
| 11 | `settings-billing-prd.md` | ✅ | Plan, usage, credits. Drafted — awaiting your review. |
| 12 | `settings-integrations-prd.md` | ✅ | Now scoped to Zapier/branding/API keys only — domain & email moved to Workspace Settings; SMS/phone/video-storage don't exist yet (see tracker notes below). Drafted — awaiting your review. |
| 13 | `settings-question-library-prd.md` | ⬜ | Reusable question templates (renamed from old "Templates") — ties directly to the two-disconnected-template-systems gap found in create-job-module-prd.md |
| 14 | `settings-danger-zone-prd.md` | ⬜ | Account deletion/deactivation — new area |

### Workspace Settings — Candidate-Experience-Level

| # | File | Status | Notes |
|---|---|---|---|
| 15 | `workspace-career-page-prd.md` | ⬜ | Public careers page |
| 16 | `workspace-candidate-experience-prd.md` | ⬜ | Branding, form, experience, welcome, thank-you, intro-note, social |
| 17 | `workspace-pipeline-scoring-prd.md` | ⬜ | Pipeline stages + AI scoring bands |
| 18 | `workspace-notifications-delivery-prd.md` | ⬜ | Notifications, SMTP, interview emails, custom domain |

### Utility Screens (lightweight PRD format)

| # | File | Status | Notes |
|---|---|---|---|
| 19 | `notifications-center-prd.md` | ⬜ | In-app notification center |
| 20 | `support-prd.md` | ⬜ | |
| 21 | `documentation-prd.md` | ⬜ | |
| 22 | `whats-new-prd.md` | ⬜ | |

### To Be Scoped (fold-in vs. standalone TBD)

| # | File | Status | Notes |
|---|---|---|---|
| 23 | `careers-public-job-detail-prd.md`? | ⬜ | `app/jobs/[id]`, `app/jobs/new` — may fold into Career Page or Candidate Interview instead of standalone |
| 24 | `share-module-prd.md`? | ⬜ | `app/share` — may fold into Workflow instead of standalone |
| 25 | `preview-module-prd.md`? | ⬜ | `app/preview/customisation` — may fold into whichever Workspace Settings PRD it previews, instead of standalone |

## Key Differences From the Old Project (running list)

- **Workspace concept is new.** The old project had one flat "Settings" area for everything. The new project splits this into company/account-level **Settings** and candidate-experience-level **Workspace Settings**. See "Settings vs. Workspace Settings, in detail" below for exactly what belongs in each and what we found when we checked the built product against that intent.
- **Frontend → Backend shift.** Wherever the old project did validation or business logic in the frontend (e.g., disposable/temp email checking on Sign Up), the new project should push that to the backend. Each new PRD calls out specifically which checks move server-side, and each PRD's Global Requirements will reflect that the frontend's role is primarily rendering/display, not decision-making.
- **Dashboard actions are currently cosmetic.** Pause/archive/restore/clone/delete on the jobs dashboard all show success messages but don't actually change a job's state yet — flagged as the top-priority gap in `dashboard-module-prd.md`.
- **Job lifecycle status isn't unified.** The job-creation system only knows draft/active; the dashboard displays and manages paused/archived/expired on top of that with no shared, single status model yet.
- **Workspace Settings defaults don't actually flow into new jobs.** Company-wide candidate-experience defaults and per-job Customisation share the same UI components but are completely separate, disconnected data — a new job does not inherit workspace defaults today, despite looking like it should. Flagged in `create-job-module-prd.md`.
- **Two disconnected question-template systems** exist (one in the job wizard, one in Settings' Question Library) — saving a template in one doesn't surface it in the other.
- **Three disconnected pipeline-stage models** exist across Candidates, job-level stage settings, and the per-job pipeline review screen — none reference each other, so a custom stage renamed in one place doesn't show up correctly elsewhere. Flagged heavily in `candidates-module-prd.md`.
- **Candidate Interview flow has no real backend session yet.** Every screen runs on fixed example data; retakes/timing/progress are only tracked in the candidate's browser, and a job's real configuration doesn't yet reach the real candidate link (only an internal preview tool). Flagged as top priority in `candidate-interview-module-prd.md`.
- **Genuine improvements already in place**, worth preserving rather than re-flagging as gaps: the candidate interview's connection-speed check is now real (no longer a fake "always strong" result), candidates now get an upfront monitoring disclosure before the interview starts, interview end-states are now branded consistently, and job creation now has a real draft-vs-published state.
- **A fourth (and confirmed final) disconnected pipeline-stage model** was found in Workflow (`lib/workflow-mock.ts`), on top of the three found earlier (Candidates, job-customisation Stages, Dashboard job-card pipeline dots) — four total, none reconciled. This is now the single most-repeated cross-cutting issue in the whole PRD set.
- **Workflow is almost entirely UI-only today**: stage tabs don't filter the list, every action (move/reject/AI report/share/delete) only shows a toast, AI evaluation is one fixed global result shown identically for every candidate, comments/reviews can't be edited or deleted by anyone, transcripts are pre-written rather than generated, Compare Candidates has no actual screen, and a share-link PIN is never enforced.
- **Reports**: export flipped from image/PDF-only to a real CSV of underlying numbers (a genuine improvement, though it drops the old visual-share capability) — but the numbers themselves are still entirely synthetic, and stat-card "vs. last period" deltas are decorative constants, not real comparisons. The old leftover prototype screen is confirmed cleaned up.
- **Settings General/Team**: role-editing after invite and proactive seat-limit visibility are now genuinely built (real fixes). But invite-resend is now a guaranteed failure (regression — no backend endpoint exists for it at all), and "Owner" is confirmed to be a purely client-side role with no backend equivalent — the protection against removing/demoting an owner exists only in this one screen. A fully-designed company-deletion flow exists but is flagged off and has no backend behind it yet.
- **Settings Billing**: a real regression — Billing is no longer restricted to admin/owner roles the way every other sensitive Settings area is. The old leftover fake-card-form risk is confirmed fully gone. Billing address support is fully built server-side but has no UI anywhere; invoice history has no UI *or* backend yet.
- **Settings Integrations**: SMS, phone-screening, and video-storage connectors have been entirely removed from this iteration (not broken — just not rebuilt yet, front or back end). Domain and email-sending setup moved out of Settings into Workspace Settings. The old "two things called domain" naming trap is dormant but will resurface once phone-screening is rebuilt, since the backend schema already names a phone-config field `domain_name`.
- **Profile**: two duplicate, differently-shaped `getProfile()` functions exist in the codebase (only the thinner one is actually wired to the page). The "Company"/"Role" shown on Profile are placeholder values, not the user's real data — the same kind of naming/data mismatch as the Auth module's workspace-vs-company confusion. Password policy is now consistent across the app, but only because three separate copies of the same rule happen to currently agree — not because there's one shared source of truth.
- Further differences will be logged here as each module is drafted.

## Settings vs. Workspace Settings, in detail

This came up as a real point of confusion, so it's worth spelling out plainly: what is company-wide Settings, what is Workspace Settings, and — separately — what we actually found when we checked the built product against that intent.

**The intended distinction:**

- **Settings** holds things that belong to the company as a whole and don't change depending on which hiring campaign or team is working — the company's name and profile, billing and plan, the team roster and who has access, security (password, active sessions), API keys and third-party connections like Zapier, and the shared library of reusable interview questions. There's exactly one of these per company, and everyone in the company shares it.
- **Workspace Settings** holds the defaults for how candidates experience a hiring campaign — branding shown on candidate-facing pages, the welcome message, the pre-interview form fields, the in-interview experience/integrity rules, the thank-you page, the social preview card, the acknowledgement note, scoring-band labels, and the pipeline stage list. The idea is that these are defaults a company sets once, and every new job starts from them instead of everyone re-configuring the same things from scratch on every job.

**Where it gets shared, by design:** the candidate-experience defaults (branding, welcome, form, thank-you, social, intro note, experience, scoring, stages) are built using the exact same editing screens as the per-job Customisation step in the job-creation wizard. That's deliberate — a company sets its defaults once in Workspace Settings using the same screen a hiring manager would later see while customising one specific job, so the two never drift apart or need to be built twice. Custom domain, outbound email setup, and the public careers page also live under Workspace Settings, but they're built from the plain company-Settings-style screens, not the shared wizard components, since there's nothing job-specific about them to preview.

**What we found when we checked this against the actual code — the important caveat:** the "workspace" side of this split isn't a real, separate thing yet. There's no workspace record, no workspace ID, and no way today for a company to have more than one workspace — everything under both Settings and Workspace Settings is really just one company's data. The candidate-experience defaults are stored using a single fixed placeholder in place of a real workspace identifier, which happens to work today only because a company only ever has one set of defaults. In other words, the product is currently built as if "workspace" and "company" are the same thing, one-to-one — the split you see in the navigation is a UI/organizational grouping of settings by *purpose* (company-wide vs. candidate-experience), not a sign that the backend actually treats a workspace as its own entity a company could have several of.

This matters for two reasons: first, it's why [the Auth PRD's decision](auth-module-prd.md) that signing up creates one workspace automatically, named after the company, doesn't require any new backend concept to support — it just names the one workspace that already implicitly exists. Second, if the product later wants a company to run multiple distinct workspaces (e.g., different candidate branding per department or hiring team), that would be new work, not something the current Workspace Settings area already supports underneath — it would need a real workspace identifier to be introduced and threaded through every one of these settings, not just a naming change.

## Working Process

1. Study the corresponding old PRD in `../prd/` (if one exists) for structure and content reference.
2. Inspect the actual new-project code (`app/`, `components/`, `lib/api/`, `mocks/`, `docs/`) to ground the document in what's actually built or mocked, rather than assuming old behavior carries over.
3. Draft the new PRD following the same 16-section format as the old PRDs, but describing the **new** project — including explicit callouts of what moved from frontend to backend.
4. Update this tracker's status column as each PRD is drafted and reviewed.
