# Xinterview Settings — Integrations — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/settings-integration-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 12.

---

## 1. Module Summary

The Integrations section of company Settings is where a company connects outside tools and infrastructure to Xinterview. In the old product, this one area covered a custom web domain, an SMS provider, a phone system for AI phone screening, a video storage provider, Zapier, and email-sending setup, all together.

This rebuild has reorganized that list in a meaningful way: the candidate-facing web domain and the email-sending setup have moved out of this section entirely and now live under the newer Workspace Settings area instead, on the reasoning that they're really properties of how candidates experience a specific workspace, not third-party connections in the same sense as something like Zapier. What's left here today is Zapier, a way to remove Xinterview's own branding, and API key management. The SMS provider, the phone system for AI phone screening, and the video storage provider — three of the six things this section used to cover — don't exist anywhere in the product yet, on either the frontend or the backend. This isn't a case of something being broken; it's a case of this rebuild not having reached that part of the product yet. This PRD describes the intended, complete picture, including the parts that still need to be built from the ground up.

## 2. Scope

This document covers:

- Connecting Zapier via a generated API key
- Removing Xinterview's own branding from the candidate experience
- Managing API keys
- Connecting an SMS provider for candidate notifications (not yet built — see Section 12)
- Connecting a phone system for AI phone screening (not yet built — see Section 12)
- Connecting a video storage provider for interview recordings (not yet built — see Section 12)

**Not covered here:** the candidate-facing custom domain and email-sending setup, which have moved to Workspace Settings.

## 3. Product Goals

### 3.1 Business Goals
- Let companies present a fully branded, self-hosted candidate experience.
- Support advanced hiring workflows that depend on the company's own telecom and storage accounts, once those are built.
- Let companies connect Xinterview into their broader toolset via Zapier.

### 3.2 User Experience Goals
- Every integration should clearly show whether it's connected, and make it easy to update or remove.
- Setup steps should give clear, actionable guidance rather than leaving the company guessing.
- It should always be obvious which plan a given integration requires, with a clear path to upgrade if it isn't included.
- Naming across different integrations should be clear and distinct — nothing here should reuse the same word for two genuinely different things.

### 3.3 Security Goals
- Sensitive credentials should never be shown in plain text after initial setup.
- Deleting or disconnecting an integration should require deliberate action.

### 3.4 Compliance Goals
- Third-party services connected here are sub-processors touching candidate or company data, and should be disclosed accordingly.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) wherever these integrations move or store candidate personal data.

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 16).

## 4. Actors / Users

**Primary Users**
- **Company Admin** — sets up and manages all integrations described here.

**Secondary Users**
- **Security / Compliance Team** — reviews which third-party services are connected and what data flows to them.
- **Support Team** — assists companies troubleshooting a failed connection.

**Supporting Services**
- Zapier (via company-generated API key)
- SMS provider (not yet built)
- Phone/telephony provider (not yet built)
- Video storage provider (not yet built)

## 5. Global Requirements

### 5.1 Security Requirements
- Credentials for any connected integration must never be re-displayed in full after initial setup.
- A generated API key must be shown in full exactly once at creation, and never retrievable again afterward.
- Disconnecting or deleting any integration must be a deliberate, explicit action.

### 5.2 Privacy & Compliance Requirements
- Every third-party integration that can touch candidate personal data must be disclosed in the company's privacy documentation as a sub-processor.
- A company connecting its own video storage account, once that's built, takes on responsibility for that data's handling — this should be made clear to the company at setup time.

### 5.3 Validation Standards
- Integration setup forms must validate required fields before allowing a save.
- Wherever a connection can be tested before being relied on, it should be — this is already true for email sending and should be the standard every future integration follows.

### 5.4 Logging Requirements
At minimum, we should be able to see a record of: each integration connected, updated, or disconnected, and API key creation/deletion.

## 6. Shared Experience Standards
- Every integration card clearly shows its current state.
- Any integration not included in the company's plan shows a clear upgrade prompt instead of a broken or hidden setup form.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast throughout.

## 7. User Stories & Requirements

### 7.1 Zapier Integration

