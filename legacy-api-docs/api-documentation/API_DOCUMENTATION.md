# API Documentation

> Generated from codebase analysis of the xInterview frontend (Next.js + TypeScript).
> Last updated: 2026-06-27

---

## Summary Table

| Domain | Count | Auth Required |
|--------|-------|---------------|
| Authentication & Registration | 14 | Mixed |
| User Management | 6 | Yes |
| Company & Team | 10 | Yes |
| Subscription & Billing | 8 | Yes |
| Jobs | 16 | Yes |
| AI Config & Evaluation | 8 | Yes |
| Candidates (Dashboard) | 17 | Yes |
| Interview (Public/Candidate-facing) | 14 | No |
| Live Interviews (Meetings) | 8 | Yes |
| Career Page | 5 | Mixed |
| SMTP & Email Templates | 7 | Yes |
| SMS Config & Templates | 6 | Yes |
| Video Store | 4 | Yes |
| Telephone Config | 5 | Yes |
| Social & API Keys | 5 | Yes |
| Payments | 3 | Yes |
| Permissions | 2 | Yes |
| Reports | 3 | Yes |
| Internal Next.js API Routes | 7 | Server-side |
| Third-party Direct (browser) | 3 | API key |
| **Total** | **161** | |

---

## API Client Architecture

### Primary HTTP Client (`src/apiprovider/baseApi.ts`)

Two Axios instances are exported:

| Export | Auth | Purpose |
|--------|------|---------|
| `api` (default) | Bearer token from `localStorage.accessToken` | All authenticated calls |
| `baseAPI` | None | Public/candidate-facing calls (no token) |

**Token Lifecycle:**
1. On login, `access_token` and `refresh_token` are stored in `localStorage`.
2. On every authenticated request, the `api` request interceptor reads `localStorage.accessToken` and injects `Authorization: Bearer <token>`.
3. On HTTP 401, the response interceptor calls `POST /api/token/refresh/` with the stored refresh token.
4. After a successful refresh, it calls `POST /login/update_last_seen` or `POST /login/create_last_seen` to sync the `last_seen_monitor` value, then retries the original request.
5. If refresh fails (400/404), all localStorage keys are cleared and the browser is redirected to `/login`.

**Base URL:** `process.env.NEXT_PUBLIC_BASE_URL`

```ts
// Request interceptor (api only)
config.headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`

// Response interceptor: 204 → resolved; string body → JSON.parse; 401 → refresh flow
```

**Key Issue:** The 401 response interceptor fires side-effect calls (`update_last_seen` / `create_last_seen`) inline during token refresh. If these side calls fail with 400 or 404 they clear localStorage and redirect. This makes authentication state dependent on a monitoring endpoint — a crash there will log users out.

---

## Authentication Flow

```
Register / Login
  └─ POST /login/register (or /login/tokens)
       └─ Tokens stored in localStorage
  └─ GET /user-management/ (me endpoint)
       └─ If not verified → redirect /verify-email
       └─ If no company → redirect /register/company/
       └─ Else → redirect /dashboard

Token Refresh (transparent, via interceptor)
  └─ POST /api/token/refresh/
       └─ POST /login/update_last_seen (or /login/create_last_seen)
       └─ Retry original request

Logout
  └─ Clear localStorage + sessionStorage
  └─ Redirect /login
```

**Auth Config file:** `src/configs/auth.ts`
- `loginEndpoint`: `${baseUrl}/login/tokens`
- `meEndpoint`: `${baseUrl}/user-management/`
- `storageTokenKeyName`: `accessToken`
- `onTokenExpiration`: `refreshToken`

---

## Endpoints by Domain

---

### Authentication

---

#### POST /login/tokens

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (uses bare `axios`, not `api`) |
| Called From | `src/context/AuthContext.tsx` (handleLogin) |

**Request Body**
```ts
{ email: string; password: string; rememberMe?: boolean }
```

**Response**
```ts
{ access_token: string; refresh_token: string; last_seen_monitor?: string }
```

**Used Fields:** `access_token`, `refresh_token`, `last_seen_monitor`

---

#### POST /api/token/refresh/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No |
| Called From | `src/apiprovider/baseApi.ts` (response interceptor) |

**Request Body**
```ts
{ refresh: string }  // value from localStorage.refreshToken
```

**Response**
```ts
{ access: string }  // new access token
```

**Used Fields:** `access`

---

#### POST /login/register

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`registerUser`) |
| Query Params | `invite_id` (optional — team invite flow) |

**Request Body**
```ts
{ first_name: string; last_name: string; email: string; password: string }
```

**Response**
```ts
{ access_token: string; refresh_token: string; last_seen_monitor?: string; email: string; user_id?: string; id?: string }
```

**Used Fields:** `access_token`, `refresh_token`, `last_seen_monitor`, `email`
**Unused Fields:** `user_id` / `id` — only used to derive a key for localStorage `pendingPartneroData`; could be omitted if the Partnero flow is moved server-side.

---

#### POST /login/reset-password/email/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`verifyEmail`) |

**Request Body**
```ts
{ email: string }
```

---

#### POST /login/reset-password/{token}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`resetPassword`) |

**Request Body**
```ts
{ password: string; re_password: string }
```

---

#### POST /login/rest-password/otp/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`verifyOTP`) |
| Note | URL typo: `rest-password` should be `reset-password` |

**Request Body**
```ts
{ otp: string; email: string }
```

---

#### POST /login/otp-email-verification

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`verifyEmailOTP`) |

**Request Body**
```ts
{ otp: string }
```

---

#### POST /login/verification-email

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`sendVerificationEmail`) |

**Request Body:** `{}`

---

#### POST /login/join-invited-company/{companyId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`joinInvitedCompany`) |

**Request Body**
```ts
{ role: string }
```

---

#### POST /login/update_last_seen

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Bearer token passed explicitly (not interceptor) |
| Called From | `src/apiprovider/baseApi.ts` (token refresh interceptor side-effect) |

**Request Body**
```ts
{ last_seen_monitor: string }
```

**Response**
```ts
{ last_seen_monitor: string }
```

---

#### POST /login/create_last_seen

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Bearer token passed explicitly |
| Called From | `src/apiprovider/baseApi.ts` (token refresh interceptor side-effect) |

**Request Body:** `{}`

**Response**
```ts
{ last_seen_monitor: string }
```

---

#### GET /login/company/{companyId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`fetchCompanies`), `src/apiprovider/career/index.tsx` (`fetchUUID`) |

**Path Params:** `companyId` (number)

**Response:** Company object including `uuid`, `domain_name`, and related fields.

---

#### GET /login/timezones/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`List_timezones`) |

**Response:** Array of timezone strings.

---

#### GET /login/permission/{companyId}/can_create_job/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/permission/api.ts` (`canCreateJob`) |

---

#### GET /login/permission/{companyId}/can_add_member/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/permission/api.ts` (`canAddMember`) |

---

### User Management

---

#### GET /user-management/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (token may be passed explicitly on initial load) |
| Called From | `src/context/AuthContext.tsx`, `src/configs/auth.ts` (`meEndpoint`) |

**Response (UserDataType)**
```ts
{
  email: string
  first_name: string
  last_name: string
  is_verified: boolean
  company_created: boolean
  admin_companies: { subscription_date: string; ... }[]
  language: string
}
```

