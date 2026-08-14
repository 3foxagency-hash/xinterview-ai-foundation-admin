# API Inventory

> Two sections: (1) every API endpoint actively called in the codebase, (2) every apiprovider function that is defined but never imported or called anywhere.
> Verified by grepping all `src/apiprovider/` exports against all pages, views, and components.
> "Inline" = called directly with axios/api/baseAPI, no apiprovider wrapper.

---

## Section 1 — APIs in Use

### Authentication & Registration

1. `POST /login/register`
2. `POST /login/reset-password/email/`
3. `POST /login/reset-password/{token}/`
4. `POST /login/rest-password/otp/` ⚠️ typo — `rest` should be `reset`
5. `POST /login/otp-email-verification`
6. `POST /login/verification-email`
7. `POST /login/join-invited-company/{companyId}/`
8. `GET  /login/timezones/`
9. `GET  /login/countries/` — inline, `PermissionsPage.tsx`
10. `GET  /login/permission/{companyId}/can_create_job/`
11. `GET  /login/permission/{companyId}/can_add_member/`
12. `POST /api/token/refresh/` — axios interceptor, no apiprovider wrapper

### User

13. `GET   /user-management/`
14. `PATCH /user-management/`
15. `GET   /user-management/companies`

### Company Account

16. `GET    /login/company/{companyId}`
17. `PUT    /user-management/company/{companyId}`
18. `GET    /user-management/company/members/{companyId}`
19. `POST   /user-management/company/members/{companyId}`
20. `DELETE /user-management/company/member/{companyId}/{memberId}`
21. `GET    /user-management/company/subscription/{companyId}`
22. `GET    /user-management/customer/{companyId}/`
23. `POST   /user-management/avail-free-credits/{companyId}/`
24. `GET    /user-management/credit-records/{companyId}/`
25. `POST   /user-management/read-global-notification/`
26. `POST   /user-management/verify-cname-record/`
27. `POST   /user-management/update-trusted-origin/`
28. `DELETE /user-management/update-trusted-origin/{companyId}`
29. `POST   /user-management/verify-txt-record/{companyId}/`

### Customisation (Landing Pages)

30. `GET   /user-management/landing-page/{companyId}/`
31. `PATCH /user-management/landing-page/{companyId}/`
32. `GET   /jobs/landing-page/{jobId}/`
33. `PATCH /jobs/landing-page/{jobId}/`

### Workflow Stages

34. `GET    /jobs/company-workflow/{companyId}/`
35. `POST   /jobs/company-workflow/{companyId}/`
36. `PATCH  /jobs/company-workflow/{companyId}/{stageId}/`
37. `DELETE /jobs/company-workflow/{companyId}/{stageId}/`
38. `PATCH  /jobs/company/{companyId}/reorder-stages/`
39. `GET    /jobs/job-workflow/{jobId}/`
40. `POST   /jobs/job-workflow/{jobId}/`
41. `PATCH  /jobs/job-workflow/{jobId}/{stageId}/`
42. `DELETE /jobs/job-workflow/{jobId}/{stageId}/`
43. `PATCH  /jobs/job/{jobId}/reorder-stages/`
44. `GET    /jobs/job/{companyId}/unique-stages/`

### Jobs

45. `POST   /jobs/`
46. `GET    /jobs/job/{uuid}/`
47. `PATCH  /jobs/job/{uuid}/`
48. `DELETE /jobs/job/{id}/`
49. `POST   /jobs/clone/{jobId}/`
50. `GET    /jobs/active/`
51. `GET    /jobs/archived/`
52. `POST   /jobs/archived/`
53. `GET    /jobs/active-jobs-workflow/`
54. `GET    /jobs/options-for-career-page/`
55. `GET    /jobs/dynamic-info/{job_id}/`

### Job Questions

56. `GET    /jobs/question/?job_id=`
57. `POST   /jobs/question/`
58. `PATCH  /jobs/question/{questionId}/`
59. `DELETE /jobs/question/{questionId}/`
60. `POST   /jobs/bulk-question-create/`
61. `GET    /jobs/question-templates`
62. `POST   /jobs/question-templates`
63. `PUT    /jobs/question-template/{id}/`
64. `DELETE /jobs/question-template/{id}/`
65. `PUT    /jobs/question-temp/{companyId}/{questionId}/`
66. `DELETE /jobs/question-temp/{companyId}/{questionId}/`