**User Story:** As a company admin, I want to connect Xinterview to other tools we use via Zapier.

**How it should work:** Connecting to Zapier works through a company-generated API key, shown in full exactly once at creation and only ever shown in a masked form after that, with clear warning it can't be retrieved again. Step-by-step instructions should guide the company through using that key to set up a Zapier connection. Keys can be deleted at any time, with confirmation.

**Acceptance Criteria:** A company can generate, use, and later revoke an API key for Zapier; a generated key is never recoverable after its one-time display.

**Current state:** this works well and follows exactly the right pattern for handling a sensitive credential — worth treating this as the model to follow for any future integration that also involves a secret or credential.

---

### 7.2 Removing Xinterview Branding

**User Story:** As a company admin, I want to remove Xinterview's own branding from what candidates see.

**How it should work:** A simple toggle should let a company remove Xinterview's own branding from the candidate-facing experience, closely related to having a custom domain.

**Acceptance Criteria:** Turning this on or off is reflected reliably in what candidates actually see.

---

### 7.3 API Keys

**User Story:** As a company admin, I want to manage API keys used to authenticate integrations and outside requests.

**How it should work:** A company should be able to generate a named key, see it in full exactly once, and see only a masked version afterward. Keys can be deleted at any time.

**Acceptance Criteria:** API keys are generated, displayed once, and masked afterward reliably; deleting a key requires confirmation.

---

### 7.4 SMS Provider (Not Yet Built)

**User Story:** As a company admin, I want to connect our own SMS provider account so candidate text notifications are sent through it.

**How it should work:** A company should enter their SMS provider's details and send a test message to confirm the connection actually works before it's considered active, following the same pattern already used for email-sending setup.

**Acceptance Criteria:** SMS notifications can't be marked as active until a real test message has been successfully sent and confirmed.

**Current state:** this doesn't exist anywhere in the product today, on the frontend or behind the scenes. This entire story is a requirement for what needs to be built, not a description of anything currently working (see Section 12).

---

### 7.5 Phone System for AI Phone Screening (Not Yet Built)

**User Story:** As a company admin, I want to connect our own phone system so the AI can make automated screening calls to candidates.

**How it should work:** A company should enter their phone system's connection details, with a clear test-call step to confirm the connection works before it's used for real candidate calls — this is worth building in from day one, rather than adding it later, since the closest existing example (email-sending) already proves this pattern out well.

**Acceptance Criteria:** A company can add, update, and remove a phone-system configuration; the connection is verified with a test call before being marked active.

**Current state:** this doesn't exist anywhere in the product today. There's also a naming risk worth flagging before this gets built: the old product once had two very different things both confusingly called "domain" — a candidate-facing web address, and a phone system's own connection address. That specific confusion isn't currently a live problem, simply because this feature doesn't exist yet — but the underlying system this will eventually be built against already uses the word "domain" for exactly this kind of phone-connection detail. Whoever builds this needs to deliberately choose different, clearer wording so the old confusion doesn't quietly reappear (see Section 12).

---

### 7.6 Video Storage Provider (Not Yet Built)

**User Story:** As a company admin, I want interview recordings stored in our own video hosting account instead of the platform's default storage.

**How it should work:** A company should be able to choose their video provider and enter the relevant account details, and should be able to edit that configuration in place later if anything needs to change, rather than being forced to remove and start over.

**Acceptance Criteria:** A company can connect a supported video storage provider, edit the configuration later without starting from scratch, and interview recordings are correctly stored there going forward.

**Current state:** this doesn't exist anywhere in the product today. Since nothing has been built yet, there's a genuine opportunity to design this the right way from the start — specifically, to support editing an existing configuration in place, which was a real point of friction in the old product that never got fixed there (see Section 12).

## 8. Shared Error Message Principles
- Help the company admin recover — never dead-end them.
- Never expose internal/technical error details in a user-facing message.
- When a feature isn't available on the company's plan, clearly say so and offer a path to upgrade.

## 9. Non-Functional Requirements

**Security:** Credentials never re-displayed in full after setup; destructive actions always confirmed.

**Performance:** Any connection or verification check should give timely feedback.

