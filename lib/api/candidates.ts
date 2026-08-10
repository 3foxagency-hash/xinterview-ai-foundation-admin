/** Candidate directory — the cross-job list shown at /candidates. */

function delay(ms = 600) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type CandidateStage =
  | 'Invited'
  | 'In progress'
  | 'Review'
  | 'Shortlisted'
  | 'Live interview'
  | 'Hired'
  | 'Rejected';

export const CANDIDATE_STAGES: CandidateStage[] = [
  'Invited',
  'In progress',
  'Review',
  'Shortlisted',
  'Live interview',
  'Hired',
  'Rejected',
];

export type CandidateRecord = {
  id: string;
  name: string;
  initials: string;
  email: string;
  mobile: string | null;
  jobTitle: string;
  stage: CandidateStage;
  jobDeadline: string;
  appliedOn: string;
};

const NAMES: [string, string, string, CandidateStage][] = [
  ['Mohit Bhatt', 'mohit.bhatt@gmail.com', 'Senior Frontend Engineer', 'Review'],
  ['Aisha Rahman', 'aisha.rahman@gmail.com', 'Senior Frontend Engineer', 'Shortlisted'],
  ['Daniel Okoro', 'daniel.okoro@outlook.com', 'Product Manager', 'In progress'],
  ['Sofia Marchetti', 'sofia.marchetti@gmail.com', 'Product Manager', 'Invited'],
  ['Liam O’Connor', 'liam.oconnor@gmail.com', 'Data Scientist', 'Hired'],
  ['Priya Raghavan', 'priya.raghavan@gmail.com', 'Data Scientist', 'Review'],
  ['Tomas Novak', 'tomas.novak@gmail.com', 'UX Designer', 'Rejected'],
  ['Grace Wanjiru', 'grace.wanjiru@gmail.com', 'UX Designer', 'Live interview'],
  ['Hiroshi Tanaka', 'hiroshi.tanaka@gmail.com', 'Senior Frontend Engineer', 'Invited'],
  ['Elena Petrova', 'elena.petrova@gmail.com', 'Product Manager', 'Review'],
  ['Marcus Webb', 'marcus.webb@gmail.com', 'Data Scientist', 'In progress'],
  ['Fatima Zahra', 'fatima.zahra@gmail.com', 'UX Designer', 'Shortlisted'],
];

const DEADLINES: Record<string, string> = {
  'Senior Frontend Engineer': 'Aug 20, 2026',
  'Product Manager': 'Sep 2, 2026',
  'Data Scientist': 'Aug 28, 2026',
  'UX Designer': 'Sep 15, 2026',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

let store: CandidateRecord[] = NAMES.map(([name, email, jobTitle, stage], i) => ({
  id: `cand_${i + 1}`,
  name,
  initials: initials(name),
  email,
  // Deliberately mixed — the reference showed "N/A" for missing numbers.
  mobile: i % 3 === 0 ? null : `+1 555 01${(10 + i).toString().padStart(2, '0')}`,
  jobTitle,
  stage,
  jobDeadline: DEADLINES[jobTitle],
  appliedOn: `Jul ${(i % 28) + 1}, 2026`,
}));

export async function getCandidates(): Promise<CandidateRecord[]> {
  await delay();
  return store.map((c) => ({ ...c }));
}

export async function getJobTitles(): Promise<string[]> {
  await delay(300);
  return Array.from(new Set(store.map((c) => c.jobTitle)));
}

export async function updateCandidateStage(
  id: string,
  stage: CandidateStage
): Promise<CandidateRecord> {
  await delay(500);
  const c = store.find((x) => x.id === id);
  if (!c) throw { code: 'candidate_not_found', message: 'candidate_not_found' };
  c.stage = stage;
  return { ...c };
}

export type CandidateEdit = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  stage: CandidateStage;
};

/**
 * Edits the details captured on the candidate record. The live product splits
 * the name into first/last in its edit modal even though the table shows one
 * "Candidate" column, so the two halves are joined back on save.
 */
export async function updateCandidate(
  id: string,
  patch: CandidateEdit
): Promise<CandidateRecord> {
  await delay(500);
  const c = store.find((x) => x.id === id);
  if (!c) throw { code: 'candidate_not_found', message: 'candidate_not_found' };
  const name = `${patch.firstName.trim()} ${patch.lastName.trim()}`.trim();
  c.name = name;
  c.initials = initials(name);
  c.email = patch.email.trim();
  c.mobile = patch.mobile.trim() || null;
  c.stage = patch.stage;
  return { ...c };
}

/** Splits a stored display name into the first/last halves the modal edits. */
export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

export async function deleteCandidate(id: string): Promise<{ success: boolean }> {
  await delay(500);
  store = store.filter((c) => c.id !== id);
  return { success: true };
}

export function candidateShareLink(id: string): string {
  return `https://xinterview.ai/share/candidate/${id}`;
}

/** Builds a CSV of whatever rows are currently filtered. */
export function toCsv(rows: CandidateRecord[]): string {
  const header = ['Candidate', 'Job position', 'Email', 'Mobile', 'Stage', 'Job deadline'];
  const body = rows.map((c) =>
    [c.name, c.jobTitle, c.email, c.mobile ?? 'N/A', c.stage, c.jobDeadline]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header.join(','), ...body].join('\n');
}

export function _resetCandidateStore() {
  store = NAMES.map(([name, email, jobTitle, stage], i) => ({
    id: `cand_${i + 1}`,
    name,
    initials: initials(name),
    email,
    mobile: i % 3 === 0 ? null : `+1 555 01${(10 + i).toString().padStart(2, '0')}`,
    jobTitle,
    stage,
    jobDeadline: DEADLINES[jobTitle],
    appliedOn: `Jul ${(i % 28) + 1}, 2026`,
  }));
}
