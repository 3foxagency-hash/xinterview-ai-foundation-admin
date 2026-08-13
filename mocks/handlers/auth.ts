import { http, HttpResponse } from 'msw';
import {
  authRepo,
  otpRepo,
  resetTokenRepo,
  VALID_OTP,
  EXPIRED_OTP,
} from '../repo/auth';
import { applyScenario } from './scenario';
import { AUTH_PATHS, OTP_LENGTH } from '@/lib/api/auth-contract';
import type {
  LoginRequestBody,
  RegisterRequestBody,
  RefreshRequestBody,
  VerifyEmailRequestBody,
  ForgotPasswordRequestBody,
  ResetPasswordOtpRequestBody,
  ResetPasswordRequestBody,
  LastSeenRequestBody,
  CreateCompanyRequestBody,
} from '@/lib/api/auth-contract';
import type { MockUser } from '../db';
import { decodeBase64Url } from '../repo/base64';

/**
 * Auth handlers — modelled on the real XInterview backend.
 *
 * Behaviour and payloads were captured from the live dev API on 2026-08-13,
 * including its quirks: invalid credentials return 404 (not 401), and there are
 * three different error envelopes. Those are reproduced rather than tidied up,
 * because code written against a tidier mock breaks on contact with production.
 *
 * Paths use the SUGGESTED names from
 * docs/auth-api-xinterview-existing-with-suggested-changes.md — the frontend
 * builds against the target contract. See LEGACY_AUTH_PATHS for what dev serves
 * today.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Error envelopes, matching the three the real API uses ───

/** `{ "detail": "Invalid credentials" }` */
const detail = (status: number, message: string, code?: string) =>
  HttpResponse.json(code ? { detail: message, code } : { detail: message }, {
    status,
  });

/** `{ "email": ["This field is required."] }` — DRF field errors. */
const fieldErrors = (errors: Record<string, string[]>, status = 400) =>
  HttpResponse.json(errors, { status });

/** `{ "non_field_errors": ["Password Mismatch"] }` */
const nonFieldError = (message: string, status = 400) =>
  HttpResponse.json({ non_field_errors: [message] }, { status });

/**
 * Resolves the caller from the Authorization header.
 *
 * The mock JWT embeds the numeric user id, so a token issued by one mocked
 * login identifies that user on later calls — without this, every authenticated
 * endpoint would answer for the same hardcoded account.
 */
function authenticate(request: Request): MockUser | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as {
      user_id?: string;
    };
    if (!payload.user_id) return null;
    return authRepo.findById(Number(payload.user_id));
  } catch {
    return null;
  }
}

const unauthenticated = () =>
  detail(401, 'Authentication credentials were not provided.');