### Job Team

67. `GET   /jobs/team/{jobId}/`
68. `GET   /jobs/team/{jobId}/available/`
69. `PATCH /jobs/team/{jobId}/`
70. `PUT   /jobs/team/{jobId}/`
71. `PATCH /jobs/noify-members-on-complete/{jobId}/` ⚠️ typo — `noify` should be `notify`

### AI Config

72. `GET   /jobs/job-ai-config/{jobId}/`
73. `POST  /jobs/job-ai-config/`
74. `PATCH /jobs/job-ai-config/{jobId}/`
75. `GET   /jobs/ai-evaluation-setup/{jobId}/`
76. `PATCH /jobs/ai-evaluation-setup/{jobId}/`

### AI Evaluation Factors

77. `GET    /jobs/jobs/{jobId}/factors/`
78. `POST   /jobs/jobs/{jobId}/factors/`
79. `DELETE /jobs/jobs/{jobId}/factors/{factorId}/`
80. `PATCH  /jobs/manage-factors-questions/`
81. `POST   /user-management/generate-factor-evaluation/`
82. `POST   /user-management/generate-questions/`
83. `POST   /user-management/generate-description/`
84. `GET    /user-management/job-titles/`

### Candidates (Workflow & Dashboard)

85. `GET    /candidates/`
86. `GET    /candidates/{candidate_id}/answers/`
87. `POST   /candidates/`
88. `POST   /candidates/direct-invite/`
89. `POST   /candidates/bulk-upload/{jobId}/`
90. `DELETE /candidates/{id}/`
91. `PATCH  /candidates/{id}/`
92. `PATCH  /candidates/stages/{id}/`
93. `PATCH  /candidates/stages/bulk/`
94. `DELETE /candidates/candidates/{ids}`
95. `POST   /candidates/resend-email/`
96. `POST   /candidates/extend-deadline/`
97. `POST   /candidates/overall_rating/{candidateId}`
98. `GET    /candidates/eval/{candidate_id}/`
99. `GET    /candidates/comments/`
100. `POST   /candidates/comments/`
101. `PUT    /candidates/candidates/{id}/comments/{commentId}/`
102. `DELETE /candidates/candidates/{id}/comments/{commentId}`
103. `PATCH  /candidates/candidates/{id}/evaluations/{evaluationId}/`
104. `DELETE /candidates/candidates/{id}/evaluations/{evaluationId}/`
105. `GET    /candidates/guest-comment/{candidate_id}/`
106. `POST   /candidates/guest-comment/{candidate_id}/`
107. `GET    /candidates/pool/{companyId}/`
108. `GET    /candidates/report/{companyId}/`
109. `GET    /candidates/report_datewise/{companyId}/`
110. `GET    /candidates/timeline/{candidateId}/`
111. `POST   /candidates/manual_transcript/individual/{answerId}/`
112. `POST   /candidates/manual_transcript/{candidateId}/`
113. `POST   /candidates/mux-generate-static-rendition/{candidate_id}/`
114. `POST   /eval/candidate-ai-review/`
115. `POST   /eval/bulk-candidate-ai-review/`
116. `POST   /candidates/intiate-telephonic-interview/{token}/` ⚠️ typo — `intiate` should be `initiate`

### Candidates (Guest OTP / Share)

117. `POST /candidates/guest-otp`
118. `POST /candidates/out-verify`

### Interview (Public / Candidate-Facing)

