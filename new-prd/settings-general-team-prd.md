# Xinterview Settings — General & Team — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/settings-account-and-team-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 12.

---

## 1. Module Summary

This part of company Settings covers two things: the company's own account details, and the company's team roster — everyone who has access to the company's Xinterview account, how they're invited, and how they're removed. This is distinct from a person's own personal profile settings, which is a separate, individual-scoped area.

This rebuild genuinely improves on several things the old product got wrong — a team member's role can now actually be changed after they've been invited, and the team screen now proactively shows how many seats a company has used out of their plan, instead of only finding out after hitting the limit. At the same time, one feature has regressed: resending an invite, which used to at least work even if it wasn't always reliable, now doesn't work at all. And a full, carefully designed way to delete a company account has been built but is currently switched off and not connected to anything real. This PRD describes the intended, complete behavior, and Section 12 spells out exactly where today's version doesn't match that yet.

## 2. Scope

This document covers:

- Company account details (name, logo, size, contact info, business type)
- Viewing the company's team roster
- Inviting a new team member
- Changing a team member's role
- Removing a team member
- Resending an invite
- How an invited person actually joins the company
- Deleting or deactivating the company account

**Not covered here:** an individual's own personal profile settings; assigning which team members work on a specific job (covered in the Create Job PRD); domain, integration, and API-key management (covered in the Integrations PRD).

## 3. Product Goals

### 3.1 Business Goals
- Make it easy for a company to keep its account details accurate and its team roster up to date.
- Support smooth onboarding of new team members via invite.

### 3.2 User Experience Goals
- Company details should be simple to view and update.
- Managing who has access to the company account should be transparent and low-friction.
- A company should always know where they stand relative to their plan's team-size limit, before they hit it.

### 3.3 Security Goals
- Only authorized users should be able to invite, change the role of, or remove team members.
- Removing a team member, and deleting the company account entirely, should both be deliberate, confirmed actions.
- The person who created the company should always be protected from being accidentally removed or having their standing changed by someone else.

### 3.4 Compliance Goals
- Team member data is company personnel data and should be handled with the same privacy diligence as other personal data in the platform.
- Access to the company account should be traceable — who was invited, by whom, what role they were given, and when they were removed.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) wherever this module handles team member personal data.

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 16).

## 4. Actors / Users

**Primary Users**
- **Company Owner** — the person who created the company; has full control over company details and the team roster, and cannot be removed or demoted by anyone else.
- **Manager** — can invite members, change roles, and manage all jobs and candidates.
- **Executive** — can view and manage jobs and candidates, but cannot invite or remove team members.

**Secondary Users**
- **Invited Person (not yet a member)** — receives an invite and goes through the normal sign-up process to join.

**Supporting Services**
- Company account data service
- Team roster/invite service

## 5. Global Requirements

### 5.1 Security Requirements
- Only the company owner or a manager can invite, change the role of, or remove a team member.
- Removing a team member, and deleting the company account, must both require an explicit confirmation step.
- The company owner can never be removed or have their standing changed by another team member, from this screen or otherwise.

### 5.2 Privacy & Compliance Requirements
- Team member personal data shown in the roster should only be visible to authorized company users.
- Removing a team member should be understood as removing their access, with a clear, documented policy on what happens to any data or work they were associated with.
- Deleting a company account should have a clear, documented answer for what happens to the company's jobs, candidates, and recordings.

### 5.3 Validation Standards
- Company account fields should be validated appropriately before saving.
- An invite requires a valid email address.
- Deleting a company account should require the person confirming it to type the company's name, to make sure it's never triggered by accident.

### 5.4 Logging Requirements
At minimum, we should be able to see a record of: company details updated, team member invited, team member's role changed, invite resent, team member removed, and company account deletion requested.

## 6. Shared Experience Standards
- Works well on both desktop and mobile.
- Every save and every team action gives clear confirmation.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast throughout.

## 7. User Stories & Requirements

### 7.1 Company Account Details

**User Story:** As a company admin, I want to view and update our company's core details.

**How it should work:** A company can upload and reset their logo, and set their company name, website, size, phone number, company type, and business category. Saving updates the company record.

**Acceptance Criteria:** All company details can be viewed and updated reliably, with changes reflected immediately after saving.

---

### 7.2 Team Roster

**User Story:** As a company admin, I want to see everyone who has access to our company account, and understand where we stand against our plan's limit.

**How it should work:** The team roster should list every current member and anyone invited but not yet joined, showing each person's name, email, role, and status. It should also clearly show how many seats have been used out of the company's plan, with a warning as that limit gets close and a clear message once it's reached.