**Used Fields:** `is_verified`, `company_created`, `email`, `language`, `admin_companies.subscription_date` (Intercom)

---

#### PATCH /user-management/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/user.ts` (`updateUser`, `languageUpdate`) |

**Request Body:** FormData (profile update) or `{ language: string }` (language update)

---

#### GET /user-management/companies

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`getCompanyId`), `src/apiprovider/Job/Job.ts` (`Fetch_company`) |

**Response:** Array of company objects.

---

#### GET /user-management/job-titles/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`fetchJobTitles`) |

---

#### POST /user-management/verify-cname-record/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`DNSVerification`) |

**Request Body**
```ts
{ domain: string }
```

---

#### POST /user-management/update-trusted-origin/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`trustedoriginadded`) |

**Request Body**
```ts
{ domain: string }
```

---

#### DELETE /user-management/update-trusted-origin/{companyId}

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`deleteDsaDomain`) |

---

#### POST /user-management/verify-txt-record/{companyId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`verifyTXT`) |

---

### Company & Team

---

#### GET /user-management/company/{companyId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | (via `fetchCompanies` in `src/apiprovider/accounts/company.ts`) |

---

#### PUT /user-management/company/{companyId}

| Field | Value |
|-------|-------|
| Method | PUT |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`updateCompany`) |

**Request Body:** `multipart/form-data` company profile fields.

---

#### GET /user-management/company/members/{companyId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`fetchCompanyMembers`), `src/apiprovider/Job/Job.ts` (`List_company_members`) |

---

#### POST /user-management/company/members/{companyId}

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`addCompanyMembers`), `src/apiprovider/authentication/authentication.ts` (`teamJoinAuthentication`) |

**Request Body:** member data object (email, role, etc.)

---

#### PUT /user-management/company/members/{companyId}/{memberId}

| Field | Value |
|-------|-------|
| Method | PUT |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`updateCompanyMembers`) |

---

#### DELETE /user-management/company/member/{companyId}/{memberId}

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`removeCompanyMembers`) |

---

#### GET /user-management/company/subscription/{companyId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`fetchSubscription`), `src/pages/dashboard/index.tsx`, `src/pages/trail-over/index.tsx` |

**Response (TSubscription)**
```ts
{
  id: string
  plan: {
    id: number; uuid: string; title: string; number_of_users: number
    number_of_jobs: number; number_of_companies: number; number_of_candidates: number
    number_of_days: number; sharing: boolean; transcript: boolean
    answer_retention_days: number; cost: number; usd_price: number; currency: string
    paypal: null; stripe: { price_id: { annual: string; monthly: string }; product_id: string }
    multiple_jobtype_allowed: boolean; white_label?: boolean; smtp_allowed?: boolean
    automatic_transcript?: boolean; telephonic_interview_allowed?: boolean; zapier_allowed?: boolean
  }
  total_jobs_created: number; total_candidate_interviewed: number; total_team_members: number
  order_id: null | string; subscription_date: string; auto_bill: boolean
  is_activate: boolean; expiration_date: string; stripe_id: null | string
  company: number; domain_name: string | null; ai_feature_enabled: boolean; beta_user: boolean
  org_credits?: number; credits?: Array<{ used_credit: number; max_allowed: number }>
}
```

**Used Fields:**
- `is_activate` — Auth guard, account-terminated page
- `plan.multiple_jobtype_allowed` — Job type selector gate
- `plan.smtp_allowed` — Email settings gate
- `plan.white_label` — Branding options gate
- `plan.transcript` — Transcript feature gate
- `plan.automatic_transcript` — Auto-transcript feature gate
- `plan.telephonic_interview_allowed` — Telephone interview gate
- `plan.zapier_allowed` — Zapier integration gate
- `plan.number_of_users`, `number_of_jobs`, `number_of_candidates` — Limit displays
- `ai_feature_enabled` — AI credits section visibility
- `org_credits`, `credits` — AI credit balance display
- `subscription_date`, `expiration_date` — Billing displays
- `domain_name` — CNAME configuration
- `beta_user` — Beta feature gating

**Potentially Unused Fields (in type but not traced in UI):**
- `plan.usd_price` — appears only in `invoiceTypes.ts`, not rendered
- `plan.paypal` — always `null`, no PayPal UI exists
- `plan.uuid` — shown only in admin `PreviewCard.tsx`, not in regular user UI
- `plan.number_of_companies` — in type only; no frontend renders this
- `auto_bill` — in type, not rendered anywhere in views
- `plan.stripe.price_id`, `plan.stripe.product_id` — backend concern, not displayed

---

#### POST /user-management/avail-free-credits/{companyId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`aiEnable`) |

**Purpose:** Enables AI free trial credits for a company.

---

#### GET /user-management/credit-records/{companyId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`fetchCreditRecords`) |

---

#### POST /user-management/read-global-notification/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`readGlobalNotification`) |

---

#### GET /user-management/customer/{companyId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/company.ts` (`fetchBillingURL`) |

**Response:** `{ url: string }` — Stripe billing portal URL.

**Used Fields:** `url` (redirected to directly)

---

### Subscription & Billing

---

#### GET /user-management/company/billing-address/{companyId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/billings.ts` (`getBillingAddress`) |

---

#### POST /user-management/company/billing-address/{companyId}

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/billings.ts` (`addCompanyAddress`) |

**Request Body:** Billing address fields (city, country, zip, etc.)

---

#### PATCH /user-management/company/billing-address/{companyId}/{userId}

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/billings.ts` (`updateCompanyAddress`) |

---

#### GET /user-management/company/billings/{companyId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/billings.ts` (`getBillingHistory`) |

---

#### GET /user-management/company/billings/{companyId}/{billingId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/billings.ts` (`getBillings`) |

---

#### POST /user-management/coupons/{companyId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/billings.ts` (`SubscriptionByCoupon`) |

**Request Body**
```ts
{ coupon_code: string }
```

**Response**
```ts
{ discount: number; flat_discount: number; plan_id: number[]; frequency: string; message: string }
```

---

#### POST /payments/stripe/checkout/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/checkout/api.ts` (`stripeCheckoutUrl`) |

**Request Body:** Stripe checkout data (plan_id, company_id, billing period, etc.)

**Response:** `{ url: string }` — Stripe Checkout session URL.

---

#### POST /payments/subscription/cancel/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/checkout/api.ts` (`cancelSubscription`) |

---

#### POST /payments/stripe/checkout-credits/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/checkout/api.ts` (`stripeCheckoutCredits`), `src/views/account/company/billings/CurrentPlanCard.tsx` |

**Request Body**
```ts
{ company_id: string | number; credit_package_id: 1 | 2 | 3 }
```

**Response:** `{ url: string }` — Stripe Checkout session URL for credit purchase.

---

### Jobs

---

#### POST /jobs/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`Create_job`) |

**Request Body:** Job creation payload (title, description, type, company, etc.)

---

#### GET /jobs/active/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`listJobs`), `src/apiprovider/dashboard/jobs_view.ts` (`activeJobs`) |

