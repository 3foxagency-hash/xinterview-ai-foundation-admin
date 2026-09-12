# Xinterview Reports Module — PRD (New Project)

> Status: Draft v1
> Audience: Product, Design, Frontend, Backend, QA, Security, Compliance
> Reference: This module replaces `../prd/reports-module-prd.md` (old project). Differences from the old project are called out explicitly throughout, especially in Section 12.

---

## 1. Module Summary

The Reports module gives a hiring team a company-wide view of hiring pipeline activity over time — either across every job at once or scoped to a single job — showing candidate counts by stage and a trend chart over a selectable date range, with a way to export the numbers.

This is distinct from the Dashboard (a live, per-job snapshot) and the Workflow module (reviewing and acting on individual candidates). Reports is the only place that aggregates activity across all jobs and shows how it's trending over a chosen time window.

This rebuild reshapes the screen a little — there's a new breakdown table showing per-job numbers side by side, and export has moved from a picture-of-the-screen PDF to a genuine spreadsheet of the underlying numbers, which is a real improvement for anyone who wants to actually work with the data afterward. At the same time, this rebuild hasn't yet addressed the numbers themselves being real: everything shown on this screen today, including the reaction to changing the date range or the selected job, is a convincing simulation rather than a calculation from the company's actual jobs and candidates.

## 2. Scope

This document covers:

- Choosing what to report on (company-wide, or a specific job)
- Selecting a date range
- Summary stat cards showing candidate counts by stage
- A per-job breakdown table
- The trend chart over the selected date range
- Exporting the report

**Not covered here:** per-job, real-time candidate review and pipeline management (Workflow PRD); per-job lifetime snapshot stats shown on job cards (Dashboard PRD).

## 3. Product Goals

### 3.1 Business Goals
- Give hiring teams visibility into pipeline health and trends over time, not just a current snapshot.
- Support easy sharing of hiring progress and further analysis by others.

### 3.2 User Experience Goals
- Switching between "the whole company" and a specific job's numbers should be quick and simple.
- A hiring team should be able to see, at a glance, how their pipeline is trending over a chosen period.
- Exporting a report should require minimal effort and should genuinely reflect real hiring activity.

### 3.3 Security Goals
- Report data must always be scoped strictly to the company viewing it.

### 3.4 Compliance Goals
- This module deals in aggregate, count-level data rather than individual candidate identities, which keeps its privacy footprint lower than the Workflow module — this should remain true as the module evolves.
- Support GDPR, ISO/IEC 27001, SOC 2, and California privacy law (CCPA/CPRA) as general practice, even though the direct risk here is lower than in modules handling individual candidate data.

This PRD supports these compliance goals; it does not by itself grant any certification. Formal Legal/Compliance sign-off is required (see Section 16).

## 4. Actors / Users

**Primary Users**
- **Hiring Team Member / Recruiter / Admin** — views company-wide or per-job hiring trends and exports reports.

**Supporting Services**
- Candidate/pipeline reporting data service (currently returning fixed example numbers, not real data — see Section 12)
- Job data service (to populate the list of jobs available to report on)

## 5. Global Requirements

### 5.1 Security Requirements
- Report data must only ever reflect the viewing user's own company.

### 5.2 Privacy & Compliance Requirements
- This module should continue to show only aggregate counts by stage, not individual candidate details.

### 5.3 Validation Standards
- Date range selections should always produce a report that accurately reflects exactly the period requested.

### 5.4 Logging Requirements
At minimum, we should be able to see a record of: report viewed (with the report type and date range selected), and report exported.

## 6. Shared Experience Standards
- Works well on both desktop and mobile.
- Loading states are clearly shown while report data and job lists are being fetched.
- A genuine "nothing to show for this period" message should appear when there's truly no data, and a distinct error message should appear if the report fails to load — the two should never look the same.
- Fully usable by keyboard and screen reader, with accessible labels and sufficient color contrast throughout, including on the chart.

