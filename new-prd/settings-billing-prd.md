# Xinterview Settings — Billing — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/settings-billing-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 12.

---

## 1. Module Summary

The Billing section of company Settings is where a company views their current subscription plan and usage, upgrades from a trial, applies promo codes, and where they should eventually be able to manage their subscription, billing address, and see past invoices.

This rebuild has genuinely cleaned up one real risk from the old product — the old, unused sample payment form with realistic-looking fake card details is confirmed gone entirely. It also confirms a sound underlying approach to handling payments: real card details are never meant to touch our own systems at all, only a dedicated, secure external payment provider. What hasn't happened yet is connecting several pieces that have already been built behind the scenes — a company's billing address can already be saved and read by the system, but there's currently no screen anywhere that lets anyone see or use that. And one thing has slipped that wasn't a problem before: Billing used to be something only a company's owner or admin could see, and right now, anyone with access to Settings at all can see and act on the company's plan and billing, regardless of their role.

## 2. Scope

This document covers:

- Viewing the company's current plan and usage
- Upgrading from a trial plan
- Applying promo/coupon codes
- Billing address, payment method, and invoice history (already supported by the system, but not yet reachable in the product — see Section 12)

**Not covered here:** the actual pricing/feature details of each plan tier as a marketing decision, and the underlying features that different plans unlock.

## 3. Product Goals

### 3.1 Business Goals
- Make it easy for a trial company to upgrade to a paid plan.
- Give companies clear visibility into their usage against plan limits.
- Support additional revenue through promotional codes.

### 3.2 User Experience Goals
- A company should always understand what plan they're on, what it includes, and how close they are to any limits.
- Upgrading should be quick and require minimal steps.
- Billing information should eventually be manageable directly within the product, without needing to contact support.

### 3.3 Security Goals
- Only authorized company users should be able to view or manage billing.
- Payment card details should never be handled directly by our own systems — this should always be delegated to a secure, dedicated payment processor.

### 3.4 Compliance Goals
- Payment card data must never be collected or transmitted through our own systems — it should be handled entirely by a dedicated, secure external payment provider.
- Billing address and invoice data must be handled according to standard data-protection practices.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) wherever this module collects or stores company billing information.

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 16).

## 4. Actors / Users

**Primary Users**
- **Company Owner / Admin** — intended to be the only role able to see and manage Billing.

**Secondary Users**
- **Security / Compliance Team** — reviews how payment and billing data is handled.
- **Support Team** — assists companies with billing questions.

**Supporting Services**
- Subscription/plan data service
- External payment processing service (handles all actual card data and checkout)

## 5. Global Requirements

### 5.1 Security Requirements
- Only company admins/owners can access the Billing section — this needs to be actually enforced, which today it isn't (see Section 12).
- No raw payment card data should ever be collected or stored by our own systems — payment must always be handled through a secure, dedicated external processor.

### 5.2 Privacy & Compliance Requirements
- Billing address details must be handled with the same care as other sensitive company data.
- Any promotional/discount code redemption should be clearly explained to the company.

### 5.3 Validation Standards
- Billing address fields, where collected, must be validated as required before saving.
- Plan changes and coupon redemptions must always confirm success or failure clearly to the company.

### 5.4 Logging Requirements
At minimum, we should be able to see a record of: plan upgrades, coupon code redemptions, and any billing-address changes.

## 6. Shared Experience Standards
- Works well on both desktop and mobile.
- Any action that involves the company's plan gives clear confirmation before and after.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast throughout.

## 7. User Stories & Requirements

### 7.1 Current Plan Overview

**User Story:** As a company admin, I want to see our current plan and usage at a glance.

**How it should work:** The Billing screen should show the plan name, when it renews, and usage figures for jobs created, team members, candidates responded to, and AI credits used, each shown against the plan's real limit.

**Acceptance Criteria:** Plan name, renewal date, and usage figures are always accurate and up to date.

**Current state:** this genuinely works well — the usage figures shown are based on the company's real activity and real plan limits, not placeholder numbers.

---

### 7.2 Upgrading from a Trial Plan

**User Story:** As a company on a trial, I want to see and choose from available paid plans.

**How it should work:** A trial company should see a comparison of the available paid plan tiers, with a monthly/annual pricing toggle, and be able to start an upgrade directly from this screen, which hands off to a secure external checkout process.

**Acceptance Criteria:** A trial company can clearly compare plans and successfully upgrade; a failed payment is clearly communicated with guidance on what to do next.

**Current state:** the comparison and toggle are built and look right, but starting an upgrade currently only shows a message saying checkout is coming soon, rather than actually handing off to a real payment provider yet. This needs to be connected before this feature is genuinely usable (see Section 12).

---

### 7.3 Managing an Existing Paid Plan

**User Story:** As a company already on a paid plan, I want to manage or cancel my subscription.

**How it should work:** An already-paying company should be able to reach a secure, external plan-management experience, and should have a clear way to cancel their subscription, with confirmation before it actually happens.

**Acceptance Criteria:** An existing paying company can reach a secure plan-management experience and can cancel their subscription with clear confirmation.

**Current state:** neither of these exists as a visible option on this screen yet, even though the underlying system already has a way to cancel a subscription — it just isn't connected to anything here. This should be built (see Section 12).

---

### 7.4 Promo/Coupon Codes

**User Story:** As a company with a promotional code, I want to redeem it against my plan.

**How it should work:** A company should be able to enter a code, which applies a discount, clearly explained, to a plan they're comparing.

**Acceptance Criteria:** A valid code is applied correctly and the company is clearly told what it unlocked; an invalid code gives a clear error.