**Response (listJobsType[])**
```ts
{
  id: string; title: string; total_candidates: number; invited_candidates: number
  started_candidates: number; responded_candidates: number; workflow: TWorkflow
  response_percent: number; job_posted_at: string; job_expires_at: string
  status: string; created_by: string; type_of_interview?: string
}
```

**Used Fields:** All fields rendered in dashboard cards.

---

#### GET /jobs/active-jobs-workflow/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`listAllWorkflowJobs`) |

**Purpose:** Fetch jobs with workflow-specific data for the kanban/workflow view.

---

#### GET /jobs/job/{jobId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/edit.ts` (`retrieveJob`) |

**Response (TJob)**
```ts
{
  id: string; title: string; description: string; status: string; company: number
  language: string; cv_required: boolean; job_posted_at: string; job_expires_at: string
  workflow: string[]; type_of_interview?: string; welcome_video?: string
  thank_you_message?: string; welcome_message?: string; logo?: string
}
```

---

#### PATCH /jobs/job/{jobId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/edit.ts` (`editJob`), `src/apiprovider/career/index.tsx` (`updateCareerPageStatus`) |

---

#### DELETE /jobs/job/{jobId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/dashboard/jobs_view.ts` (`deletearchiveJob`) |

---

#### POST /jobs/clone/{jobId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/edit.ts` (`cloneJob`) |

---

#### POST /jobs/archived/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/dashboard/jobs_view.ts` (`archiveJob`) |

**Request Body**
```ts
{ job: string; status: string }
```

---

#### GET /jobs/archived/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/dashboard/jobs_view.ts` (`archiveJobList`) |

---

#### GET /jobs/question/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`List_job_questions`), `src/apiprovider/Job/edit.ts` (`retrieveJobQuestions`) |
| Query Params | `job_id` (string) |

---

#### POST /jobs/question/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`Create_job_question`) |

---

#### PATCH /jobs/question/{questionId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`updateJobQuestion`) |
| Query Params | `job_id` |
| Note | Strips `factors_of_ai_evaluation` and `ai_evaluation_done` before sending |

---

#### DELETE /jobs/question/{questionId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`deleteQuestion`) |
| Query Params | `job_id` |

---

#### POST /jobs/bulk-question-create/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`Create_bulk_job_questions`) |

**Request Body**
```ts
{ questions: Question[] }
```

---

#### GET /jobs/question-templates

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`List_question_templates`), `src/apiprovider/accounts/templates.ts` (`fetchQuestionTemplate`) |
| Query Params | `company_id` |

---

#### PUT /jobs/question-template/{id}/

| Field | Value |
|-------|-------|
| Method | PUT |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`updateQuestionTemplate`) |
| Query Params | `company_id` |

---

#### POST /jobs/question-templates

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`addQuestionTemplate`) |
| Query Params | `company_id` |

---

#### DELETE /jobs/question-template/{id}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`deleteQuestionTemplate`) |
| Query Params | `company_id` |

---

#### GET /jobs/team/{jobId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`Retrieve_job_team`) |

---

#### PATCH /jobs/team/{jobId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`Add_job_team_member`) |

---

#### PUT /jobs/team/{jobId}/

| Field | Value |
|-------|-------|
| Method | PUT |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`Remove_job_team_member`) |

---

#### GET /jobs/team/{jobId}/available/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/edit.ts` (`listAvailableMembers`) |

---

#### PATCH /jobs/noify-members-on-complete/{jobId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/team.ts` (`teamNotificationAdded`, `teamNotificationRemove`) |
| Note | URL has typo: `noify` should be `notify` |

**Request Body**
```ts
{ users_add?: string[] } | { users_remove?: string[] }
```

---

#### GET /jobs/dynamic-info/{jobId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | No (bare `axios`) |
| Called From | `src/apiprovider/Job/metadata.ts` (`metadatafetch`) |

**Note:** Uses raw `axios` (no auth), meaning this is a public metadata endpoint. This is intentional for SSR/metadata generation but is inconsistent with the rest of the API layer.

---

#### PATCH /jobs/ai-include-questions/{jobId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/edit.ts` (`updateJobQuestionInclusion`) |

**Request Body**
```ts
{ ai_include_questionIds: string[]; ai_exclude_questionIds: string[] }
```

---

#### GET /jobs/options-for-career-page/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/career/index.tsx` (`fetchAllJobs`) |

---

### AI Config & Evaluation

---

#### GET /jobs/job-ai-config/{jobId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/aiConfig.ts` (`getAIInterviewConfig`) |

**Response (AIInterviewConfig)**
```ts
{
  agent_name?: string; avatar_id?: string; voice_type?: string; voice_id?: string
  tone?: string; language?: string; introduction_script?: string; interview_duration?: number
}
```

---

#### POST /jobs/job-ai-config/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/aiConfig.ts` (`createAIInterviewConfig`, `createTelephoneInterviewConfig`) |

**Request Body**
```ts
{
  job: string | number
  agent_name?: string; avatar_id?: string; voice_type?: string; voice_id?: string
  tone?: string; language?: string; introduction_script?: string; interview_duration?: number
}
```

**Note:** `createTelephoneInterviewConfig` hardcodes defaults: `agent_name: 'John Doe'`, `voice_type: 'female'`, `voice_id: 'Aura 2 - Thalia (American, feminine)'`, `tone: 'Professional'`, `language: 'English'`. These should be configurable or stored as server defaults.

---

#### PATCH /jobs/job-ai-config/{jobId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/aiConfig.ts` (`updateAIInterviewConfig`) |

---

#### DELETE /jobs/job-ai-config/{jobId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/aiConfig.ts` (`deleteAIInterviewConfig`) |

---

#### GET /jobs/ai-evaluation-setup/{jobId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/aiConfig.ts` (`getAIEvaluationConfig`) |

**Response (AIEvaluationConfig)**
```ts
{
  id?: number; job_position?: string; job_level?: string; use_job_description?: boolean
  required_skills?: string[]; use_skills?: boolean; use_candidate_resume?: boolean
  difficulty_level?: string; experience_level?: string
  labeling_for_filtering_ai_rank?: Array<{ name: string; minScore: number; maxScore: number }> | null
  job?: string | number
}
```

---

#### PATCH /jobs/ai-evaluation-setup/{jobId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/aiConfig.ts` (`updateAIEvaluationConfig`) |

---

#### GET /jobs/jobs/{jobId}/factors/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/factors.ts` (`listJobFactors`) |

**Response:** `AIEvaluationFactor[]`

---

#### POST /jobs/jobs/{jobId}/factors/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/factors.ts` (`createJobFactor`) |
| Note | Hardcodes `min_score: 1`, `max_score: 5` on the frontend before sending |

**Request Body (AIEvaluationFactor)**
```ts
{
  title: string; description?: string; key_words?: string; colour?: string
  weightage: number; scoring_details?: string; ai_evaluation_config?: number
  min_score: number; max_score: number
}
```

---

#### PATCH /jobs/jobs/{jobId}/factors/{factorId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/factors.ts` (`updateJobFactor`) |

---

#### DELETE /jobs/jobs/{jobId}/factors/{factorId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/factors.ts` (`deleteJobFactor`) |

---

#### PATCH /jobs/manage-factors-questions/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/factors.ts` (`manageFactorQuestionLink`) |

