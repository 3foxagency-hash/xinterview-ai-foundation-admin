import { db } from '../db';
import type {
  MockAddress,
  MockInvoice,
  MockCompanyMember,
  MockEmailTemplate,
  MockSmsTemplate,
  MockSmtp,
} from '../db';
import type {
  CompanyDetails,
  CompanyMember,
  CompanyInvitee,
  CompanyMemberRole,
  MembersResponse,
  Subscription,
  CreditRecord,
  SmtpSettings,
  SmtpSettingsRequest,
  EmailTemplate,
  EmailTemplateRequest,
  SmsTemplate,
  SmsTemplateRequest,
  LandingPage,
  UpdateLandingPageRequest,
  TrustedOriginResponse,
  JobTitle,
  BillingAddress,
  BillingAddressRequest,
  Invoice,
  ApplyCouponResponse,
  GenerateJobDescriptionResponse,
  GenerateJobQuestionsResponse,
  GenerateEvaluationFactorsResponse,
} from '@/lib/api/user-management-contract';

/**
 * User-management repository.
 *
 * Every function takes `companyId` **first**, so tenant scoping is a
 * compile-time property rather than a discipline — a mock that ignores
 * companies would happily hide the cross-tenant leak that is the worst bug this
 * product can ship.
 *
 * Handlers call these and never touch the store directly, which keeps the
 * storage choice reversible.
 */

// ─── Company ───

export const companyRepo = {
  details(companyId: number): CompanyDetails | null {
    for (const org of db().organisations.values()) {
      if (org.numericId !== companyId) continue;
      return {
        id: org.numericId,
        company_name: org.name,
        logo: null,
        account_type: 'CO',
        account_team_size: org.size,
        business_type: org.type,
        company_website: org.website,
        phone_number: null,
        created_at: '2026-07-24T14:08:40.746663Z',
        is_active: true,
        domain_name: null,
        is_domain_verified: false,
      };
    }
    return null;
  },

  update(
    companyId: number,
    patch: Partial<{ company_name: string; company_website: string | null }>
  ): CompanyDetails | null {
    for (const org of db().organisations.values()) {
      if (org.numericId !== companyId) continue;
      if (patch.company_name !== undefined) org.name = patch.company_name;
      if (patch.company_website !== undefined) org.website = patch.company_website;
      return companyRepo.details(companyId);
    }
    return null;
  },

  subscription(companyId: number): Subscription | null {
    const s = db().subscriptions.get(companyId);
    if (!s) return null;
    return {
      id: 1,
      plan: {
        id: 1,
        title: s.planTitle,
        price: s.planPrice,
        interval: s.planInterval,
        max_jobs: null,
        max_candidates: 100,
        max_team_members: 10,
      },
      total_jobs_created: String(s.jobsCreated),
      total_candidate_interviewed: String(s.candidatesInterviewed),
      total_team_members: String(s.teamMembers),
      credits: String(s.credits),
      sms_credits: String(s.smsCredits),
      renewal_date: s.renewalDate,
      subscription_date: s.subscriptionDate,
      expiration_date: s.expirationDate,
      status: s.status,
      auto_bill: s.autoBill,
      cancel_at_period_end: s.cancelAtPeriodEnd,
      availed_free_credits: s.availedFreeCredits,
      ai_feature_enabled: 'true',
      company: companyId,
    };
  },

  creditRecords(companyId: number): CreditRecord[] {
    return (db().creditRecords.get(companyId) ?? []).map((r) => ({
      expiry_date: r.expiryDate,
      used_credit: r.usedCredit,
      max_allowed: r.maxAllowed,
      is_active: r.isActive,
      is_sub_credit: r.isSubCredit,
    }));
  },

  /** Returns false when the company has already claimed its free credits. */
  enableFreeCredits(companyId: number): boolean {
    const s = db().subscriptions.get(companyId);
    if (!s || s.availedFreeCredits) return false;
    s.availedFreeCredits = true;
    s.credits += 25;
    return true;
  },
};

// ─── Team ───

