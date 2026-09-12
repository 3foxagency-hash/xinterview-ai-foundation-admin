# Xinterview Candidate Interview Module — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/candidate-interview-module-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 12.

---

## 1. Module Summary

This module covers the experience a candidate goes through when they open an interview invite link: reading about the role, filling in their details, granting camera/microphone access, optionally practicing, completing the actual interview questions, and reaching a final confirmation. It's the mirror image of the Create Job module — everything a hiring team configures there is meant to shape what's described here.

This rebuild carries forward the whole shape of the old flow and meaningfully improves on several parts of it — most notably, the connection-quality check candidates see before starting is now a real, accurate measurement instead of always claiming a strong connection, and candidates are now told upfront, before the interview even starts, that their session may be monitored. The flow has also grown: there's now an entirely new scheduling experience (letting a candidate book a call for later, verify their phone number, and reschedule or cancel), and two new formats for live, real-time interviews.

The one thing this rebuild has not yet done is connect any of this to a real backend. Every screen in this module today runs entirely on fixed example data — nothing a candidate does (answering a question, using up a retake, finishing the interview) is actually saved or checked anywhere outside their own browser tab. This PRD describes the intended, finished behavior, with Section 12 spelling out exactly where real backend work still needs to happen before this module can be trusted with real candidates.

**Scope note:** the platform supports four interview formats overall (introduced in the Create Job PRD). This document focuses on the main AI Video Interview format — where a candidate independently records video, audio, text, or multiple-choice answers on their own time. The live AI avatar and voice interview formats are new additions to the product and are only briefly acknowledged here; they would need their own PRD once their experience is further along.

## 2. Scope

This document covers, for the main AI Video Interview format:

- The interview landing page and how it adapts to what the hiring team configured
- The candidate information form
- The camera/microphone permission and connection-check step
- The optional practice step
- The actual interview-taking experience, question by question
- The Thank You screen and the "Already Completed" screen
- Other end states a candidate might land on (expired link, invalid link)

**Briefly introduced, not covered in depth:** the new call-scheduling flow (booking, phone verification, rescheduling, cancellation) and the live AI avatar/voice interview formats — these are new additions to the product that deserve their own follow-up PRD once their design settles further.

## 3. Product Goals

### 3.1 Business Goals

- Make it effortless for a candidate to go from receiving a link to completing an interview, with no confusion about what to do next.
- Minimize candidate drop-off by removing friction at every step.
- Preserve interview integrity so hiring teams can trust the results.
- Keep the experience on-brand for each hiring company.

### 3.2 User Experience Goals

- A candidate should always know exactly what's expected of them and how much is left to do.
- Technical setup should be checked and confirmed accurately before the real interview starts, not discovered mid-interview.
- Candidates should never lose an answer or get stuck due to a technical hiccup.
- The experience should work equally well on desktop and mobile.

### 3.3 Security Goals

- Only the intended candidate should be able to access and submit responses for a given interview.
- Interview integrity measures should function as configured by the hiring team and be clearly visible to the candidate when active.
- A candidate should not be able to access or resubmit an interview they've already completed.
- Retake counts, timing, and progress must ultimately be verified by the backend, not just trusted from what the candidate's own browser reports.

### 3.4 Compliance Goals

- Get clear, affirmative candidate consent to the platform's and the hiring company's terms and privacy policy before any interview begins.
- Clearly disclose to candidates, before they start, that their session may be monitored for integrity purposes.
- Treat candidate video, audio, and text responses, along with resume/LinkedIn/contact data, as sensitive personal data requiring appropriate handling, storage, and retention practices.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) wherever this module collects or processes candidate personal data.

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 16).

## 4. Actors / Users

**Primary Users**

- **Invited Candidate** — received a personal interview link directly from the hiring team, with some of their information already known.
- **Self-Applying Candidate** — reached the interview through a public/shareable link and fills in their details from scratch.

**Secondary Users**

