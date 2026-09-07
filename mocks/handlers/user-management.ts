import { http, HttpResponse, delay } from 'msw';
import { UM_PATHS } from '@/lib/api/user-management-contract';
import { userMeResponse, myCompaniesResponse } from './auth';
import { findUser } from '../db/auth.db';
import {
  getCompany,
  updateCompany,
  getRoster,
  inviteMember as inviteMemberDb,
  changeMemberRole as changeMemberRoleDb,
  removeMember as removeMemberDb,
  getSubscription,
  enableFreeCredits as enableFreeCreditsDb,
  getCreditRecords,
  getSmtp,
  saveSmtp,
  COUPONS,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getTrustedOrigin,
  addTrustedOrigin,
  removeTrustedOrigin,
  verifyTrustedOriginTxt,
  JOB_TITLES,
} from '../db/user-management.db';
import { detailError, fieldError, plainError } from '../lib/error-envelopes';

function bearerEmail(request: Request): string | null {
  return request.headers.get('X-Mock-User-Email');
}

export const umHandlers = [
  // GET/me and my-companies are shared verbatim with the auth doc.
  http.get(`*${UM_PATHS.me}`, ({ request }) => userMeResponse(request)),
  http.get(`*${UM_PATHS.myCompanies}`, ({ request }) => myCompaniesResponse(request)),

  http.patch(`*${UM_PATHS.me}`, async ({ request }) => {
    await delay(400);
    const email = bearerEmail(request);
    const user = email ? findUser(email) : undefined;
    if (!user) return HttpResponse.json(detailError('Authentication credentials were not provided.'), { status: 401 });
    const patch = (await request.json()) as {
      first_name?: string;
      last_name?: string;
      timezone?: string;
      language?: string;
      profile_pic?: string | null;
      notification_skipped?: boolean;
    };
    if (patch.first_name !== undefined) user.firstName = patch.first_name;
    if (patch.last_name !== undefined) user.lastName = patch.last_name;
    return userMeResponse(request);
  }),

  http.post(`*${UM_PATHS.changePassword}`, async ({ request }) => {
    await delay(500);
    const { old_password, new_password } = (await request.json()) as {
      old_password: string;
      new_password: string;
    };
    const email = bearerEmail(request);
    const user = email ? findUser(email) : undefined;
    if (!user) return HttpResponse.json(detailError('Authentication credentials were not provided.'), { status: 401 });
    if (old_password !== user.password) {
      return HttpResponse.json(fieldError({ old_password: 'Current password is incorrect.' }), {
        status: 400,
      });
    }
    if (new_password.length < 8) {
      return HttpResponse.json(
        fieldError({ new_password: 'Password must be at least 8 characters.' }),
        { status: 400 }
      );
    }
    user.password = new_password;
    return HttpResponse.json({ message: 'Password updated successfully' });
  }),

  http.put(`*${UM_PATHS.changeEmail}`, async ({ request }) => {
    await delay(400);
    const { email } = (await request.json()) as { email: string };
    return HttpResponse.json({ message: `Email sent successfully to '${email}'.` });
  }),

  http.get(`*${UM_PATHS.companyDetails(':companyId')}`, () => {
    return HttpResponse.json(getCompany());
  }),

  http.put(`*${UM_PATHS.companyDetails(':companyId')}`, async ({ request }) => {
    await delay(400);
    const patch = (await request.json()) as { company_name?: string; company_website?: string };
    if (patch.company_name !== undefined && !patch.company_name.trim()) {
      return HttpResponse.json(fieldError({ company_name: 'This field may not be blank.' }), {
        status: 400,
      });
    }
    return HttpResponse.json(updateCompany(patch));
  }),

  http.get(`*${UM_PATHS.subscription(':companyId')}`, () => {
    return HttpResponse.json(getSubscription());
  }),

  http.get(`*${UM_PATHS.creditRecords(':companyId')}`, () => {
    return HttpResponse.json(getCreditRecords());
  }),

  http.post(`*${UM_PATHS.enableFreeCredits(':companyId')}`, async () => {
    await delay(400);
    enableFreeCreditsDb();
    return HttpResponse.json({ message: 'Free credits added' });
  }),

  http.get(`*${UM_PATHS.members(':companyId')}`, () => {
    return HttpResponse.json(getRoster());
  }),

  http.post(`*${UM_PATHS.members(':companyId')}`, async ({ request }) => {
    await delay(500);
    const { email, role } = (await request.json()) as { email: string; role: 'MA' | 'EX' };
    if (role !== 'MA' && role !== 'EX') {
      return HttpResponse.json(fieldError({ role: `"${role}" is not a valid choice.` }), { status: 400 });
    }
    const { alreadyExists } = inviteMemberDb(email, role);
    if (alreadyExists) {
      return HttpResponse.json(
        fieldError({ email: 'This person is already a member or has a pending invite.' }),
        { status: 400 }
      );
    }
    return HttpResponse.json({ message: 'Invitation sent' });
  }),

  http.put('*/user-management/company/:companyId/members/:memberId/', async ({ request, params }) => {
    await delay(400);
    const { role } = (await request.json()) as { role: 'MA' | 'EX' };
    const updated = changeMemberRoleDb(Number(params.memberId), role);
    if (!updated) return HttpResponse.json(detailError('Not found.'), { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.delete('*/user-management/company/:companyId/members/:memberId/', async ({ params }) => {
    await delay(400);
    removeMemberDb(Number(params.memberId));
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`*${UM_PATHS.smtpSettings(':companyId')}`, () => {
    const smtp = getSmtp();
    if (!smtp) return HttpResponse.json(detailError('Not found.'), { status: 404 });
    return HttpResponse.json(smtp);
  }),

  http.post(`*${UM_PATHS.smtpSettings(':companyId')}`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as {
      smtp_host: string;
      smtp_port: number;
      smtp_username: string;
      smtp_password: string;
      from_email: string;
      from_name: string;
      use_tls: boolean;
      use_ssl: boolean;
    };
    for (const key of ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email'] as const) {
      if (!body[key]) {
        return HttpResponse.json(fieldError({ [key]: 'This field is required.' }), { status: 400 });
      }
    }
    return HttpResponse.json(saveSmtp(body), { status: 201 });
  }),

  http.post(`*${UM_PATHS.smtpVerify(':companyId')}`, async ({ request }) => {
    await delay(1000);
    const { email } = (await request.json()) as { email: string };
    return HttpResponse.json({ message: `Test email sent to ${email}` });
  }),

  http.post(`*${UM_PATHS.coupons(':companyId')}`, async ({ request }) => {
    await delay(400);
    const { coupon_code } = (await request.json()) as { coupon_code: string };
    const normalized = coupon_code.trim().toUpperCase();
    const pct = COUPONS[normalized];
    if (!pct) {
      return HttpResponse.json(plainError('Coupon not found'), { status: 404 });
    }
    return HttpResponse.json({
      message: `Coupon applied — ${pct}% off the first year.`,
      coupon: normalized,
      plans: [],
    });
  }),

  http.get(`*${UM_PATHS.addresses(':companyId')}`, () => {
    return HttpResponse.json(getAddresses());
  }),

  http.post(`*${UM_PATHS.addresses(':companyId')}`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Parameters<typeof addAddress>[0];
    return HttpResponse.json(addAddress(body), { status: 201 });
  }),

  http.put('*/user-management/company/:companyId/addresses/:addressId/', async ({ request, params }) => {
    await delay(400);
    const body = (await request.json()) as Parameters<typeof updateAddress>[1];
    const updated = updateAddress(Number(params.addressId), body);
    if (!updated) return HttpResponse.json(detailError('Not found.'), { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.delete('*/user-management/company/:companyId/addresses/:addressId/', async ({ params }) => {
    await delay(400);
    deleteAddress(Number(params.addressId));
    return HttpResponse.json({ message: 'Address deleted' });
  }),

  http.get(`*${UM_PATHS.trustedOrigins(':companyId')}`, () => {
    const origin = getTrustedOrigin();
    return HttpResponse.json({ details: origin ?? { verified: false, verification: [] } });
  }),

  http.post(`*${UM_PATHS.trustedOrigins(':companyId')}`, async ({ request }) => {
    await delay(400);
    const { domain } = (await request.json()) as { domain: string; company: number };
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      return HttpResponse.json(fieldError({ domain: 'Enter a valid domain name.' }), { status: 400 });
    }
    return HttpResponse.json({ details: addTrustedOrigin(domain) });
  }),

  http.delete(`*${UM_PATHS.trustedOrigins(':companyId')}`, async () => {
    await delay(300);
    removeTrustedOrigin();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`*${UM_PATHS.domainCheckTxt(':companyId')}`, async () => {
    await delay(600);
    const ok = verifyTrustedOriginTxt();
    if (!ok) {
      return HttpResponse.json(plainError('No TXT record found for this domain.'), { status: 400 });
    }
    return HttpResponse.json({ message: 'Domain verified successfully' });
  }),

  http.post(`*${UM_PATHS.domainCheckCname}`, async () => {
    await delay(600);
    return HttpResponse.json({ message: 'CNAME record verified' });
  }),

  http.get(`*${UM_PATHS.jobTitles}`, () => {
    return HttpResponse.json(JOB_TITLES);
  }),
];
