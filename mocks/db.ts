/**
 * In-memory mock database.
 *
 * Deliberately plain typed Maps rather than @mswjs/data: that package is
 * CJS-only, and mixing it with the ESM `msw` external that Next.js requires at
 * runtime produces an ERR_REQUIRE_ESM_RACE_CONDITION in the instrumentation
 * context. Hand-rolled stores also keep the dependency surface small, and the
 * repository layer in mocks/repo/* means callers never see this shape — so
 * swapping storage later stays a one-folder change.
 *
 * Data lives on globalThis so Next.js dev module reloading does not silently
 * reset state between requests.
 */

export type MockUser = {
  id: string;
  /** The backend keys users by a numeric id; the wire uses this, not `id`. */
  numericId: number;
  email: string;
  /** Plaintext only because this is a mock; never a real credential store. */
  password: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'recruiter' | 'interviewer';
  orgId: string;
  timezone: string;
  locale: string;
  emailVerified: boolean;
  /** Whether onboarding has created a company for this user. */
  companyCreated: boolean;
  /** Set once the user dismisses the global notification banner. */
  notificationSkipped: boolean;
  /** Consecutive failed logins; drives the lockout path. */
  failedAttempts: number;
  lockedUntil: number | null;
};

export type MockOrganisation = {
  id: string;
  /** The backend keys companies numerically; invite links use this id. */
  numericId: number;
  name: string;
  size: string;
  type: string;
  website: string | null;
  /** Invite slug used by /company-setup?invite=<slug>. */
  inviteSlug: string | null;
  inviterName: string | null;
};

export type MockJob = {
  id: string;
  orgId: string;
  title: string;
  format: 'ai_video' | 'ai_avatar' | 'ai_voice' | 'ai_phone';
  timezone: string;
  applicationDeadline: string;
  interviewLanguage: string;
  description: string;
  status: 'draft' | 'active';
  candidateUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type MockQuestion = {
  id: string;
  type: 'video' | 'audio' | 'text' | 'single_choice';
  title: string;
  description: string;
  retakesAllowed?: number;
  thinkingTime?: string;
  answerTime?: string;
  charLimit?: number;
  options?: { id: string; text: string; isCorrect: boolean }[];
};

export type MockOrgMember = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Executive' | 'Member';
  initials: string;
};

export type MockTeamMember = {
  memberId: string;
  notifyOnComplete: boolean;
  isCreator: boolean;
};

export type MockInvite = {
  firstName: string;
  lastName: string;
  email: string;
  invitedAt: string;
};

export type MockPlan = {
  orgId: string;
  emailNotifications: boolean;
  smsEnabled: boolean;
  candidateLimit: number;
  candidatesUsed: number;
};


// ─── User-management entities ───

export type MockCompanyMember = {
  id: number;
  companyNumericId: number;
  email: string;
  firstName: string;
  lastName: string;
  /** Wire codes: MA = Manager, EX = Executive. */
  role: 'MA' | 'EX';
  profilePic: string | null;
  lastLogin: string | null;
};

export type MockInvitee = {
  id: number;
  companyNumericId: number;
  email: string;
  role: 'MA' | 'EX';
  invitedAt: string;
};

export type MockSmtp = {
  id: number;
  companyNumericId: number;
  host: string;
  port: number;
  username: string;
  /** Write-only: never returned by the API, kept only to make verify realistic. */
  password: string;
  fromEmail: string;
  fromName: string;
  useTls: boolean;
  useSsl: boolean;
  isVerified: boolean;
};

export type MockEmailTemplate = {
  id: number;
  companyNumericId: number;
  title: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
};

export type MockSmsTemplate = {
  id: number;
  companyNumericId: number;
  title: string;
  body: string;
  isActive: boolean;
};

export type MockSubscription = {
  companyNumericId: number;
  planTitle: string;
  planPrice: string;
  planInterval: string;
  jobsCreated: number;
  candidatesInterviewed: number;
  teamMembers: number;
  credits: number;
  smsCredits: number;
  renewalDate: string;
  subscriptionDate: string;
  expirationDate: string;
  status: string;
  autoBill: boolean;
  cancelAtPeriodEnd: boolean;
  availedFreeCredits: boolean;
};

export type MockCreditRecord = {
  companyNumericId: number;
  expiryDate: string;
  usedCredit: number;
  maxAllowed: number;
  isActive: boolean;
  isSubCredit: boolean;
};

export type MockLandingPage = {
  companyNumericId: number;
  data: Record<string, unknown>;
};

export type MockAddress = {
  id: number;
  companyNumericId: number;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  zipCode: string;
};