function toMember(m: MockCompanyMember): CompanyMember {
  return {
    id: m.id,
    email: m.email,
    first_name: m.firstName,
    last_name: m.lastName,
    role: m.role,
    profile_pic: m.profilePic,
    last_login: m.lastLogin,
  };
}

export const teamRepo = {
  /**
   * The API groups by role rather than returning a flat list. Preserved because
   * the team screen renders managers and executives as separate sections.
   */
  roster(companyId: number): MembersResponse {
    const store = db();
    const mine = [...store.companyMembers.values()].filter(
      (m) => m.companyNumericId === companyId
    );
    const invitees: CompanyInvitee[] = [...store.invitees.values()]
      .filter((i) => i.companyNumericId === companyId)
      .map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        invited_at: i.invitedAt,
      }));
    return {
      managers: mine.filter((m) => m.role === 'MA').map(toMember),
      executives: mine.filter((m) => m.role === 'EX').map(toMember),
      invitees,
    };
  },

  emailTaken(companyId: number, email: string): boolean {
    const target = email.trim().toLowerCase();
    const store = db();
    for (const m of store.companyMembers.values()) {
      if (m.companyNumericId === companyId && m.email === target) return true;
    }
    for (const i of store.invitees.values()) {
      if (i.companyNumericId === companyId && i.email === target) return true;
    }
    return false;
  },

  invite(companyId: number, email: string, role: CompanyMemberRole): CompanyInvitee {
    const store = db();
    const id =
      Math.max(600, ...[...store.invitees.values()].map((i) => i.id)) + 1;
    const invitee = {
      id,
      companyNumericId: companyId,
      email: email.trim().toLowerCase(),
      role,
      invitedAt: new Date().toISOString(),
    };
    store.invitees.set(id, invitee);
    return {
      id,
      email: invitee.email,
      role,
      invited_at: invitee.invitedAt,
    };
  },

  findMember(companyId: number, memberId: number): MockCompanyMember | null {
    const m = db().companyMembers.get(memberId);
    return m && m.companyNumericId === companyId ? m : null;
  },

  changeRole(
    companyId: number,
    memberId: number,
    role: CompanyMemberRole
  ): CompanyMember | null {
    const m = teamRepo.findMember(companyId, memberId);
    if (!m) return null;
    m.role = role;
    return toMember(m);
  },

  /** Removes a member or a pending invitee; returns false when neither exists. */
  remove(companyId: number, memberId: number): boolean {
    const store = db();
    const m = teamRepo.findMember(companyId, memberId);
    if (m) {
      store.companyMembers.delete(memberId);
      return true;
    }
    const invitee = store.invitees.get(memberId);
    if (invitee && invitee.companyNumericId === companyId) {
      store.invitees.delete(memberId);
      return true;
    }
    return false;
  },
};

// ─── SMTP ───

function toSmtp(s: MockSmtp): SmtpSettings {
  return {
    id: s.id,
    smtp_host: s.host,
    smtp_port: s.port,
    smtp_username: s.username,
    from_email: s.fromEmail,
    from_name: s.fromName,
    use_tls: s.useTls,
    use_ssl: s.useSsl,
    is_verified: s.isVerified,
  };
}

export const smtpRepo = {
  get(companyId: number): SmtpSettings | null {
    const s = db().smtp.get(companyId);
    return s ? toSmtp(s) : null;
  },

  save(companyId: number, input: SmtpSettingsRequest): SmtpSettings {
    const store = db();
    const existing = store.smtp.get(companyId);
    const record: MockSmtp = {
      id: existing?.id ?? companyId,
      companyNumericId: companyId,
      host: input.smtp_host,
      port: input.smtp_port,
      username: input.smtp_username,
      password: input.smtp_password,
      fromEmail: input.from_email,
      fromName: input.from_name,
      useTls: input.use_tls,
      useSsl: input.use_ssl,
      // Changing the configuration invalidates a previous verification.
      isVerified: false,
    };
    store.smtp.set(companyId, record);
    return toSmtp(record);
  },

  remove(companyId: number): boolean {
    return db().smtp.delete(companyId);
  },

  /** Marks the configuration verified. Fails when nothing is configured. */
  verify(companyId: number): boolean {
    const s = db().smtp.get(companyId);
    if (!s) return false;
    s.isVerified = true;
    return true;
  },
};

