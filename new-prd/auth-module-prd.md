# Xinterview Authentication Module — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/auth-module-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 12 and Section 17.

---

## 1. Module Summary

The Authentication Module governs how a user creates an account, verifies their identity, creates or joins a company, signs in, and recovers access if they forget their password. This document describes the new project's intended experience end-to-end, so Product, Design, Engineering, QA, Security, and Compliance can work from one shared understanding.

This is a rebuild of the old Xinterview auth flow, not a re-description of it. The guiding principle behind this rebuild is: **push validation and security decisions to the backend; the frontend's job is to display things clearly, call the backend, and reflect what it says.** Historically, several checks that matter for security — like deciding whether an email address is disposable, or enforcing password rules — were decided entirely in the browser. In the new project, those decisions move to the backend. The frontend still gives the user the same instant, friendly feedback while typing, but that feedback is no longer the real gate — the backend is. Section 17 summarizes this shift item by item.

## 2. Scope

This document covers the following screens and flows:

- Sign Up
- Email Verification (OTP) after Sign Up
- Company Setup (create a new company or join one via invite)
- Login
- Forgot Password
- Forgot Password OTP Verification
- Reset Password
- How a user's session is kept alive, protected, and ended

**Not covered here:** a separate, unrelated "Workspace" concept that exists later in the product, inside the dashboard — a sub-unit for a specific hiring campaign, with its own careers page and candidate-experience settings. See Section 4 for why this is worth calling out.

## 3. Product Goals

### 3.1 Business Goals

- Make account creation simple and fast.
- Reduce registration drop-off.
- Get a verified user into a company and onto their dashboard with the fewest possible steps.
- Reduce support tickets related to account access.

### 3.2 User Experience Goals

- A low-friction experience across all three onboarding steps (sign up, verify, set up a company).
- Consistent validation and error handling on every screen.
- Fast, self-service account recovery.
- Clear, trustworthy messaging at every step, including while the user is waiting on a response or a rate limit.

### 3.3 Security Goals

- Prevent unauthorized access.
- Protect against credential stuffing and brute-force login attempts, enforced by the backend rather than relying on the browser to behave.
- Verify email ownership before an account is treated as active.
- End all other active sessions whenever a password is reset.
- Never let any screen reveal whether a given email address is registered.
- Real, working bot protection on Sign Up, Login, and Forgot Password — not just something described in a planning document (this is currently missing entirely; see Section 13).

### 3.4 Compliance Goals

- Follow "privacy by design" — collect only the personal data actually needed at each step.
- Keep audit-ready logs of authentication activity.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA), since we handle data for EU/UK and California users.
- Keep a clear, up-to-date record of every outside vendor that sees user data during authentication (for example, a future bot-protection provider).
- Never let an authentication error message expose raw internal or database details to a user — this is currently happening in at least one case and needs to be fixed (see Section 13).

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 16).

## 4. Actors / Users

**Primary Users**

- **New User / Trial User** — creating an account for the first time.
- **Unverified User** — has registered but hasn't confirmed their email yet.
- **Verified User, No Company** — has confirmed their email but hasn't yet created or joined a company.
- **Existing User** — logging into an account they already have, with a company already set up.
- **Company Creator / Admin** — creates a new company and becomes its owner, or accepts an invite to join an existing one.

**Secondary Users**

- **Support Team** — helps users with account access issues.
- **Security / Compliance Team** — reviews authentication logs, security events, and which outside vendors touch user data during sign-up and sign-in.

**Supporting Services**

- Authentication backend
- User account and profile service
- Company creation and membership service
- Email delivery service (for OTP codes)
- Session and login-token service
- A future bot-protection vendor (planned, not yet in place — see Section 13)

**A naming note worth resolving early:** the screen where a user creates or joins a company is currently labelled "Set up your workspace" in its on-screen copy, and its underlying code is even named around the word "workspace." But what it actually creates is a **Company** — the same kind of record that owns billing, the team roster, and everything else under company-wide Settings elsewhere in the product. Confusingly, a completely different "Workspace" already exists later in the product, inside the dashboard, referring to a smaller hiring-campaign unit that lives inside a company. These are two different things sharing one word, and the word is currently attached to the wrong one on this screen. This PRD refers to what's created here as a **Company** throughout, and flags the copy/naming mismatch as something Product and Design should deliberately resolve (see Section 15) rather than something we should just carry forward by habit.

