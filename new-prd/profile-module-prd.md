# Xinterview Profile Module — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/profile-module-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 12.

---

## 1. Module Summary

The Profile module is where a logged-in individual manages their own personal account: viewing and editing their name, photo, job title, and other personal details, changing their password, and reviewing their active sessions. This is distinct from the company-wide Settings area, which manages the organization's account, team, and configuration rather than one person's own identity.

This rebuild fixes several real problems that existed in the old product — the password rule shown to a user now genuinely matches what's enforced, saving a profile edit no longer forces a jarring full-page reload, and there's a proper way to see and sign out of other active sessions, which didn't exist before at all. At the same time, a few things this screen shows about the signed-in user — most notably which company they belong to and what their role is — are currently just placeholder values rather than the person's real, current information. This PRD describes the intended, complete behavior, and Section 12 is specific about where today's version still shows something other than the truth.

## 2. Scope

This document covers:

- Viewing and editing your own profile (name, photo, job title, contact details, bio, timezone)
- Changing your password
- Reviewing and managing your own active sessions
- Connecting personal third-party accounts (Google, Zoom, Microsoft Teams)

**Not covered here:** company-wide account and team settings (a separate feature).

## 3. Product Goals

### 3.1 Business Goals
- Let individuals manage their own basic identity and security without needing help from a company admin.
- Support personal productivity integrations where useful.

### 3.2 User Experience Goals
- Viewing and editing your own profile should be quick, require no guesswork, and never involve an unnecessary page reload.
- Changing a password should feel secure and give clear, accurate confirmation.
- A user should be able to see exactly which company they belong to and what their role is, and trust that what's shown is actually true.

### 3.3 Security Goals
- Password changes should genuinely enforce whatever password requirements are shown to the user, and that requirement should be defined in exactly one place so it can never quietly drift out of sync with itself.
- Changing a password should be treated as a meaningful security event.
- A user should be able to see their own active sessions and sign out of any of them individually.

### 3.4 Compliance Goals
- Personal information here should only ever be visible to and editable by the account owner.
- The password policy shown to users and the one actually enforced must match.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) wherever this module handles personal data or third-party account connections.

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 16).

## 4. Actors / Users

**Primary Users**
- **Any Logged-In User** — views and edits their own profile, changes their own password, manages their own sessions and personal connections.

**Secondary Users**
- **Security / Compliance Team** — reviews password policy enforcement and session/connection handling.

**Supporting Services**
- Personal profile data service
- Password-change service
- Session management service
- Third-party account connection services (Google, Zoom, Microsoft Teams) — not yet built, see Section 12

## 5. Global Requirements

### 5.1 Security Requirements
- The password requirements shown to a user must be the same requirements actually enforced when they change their password, and this rule should be defined once and reused everywhere it's needed, rather than being copied into multiple places that could drift apart from each other over time.
- A user should be able to review their own active sessions and end any of them individually, other than the one they're currently using.
- Connecting and disconnecting a personal third-party account must both function reliably, once this feature is actually built.

### 5.2 Privacy & Compliance Requirements
- Personal profile information must only be visible to and editable by the account owner.
- A failed action must never be misreported to the user as something else — if a password change fails for any reason, the message shown should reflect the real reason, not default to a generic guess.
- Information shown about a user's own company and role must be their real, current information, not placeholder or example data.

### 5.3 Validation Standards
- Profile edits and password changes must be validated with clear, accurate rules before saving, with clear error messages when something is invalid.

### 5.4 Logging Requirements
At minimum, we should be able to see a record of: profile information changed, password changed, session ended, and personal third-party accounts connected or disconnected (once that feature exists).

## 6. Shared Experience Standards
- Works well on both desktop and mobile.
- Save actions give clear, accurate confirmation of success or failure, without ever requiring a full page reload just to reflect a successful save.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast throughout.

## 7. User Stories & Requirements

### 7.1 Viewing and Editing Your Profile

**User Story:** As a user, I want to see and update my own profile information.

