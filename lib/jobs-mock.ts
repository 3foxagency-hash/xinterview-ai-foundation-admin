import type { InterviewFormat } from '@/lib/validation/job';

export type JobStatus = 'Active' | 'Paused' | 'Expired';

/* A job's interview format is shared with the create-job wizard
   (lib/validation/job.ts) — the list's icon tile is driven by it, so a
   recruiter can tell a phone screen from a video interview at a glance. */
export type { InterviewFormat };

export type PipelineStage = {
  label: string;
  count: number;
  tone: string;
};

export type Job = {
  id: string;
  title: string;
  department: string;
  format: InterviewFormat;
  mode: 'Remote' | 'Hybrid' | 'On-site';
  location: string;
  status: JobStatus;
  created: string;
  responded: string;
  responseRate: string;
  candidates: number;
  active: number;
  createdBy: string;
  stages: PipelineStage[];
};

/* Every stage a pipeline can contain, with its dot colour fixed here rather
   than at the call site — a job picks the subset it runs, so "Offer" is the
   same green whether it is the 5th stage of one job or the 8th of another.
   Real pipelines are configured per job, so the list is intentionally open:
   nothing downstream assumes a particular length or a particular member. */
export type StageKey =
  | 'sourced'
  | 'applied'
  | 'screening'
  | 'phone'
  | 'assessment'
  | 'interview'
  | 'final'
  | 'offer'
  | 'hired'
  | 'rejected';

const STAGE_CATALOGUE: Record<StageKey, { label: string; tone: string }> = {
  sourced: { label: 'Sourced', tone: 'bg-primary' },
  applied: { label: 'Applied', tone: 'bg-jobs' },
  screening: { label: 'Screening', tone: 'bg-chart-4' },
  phone: { label: 'Phone screen', tone: 'bg-reports' },
  assessment: { label: 'Assessment', tone: 'bg-interviews' },
  interview: { label: 'Interview', tone: 'bg-warning' },
  final: { label: 'Final round', tone: 'bg-ai' },
  offer: { label: 'Offer', tone: 'bg-success' },
  hired: { label: 'Hired', tone: 'bg-candidates' },
  rejected: { label: 'Rejected', tone: 'bg-error' },
};

/* A job's pipeline is declared as [stage, count] pairs, so the length varies
   per job exactly as it will once pipelines come from the API. */
const pipeline = (entries: [StageKey, number][]): PipelineStage[] =>
  entries.map(([key, count]) => ({ ...STAGE_CATALOGUE[key], count }));