**Request Body**
```ts
{
  question_factor_mapping: Array<{ question_id: string; factor_ids: Array<string | number> }>
}
```

---

#### POST /user-management/generate-factor-evaluation/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/factors.ts` (`generateFactorEvaluation`) |

**Request Body**
```ts
{ job_id: string }
```

**Response (GenerateFactorEvaluationResponse)**
```ts
{
  factors: Array<{
    title: string; description?: string; skills?: string[]; weightage: number
    scoring_rubric?: Record<string, string>; question_indices?: Array<string | number>
  }>
}
```

---

#### POST /user-management/generate-questions/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/edit.ts` (`generateQuestions`) |

**Request Body:** Job context data for AI question generation.

---

#### POST /user-management/generate-description/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/edit.ts` (`generateDescription`) |

**Request Body:** Job role context for AI description generation.

---

### Candidates (Dashboard / Recruiter View)

---

#### GET /candidates/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`listCandidates`, `fetchCandidateList`), `src/apiprovider/live-interview/api.ts` |
| Query Params | `job_id`, `workflow_stage`, `name`, `ai_rank_min`, `ai_rank_max` |

**Response:** Paginated list of `candidateListType[]` with `next`/`previous` pagination URLs.

**Used Fields:** `id`, `first_name`, `last_name`, `email`, `status`, `stage`, `overall_rating`, `ai_overall_rank`, `ai_review`, `joined_at`, `via`
**Unused Fields:** `ratings_count`, `total_rating` — present in type, not rendered in workflow views.

---

#### POST /candidates/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`Create_candidate`) |

**Request Body:** Candidate data (name, email, job_id, etc.)

---

#### PATCH /candidates/{candidateId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`updateCandidate`), `src/apiprovider/candidates/pool.ts` (`updateCandidate`) |
| Query Params | `job_id` |

**Request Body:** `multipart/form-data` (name, email, phone, CV file)

---

#### DELETE /candidates/{candidateId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`deleteCandidate`), `src/apiprovider/candidates/pool.ts` (`deleteCandidate`) |
| Query Params | `job_id` |

---

#### GET /candidates/{candidateId}/answers/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) for authenticated view; No (`baseAPI`) for guest view |
| Called From | `src/apiprovider/Job/workflow.ts` (`fetchCandidateProfile`, `fetchGuestCandidateProfile`) |

**Response:** Candidate with answers array, AI review data, evaluation scores.

---

#### POST /candidates/direct-invite/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`Direct_invite`) |

**Request Body:** Job ID and candidate details for direct invite.

---

#### POST /candidates/bulk-upload/{jobId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/Job.ts` (`Bulk_upload_candidate`) |

**Request Body:** `multipart/form-data` with a CSV/Excel file.

---

#### POST /candidates/resend-email/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`resendEmailCandidate`) |

**Request Body**
```ts
{ candidate_id: string }
```

---

#### POST /candidates/overall_rating/{candidateId}

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`addOverAllRating`), `src/views/job/workflow/ChatContent.tsx`, `src/views/job/workflow/Review.tsx`, `src/pages/share/AddReview.tsx` |

**Request Body**
```ts
{ rating: number; review: string }
```

**Response**
```ts
{ rating: number }
```

**Used Fields:** `rating`
**Unused Fields:** Any review fields beyond `rating` in the response are not consumed.

---

#### GET /candidates/comments/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`fetchComments`) |
| Query Params | `candidate_id` |

---

#### POST /candidates/comments/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`createComments`) |

---

#### PUT /candidates/candidates/{candidateId}/comments/{commentId}/

| Field | Value |
|-------|-------|
| Method | PUT |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`editCommentFunction`) |

**Request Body**
```ts
{ comment: string; author: string; candidate: string | number }
```

---

#### DELETE /candidates/candidates/{candidateId}/comments/{commentId}

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`deleteCommentFunction`) |

---

#### PATCH /candidates/candidates/{candidateId}/evaluations/{evaluationId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`editReviewFunction`) |

**Request Body**
```ts
{ stage: string; rating: number; review: string; candidate: string | number; evaluator: string }
```

---

#### DELETE /candidates/candidates/{candidateId}/evaluations/{evaluationId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`deleteReviewFunction`) |

---

#### PATCH /candidates/stages/{candidateId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`changeStage`, `disqualifyCandidate`) |

**Request Body**
```ts
{ workflow_stage: number }
```

---

#### PATCH /candidates/stages/bulk/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`bulkChangeStage`) |

**Request Body**
```ts
{ candidate_ids: string[]; workflow_stage: number }
```

---

#### POST /candidates/extend-deadline/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`extendDeadline`) |

**Request Body**
```ts
{ candidate_id: string; expiry_date: string }
```

---

#### GET /candidates/eval/{candidateId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`fetchEval`) |

**Purpose:** Fetch AI evaluation results for a candidate.

---

#### GET /candidates/answers/{answerId}/transcript/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`generateVideoTranscript`) |

---

#### POST /candidates/manual_transcript/individual/{answerId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`generateManualTranscript`) |

---

#### POST /candidates/manual_transcript/{candidateId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`generateManualTranscriptAll`) |

---

#### POST /eval/candidate-ai-review/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`generateCandidateAIReview`) |

**Request Body**
```ts
{ candidate_id: string; instruction_template: string }
```

---

#### POST /eval/bulk-candidate-ai-review/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`generateBulkCandidateAIReview`) |

**Request Body**
```ts
{ candidate_ids: string[] }
```

---

#### POST /candidates/mux-generate-static-rendition/{candidateId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`generateMuxStaticRenditions`) |

---

#### GET /candidates/guest-comment/{candidateId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`fetchGuestComments`) |

---

#### POST /candidates/guest-comment/{candidateId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/Job/workflow.ts` (`createGuestComments`) |

---

#### GET /candidates/pool/{companyId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/candidates/pool.ts` (`listAllCandidates`) |
| Query Params | `page`, `ordering`, `workflow_stage`, `job_title`, `name` |

---

#### GET /candidates/report/{companyId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/candidates/pool.ts` (`getCandidateReport`) |
| Query Params | `job_id`, `joined_at_after`, `joined_at_before` |

---

#### GET /candidates/report_datewise/{companyId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/candidates/pool.ts` (`getCandidateGraphReport`) |
| Query Params | `job_id`, `start_after`, `end_before` |

---

#### GET /candidates/timeline/{candidateId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/candidates/pool.ts` (`getCandidateTimeline`) |

**Response:** `{ timeline: TimelineItem[] }` — only `timeline` array is consumed (`.timeline ?? response.data`).

---

#### POST /candidates/intiate-telephonic-interview/{token}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/candidates/pool.ts` (`initiateTelephonicInterview`) |
| Note | URL typo: `intiate` should be `initiate` |

---

### Interview (Public / Candidate-Facing — no auth token required)

These use `baseAPI` (no bearer token) as candidates do not have accounts.

---

#### GET /candidates/interview/{token}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`fetchInterviewStatus`) |

**Response (guestCandidateInterview):** Full landing page config including branding, questions count, proctoring flags, AI interview type, video provider.

**Used Fields:** Nearly all fields are consumed — branding, intro/outro, requirements, proctoring flags (`full_screen`, `copy_paste`, `switch_tab`, `blur_effect`), AI type, `provider`.