**How it should work:** A user should be able to see and edit their name, upload or remove a profile photo, and fill in additional details like job title, location, bio, and timezone. A change should only need to be saved once the user has actually made one, with a clear save/discard option appearing at that point.

**Acceptance Criteria:** Profile edits are saved reliably and reflected immediately without a page reload; the user gets clear confirmation of success, and a clear, accurate explanation if a save fails.

**Worth noting:** the location field can currently be edited and appears to save, but the backend doesn't actually store whatever a user enters there — it always reports back a placeholder value regardless of what was typed. This needs to be fixed so an edit to this field either genuinely persists, or the field is removed until it can (see Section 12). Separately, a preferred-language option, which the underlying system already knows about, isn't currently shown anywhere on this screen at all — worth a decision on whether it should be added.

---

### 7.2 Changing Your Password

**User Story:** As a user, I want to securely change my own password.

**How it should work:** A user enters their current password, a new password, and confirms the new password, each with a show/hide toggle and a live strength indicator. On success, a confirmation message is shown. On failure, the message shown should accurately explain what actually went wrong — an incorrect current password, a password that doesn't meet the rules, or anything else — rather than always assuming the same cause.

**Acceptance Criteria:** A password can only be changed with the correct current password; the new password must meet the required policy and be confirmed correctly before submission; success and every kind of failure are communicated clearly and accurately.

**Real progress worth highlighting:** the password rule shown to the user here now genuinely matches what's enforced when the change is submitted — this closes a real, previously flagged gap. That said, this correctness currently depends on three separate places in the product all independently describing the exact same password rule, rather than one shared definition all three refer back to. As long as all three stay in agreement, everything works exactly as intended, but if any one of them is ever updated without the other two, the old "shown rule doesn't match enforced rule" problem could quietly come back. This should be consolidated into a single shared definition (see Section 12).

**Also worth fixing:** if the real backend ever returns an error this screen doesn't already have a specific, pre-written message for, the user currently sees a generic "something went wrong" message instead of the more specific explanation the backend actually provided. This is a smaller version of the old "always blamed on wrong password" problem and should be fixed so an accurate, specific backend message reaches the user whenever one is available (see Section 12).

**Still an open gap:** changing your password doesn't currently end your other active sessions elsewhere. This should be reconsidered given that a real, working "sign out of other sessions" feature now exists on this same screen (see 7.3) — it may make sense for a password change to trigger that automatically, or to at least clearly prompt the user to do it themselves.

---

### 7.3 Managing Your Sessions

**User Story:** As a user, I want to see where I'm currently signed in and end a session I don't recognize or no longer need.

**How it should work:** A user should see a list of their active sessions, generally by device, with their current session clearly marked and protected from being accidentally ended. Any other session can be ended individually.

**Acceptance Criteria:** A user can see all of their genuinely active sessions and end any of them except the one they're currently using.

**A genuinely new and welcome addition** compared to the old product, which had no equivalent feature at all. The one thing to resolve is that this session list is currently its own independent, disconnected piece — it isn't yet informed by, or able to inform, anything else that manages a user's sign-in state elsewhere in the product (see Section 12).

---

### 7.4 Connecting Personal Accounts

**User Story:** As a user, I want to connect my personal Google, Zoom, or Microsoft Teams account for convenience.

**How it should work:** A user should be able to connect any of the three supported accounts through a secure sign-in step, see clearly which ones are connected, and disconnect any of them at any time.

**Acceptance Criteria:** Connecting and disconnecting an account both work reliably for all three providers; a connected account can be clearly seen as connected.

**Current state:** this feature doesn't exist anywhere in the product yet — not on this screen, not in the navigation, nowhere. The system underneath is already aware of whether a user has each of these three accounts connected, so the groundwork for showing this information exists, but nothing has been built yet to actually let a user connect, view, or disconnect any of them. This should be treated as a feature still to be built, not a bug to fix (see Section 12).

## 8. Shared Error Message Principles
- Help the user recover — never dead-end them.
- Never expose internal/technical error details in a user-facing message.
- An error message must accurately reflect what actually went wrong, not default to a generic guess when a more specific, accurate explanation is available.

