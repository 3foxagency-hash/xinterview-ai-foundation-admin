# Xinterview Workflow Module — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/workflow-module-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 13.

---

## 1. Module Summary

The Workflow module is where a hiring team reviews everyone who has applied to or completed an interview for a job, and manages them through the hiring pipeline. It's where a recruiter watches a candidate's recorded answers, reads their AI-generated evaluation, leaves comments and ratings with the rest of the team, moves candidates from one stage to the next, and shares a candidate's profile with someone outside the platform if needed.

This is, by a good margin, the module with the most work still ahead of it in this rebuild. The screen itself looks complete and closely mirrors the old product's design — stage tabs, a candidate list, a detail view, bulk actions, comments, reviews, AI evaluation, transcripts, sharing, and a way to compare candidates. But almost none of it is connected to anything real yet: moving a candidate, rejecting them, generating a report, sharing a link, and comparing candidates are all, today, buttons that show a message and do nothing underneath. This PRD describes how the module should work once it's genuinely built out, and Section 13 is direct about exactly how much of that is still ahead of us.

## 2. Scope

This document covers:

- The main workflow screen: stage navigation, the candidate list, and a candidate's detail view
- Moving a candidate between pipeline stages, individually and in bulk
- Bulk actions on multiple selected candidates
- Comments left by the hiring team on a candidate
- Star ratings and written reviews left by the hiring team on a candidate
- Reviewing a candidate's actual submitted answers
- The transcript experience for video/audio answers
- The AI-generated evaluation, at both the per-question and whole-candidate level
- Downloading/exporting recordings, transcripts, and reports
- Comparing multiple candidates side by side
- Generating a shareable link to a candidate for people outside the hiring team

## 3. Product Goals

### 3.1 Business Goals

- Give hiring teams one clear place to review every candidate for a job and make a confident decision.
- Make it fast to move a strong candidate forward and clear the pipeline of candidates who aren't a fit.
- Support collaborative hiring — multiple team members should be able to weigh in on the same candidate.
- Let hiring teams bring in outside stakeholders without giving them full platform access.

### 3.2 User Experience Goals

- A recruiter should always know exactly how many candidates are in each stage and be able to get to any of them quickly.
- Reviewing a candidate's answers, transcript, and AI evaluation should feel like one connected experience.
- Team collaboration should be transparent about who said what and when — and people should be able to fix their own mistakes.
- Bulk actions should save time without making it easy to make a big mistake by accident.

### 3.3 Security Goals

- Only team members assigned to a job should be able to view or act on its candidates.
- A comment or review should only be editable or deletable by the person who wrote it.
- Access to a candidate shared externally must be genuinely gated, not just gated in appearance.
- Actions that are hard to reverse, like rejecting or deleting a candidate, should be handled carefully and consistently with each other.

### 3.4 Compliance Goals

- Where AI evaluation scores a candidate, there should be a real, meaningful path for a human on the hiring team to review and weigh in on that judgment.
- Respect any configured retention/deletion timelines for candidate recordings, and make sure a recruiter is aware when a recording is about to be automatically deleted.
- Any integrity/monitoring signal captured during a candidate's interview that's shown to the hiring team here should be consistent with what was actually disclosed to the candidate beforehand.
- Sharing a candidate's data externally must be deliberate, limited to only what's toggled on, and genuinely enforced — not just presented as limited.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) wherever this module displays, stores, or shares candidate personal data.

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 17).

## 4. Actors / Users

**Primary Users**

- **Recruiter / Hiring Team Member** — reviews candidates, leaves comments/reviews, moves candidates through the pipeline, generates AI reports and share links.

**Secondary Users**

- **External Stakeholder (via Shareable Link)** — someone outside the hiring team reviewing a specific candidate through a link, potentially able to leave their own comments/reviews depending on what the recruiter allowed.
- **Security / Compliance Team** — reviews how candidate data is displayed, shared, and retained through this module, and how AI evaluation is used in decision-making.

**Supporting Services**

- Candidate and pipeline data service (currently missing a real backend — see Section 13)
- Video/audio playback and download services
- Transcript generation service
- AI evaluation and report generation service
- Comments and reviews service
- Shareable-link and guest-access service

## 5. Global Requirements

### 5.1 Security Requirements

- Workflow data for a job must only be visible to team members assigned to that job.
- Comments and reviews can only be edited or deleted by the person who originally wrote them — today, nobody can edit or delete their own comment or review at all, which needs to be built (see Section 13).
- A shareable link must require the external viewer to verify their identity before any candidate data is shown, and any access restriction shown when creating the link (like a PIN) must actually be enforced when the link is opened.
- Deleting a candidate must require an explicit confirmation step, and rejecting a candidate — whether one at a time or in bulk — should be treated with the same seriousness.

