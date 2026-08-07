/** Hiring analytics shown at /reports. */

function delay(ms = 700) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type ReportRange = '7d' | '30d' | '90d' | 'all';

export const REPORT_RANGES: { value: ReportRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export type ReportStat = {
  id: string;
  label: string;
  value: number;
  /** Percentage change vs the previous period; null when there's no baseline */
  delta: number | null;
};

export type ProgressPoint = {
  date: string;
  invited: number;
  responded: number;
};

export type JobBreakdown = {
  jobTitle: string;
  invited: number;
  responded: number;
  hired: number;
};

export type ReportData = {
  stats: ReportStat[];
  progress: ProgressPoint[];
  /** What one point on the progress chart covers. */
  granularity: 'daily' | 'weekly';
  byJob: JobBreakdown[];
};

const RANGE_DAYS: Record<ReportRange, number> = { '7d': 7, '30d': 30, '90d': 90, all: 120 };

/** Deterministic pseudo-random so the chart doesn't reshuffle every render. */
function seeded(i: number, salt: number) {
  return Math.abs(Math.sin(i * 12.9898 + salt) * 43758.5453) % 1;
}

function buildProgress(days: number): ProgressPoint[] {
  // Daily only for the shortest range; anything longer buckets weekly so the
  // line stays readable at narrow widths.
  const step = days <= 14 ? 1 : 7;
  const points: ProgressPoint[] = [];
  const start = new Date('2026-08-06T00:00:00Z');
  for (let d = days; d >= 0; d -= step) {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() - d);
    const i = days - d;
    // A weekly point covers `step` days of activity, so scale it accordingly —
    // otherwise the totals and the y-axis ignore the bucket width.
    const invited = (Math.round(seeded(i, 1) * 9) + 2) * step;
    points.push({
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      invited,
      responded: Math.max(0, invited - Math.round(seeded(i, 7) * 5) * step),
    });
  }
  return points;
}

export async function getReport(range: ReportRange): Promise<ReportData> {
  await delay();
  const days = RANGE_DAYS[range];
  const progress = buildProgress(days);
  const invited = progress.reduce((s, p) => s + p.invited, 0);
  const responded = progress.reduce((s, p) => s + p.responded, 0);

  return {
    stats: [
      { id: 'total', label: 'Total candidates', value: invited, delta: 12 },
      { id: 'invited', label: 'Invited', value: Math.round(invited * 0.28), delta: 8 },
      { id: 'in_progress', label: 'In progress', value: Math.round(invited * 0.18), delta: -4 },
      { id: 'review', label: 'Review', value: Math.round(invited * 0.22), delta: 15 },
      { id: 'hired', label: 'Hired', value: Math.round(invited * 0.09), delta: 23 },
      { id: 'rejected', label: 'Rejected', value: Math.round(invited * 0.14), delta: -6 },
    ],
    progress,
    granularity: days <= 14 ? 'daily' : 'weekly',
    byJob: [
      { jobTitle: 'Senior Frontend Engineer', invited: 42, responded: 31, hired: 3 },
      { jobTitle: 'Product Manager', invited: 28, responded: 19, hired: 2 },
      { jobTitle: 'Data Scientist', invited: 35, responded: 24, hired: 4 },
      { jobTitle: 'UX Designer', invited: 21, responded: 12, hired: 1 },
    ],
  };
}

function escape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Exports all three sections, so the file matches what's on screen. */
export function reportToCsv(data: ReportData): string {
  const rows: string[] = [];

  rows.push('Summary');
  rows.push(['Metric', 'Value', 'Change vs previous (%)'].join(','));
  for (const s of data.stats) {
    rows.push([escape(s.label), s.value, s.delta ?? ''].join(','));
  }

  rows.push('');
  rows.push('Overall progress');
  rows.push(['Date', 'Invited', 'Responded'].join(','));
  for (const p of data.progress) {
    rows.push([escape(p.date), p.invited, p.responded].join(','));
  }

  rows.push('');
  rows.push('By job');
  rows.push(['Job', 'Invited', 'Responded', 'Response rate (%)', 'Hired'].join(','));
  for (const j of data.byJob) {
    const rate = j.invited ? Math.round((j.responded / j.invited) * 100) : 0;
    rows.push([escape(j.jobTitle), j.invited, j.responded, rate, j.hired].join(','));
  }

  return rows.join('\n');
}
