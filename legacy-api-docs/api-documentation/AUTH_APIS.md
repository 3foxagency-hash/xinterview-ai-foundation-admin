# Authentication & Registration APIs

---

## /login/register

POST

**Naming:** No change needed.

**Unused response fields:**

- `joining_company_details.logo` — referenced in code but the `<Avatar>` using it is commented out.
- `joining_company_details.account_team_size` — stored in local state but never rendered in the invite choice UI.

> `access_token` naming inconsistency: this endpoint returns `access_token` and `refresh_token`, but `POST /api/token/refresh/` returns `access`. Standardize to `access_token` everywhere.

---

## /login/tokens

POST

**Naming:** No change needed.

**Unused response fields:**

- `email_verified` — never read from this response.
- `company_created` — never read from this response.

---

## /api/token/refresh/

POST

**Naming:** No change needed.

**Unused response fields:**

- `refresh` (if returned) — never read.

> Returns `access`, while `/login/tokens` and `/login/register` return `access_token`. Standardize to `access_token`.

---

## /login/update_last_seen

POST

**Naming:** Underscores inconsistent with the rest of the API (hyphens). Suggested: `POST /login/last-seen`

**Unused response fields:** Only `last_seen_monitor` is read — everything else ignored.

---

## /login/create_last_seen

POST

**Naming:** Same underscore issue. Suggested: merge both `/login/update_last_seen` and `/login/create_last_seen` into a single upsert `POST /login/last-seen`.

**Unused response fields:** Only `last_seen_monitor` is read — everything else ignored.

---

## /login/reset-password/email/

POST

**Naming:** The `/email/` suffix is confusing — the email is in the request body, not a sub-resource. Suggested: `POST /login/forgot-password/`

**Unused response fields:** Only `email` is read. All other fields ignored.

---

## /login/reset-password/{token}/

POST

**Naming:** No change strictly needed.

**Unused response fields:** Entire success response body ignored. Error response fields `password`, `re_password`, `non_field_errors`, `messages` are read.

---

## /login/rest-password/otp/

POST

**Naming:** ⚠️ **TYPO** — `rest-password` should be `reset-password`. Fix to: `/login/reset-password/otp/`

**Unused response fields:** Only `token` is read. All other fields ignored.

---

## /login/otp-email-verification

POST

**Naming:** Verbose and reads awkwardly. Suggested: `POST /login/verify-email/`

**Unused response fields:** Entire response body ignored.

---

## /login/verification-email

POST

**Naming:** Word order is reversed. Suggested: `POST /login/send-verification-email/`

**Unused response fields:** Entire response body ignored.

---

## /login/company

POST

**Naming:** ⚠️ Creates a company during onboarding — nothing to do with login/auth. Suggested: `POST /companies/`

**Unused response fields:** Entire response body ignored.

---

## /login/join-invited-company/{companyId}/

POST

**Naming:** ⚠️ `login/` prefix is wrong for an invite-acceptance action. `{companyId}` is a numeric ID. Suggested: `POST /companies/{companyId}/join/`

**Unused response fields:** Entire response body ignored.

---

## /user-management/

GET

**Naming:** Reads like an admin management panel, not a current-user profile endpoint. Suggested: `GET /user-management/me/`

**Unused response fields:**

- `custom_data` — always `null` in observed responses.
- `location` — always `"Unknown"`.
- `mobile_number` — always `null` in observed responses.
- `whatsapp_number` — always `null` in observed responses.
- `is_whatsapp_active` — always `false` in observed responses.
- `admin_companies.phone_number` — always `null` in observed responses.
- `admin_companies.company_website` — always `null` in observed responses.

---

## /user-management/companies

GET

**Naming:** Ambiguous scope. Suggested: `GET /user-management/my-companies/`

**Unused response fields:** None confirmed as unused everywhere — used across multiple pages.

---

## /candidates/guest-otp

POST

**Naming:** `guest-otp` doesn't indicate direction (send vs verify). Suggested: `POST /candidates/guest/send-otp/`

**Unused response fields:** Entire response body ignored.

---

## /candidates/out-verify

POST

**Naming:** ⚠️ `out-verify` is completely unclear. Suggested: `POST /candidates/guest/verify-otp/`

**Unused response fields:** Full response stored to `localStorage.guestOtpResponse` — individual field usage tracked in the share/comment flow.

---

## Naming Issues Summary

| Endpoint | Method | Issue | Suggested Fix |
|---|---|---|---|
| `/login/update_last_seen` | POST | Underscores | `/login/last-seen` (upsert) |
| `/login/create_last_seen` | POST | Duplicate of above with different name | Merge into `/login/last-seen` |
| `/login/rest-password/otp/` | POST | **TYPO** — `rest` should be `reset` | `/login/reset-password/otp/` |
| `/login/reset-password/email/` | POST | `/email/` suffix confusing | `/login/forgot-password/` |
| `/login/otp-email-verification` | POST | Verbose, reads awkwardly | `/login/verify-email/` |
| `/login/verification-email` | POST | Reversed word order | `/login/send-verification-email/` |
| `/login/company` | POST | Onboarding action under wrong prefix | `/companies/` |
| `/login/join-invited-company/{companyId}/` | POST | Wrong prefix; numeric ID | `/companies/{companyId}/join/` |
| `/user-management/` | GET | Reads like admin panel | `/user-management/me/` |
| `/user-management/companies` | GET | Ambiguous scope | `/user-management/my-companies/` |
| `/candidates/out-verify` | POST | Completely unclear | `/candidates/guest/verify-otp/` |
| `/candidates/guest-otp` | POST | Doesn't indicate direction | `/candidates/guest/send-otp/` |

---

## Unused Response Fields Summary

| Field | Endpoint | Verdict |
|---|---|---|
| `joining_company_details.logo` | POST /login/register | `<Avatar>` using it is commented out |
| `joining_company_details.account_team_size` | POST /login/register | Stored in state but never rendered |
| `email_verified`, `company_created` | POST /login/tokens | Never read from this response |
| `refresh` | POST /api/token/refresh/ | Never read |
| `custom_data`, `location` | GET /user-management/ | Always `null` / `"Unknown"` in observed responses |
| `mobile_number`, `whatsapp_number`, `is_whatsapp_active` | GET /user-management/ | Always `null` / `false` in observed responses |
| `admin_companies.phone_number`, `admin_companies.company_website` | GET /user-management/ | Always `null` in observed responses |