- **Hiring Team** — not active participants in this module, but everything they configured is expressed through this candidate experience.
- **Security / Compliance Team** — reviews how candidate personal data is collected, what's disclosed to candidates about monitoring, and how recordings/responses are stored.

**Supporting Services**

- Candidate/interview session service (currently missing — see Section 12)
- Video/audio recording and upload services
- Network/device-permission checks
- Notification services (configured by the hiring team, per the Create Job PRD)

## 5. Global Requirements

### 5.1 Security Requirements

- An interview link tied to a specific candidate must only allow that candidate's session to submit responses for it.
- A completed interview must not be re-enterable or resubmittable.
- Retake counts and progress must be verified against the backend, not just trusted from the candidate's browser, so they can't be tampered with locally. This currently isn't true anywhere in the flow (see Section 12) — everything about a candidate's progress lives only in their own browser tab today.
- Light deterrents like disabling right-click should be understood as friction, not a strong security guarantee — a determined candidate can still work around them.

### 5.2 Privacy & Compliance Requirements

- Before an interview can begin, the candidate must actively agree to the platform's terms of use and privacy policy, and separately to the hiring company's own terms/privacy policy when provided.
- Only the personal information fields the hiring team has actually enabled should be collected.
- Recorded video, audio, and text responses must be treated as sensitive candidate data with clear ownership, storage, and retention rules.
- Candidates must be told clearly, before their interview starts, if their session will be monitored for integrity purposes — this must never be something they only discover reactively, if and when they trigger a warning.
- If a candidate's answer is ever finalized automatically due to inactivity rather than an explicit action on their part, this should be made unmistakably clear to them in the moment, and ideally something they can act on rather than only watch happen.

### 5.3 Validation Standards

- Required candidate information fields must be clearly marked and validated before the candidate can proceed.
- File uploads must be restricted to an appropriate format and size, with a clear error if violated.
- Camera and microphone access, and a genuinely accurate read of the candidate's connection quality, must be confirmed before a candidate can proceed to the real interview.

### 5.4 Logging Requirements

At minimum, we should be able to see a record of: candidate started the interview, candidate information submitted, permissions granted/denied, practice attempted/skipped, each question answered (including retakes used and any monitoring events), and interview completed. None of this is actually being recorded anywhere outside the candidate's own browser today (see Section 12).

## 6. Shared Experience Standards

These apply across the entire candidate flow:

- Works well on both desktop and mobile.
- The hiring company's branding is consistently applied across every screen a candidate sees, including end states like an expired or invalid link.
- A small help option is available throughout the flow for common issues.
- Loading and progress states are always clear, so a candidate never wonders whether an action actually went through.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast throughout.

## 7. User Stories & Requirements

### 7.1 Landing Page

**User Story:** As a candidate, I want to understand the role and what to expect before I start, based on whatever information the hiring team has provided.

**How it should work:** The landing page should adapt automatically based on what the hiring team configured for this job: whether a job description is present, and whether an intro video is present, giving up to four different layouts depending on that combination. If the hiring team hasn't set up any interview questions yet, the candidate shouldn't see a way to start at all — the page should instead clearly explain that the interview can't begin yet and to get in touch with the hiring team.

**Acceptance Criteria:** The landing page always reflects exactly what the hiring team configured; a job with no questions configured is clearly blocked rather than allowing the candidate to start into an empty interview.

**A gap worth being direct about:** the logic that would translate a hiring team's actual configuration (their branding, welcome message, form settings) into what a candidate sees here has already been built — but today it's only wired up to an internal preview tool the hiring team uses while setting things up, not to the real candidate-facing link. A real candidate visiting their interview link today sees fixed example content, not the hiring team's actual configuration. This is the most important piece of integration work remaining in this module (see Section 12).

---

### 7.2 Filling Out Candidate Information

**User Story:** As a candidate, I want to provide my details in one simple form so I can proceed to the interview.