119. `GET   /candidates/direct-link/{job_id}/` — inline, `pages/direct_invite/[job_id]/index.tsx`
120. `GET   /candidates/interview/{token}/`
121. `POST  /candidates/interview/{token}/`
122. `PATCH /candidates/interview/{token}/`
123. `GET   /candidates/v2/question/{token}`
124. `GET   /candidates/reduce-takes/{token}/`
125. `POST  /candidates/reduce-takes/{token}/`
126. `GET   /candidates/interview/answer/video/{token}/{questionId}/`
127. `POST  /candidates/interview/answer/video/{token}/{questionId}/`
128. `POST  /candidates/interview/answer/audio/{token}/{questionId}/`
129. `POST  /candidates/interview/answer/text/{token}/{questionId}/`
130. `POST  /candidates/interview/answer/mcq/{token}/{questionId}/`
131. `POST  /candidates/livekit-token/{token}/`
132. `POST  /candidates/store-transcript/{token}/`
133. `POST  /candidates/error-message-log/{token}/`
134. `PATCH /candidates/tab-switch/{token}/` — inline, `VideoAvatarInterview2.tsx`, `MobileAvatarInterview.tsx` — no apiprovider wrapper

### Career Page

135. `GET   /career/career_page/{uuid}/jobs/`
136. `PUT   /career/career_page/{uuid}/`

### Email Templates

137. `GET    /user-management/templates/email/{companyId}`
138. `PATCH  /user-management/template/email/{emailTempId}`
139. `DELETE /user-management/template/email/{emailTempId}`

### SMS Config & Templates

140. `GET    /user-management/sms-configuration/{companyId}/list/`
141. `POST   /user-management/sms-configuration/create/`
142. `PATCH  /user-management/sms-configuration/{id}/`
143. `DELETE /user-management/sms-configuration/{id}/`
144. `GET    /user-management/templates/sms/{companyId}`
145. `PATCH  /user-management/template/sms/{tempId}`

### SMTP

146. `POST   /user-management/smtp-settings/create/{company}/`
147. `POST   /user-management/smtp-settings/{companyId}/verify/`
148. `PATCH  /user-management/smtp-settings/{company}/`
149. `GET    /user-management/smtp-settings/{company_id}/`
150. `DELETE /user-management/smtp-settings/{company_id}/`
151. `POST   /user-management/smtp-settings/mailersend/{company}/`

### Telephone Config

152. `GET    /user-management/telephone-config/`
153. `POST   /user-management/telephone-config/`
154. `PATCH  /user-management/telephone-config/{id}/`
155. `DELETE /user-management/telephone-config/{id}/`

### Video Store

156. `GET    /user-management/company-video-store/{companyId}/`
157. `POST   /user-management/company-video-store/{companyId}/`
158. `DELETE /user-management/company-video-store/{companyId}/`

### Social & API Keys

159. `GET    /social/google/auth/redirect/`
160. `GET    /social/teams/auth/redirect/`
161. `GET    /social/keys/`
162. `POST   /social/generate/api-key/{companyId}/`
163. `DELETE /social/generate/api-key/{companyId}/{name}/`

### Live Interviews (Meetings)

164. `GET    /social/live-interviews/`
165. `POST   /social/zoom-meetings/`
166. `PATCH  /social/zoom-meeting/{id}/`
167. `DELETE /social/zoom-meeting/{id}/`
168. `POST   /social/google/meetings/`
169. `PATCH  /social/google/meeting/{id}/`
170. `DELETE /social/google/meeting/{id}/`
171. `POST   /social/teams/meetings/`
172. `PATCH  /social/teams/meetings/{id}/`
173. `DELETE /social/teams/meetings/{id}/`

### Billing

174. `GET   /user-management/company/billing-address/{companyId}`
175. `POST  /user-management/company/billing-address/{companyId}`
176. `PATCH /user-management/company/billing-address/{companyId}/{userId}`
177. `GET   /user-management/company/billings/{companyId}`
178. `GET   /user-management/company/billings/{companyId}/{billingsId}`
179. `POST  /user-management/coupons/{companyId}/`
180. `POST  /payments/stripe/checkout/`
181. `POST  /payments/subscription/cancel/`
182. `POST  /payments/stripe/checkout-credits/`

### External / Third-Party

183. `GET  https://ipinfo.io/?token=165af6df957429` — inline, `GuestPagelogin.tsx`, `GuestinfoPreview.tsx`, `InterviewForm.tsx` (candidate geolocation)
184. `GET  https://api.mailcheck.ai/email/{email}` — email validation on registration
185. `POST https://api.partnero.com/v1/customers` — affiliate tracking