**Current state:** this genuinely works, checking against a real system rather than just a frontend guess. One detail worth refining: the actual discount percentage a code applies is currently decided by the app itself for a small, known set of codes, rather than being told directly by the system doing the validation — worth having the discount amount come from the same place that confirms the code is valid, so the two can never disagree (see Section 12).

---

### 7.5 Billing Address, Payment Method, and Invoice History

**User Story:** As a company admin, I want to manage our billing address, see our saved payment method, and view past invoices, all from within Xinterview.

**How it should work:** A company should be able to view and update their billing address, see a summary of their current payment method, and browse and open past invoices, all directly within Settings.

**Acceptance Criteria (target state, not yet met):** A company can view and update their billing address, see their current payment method, and browse and open past invoices, all directly within Settings.

**Current state:** none of this is reachable anywhere in the product today. The encouraging news is that the billing-address piece is already fully built and working behind the scenes — it just has no screen pointing to it yet, so surfacing it should be a comparatively small effort. Invoice history, on the other hand, is documented as something the system will eventually support, but nothing has actually been built for it yet, not even behind the scenes — this is a bigger piece of work than simply connecting something that already exists (see Section 12).

## 8. Shared Error Message Principles
- Help the company admin recover — never dead-end them.
- Never expose internal/technical error details in a user-facing message.
- Payment-related failures should always suggest a clear next step.

## 9. Non-Functional Requirements

**Security:** No raw payment card data ever handled by our own systems; Billing restricted to admin/owner roles, genuinely enforced.

**Performance:** Plan and usage data should load quickly and reflect real, near-real-time usage.

**Reliability:** A checkout or coupon-redemption failure should never leave the company's plan state in an inconsistent or unclear condition.

**Accessibility:** Full keyboard navigation, screen-reader support, and accessible color contrast throughout.

**Auditability:** Every plan change and coupon redemption should be traceable to who initiated it and when.

## 10. Assumptions & Constraints
- All actual payment processing is handled by a secure external provider, not built directly into our own systems — the intended approach appears to be handing a company off to that provider's own secure, hosted management page for anything involving real payment details, rather than building card forms ourselves.
- Downgrading to a lower plan tier isn't currently offered as a distinct, self-serve option.
- Only company admins/owners are meant to access this section, though this currently isn't actually enforced (see Section 12).

## 11. Dependencies
- Subscription/plan data service
- External payment processing/checkout service

## 12. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3.

1. **Billing is no longer restricted to company admins/owners — this is a real regression from the old product, not just a carried-over gap.** Today, any team member who can reach Settings at all can view and act on the company's plan, usage, and coupon redemption, regardless of their role. Every other sensitive area of Settings in this rebuild does check who's allowed to do what; Billing is the one area where that check appears to have been missed. This should be fixed as a priority, since it's a real access-control gap, not a cosmetic one.
2. **Starting an upgrade currently only shows a "coming soon" message rather than handing off to a real, working checkout.** This needs to be connected to the actual external payment provider before this feature can be relied on.
3. **There's no way to manage or cancel an existing paid subscription from this screen yet**, even though the underlying system already supports cancellation — it simply isn't wired up to anything here.
4. **Billing address management is fully built and working behind the scenes, but there is no screen anywhere that lets a company actually see or use it.** This should be a relatively quick win to surface, since the harder work is already done.
5. **Invoice history has been talked about and partially documented as a planned feature, but nothing has actually been built for it yet, on either side.** This is a larger piece of work than the billing address gap above, and should be scoped and planned as its own effort.
6. **A discount code's actual percentage is currently decided by the app itself for a short list of known codes, rather than being reported directly by the system that confirms the code is valid.** This creates a small risk that the discount shown to a company could someday disagree with what's actually applied. These should be unified so there's only one source of truth for what a code is worth.
7. **There's no self-serve way to downgrade to a cheaper plan** — only upgrading is currently possible from this screen.

**One thing worth confirming as resolved, not as a risk:** the old product had a leftover, non-functional demo payment form sitting in the codebase with realistic-looking sample card numbers — a real risk if it had ever been accidentally connected to anything. That form does not exist anywhere in this rebuild. This is a genuine improvement worth preserving; there's no old card-form code lying around to accidentally wire up.

## 13. Open Questions
- What's the priority and timeline for restricting Billing access back to admins/owners only?
- What's the priority and timeline for connecting the upgrade flow to a real, working checkout?
- Should a self-serve downgrade option be added, separate from full cancellation?
- What's the priority and timeline for surfacing the already-built billing address feature, and for building invoice history from scratch?
- Should the Billing section be visible, even read-only, to roles other than the company admin/owner?

## 14. Out of Scope
Not included in this version: the specific pricing/feature composition of each plan tier as a business/marketing decision; the underlying features that different plans unlock.

## 15. Analytics Events
We should be tracking: plan viewed, plan upgraded, plan cancelled, coupon code redeemed.

## 16. Definition of Done
This module is ready to consider complete when:
- Product has approved the requirements, including answers to the Open Questions in Section 13.
- Design has finalized the UX for surfacing billing address management and building invoice history.
- Engineering has restricted Billing access to admins/owners, connected the upgrade flow to real checkout, surfaced the already-built billing address feature, and unified how discount amounts are sourced.
- QA has test cases covering every flow in Section 7, including the currently-inactive billing address flow once reconnected.
- Security has confirmed no payment card data is ever handled directly by our own systems, and that Billing access is properly restricted.
- Legal/Compliance has reviewed billing-address data handling.
- Product, Design, Engineering, QA, Security, and Compliance have all signed off.