## 5. Global Requirements

### 5.1 Security Requirements

- Everything runs over HTTPS.
- Passwords are never stored or logged in readable form — they are always securely scrambled (hashed) on the backend.
- Login attempts, OTP checks, OTP resends, and forgot-password requests must all be rate-limited by the backend. The frontend can show a countdown so the user understands what's happening, but the backend must be the thing actually enforcing the limit — a determined user could always bypass anything the browser alone tries to enforce.
- Repeated suspicious activity should trigger a temporary lockout, decided and enforced by the backend.
- Resetting a password must genuinely log the user out of all other active sessions and devices — not just say so on screen (see Section 13).
- Disposable or temporary email addresses must be blocked at sign-up, and that decision must be made by the backend against a list it can update at any time — not by the frontend checking a short, hardcoded list of known throwaway-email domains, which is the current approach and is easy to slip past (see Section 13).
- A real, working bot-protection check must run before Sign Up, Login, and Forgot Password are allowed to proceed. Today this doesn't exist anywhere in the product yet, even though it's been talked about as a plan.

### 5.2 Privacy & Compliance Requirements

- Collect only the personal data we truly need at sign-up: first name, last name, work email, and password. Nothing extra.
- Authentication logs must follow an approved retention schedule and be searchable if we ever need to investigate a security issue.
- Our privacy notice must disclose every outside vendor involved in authentication once any are actually in place (such as a future bot-protection provider).
- A user's password, and any information that keeps them signed in, must never sit around in plain, readable form anywhere on their device beyond what's strictly needed to keep them logged in.
- No error message shown after a failed sign-up, login, or password action should ever expose a raw technical or database-level detail. This is a real defect today in at least one situation and needs to be fixed, not just avoided going forward (see Section 13).

### 5.3 Validation Standards — And Who Should Be Responsible

This is the area that changes the most from the old project, and it deserves its own explanation rather than just a rule.

In the old product, a handful of important checks — is this password strong enough, is this a throwaway email address, does this password match a list of commonly breached ones — were decided entirely by the frontend, using small lists of rules baked directly into the app. That approach has a real weakness: anyone who skips the browser entirely (using a script or a tool that talks to the backend directly) can walk straight past all of it, because the backend never re-checks any of it itself.

In the new project, the frontend should keep giving people the same kind of instant, helpful feedback as they type — that part of the experience shouldn't get worse. But every rule that actually matters for security or data quality needs to also be checked, independently, by the backend, so that it's genuinely enforced no matter how someone reaches the system. Put simply: **the frontend's checks are there to help the user, the backend's checks are there to actually protect us.** Today, several of these checks only exist on the frontend side, which means they aren't real protections yet — they're just UI hints. Section 17 lists these out one by one.

- Every required field must be clearly marked and validated as the user types, before they try to submit.
- Buttons must show a loading state and prevent someone from accidentally submitting a form twice.
- Whatever password or email rule we show the user, the backend must check for the same thing before accepting the request — showing a rule that isn't actually enforced anywhere is worse than not showing it at all.

### 5.4 Password Standards

A password must:

- Be at least 8 characters long.
- Include an uppercase letter, a lowercase letter, a number, and a special character.
- Not be a commonly used or previously breached password.
- Not be the same as the user's email address.

The password field should always show a show/hide toggle, a hint explaining the rules above, and a strength indicator. As noted above, this exact policy needs to be checked by the backend as well — on sign-up, on resetting a forgotten password, and anywhere else in the product a password is set or changed — not only shown to the user as a hint.

### 5.5 OTP (One-Time Passcode) Standards

- 6 digits, numbers only, usable exactly once.
- How long a code stays valid, and how often someone can ask for a new one, should be decided and controlled by the backend — not fixed numbers baked into the app that the backend has no way to influence.
- The OTP email must clearly explain what the code is for and when it expires.
- The same code-entry experience (auto-focus between boxes, pasting a full code, the resend countdown) should be shared between every screen that asks for a code, rather than being rebuilt separately each time.

### 5.6 Logging Requirements

At minimum, we should be able to see a record of: sign-up started/completed, OTP sent/resent/succeeded/failed, login succeeded/failed, forgot-password requested, reset-OTP succeeded/failed, password reset succeeded/failed, account lockouts, company created, and invites accepted. These logs matter both for debugging and for security/compliance audits — every meaningful step in these flows should leave a trace.