---

#### POST /candidates/interview/{token}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`createCandidate`) |

**Request Body:** `multipart/form-data`
```ts
{
  first_name: string; last_name: string; email: string; phone_number?: string
  linkedin?: string; website?: string; job: string; location_info?: string; cv?: File
}
```

---

#### PATCH /candidates/interview/{token}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`updateCandidate`) |

**Request Body:** `multipart/form-data` (same fields, subset)

---

#### GET /candidates/v2/question/{token}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`fetchQuestions`) |

**Response:** Array of interview questions with metadata.

---

#### GET /candidates/reduce-takes/{token}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`handlefetchRetake`) |
| Query Params | `question_id` |

---

#### POST /candidates/reduce-takes/{token}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`handleupdateRetake`) |

**Request Body**
```ts
{ question_id: string }
```

---

#### POST /candidates/verify-candidate-otp

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`verifyEmail`) |

**Request Body**
```ts
{ otp: string; candidate_id: string }
```

---

#### GET /candidates/verify-candidate-otp

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`sendOTP`) |
| Query Params | `candidate_id` |

---

#### GET /candidates/interview/answer/video/{token}/{questionId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`getUploadDetails`) |

**Response**
```ts
{
  video_id: string; provider: 'mux' | 'bunny'; upload_url?: string  // Mux
  library_id?: string; signature_hash?: string; expiration_time?: string  // Bunny
}
```

**Used Fields:** All fields used to route upload to Mux or Bunny.

---

#### POST /candidates/interview/answer/video/{token}/{questionId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`confirmUpload`) |

**Request Body**
```ts
{ video_id: string; takes: number; video_length: number; tab_switch_count: number; provider: string }
```

---

#### POST /candidates/interview/answer/audio/{token}/{questionId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`saveAudioAnswer`) |

**Request Body:** `multipart/form-data` — `audio` (Blob), `takes`, `audio_length`, `switch_tab`

---

#### POST /candidates/interview/answer/text/{token}/{questionId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`saveTextAnswer`) |

**Request Body**
```ts
{ text: string; tab_switch_count?: number }
```

---

#### POST /candidates/interview/answer/mcq/{token}/{questionId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`saveMCQAnswer`) |

**Request Body**
```ts
{ selected_option: string; tab_switch_count?: number }
```

---

#### POST /candidates/livekit-token/{token}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`fetchLiveKitToken`) |

**Response**
```ts
{ token: string; room_name: string; session_id: string }
```

---

#### POST /candidates/store-transcript/{token}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`storeInterviewTranscript`) |

**Request Body**
```ts
{ transcript_details: TranscriptEntry[]; interview_lasted_for: number }
```

---

#### POST /candidates/error-message-log/{token}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`logInterviewErrorMessage`) |

**Request Body**
```ts
{ error_message: string }
```

---

#### POST /candidates/create-bunny-space/{token}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/interview/candidates.js` (`createBunnySpace`) |

**Response**
```ts
{ signature_hash: string; expiration_time: string; library_id: string; video_id: string }
```

---

#### GET /candidates/landing/{jobId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`fetchMetaData`) |

---

#### POST /candidates/guest-otp

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`guestSendOtp`) |

**Request Body**
```ts
{ first_name: string; last_name: string; email: string }
```

---

#### POST /candidates/out-verify

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`guestVerifyOtp`) |

**Request Body**
```ts
{ email: string; otp: string }
```

---

### Live Interviews (Meetings)

---

#### GET /social/live-interviews/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`fetchInterview`) |

---

#### POST /social/zoom-meetings/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`setZoomMeeting`) |

---

#### PATCH /social/zoom-meeting/{id}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`updateZoomMeeting`) |

---

#### DELETE /social/zoom-meeting/{id}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`deleteZoomMeeting`) |

---

#### POST /social/google/meetings/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`setMeetMeeting`) |

---

#### PATCH /social/google/meeting/{id}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`updateMeetMeeting`) |

---

#### DELETE /social/google/meeting/{id}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`deleteMeetMeeting`) |

---

#### POST /social/teams/meetings/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`setTeamsMeeting`) |

---

#### PATCH /social/teams/meetings/{id}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`updateTeamsMeeting`) |

---

#### DELETE /social/teams/meetings/{id}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/live-interview/api.ts` (`deleteTeamsMeeting`) |

---

### Social Integration & API Keys

---

#### GET /social/google/auth/redirect/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/social.ts` (`getGoogleUrl`) |

**Response:** `{ url: string }` — Google OAuth redirect URL.

---

#### GET /social/teams/auth/redirect/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/social.ts` (`getTeamsUrl`) |

---

#### GET /social/keys/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/social.ts` (`getApiKeys`) |

---

#### POST /social/generate/api-key/{companyId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/social.ts` (`postApiKey`) |

**Request Body**
```ts
{ name: string; expiry_date?: string }
```

---

#### DELETE /social/generate/api-key/{companyId}/{name}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/social.ts` (`deleteApiKey`) |

---

### Career Page

---

#### GET /career/career_page/{companyUuid}/jobs/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | No (`baseAPI`) |
| Called From | `src/apiprovider/career/index.tsx` (`getcareerJob`) |

**Purpose:** Public career page — list active jobs for a company by UUID.

---

#### PUT /career/career_page/{companyUuid}/

| Field | Value |
|-------|-------|
| Method | PUT |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/career/index.tsx` (`configCareerPage`) |

**Request Body:** `multipart/form-data`
```ts
{
  header: string; footer: string; require_logo: boolean; meta_tags: string (JSON)
  colour: string; secondary_colour: string; favicon?: File; meta_image?: File
}
```

---

### Customisation (Landing Pages & Workflows)

---

#### GET /user-management/landing-page/{companyId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`fetchCompanyCustomisation`) |

---

#### PATCH /user-management/landing-page/{companyId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`updateCompanyCustomisation`, `updateCompanyCustomisationFormData`) |

---

#### GET /jobs/landing-page/{jobId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`fetchJobCustomisation`) |

---

#### PATCH /jobs/landing-page/{jobId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`updateJobCustomisation`, `updateJobCustomisation1`) |

---

#### GET /jobs/company-workflow/{companyId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`fetchCompanyWorkflowStages`) |

---

#### GET /jobs/job/{companyId}/unique-stages/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`fetchCompanyUniqueStages`) |
| Note | Path parameter name `companyId` is misleading — may actually be jobId |

---

#### POST /jobs/company-workflow/{companyId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`createCompanyWorkflowStage`) |

---

#### PATCH /jobs/company-workflow/{companyId}/{stageId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`updateCompanyWorkflowStage`) |

---

#### DELETE /jobs/company-workflow/{companyId}/{stageId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`deleteCompanyWorkflowStage`) |

---

#### PATCH /jobs/company/{companyId}/reorder-stages/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`reorderCompanyWorkflowStages`) |

**Request Body**
```ts
{ ordered_stage_ids: number[] }
```

---

#### GET /jobs/job-workflow/{jobId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`fetchJobWorkflowStages`) |

---

#### POST /jobs/job-workflow/{jobId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`createJobWorkflowStage`) |

---

#### PATCH /jobs/job-workflow/{jobId}/{stageId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`updateJobWorkflowStage`) |

---

#### DELETE /jobs/job-workflow/{jobId}/{stageId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`deleteJobWorkflowStage`) |

---

#### PATCH /jobs/job/{jobId}/reorder-stages/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/customisation.ts` (`reorderJobWorkflowStages`) |