### 5.2 Privacy & Compliance Requirements

- Any per-answer video/audio retention or deletion date must be clearly shown to the recruiter reviewing that candidate.
- Tab-switch or other integrity signals shown to the recruiter here must be based on monitoring that was properly disclosed to the candidate during their interview.
- Answers whose transcript couldn't be generated must be clearly excluded from AI scoring rather than silently scored as if they were poor answers.
- A shareable link's exact settings must be clearly presented to the recruiter before they generate and share it, and must be exactly what actually gets enforced on the other end.
- AI-generated evaluation should be treated as decision support for the hiring team, not a final, unreviewable verdict — and today's AI evaluation isn't even genuinely personalized per candidate, which is a serious gap on its own (see Section 13).

### 5.3 Validation Standards

- A candidate cannot be moved backward into an earlier stage that no longer makes sense for their progress.
- Generating a full AI report should only be allowed once the job's evaluation setup is actually complete.
- Bulk actions must clearly show how many candidates are affected before or as the action is taken.

### 5.4 Logging Requirements

At minimum, we should be able to see a record of: candidate stage changes (single and bulk), candidate rejections, candidate deletions, comments and reviews added/edited/deleted, transcripts requested/generated/failed, AI reports requested/generated/failed, reports exported, shareable links generated (and their settings), and any activity from an external viewer via a shared link.

## 6. Shared Experience Standards

- Works well on both desktop and mobile.
- Candidate counts per pipeline stage are always visible and accurate, and reflect the candidates actually shown, not a fixed number that never changes.
- Loading, processing, and saving states are always clearly shown so a recruiter knows whether to wait or move on.
- Destructive or hard-to-reverse actions are clearly labeled and confirmed before they happen, consistently across every place they can be triggered.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast throughout.

## 7. User Stories & Requirements

### 7.1 Main Workflow Screen

**User Story:** As a recruiter, I want one screen where I can see every candidate for a job, organized by where they are in the hiring process.

**How it should work:**

- At the top: a way to switch to a different job's workflow, an "Invite candidate" shortcut, an "Edit job" shortcut, and a row of tabs, one per pipeline stage, each showing how many candidates are currently in it. Clicking a stage tab should genuinely filter the candidate list down to that stage.
- On the left: a search box, "Select All"/"Clear All" controls for bulk actions, an optional filter by AI match strength, and the scrollable candidate list.
- On the right: the selected candidate's full detail view — contact information, an AI-match summary, and available actions.

**Acceptance Criteria:** A recruiter can see accurate, up-to-date candidate counts per stage; clicking a stage genuinely narrows the list to that stage's real candidates; searching and filtering narrow the list correctly; selecting any candidate shows their full, current detail view.

**Current state:** the stage tabs exist and can be clicked, but selecting a stage doesn't currently change which candidates are shown — the same full candidate list appears regardless of which tab is active. This needs to be fixed before stage navigation is genuinely useful (see Section 13).

---

### 7.2 Moving Candidates Between Stages

**User Story:** As a recruiter, I want to move a candidate forward (or reject them) as I make decisions about their fit for the role.

**How it should work:**

- A button suggests the natural next stage by default, with a dropdown to instead pick any other valid stage.
- A separate "Reject" action moves the candidate directly to the Rejected stage.
- A candidate can't be moved backward into a stage that no longer makes sense for where they are in the process.
- Pipeline stage names should be the same, configurable set a hiring team sets up for the job — not a separate, fixed list unrelated to what's actually been configured.

**Acceptance Criteria:** Stage moves are reflected immediately and accurately for the candidate and the stage counts; a candidate can never be moved into a stage that no longer makes sense for where they are in the process.

**Current state, and the single biggest structural problem in this module:** moving a candidate to a new stage today only shows a success message — it doesn't actually move them anywhere. Making this work properly is complicated by the fact that this screen's idea of what stages exist is completely disconnected from the stages a hiring team actually sets up when configuring the job, and disconnected again from two other places elsewhere in the product that each have their own separate idea of a candidate's stage. Before stage-moving can be built for real, the whole product needs one single, shared understanding of what stages exist for a job and what stage a given candidate is in — see Section 13, this is described there in full since it affects several modules, not just this one.

---

### 7.3 Bulk Actions

**User Story:** As a recruiter, I want to act on many candidates at once instead of repeating the same action one by one.

**How it should work:** Once a recruiter selects one or more candidates, a floating action bar should appear with: Move (to a chosen stage), Reject, Generate AI Report, and Delete — the only one that should require confirmation before it happens.