export const activeJobs: Job[] = [
  // 8 stages
  { id: 'job-1', format: 'ai_phone', title: 'Account Executive', department: 'Sales', mode: 'On-site', location: 'London, United Kingdom', status: 'Active', created: '01 May 2026', responded: '5/5', responseRate: '100%', candidates: 41, active: 41, createdBy: 'Mohit Bhatt', stages: pipeline([['sourced', 6], ['applied', 18], ['phone', 10], ['assessment', 4], ['interview', 1], ['offer', 1], ['hired', 1], ['rejected', 0]]) },
  // 6 stages
  { id: 'job-2', format: 'ai_video', title: 'Marketing Manager', department: 'Marketing', mode: 'Remote', location: 'Paris, France', status: 'Active', created: '20 Apr 2026', responded: '5/5', responseRate: '100%', candidates: 67, active: 67, createdBy: 'Mohit Bhatt', stages: pipeline([['applied', 23], ['screening', 18], ['interview', 10], ['offer', 5], ['hired', 1], ['rejected', 0]]) },
  // 9 stages — the maximum a pipeline can run
  { id: 'job-3', format: 'ai_video', title: 'Frontend Developer', department: 'Engineering', mode: 'Hybrid', location: 'Berlin, Germany', status: 'Paused', created: '15 Apr 2026', responded: '4/5', responseRate: '80%', candidates: 76, active: 63, createdBy: 'Mohit Bhatt', stages: pipeline([['sourced', 18], ['applied', 26], ['screening', 15], ['phone', 12], ['assessment', 8], ['interview', 3], ['final', 2], ['offer', 2], ['hired', 1]]) },
  // 5 stages — the minimum
  { id: 'job-4', format: 'ai_voice', title: 'People Operations Lead', department: 'People', mode: 'Hybrid', location: 'New York, United States', status: 'Active', created: '08 Apr 2026', responded: '8/10', responseRate: '80%', candidates: 29, active: 22, createdBy: 'Mohit Bhatt', stages: pipeline([['applied', 11], ['phone', 7], ['interview', 3], ['offer', 1], ['hired', 1]]) },
  // 7 stages
  { id: 'job-5', format: 'ai_avatar', title: 'Product Designer', department: 'Design', mode: 'Remote', location: 'Amsterdam, Netherlands', status: 'Active', created: '02 Apr 2026', responded: '6/8', responseRate: '75%', candidates: 38, active: 30, createdBy: 'Mohit Bhatt', stages: pipeline([['sourced', 7], ['applied', 15], ['assessment', 9], ['interview', 4], ['final', 2], ['offer', 1], ['hired', 1]]) },
  // 6 stages
  { id: 'job-6', format: 'ai_phone', title: 'Customer Success Manager', department: 'Customer Success', mode: 'On-site', location: 'Dublin, Ireland', status: 'Active', created: '28 Mar 2026', responded: '7/9', responseRate: '78%', candidates: 33, active: 26, createdBy: 'Mohit Bhatt', stages: pipeline([['applied', 14], ['phone', 8], ['assessment', 4], ['interview', 2], ['offer', 1], ['hired', 1]]) },
  // 5 stages — phone screening job type: text Q&A plus the full call recording
  { id: 'job-phone-screen', format: 'ai_phone', title: 'Phone Screening', department: 'Sales', mode: 'Remote', location: 'Chicago, United States', status: 'Active', created: '18 Aug 2026', responded: '9/9', responseRate: '100%', candidates: 19, active: 19, createdBy: 'Mohit Bhatt', stages: pipeline([['applied', 9], ['phone', 6], ['interview', 2], ['offer', 1], ['hired', 1]]) },
];

export const archivedJobs: Job[] = [
  // 7 stages
  { id: 'job-7', format: 'ai_video', title: 'Senior Data Analyst', department: 'Analytics', mode: 'Remote', location: 'London, United Kingdom', status: 'Expired', created: '12 Feb 2026', responded: '8/12', responseRate: '67%', candidates: 52, active: 0, createdBy: 'Mohit Bhatt', stages: pipeline([['sourced', 10], ['applied', 20], ['screening', 12], ['assessment', 5], ['interview', 3], ['offer', 1], ['hired', 1]]) },
  // 5 stages
  { id: 'job-8', format: 'ai_voice', title: 'Talent Acquisition Partner', department: 'People', mode: 'Hybrid', location: 'Toronto, Canada', status: 'Expired', created: '08 Jan 2026', responded: '4/7', responseRate: '57%', candidates: 24, active: 0, createdBy: 'Mohit Bhatt', stages: pipeline([['applied', 9], ['phone', 6], ['interview', 3], ['offer', 1], ['hired', 1]]) },
  // 8 stages
  { id: 'job-9', format: 'ai_avatar', title: 'Implementation Specialist', department: 'Operations', mode: 'On-site', location: 'Austin, United States', status: 'Expired', created: '19 Dec 2025', responded: '5/6', responseRate: '83%', candidates: 31, active: 0, createdBy: 'Mohit Bhatt', stages: pipeline([['sourced', 6], ['applied', 13], ['phone', 7], ['assessment', 3], ['interview', 1], ['final', 1], ['offer', 1], ['hired', 1]]) },
];