**Acceptance Criteria:** The roster accurately reflects everyone with current access and everyone with a pending invite; seat usage is shown proactively, before a company ever tries to invite past their limit.

**Real progress worth highlighting:** proactive seat-usage visibility, which didn't exist at all in the old product, is now genuinely built and working well. One thing worth tightening up: the seat limit shown on this screen and the team-size limit tied to the company's actual subscription plan currently come from two different places that aren't connected to each other, so it's possible for them to disagree. These should be reconciled into a single source of truth (see Section 12).

---

### 7.3 Inviting a New Team Member

**User Story:** As a company admin, I want to invite someone new to join our company account, ideally with a specific role in mind.

**How it should work:** Inviting someone should let the admin choose the role they'll join with, alongside their email address. If the company has reached its plan's team-size limit, the invite button itself should make that clear rather than letting someone attempt it and fail.

**Acceptance Criteria:** A valid invite is sent successfully with the intended role; a company at their seat limit is clearly told so before they try to invite someone new.

**Worth resolving:** the ability to choose a role at invite time has actually been built, but is currently switched off — every invite goes out with the same default role regardless of what an admin might want, exactly like the old product's version of this same gap. Turning this on looks like a small, low-risk change since the feature is already there and just needs to be enabled (see Section 12).

---

### 7.4 Changing a Team Member's Role

**User Story:** As a company admin, I want to change someone's role after they've already joined, as their responsibilities change.

**How it should work:** An admin should be able to open a team member's role and change it, with a clear explanation of what each role can and can't do.

**Acceptance Criteria:** A role change is saved reliably and takes effect immediately; the company owner's standing can never be changed this way.

**Real progress worth highlighting:** this is a genuinely new capability that didn't exist in the old product at all, and it's fully working — a real gap has been closed here.

---

### 7.5 Resending an Invite

**User Story:** As a company admin, I want to resend an invite to someone who hasn't joined yet.

**How it should work:** An invite should be able to be resent to a pending invitee directly from the roster, reliably reaching the intended person.

**Acceptance Criteria:** A resent invite reliably goes to the correct, intended person.

**A real regression worth flagging clearly:** in the old product, resending an invite worked, even if there was some question about whether it always reached the right person. In this rebuild, resending an invite currently doesn't work at all — clicking it always results in a failure. There's also currently no way at all to resend an invite through the underlying system this product is being built against, meaning this needs to be built as a real capability, not just reconnected to something that already exists. In the meantime, an admin can still copy the invite link directly and share it themselves as a workaround (see Section 12).

---

### 7.6 Removing a Team Member

**User Story:** As a company admin, I want to remove someone's access to our company account.

**How it should work:** The company owner or a manager should be able to remove a team member, always with a clear confirmation step first. The company owner can never be removed.

**Acceptance Criteria:** Removing a team member always requires confirmation; the company owner can never be removed, by anyone, through any path.

**Worth being precise about:** the protection that keeps the company owner from being removed exists only on the frontend today — the underlying system this product is being built against doesn't actually have a concept of "the owner" at all, only more general roles. This means the protection currently depends entirely on this app's own screen behaving correctly, with nothing double-checking it elsewhere. This should be treated as an important open question for how ownership is meant to work at the system level, not just a frontend detail (see Section 12).

---

### 7.7 How an Invited Person Joins

**User Story:** As someone who's been invited to a company, I want a clear path to actually join.

**How it should work:** An invited person follows the link in their invite into the normal account sign-up process. If they're joining an existing company, they should be offered a clear choice between joining that company or creating a new one.

**Acceptance Criteria:** An invited person can reliably join the correct company through the standard sign-up flow.

---

### 7.8 Deleting the Company Account

**User Story:** As the company owner, I want a real way to permanently close our company's account if we ever need to.

**How it should work:** The company owner should be able to request permanent deletion of the company account, understanding clearly that this removes all jobs, candidates, interview recordings, reports, and team access. To guard against this happening by accident, the owner should have to type the company's exact name to confirm before it proceeds.

**Acceptance Criteria:** Only the company owner can request this; it always requires typing the company name to confirm; once confirmed, it's a genuine, working action, not just a message saying it worked.

**Current state:** the screen and confirmation flow for this have actually already been carefully designed and built, including the type-the-company-name safeguard — but the feature is currently switched off, and even if it were switched on, confirming it today only shows a success message without a real, connected action behind it, because there isn't yet a way for this to actually happen in the underlying system either. This is a case where the thoughtful design work is already done, but both turning it on and making it genuinely functional are still ahead of us (see Section 12). Separately, there's a "Danger zone" entry in the settings navigation that currently leads to an unrelated, empty "coming soon" page — this should be pointed at the real Danger Zone experience once it's ready, rather than left as two disconnected things with overlapping names.