**Acceptance Criteria:** Bulk actions clearly show how many candidates will be affected; bulk delete always requires confirmation; bulk actions never partially apply without clear feedback about what succeeded or failed.

**Current state:** the bulk action bar exists and looks right, but none of its actions actually do anything to the underlying candidates yet — they all just show a success message. There's also an inconsistency worth fixing along the way: rejecting one candidate at a time already shows a confirmation dialog, but rejecting several candidates at once through the bulk bar does not. These two paths should behave the same way (see Section 13).

---

### 7.4 Comments

**User Story:** As a recruiter, I want to leave internal notes on a candidate for the rest of my hiring team to see.

**How it should work:** Any team member assigned to the job can post a comment on a candidate. A comment should only be editable or deletable by the person who wrote it, with confirmation before deleting.

**Acceptance Criteria:** Every team member on the job can see and add comments; only the original author can edit or delete their own comment.

**Current state:** posting a new comment works, and always correctly credits the person doing it. However, there's currently no way for anyone — even the original author — to edit or delete a comment once it's posted. This needs to be built before the "author can manage their own comment" requirement is actually true (see Section 13).

---

### 7.5 Reviews & Ratings

**User Story:** As a recruiter, I want to formally rate and review a candidate, separately from casual comments, and see how my teammates rated them too.

**How it should work:** A team member can leave a star rating along with a written review. Multiple team members can each leave their own independent review of the same candidate, clearly attributed. A candidate's overall star rating shown throughout the screen should reflect these reviews.

**Acceptance Criteria:** Multiple team members can independently rate and review the same candidate; each review is clearly attributed; only the original author can edit or delete their own review.

**Current state:** this mostly works well — multiple people can leave reviews, each is properly attributed, and a candidate's overall rating is calculated live from the reviews that exist. As with comments, though, there's currently no way to edit or delete a review once submitted, which needs the same fix as comments above.

---

### 7.6 Candidate Answer Review

**User Story:** As a recruiter, I want to watch or read exactly what a candidate submitted for each question.

**How it should work:** Questions are listed on one side; selecting one shows that answer on the other side, played back appropriately for its type. A recruiter can download every answer for a candidate together in one action. A retention/deletion note and an integrity flag should be shown per question where relevant.

**Acceptance Criteria:** Every answer type is displayed clearly and plays back reliably; retention/deletion dates and integrity flags are visible wherever they apply; a recruiter can download all of a candidate's answers at once.

**Current state:** the players themselves (video, audio, text, multiple choice) are well built and handle playback controls properly. The gap is upstream of this screen — since there's no real backend behind candidate answers yet, there isn't real recorded footage to actually review; this will resolve naturally once a real candidate-session backend exists (see the Candidate Interview PRD, and Section 13 here).

---

### 7.7 Transcript Section

**User Story:** As a recruiter, I want to read what a candidate said instead of always having to watch or listen to the full recording.

**How it should work:** For any video or audio answer, a recruiter should be able to request a transcript, one answer at a time or all at once, with clear progress and the ability to retry a failed one individually. Once ready, the transcript should be shown side-by-side with the recording, synced to what's playing.

**Acceptance Criteria:** A recruiter can view, navigate, and copy a transcript for any video/audio answer; transcript generation status is always clear; a failed transcript can be retried individually.

**Current state:** the viewing experience itself — side-by-side transcript, click-to-jump, highlighting — is well built. However, transcripts today are not actually generated on request; each answer already comes with a fixed, pre-written transcript baked in, and there's no "Generate transcript" action anywhere. This needs to be connected to a real transcription service before this can be considered a working feature rather than a convincing mockup (see Section 13).

---

### 7.8 AI Report Section

**User Story:** As a recruiter, I want to see the AI's evaluation of a candidate, both at a glance per question and as a full summary.

**How it should work:** A full report should cover the whole candidate: an overall assessment, a written summary, strengths and weaknesses, and a breakdown per evaluation factor, all genuinely reflecting that specific candidate's actual answers. Multiple-choice questions should be graded on correctness. Generating a report should only be possible once the job's evaluation setup is complete, with clear progress shown while it's generating.

**Acceptance Criteria:** A report can only be generated once the underlying evaluation setup is complete; generation progress and any partial failures are clearly communicated; every configured evaluation factor and every eligible question appears in the full report, genuinely based on that candidate's answers.

