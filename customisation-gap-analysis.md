# Customisation — Gap Analysis

Comparing the job **Customisation** step in the live product against ours.

| | |
|---|---|
| **Reference** | `dev.xinterview.xyz` → `/jobs/{id}/edit/?activeStep=3` |
| **Ours** | `localhost:3000/jobs/{id}/edit/customisation/*` |
| **Method** | Logged into dev with the shared account, created a job, opened every section in the left rail and recorded its fields. Our side read from `components/customisation/*-section.tsx` and `lib/validation/job.ts`. |
| **Date** | 10 Aug 2026 |
| **Status** | Gaps closed — see §8. |

> Scope note: this covers the **job-level** customisation step. Our Workspace
> settings renders the same components, so every finding applies there too.

---

## 1. Structure at a glance

**dev — 5 groups, 9 sections**

| Group | Sections |
|---|---|
| Interview setup | Form Elements · Candidate Notifications · Anti-Cheating |
| Evaluation & scoring | AI Evaluation · Scoring Labels |
| Workflow | Stages |
| Candidate experience | Introduction Note · Thank You Page |
| Branding | Branding · Social Preview |

**ours — 3 groups, 10 sections**

| Group | Sections |
|---|---|
| Candidate experience | Branding · Welcome page · Form settings · Thank you page · Social preview |
| Interview | Interview experience · Emails & notifications |
| Evaluation | AI evaluation · Scoring labels · Stages |

### Naming differences (same feature, different label)

| dev | ours |
|---|---|
| Anti-Cheating | Interview experience |
| Candidate Notifications | Emails & notifications |
| Introduction Note | *(folded into Welcome page)* |
| Form Elements | *(split into Welcome page + Form settings)* |

### Grouping differences

- dev separates **Workflow** (Stages) from Evaluation; we put Stages under Evaluation.
- dev has a dedicated **Branding** group; we fold Branding into Candidate experience.
- dev keeps **Introduction Note** as its own section; ours is a toggle inside Welcome page.

Neither is wrong — but if the goal is parity for users switching between products,
`Anti-Cheating` is a more self-explanatory label than `Interview experience`.

---

## 2. What **we have that dev does not**

| Feature | Where | Notes |
|---|---|---|
| **Logo upload** | Branding | dev's Branding has no logo at all. Its logo is a *toggle* under Form Elements — show/hide only, with the image presumably set at company level. |
| **Theme (Light / Dark / Auto)** | Branding | With preview thumbnails. Nothing equivalent on dev. |
| **Font picker** | Branding | 6 typefaces, each rendered in its own face. Not present on dev. |
| **Colour presets** | Branding | 10 one-click swatches. dev has two colour dots and a native picker only. |
| **Company title** | Branding | Added recently. dev has no equivalent field. |
| **Three-state form fields** | Form settings | We offer **Off / Optional / Required** per field. dev has a binary on/off toggle — it cannot express "collect but don't require". |
| **SMS notification channel** | Emails & notifications | Our schema carries `email` *and* `sms` channels. dev exposes a single "Email Notifications" toggle. |
| **Reminder scheduling** | Emails & notifications | Configurable "remind after N days". dev's panel is one toggle with no options. |
| **Rejection message** | Emails & notifications | Optional custom message on rejection. Not on dev. |
| **Rubric per factor (1–5)** | AI evaluation | We capture a description for each of 5 levels. dev's factor table shows Factor / Weight only. |
| **Keywords per factor** | AI evaluation | Tag input per factor. Not visible on dev. |
| **Intro video URL field** | Welcome page | dev has an Intro Video *toggle* under Form Elements but no URL input in this step. |

## 3. What **dev has that we do not**

| Feature | dev section | Impact | Notes |
|---|---|---|---|
| ~~Drag-to-reorder scoring bands~~ | Scoring Labels | **Closed** | Added. Dragging swaps the two bands' score ranges, since a band *is* its range — shuffling positions alone would leave the order disagreeing with the numbers. |
| ~~Editable stages + Add Stage~~ | Stages | **Closed** | Added, with dev's exact lock rules — see §8. |
| ~~Drag-to-reorder stages~~ | Stages | **Closed** | Added. Locked stages are neither draggable nor drop targets. |
| ~~Secondary colour~~ | Branding | **Closed** | Added beside the primary, with its own picker and hex input. |
| ~~Meta description~~ | Social Preview | **Closed** | Added, capped at 160 like dev, and shown in the link-preview card. Preview title renamed **Meta title** and capped at 60. |
| ~~Character counters~~ | Several | **Closed** | Shared `CharCount` component on every capped field, in dev's `n/max characters` format, turning red at the limit. |
| **Live "Let's Start" button preview** | Branding | Low | Still open. dev previews the actual candidate CTA next to the picker; ours previews theme thumbnails but not the button. |
| **Redirect delay is stated** | Thank You Page | Low | dev states a fixed 5-second delay in help text; we expose a configurable delay field. Ours is arguably better — noted as a difference, not a gap. |

