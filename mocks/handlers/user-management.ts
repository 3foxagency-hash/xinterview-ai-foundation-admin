import { http, HttpResponse } from 'msw';
import { applyScenario } from './scenario';
import { authenticate, currentCompanyId } from '../repo/authenticate';
import { authRepo } from '../repo/auth';
import {
  companyRepo,
  teamRepo,
  smtpRepo,
  templateRepo,
  landingPageRepo,
  domainRepo,
  miscRepo,
  addressRepo,
  invoiceRepo,
  couponRepo,
  generateRepo,
} from '../repo/user-management';
import { UM_PATHS } from '@/lib/api/user-management-contract';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateCompanyRequest,
  InviteMemberRequest,
  ChangeMemberRoleRequest,
  SmtpSettingsRequest,
  SmtpVerifyRequest,
  EmailTemplateRequest,
  SmsTemplateRequest,
  UpdateLandingPageRequest,
  TrustedOriginRequest,
  CompanyMemberRole,
  BillingAddressRequest,
  ApplyCouponRequest,
  ChangeEmailRequest,
  GenerateJobDescriptionRequest,
  GenerateJobQuestionsRequest,
} from '@/lib/api/user-management-contract';
import type { MockUser } from '../db';

/**
 * User-management handlers.
 *
 * Paths use the target names from the legacy API docs
 * (`legacy-api-docs/api-documentation/*.md`) — IDs precede their sub-resource,
 * no verbs in paths, no URL ending in a bare numeric ID. `LEGACY_UM_PATHS`
 * records what dev serves today.
 *
 * Error envelopes match the real backend's: `{ detail }` for single messages,
 * `{ field: [msgs] }` for DRF validation.
 */

const detail = (status: number, message: string) =>
  HttpResponse.json({ detail: message }, { status });

const fieldErrors = (errors: Record<string, string[]>, status = 400) =>
  HttpResponse.json(errors, { status });

const unauthenticated = () =>
  detail(401, 'Authentication credentials were not provided.');

const notFound = (what = 'Not found') => detail(404, what);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolves caller + company, or the response to short-circuit with.
 *
 * The company comes from the **session**, never the URL: trusting the
 * `{companyId}` path segment would let any authenticated user read another
 * company's data by editing the address bar.
 */
type Ctx = { user: MockUser; companyId: number };

async function context(
  request: Request
): Promise<Ctx | { fail: Response }> {
  const scenario = await applyScenario();
  if (scenario) return { fail: scenario };

  const user = authenticate(request);
  if (!user) return { fail: unauthenticated() };

  const companyId = currentCompanyId(user);
  if (companyId === null) {
    return { fail: detail(403, 'This account has no company yet.') };
  }
  return { user, companyId };
}

const isFail = (c: Ctx | { fail: Response }): c is { fail: Response } =>
  'fail' in c;

const ROLES: CompanyMemberRole[] = ['MA', 'EX'];