**Reliability:** A failed connection attempt should be clearly explained, not silently left in a broken state.

**Accessibility:** Full keyboard navigation, screen-reader support, and accessible color contrast throughout.

**Auditability:** Every integration connected, updated, or removed should be traceable to who did it and when.

## 10. Assumptions & Constraints
- Each of these integrations connects the company's own third-party account or infrastructure — we aren't responsible for what happens inside a company's own connected provider account.
- Most of these integrations are expected to be gated by the company's subscription plan, though no plan-based restriction currently exists for anything in this section, built or unbuilt.
- The candidate-facing custom domain and email-sending setup are considered workspace-level properties in this rebuild, not company-wide integrations, and are covered in the Workspace Settings documentation instead.

## 11. Dependencies
- Zapier (via company-generated API key)
- SMS provider (to be selected and built)
- Phone/telephony provider (to be selected and built)
- Video storage providers (to be selected and built)
- Subscription/plan service

## 12. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3.

1. **Three of the six integrations this section used to cover — SMS, phone system for AI phone screening, and video storage — don't exist anywhere in the product yet, on either the frontend or the backend.** This is the most significant thing to plan for in this module: it isn't a matter of fixing something broken, it's building these from scratch.
2. **The underlying system this product is being built against currently has two different, not-yet-reconciled ways of describing phone/SMS provider configuration**, and it isn't settled which one is the right one to build against. This needs to be resolved with Backend before real work starts on the SMS or phone-screening features, so they aren't built against something that later gets replaced.
3. **The old "two different things both called domain" naming confusion is dormant, not resolved** — it isn't currently a live problem simply because the phone-screening feature doesn't exist yet, but the underlying system already uses the word "domain" for a phone connection address, which is exactly the kind of overlap that caused confusion before. Whoever builds phone-screening needs to deliberately avoid recreating this by choosing clear, distinct naming from the start.
4. **No integration in this section, built or planned, is currently tied to the company's subscription plan** — there's no indication anywhere of which plan tier is required for which integration. This is worth a deliberate decision, especially since this was expected to be true in the old product and should be more resolved here rather than less.
5. **There's no plan yet for how video storage provider setup should handle changes to an existing configuration** — since this is being built new, it's worth deciding in advance that this should support editing in place, avoiding a real point of friction that existed in the old product.

**Worth confirming as resolved, not as a risk:** the old product had a leftover, non-functional legacy tab with fake social-account toggles that had no real purpose and could confuse someone trying to understand what was actually connected. No trace of that exists anywhere in this rebuild's code or history — this is a clean start on that front.

## 13. Open Questions
- Which of the two competing ways of representing phone/SMS provider configuration should be the one we build against?
- What should the SMS provider, phone system, and video storage provider setup screens actually look like, given none of them exist yet — should they closely follow the pattern already established by email-sending setup (enter details, then test before activating)?
- Should each of these integrations be tied to a specific subscription plan tier, and if so, which ones?
- What naming should be used for the phone system's own connection address, to avoid recreating the old "two things called domain" confusion?

## 14. Out of Scope
Not included in this version: the candidate-facing custom domain and email-sending setup, now covered under Workspace Settings; editing the actual content/wording of email and SMS message templates (a separate feature); billing and plan management.

## 15. Analytics Events
We should be tracking: Zapier API key created/deleted, branding-removal toggled, and — once built — SMS provider connected/test-sent/removed, phone-screening provider added/updated/removed, video storage provider connected/removed.

## 16. Definition of Done
This module is ready to consider complete when:
- Product has approved the requirements, including answers to the Open Questions in Section 13.
- Design has finalized the UX for the SMS, phone-screening, and video-storage setup flows, including clear, distinct naming for the phone system's connection address.
- Engineering has resolved which backend approach to build phone/SMS configuration against, and has built all three missing integrations, including a genuine test-connection step for phone screening and in-place editing for video storage.
- QA has test cases covering every integration flow in Section 7, once built.
- Security has reviewed credential handling for every new integration and confirmed no sensitive values are ever re-displayed after initial setup.
- Legal/Privacy has confirmed all connected third-party services are properly disclosed as sub-processors.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.