**How it should work:** First and Last Name are always required, along with Email. Beyond that, only fields the hiring team has enabled appear — Phone Number, LinkedIn URL, Portfolio URL, and Resume/CV upload — each independently optional or required as configured. Before submitting, the candidate must agree to the platform's terms and privacy policy, and separately to the hiring company's own, if provided. If the candidate was invited directly, any information already known about them should be pre-filled and locked from editing.

**Acceptance Criteria:** Only hiring-team-enabled fields are shown and enforced accordingly; a candidate cannot proceed without agreeing to all applicable consent checkboxes; pre-filled information for invited candidates is accurate and locked appropriately.

---

### 7.3 Permission and Connection Check

**User Story:** As a candidate, I want to confirm my camera and microphone are working, and that my connection is good enough, before I begin.

**How it should work:** The candidate is prompted to allow camera and microphone access, with a live preview and microphone level indicator once granted. If they have multiple devices, they can choose which to use. The page also runs a real check of the candidate's internet connection, showing an accurate result rather than a token gesture, and steering a candidate with a genuinely weak connection toward a warning before they proceed. Once ready, the candidate can choose to practice first or start the real interview right away.

**Acceptance Criteria:** A candidate cannot proceed to the real interview without confirmed, working camera and microphone access; a weak connection is genuinely detected and flagged, not just assumed to be fine; denied permissions are clearly explained with guidance that actually helps the candidate recover.

**Real progress worth highlighting:** the connection-quality check in this rebuild is now a genuine, accurate network measurement rather than a fixed result that always reported "strong" regardless of the candidate's actual connection — this closes a real gap from the old product and should be considered a settled improvement, not something still to fix.

---

### 7.4 Practice Page

**User Story:** As a candidate, I want to try a mock question first so I feel comfortable with the recording experience before it counts.

**How it should work:** The candidate can try out the same recording experience they'll use for real, using a small set of warm-up questions covering each answer type, entirely separate from anything that's actually submitted or saved. This step is optional and can be skipped entirely without any disadvantage.

**Acceptance Criteria:** A candidate can practice recording a response, retake it, and get comfortable with the format before starting for real; skipping practice is fully supported.

**Worth noting:** whether this step is offered at all, and what its questions are, currently can't be configured by the hiring team anywhere in the product — it's a fixed, built-in part of the candidate experience rather than something the hiring team decides on. Worth confirming with Product whether that should change.

---

### 7.5 The Interview Page

**User Story:** As a candidate, I want to answer each interview question clearly, know exactly where I am in the process, and trust that my responses are being captured correctly.

**How it should work:**

- Questions are presented one at a time, with a clear indicator of progress through the full set.
- Each question type — video, audio, text, or multiple choice — is presented with its own appropriate way of responding.
- Each question can give the candidate a short thinking period before recording or answering starts, followed by a time limit to respond, which is enforced consistently.
- Each question allows a limited number of retakes, with the remaining count always visible to the candidate.
- If the hiring team has enabled tab-switch detection or full-screen enforcement for this job, the candidate is clearly warned when it happens, and is told upfront, before the interview even starts, that this kind of monitoring is active — not only after the fact.
- Moving to the next question uploads the current answer with a visible progress indicator; on the final question, the same action completes the interview.

**Acceptance Criteria:** Every question type is presented clearly with the correct time limits and retake allowances, genuinely enforced rather than just cosmetic; integrity features behave exactly as configured and are visible to the candidate when triggered; the interview completes successfully and moves the candidate to the Thank You screen.

**Real progress worth highlighting:** candidates are now shown a clear, upfront explanation before their interview begins, listing exactly what to expect and, if relevant, exactly what kind of monitoring is active during their session — this directly resolves a real compliance-relevant gap from the old product, where this kind of disclosure only ever appeared reactively if a candidate triggered a warning mid-interview.

**Still a partial gap:** after recording a video or audio answer, if the candidate doesn't do anything for about fifteen seconds, their current recording is automatically treated as final and the interview moves on. This is now clearly shown to the candidate as a visible countdown rather than happening completely silently, which is an improvement — but the candidate currently has no way to stop or pause that countdown if they need a moment, so it still isn't quite the same as asking for their explicit confirmation before locking in an answer. Worth a decision on whether the candidate should be able to interrupt this countdown (see Section 12).