## 7. User Stories & Requirements

### 7.1 Choosing What to Report On

**User Story:** As a hiring team member, I want to see either our overall hiring activity or dig into a specific job.

**How it should work:** A dropdown lets a user choose to see the whole company's activity, or filter down to any individual job by name.

**Acceptance Criteria:** Switching between overall and job-specific views accurately updates every part of the report to match the selected scope, using real numbers for that scope.

---

### 7.2 Selecting a Date Range

**User Story:** As a hiring team member, I want to see hiring activity over a specific time window.

**How it should work:** A dropdown should offer a useful set of preset ranges, and ideally the option to pick a fully custom start and end date for teams that want to look at a specific window, like a particular hiring push.

**Acceptance Criteria:** Selecting any range accurately updates the report to reflect exactly that period, using real activity data.

**Worth flagging:** the set of available presets has actually gotten smaller in this rebuild compared to the old product — it currently offers fewer choices than before, with no way to pick a custom range at all. Product should confirm whether the reduced preset list is intentional or should be expanded back out (see Section 12).

---

### 7.3 Summary Stat Cards

**User Story:** As a hiring team member, I want a quick, at-a-glance summary of candidate counts.

**How it should work:** A row of cards should show the total number of candidates, followed by a count for each pipeline stage, genuinely reflecting the selected scope and date range.

**Acceptance Criteria:** Every stat card accurately reflects the selected report scope and date range, using real numbers.

**Worth flagging:** each card today shows a small percentage change indicator, but that number is currently fixed and doesn't actually change no matter what scope or date range is selected — it isn't a real comparison to a previous period yet, just decoration that looks like one. This should either be connected to a genuine period-over-period comparison or removed so it doesn't suggest something that isn't true (see Section 12).

---

### 7.4 Per-Job Breakdown

**User Story:** As a hiring team member, I want to see how each individual job is performing, not just the company total.

**How it should work:** A table below the chart should list every job with its invited count, responded count, response rate, and hired count.

**Acceptance Criteria:** The breakdown table accurately reflects each job's real numbers for the selected date range.

This is a genuinely new addition compared to the old product and a good one — worth keeping and building out properly once the underlying numbers are real.

---

### 7.5 Trend Chart

**User Story:** As a hiring team member, I want to see how candidate activity has changed over the selected period, not just a single total.

**How it should work:** A chart should plot candidate activity over the selected date range, with a clear hover detail. If there's genuinely no data for a selected scope and range, the chart area should say so clearly rather than simply not appearing.

**Acceptance Criteria:** The chart accurately reflects real trends over the selected period and scope; a lack of data is clearly explained rather than just leaving an empty gap.

**Worth flagging:** the chart's earlier ability to zoom into a portion of the timeline seems to have been dropped in this rebuild — worth confirming with Product whether that's intentional.

---

### 7.6 Exporting the Report

**User Story:** As a hiring team member, I want to save the underlying numbers for further use or to share with others.

**How it should work:** An export action should save the report's real numbers — the stat cards, the per-job breakdown, and the trend data — as a file someone could open and work with further.

**Acceptance Criteria:** The exported file accurately reflects the real numbers behind exactly what was on screen at the time of export.

**A genuine improvement worth highlighting:** exporting now produces a real spreadsheet of the underlying numbers, rather than the old picture-style export of just what happened to be on screen. This is a meaningful step forward for anyone who wants to actually analyze the data afterward, and should be kept. That said, it does mean there's currently no way to produce a polished, presentation-style version of the report to hand to a stakeholder who just wants to see it, not work with it — worth checking with Product whether both kinds of export are needed, or whether the spreadsheet alone covers the real need (see Section 12).

## 8. Shared Error Message Principles
- Help the user recover — never dead-end them.
- Never expose internal/technical error details in a user-facing message.
- Clearly distinguish "there's genuinely no data for this range" from "something failed to load."

## 9. Non-Functional Requirements