**A significant current limitation, more fundamental than in the old product:** the "AI evaluation" a recruiter sees today is the exact same fixed assessment for every single candidate — the same verdict, the same summary, the same strengths and weaknesses, regardless of who they are or what they actually answered. This is a bigger gap than "the evaluation can't be edited" (which was the old product's concern) — right now, there's no real, individualized evaluation happening at all. Building genuine, per-candidate AI evaluation needs to be the priority here, and only once that exists does it make sense to revisit whether a recruiter should be able to override or regenerate a specific score (see Section 13).

---

### 7.9 Exporting / Downloading

**User Story:** As a recruiter, I want to save or share a candidate's materials outside the platform.

**How it should work:** A recruiter should be able to download an individual answer's recording, all of a candidate's recordings together, a transcript-only document, and the full AI report, through one clear, unambiguous path per artifact.

**Acceptance Criteria:** Every export type reliably produces a complete, accurate file; there is one clear, unambiguous way to export the full AI report.

**Current state:** there are currently two different places on the screen that both look like they might export a candidate's report, and neither actually produces a file — both just show a message. This needs to be consolidated into one clear, working export path (see Section 13).

---

### 7.10 Comparing Candidates

**User Story:** As a recruiter, I want to compare a few strong candidates for the same role side by side before making a final decision.

**How it should work:** A recruiter should be able to select a few candidates for the same job, directly from the candidate list or bulk action bar, and see their scores and evaluation detail side by side, without having to hunt for a separate screen.

**Acceptance Criteria:** A recruiter can compare candidates side by side directly from where they're already working; the comparison accurately reflects each candidate's actual scores and evaluation detail.

**Current state:** this is currently the least-built part of the whole module. "Compare candidates" is only a menu item that opens a message and closes — there's no actual comparison view anywhere in the product today, not even as a separate hard-to-find screen. This needs to be built from scratch, and doing so properly depends on the AI evaluation actually being real and per-candidate first (see Section 13).

---

### 7.11 Shareable Links

**User Story:** As a recruiter, I want to share a specific candidate with someone outside my hiring team, without giving them full platform access.

**How it should work:** A recruiter should be able to generate a link for a specific candidate, choosing exactly what an external viewer can see and do — their name, resume, AI report, and whether they can comment or review. The external viewer should have to verify their identity before seeing anything, and any extra protection the recruiter sets, like a PIN, should genuinely be required to open the link.

**Acceptance Criteria:** A shared link only ever exposes exactly what was toggled on when it was generated; an external viewer must verify their identity before accessing anything; any protection shown as part of generating the link is genuinely enforced when someone tries to use it; any external activity is clearly attributed and visible to the internal team.

**Current state, and a meaningful security gap:** generating a link with specific settings works, and the resulting page does respect which pieces of information are toggled on or off. However, there is currently no real identity verification of any kind before someone can open a shared link — anyone with the link can see whatever it exposes. On top of that, one specific safeguard, an optional PIN a recruiter can set when creating a job-level share link, is shown in the setup flow but never actually checked when the link is opened — meaning a PIN currently gives a false sense of security rather than real protection. Both of these need to be fixed before this feature should be relied on for anything sensitive (see Section 13). Separately, if an external viewer leaves a comment or review through a shared link, it currently doesn't appear anywhere for the internal team to see — that also needs to be connected.

## 8. Shared Error Message Principles

- Help the recruiter recover — never dead-end them.
- Never expose internal/technical error details in a user-facing message.
- Always make it clear which candidates or actions were affected by a bulk operation, especially if something partially failed.
- When AI report or transcript generation fails, explain what went wrong in plain terms rather than hiding the failure.

## 9. Non-Functional Requirements

**Security:** Workflow access scoped strictly to a job's assigned team; shared links genuinely gated by identity verification, not just designed to look gated; destructive actions require confirmation.

**Performance:** Candidate lists, stage switching, and answer playback should feel fast even with a large number of candidates; transcript and AI report generation should give realistic progress feedback given they can take real time to complete.

**Reliability:** No comment, review, stage change, or generated report should be lost due to a network hiccup; bulk actions should clearly report partial success/failure rather than failing silently.

**Accessibility:** Full keyboard navigation, screen-reader support, and accessible color contrast throughout, including on score badges, stage tabs, and playback controls.

**Auditability:** Every meaningful action in this module should be traceable to who did it and when.

## 10. Assumptions & Constraints

- This document assumes the AI Video Interview format; the other interview formats have a materially different evaluation-report experience not detailed here.
- AI evaluation and reporting only applies to video, audio, and text questions — multiple-choice questions are graded only on correctness.
- Comparing candidates is intended to be limited to a small number at a time, and only among candidates with a completed AI report, once that comparison feature is actually built.
- This entire module depends on the same underlying candidate-session backend flagged as missing in the Candidate Interview PRD — a genuinely working Workflow module and a genuinely working candidate-facing interview experience need to be built together, since one produces the data the other reviews.

## 11. Dependencies

- Candidate and pipeline data service
- Video/audio playback and download services
- Transcript generation service
- AI evaluation and report generation service
- Comments and reviews service
- Shareable-link and guest-verification service
- Subscription/plan service

## 12. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3. Given how much of this module still needs real backend work, these are organized from most to least foundational.

1. **There are now four separate, disconnected ideas of what stage a candidate is in across the product** — one on this Workflow screen, one on the company-wide Candidates list, one in the job-level settings where a hiring team actually configures its pipeline stages, and one more baked into how jobs are displayed on the dashboard. None of them reference each other. This is the most important structural problem to resolve, and it blocks stage-moving, stage-filtering, and accurate stage counts from ever being fully reliable until it's fixed.
2. **Selecting a pipeline stage tab doesn't actually filter the candidate list** — the same full list of candidates shows regardless of which stage is selected.
3. **None of the actions on this screen — moving a candidate, rejecting, generating an AI report, sharing, deleting — actually change anything yet.** Every one of them currently just shows a success message. This needs real backend work across the board before this module can be used for actual hiring decisions.
4. **The AI evaluation shown for every candidate is currently the exact same fixed result**, regardless of who the candidate is or what they actually answered. This is a more serious gap than just "can't edit a score" — there's no real per-candidate evaluation happening at all yet.
5. **Comments and reviews can't be edited or deleted by anyone, including their own author**, even though that's a core expectation of the feature.
6. **Transcripts aren't actually generated on request** — every answer already comes with a fixed transcript baked in, and there's no real transcription happening.
7. **A shareable link currently has no real identity verification before someone can view it**, and an optional PIN a recruiter can set when creating a link is never actually checked — both need to be fixed before this feature can be trusted with sensitive candidate information.
8. **Rejecting a candidate in bulk still doesn't require confirmation, even though rejecting a single candidate does.** These two paths should behave the same way.
9. **"Compare Candidates" doesn't lead anywhere** — it's a menu item that shows a message and closes, with no actual comparison screen built yet, not even a hard-to-reach one.
10. **There are two different places on the screen that both look like they export a candidate's AI report, and neither one actually produces a file.**
11. **If an external viewer leaves a comment or review through a shared link, it isn't visible anywhere to the internal hiring team.**

## 13. Open Questions

- What should the one, shared definition of a candidate's pipeline stage be, so every part of the product — this screen, job-level stage settings, the Candidates list, and the dashboard — reads and writes it the same way?
- What's the priority and timeline for building genuine, per-candidate AI evaluation, given how much of this module (compare, override, regenerate) depends on that existing first?
- Should moving a candidate to Rejected in bulk require the same confirmation step as single-candidate rejection?
- Once real, per-candidate evaluation exists, should there be a way for a recruiter to edit or override an individual AI-generated score, or regenerate a report after the job's evaluation setup changes?
- Which of the two existing "export AI report" entry points should become the one, official path?
- Should multiple-choice question performance factor into a candidate's overall AI evaluation?

## 14. Out of Scope

Not included in this version: the review experience for the AI Avatar, AI Voice, and AI Phone Screening interview formats; the job-creation and configuration flow (separate PRD); the candidate's own interview-taking experience (separate PRD).

## 15. Analytics Events

We should be tracking: candidate viewed, candidate stage changed (single/bulk), candidate rejected, candidate deleted (single/bulk), comment added/edited/deleted, review added/edited/deleted, transcript requested/generated/failed, AI report requested/generated/failed, AI report exported, candidate comparison opened, shareable link generated, shareable link viewed by an external guest, guest comment/review submitted.

## 16. Definition of Done

This module is ready to consider complete when:

- Product has approved the requirements, including answers to the Open Questions in Section 13.
- Design has finalized the UX for a real Compare Candidates screen and for a consistent bulk-rejection confirmation.
- Engineering has built a real backend behind this module — stage moves, bulk actions, genuine per-candidate AI evaluation, real transcript generation, working comment/review editing, and enforced share-link protections.
- QA has test cases covering every flow in Section 7 and every gap in Section 12, and has specifically verified that every action produces a real, lasting change rather than just a success message.
- Security has reviewed job-level access scoping, confirmed shareable links genuinely require identity verification, and confirmed any PIN or similar protection actually works.
- Legal/Privacy has approved how AI evaluation is presented and reviewed by humans, how retention/deletion dates are communicated, and how shared-link data exposure is documented in our privacy notice.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.