export const userManagementHandlers = [
  // ─────────────────────────── Current user ───────────────────────────

  // GET /user-management/me/
  http.get(`*${UM_PATHS.me}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    return HttpResponse.json(authRepo.currentUser(ctx.user));
  }),

  // PATCH /user-management/me/
  http.patch(`*${UM_PATHS.updateProfile}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as UpdateProfileRequest;
    const errors: Record<string, string[]> = {};
    if (body.first_name !== undefined && !body.first_name.trim()) {
      errors.first_name = ['This field may not be blank.'];
    }
    if (body.last_name !== undefined && !body.last_name.trim()) {
      errors.last_name = ['This field may not be blank.'];
    }
    if (Object.keys(errors).length > 0) return fieldErrors(errors);

    const u = ctx.user;
    if (body.first_name !== undefined) u.firstName = body.first_name;
    if (body.last_name !== undefined) u.lastName = body.last_name;
    if (body.timezone !== undefined) u.timezone = body.timezone;
    if (body.language !== undefined) u.locale = body.language;

    return HttpResponse.json(authRepo.currentUser(u));
  }),

  // POST /user-management/me/password/
  http.post(`*${UM_PATHS.changePassword}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as ChangePasswordRequest;
    if (!body.old_password || !body.new_password) {
      const errors: Record<string, string[]> = {};
      if (!body.old_password) errors.old_password = ['This field is required.'];
      if (!body.new_password) errors.new_password = ['This field is required.'];
      return fieldErrors(errors);
    }
    if (body.old_password !== ctx.user.password) {
      return fieldErrors({ old_password: ['Current password is incorrect.'] });
    }
    if (body.new_password.length < 8) {
      return fieldErrors({
        new_password: ['Password must be at least 8 characters.'],
      });
    }

    ctx.user.password = body.new_password;
    return HttpResponse.json({ message: 'Password updated successfully' });
  }),

  // POST /user-management/notifications/mark-read/
  http.post(`*${UM_PATHS.markNotificationsRead}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    ctx.user.notificationSkipped = true;
    return HttpResponse.json({ message: 'Notifications marked as read' });
  }),

  // ─────────────────────────── Company ───────────────────────────

  // GET /user-management/my-companies/
  http.get(`*${UM_PATHS.myCompanies}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    return HttpResponse.json(authRepo.myCompanies(ctx.user));
  }),

  // GET /user-management/company/:companyId/details/
  http.get('*/user-management/company/:companyId/details/', async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    const company = companyRepo.details(ctx.companyId);
    return company ? HttpResponse.json(company) : notFound('Company not found');
  }),

  // PUT /user-management/company/:companyId/details/
  http.put('*/user-management/company/:companyId/details/', async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as UpdateCompanyRequest;
    if (body.company_name !== undefined && !body.company_name.trim()) {
      return fieldErrors({ company_name: ['This field may not be blank.'] });
    }
    const updated = companyRepo.update(ctx.companyId, body);
    return updated ? HttpResponse.json(updated) : notFound('Company not found');
  }),

  // GET /user-management/company/:companyId/subscription/
  http.get(
    '*/user-management/company/:companyId/subscription/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      const sub = companyRepo.subscription(ctx.companyId);
      return sub ? HttpResponse.json(sub) : notFound('No subscription found');
    }
  ),

  // GET /user-management/company/:companyId/credit-records/
  http.get(
    '*/user-management/company/:companyId/credit-records/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      return HttpResponse.json(companyRepo.creditRecords(ctx.companyId));
    }
  ),

  // POST /user-management/company/:companyId/enable-free-credits/
  http.post(
    '*/user-management/company/:companyId/enable-free-credits/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      if (!companyRepo.enableFreeCredits(ctx.companyId)) {
        return detail(400, 'Free credits have already been claimed.');
      }
      return HttpResponse.json({ message: 'Free credits added' });
    }
  ),

  // ─────────────────────────── Team ───────────────────────────

  // GET /user-management/company/:companyId/members/
  http.get('*/user-management/company/:companyId/members/', async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    return HttpResponse.json(teamRepo.roster(ctx.companyId));
  }),

  // POST /user-management/company/:companyId/members/
  http.post('*/user-management/company/:companyId/members/', async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as InviteMemberRequest;
    const errors: Record<string, string[]> = {};
    if (!body.email) errors.email = ['This field is required.'];
    else if (!EMAIL_RE.test(body.email)) {
      errors.email = ['Enter a valid email address.'];
    }
    if (!body.role) errors.role = ['This field is required.'];
    else if (!ROLES.includes(body.role)) {
      errors.role = [`"${body.role}" is not a valid choice.`];
    }
    if (Object.keys(errors).length > 0) return fieldErrors(errors);

    if (teamRepo.emailTaken(ctx.companyId, body.email)) {
      return fieldErrors({
        email: ['This person is already a member or has a pending invite.'],
      });
    }

    teamRepo.invite(ctx.companyId, body.email, body.role);
    // The live API returns only a message; the list is re-fetched on success.
    return HttpResponse.json({ message: 'Invitation sent' });
  }),

  // PUT /user-management/company/:companyId/members/:memberId/
  http.put(
    '*/user-management/company/:companyId/members/:memberId/',
    async ({ request, params }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const body = (await request.json()) as ChangeMemberRoleRequest;
      if (!ROLES.includes(body.role)) {
        return fieldErrors({ role: [`"${body.role}" is not a valid choice.`] });
      }

      const updated = teamRepo.changeRole(
        ctx.companyId,
        Number(params.memberId),
        body.role
      );
      return updated ? HttpResponse.json(updated) : notFound('Member not found');
    }
  ),

  // DELETE /user-management/company/:companyId/members/:memberId/
  http.delete(
    '*/user-management/company/:companyId/members/:memberId/',
    async ({ request, params }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      if (!teamRepo.remove(ctx.companyId, Number(params.memberId))) {
        return notFound('Member not found');
      }
      return new HttpResponse(null, { status: 204 });
    }
  ),

  // ─────────────────────────── SMTP ───────────────────────────

  // GET /user-management/company/:companyId/smtp-settings/
  http.get(
    '*/user-management/company/:companyId/smtp-settings/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      const s = smtpRepo.get(ctx.companyId);
      return s ? HttpResponse.json(s) : notFound('No SMTP configuration');
    }
  ),

  // POST /user-management/company/:companyId/smtp-settings/ — create or replace
  http.post(
    '*/user-management/company/:companyId/smtp-settings/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const body = (await request.json()) as SmtpSettingsRequest;
      const errors: Record<string, string[]> = {};
      if (!body.smtp_host) errors.smtp_host = ['This field is required.'];
      if (!body.smtp_port) errors.smtp_port = ['This field is required.'];
      if (!body.smtp_username) errors.smtp_username = ['This field is required.'];
      if (!body.smtp_password) errors.smtp_password = ['This field is required.'];
      if (!body.from_email) errors.from_email = ['This field is required.'];
      else if (!EMAIL_RE.test(body.from_email)) {
        errors.from_email = ['Enter a valid email address.'];
      }
      if (Object.keys(errors).length > 0) return fieldErrors(errors);

      return HttpResponse.json(smtpRepo.save(ctx.companyId, body), {
        status: 201,
      });
    }
  ),

  // PATCH /user-management/company/:companyId/smtp-settings/
  http.patch(
    '*/user-management/company/:companyId/smtp-settings/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const existing = smtpRepo.get(ctx.companyId);
      if (!existing) return notFound('No SMTP configuration');

      const body = (await request.json()) as Partial<SmtpSettingsRequest>;
      return HttpResponse.json(
        smtpRepo.save(ctx.companyId, {
          smtp_host: body.smtp_host ?? existing.smtp_host,
          smtp_port: body.smtp_port ?? existing.smtp_port,
          smtp_username: body.smtp_username ?? existing.smtp_username,
          smtp_password: body.smtp_password ?? '',
          from_email: body.from_email ?? existing.from_email,
          from_name: body.from_name ?? existing.from_name,
          use_tls: body.use_tls ?? existing.use_tls,
          use_ssl: body.use_ssl ?? existing.use_ssl,
        })
      );
    }
  ),

  // DELETE /user-management/company/:companyId/smtp-settings/
  http.delete(
    '*/user-management/company/:companyId/smtp-settings/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      if (!smtpRepo.remove(ctx.companyId)) {
        return notFound('No SMTP configuration');
      }
      return new HttpResponse(null, { status: 204 });
    }
  ),

  // POST /user-management/company/:companyId/smtp-settings/verify/
  http.post(
    '*/user-management/company/:companyId/smtp-settings/verify/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const body = (await request.json()) as SmtpVerifyRequest;
      if (!body.email || !EMAIL_RE.test(body.email)) {
        return fieldErrors({ email: ['Enter a valid email address.'] });
      }
      if (!smtpRepo.verify(ctx.companyId)) {
        return detail(400, 'Configure SMTP before sending a test email.');
      }
      return HttpResponse.json({ message: `Test email sent to ${body.email}` });
    }
  ),

  // ─────────────────────────── Email templates ───────────────────────────

  http.get(
    '*/user-management/company/:companyId/templates/email/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      return HttpResponse.json(templateRepo.listEmail(ctx.companyId));
    }
  ),

  http.post(
    '*/user-management/company/:companyId/templates/email/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const body = (await request.json()) as EmailTemplateRequest;
      const errors: Record<string, string[]> = {};
      if (!body.subject) errors.subject = ['This field is required.'];
      if (!body.body) errors.body = ['This field is required.'];
      if (Object.keys(errors).length > 0) return fieldErrors(errors);

      return HttpResponse.json(templateRepo.createEmail(ctx.companyId, body), {
        status: 201,
      });
    }
  ),

  http.get('*/user-management/templates/email/:id/', async ({ request, params }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    const t = templateRepo.getEmail(ctx.companyId, Number(params.id));
    return t ? HttpResponse.json(t) : notFound('Template not found');
  }),

  http.patch(
    '*/user-management/templates/email/:id/',
    async ({ request, params }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const body = (await request.json()) as Partial<EmailTemplateRequest>;
      if (body.subject !== undefined && !body.subject.trim()) {
        return fieldErrors({ subject: ['This field may not be blank.'] });
      }
      const t = templateRepo.updateEmail(ctx.companyId, Number(params.id), body);
      return t ? HttpResponse.json(t) : notFound('Template not found');
    }
  ),

  http.delete(
    '*/user-management/templates/email/:id/',
    async ({ request, params }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      if (!templateRepo.deleteEmail(ctx.companyId, Number(params.id))) {
        return notFound('Template not found');
      }
      return new HttpResponse(null, { status: 204 });
    }
  ),

  // ─────────────────────────── SMS templates ───────────────────────────

  http.get(
    '*/user-management/company/:companyId/templates/sms/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      return HttpResponse.json(templateRepo.listSms(ctx.companyId));
    }
  ),

  http.post(
    '*/user-management/company/:companyId/templates/sms/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const body = (await request.json()) as SmsTemplateRequest;
      if (!body.body) return fieldErrors({ body: ['This field is required.'] });

      return HttpResponse.json(templateRepo.createSms(ctx.companyId, body), {
        status: 201,
      });
    }
  ),

  http.get('*/user-management/templates/sms/:id/', async ({ request, params }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    const t = templateRepo.getSms(ctx.companyId, Number(params.id));
    return t ? HttpResponse.json(t) : notFound('Template not found');
  }),

  http.patch('*/user-management/templates/sms/:id/', async ({ request, params }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as Partial<SmsTemplateRequest>;
    if (body.body !== undefined && !body.body.trim()) {
      return fieldErrors({ body: ['This field may not be blank.'] });
    }
    const t = templateRepo.updateSms(ctx.companyId, Number(params.id), body);
    return t ? HttpResponse.json(t) : notFound('Template not found');
  }),

  http.delete('*/user-management/templates/sms/:id/', async ({ request, params }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    if (!templateRepo.deleteSms(ctx.companyId, Number(params.id))) {
      return notFound('Template not found');
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ─────────────────────────── Landing page ───────────────────────────

  http.get(
    '*/user-management/company/:companyId/landing-page/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      const lp = landingPageRepo.get(ctx.companyId);
      return lp ? HttpResponse.json(lp) : notFound('No landing page configured');
    }
  ),

  http.patch(
    '*/user-management/company/:companyId/landing-page/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const body = (await request.json()) as UpdateLandingPageRequest;
      if (body.title !== undefined && !String(body.title).trim()) {
        return fieldErrors({ title: ['This field may not be blank.'] });
      }
      const lp = landingPageRepo.update(ctx.companyId, body);
      return lp ? HttpResponse.json(lp) : notFound('No landing page configured');
    }
  ),

  // ─────────────────────────── Domain verification ───────────────────────────

  http.get(
    '*/user-management/company/:companyId/trusted-origins/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      const o = domainRepo.get(ctx.companyId);
      if (!o) return notFound('No custom domain configured');
      return HttpResponse.json({
        details: {
          verified: o.verified,
          verification: [
            { type: 'TXT', domain: o.domain, value: o.txtValue },
          ],
        },
      });
    }
  ),

  http.post(
    '*/user-management/company/:companyId/trusted-origins/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const body = (await request.json()) as TrustedOriginRequest;
      if (!body.domain?.trim()) {
        return fieldErrors({ domain: ['This field is required.'] });
      }
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(body.domain)) {
        return fieldErrors({ domain: ['Enter a valid domain name.'] });
      }
      return HttpResponse.json(
        domainRepo.addTrustedOrigin(ctx.companyId, body.domain.trim())
      );
    }
  ),

  http.delete(
    '*/user-management/company/:companyId/trusted-origins/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      if (!domainRepo.removeTrustedOrigin(ctx.companyId)) {
        return notFound('No custom domain configured');
      }
      return HttpResponse.json({ message: 'Custom domain removed' });
    }
  ),

  // POST /user-management/company/:companyId/domain-check/txt/
  http.post(
    '*/user-management/company/:companyId/domain-check/txt/',
    async ({ request }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      if (!domainRepo.verify(ctx.companyId)) {
        return HttpResponse.json(
          { error: 'No TXT record found for this domain.' },
          { status: 400 }
        );
      }
      return HttpResponse.json({ message: 'Domain verified successfully' });
    }
  ),

  // POST /user-management/domain-check/cname/
  http.post(`*${UM_PATHS.domainCheckCname}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    // Only the status code is checked by the caller; the body is ignored.
    return HttpResponse.json({ message: 'CNAME record verified' });
  }),


  // ─────────────────────────── Billing address ───────────────────────────

  http.get('*/user-management/company/:companyId/addresses/', async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    return HttpResponse.json(addressRepo.list(ctx.companyId));
  }),

  http.post('*/user-management/company/:companyId/addresses/', async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as BillingAddressRequest;
    const errors: Record<string, string[]> = {};
    if (!body.address_line1?.trim()) errors.address_line1 = ['This field is required.'];
    if (!body.city?.trim()) errors.city = ['This field is required.'];
    if (!body.country?.trim()) errors.country = ['This field is required.'];
    if (!body.zip_code?.trim()) errors.zip_code = ['This field is required.'];
    if (Object.keys(errors).length > 0) return fieldErrors(errors);

    return HttpResponse.json(addressRepo.create(ctx.companyId, body), {
      status: 201,
    });
  }),

  http.get(
    '*/user-management/company/:companyId/addresses/:addressId/',
    async ({ request, params }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      const a = addressRepo.get(ctx.companyId, Number(params.addressId));
      return a ? HttpResponse.json(a) : notFound('Address not found');
    }
  ),

  http.put(
    '*/user-management/company/:companyId/addresses/:addressId/',
    async ({ request, params }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;

      const body = (await request.json()) as BillingAddressRequest;
      if (!body.address_line1?.trim()) {
        return fieldErrors({ address_line1: ['This field is required.'] });
      }
      // Unlike the live API, this writes every field — see the doc.
      const a = addressRepo.update(ctx.companyId, Number(params.addressId), body);
      return a ? HttpResponse.json(a) : notFound('Address not found');
    }
  ),

  http.delete(
    '*/user-management/company/:companyId/addresses/:addressId/',
    async ({ request, params }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      if (!addressRepo.remove(ctx.companyId, Number(params.addressId))) {
        return notFound('Address not found');
      }
      return HttpResponse.json({ message: 'Address deleted' });
    }
  ),

  // ─────────────────────────── Invoices ───────────────────────────

  http.get('*/user-management/company/:companyId/billings/', async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    return HttpResponse.json(invoiceRepo.list(ctx.companyId));
  }),

  http.get(
    '*/user-management/company/:companyId/billings/:billingId/',
    async ({ request, params }) => {
      const ctx = await context(request);
      if (isFail(ctx)) return ctx.fail;
      const i = invoiceRepo.get(ctx.companyId, Number(params.billingId));
      return i ? HttpResponse.json(i) : notFound('Invoice not found');
    }
  ),

  // ─────────────────────────── Coupons ───────────────────────────

  http.post('*/user-management/company/:companyId/coupons/', async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as ApplyCouponRequest;
    if (!body.coupon_code?.trim()) {
      return fieldErrors({ coupon_code: ['This field is required.'] });
    }

    const applied = couponRepo.apply(body.coupon_code);
    if (!applied) {
      // The live API answers 404 {path, error}; `path` is dropped as always null.
      return HttpResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return HttpResponse.json(applied);
  }),

  // ─────────────────────────── Change email ───────────────────────────

  http.put(`*${UM_PATHS.changeEmail}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as ChangeEmailRequest;
    if (!body.email || !EMAIL_RE.test(body.email)) {
      return fieldErrors({ email: ['Enter a valid email address.'] });
    }
    if (
      body.email.trim().toLowerCase() !== ctx.user.email &&
      authRepo.emailTaken(body.email)
    ) {
      return fieldErrors({ email: ['This email is already in use.'] });
    }

    // The live API sends a confirmation link rather than changing the address
    // immediately, so the mock does the same: no mutation here.
    return HttpResponse.json({
      message: `Email sent successfully to '${body.email}'.`,
    });
  }),

  // ─────────────────────────── AI generation ───────────────────────────

  http.post(`*${UM_PATHS.generateJobDescription}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as GenerateJobDescriptionRequest;
    if (!body.job_title?.trim()) {
      return fieldErrors({ job_title: ['This field is required.'] });
    }
    return HttpResponse.json(generateRepo.jobDescription(body.job_title));
  }),

  http.post(`*${UM_PATHS.generateJobQuestions}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as GenerateJobQuestionsRequest;
    const errors: Record<string, string[]> = {};
    if (!body.job_title?.trim()) errors.job_title = ['This field is required.'];
    if (!body.total || body.total < 1) errors.total = ['Must be at least 1.'];
    if (Object.keys(errors).length > 0) return fieldErrors(errors);

    return HttpResponse.json(
      generateRepo.jobQuestions(body.job_title, body.total)
    );
  }),

  http.post(`*${UM_PATHS.generateEvaluationFactors}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;

    const body = (await request.json()) as { job_id?: number | string };
    if (body.job_id === undefined || body.job_id === '') {
      return fieldErrors({ job_id: ['This field is required.'] });
    }
    return HttpResponse.json(generateRepo.evaluationFactors());
  }),

  // ─────────────────────────── Misc ───────────────────────────

  // GET /user-management/job-titles/
  http.get(`*${UM_PATHS.jobTitles}`, async ({ request }) => {
    const ctx = await context(request);
    if (isFail(ctx)) return ctx.fail;
    return HttpResponse.json(miscRepo.jobTitles());
  }),
];