**Security:** Report data strictly scoped to the viewing company.

**Performance:** Switching report scope or date range should feel fast.

**Reliability:** A failed report load should never look identical to "there's no data."

**Accessibility:** Full keyboard navigation, screen-reader support, and accessible color contrast throughout, including on the chart and its interactive elements.

**Auditability:** Report views and exports should be traceable to who accessed them and when.

## 10. Assumptions & Constraints
- Reports are meant to be built from the same underlying candidate and pipeline-stage data used elsewhere in the product, with date-range filtering, company-wide aggregation, and trend visualization added on top — today, this connection doesn't exist yet, and the module runs on its own fixed example data instead (see Section 12).
- Whether jobs and their reporting numbers should be scoped by workspace, in addition to by company, is an open question shared with the Dashboard and Candidates modules.

## 11. Dependencies
- Candidate/pipeline reporting data service
- Job data service

## 12. Known Gaps & Risks

These are things the current implementation doesn't fully live up to, relative to the goals in Section 3.

1. **Every number on this page is currently generated from a fixed formula rather than calculated from the company's real jobs and candidates.** Changing the date range or selected job does change what's shown, but the underlying activity being described isn't real. This needs to be connected to the company's actual pipeline data before this module can be trusted for real decisions.
2. **The percentage-change indicators shown on each stat card are fixed numbers that never actually change**, regardless of what's selected — they currently just look like a real period-over-period comparison without being one. This should either become a genuine comparison or be removed.
3. **The available date-range choices have gotten narrower in this rebuild**, and there's still no way to pick a fully custom start and end date. Worth deciding whether to restore a wider set of presets, add a custom range option, or both.
4. **There's no explicit "nothing to show for this period" message if a selected scope and range genuinely has no data** — nothing currently tests or guards against this because the underlying mock data can't produce an empty result, but there's also no UI built for it, so this would need attention once real data is connected.
5. **There's no distinct error message if the report fails to load** — right now, a failure quietly leaves the whole page blank behind a brief, disappearing notification, which could easily be mistaken for the page being broken rather than something going wrong.
6. **This report page still isn't restricted by the company's subscription plan**, unlike other analytics- and export-related features elsewhere in the product. Worth confirming with Product whether broad access here is intentional or should be tiered like other features.
7. **The chart's earlier ability to zoom into a specific part of the timeline appears to have been dropped.** Worth confirming whether that's intentional.
8. **There's currently no way to produce a polished, presentation-style export** — since the export changed to a raw spreadsheet, the ability to share a clean, visual version of the report (for someone who just wants to look at it, not analyze it) has been lost. Worth checking whether that's still needed alongside the new spreadsheet export.

## 13. Open Questions
- What's the priority and timeline for connecting this module to the company's real jobs and candidates data?
- Should the percentage-change indicators be built into a genuine period-over-period comparison, or removed until they can be?
- Should the date-range presets be expanded back out, and should a custom date range be added?
- Should access to this report page be tied to the company's subscription plan, consistent with other analytics/export features?
- Is a polished, presentation-style export still needed alongside the new spreadsheet export?

## 14. Out of Scope
Not included in this version: per-job candidate review and pipeline management (Workflow PRD); per-job lifetime snapshot stats on job cards (Dashboard PRD).

## 15. Analytics Events
We should be tracking: report viewed (scope + date range), report scope changed, date range changed, report exported.

## 16. Definition of Done
This module is ready to consider complete when:
- Product has approved the requirements, including answers to the Open Questions in Section 13.
- Design has finalized the UX for a genuine "no data" state, a distinct error state, and any restored date-range options.
- Engineering has connected this module to the company's real jobs and candidates data, and either built a genuine period-over-period comparison or removed the current placeholder indicators.
- QA has test cases covering every flow in Section 7, including edge cases around empty data and failed loads, run against real data once it's connected.
- Security has confirmed report data remains strictly scoped per company.
- Product, Design, Engineering, QA, and Security have all signed off.