// ─── Templates ───

function toEmailTemplate(t: MockEmailTemplate): EmailTemplate {
  return {
    id: t.id,
    title: t.title,
    subject: t.subject,
    body: t.body,
    is_active: t.isActive,
    created_at: t.createdAt,
  };
}

function toSmsTemplate(t: MockSmsTemplate): SmsTemplate {
  return { id: t.id, title: t.title, body: t.body, is_active: t.isActive };
}

export const templateRepo = {
  listEmail(companyId: number): EmailTemplate[] {
    return [...db().emailTemplates.values()]
      .filter((t) => t.companyNumericId === companyId)
      .sort((a, b) => a.id - b.id)
      .map(toEmailTemplate);
  },

  getEmail(companyId: number, templateId: number): EmailTemplate | null {
    const t = db().emailTemplates.get(templateId);
    return t && t.companyNumericId === companyId ? toEmailTemplate(t) : null;
  },

  createEmail(companyId: number, input: EmailTemplateRequest): EmailTemplate {
    const store = db();
    const id =
      Math.max(700, ...[...store.emailTemplates.values()].map((t) => t.id)) + 1;
    const t: MockEmailTemplate = {
      id,
      companyNumericId: companyId,
      title: input.title ?? 'Untitled template',
      subject: input.subject,
      body: input.body,
      isActive: input.is_active,
      createdAt: new Date().toISOString(),
    };
    store.emailTemplates.set(id, t);
    return toEmailTemplate(t);
  },

  updateEmail(
    companyId: number,
    templateId: number,
    patch: Partial<EmailTemplateRequest>
  ): EmailTemplate | null {
    const t = db().emailTemplates.get(templateId);
    if (!t || t.companyNumericId !== companyId) return null;
    if (patch.title !== undefined) t.title = patch.title;
    if (patch.subject !== undefined) t.subject = patch.subject;
    if (patch.body !== undefined) t.body = patch.body;
    if (patch.is_active !== undefined) t.isActive = patch.is_active;
    return toEmailTemplate(t);
  },

  deleteEmail(companyId: number, templateId: number): boolean {
    const t = db().emailTemplates.get(templateId);
    if (!t || t.companyNumericId !== companyId) return false;
    return db().emailTemplates.delete(templateId);
  },

  listSms(companyId: number): SmsTemplate[] {
    return [...db().smsTemplates.values()]
      .filter((t) => t.companyNumericId === companyId)
      .sort((a, b) => a.id - b.id)
      .map(toSmsTemplate);
  },

  getSms(companyId: number, templateId: number): SmsTemplate | null {
    const t = db().smsTemplates.get(templateId);
    return t && t.companyNumericId === companyId ? toSmsTemplate(t) : null;
  },

  createSms(companyId: number, input: SmsTemplateRequest): SmsTemplate {
    const store = db();
    const id =
      Math.max(800, ...[...store.smsTemplates.values()].map((t) => t.id)) + 1;
    const t: MockSmsTemplate = {
      id,
      companyNumericId: companyId,
      title: input.title ?? 'Untitled template',
      body: input.body,
      isActive: input.is_active,
    };
    store.smsTemplates.set(id, t);
    return toSmsTemplate(t);
  },

  updateSms(
    companyId: number,
    templateId: number,
    patch: Partial<SmsTemplateRequest>
  ): SmsTemplate | null {
    const t = db().smsTemplates.get(templateId);
    if (!t || t.companyNumericId !== companyId) return null;
    if (patch.title !== undefined) t.title = patch.title;
    if (patch.body !== undefined) t.body = patch.body;
    if (patch.is_active !== undefined) t.isActive = patch.is_active;
    return toSmsTemplate(t);
  },

  deleteSms(companyId: number, templateId: number): boolean {
    const t = db().smsTemplates.get(templateId);
    if (!t || t.companyNumericId !== companyId) return false;
    return db().smsTemplates.delete(templateId);
  },
};