export type MockInvoice = {
  id: number;
  companyNumericId: number;
  planId: number;
  planTitle: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate: string | null;
  date: string;
  billingType: string;
  quantity: number;
  hostedInvoiceUrl: string;
  invoicePdfUrl: string;
};

export type MockCoupon = {
  code: string;
  description: string;
  /** Percentage off, purely for the success message. */
  percentOff: number;
};

export type MockTrustedOrigin = {
  companyNumericId: number;
  domain: string;
  verified: boolean;
  txtValue: string;
};

export const DEFAULT_ORG_ID = 'org_01hx8acme';

type Store = {
  users: Map<string, MockUser>;
  organisations: Map<string, MockOrganisation>;
  jobs: Map<string, MockJob>;
  /** jobId → questions, ordered. */
  questions: Map<string, MockQuestion[]>;
  /** jobId → team roster. */
  teams: Map<string, MockTeamMember[]>;
  /** jobId → invited candidates. */
  invites: Map<string, MockInvite[]>;
  members: Map<string, MockOrgMember>;
  plans: Map<string, MockPlan>;
  // ─── user-management ───
  companyMembers: Map<number, MockCompanyMember>;
  invitees: Map<number, MockInvitee>;
  smtp: Map<number, MockSmtp>;
  emailTemplates: Map<number, MockEmailTemplate>;
  smsTemplates: Map<number, MockSmsTemplate>;
  subscriptions: Map<number, MockSubscription>;
  creditRecords: Map<number, MockCreditRecord[]>;
  landingPages: Map<number, MockLandingPage>;
  trustedOrigins: Map<number, MockTrustedOrigin>;
  addresses: Map<number, MockAddress>;
  invoices: Map<number, MockInvoice>;
  /** Keyed by uppercase code. */
  coupons: Map<string, MockCoupon>;
};

const KEY = '__xinterview_mock_db__';

function createStore(): Store {
  const store: Store = {
    users: new Map(),
    organisations: new Map(),
    jobs: new Map(),
    questions: new Map(),
    teams: new Map(),
    invites: new Map(),
    members: new Map(),
    plans: new Map(),
    companyMembers: new Map(),
    invitees: new Map(),
    smtp: new Map(),
    emailTemplates: new Map(),
    smsTemplates: new Map(),
    subscriptions: new Map(),
    creditRecords: new Map(),
    landingPages: new Map(),
    trustedOrigins: new Map(),
    addresses: new Map(),
    invoices: new Map(),
    coupons: new Map(),
  };
  seed(store);
  return store;
}