**Request Body**
```ts
{ ordered_stage_ids: number[] }
```

---

### SMTP & Email Templates

---

#### POST /user-management/smtp-settings/create/{companyId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/smtp/index.js` (`smtpSettingUp`) |

**Request Body**
```ts
{
  smtp_host: string; smtp_port: number; smtp_username: string; smtp_password: string
  use_tls: boolean; use_ssl: boolean; from_email: string; from_name: string; company: number
}
```

---

#### POST /user-management/smtp-settings/{companyId}/verify/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/smtp/index.js` (`smtpEmailVerify`) |

**Request Body**
```ts
{ email: string }
```

---

#### PATCH /user-management/smtp-settings/{companyId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/smtp/index.js` (`stmpSettingUpdate`) |
| Note | Function name has typo: `stmpSettingUpdate` should be `smtpSettingUpdate` |

---

#### GET /user-management/smtp-settings/{companyId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/smtp/index.js` (`getSetting`) |

---

#### DELETE /user-management/smtp-settings/{companyId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/smtp/index.js` (`deleteSMTP`) |

---

#### POST /user-management/smtp-settings/mailersend/{companyId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/smtp/index.js` (`MailerSendSettingUp`) |

**Request Body**
```ts
{ smtp_username: string; smtp_password: string; from_email: string; from_name: string }
```

---

#### GET /user-management/templates/email/{companyId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`retrieveAllEmailTemplate`) |

---

#### POST /user-management/templates/email/{companyId}

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`createEmailTemplate`) |

**Request Body (EmailTemplateType)**
```ts
{ title: string; subject: string; body: string; is_active: boolean }
```

---

#### PATCH /user-management/template/email/{emailTemplateId}

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`updateEmailTemplate`) |

---

#### DELETE /user-management/template/email/{emailTemplateId}

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`deleteEmailTemplate`) |

---

### SMS Config & Templates

---

#### GET /user-management/sms-configuration/{companyId}/list/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/smsConfig.ts` (`getSmsConfigList`) |

---

#### GET /user-management/sms-configuration/{companyId}/{id}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/smsConfig.ts` (`getSmsConfig`) |

---

#### POST /user-management/sms-configuration/create/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/smsConfig.ts` (`createSmsConfig`) |

**Request Body (SmsTwilioPayload)**
```ts
{
  provider: string; phone_number: string; account_sid: string; auth_token: string
  reciepient_number: string; whatsapp_enabled: boolean; company: number
}
```

**Note:** Field `reciepient_number` has a typo — should be `recipient_number`.

---

#### PATCH /user-management/sms-configuration/{id}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/smsConfig.ts` (`updateSmsConfig`) |

---

#### DELETE /user-management/sms-configuration/{id}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/smsConfig.ts` (`deleteSmsConfig`) |

---

#### GET /user-management/templates/sms/{companyId}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`retrieveAllSmsTemplate`) |

---

#### PATCH /user-management/template/sms/{templateId}

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`updateSmsTemplate`) |

---

### Video Store Configuration

---

#### GET /user-management/company-video-store/{companyId}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/videoStore.ts` (`getVideoStore`) |

**Response (VideoStoreConfig)**
```ts
{
  id?: number; company?: number; provider: 'mux' | 'bunny'
  access_key?: string; mux_token_id?: string | null
  bunny_library_id?: string | null; bunny_pull_zone_url?: string | null
}
```

---

#### POST /user-management/company-video-store/{companyId}/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/videoStore.ts` (`createVideoStore`) |

---

#### PATCH /user-management/company-video-store/{companyId}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/videoStore.ts` (`updateVideoStore`) |

---

#### DELETE /user-management/company-video-store/{companyId}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/videoStore.ts` (`deleteVideoStore`) |

---

### Telephone Configuration

---

#### GET /user-management/telephone-config/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/telephoneConfig.ts` (`getTelephoneConfigs`) |

---

#### GET /user-management/telephone-config/{id}/

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/telephoneConfig.ts` (`getTelephoneConfigById`) |

---

#### POST /user-management/telephone-config/

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/telephoneConfig.ts` (`createTelephoneConfig`) |

**Request Body (CreateTelephoneConfig)**
```ts
{ provider: string; domain_name: string; user_name: string; number: string; name: string; password: string }
```

**Note:** `sip_trunk_id` is excluded from create/update requests — backend-generated only.

---

#### PATCH /user-management/telephone-config/{id}/

| Field | Value |
|-------|-------|
| Method | PATCH |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/telephoneConfig.ts` (`updateTelephoneConfig`) |

---

#### DELETE /user-management/telephone-config/{id}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/authentication/telephoneConfig.ts` (`deleteTelephoneConfig`) |

---

### Question Templates (Company Library)

---

#### PUT /jobs/question-temp/{companyId}/{id}/

| Field | Value |
|-------|-------|
| Method | PUT |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`updateQuestion`) |

---

#### DELETE /jobs/question-temp/{companyId}/{id}/

| Field | Value |
|-------|-------|
| Method | DELETE |
| Auth Required | Yes (`api`) |
| Called From | `src/apiprovider/accounts/templates.ts` (`deleteQuestion`) |

---

### Internal Next.js API Routes

These routes live in `src/pages/api/` and run on the server — they proxy to third-party services without exposing secret keys to the browser.

---

#### POST /api/validate

| Field | Value |
|-------|-------|
| Method | POST |
| File | `src/pages/api/validate.ts` |
| Purpose | Google reCAPTCHA v3 token verification |

**Request Body**
```ts
{ token: string }
```

**Response**
```ts
{ success: boolean; score: number }
```

**Called From:** Login, register, forgot-password, team-add pages before form submission.

**Note:** Score threshold check is commented out — all valid reCAPTCHA responses return 200 regardless of score. If bot traffic becomes a concern, uncomment the `score > 0.5` check.

---

#### POST /api/download

| Field | Value |
|-------|-------|
| Method | POST |
| File | `src/pages/api/download.js` |
| Purpose | Video download proxy — bypasses CORS on Mux/Bunny signed video URLs |

**Request Body**
```ts
{ videoUrl: string }  // must start with https://
```

**Response:** Piped binary stream (`Content-Type: video/mp4`)

**Called From:** `src/views/job/workflow/Interview.tsx`, `src/views/job/workflow/LivekitWorkflowInterview.tsx`

**Security Note:** Validates URL starts with `https://` but does not whitelist domains. Any HTTPS URL can be proxied, which could be abused as an SSRF vector if not further restricted on the backend.

---

#### GET /api/changelog/latest

| Field | Value |
|-------|-------|
| Method | GET |
| File | `src/pages/api/changelog/latest.ts` |
| Purpose | Fetch latest published changelog entries from Canny.io |
| Query Params | `limit` (1–10, default 4) |

**Response**
```ts
{
  entries: Array<{
    id: string; title: string; plaintextDetails: string
    url: string; publishedAt?: string; created?: string
  }>
}
```

**Called From:** `src/layouts/components/shared-components/ChangelogNotificationDropdown.tsx`

