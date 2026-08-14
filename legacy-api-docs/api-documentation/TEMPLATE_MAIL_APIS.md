# Template Mail Page APIs

> All calls are authenticated (Bearer token).
> Scope: `/company/templatemail/` page — two tabs: Email Templates and SMS Templates.
> Components: `src/views/account/company/email-template/TemplateEmail.tsx` (email tab),
> `src/views/account/company/email-template/SmsTemplate.tsx` (SMS tab).

---

## Common (both tabs)

### /user-management/company/subscription/{companyId}

GET

**Naming:** No change needed.

**Unused response fields:** Cannot be determined from this page alone — both `TemplateEmail.tsx` and `SmsTemplate.tsx` dispatch the entire response to the Redux store via `setSubscription(res)`, making every field potentially readable by any component that subscribes to that Redux slice. Fields directly read on this page:

- Email tab reads only: `plan.smtp_allowed`
- SMS tab reads only: `plan.sms_allowed`, `plan.sms_credits`, `plan.sms_credit_expires_in`, `plan.sms_integration_allowed`

All remaining top-level fields (`id`, `total_jobs_created`, `renewal_date`, `domain_name`, `credits`, `ai_feature_enabled`, `ai_agent_config`, `stripe_transaction_id`, `notification`, `sms_credits` (top-level array), `order_id`, `subscription_date`, `auto_bill`, `is_activate`, `expiration_date`, `stripe_id`, `availed_free_credits`, `beta_user`, `company`, `zapier_key`, `smtp_enabled`) and `plan.*` fields beyond the five listed above are not directly accessed in these two components but may be consumed elsewhere through the Redux store.

---

## Email Templates Tab

### /login/company/{companyId}

GET

> Called only by the email template tab (`TemplateEmail.tsx`) to read `res.is_smtp_active`. When `is_smtp_active` is `null` or `false`, email template editing is disabled. Same endpoint documented in `INTEGRATIONS_PAGE_APIS.md`; the unused fields listed there apply here too.

**Naming:** ⚠️ URL ends in a bare numeric ID with no trailing slash. Suggested: `/login/company/{companyId}/details/`

**Unused response fields:**

- `ai_feature_enabled` — not referenced anywhere in the codebase.
- `video_storage_provider` — not referenced anywhere in the codebase.
- `partnero_commission_eligible` — not referenced in any component.
- `partnero_partner` — read from a browser cookie instead of this response field.

> All other fields (`id`, `logo`, `account_type`, `company_name`, `domain_name`, `is_domain_verified`, `career_page_uuid`, etc.) are not read on this page but are used elsewhere in the codebase (`Cname.tsx`, `CareerPage.tsx`), so they cannot be removed.

---

### /user-management/templates/email/{companyId}

GET

**Naming:** ⚠️ Two inconsistencies:
1. Missing trailing slash — all other endpoints in this family use trailing slashes.
2. `templates` (plural) vs `template` (singular) for the PATCH/DELETE siblings on the same resource — the path prefix changes depending on HTTP method. Suggested: standardize on `/user-management/email-templates/{companyId}/` for the collection and `/user-management/email-templates/{emailTempId}/` for single-resource operations.

**Unused response fields (per item in the array):**

- `created_at` — not referenced in any email template component.
- `company` — not read; already known from the request URL.

---

### /user-management/template/email/{emailTempId}

PATCH

**Naming:** ⚠️ `template` (singular) vs `templates` (plural) in the GET path — same inconsistency noted above. Missing trailing slash.

**Unused response fields:** Entire response not read — `TemplateEditModal.tsx` calls `updateEmailTemplate()` with no `.then()` handler that inspects the response.

---

### /user-management/template/email/{emailTempId}

DELETE

**Naming:** ⚠️ Same singular/plural inconsistency and missing trailing slash.

> **Dead code:** `MailSidebar.tsx` imports `deleteEmailTemplate` and wraps it in a local `deleteMail` function, but `deleteMail` is never called from any UI event handler. No button or interaction on the page currently triggers a template deletion. The endpoint is reachable from the backend but unreachable from the frontend.

**Unused response fields:** N/A — the function is never invoked.

---

## SMS Templates Tab

### /user-management/templates/sms/{companyId}

GET

**Naming:** ⚠️ Same inconsistencies as the email equivalent:
1. Missing trailing slash.
2. `templates` (plural) vs `template` (singular) for the PATCH sibling. Suggested: `/user-management/sms-templates/{companyId}/` and `/user-management/sms-templates/{smsTempId}/`.

**Unused response fields (per item in the array):**

- `company` — not read; already known from the request URL. (The `SmsTemplate` TypeScript type declares it, but it is never accessed from the response anywhere in the component tree.)

---

### /user-management/template/sms/{tempId}

PATCH

**Naming:** ⚠️ `template` (singular) vs `templates` (plural) in the GET path. `{tempId}` is an abbreviated parameter name — inconsistent with `{emailTempId}` used for the email PATCH. Missing trailing slash.

**Unused response fields:** Entire response not read — `SmsTemplateEditModal.tsx` calls `updateSmsTemplate()` with no `.then()` handler.

---

## Naming Issues Summary

| Endpoint | Issue | Suggested Fix |
|---|---|---|
| `GET /login/company/{companyId}` | Bare numeric ID; no trailing slash | `/login/company/{companyId}/details/` |
| `GET /user-management/templates/email/{companyId}` | Plural `templates` vs singular `template` for PATCH/DELETE; no trailing slash | `/user-management/email-templates/{companyId}/` |
| `PATCH /user-management/template/email/{emailTempId}` | Singular `template` vs plural `templates` for GET; no trailing slash | `/user-management/email-templates/{emailTempId}/` |
| `DELETE /user-management/template/email/{emailTempId}` | Same as PATCH | `/user-management/email-templates/{emailTempId}/` |
| `GET /user-management/templates/sms/{companyId}` | Plural `templates` vs singular `template` for PATCH; no trailing slash | `/user-management/sms-templates/{companyId}/` |
| `PATCH /user-management/template/sms/{tempId}` | Singular `template` vs plural `templates` for GET; abbreviated `{tempId}` param name; no trailing slash | `/user-management/sms-templates/{smsTempId}/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `ai_feature_enabled` | GET /login/company/{companyId} | Not referenced anywhere in the codebase |
| `video_storage_provider` | GET /login/company/{companyId} | Not referenced anywhere in the codebase |
| `partnero_commission_eligible` | GET /login/company/{companyId} | Not referenced anywhere |
| `partnero_partner` | GET /login/company/{companyId} | Read from browser cookie instead |
| `created_at` | GET /user-management/templates/email/{companyId} | Not referenced in any email template component |
| `company` | GET /user-management/templates/email/{companyId} | Already known from the request URL |
| Full response | PATCH /user-management/template/email/{emailTempId} | Not read — no `.then()` inspects the response |
| `company` | GET /user-management/templates/sms/{companyId} | Declared in TypeScript type but never accessed from the response |
| Full response | PATCH /user-management/template/sms/{tempId} | Not read — no `.then()` inspects the response |
