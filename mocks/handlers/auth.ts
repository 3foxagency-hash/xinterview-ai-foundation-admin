import { http, HttpResponse, delay } from 'msw';
import { AUTH_PATHS } from '@/lib/api/auth-contract';
import {
  findUser,
  createUser,
  setVerified,
  setCompany,
  recordFailedLogin,
  clearFailedLogins,
  isLockedOut,
  issueOtp,
  peekOtp,
  OTP_CODES,
  INVITE_SLUGS,
} from '../db/auth.db';
import { detailError, fieldError, messagesError, nonFieldError } from '../lib/error-envelopes';

function fakeJwt(): string {
  return `eyJhbGciOi.${Math.random().toString(36).slice(2)}.${Math.random().toString(36).slice(2)}`;
}

function bearerEmail(request: Request): string | null {
  // Mock-only shortcut: the fake access token doesn't encode identity, so
  // handlers that need "the signed-in user" read it from a header the client
  // sets alongside Authorization. See mocks/browser.ts wiring notes.
  return request.headers.get('X-Mock-User-Email');
}

export const authHandlers = [
  http.post(`*${AUTH_PATHS.login}`, async ({ request }) => {
    await delay(400);
    const { email, password } = (await request.json()) as { email: string; password: string };

    if (isLockedOut(email)) {
      return HttpResponse.json(detailError('Too many failed attempts. Try again later.'), {
        status: 429,
        headers: { 'Retry-After': '900' },
      });
    }

    const user = findUser(email);
    if (!user || user.password !== password) {
      recordFailedLogin(email);
      return HttpResponse.json(detailError('Invalid credentials'), { status: 404 });
    }
    clearFailedLogins(email);

    return HttpResponse.json({
      access_token: fakeJwt(),
      refresh_token: fakeJwt(),
      last_seen_monitor: fakeJwt(),
    });
  }),

  http.post(`*${AUTH_PATHS.register}`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      company?: number;
    };

    if (findUser(body.email)) {
      return HttpResponse.json(fieldError({ email: 'Email is already registered.' }), {
        status: 400,
      });
    }
    for (const [key, label] of [
      ['email', 'Email'],
      ['password', 'Password'],
      ['first_name', 'First name'],
      ['last_name', 'Last name'],
    ] as const) {
      if (!body[key]) {
        return HttpResponse.json(fieldError({ [key]: 'This field is required.' }), { status: 400 });
      }
    }

    createUser({
      email: body.email,
      password: body.password,
      firstName: body.first_name,
      lastName: body.last_name,
      companyId: body.company,
    });
    const invite = body.company !== undefined ? Object.values(INVITE_SLUGS).find((i) => i.id === body.company) : undefined;

    return HttpResponse.json(
      {
        access_token: fakeJwt(),
        refresh_token: fakeJwt(),
        last_seen_monitor: fakeJwt(),
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name,
        ...(invite ? { joining_company_details: invite } : {}),
      },
      { status: 201 }
    );
  }),

  http.post(`*${AUTH_PATHS.refresh}`, async ({ request }) => {
    await delay(200);
    const { refresh } = (await request.json()) as { refresh?: string };
    if (!refresh) {
      return HttpResponse.json(detailError('Token is invalid', 'token_not_valid'), { status: 401 });
    }
    return HttpResponse.json({ access_token: fakeJwt() });
  }),

  http.get(`*${AUTH_PATHS.me}`, ({ request }) => {
    return userMeResponse(request);
  }),

  http.get(`*${AUTH_PATHS.myCompanies}`, ({ request }) => {
    return myCompaniesResponse(request);
  }),

  http.post(`*${AUTH_PATHS.sendVerificationEmail}`, async ({ request }) => {
    await delay(300);
    const email = bearerEmail(request);
    if (!email) return HttpResponse.json(detailError('Authentication credentials were not provided.'), { status: 401 });
    issueOtp(email);
    return HttpResponse.json({ message: 'Verification email sent successfully.' });
  }),

  http.post(`*${AUTH_PATHS.verifyEmail}`, async ({ request }) => {
    await delay(300);
    const email = bearerEmail(request);
    if (!email) return HttpResponse.json(detailError('Authentication credentials were not provided.'), { status: 401 });
    const { otp } = (await request.json()) as { otp: string };
    if (otp === OTP_CODES.expired) {
      return HttpResponse.json(detailError('OTP has expired'), { status: 403 });
    }
    const expected = peekOtp(email) ?? OTP_CODES.valid;
    if (otp !== expected) {
      return HttpResponse.json(detailError('OTP has mismatch'), { status: 403 });
    }
    setVerified(email, true);
    return HttpResponse.json({ email, message: 'Email Verified Successfully' });
  }),

  http.post(`*${AUTH_PATHS.forgotPassword}`, async ({ request }) => {
    await delay(400);
    const { email } = (await request.json()) as { email: string };
    // Deliberately does not distinguish known/unknown addresses — see backend
    // issue 2 in the doc: the mock does not reproduce the enumeration leak.
    issueOtp(email);
    return HttpResponse.json({ email, message: 'Password reset email sent.' });
  }),

  http.post(`*${AUTH_PATHS.resetPasswordOtp}`, async ({ request }) => {
    await delay(300);
    const { email, otp } = (await request.json()) as { email: string; otp: string };
    if (otp === OTP_CODES.expired) {
      return HttpResponse.json(detailError('OTP has expired'), { status: 403 });
    }
    const expected = peekOtp(email) ?? OTP_CODES.valid;
    if (otp !== expected) {
      return HttpResponse.json(detailError('OTP has mismatch'), { status: 403 });
    }
    const uid = findUser(email)?.id ?? 0;
    return HttpResponse.json({ token: `${uid}?${Math.random().toString(16).slice(2)}` });
  }),

  http.post('*/auth/reset-password/:token/', async ({ request, params }) => {
    await delay(400);
    const { password, re_password } = (await request.json()) as {
      password: string;
      re_password: string;
    };
    if (password !== re_password) {
      return HttpResponse.json(nonFieldError(['Password Mismatch']), { status: 400 });
    }
    if (!params.token || params.token === 'used') {
      return HttpResponse.json(messagesError('Token has been expired!, Bad or expired Token'), {
        status: 400,
      });
    }
    return HttpResponse.json({ message: 'Password changed successfully' });
  }),

  http.post(`*${AUTH_PATHS.lastSeen}`, async ({ request }) => {
    await delay(150);
    const body = (await request.json().catch(() => ({}))) as { last_seen_monitor?: string };
    return HttpResponse.json({
      last_seen_monitor: body.last_seen_monitor ?? fakeJwt(),
      expired: false,
    });
  }),

  http.post(`*${AUTH_PATHS.createCompany}`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as {
      company_name: string;
      account_team_size: string;
      account_type: 'CO' | 'AG';
      business_type: string;
      company_website?: string;
    };
    for (const key of ['company_name', 'account_team_size', 'account_type', 'business_type'] as const) {
      if (!body[key]) {
        return HttpResponse.json(fieldError({ [key]: 'This field is required.' }), { status: 400 });
      }
    }
    const email = bearerEmail(request);
    if (email) setCompany(email, 64);
    return HttpResponse.json(
      {
        id: 64,
        company_name: body.company_name,
        account_type: body.account_type,
        business_type: body.business_type,
        account_team_size: body.account_team_size,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.post('*/user-management/:companyId/join/', async ({ request }) => {
    await delay(400);
    const email = bearerEmail(request);
    if (email) setCompany(email, 64);
    return HttpResponse.json({ message: 'Joined company successfully' });
  }),

  http.get('*/companies/invite/:slug', async ({ params }) => {
    await delay(300);
    const invite = INVITE_SLUGS[String(params.slug)];
    if (!invite) {
      return HttpResponse.json(detailError('This invite is invalid or has expired.'), { status: 404 });
    }
    return HttpResponse.json(invite);
  }),
];

// Shared with mocks/handlers/user-management.ts since both docs document the
// same GET /user-management/me/ response — kept here to own one seed source
// per user, next to the auth db it reads from.
export function userMeResponse(request: Request) {
  const email = bearerEmail(request) ?? 'admin@xinterview.ai';
  const user = findUser(email);
  if (!user) {
    return HttpResponse.json(detailError('Authentication credentials were not provided.'), { status: 401 });
  }
  return HttpResponse.json(buildCurrentUser(user));
}

export function myCompaniesResponse(request: Request) {
  const email = bearerEmail(request) ?? 'admin@xinterview.ai';
  const user = findUser(email);
  if (!user) {
    return HttpResponse.json(detailError('Authentication credentials were not provided.'), { status: 401 });
  }
  const u = buildCurrentUser(user);
  return HttpResponse.json({
    admin_companies: u.admin_companies,
    managed_companies: u.managed_companies,
    exe_companies: u.exe_companies,
  });
}

function buildCurrentUser(user: ReturnType<typeof findUser> & {}) {
  return {
    id: user!.id,
    email: user!.email,
    first_name: user!.firstName,
    last_name: user!.lastName,
    timezone: 'Asia/Kolkata',
    language: 'English (UK)',
    profile_pic: null,
    is_verified: user!.verified,
    notification_skipped: false,
    company_created: user!.hasCompany,
    has_zoom_account: false,
    has_google_account: false,
    has_microsoft_account: false,
    created_at: '2026-05-18T06:21:49.295045Z',
    updated_at: '2026-08-06T13:29:30.963544Z',
    last_login: '2026-05-18T06:22:07.630298Z',
    admin_companies: user!.hasCompany
      ? {
          id: user!.companyId,
          company_name: 'Acme Corp',
          is_sub_active: true,
          account_team_size: '1-10',
          number_of_members: 4,
          plan_title: 'Growth Plan',
          subscription_date: '2026-07-24T14:08:40.746663Z',
        }
      : null,
    managed_companies: [],
    exe_companies: [],
  };
}