**A significant gap that needs backend work before this can be trusted for real interviews:** none of what happens on this page — how many retakes a candidate has used, how much time is left, which question they're on, or whether they've actually finished — is currently verified anywhere except inside the candidate's own browser. A refresh of the page loses all progress, and there's currently nothing stopping a technically inclined candidate from manipulating their own browser to bypass a retake limit or a time limit. This needs to be backed by a real session on the server before this module can be considered production-ready (see Section 12).

---

### 7.6 Thank You Page

**User Story:** As a candidate, I want clear confirmation that I've finished and know what happens next.

**How it should work:** The candidate sees a celebratory, on-brand confirmation screen with any custom closing message the hiring team configured, and is automatically sent to a configured redirect address a few seconds later if one was set up.

**Acceptance Criteria:** Every candidate who completes the interview sees a clear, on-brand confirmation; a configured redirect happens reliably after a short, predictable delay.

---

### 7.7 Already Completed, Expired, and Invalid States

**User Story:** As a candidate who already finished, or whose link no longer works, I want to be told clearly what happened rather than being confused or allowed to redo it.

**How it should work:** Returning to a completed interview's link should clearly confirm it's already done, with no way to restart. An expired link should clearly explain that the deadline has passed, with a way to reach the employer if the candidate believes it's a mistake. An invalid link should explain that clearly too.

**Acceptance Criteria:** A candidate can never resubmit or redo a completed interview by revisiting their link; every end state carries the hiring company's branding and is written in clear, reassuring language.

**Real progress worth highlighting:** all of these end states, including the completed/expired/invalid ones, now consistently carry the hiring company's branding — this closes a real, previously-flagged gap where these particular pages used to appear plain and unbranded compared to the rest of the flow.

**One small inconsistency to resolve:** there are currently two separate underlying mechanisms handling "something's not right" states, one for a link that's already broken before a candidate even starts, and a different one for what happens right after they finish. They don't always look or behave identically to each other today. Worth a design pass to make sure both feel like the same system to a candidate, rather than two similar-but-different ones (see Section 12).

## 8. Supporting Features Throughout the Flow

- **Help Widget** — available on the landing, permission, and interview pages, offering quick guidance on common issues, automatically hidden while a candidate is actively recording.
- **Device Hand-Off** — on desktop, a candidate can continue the exact same interview session on their mobile device instead, disabled while a recording is in progress.
- **Company Branding** — the hiring company's name and logo appear consistently across the entire flow, including its end states.

## 9. Shared Error Message Principles

- Help the candidate recover — never dead-end them without an explanation.
- Never expose internal/technical error details in a candidate-facing message.
- Always make clear whether an action succeeded so the candidate never has to guess.
- When something is blocked due to a candidate's own hardware/permissions/connection, explain exactly what's needed to fix it.

## 10. Non-Functional Requirements

**Security:** Interview links and sessions must be scoped to the correct candidate; completed interviews cannot be reopened or resubmitted; retake and progress state must ultimately be backend-verified, not just trusted from the browser.

**Performance:** Recording, uploading, and moving between questions should feel fast and never leave a candidate waiting without feedback.

**Reliability:** No candidate should lose an answer due to a network hiccup or accidentally closing the tab — this depends on real backend-saved progress, which doesn't exist yet (see Section 12).

**Accessibility:** Full keyboard navigation, screen-reader support, and accessible color contrast throughout.

**Auditability:** Every meaningful event in a candidate's session should be traceable for support and compliance purposes — this also depends on a real backend session existing.

## 11. Assumptions & Constraints

- This document assumes the AI Video Interview format; the newer live avatar/voice formats and the scheduling flow are acknowledged but not detailed here.
- A candidate's device and browser must support camera/microphone access and modern web recording features.
- Everything in this module is currently built and demonstrated against fixed example data rather than a real candidate session — this is explicitly the biggest piece of work standing between this module and being ready for real candidates (see Section 12).