## 9. Non-Functional Requirements

**Security:** Password requirements shown and enforced must match, sourced from one single shared definition; sessions must be genuinely revocable.

**Performance:** Profile edits and password changes should feel immediate, without any full-page reload.

**Reliability:** A save action should never leave the user unsure whether it worked.

**Accessibility:** Full keyboard navigation, screen-reader support, and accessible color contrast throughout.

**Auditability:** Profile changes, password changes, session activity, and account connections/disconnections should be traceable to the user and time they occurred.

## 10. Assumptions & Constraints
- This module covers an individual's own personal account only, not company-wide settings.
- Connecting a third-party account is optional and intended as a personal productivity convenience, not a requirement to use the platform.
- What a user sees about their own company (its name, and their role within it) should always be their real, current information — see Section 12 for why this isn't true today.

## 11. Dependencies
- Personal profile data service
- Password-change service
- Session management service
- Third-party account connection services (Google, Zoom, Microsoft Teams) — to be built

## 12. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3.

1. **The company name and role shown on this screen are currently placeholder values, not the signed-in user's real, current company or role.** Interestingly, the real information is already available elsewhere in the product's underlying data — it's just never actually reaches this particular screen. This is a meaningful gap to close, since showing a user the wrong company or role, even by accident, is the kind of thing that undermines trust in the product.
2. **The password rule is currently defined independently in three separate places in the codebase, which today happen to all agree with each other, but aren't actually tied together.** If any one of them were ever changed on its own, the old problem of "the rule shown doesn't match the rule enforced" could resurface without anyone noticing right away. These should be consolidated into a single shared definition.
3. **If a password-change attempt fails for a reason this screen doesn't already have specific wording prepared for, the user sees a generic "something went wrong" message instead of the more specific explanation available from the backend.** This should be fixed so an accurate, specific message is shown whenever one is available, rather than falling back to something generic by default.
4. **Editing your location doesn't actually save anywhere** — the field can be typed into and appears to accept the change, but the stored value never updates; it always reports back a fixed placeholder instead. This field should either be properly connected or removed until it can be.
5. **A preferred-language setting is already understood by the underlying system, but isn't shown or editable anywhere on this screen.** Worth a decision on whether it should be added here.
6. **Changing your password doesn't currently do anything to your other active sessions**, even though a real, working way to view and end other sessions now exists on this same screen. Worth deciding whether a password change should automatically end other sessions, or at least clearly prompt the user to do so themselves.
7. **The ability to connect personal Google, Zoom, and Microsoft Teams accounts doesn't exist anywhere in the product yet.** The underlying system already knows whether each is connected, but no screen or flow has been built to actually let someone connect or disconnect one.

## 13. Open Questions
- Should the password rule be consolidated into one single shared definition that every part of the product refers to, rather than three separate copies?
- Should changing a password automatically end a user's other active sessions, now that a real sessions feature exists?
- Should the location field be properly connected to real storage, or removed until it can be?
- Should a preferred-language setting be added to this screen?
- What's the priority and timeline for building the personal third-party account connections feature?

## 14. Out of Scope
Not included in this version: company-wide account and team settings (a separate feature).

## 15. Analytics Events
We should be tracking: profile viewed, profile information updated, password changed, session ended, personal account connected, personal account disconnected.

## 16. Definition of Done
This module is ready to consider complete when:
- Product has approved the requirements, including answers to the Open Questions in Section 13.
- Design has finalized the UX for any newly added fields (like preferred language) and for how a password change should relate to other active sessions.
- Engineering has connected this screen to the user's real company and role information, consolidated the password rule into one shared definition, fixed the location field, and ensured specific backend error messages reach the user whenever available.
- QA has test cases covering every flow in Section 7.
- Security has specifically re-verified password policy enforcement and confirmed session-ending genuinely works.
- Legal/Compliance has confirmed personal data handling and, once built, third-party connection disclosures are reflected in our privacy notice.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.
