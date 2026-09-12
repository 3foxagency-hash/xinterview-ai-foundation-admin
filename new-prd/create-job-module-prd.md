# Xinterview Create Job Module — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/create-job-module-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 13.

---

## 1. Module Summary

The Create Job module is how a hiring team builds a new job posting and configures exactly how candidates will be interviewed for it: what questions they'll be asked, who on the team is involved, how the candidate-facing experience looks and behaves, and how candidates actually get invited. It's a multi-step, wizard-style flow, the same five stages as before: Job Details, Questions, Team, Customisation, and Invite Candidates.

The platform still supports four interview formats. As with the old PRD, this document goes into full depth only on the main format — a video-based AI interview candidates complete on their own time — since the others have their own configuration needs and would deserve their own documents.

This rebuild carries forward almost the entire shape of the old wizard, and in several places genuinely improves on it — most notably, a job can now properly sit as an unpublished draft while it's being set up, which was a real gap before. At the same time, this rebuild introduces a new area, Workspace Settings, meant to hold company-wide defaults for exactly these same categories of settings (branding, messaging, notifications, and so on). Right now, that connection doesn't actually exist yet — a new job does not inherit anything from the company's Workspace Settings, even though the two areas look and feel like they should be connected. This is one of the most important things this PRD needs to get right going forward.

## 2. Scope

This document covers, for the main (video) AI interview format:

- Choosing an interview format and the initial job details (title, deadline, language, job description)
- Building the interview's question set
- Assigning a team to the job
- Customizing the candidate-facing experience (branding, notifications, anti-cheating controls, AI evaluation setup, pipeline stages, scoring, and messaging)
- Inviting candidates once the job is ready (shareable link, individual invites, bulk upload)
- How draft and published states work
- How these steps connect into one overall flow

**Briefly introduced, but not covered in depth:** the AI avatar interview, AI voice interview, and AI phone-screening formats, and their distinct configuration screens.

## 3. Product Goals

### 3.1 Business Goals

- Make it fast for a hiring team to go from "we have an opening" to "candidates can start applying."
- Let teams build a consistent, on-brand candidate experience without needing engineering help — ideally by starting from company-wide defaults instead of from scratch every time.
- Support AI-assisted shortcuts (auto-generated job descriptions, questions, and evaluation criteria) so teams aren't starting from a blank page.
- Make it easy to scale candidate outreach, from a single invite to a bulk upload of many candidates at once.

### 3.2 User Experience Goals

- A clear, guided, step-by-step setup process that doesn't feel overwhelming.
- Flexibility to jump between steps and come back later, since job setup often isn't done in one sitting.
- Confidence that what the team configures is exactly what candidates will see and experience.
- Clear guidance and validation at each step so nothing important is missed before candidates are invited.
- A job shouldn't feel "live" to candidates until the hiring team has deliberately decided it's ready.

### 3.3 Security Goals

- A job and everything configured on it must stay scoped to the correct company.
- Team access to a job should be intentional and visible — it should always be clear who's on a job's team and easy to remove someone.
- Bulk candidate uploads must be validated and capped, and that validation must be trustworthy even if someone bypasses the visible upload form.

### 3.4 Compliance Goals

- Be transparent with candidates about what personal information is being collected and get their acknowledgment via privacy policy and terms & conditions links before they proceed.
- Be transparent about any candidate monitoring during the interview — candidates should be clearly told this is happening, not surprised by it.
- Where AI automatically scores or evaluates a candidate, make sure there's always a path for a human on the hiring team to review that score before it drives a real decision like rejection.
- Follow "privacy by design" for candidate data collected through invites — only collect what's actually configured as needed for the role.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) wherever this module collects, displays, or shares candidate personal data.

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 17).

## 4. Actors / Users

**Primary Users**

- **Hiring Manager / Recruiter** — creates the job, builds questions, configures the experience, and invites candidates.
- **Team Member Assigned to a Job** — reviews the job, may receive notifications about candidate activity, but isn't necessarily the one who set it up.

**Secondary Users**

- **Company Admin** — manages who's available to be added to a job's team, and is affected by plan-based limits.
- **Candidate** — while not a direct user of this module, everything configured here directly shapes what a candidate sees and experiences once invited.
- **Security / Compliance Team** — reviews how candidate personal data is collected and used through this flow, and how AI evaluation is applied.

**Supporting Services**