## 12. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3. The first three are the most important — together, they represent "this flow isn't connected to anything real yet," which needs to be resolved before any of the individual screen-level polish matters.

1. **Nothing in this entire module is backed by a real interview session yet.** Every screen currently runs on fixed example data. A candidate's progress, answers, retakes, and completion status all live only in their own browser tab, with nothing saved anywhere else. Refreshing the page loses everything. This needs a real, server-backed candidate session before this module can be used with actual candidates.
2. **What a hiring team configures for a job doesn't yet reach the real candidate-facing link.** The logic to translate a hiring team's settings — branding, welcome message, which fields to collect, anti-cheating toggles — into what a candidate actually sees has already been built, but it's currently only wired up to an internal preview tool, not the real link a candidate opens. Every real candidate today sees fixed example content instead of the specific job's actual configuration.
3. **Retake counts and time limits are only enforced by the candidate's own browser**, with nothing double-checking any of it elsewhere. A determined candidate could currently manipulate their own browser to get more retakes or more time than they should have.
4. **After recording an answer, a candidate who doesn't respond within about fifteen seconds has that answer automatically finalized, and currently has no way to pause or interrupt that countdown** even though it's now visibly shown to them. This is better than before, since it's no longer silent, but it still isn't the same as the candidate actively confirming they're happy with their answer.
5. **The practice step's questions, and whether practice is offered at all, can't currently be configured by the hiring team** — it's a fixed part of the experience for every job.
6. **There are two separate systems handling "something's wrong" states** — one for a link that never worked, and a different one for right after an interview finishes — and they don't always present themselves identically. Worth unifying into one consistent system.
7. **A candidate's answer recordings aren't actually being uploaded to real storage yet** — submitting a recorded answer today simulates an upload with a progress bar, but nothing is genuinely transferred to a hiring team's account. This connects to gap #1 and needs to be resolved together with building a real backend session.

## 13. Open Questions

- What's the priority and timeline for connecting this module to a real, server-backed candidate session, given that so much of this module's other value depends on it?
- What's the plan for connecting the real candidate link to a hiring team's actual configuration, rather than the internal preview tool it's currently limited to?
- Should the fifteen-second auto-finalize after recording allow the candidate to pause or extend it, rather than only showing a visible countdown they can't act on?
- Should hiring teams be able to configure or turn off the practice step, and choose its questions?
- Should the two separate "something's wrong" systems be merged into one consistent experience?

## 14. Out of Scope

Not included in this version: the AI Avatar Interview and AI Voice Interview candidate experiences, and the new call-scheduling flow (booking, phone verification, rescheduling, cancellation) — these are newer additions to the product that would benefit from their own dedicated PRD once their design is further along; the hiring team's job-creation and configuration flow (separate PRD); the hiring team's post-interview review and scoring workflow (a future PRD).

## 15. Analytics Events

We should be tracking: interview link opened, candidate information submitted, camera/microphone permission granted/denied, practice started/skipped/completed, interview started, each question answered (with retake count and time used), monitoring event triggered, interview completed, thank-you redirect fired, already-completed link revisited.

## 16. Definition of Done

This module is ready to consider complete when:

- Product has approved the requirements, including answers to the Open Questions in Section 13.
- Design has finalized the UX for pausing the auto-finalize countdown, and for unifying the two "something's wrong" systems.
- Engineering has connected this module to a real, server-backed candidate session (progress, retakes, timing, and completion all verified server-side), and connected the real candidate link to a hiring team's actual configuration rather than the internal preview tool.
- QA has test cases covering every flow in Section 7 and every gap in Section 12, across both desktop and mobile, run against the real backend once it's connected.
- Security has reviewed session scoping, confirmed retake/progress state can no longer be manipulated from the browser alone, and re-verified the real-world effectiveness of the anti-cheating measures.
- Legal/Privacy has approved candidate-facing consent language and monitoring disclosures, and confirmed recording/response retention practices are reflected in our privacy notice.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.