// ─── Landing page ───

export const landingPageRepo = {
  get(companyId: number): LandingPage | null {
    const lp = db().landingPages.get(companyId);
    return lp ? (lp.data as unknown as LandingPage) : null;
  },

  update(
    companyId: number,
    patch: UpdateLandingPageRequest
  ): LandingPage | null {
    const lp = db().landingPages.get(companyId);
    if (!lp) return null;
    lp.data = { ...lp.data, ...patch };
    return lp.data as unknown as LandingPage;
  },
};

// ─── Domain verification ───

export const domainRepo = {
  get(companyId: number) {
    return db().trustedOrigins.get(companyId) ?? null;
  },

  /** Registers a domain and returns the TXT record the user must publish. */
  addTrustedOrigin(companyId: number, domain: string): TrustedOriginResponse {
    const store = db();
    const existing = store.trustedOrigins.get(companyId);
    const txtValue =
      existing?.txtValue ??
      `xinterview-verify=${Math.random().toString(16).slice(2, 10)}`;
    store.trustedOrigins.set(companyId, {
      companyNumericId: companyId,
      domain,
      verified: false,
      txtValue,
    });
    return {
      details: {
        verified: false,
        verification: [{ type: 'TXT', domain, value: txtValue }],
      },
    };
  },

  removeTrustedOrigin(companyId: number): boolean {
    return db().trustedOrigins.delete(companyId);
  },

  /**
   * Marks the domain verified.
   *
   * Mock-only affordance: a real DNS lookup cannot succeed locally, so
   * verification always succeeds once a domain is registered. Failure is
   * reachable via the dev panel's error scenario.
   */
  verify(companyId: number): boolean {
    const o = db().trustedOrigins.get(companyId);
    if (!o) return false;
    o.verified = true;
    return true;
  },
};


// ─── Billing address ───

function toAddress(a: MockAddress): BillingAddress {
  return {
    id: a.id,
    address_line1: a.line1,
    address_line2: a.line2,
    city: a.city,
    state: a.state,
    country: a.country,
    country_code: a.countryCode,
    zip_code: a.zipCode,
  };
}

export const addressRepo = {
  list(companyId: number): BillingAddress[] {
    return [...db().addresses.values()]
      .filter((a) => a.companyNumericId === companyId)
      .sort((a, b) => a.id - b.id)
      .map(toAddress);
  },

  get(companyId: number, addressId: number): BillingAddress | null {
    const a = db().addresses.get(addressId);
    return a && a.companyNumericId === companyId ? toAddress(a) : null;
  },

  create(companyId: number, input: BillingAddressRequest): BillingAddress {
    const store = db();
    const id = Math.max(0, ...[...store.addresses.values()].map((a) => a.id)) + 1;
    const a: MockAddress = {
      id,
      companyNumericId: companyId,
      line1: input.address_line1,
      line2: input.address_line2 ?? '',
      city: input.city,
      state: input.state,
      country: input.country,
      countryCode: input.country_code ?? '',
      zipCode: input.zip_code,
    };
    store.addresses.set(id, a);
    return toAddress(a);
  },

  /**
   * Full replace.
   *
   * The live API silently ignores `address_line1` and `address_line2` on PUT —
   * a real bug (see the doc). The mock writes every field, which is what a
   * correct implementation does.
   */
  update(
    companyId: number,
    addressId: number,
    input: BillingAddressRequest
  ): BillingAddress | null {
    const a = db().addresses.get(addressId);
    if (!a || a.companyNumericId !== companyId) return null;
    a.line1 = input.address_line1;
    a.line2 = input.address_line2 ?? '';
    a.city = input.city;
    a.state = input.state;
    a.country = input.country;
    a.countryCode = input.country_code ?? '';
    a.zipCode = input.zip_code;
    return toAddress(a);
  },

  remove(companyId: number, addressId: number): boolean {
    const a = db().addresses.get(addressId);
    if (!a || a.companyNumericId !== companyId) return false;
    return db().addresses.delete(addressId);
  },
};