function seed(store: Store): void {
  store.organisations.set(DEFAULT_ORG_ID, {
    id: DEFAULT_ORG_ID,
    numericId: 64,
    name: 'Acme Corp',
    size: '50-500',
    type: 'technology',
    website: 'https://acme.example',
    inviteSlug: 'acme',
    inviterName: 'Sarah Chen',
  });

  const users: MockUser[] = [
    {
      id: 'usr_01hxowner',
      numericId: 113,
      email: 'admin@xinterview.ai',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'owner',
      orgId: DEFAULT_ORG_ID,
      timezone: 'Europe/Amsterdam',
      locale: 'en-US',
      emailVerified: true,
      companyCreated: true,
      notificationSkipped: false,
      failedAttempts: 0,
      lockedUntil: null,
    },
    {
      id: 'usr_01hxrecruit',
      numericId: 114,
      email: 'recruiter@xinterview.ai',
      password: 'password123',
      firstName: 'Marcus',
      lastName: 'Reid',
      role: 'recruiter',
      orgId: DEFAULT_ORG_ID,
      timezone: 'Europe/Amsterdam',
      locale: 'en-US',
      emailVerified: true,
      companyCreated: true,
      notificationSkipped: false,
      failedAttempts: 0,
      lockedUntil: null,
    },
    // Fixtures for paths that are otherwise hard to reach by hand.
    {
      id: 'usr_01hxlocked',
      numericId: 115,
      email: 'locked@xinterview.ai',
      password: 'password123',
      firstName: 'Locked',
      lastName: 'Account',
      role: 'recruiter',
      orgId: DEFAULT_ORG_ID,
      timezone: 'UTC',
      locale: 'en-US',
      emailVerified: true,
      companyCreated: true,
      notificationSkipped: false,
      failedAttempts: 5,
      lockedUntil: Date.now() + 60 * 60 * 1000,
    },
    {
      id: 'usr_01hxunverified',
      numericId: 116,
      email: 'unverified@xinterview.ai',
      password: 'password123',
      firstName: 'Unverified',
      lastName: 'User',
      role: 'recruiter',
      orgId: DEFAULT_ORG_ID,
      timezone: 'UTC',
      locale: 'en-US',
      emailVerified: false,
      companyCreated: false,
      notificationSkipped: false,
      failedAttempts: 0,
      lockedUntil: null,
    },
  ];

  for (const user of users) store.users.set(user.id, user);

  // ─── User-management seed ───
  const CO = 64; // DEFAULT_ORG_ID's numeric id

  const companyMembers: MockCompanyMember[] = [
    { id: 501, companyNumericId: CO, email: 'marcus.reid@xinterview.ai', firstName: 'Marcus', lastName: 'Reid', role: 'MA', profilePic: null, lastLogin: '2026-08-10T09:12:00Z' },
    { id: 502, companyNumericId: CO, email: 'priya.nair@xinterview.ai', firstName: 'Priya', lastName: 'Nair', role: 'MA', profilePic: null, lastLogin: '2026-08-11T14:02:00Z' },
    { id: 503, companyNumericId: CO, email: 'james.okafor@xinterview.ai', firstName: 'James', lastName: 'Okafor', role: 'EX', profilePic: null, lastLogin: null },
  ];
  for (const m of companyMembers) store.companyMembers.set(m.id, m);

  store.invitees.set(601, {
    id: 601, companyNumericId: CO, email: 'pending.invite@example.com',
    role: 'EX', invitedAt: '2026-08-12T10:00:00Z',
  });

  store.smtp.set(CO, {
    id: 1, companyNumericId: CO, host: 'smtp.mailersend.net', port: 587,
    username: 'MS_abc123', password: 'secret', fromEmail: 'hiring@acme.example',
    fromName: 'Acme Hiring', useTls: true, useSsl: false, isVerified: true,
  });

  const emailTemplates: MockEmailTemplate[] = [
    { id: 701, companyNumericId: CO, title: 'Interview invitation', subject: 'You are invited to interview at {{company}}', body: '<p>Hi {{first_name}},</p><p>Please complete your interview.</p>', isActive: true, createdAt: '2026-07-01T09:00:00Z' },
    { id: 702, companyNumericId: CO, title: 'Interview reminder', subject: 'Reminder: your interview at {{company}}', body: '<p>Hi {{first_name}},</p><p>A reminder to complete your interview.</p>', isActive: true, createdAt: '2026-07-01T09:05:00Z' },
    { id: 703, companyNumericId: CO, title: 'Rejection', subject: 'Update on your application', body: '<p>Thank you for your interest.</p>', isActive: false, createdAt: '2026-07-01T09:10:00Z' },
  ];
  for (const t of emailTemplates) store.emailTemplates.set(t.id, t);

  const smsTemplates: MockSmsTemplate[] = [
    { id: 801, companyNumericId: CO, title: 'Interview invitation', body: 'Hi {{first_name}}, complete your {{company}} interview: {{link}}', isActive: true },
    { id: 802, companyNumericId: CO, title: 'Interview reminder', body: 'Reminder: your {{company}} interview closes soon. {{link}}', isActive: false },
  ];
  for (const t of smsTemplates) store.smsTemplates.set(t.id, t);

  store.subscriptions.set(CO, {
    companyNumericId: CO, planTitle: 'Growth Plan', planPrice: '49.00',
    planInterval: 'month', jobsCreated: 12, candidatesInterviewed: 94,
    teamMembers: 4, credits: 6, smsCredits: 120,
    renewalDate: '2026-09-24T00:00:00Z', subscriptionDate: '2026-07-24T14:08:40.746663Z',
    expirationDate: '2026-09-24T00:00:00Z', status: 'active',
    autoBill: true, cancelAtPeriodEnd: false, availedFreeCredits: true,
  });

  // Two records so the billing popover renders a list, not a single row.
  store.creditRecords.set(CO, [
    { companyNumericId: CO, expiryDate: '2026-09-24T00:00:00Z', usedCredit: 94, maxAllowed: 100, isActive: true, isSubCredit: true },
    { companyNumericId: CO, expiryDate: '2026-12-31T00:00:00Z', usedCredit: 0, maxAllowed: 25, isActive: true, isSubCredit: false },
  ]);

  store.landingPages.set(CO, { companyNumericId: CO, data: {
    id: 1,
    title: 'Welcome to your interview',
    sub_title: 'It should take about 15 minutes.',
    colour: '#5B4FE9',
    secondary_colour: '#1F242E',
    logo: null,
    favicon: null,
    require_logo: true,
    intro_note: '',
    outro_note: '',
    starting_instructions: 'Find a quiet space and check your camera.',
    ending_instructions: 'Thank you — we will be in touch.',
    require_starting_instructions: true,
    require_intro_video: false,
    intro_video: null,
    redirect_url: null,
    blur_effect: false,
    switch_tab: true,
    full_screen: false,
    copy_paste: true,
    email_candidate: true,
    sms_candidate: false,
    remind_candidate: 3,
    reject_candidate: false,
    company_privacy_policy_display: false,
    company_privacy_policy: null,
    company_terms_and_conditions_display: false,
    company_terms_and_conditions: null,
  }});

  store.trustedOrigins.set(CO, {
    companyNumericId: CO, domain: 'careers.acme.example',
    verified: false, txtValue: 'xinterview-verify=7f3a91c2',
  });

  store.addresses.set(1, {
    id: 1, companyNumericId: CO, line1: '12 Baker Street', line2: 'Floor 3',
    city: 'Pune', state: 'MH', country: 'India', countryCode: 'IN', zipCode: '411001',
  });

  // Three invoices with different payment states, so the billing table renders
  // every status badge without editing seed data.
  const invoices: MockInvoice[] = [
    { id: 56, companyNumericId: CO, planId: 7, planTitle: 'Flagship',
      invoiceNumber: '1784735877-P7', amount: '50.00', currency: 'usd',
      paymentStatus: 'paid', paymentMethod: 'stripe',
      paymentDate: '2026-07-22T16:01:00Z', date: '2026-07-22T15:57:57.568997Z',
      billingType: 'subscription', quantity: 1,
      hostedInvoiceUrl: 'https://invoice.stripe.example/i/inv_56',
      invoicePdfUrl: 'https://invoice.stripe.example/i/inv_56/pdf' },
    { id: 57, companyNumericId: CO, planId: 7, planTitle: 'Flagship',
      invoiceNumber: '1784735878-P7', amount: '50.00', currency: 'usd',
      paymentStatus: 'unpaid', paymentMethod: 'stripe',
      paymentDate: null, date: '2026-08-22T15:57:57.568997Z',
      billingType: 'subscription', quantity: 1,
      hostedInvoiceUrl: '', invoicePdfUrl: '' },
    { id: 58, companyNumericId: CO, planId: 9, planTitle: 'Credit top-up',
      invoiceNumber: '1784735899-C2', amount: '19.00', currency: 'usd',
      paymentStatus: 'paid', paymentMethod: 'stripe',
      paymentDate: '2026-08-01T10:00:00Z', date: '2026-08-01T09:59:00Z',
      billingType: 'credit', quantity: 2,
      hostedInvoiceUrl: 'https://invoice.stripe.example/i/inv_58',
      invoicePdfUrl: 'https://invoice.stripe.example/i/inv_58/pdf' },
  ];
  for (const inv of invoices) store.invoices.set(inv.id, inv);

  store.coupons.set('LAUNCH20', {
    code: 'LAUNCH20', description: '20% off the first year', percentOff: 20,
  });
  store.coupons.set('WELCOME10', {
    code: 'WELCOME10', description: '10% off any plan', percentOff: 10,
  });



  // ─── Organisation members ───
  // Only Admin/Manager/Executive are assignable to a job team; Member exists so
  // the filtering in the team picker is actually exercised.
  const members: MockOrgMember[] = [
    { id: 'cm_1', orgId: DEFAULT_ORG_ID, name: 'Sarah Chen', email: 'sarah.chen@xinterview.ai', role: 'Admin', initials: 'SC' },
    { id: 'cm_2', orgId: DEFAULT_ORG_ID, name: 'Marcus Reid', email: 'marcus.reid@xinterview.ai', role: 'Manager', initials: 'MR' },
    { id: 'cm_3', orgId: DEFAULT_ORG_ID, name: 'Priya Nair', email: 'priya.nair@xinterview.ai', role: 'Executive', initials: 'PN' },
    { id: 'cm_4', orgId: DEFAULT_ORG_ID, name: 'James Okafor', email: 'james.okafor@xinterview.ai', role: 'Manager', initials: 'JO' },
    { id: 'cm_5', orgId: DEFAULT_ORG_ID, name: 'Elena Volkova', email: 'elena.volkova@xinterview.ai', role: 'Admin', initials: 'EV' },
    { id: 'cm_6', orgId: DEFAULT_ORG_ID, name: 'David Kim', email: 'david.kim@xinterview.ai', role: 'Member', initials: 'DK' },
    { id: 'cm_7', orgId: DEFAULT_ORG_ID, name: 'Aisha Bakr', email: 'aisha.bakr@xinterview.ai', role: 'Member', initials: 'AB' },
    { id: 'cm_8', orgId: DEFAULT_ORG_ID, name: 'Tom Walker', email: 'tom.walker@xinterview.ai', role: 'Manager', initials: 'TW' },
  ];
  for (const m of members) store.members.set(m.id, m);

  // Near the cap on purpose, so the invite screen's limit warning is reachable
  // without seeding 94 candidates by hand.
  store.plans.set(DEFAULT_ORG_ID, {
    orgId: DEFAULT_ORG_ID,
    emailNotifications: true,
    smsEnabled: false,
    candidateLimit: 100,
    candidatesUsed: 94,
  });

  // ─── An existing job ───
  // Gives the jobs list something to show on first load, and a stable id to
  // open directly when working on later wizard steps.
  const now = new Date('2026-08-01T09:00:00Z').toISOString();
  const seededJob: MockJob = {
    id: 'job_01hxseed',
    orgId: DEFAULT_ORG_ID,
    title: 'Senior Frontend Engineer',
    format: 'ai_video',
    timezone: 'Europe/Amsterdam',
    applicationDeadline: '2026-12-31',
    interviewLanguage: 'en-US',
    description:
      '<h2>About the role</h2><p>We are looking for a Senior Frontend Engineer to join our team.</p>',
    status: 'active',
    candidateUrl: 'https://xinterview.ai/interview/job_01hxseed',
    createdAt: now,
    updatedAt: now,
  };
  store.jobs.set(seededJob.id, seededJob);
  store.questions.set(seededJob.id, [
    {
      id: 'q_seed_1',
      type: 'video',
      title: 'Tell us about a frontend project you are proud of.',
      description: 'Record a 2-minute response.',
      retakesAllowed: 2,
      thinkingTime: '30s',
      answerTime: '2min',
    },
  ]);
  store.teams.set(seededJob.id, [
    { memberId: 'cm_1', notifyOnComplete: true, isCreator: true },
  ]);
  store.invites.set(seededJob.id, []);
}

