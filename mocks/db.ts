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
      failedAttempts: 0,
      lockedUntil: null,
    },
  ];

  for (const user of users) store.users.set(user.id, user);

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
  seed(store);
}