## 8. Shared Error Message Principles
- Help the company admin recover — never dead-end them.
- Never expose internal/technical error details in a user-facing message.
- Seat-limit and permission errors should clearly explain what happened and what to do next.

## 9. Non-Functional Requirements

**Security:** Team management restricted to the owner and managers; removal and account deletion always confirmed; the company owner is protected from removal or demotion through every path, not just the visible one.

**Performance:** Roster loading and invite actions should feel immediate.

**Reliability:** No invite, role change, or removal action should be lost due to a network hiccup.

**Accessibility:** Full keyboard navigation, screen-reader support, and accessible color contrast throughout.

**Auditability:** Every company-detail change, invite, role change, resend, removal, and deletion request should be traceable to who did it and when.

## 10. Assumptions & Constraints
- Company account details are managed separately from an individual's own personal profile settings.
- Team management here is company-wide access management, distinct from assigning specific team members to a specific job.
- The idea of a company "Owner" is currently something this app enforces on its own, since the underlying system it's being built against only recognizes more general roles — this is worth resolving deliberately rather than continuing to rely on the frontend alone (see Section 12).

## 11. Dependencies
- Company account data service
- Team roster/invite service
- Auth/registration flow (for how an invited person actually joins)

## 12. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3.

1. **Resending an invite is currently guaranteed to fail, and there's no way for it to succeed today** — not because of an unreliable connection to something that exists, but because the underlying system this is built against has no way to resend an invite at all yet. The only working alternative today is copying the invite link directly and sharing it another way. This needs to be built as a real capability.
2. **The idea of a company "Owner" — someone who can never be removed or have their role changed by anyone else — only exists inside this app's own screen today.** The underlying system this is built against only understands more general roles, with no concept of an owner at all. This means the protection that keeps an owner safe from being removed currently depends entirely on this one screen behaving correctly, and nothing would stop that protection from being bypassed through a different path into the same system. This is worth resolving as a real, system-wide decision about how company ownership should work, not something this screen should have to enforce alone.
3. **The seat limit shown on this screen and the team-size limit tied to the company's actual subscription plan come from two different, disconnected places**, and could disagree with each other. These should be reconciled so there's one single, trustworthy number.
4. **Choosing a role at invite time has already been built, but is currently switched off** — every invite goes out with the same default role today. This looks like a low-risk, low-effort fix since the capability already exists.
5. **A complete, carefully designed way to delete the company account exists — including a safeguard requiring the owner to type the company's name — but it's currently switched off, and even if it were switched on, there's no real backend action behind it yet.** This needs both to be turned on and genuinely connected before it can be relied on.
6. **The "Danger zone" item in the settings navigation currently leads to a separate, empty "coming soon" page, unrelated to the actual account-deletion experience described above.** These two things should be unified once the real deletion flow is ready.

## 13. Open Questions
- How should company ownership be represented and protected at the system level, rather than only by this screen's own logic?
- Should the seat-limit number be sourced from a single, unified place shared between this screen and the company's subscription plan?
- Should the ability to choose a role at invite time be turned on now, given it's already built?
- What's the priority and timeline for building a real, working way to resend an invite?
- What's the priority and timeline for connecting the already-built company-deletion screen to a real, working action?
- What should happen to a company's jobs, candidates, and recordings once a company account is deleted, and how long should that data be retained before final deletion, if at all?

## 14. Out of Scope
Not included in this version: personal/individual profile settings (a separate feature); job-level team assignment; domain, integration, and API-key management.

## 15. Analytics Events
We should be tracking: company details updated, team member invited, team member's role changed, invite resent, team member removed, company account deletion requested.

## 16. Definition of Done
This module is ready to consider complete when:
- Product has approved the requirements, including answers to the Open Questions in Section 13.
- Design has finalized the UX for how company ownership should be represented at the system level, and for unifying the two disconnected "Danger zone" experiences.
- Engineering has built a real, working way to resend an invite, connected the seat-limit display to a single source of truth, turned on role selection at invite time, and connected the already-built account-deletion flow to a real backend action.
- QA has test cases covering every flow in Section 7.
- Security has confirmed the company owner cannot be removed or demoted through any path, not just the visible one, and that account deletion is properly safeguarded and confirmed.
- Legal/Compliance has confirmed a documented policy for what happens to a removed team member's associated data, and to a deleted company's data.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.