export const authHandlers = [
  // ─── POST /login/tokens ───
  http.post(`*${AUTH_PATHS.login}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as LoginRequestBody;

    // The live API returns a stringified Python dict here; the mock returns
    // proper DRF field errors instead, which is what the backend should send.
    const errors: Record<string, string[]> = {};
    if (!body.email) errors.email = ['This field is required.'];
    if (!body.password) errors.password = ['This field is required.'];
    if (Object.keys(errors).length > 0) return fieldErrors(errors);

    const outcome = authRepo.login(body.email, body.password);

    if (outcome.kind === 'locked') {
      // Mock-only affordance: the live API has no lockout. Kept so the UI's
      // lockout branch stays reachable locally.
      return HttpResponse.json(
        { detail: 'Too many failed attempts. Try again later.' },
        {
          status: 429,
          headers: { 'retry-after': String(outcome.retryAfterSeconds) },
        }
      );
    }

    // 404 rather than 401 — this is what the real API does, and the same
    // response is returned whether or not the account exists.
    if (outcome.kind === 'invalid_credentials') {
      return detail(404, 'Invalid credentials');
    }

    return HttpResponse.json(authRepo.tokensFor(outcome.user));
  }),

  // ─── POST /login/register ───
  http.post(`*${AUTH_PATHS.register}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as RegisterRequestBody;

    const errors: Record<string, string[]> = {};
    if (!body.email) errors.email = ['This field is required.'];
    else if (!EMAIL_RE.test(body.email)) {
      errors.email = ['Enter a valid email address.'];
    }
    if (!body.password) errors.password = ['This field is required.'];
    if (!body.first_name) errors.first_name = ['This field is required.'];
    if (!body.last_name) errors.last_name = ['This field is required.'];
    if (Object.keys(errors).length > 0) return fieldErrors(errors);

    if (authRepo.emailTaken(body.email)) {
      return fieldErrors({ email: ['Email is already registered.'] });
    }

    return HttpResponse.json(authRepo.register(body), { status: 201 });
  }),

  // ─── POST /api/token/refresh/ ───
  http.post(`*${AUTH_PATHS.refresh}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as RefreshRequestBody;
    if (!body.refresh) {
      return fieldErrors({ refresh: ['This field is required.'] });
    }

    const parts = body.refresh.split('.');
    if (parts.length !== 3) {
      return detail(401, 'Token is invalid', 'token_not_valid');
    }

    let user: MockUser | null = null;
    try {
      const payload = JSON.parse(decodeBase64Url(parts[1])) as {
        user_id?: string;
      };
      user = payload.user_id ? authRepo.findById(Number(payload.user_id)) : null;
    } catch {
      user = null;
    }
    if (!user) return detail(401, 'Token is invalid', 'token_not_valid');

    // The live API returns a bare `access` here. Standardised to `access_token`
    // per the doc, so one name means one thing across the whole contract.
    return HttpResponse.json({
      access_token: authRepo.tokensFor(user).access_token,
    });
  }),

  // ─── POST /login/last-seen — merged upsert ───
  http.post(`*${AUTH_PATHS.lastSeen}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const user = authenticate(request);
    if (!user) return unauthenticated();

    // Replaces update_last_seen + create_last_seen: sending no token creates
    // one, sending an existing token refreshes it.
    const body = (await request.json().catch(() => ({}))) as LastSeenRequestBody;
    const monitor = authRepo.tokensFor(user).last_seen_monitor;

    return HttpResponse.json({
      last_seen_monitor: monitor,
      expired: Boolean(body.last_seen_monitor) && false,
    });
  }),

  // ─── POST /login/send-verification-email/ ───
  http.post(`*${AUTH_PATHS.sendVerificationEmail}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const user = authenticate(request);
    if (!user) return unauthenticated();

    if (!otpRepo.recordResend(user.email)) {
      return detail(429, 'Too many verification emails requested.');
    }

    // Real API spells this `details`; normalised to `message`.
    return HttpResponse.json({
      message: 'Verification email sent successfully.',
    });
  }),

  // ─── POST /login/verify-email/ ───
  http.post(`*${AUTH_PATHS.verifyEmail}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const user = authenticate(request);
    if (!user) return unauthenticated();

    const body = (await request.json()) as VerifyEmailRequestBody;
    if (!body.otp || body.otp.length !== OTP_LENGTH) {
      return fieldErrors({ otp: ['This field is required.'] });
    }
    if (body.otp === EXPIRED_OTP) return detail(403, 'OTP has expired');
    // 403 with this exact message is what the real API returns.
    if (body.otp !== VALID_OTP) return detail(403, 'OTP has mismatch');

    authRepo.markVerified(user.email);
    return HttpResponse.json({
      email: user.email,
      message: 'Email Verified Successfully',
    });
  }),

  // ─── POST /login/forgot-password/ ───
  http.post(`*${AUTH_PATHS.forgotPassword}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as ForgotPasswordRequestBody;
    if (!body.email || !EMAIL_RE.test(body.email)) {
      return fieldErrors({ email: ['Enter a valid email address.'] });
    }

    // Deliberate divergence from the live API, which returns 400 "User account
    // not found." for unknown addresses — an account-enumeration oracle. The
    // mock always reports success; see docs/auth-api-real-contract.md.
    return HttpResponse.json({
      email: body.email,
      message: 'Password reset email sent.',
    });
  }),

  // ─── POST /login/reset-password/otp/ ───
  http.post(`*${AUTH_PATHS.resetPasswordOtp}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const body = (await request.json()) as ResetPasswordOtpRequestBody;
    if (!body.email) return fieldErrors({ email: ['This field is required.'] });
    if (!body.otp || body.otp.length !== OTP_LENGTH) {
      return fieldErrors({ otp: ['This field is required.'] });
    }

    if (body.otp === EXPIRED_OTP) return detail(403, 'OTP has expired');
    if (body.otp !== VALID_OTP) return detail(403, 'OTP has mismatch');

    return HttpResponse.json({ token: resetTokenRepo.issue(body.email) });
  }),

  // ─── POST /login/reset-password/{token}/ ───
  http.post('*/auth/reset-password/:token/', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const token = decodeURIComponent(String(params.token));
    const body = (await request.json()) as ResetPasswordRequestBody;

    if (!body.password || !body.re_password) {
      const errors: Record<string, string[]> = {};
      if (!body.password) errors.password = ['This field is required.'];
      if (!body.re_password) errors.re_password = ['This field is required.'];
      return fieldErrors(errors);
    }

    if (body.password !== body.re_password) {
      return nonFieldError('Password Mismatch');
    }

    // Reset tokens are single use; a replayed link must fail exactly as it does
    // in production.
    const email = resetTokenRepo.consume(token);
    if (!email) {
      return HttpResponse.json(
        { messages: 'Token has been expired!, Bad or expired Token' },
        { status: 400 }
      );
    }

    authRepo.setPassword(email, body.password);
    return HttpResponse.json({ message: 'Password changed successfully' });
  }),

  // ─── GET /user-management/me/ ───
  http.get(`*${AUTH_PATHS.me}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const user = authenticate(request);
    if (!user) return unauthenticated();

    return HttpResponse.json(authRepo.currentUser(user));
  }),

  // ─── GET /user-management/my-companies/ ───
  http.get(`*${AUTH_PATHS.myCompanies}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const user = authenticate(request);
    if (!user) return unauthenticated();

    return HttpResponse.json(authRepo.myCompanies(user));
  }),

  // ─── POST /companies/ ───
  http.post(`*${AUTH_PATHS.createCompany}`, async ({ request }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const user = authenticate(request);
    if (!user) return unauthenticated();

    const body = (await request.json()) as CreateCompanyRequestBody;

    const errors: Record<string, string[]> = {};
    if (!body.company_name) errors.company_name = ['This field is required.'];
    if (!body.account_team_size) {
      errors.account_team_size = ['This field is required.'];
    }
    if (!body.account_type) errors.account_type = ['This field is required.'];
    if (!body.business_type) errors.business_type = ['This field is required.'];
    if (Object.keys(errors).length > 0) return fieldErrors(errors);

    return HttpResponse.json(authRepo.createCompany(user, body), {
      status: 201,
    });
  }),

  // ─── POST /companies/{companyId}/join/ ───
  http.post('*/user-management/:companyId/join/', async ({ request, params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const user = authenticate(request);
    if (!user) return unauthenticated();

    const companyId = Number(params.companyId);
    if (!Number.isFinite(companyId)) {
      return detail(404, 'Company not found');
    }
    if (!authRepo.joinCompany(user, companyId)) {
      return detail(404, 'Company not found');
    }

    return HttpResponse.json({ message: 'Joined company successfully' });
  }),

  // ─── GET /companies/invite/{slug} ───
  // Not in the live API. The signup page resolves a slug from the invite link
  // before the user has a token, so the mock provides it; flagged as a
  // frontend-proposed endpoint in docs/auth-api-real-contract.md.
  http.get('*/companies/invite/:slug', async ({ params }) => {
    const scenario = await applyScenario();
    if (scenario) return scenario;

    const invite = authRepo.companyBySlug(String(params.slug));
    if (!invite) return detail(404, 'This invite is invalid or has expired.');
    return HttpResponse.json(invite);
  }),
];