/** Question library templates — shared across the org, not per job. */
export const QUESTION_TEMPLATES: {
  id: string;
  name: string;
  questions: MockQuestion[];
}[] = [
  {
    id: 'tpl_frontend',
    name: 'Frontend Engineer — standard',
    questions: [
      {
        id: 'tq_1',
        type: 'video',
        title: 'Walk us through your experience with modern JavaScript frameworks.',
        description: 'Record a 2-minute response.',
        retakesAllowed: 2,
        thinkingTime: '30s',
        answerTime: '2min',
      },
      {
        id: 'tq_2',
        type: 'text',
        title: 'How do you approach accessibility in a component library?',
        description: 'Answer in up to 500 characters.',
        answerTime: '5min',
        charLimit: 500,
      },
      {
        id: 'tq_3',
        type: 'single_choice',
        title: 'Which rendering strategy suits a content-heavy marketing site?',
        description: 'Select the single best answer.',
        options: [
          { id: 'to_1', text: 'Static generation', isCorrect: true },
          { id: 'to_2', text: 'Client-side only', isCorrect: false },
          { id: 'to_3', text: 'Server-side on every request', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'tpl_general',
    name: 'General screening',
    questions: [
      {
        id: 'tq_4',
        type: 'video',
        title: 'Why are you interested in this role?',
        description: 'Record a 1-minute response.',
        retakesAllowed: 1,
        thinkingTime: '15s',
        answerTime: '1min',
      },
      {
        id: 'tq_5',
        type: 'audio',
        title: 'Describe a challenge you overcame recently.',
        description: 'Record an audio response of up to 2 minutes.',
        retakesAllowed: 1,
        thinkingTime: '15s',
        answerTime: '2min',
      },
    ],
  },
];

export function db(): Store {
  const g = globalThis as typeof globalThis & { [KEY]?: Store };
  if (!g[KEY]) g[KEY] = createStore();
  return g[KEY];
}

/** Full reset — call in test teardown so no test inherits another's state. */
export function resetDb(): void {
  const store = db();
  store.users.clear();
  store.organisations.clear();
  store.jobs.clear();
  store.questions.clear();
  store.teams.clear();
  store.invites.clear();
  store.members.clear();
  store.plans.clear();
  store.companyMembers.clear();
  store.invitees.clear();
  store.smtp.clear();
  store.emailTemplates.clear();
  store.smsTemplates.clear();
  store.subscriptions.clear();
  store.creditRecords.clear();
  store.landingPages.clear();
  store.trustedOrigins.clear();
  store.addresses.clear();
  store.invoices.clear();
  store.coupons.clear();
  seed(store);
}