---

#### POST /api/affiliate/customers/create

| Field | Value |
|-------|-------|
| Method | POST |
| File | `src/pages/api/affiliate/customers/create.ts` |
| Purpose | Create affiliate customer in Partnero (server-side proxy with `PARTNERO_AFFILIATE_TOKEN`) |

**Request Body**
```ts
{ partner_key: string; key?: string; email: string; name: string; surname: string }
```

**Response**
```ts
{ key: string; name: string; email: string; partner: string }
```

---

#### GET /api/affiliate/customers/search

| Field | Value |
|-------|-------|
| Method | GET |
| File | `src/pages/api/affiliate/customers/search.ts` |
| Purpose | Search Partnero for an affiliate customer by email |
| Query Params | `email` |

**Response**
```ts
{ found: boolean; customer: { key: string; partner: string; name: string; surname: string; email: string; created_at: string } | null }
```

---

#### POST /api/affiliate/transaction

| Field | Value |
|-------|-------|
| Method | POST |
| File | `src/pages/api/affiliate/transaction.ts` |
| Purpose | Record affiliate sale transaction in Partnero |

**Request Body**
```ts
{ customer_key: string; transaction_key: string; amount: number; amount_units?: string; product_id?: string; product_type?: string; action?: string }
```

**Note:** `amount_units` is hardcoded as `'INR'` in client code (`src/pages/api/affiliate/transactions.ts`), but the API route defaults to `'USD'` if not provided. This is an inconsistency.

---

### Third-Party APIs Called Directly from Browser

These calls bypass the backend entirely. They expose API keys or business logic on the client.

---

#### GET https://api.mailcheck.ai/email/{email}

| Field | Value |
|-------|-------|
| Method | GET |
| Auth Required | None (public API) |
| Called From | `src/apiprovider/authentication/authentication.ts` (`mailCheckVerifier`), used in register page and team-add page |

**Response**
```ts
{ disposable: boolean; mx: boolean; valid: boolean; ... }
```

**Used Fields:** `disposable` — blocks registration if `true`

**Security Issue:** Temporary email blocking logic runs entirely on the frontend. A user can bypass it by calling the register endpoint directly. See "Frontend Logic That Should Move to Backend" below.

---

#### POST https://api.partnero.com/v1/customers (client fallback)

| Field | Value |
|-------|-------|
| Method | POST |
| Auth Required | `NEXT_PUBLIC_PARTNERO_AFFILIATE_TOKEN` env var |
| Called From | `src/apiprovider/affiliate/affiliate.ts` (`affilicateCheck`) |

**Note:** This is a client-side fallback when `window.po` (Partnero JS SDK) fails. It exposes `NEXT_PUBLIC_PARTNERO_AFFILIATE_TOKEN` to the browser. Prefer using the server-side `/api/affiliate/customers/create` route instead.

---

## URL Structure Recommendations

### The Problem with Ambiguous IDs in the Network Tab

When debugging with browser DevTools, URLs like `/candidates/` or `/user-management/` are indistinguishable from each other in the Network tab — you see identical path segments repeated for different resources. This makes debugging slow.

**Bad patterns (current):**
```
GET  /candidates/?job_id=abc123
GET  /candidates/?job_id=xyz789
PATCH /candidates/stages/bulk/
DELETE /candidates/candidates/abc123/comments/def456    # doubled "candidates"
GET  /jobs/job/123/                                      # doubled "job"
GET  /user-management/company/members/456
GET  /user-management/company/subscription/456
```

**Good patterns (recommended):**
```
GET  /api/v1/jobs/{jobId}/candidates
GET  /api/v1/jobs/{jobId}/candidates/{candidateId}
PATCH /api/v1/candidates/{candidateId}/stage
PATCH /api/v1/candidates/bulk-stage
DELETE /api/v1/candidates/{candidateId}/comments/{commentId}
GET  /api/v1/companies/{companyId}/members
GET  /api/v1/companies/{companyId}/subscription
```

### Recommendations

1. **Add `/api/v1/` prefix** to all backend routes. This allows the API to be distinguished from Next.js internal routes at a glance.
2. **Use consistent nesting** — resources should be nested under their parent: `/api/v1/jobs/{jobId}/candidates`, not `/candidates/?job_id=`.
3. **Avoid repeating resource names** — `/candidates/candidates/{id}/comments/` doubles the word "candidates". Use `/api/v1/candidates/{id}/comments/`.
4. **Fix URL typos** before v1 release:
   - `/login/rest-password/otp/` → `/login/reset-password/otp/`
   - `/candidates/intiate-telephonic-interview/` → `/candidates/initiate-telephonic-interview/`
   - `/jobs/noify-members-on-complete/` → `/jobs/notify-members-on-complete/`
5. **Distinguish job metadata vs job detail** — `/jobs/dynamic-info/{id}/` and `/jobs/job/{id}/` serve similar data. Consolidate.

---

## Frontend Logic That Should Move to Backend

### 1. Temporary Email (Disposable) Check

**Current location:** `src/pages/register/index.tsx` (~line 328), `src/pages/company/teamadd/index.tsx` (~line 241)

**Current behavior:** Before calling `POST /login/register`, the frontend calls `https://api.mailcheck.ai/email/{email}` and blocks registration if `response.disposable === true`. This is a frontend-only guard — the backend has no corresponding validation.

**Problem:** Any user who calls `POST /login/register` directly (via curl, Postman, or custom JS) bypasses this check entirely.

**Recommended fix:** Move this check to the backend's `/login/register` handler.

```http
POST /login/register
→ Backend calls mailcheck.ai internally (or uses its own disposable domain list)
→ Returns 400 if email is disposable:
{
  "error": "DISPOSABLE_EMAIL",
  "message": "Temporary email addresses are not allowed."
}
```

---

### 2. Affiliate/Referral Tracking on Registration

**Current location:** `src/pages/register/index.tsx`, `src/pages/api/affiliate/transactions.ts`

**Current behavior:** After successful registration + email verification, the frontend reads `localStorage.pendingPartneroData` and calls `/api/affiliate/customers/create` to register the user in Partnero. This runs asynchronously and can silently fail.

**Problem:**
- If the user closes the browser after registering but before verifying email, `pendingPartneroData` may be lost.
- Affiliate attribution is only tracked if the user completes the full frontend flow.

**Recommended fix:** The backend should handle Partnero registration at the point of email verification.

```http
POST /login/otp-email-verification
Request: { otp: string; partnero_partner_key?: string }
→ Backend calls Partnero /v1/customers if partner key present
→ Returns 200 on success, still completes verification even if Partnero fails
```

---

### 3. Factor Min/Max Score Hardcoded on Frontend

**Current location:** `src/apiprovider/Job/factors.ts` (`createJobFactor`, line 49)

**Current behavior:**
```ts
data.min_score = 1
data.max_score = 5
```
These values are silently overwritten regardless of what the UI sends.

**Problem:** The scoring range is a business rule that belongs on the backend. If the range ever changes, two places need updating.

**Recommended fix:** Remove client-side override. Backend should enforce default min/max on create, or accept configurable values with validation.

---

### 4. Telephone Interview Default Config Hardcoded on Frontend