// ─── Invoices ───

function toInvoice(i: MockInvoice): Invoice {
  return {
    id: i.id,
    plan: { id: i.planId, title: i.planTitle },
    invoice_number: i.invoiceNumber,
    amount: i.amount,
    currency: i.currency,
    payment_status: i.paymentStatus,
    payment_method: i.paymentMethod,
    payment_date: i.paymentDate,
    date: i.date,
    billing_type: i.billingType,
    quantity: i.quantity,
    hosted_invoice_url: i.hostedInvoiceUrl,
    invoice_pdf_url: i.invoicePdfUrl,
  };
}

export const invoiceRepo = {
  /** Newest first, which is how the billing table renders them. */
  list(companyId: number): Invoice[] {
    return [...db().invoices.values()]
      .filter((i) => i.companyNumericId === companyId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(toInvoice);
  },

  get(companyId: number, invoiceId: number): Invoice | null {
    const i = db().invoices.get(invoiceId);
    return i && i.companyNumericId === companyId ? toInvoice(i) : null;
  },
};

// ─── Coupons ───

export const couponRepo = {
  apply(code: string): ApplyCouponResponse | null {
    const c = db().coupons.get(code.trim().toUpperCase());
    if (!c) return null;
    return {
      message: `Coupon applied — ${c.description}.`,
      coupon: c.code,
      plans: [],
    };
  },
};

// ─── AI generation ───
//
// Deterministic output rather than random: a mock that returns different text
// on every call makes screenshots and tests unstable.

export const generateRepo = {
  jobDescription(jobTitle: string): GenerateJobDescriptionResponse {
    return {
      summary:
        `We are seeking a ${jobTitle} to design, build and maintain scalable ` +
        `products used by millions. You will work closely with product and ` +
        `engineering partners to deliver high-quality work.`,
      responsibilities: [
        `Own the delivery of ${jobTitle} projects from design through release.`,
        'Collaborate with cross-functional partners to define priorities.',
        'Review peers\' work and raise the quality bar across the team.',
        'Diagnose and resolve production issues.',
        'Contribute to technical planning and architectural decisions.',
      ],
      requirements: [
        `Proven experience in a ${jobTitle} or closely related role.`,
        'Strong communication and collaboration skills.',
        'Experience shipping and maintaining production software.',
        'A pragmatic approach to trade-offs and prioritisation.',
      ],
    };
  },

  jobQuestions(jobTitle: string, total: number): GenerateJobQuestionsResponse {
    // Alternates text and multiple-choice, matching what the live API returns.
    const questions = Array.from({ length: Math.max(1, Math.min(total, 20)) }, (_, i) =>
      i % 2 === 0
        ? {
            question_type: 'text',
            title: `Describe a challenging problem you solved as a ${jobTitle}, and the trade-offs you weighed.`,
            options: null,
          }
        : {
            question_type: 'single correct',
            title: `Which approach best reflects good practice for a ${jobTitle}?`,
            options: [
              'Optimise for the common case first',
              'Optimise every path equally',
              'Defer all optimisation indefinitely',
            ],
          }
    );
    return { title: jobTitle, questions };
  },

  evaluationFactors(): GenerateEvaluationFactorsResponse {
    return {
      factors: [
        { name: 'Technical depth', description: 'Understands core concepts and applies them effectively.', weight: 30 },
        { name: 'Communication', description: 'Expresses ideas clearly and structures responses logically.', weight: 25 },
        { name: 'Problem solving', description: 'Approaches problems methodically and considers alternatives.', weight: 25 },
        { name: 'Cultural fit', description: 'Aligns with team values and working style.', weight: 20 },
      ],
    };
  },
};

// ─── Misc ───

const JOB_TITLES = [
  'Senior Frontend Engineer',
  'Product Manager',
  'Full Stack Developer',
  'Data Scientist',
  'UX Designer',
  'DevOps Engineer',
  'Engineering Manager',
  'QA Engineer',
];

export const miscRepo = {
  jobTitles(): JobTitle[] {
    return JOB_TITLES.map((title) => ({ title }));
  },
};