---

## Section 2 — Defined in Code but Never Called

These functions exist in `src/apiprovider/` but are never imported or called anywhere in the codebase. The endpoint they wrap is effectively dead from the frontend's perspective.

1. `List_company_members` (`Job/Job.ts`) — `GET /user-management/company/members/{company_id}` — a duplicate of `fetchCompanyMembers` in `accounts/company.ts` which IS used
2. `List_job_questions` (`Job/Job.ts`) — `GET /jobs/question/?job_id=` — duplicate of `retrieveJobQuestions` in `Job/edit.ts` which IS used
3. `deleteAIInterviewConfig` (`Job/aiConfig.ts`) — `DELETE /jobs/job-ai-config/{jobId}/`
4. `updateJobQuestionInclusion` (`Job/edit.ts`) — `PATCH /jobs/ai-include-questions/{jobId}/`
5. `updateJobFactor` (`Job/factors.ts`) — `PATCH /jobs/jobs/{jobId}/factors/{factorId}/`
6. `listJobs` (`Job/workflow.ts`) — `GET /jobs/active/` — duplicate of `activeJobs` in `dashboard/jobs_view.ts` which IS used
7. `generateVideoTranscript` (`Job/workflow.ts`) — `GET /candidates/answers/{answerId}/transcript/` — the apiprovider function is unused; verify if this endpoint is reached via another path
8. `updateCompanyMembers` (`accounts/company.ts`) — `PUT /user-management/company/members/{companyId}/{memberId}`
9. `createEmailTemplate` (`accounts/templates.ts`) — `POST /user-management/templates/email/{companyId}`
10. `getUser` (`accounts/user.ts`) — `GET /user-management/` — duplicate of `localStorageUpdate` in `authentication/authentication.ts` which IS used
11. `fetchMetaData` (`authentication/authentication.ts`) — `GET /candidates/landing/{job_id}`
12. `teamJoinAuthentication` (`authentication/authentication.ts`) — `POST /user-management/company/members/{companyId}` — duplicate of `addCompanyMembers` in `accounts/company.ts` which IS used
13. `getTelephoneConfigById` (`authentication/telephoneConfig.ts`) — `GET /user-management/telephone-config/{id}/`
14. `updateVideoStore` (`authentication/videoStore.ts`) — `PATCH /user-management/company-video-store/{companyId}/`
15. `getSmsConfig` (`accounts/smsConfig.ts`) — `GET /user-management/sms-configuration/{companyId}/{id}/`
16. `activeJobsReport` (`dashboard/jobs_view.ts`) — `GET {paginatedUrl}` (jobs pagination variant)
17. `fetchMoreCareerJobs` (`career/index.tsx`) — `GET {paginatedUrl}` (career jobs pagination) — function is imported but the call site is commented out
18. `verifyEmail` (`interview/candidates.js`) — `POST /candidates/verify-candidate-otp` — OTP verification during interview
19. `sendOTP` (`interview/candidates.js`) — `GET /candidates/verify-candidate-otp?candidate_id=` — send OTP during interview
20. `createBunnySpace` (`interview/candidates.js`) — `POST /candidates/create-bunny-space/{token}/`

---

## Notes

- **#1, #2, #6, #10, #12** are duplicate wrappers for endpoints that ARE called via a different function — the endpoint itself is active, just the specific function is dead code.
- **#18 and #19** (`verifyEmail` / `sendOTP` in the interview flow) — the OTP email verification step during interview is defined in apiprovider but the interview page never calls it. Either the feature is incomplete or was removed.
- **#7** (`generateVideoTranscript`) — the `GET /candidates/answers/{answerId}/transcript/` endpoint is documented as used in the workflow page. The apiprovider function is unused but the endpoint may be reached via a renamed or inline call. Verify before removing the backend endpoint.
- **`GET /cards/statistics`** — called inline in `SettingTeam.tsx` (appears to be leftover boilerplate/mock data, not a real backend endpoint).
- **`GET/POST /apps/users/*`** — in `property-listing/dummy-store/index.ts`, these are mock fixture calls, not real backend endpoints.