**Current location:** `src/apiprovider/Job/aiConfig.ts` (`createTelephoneInterviewConfig`, line 65)

**Current behavior:** When a job with `type: 'telephone_interview'` is created, the frontend posts hardcoded defaults:
```ts
agent_name: 'John Doe', voice_type: 'female',
voice_id: 'Aura 2 - Thalia (American, feminine)', tone: 'Professional', language: 'English'
```

**Recommended fix:** The backend should apply sensible defaults on create, or accept an empty POST body and use its own default config.

---

### 5. Last-Seen Monitor Side-Effect in Auth Interceptor

**Current location:** `src/apiprovider/baseApi.ts` (response interceptor, lines 54–137)

**Current behavior:** On every token refresh (401 response), the interceptor fires `POST /login/update_last_seen` or `POST /login/create_last_seen` synchronously. If this monitoring call returns 400 or 404, the interceptor clears all auth tokens and redirects to login — even if the original request (that triggered the 401) was successfully retried.

**Problem:** A transient backend error in the monitoring endpoint will log users out unexpectedly.

**Recommended fix:** Handle last-seen updates server-side as part of the token refresh response. The client should not need to make a separate call.

```http
POST /api/token/refresh/
Response: { access: string; refresh: string; last_seen_monitor?: string }
```

---

## Tech Debt & Inconsistencies

| Issue | Location | Severity |
|-------|----------|----------|
| URL typo: `rest-password` should be `reset-password` | `authentication.ts` line 51 | Medium |
| URL typo: `intiate` should be `initiate` | `pool.ts` line 31 | Medium |
| URL typo: `noify` should be `notify` | `team.ts` lines 5, 14 | Medium |
| Function name typo: `stmpSettingUpdate` | `smtp/index.js` | Low |
| Field name typo: `reciepient_number` | `smsConfig.ts` (SmsTwilioPayload) | Medium |
| `deleteCandidate` defined twice — one in `pool.ts`, one in `workflow.ts` with different signatures | Both files | High |
| `list_candidates` called from `live-interview/api.ts` duplicates `workflow.ts` version | `live-interview/api.ts` | Low |
| `updateJobCustomisation` and `updateJobCustomisation1` — two functions for the same endpoint | `customisation.ts` | Low |
| `metadatafetch` uses bare `axios` instead of `api` or `baseAPI` | `metadata.ts` | Medium |
| `window.po` Partnero SDK is called client-side before falling back to browser API call | `affiliate/affiliate.ts` | Medium |
| `amount_units` hardcoded as `'INR'` in client but API server defaults to `'USD'` | `transactions.ts` | Medium |
| `rating` and `review` submitted via `addOverAllRating` but only `rating` from response is consumed | `workflow.ts` | Low |
| `/jobs/job/{companyId}/unique-stages/` — parameter name `companyId` is misleading | `customisation.ts` | Low |
| The subscription `TSubscription` type includes `plan.uuid`, `plan.paypal`, `plan.usd_price`, `plan.number_of_companies` but none are consumed in user-facing views | `subscriptionTypes.ts` | Low |
| `deleteCandidate` in `workflow.ts` uses `candidates/${id}/?job_id=` but `pool.ts` uses `params: { job_id: ... }` — inconsistent | Both files | Low |
| reCAPTCHA score threshold is commented out (`score > 0.5` check) | `validate.ts` | Medium |
| Video download proxy does not whitelist domains — SSRF risk | `download.js` | High |

---

## Action Items for Backend Team

1. **Validate disposable emails on the server** in `POST /login/register` and `POST /user-management/company/members/{id}`. Remove dependency on client-side mailcheck.ai call.

2. **Include `last_seen_monitor` in the token refresh response** (`POST /api/token/refresh/`) so the frontend interceptor does not need to make a separate side-effect call that can force logout on failure.

3. **Fix URL typos in route definitions:**
   - `/login/rest-password/otp/` → `/login/reset-password/otp/`
   - `/candidates/intiate-telephonic-interview/` → `/candidates/initiate-telephonic-interview/`
   - `/jobs/noify-members-on-complete/` → `/jobs/notify-members-on-complete/`

4. **Fix field name typo:** `reciepient_number` → `recipient_number` in SMS config API (coordinate with frontend `SmsTwilioPayload` update).

5. **Apply telephone interview defaults server-side** when `POST /jobs/job-ai-config/` is called with `job` for a telephone-type interview.

6. **Apply factor scoring defaults server-side** (`min_score: 1`, `max_score: 5`) instead of relying on the client to set them.

7. **Consolidate `/jobs/job/{id}/` and `/jobs/dynamic-info/{id}/`** — if `dynamic-info` is a public metadata variant of the job detail, document the distinction or merge it with appropriate public/private field control.

8. **Remove unused subscription response fields** from `GET /user-management/company/subscription/{companyId}` if no consumer exists: `plan.paypal`, `plan.usd_price`, `plan.number_of_companies`, `plan.uuid` (outside admin views).

9. **Handle Partnero affiliate tracking server-side** on email verification to prevent lost attribution when users close browsers mid-flow.

10. **Restrict the video proxy endpoint** (`/api/download`) by whitelisting Mux and Bunny CDN domains to prevent SSRF abuse.

11. **Return pagination metadata** consistently — `GET /candidates/pool/{companyId}/` returns `next`/`previous` URLs but the candidates list from `GET /candidates/` is consumed differently. Standardize pagination shape.

---

## Frontend Follow-up Items

1. **Remove duplicate `deleteCandidate` function** — `pool.ts` and `workflow.ts` both export `deleteCandidate` with slightly different path/param constructions. Consolidate into one canonical function.

2. **Remove `updateJobCustomisation1`** — it is identical to `updateJobCustomisation` with only the `Content-Type` header added. Pass the header via a config parameter instead.

3. **Eliminate bare `axios` calls** in `metadata.ts` and `account/company/SettingTeam.tsx` and replace with the `api` or `baseAPI` instances for consistency.

4. **Fix `stmpSettingUpdate` → `smtpSettingUpdate`** in `smtp/index.js`.

5. **Move `NEXT_PUBLIC_PARTNERO_AFFILIATE_TOKEN` to server-only** — rename to `PARTNERO_AFFILIATE_TOKEN` (no `NEXT_PUBLIC_` prefix) and always call the affiliate API through the Next.js API route, never directly from the browser.

6. **Clean up commented-out code** in `billings.ts` (`SubscriptionByCoupon` mock) and `workflow.ts` (commented `//throw error` patterns in `fetchCandidateProfile`).

7. **Add API version prefix** to all `baseUrl` calls — when the backend adds `/api/v1/` routing, update `baseApi.ts` to set `baseURL: ${baseUrl}/api/v1/` and remove prefix from individual calls.

8. **Adopt React Query** for data fetching — currently all API calls are raw async functions in components. React Query would add caching, background refetch, and loading/error states automatically.

9. **Consider centralizing pagination** — `listMoreCandidate(url)` and `activePaginationJobs(url)` accept full URLs (returned from server), which is fragile if the base URL changes. Extract path from full URL or use a consistent cursor/offset pattern.

10. **Trace and remove unused response fields** from `candidateListType`:
    - `ratings_count` — not rendered in any view
    - `total_rating` — not rendered; `overall_rating` is used instead