## 4. Where we match

These are equivalent in both, modulo naming:

- **Anti-cheating / Interview experience** — tab-switch detection, disable copy-paste, enforce full screen. Same three toggles, near-identical help text.
- **AI Evaluation** — position level, strictness level, enable-automatic toggle, factor table with weights, "Generate with AI", remaining-weight indicator, and linking questions to factors. Ours adds rubric + keywords on top.
- **Thank You page** — title, rich-text body, redirect URL.
- **Scoring labels** — editable band name, colour, and explicit min/max per band, with add/remove. Ours additionally validates for overlapping and gapped ranges.
- **Social preview** — favicon upload, share/preview image upload, meta title.
- **Welcome content** — title, subtitle, estimated time. (dev keeps these in Form Elements; we have them in Welcome page.)
- **Form fields covered** — first name, last name, email, phone, resume, LinkedIn URL, portfolio URL, privacy policy, terms. Identical set.

## 5. UX / interaction differences

| | dev | ours |
|---|---|---|
| Save model | One **"Save and Continue"** pinned at the bottom, full width | One **"Next: Invite candidates"** + Cancel, full width — *now matches* |
| Nav groups | 5 | 3 |
| Locked fields | First name / Last name / Email are on and greyed | Same — shown Required with a lock icon |
| Field states | Binary toggle | Off / Optional / Required segmented control |
| Panel scrolling | Whole page scrolls | Each column scrolls independently — *now matches the intent better* |

---

## 6. Remaining actions

1. A live CTA button preview in Branding (low).

**Consider keeping our differences**

- Three-state form fields, the SMS channel, rubric levels and keywords are all **ahead** of dev. Do not regress these for the sake of parity.
- Contrast checking and the human-review guard **were** ahead of dev and have now been removed by request, to keep the two products aligned.
- Our Branding (logo, theme, font, presets) is substantially richer. Note that dev's logo lives at company level as a visibility toggle — worth confirming with the team whether job-level logo override is intended, or whether ours should also be a workspace-level asset with a per-job show/hide.

---

## 7. Open questions for the team

1. Is dev's **logo toggle** under Form Elements pointing at a company-level asset? If so, should our job-level logo upload become "override the workspace logo" instead?
2. ~~Which stage names does dev lock?~~ **Answered** — see §8. Still open: does the backend enforce it, or is it UI-only?
3. dev's Candidate Notifications is a single toggle. Is the richer per-channel model (email + SMS, reminders, rejection message) already supported by the API, or is that ours ahead of the backend?
4. Our scoring section validates for overlaps *and* gaps between bands; dev appears not to. Is a gap (e.g. nothing scores 31–40) a valid state the API accepts?

---

## 8. Stage locking — measured from dev

Read directly off dev's Stages panel by inspecting each input's `disabled`
property, rather than inferring from the help text:

| Stage | dev | ours |
|---|---|---|
| Invited | 🔒 locked | 🔒 locked |
| In progress | 🔒 locked | 🔒 locked |
| Review | 🔒 locked | 🔒 locked |
| Shortlisted | editable | editable |
| Live interview | editable | editable |
| Hired | editable | editable |
| Rejected | 🔒 locked | 🔒 locked |

**Rules, matched exactly:**

- Locked stages cannot be renamed (input `disabled`), show
  *"This stage name cannot be changed"*, and have **no drag handle and no
  delete button**.
- Editable stages have both, and `Add stage` appends a new editable row.
- Reordering never moves a locked stage: they are neither draggable nor valid
  drop targets.

The rule is enforced in `saveStages` as well as the UI — a locked stage that
comes back renamed or missing is rejected with `stage_locked_renamed` /
`stage_locked_removed`. The mock cannot be the source of truth here, so this
guard is a placeholder for whatever the real API does; **worth confirming the
backend enforces the same invariant.**