## 6. Shared Experience Standards

These apply across all screens:

- Works well on both desktop and mobile.
- Clear loading indicators while waiting on the server; no double-submissions.
- Validation messages appear inline, near the field they relate to.
- Fully usable by keyboard and screen reader.
- OTP entry supports auto-focus between boxes, pasting a full code at once, and moves forward automatically once a valid code is fully entered.
- Success and error states are always clear and written in plain language — a user should never see a raw technical error message. Doing this reliably depends on the backend giving us something clean to translate in the first place, which isn't always true today (see Section 13).
- Being rate-limited is always shown as a clear, friendly countdown with an explanation, never as a generic error.

## 7. User Stories & Requirements

### 7.1 Sign Up

**User Story:** As a new user, I want to create an account so I can start using Xinterview.

**Fields:** First Name*, Last Name*, Work Email*, Password*, Terms & Privacy acceptance*

**How it should work:**

- The user fills in their details, with password strength shown live as they type.
- A bot-protection check runs quietly before the request goes through.
- The account is created in an unverified state, and a verification code is emailed to the user.
- The user is taken to the email verification screen next, with their email already filled in.
- If someone signs up in response to a company invite, some fields may be pre-filled, and later, at the company step, they're offered the choice to join that company directly.

**Validation Rules:**

- First and last name are required.
- Work email is required and must be validly formatted — and the backend, not just the frontend, must reject it if it belongs to a known disposable or temporary email provider.
- Password must meet the password policy described above, checked by both the frontend (for instant feedback) and the backend (as the real gate).
- Terms & Privacy acceptance is required before the form can be submitted.

**Error Handling:**

- Invalid email format → inline message.
- A disposable or temporary email address → a clear message asking the user to use a real business or personal email, and the account is not created. This must be enforced by the backend, not only guessed at by the frontend.
- Weak password → inline message, shown as the user types.
- Email already registered → a message that doesn't unnecessarily expose details about the existing account.
- Too many attempts in a short time → a clear countdown, form disabled until it passes.
- Any other technical failure → a friendly, retry-encouraging message, never raw error text.

**Acceptance Criteria:** A valid submission creates the account and sends the verification email; a disposable email or weak password is blocked by the backend regardless of what the frontend already checked; the attempt is logged.

---

### 7.2 Email Verification (OTP)

**User Story:** As a new user, I want to verify my email so my account can be activated.

**Screen Elements:** "Verify Your Email" heading, a 6-box code entry field that submits automatically once filled in, a Resend button with a countdown.

**How it should work:**

- A verification code is sent automatically as soon as sign-up completes.
- The user enters the code; it's checked automatically as soon as all six digits are in.
- On success, the account is activated and the user moves on to the Company Setup screen.
- The user can request a new code once the cooldown period the backend allows has passed.

**Validation Rules:** The code must be numeric and exactly 6 digits. Whether it's still valid or has expired is entirely up to the backend to decide — the frontend should never assume either way on its own.

**Error Handling:** An invalid code, an expired code, and too many attempts are each explained clearly and distinctly to the user.

**Acceptance Criteria:** A valid code activates the account and moves the user forward; an expired or invalid code is rejected with a clear explanation; every attempt is logged.

---

### 7.3 Company Setup

**User Story:** As a verified user without a company yet, I want to create a new company or join one I've been invited to, so I can start using the product.

**Fields (when creating a new company):** Company Size*, Company Name*, Company Type*, Company Website (optional)

**How it should work:**

- Only verified users who don't yet belong to a company reach this screen.
- If the user arrived through a company invite, they're offered a clear choice between joining that company or creating a new one instead of seeing the standard form right away.
- Submitting the form creates the company and makes the creator its owner; choosing to join an existing company assigns the role specified in the invite.
- Either path ends with the user landing on their dashboard.

**Validation Rules:** Company name, size, and type are required; website is optional but must be a properly formatted web address if provided.

**Acceptance Criteria:** The company is created (or the invite accepted) and the user becomes an owner or member accordingly; the event is logged.

**Worth a deliberate decision:** the underlying system supports marking a company as either a Corporate business or an Agency, but this screen currently doesn't give the user any way to choose — it silently assumes Corporate every time. Product and Design should decide whether this choice should be shown to the user or dropped altogether, rather than leaving it as a silent assumption (see Section 15).

---

### 7.4 Login

**Fields:** Email*, Password*, "Remember me" checkbox

