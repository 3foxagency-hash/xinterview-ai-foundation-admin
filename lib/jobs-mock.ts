export type JobStatus = 'Active' | 'Paused' | 'Expired';

export type PipelineStage = {
  label: string;
  count: number;
  tone: string;
};

export type Job = {
  id: string;
  title: string;
  department: string;
  mode: 'Remote' | 'Hybrid' | 'On-site';
  location: string;
  status: JobStatus;
  created: string;
  responded: string;
  responseRate: string;
  candidates: number;
  active: number;
  lastActivity: string;
  stages: PipelineStage[];
};

const stages = (counts: number[]): PipelineStage[] => [
  { label: 'Sourced', count: counts[0], tone: 'bg-primary' },
  { label: 'Applied', count: counts[1], tone: 'bg-jobs' },
  { label: 'Phone screen', count: counts[2], tone: 'bg-reports' },
  { label: 'Assessment', count: counts[3], tone: 'bg-interviews' },
  { label: 'Interview', count: counts[4], tone: 'bg-warning' },
  { label: 'Offer', count: counts[5], tone: 'bg-success' },
  { label: 'Hired', count: counts[6], tone: 'bg-success' },
  { label: 'Rejected', count: counts[7], tone: 'bg-error' },
];

export const activeJobs: Job[] = [
  { id: 'job-1', title: 'Account Executive', department: 'Sales', mode: 'On-site', location: 'London, United Kingdom', status: 'Active', created: '01 May 2026', responded: '5/5', responseRate: '100%', candidates: 41, active: 41, lastActivity: '13 May 2026', stages: stages([6, 18, 10, 4, 1, 1, 1, 0]) },
  { id: 'job-2', title: 'Marketing Manager', department: 'Marketing', mode: 'Remote', location: 'Paris, France', status: 'Active', created: '20 Apr 2026', responded: '5/5', responseRate: '100%', candidates: 67, active: 67, lastActivity: '14 May 2026', stages: stages([9, 23, 18, 10, 5, 1, 1, 0]) },
  { id: 'job-3', title: 'Frontend Developer', department: 'Engineering', mode: 'Hybrid', location: 'Berlin, Germany', status: 'Paused', created: '15 Apr 2026', responded: '4/5', responseRate: '80%', candidates: 76, active: 63, lastActivity: '12 May 2026', stages: stages([18, 26, 15, 8, 3, 2, 1, 3]) },
  { id: 'job-4', title: 'People Operations Lead', department: 'People', mode: 'Hybrid', location: 'New York, United States', status: 'Active', created: '08 Apr 2026', responded: '8/10', responseRate: '80%', candidates: 29, active: 22, lastActivity: '11 May 2026', stages: stages([4, 11, 7, 3, 2, 1, 1, 1]) },
  { id: 'job-5', title: 'Product Designer', department: 'Design', mode: 'Remote', location: 'Amsterdam, Netherlands', status: 'Active', created: '02 Apr 2026', responded: '6/8', responseRate: '75%', candidates: 38, active: 30, lastActivity: '09 May 2026', stages: stages([7, 15, 9, 4, 2, 1, 1, 2]) },
  { id: 'job-6', title: 'Customer Success Manager', department: 'Customer Success', mode: 'On-site', location: 'Dublin, Ireland', status: 'Active', created: '28 Mar 2026', responded: '7/9', responseRate: '78%', candidates: 33, active: 26, lastActivity: '07 May 2026', stages: stages([5, 14, 8, 4, 2, 1, 1, 1]) },
];

export const archivedJobs: Job[] = [
  { id: 'job-7', title: 'Senior Data Analyst', department: 'Analytics', mode: 'Remote', location: 'London, United Kingdom', status: 'Expired', created: '12 Feb 2026', responded: '8/12', responseRate: '67%', candidates: 52, active: 0, lastActivity: '21 Mar 2026', stages: stages([10, 20, 12, 5, 3, 1, 1, 0]) },
  { id: 'job-8', title: 'Talent Acquisition Partner', department: 'People', mode: 'Hybrid', location: 'Toronto, Canada', status: 'Expired', created: '08 Jan 2026', responded: '4/7', responseRate: '57%', candidates: 24, active: 0, lastActivity: '02 Mar 2026', stages: stages([3, 9, 6, 3, 2, 1, 1, 1]) },
  { id: 'job-9', title: 'Implementation Specialist', department: 'Operations', mode: 'On-site', location: 'Austin, United States', status: 'Expired', created: '19 Dec 2025', responded: '5/6', responseRate: '83%', candidates: 31, active: 0, lastActivity: '14 Feb 2026', stages: stages([6, 13, 7, 3, 1, 1, 1, 0]) },
];