- Job data service (job details, questions, deadlines, draft/published state)
- Team-assignment service
- Candidate-invitation service (single and bulk)
- AI assistance services (job description generation, question generation, evaluation-criteria generation)
- Candidate-facing customization/branding service
- Notification services (email and SMS)
- Company-wide default settings service (the new Workspace Settings area — see Section 13 for why this isn't actually connected yet)

## 5. Global Requirements

### 5.1 Security Requirements

- Only team members added to a job (or company admins) should be able to view or edit its configuration.
- Bulk candidate uploads must be limited in size and validated — and that validation needs to be enforced by the backend, not only by the upload form itself, since a form-level check alone can always be bypassed.
- Every step of the wizard must confirm changes are saved before allowing the user to move on, so configuration is never silently lost.
- A job that hasn't been deliberately published shouldn't be reachable or shareable as if it were live.

### 5.2 Privacy & Compliance Requirements

- Every job's candidate-facing landing page must give candidates the option to view a Privacy Policy and Terms & Conditions before starting, when those are configured.
- Any candidate-monitoring feature must be clearly disclosed to candidates as part of the interview experience.
- Personal information collected from candidates should only be collected when the hiring team has actually enabled that field.
- Automatic candidate communications must be reviewed for appropriate, non-discriminatory language, since they can be triggered automatically based on a pipeline stage change.
- AI-driven evaluation scoring should be treated as a recommendation to the hiring team, not a fully automated hire/reject decision.

### 5.3 Validation Standards

- Required fields must be clearly marked and validated before a user can move to the next step.
- A job must have at least one question before the team can move past the Questions step.
- Custom AI evaluation weighting should add up to a sensible total before it can be relied on — and this needs to actually be checked when the configuration is saved, not only shown as a visual hint while the hiring manager is adjusting sliders (see Section 13, this is currently only a cosmetic check).
- Individual candidate invites must include a validly formatted name and email before they can be sent, and bulk-uploaded invites need the same checks applied on the backend, not only in the upload form.

### 5.4 Logging Requirements

At minimum, we should be able to see a record of: job created, interview format selected, question set changed, team member added/removed, customization changes saved, candidate invited (individually or in bulk), bulk-invite results, and a job moving from draft to published.

## 6. Shared Experience Standards

These apply across every step of the job-creation flow:

- Works well on both desktop and mobile.
- Each step clearly indicates whether it's been completed, and lets a user jump back to a previous step to make changes.
- Loading and saving states are always visible so a user knows an action succeeded before moving on.
- AI-assisted shortcuts are always presented as a starting draft for the user to review and edit, never auto-applied without a review step.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast throughout.

## 7. User Stories & Requirements

### 7.1 Interview Format Selection

**User Story:** As a hiring manager, I want to choose the right interview format for this role before setting anything else up.

**The four available formats:** AI Video Interview (the default, and the focus of this document), AI Avatar Interview, AI Voice Interview, and AI Phone Screening.

**How it should work:** A hiring manager sees all four options with a short description of each; the AI Video Interview is marked as the default and recommended choice. The other three formats should only be available on plans that support them, hidden or clearly gated otherwise. Choosing AI Phone Screening should require a connected phone system, with a clear path to set that up first if it isn't already connected.

**Acceptance Criteria:** A hiring manager can clearly see and choose from the formats available to their plan; choosing a restricted format they don't have access to is clearly blocked rather than silently failing.

**Worth noting:** every question type (video, audio, text, single choice) is currently offered regardless of which interview format is chosen — the format selection doesn't actually narrow down what kind of questions can be built. Worth confirming with Product whether that's intentional or whether certain formats should limit the available question types.

---

### 7.2 Job Details

**User Story:** As a hiring manager, I want to enter the basic details of the role so the job can be created.

**Fields:** Job Title*, Timezone*, Application Deadline* (cannot be in the past), Interview Language*, Job Description, plus optional details like department, employment type, experience level, and location.

**How it should work:**

- A job should be created as a draft as soon as the hiring manager starts filling in real details — not held back until every field on this step is complete.
- The job description can be auto-drafted with a "Generate with AI" shortcut based on the job title and language, which the user can then edit freely.
- Completing this step moves the user into the rest of the wizard.

**Validation Rules:** Title, timezone, deadline, and language are all required before the job can move forward through the wizard, though the underlying draft record itself only strictly requires a title to exist — the rest should be enforced by the wizard's own step validation, not treated as optional at the data layer.

**Acceptance Criteria:** A job is created as a draft with the entered details; the AI-generated description shortcut produces a usable, editable draft; the user is taken directly into the next step.

---

### 7.3 Questions

**User Story:** As a hiring manager, I want to build the set of questions candidates will answer so I can assess them consistently.

**Question Types:** Video, Audio, Text, and Single Choice — each with a title, an optional description, and settings like retry attempts, thinking time, and total time to answer.

**AI-Assisted Question Generation:** A hiring manager can ask the system to generate a set of questions, mixed across the four types as they choose, reviewed and selected before being imported rather than added automatically.

**Question Templates:** A hiring manager can import a previously saved company question template instead of starting from scratch.

**Organizing and Saving:** Questions can be freely reordered by dragging them into the desired sequence. At least one question is required before moving on. Single Choice questions must have at least two answer options, with exactly one marked correct.

**Acceptance Criteria:** A hiring manager can build a complete, ordered question set using any mix of the four question types, either from scratch, with AI assistance, or from a template; the system prevents moving forward with zero questions or incomplete Single Choice questions.

**Worth resolving:** the question-template feature here and the separate, company-wide Question Library in Settings both let a hiring manager save and reuse question sets, but they currently don't share any of the same saved templates — something saved as a template in one place doesn't show up in the other, even though they look and behave almost identically. These should be unified into one shared library, since having two disconnected "template" systems with the same name is confusing and easy to trip over (see Section 13).

---

### 7.4 Team

**User Story:** As a hiring manager, I want to control who on my team has visibility into this job and who gets notified about candidate activity.

**How it should work:**

- A job has a list of assigned team members, added from the company's existing roster and shown with their company role.
- Team members can be removed at any time (an Admin or the person themself cannot be removed).
- Each team member has an individual toggle for email notifications, subject to the company's plan supporting that feature.

**Acceptance Criteria:** The right people can be added to or removed from a job's team; each person's notification preference can be controlled individually; attempting to enable notifications without the required plan feature is clearly explained.

**Known limitation, carried forward from the old product and still true today:** everyone added to a job's team has exactly the same access — there's no lighter "can view but not edit" role. The product is aware of this and currently tells the user as much directly on this screen, but it hasn't been resolved. Worth a deliberate decision on whether this should change (see Section 13).

---

### 7.5 Customisation

This is the most detailed step in the flow — where a hiring manager shapes exactly what a candidate sees, receives, and experiences.

#### 7.5.1 Landing Page & Candidate Information

Company logo and an optional intro video can be shown on the interview landing page, along with a configurable title and subtitle. The hiring manager chooses which candidate information to collect: Name and Email are always collected; Phone Number, Resume/CV, LinkedIn URL, and Portfolio/Website URL are optional toggles. Privacy Policy and Terms & Conditions links can each be turned on with their own address.

#### 7.5.2 Candidate Notifications

Email and SMS can each be configured, subject to the company's plan, to notify a candidate on completion, send a reminder after a configurable number of days, and send an automatic message if the candidate is rejected.

#### 7.5.3 Anti-Cheating Controls

Three toggles: detecting when a candidate switches away from the interview tab, disabling copy/paste during text answers, and requiring full-screen mode. These should always be clearly disclosed to candidates, not just visible as a setting to the hiring team.

#### 7.5.4 AI Evaluation Setup

The hiring manager sets a role's position level and strictness, can turn on automatic AI evaluation, and can define up to four custom evaluation factors, each with a description, keywords, a scoring rubric, and a weight. Every factor's weight together should add up to a sensible total before this can be relied on for real evaluation. Every video/audio question should be linked to at least one evaluation factor, or explicitly excluded from scoring. A "Generate with AI" option can draft the factors, weights, rubrics, and question links as a starting point.

#### 7.5.5 Pipeline Stages

The hiring manager can define the job's hiring pipeline stages, with a handful of standard stages that always exist and can't be renamed or removed, and the freedom to add, rename, and reorder any additional custom stages beyond those.

#### 7.5.6 Scoring Labels

Named score bands (for example, "Poor," "Average," "Good," "Excellent") with adjustable ranges and colors, used to label and filter candidates by their overall AI-driven score.

#### 7.5.7 Candidate Messaging

An optional Introduction Note shown before the interview starts, and an optional Thank You message shown afterward, with an optional redirect address the candidate is sent to a few seconds after finishing.

#### 7.5.8 Branding & Link Preview

A primary button color and light/dark accent style, with a live preview. A custom favicon, preview image, and preview title control how the interview link looks when shared elsewhere.

**Acceptance Criteria:** Every candidate-facing element configured here is accurately reflected in the actual candidate experience; incomplete or invalid configuration is blocked with a clear explanation before saving.

**The most important open item in this whole module:** a company can set up its own company-wide defaults for almost every one of these same settings in the separate Workspace Settings area — branding, welcome messaging, form fields, anti-cheating defaults, and thank-you messaging. The intention is clearly that a new job should start from those defaults instead of a blank slate. Right now, that inheritance doesn't happen — a brand-new job's customisation starts from its own separate, unrelated set of built-in defaults, completely independent of whatever the company has configured at the workspace level. The two areas share the same look and the same settings categories, which makes it look like they're connected when they aren't. This needs to be fixed so the value of setting up company-wide defaults is actually realized (see Section 13).

Also worth noting: Pipeline Stages and Scoring Labels, while fully built and functional as screens, currently aren't reachable from the normal navigation inside this wizard step — a hiring manager would need to know the exact page to go to directly. This should be added to the visible step navigation.

---

### 7.6 Invite Candidates

**User Story:** As a hiring manager, I want to get candidates into this interview once everything is set up.

#### 7.6.1 Shareable Link

A link can be generated and copied for the job, shareable anywhere for candidates to self-apply.

#### 7.6.2 Individual Invite

The hiring manager can invite specific candidates one at a time by entering their name and email.

#### 7.6.3 Bulk Invite

Candidates can be invited in bulk by uploading a spreadsheet file, capped at a maximum number of rows. After uploading, the system reports how many were invited successfully and how many failed, with failed rows brought back into the individual-invite form, pre-filled and flagged, so the hiring manager can fix and resubmit them.

**Acceptance Criteria:** A hiring manager can generate and share a link, invite individual candidates, or invite many at once via file upload; any invite errors are clearly explained and easy to correct.

**Worth flagging:** today, all of the checking on a bulk-uploaded file — file size, duplicate emails, malformed rows — happens only in the upload form itself before it's sent anywhere. Nothing re-checks any of this once the file's contents are actually submitted. This means the real protection against a bad or oversized upload currently exists only in the browser, not as a backend guarantee (see Section 13).

---

### 7.7 Draft and Published States

Unlike the old product, a job here genuinely starts as a private draft and only becomes visible and shareable to candidates once the hiring manager explicitly publishes it, at the end of the Invite Candidates step. Before publishing, the hiring manager sees any relevant warnings — for example, no team assigned yet, or no candidates invited yet — but none of these currently stop the job from being published; they're informational only. Product should decide whether any of these warnings should become hard requirements before a job can go live (see Section 15).

**Acceptance Criteria:** A job stays private and unreachable by candidates until it's explicitly published; publishing clearly makes the job live and shareable from that point on.

## 8. How the Steps Connect

The flow is a five-step wizard: Job Details → Questions → Team → Customisation → Invite Candidates. A visual step-tracker at the top shows progress, and a hiring manager can jump directly to any step at any time — the flow doesn't force strict linear completion. Every step saves independently, so nothing is lost by switching between steps or navigating away and coming back.

## 9. Shared Error Message Principles

- Help the user recover — never dead-end them.
- Never expose internal/technical error details in a user-facing message.
- Whenever a feature is unavailable due to a plan limitation, say so clearly and offer a path to upgrade, rather than just disabling it silently.
- Always give a clear next step when something fails.

## 10. Non-Functional Requirements

**Security:** Job configuration and team access must remain scoped strictly to the correct company; bulk uploads must be validated and size-capped by the backend, not only by the upload form.

**Performance:** AI-assisted generation should return results quickly enough to feel like a helpful shortcut, not a bottleneck.

**Reliability:** No step should silently fail to save; a hiring manager should always know whether their changes went through.

**Accessibility:** Full keyboard navigation, screen-reader support, and accessible color contrast throughout the wizard, including on drag-and-drop question reordering and color pickers.

**Auditability:** Every configuration change of consequence should be traceable to who made it and when.

## 11. Assumptions & Constraints

- This document assumes the AI Video Interview format; the other three formats have their own configuration needs not detailed here.
- A job can have at most 4 custom AI evaluation factors.
- Bulk candidate invites are capped at a set number per upload.
- Team assignment is all-or-nothing per job today — there's no more granular permission level within a job's team.

## 12. Dependencies

- Job data service
- Team-assignment service
- Candidate-invitation service (individual and bulk)
- AI assistance services (description, question, and evaluation-criteria generation)
- Candidate-facing customization/branding service
- Email and SMS notification services (plan-gated)
- Phone-system integration (for the phone-screening format only)
- Company-wide default settings service (Workspace Settings — see Section 13 for the current disconnect)

## 13. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3.

1. **A new job doesn't actually inherit anything from the company's Workspace Settings defaults**, even though the two areas share the same categories of settings and clearly look like they're meant to be connected. Every new job starts from its own separate, hardcoded set of defaults instead. This undermines the entire point of setting up company-wide defaults in the first place, and should be one of the first things fixed — otherwise Workspace Settings is effectively decorative.
2. **There are two separate, disconnected places to save and reuse question templates** — one inside this wizard, and a similarly named one in company Settings. A template saved in one never appears in the other. These should be unified into a single shared library.
3. **Custom AI evaluation weighting is only checked visually while a hiring manager is adjusting it** — nothing stops an incomplete or invalid set of weights from actually being saved. The rule needs to be genuinely enforced when the configuration is saved, not just shown as a helpful visual cue.
4. **All validation on a bulk candidate upload — file size, duplicate rows, malformed entries — currently happens only in the upload form itself**, with nothing re-checking any of it once the file is actually submitted. This means the real protection against a bad upload exists only in the browser today, not as a dependable backend guarantee.
5. **Pipeline Stages and Scoring Labels are fully built but aren't included in the wizard's own visible step navigation** — a hiring manager has no way to discover them unless they already know the exact page to go to. These should be added to the normal customisation navigation.
6. **Team access to a job is still all-or-nothing** — anyone added has identical access, with no lighter "can view but not edit" option. The product currently tells users this directly rather than hiding it, but it hasn't been resolved.
7. **Publishing a job only shows soft, informational warnings** (no team assigned, no candidates invited) — none of these currently block publishing. Worth a deliberate decision on whether any of these should become hard requirements.
8. **AI-assisted job description, question, and evaluation-criteria generation are all working shortcuts today, but are not yet connected to a real, variable AI service** — the results are currently the same small set of pre-written examples regardless of what's actually entered about the role. This is fine for demonstrating the feature, but needs to be connected to something that genuinely reflects the specific job before this can be relied on in real use.
9. **Every question type is currently available regardless of which interview format is chosen**, even though the format-selection screen implies the format determines what kinds of questions are available. Worth confirming whether this is intentional.

## 14. Analytics Events

We should be tracking: job created, interview format selected, job description AI-generated, question added/edited/removed, questions AI-generated and imported, question template applied, team member added/removed, customization saved (per section), AI evaluation factors configured, candidate invited individually, candidates bulk-invited, bulk-invite partial failure, job published.

## 15. Open Questions

- Should a newly created job automatically start from the company's Workspace Settings defaults, and if so, should the hiring manager be told clearly that it did?
- Should the two separate question-template systems (this wizard's, and the one in Settings) be merged into one shared library?
- Should any of the current soft publish-warnings (no team assigned, no candidates invited) become hard requirements before a job can go live?
- Should job-team access support more than one permission level (e.g., viewer vs. editor)?
- What's the actual plan and timeline for connecting AI-assisted generation to a real, job-specific AI service rather than fixed examples?
- Should certain interview formats limit which question types are available?

## 16. Out of Scope

Not included in this version: the AI Avatar Interview, AI Voice Interview, and AI Phone Screening configuration details; the candidate's own interview-taking experience; the hiring team's post-interview review and scoring workflow; the main Dashboard (all separate PRDs).

## 17. Definition of Done

This module is ready to consider complete when:

- Product has approved the requirements, including answers to the Open Questions in Section 15.
- Design has finalized the UX for how Workspace Settings defaults should visibly carry into a new job, and for any team-permission changes.
- Engineering has connected new jobs to real Workspace Settings defaults, unified the two question-template systems, made evaluation-weight and bulk-upload validation genuinely backend-enforced, and added Pipeline Stages/Scoring Labels to the visible step navigation.
- QA has test cases covering every step in Section 7 and every gap in Section 13.
- Security has reviewed job-team access scoping and confirmed bulk-invite validation is enforced on the backend, not only in the upload form.
- Legal/Privacy has approved candidate-facing disclosures and confirmed this module's data handling is reflected in our privacy notice.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.