**How it should work:**

- A bot-protection check runs quietly before credentials are submitted.
- On success, the user is signed in and sent to the right place: email verification if they haven't verified yet, company setup if they don't have a company yet, or their dashboard otherwise.
- Links to Forgot Password and Sign Up are available on this screen.

**Error Handling:** Invalid credentials, unverified accounts, and rate-limiting are all handled without ever confirming or denying whether a given email is actually registered — this protects user privacy and prevents anyone from using this screen to discover valid accounts. This already works correctly today and needs to stay that way.

**Acceptance Criteria:** A correct login succeeds and routes the user appropriately; a failed login is handled safely and doesn't leak information; every attempt is logged.

**Known limitation:** the "Remember me" checkbox doesn't currently change anything about how long the session lasts — every login behaves the same way whether or not it's checked. As with the same issue in the old product, this should either be implemented properly this time (for example, keeping the user signed in longer when it's checked) or removed so it doesn't mislead people (see Section 13).

---

### 7.5 Forgot Password

**Fields:** Email*

**How it should work:**

- The user enters their email and submits.
- Regardless of whether that email actually belongs to an account, the user should always see the same generic "check your email" confirmation — this prevents anyone from using this screen to discover which emails are registered.
- If the account exists, a verification code is emailed and the user proceeds to the OTP verification screen.

**Acceptance Criteria:** No one can determine whether an email is registered just by using this screen; every request is logged.

**This deserves special attention.** Today, this exact protection works correctly on the Login screen, but does not yet work correctly here — the backend currently responds differently depending on whether the email is actually registered, which means someone could use this screen right now to figure out who has an account. This is the single highest-priority item in this entire module to fix (see Section 13).

---

### 7.6 Forgot Password OTP Verification

**How it should work:**

- The user enters the code sent to their email, using the same code-entry experience as the sign-up verification screen.
- On success, they're taken to the Reset Password screen.
- They can request a new code, subject to the same cooldown as other OTP screens.

**Acceptance Criteria:** A used or expired code cannot be reused; invalid attempts are rejected with clear messaging; every attempt is logged.

---

### 7.7 Reset Password

**Fields:** New Password*, Confirm New Password*

**How it should work:**

- The user sets a new password and confirms it.
- On success, they see a confirmation message and are redirected to Login shortly after.
- All other active sessions and devices should be logged out as part of this reset.

**Validation Rules:** The new password should be checked against the password policy, and the two password fields should be checked against each other for a match, before the form can be submitted — and the backend needs to check the exact same things again on its end, not just trust that the frontend already did.

**Acceptance Criteria:** The password is changed successfully; all other sessions are genuinely ended, not just claimed to be; the event is logged.

## 8. Keeping a User Signed In

Once someone logs in or finishes signing up, they're given a way to stay signed in without having to log in again constantly, and a separate, longer-lived way to quietly renew that once it's close to expiring. Right now, that quiet renewal step isn't actually happening anywhere in the product — a user's session simply lasts as long as the first one issued, with nothing refreshing it in the background. This needs to be built properly as part of this rebuild, so a signed-in user doesn't get unexpectedly logged out.

There's also a "last seen" check that exists in the backend's plan but isn't currently used by anything in the app. Product and Backend should confirm whether this is still needed for something like detecting an idle session, or whether it should be dropped if it no longer serves a purpose (see Section 15).

## 9. Shared Error Message Principles

- Help the user recover — never dead-end them.
- Never expose internal or technical error details in a user-facing message.
- Never allow any screen to reveal whether a specific email is registered.
- Always give the user a clear next step (retry, contact support, request a new code).
- A user-facing error should always come from something clear and predictable on the backend's side, not from the frontend trying to guess what a raw error message probably means. Today, the frontend sometimes has to do exactly that kind of guessing, because backend error messages aren't consistent or predictable enough yet (see Section 13).

## 10. Non-Functional Requirements

**Security:** HTTPS everywhere; secure password storage; secure session handling; real, backend-enforced protection against brute-force and bot traffic.

**Performance:** Fast page loads and quick responses to user actions.

**Reliability:** Graceful handling of slow email delivery; users should never get stuck in a broken in-between state (verified but no company, company created but session broken, etc.).

**Accessibility:** Full keyboard navigation, screen-reader support, accessible labels and color contrast.

**Localization:** Copy should be translation-ready, and verification emails should support multiple languages. This depends on backend error messages becoming consistent and predictable enough to translate reliably (see Section 13) — it's hard to translate something the frontend currently has to interpret on the fly.

**Auditability:** Every meaningful action in these flows should leave a structured, searchable log entry — essential for day-to-day debugging and for formal security/compliance reviews.

## 11. Assumptions & Constraints

- Email is the primary form of identity; verification codes are sent by email, not SMS.
- Multi-factor authentication (MFA) is not included in this version.
- A user creates or joins exactly one company during onboarding.
- Social login (e.g., "Sign in with Google") and passwordless login are not included in this version.
- The product is being built so that swapping in the real backend, once it's ready, shouldn't require any changes to how the app itself works — only a configuration change. Anywhere the current stand-in backend behaves differently from what's described in this document is a gap for the real backend to close, not something the frontend should work around.

## 12. Dependencies

- Authentication backend
- User account and profile service
- Company creation and membership service
- Email delivery service
- Session and login-token service
- A future bot-protection vendor (needs to be selected, integrated, and covered by a privacy-notice update and vendor agreement before launch)

## 13. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3. Several of these are the same category of issue already flagged in the old project's Auth PRD — this rebuild is the chance to actually close them by moving the responsibility to the backend, rather than patching the frontend again.

1. **Disposable or temporary email addresses are currently only blocked by the frontend, using a very short list of known throwaway providers, and only on the Sign Up screen.** This is easy to get around, either by using one of the many providers not on that short list, or simply by reaching the backend a different way than through our own sign-up form. This needs to become a real backend-enforced check, using a list the backend can keep up to date on its own. This is the highest-priority item in this module.
2. **Right now, the Forgot Password screen can be used to figure out whether a given email address has an account with us, because the backend responds differently depending on whether the account exists.** The Login screen already avoids this problem correctly. This is a real, live gap and needs to be fixed before launch — it's the second highest-priority item here.
3. **In at least one situation, a raw internal/database-level error message can currently reach the user** (for example, when someone tries to set up a second company on an account that already has one). Every error a user could ever see needs to be a clean, friendly message — never something that exposes how our systems are built underneath.
4. **Error messages coming from the backend today are just plain English sentences, without any consistent, structured way for the frontend to know what specifically went wrong.** Because of this, the frontend currently has to guess at meaning by looking for specific words in the message text, which is fragile — if the wording ever changes, things can silently break — and makes it much harder to translate messages into other languages. The backend should give each type of error a stable, predictable label the frontend can rely on, instead of relying on exact wording.
5. **The shape of an error response isn't consistent from one situation to another** — sometimes it comes back one way, sometimes a noticeably different way. The frontend has to handle all of these different shapes today. Settling on one consistent way to describe an error, everywhere, would remove a lot of this complexity.
6. **Password strength checks, and checks against commonly used or previously breached passwords, are currently only enforced by the frontend**, using a small built-in list. Reaching the backend a different way than through our own forms currently allows a weak or already-breached password to be set anyway. The backend needs to enforce the same rules independently.
7. **There's currently no way to confirm that resetting a password actually signs a user out of their other devices** — the screen tells the user this will happen, but nothing today actually verifies that it does. This needs to be a real, confirmed guarantee, not just a claim shown on screen.
8. **There is no bot-protection in place anywhere in the product today**, even though it's been planned and referenced in project setup. This should be built and turned on before this module is considered complete, not left as a future intention.
9. **The mechanism meant to quietly keep a user's session alive in the background isn't actually being used anywhere yet.** As things stand, once a user's initial sign-in expires, nothing renews it automatically. This needs to be properly built as part of this rebuild.
10. **How long a passcode stays valid, how often someone can ask for a new one, and how many times they can try — are currently just fixed numbers built into the app**, not something the backend actually controls or can adjust. If the backend's real policy is ever different, the countdowns and limits shown to the user would be wrong. These should come from the backend instead.
11. **The "Remember me" checkbox on Login doesn't currently do anything.** Every login is treated the same regardless of whether it's checked — the exact same problem called out in the old project's version of this document, which was never actually fixed. This should either be properly implemented this time, or removed so it stops misleading people.
12. **The Company Setup screen is described to the user as setting up a "workspace," but what it actually creates is a Company** — the very thing that owns billing and the team roster elsewhere in the product. Confusingly, an entirely separate "Workspace" concept already exists later in the dashboard, referring to something smaller and different. This naming clash should be resolved deliberately rather than left as is (see Section 15).
13. **The Company Setup screen offers no way to choose between a Corporate or Agency company type**, even though the system underneath supports that distinction — it's simply always assumed to be Corporate. Worth a clear decision on whether this should be user-facing.
14. **A way of looking up a company by its invite link currently only exists in our own test/mock setup and doesn't yet exist on the real backend.** This needs a real decision and implementation before invite-based company joining can work in production.

## 14. Open Questions

- Should the "workspace" language on the Company Setup screen be changed to "company" to match how the rest of the product refers to it, or should the other part of the product be the one to change instead? Either way, the current mismatch shouldn't ship as-is.
- Should Corporate vs. Agency be shown as a real choice on the Company Setup screen, or dropped entirely if it isn't meant to be something the user picks?
- Should "Remember me" be built to actually do something, or removed from the Login screen?
- Is the "last seen" check still needed for anything, or can it be retired if nothing uses it?
- What should the actual rules be for how long a passcode lasts, how often someone can request a new one, and how many tries they get — so the frontend can reflect the real policy instead of guessing?
- Should Google/Microsoft social login be added?
- Should MFA be optional or mandatory, and on what timeline?
- Should SSO/SAML be supported for enterprise customers?
- What's the plan and timeline for choosing and turning on a bot-protection provider?

## 15. Out of Scope

Not included in this version: social login, SAML/SSO, MFA, passwordless login, phone/SMS verification, multi-company onboarding, risk-based/adaptive authentication, and the separate dashboard-level "Workspace" concept (which would need its own PRD).

## 16. Analytics Events

We should be tracking: sign-up started, sign-up submitted, sign-up verified, company created, company joined via invite, login success, login failed, forgot-password requested, reset-code verified, password reset completed, rate-limit triggered, session renewed, session renewal failed.

## 17. Definition of Done

This module is ready to build when:

- Product has approved the requirements, including answers to the Open Questions in Section 14.
- Design has finalized the UX, including decisions on "Remember me" and the Company Setup naming and Corporate/Agency question.
- Backend has confirmed and addressed every item in Section 13 that depends on backend work — especially disposable-email checking, the Forgot Password information leak, the raw error-message leak, consistent and predictable error messages, and password-rule enforcement, since these carry the most real risk.
- Engineering has confirmed the app can switch from its current stand-in backend to the real one without needing its own code changed — only a configuration switch.
- QA has test cases covering every flow in Section 7 and every gap in Section 13, checked against both the stand-in and the real backend to confirm they behave the same way.
- Security has specifically re-verified that no screen ever reveals whether an email is registered, that rate-limiting and lockouts are truly enforced by the backend, and that a password reset genuinely ends other sessions.
- Legal/Privacy has approved vendor disclosures (once a bot-protection provider is chosen) and confirmed our privacy notice covers this module.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.

## 18. What Moved From Frontend to Backend

A quick-reference summary of the shift described throughout this document, since this is one of the most important changes in the rebuild.

- **Disposable/temporary email checking** — was entirely frontend, using a short built-in list; needs to become a real, backend-maintained check.
- **Password strength rules** — was entirely frontend; the backend needs to check the same rules independently.
- **Common or previously breached password checking** — was entirely frontend, using a short built-in list; needs a real, backend-maintained check.
- **Preventing anyone from learning whether an email is registered** — works correctly today on Login, but not yet on Forgot Password; needs to be consistent everywhere, and enforced by the backend.
- **Rate limiting and account lockouts** — currently more of a stand-in behavior than a real backend policy; needs to be genuinely decided and enforced by the backend, with the frontend only reflecting it.
- **How long a passcode lasts, and how often a new one can be requested** — currently fixed numbers built into the app; should come from the backend instead.
- **Making error messages meaningful and consistent** — currently the frontend has to interpret plain English messages to figure out what happened; the backend should provide something clear and predictable instead.
- **Bot protection** — doesn't exist yet at all; needs to be built as a real backend-verified check.
- **Ending other sessions after a password reset** — currently just a claim shown to the user; needs to be a real, verified backend guarantee.
- **Keeping a session alive in the background** — currently not happening at all; needs to be properly built.

Across all of these, the frontend's job stays the same: give the user quick, friendly feedback as they go, and clearly reflect whatever the backend ultimately decides — never assume the frontend's own check was ever the real protection.
