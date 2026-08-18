'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDown, ArrowUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsSelect } from '@/components/settings/settings-select';
import { ReportsSkeleton } from '@/components/reports/reports-skeleton';
import {
  getReport,
  getReportJobs,
  reportToCsv,
  REPORT_RANGES,
  type ReportData,
  type ReportRange,
} from '@/lib/api/reports';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

// §18: "Responded" is the series that carries the argument, so it takes
// --chart-1 (indigo, the default first series); "Invited" is the context
// line and stays on --text (near-black/near-white across themes).
const SERIES = {
  invited: { var: '--text-1', label: 'Invited' },
  responded: { var: '--chart-1', label: 'Responded' },
};

type TooltipPayload = { name?: string; value?: number; color?: string };

/** Recharts' default paints the text in the series colour; identity belongs on
 *  a swatch so the numbers keep their ink token. */
function ChartTooltip({
  active,
  payload,
  label,
  granularity,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  granularity?: 'daily' | 'weekly';
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-body-sm font-semibold text-heading">
        {granularity === 'weekly' ? `Week of ${label}` : label}
      </p>
      <div className="mt-1.5 space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
              aria-hidden
            />
            <span className="text-body-sm text-bodyText">{p.name}</span>
            <span className="ml-auto text-body-sm font-medium tabular-nums text-heading">
              {p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [range, setRange] = React.useState<ReportRange>('30d');
  const [job, setJob] = React.useState('');
  const [jobs, setJobs] = React.useState<string[]>([]);
  const [data, setData] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [chartColors, setChartColors] = React.useState({ invited: '#171717', responded: '#5b4fe9' });

  // Recharts needs concrete colours, not `var(--x)` strings, so this reads
  // the tokens' live computed values instead of duplicating their hex here.
  // A theme flip (or any future change to the tokens themselves) is picked
  // up automatically — there is nothing in this file to keep in sync.
  React.useEffect(() => {
    const readColors = () => {
      const styles = getComputedStyle(document.documentElement);
      setChartColors({
        invited: styles.getPropertyValue(SERIES.invited.var).trim(),
        responded: styles.getPropertyValue(SERIES.responded.var).trim(),
      });
    };
    readColors();
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  // The job list is fixed for the workspace, so it loads once rather than with
  // every range change.
  React.useEffect(() => {
    let cancelled = false;
    getReportJobs()
      .then((j) => !cancelled && setJobs(j))
      .catch(() => {
        /* the filter is optional; the report still renders across all jobs */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const d = await getReport(range, job);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) toast.error(getSettingsErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range, job]);

  const handleExport = () => {
    if (!data) return;
    const url = URL.createObjectURL(new Blob([reportToCsv(data)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    const slug = job ? `-${job.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '';
    a.download = `report-${range}${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  if (loading && !data) return <ReportsSkeleton />;
  if (!data) return null;

  const invitedColor = chartColors.invited;
  const respondedColor = chartColors.responded;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-h1 text-heading">Reports</h1>
          <p className="mt-2 text-body text-bodyText">
            How your hiring funnel is performing.
          </p>
        </div>
        {/* Job first, then range: you pick what you're looking at before you
            pick the window. Both selects share a row on mobile so Export keeps
            its own line rather than being squeezed to an icon. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 sm:w-48 sm:flex-none">
            <label htmlFor="report-job" className="sr-only">
              Filter by job
            </label>
            <SettingsSelect
              id="report-job"
              value={job}
              onChange={setJob}
              placeholder="All jobs"
              options={[
                { value: '', label: 'All jobs' },
                ...jobs.map((j) => ({ value: j, label: j })),
              ]}
            />
          </div>
          <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
            <label htmlFor="report-range" className="sr-only">
              Date range
            </label>
            <SettingsSelect
              id="report-range"
              value={range}
              onChange={(v) => setRange(v as ReportRange)}
              options={REPORT_RANGES.map((r) => ({ value: r.value, label: r.label }))}
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            <Download size={15} />
            Export
          </button>
        </div>
      </div>

      {/* §11: a stat card is a caption, a number and an optional delta — no
          box. Hairline dividers group them without six competing surfaces. */}
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-y border-border py-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-4">
        {data.stats.map((s) => (
          <div key={s.id} className="min-w-0">
            <p className="eyebrow truncate">{s.label}</p>
            <p className="mt-1.5 font-mono text-display tabular-nums text-heading">{s.value}</p>
            {s.delta !== null && (
              <p
                className={cn(
                  'mt-1 inline-flex items-center gap-1 text-caption font-medium',
                  s.delta >= 0 ? 'text-success' : 'text-error'
                )}
              >
                {s.delta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span className="font-mono tabular-nums">{Math.abs(s.delta)}%</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Trend. §14: no card wrapping the chart — the plot is the object. */}
      <div className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-h3 text-heading">Overall progress</h2>
            <p className="mt-1 text-body-sm text-muted">
              Candidates invited versus those who responded,{' '}
              {data.granularity === 'daily' ? 'per day' : 'per week'}
              {job ? `, for ${job}` : ''}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
          {[
            { c: invitedColor, l: SERIES.invited.label },
            { c: respondedColor, l: SERIES.responded.label },
          ].map((s) => (
            <span key={s.l} className="inline-flex items-center gap-1.5 text-body-sm text-bodyText">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.c }}
                aria-hidden
              />
              {s.l}
            </span>
          ))}
          </div>
        </div>

        <div className="mt-5 h-[260px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            {/* Right margin reserves a lane for the final x-axis label, which
                otherwise renders half outside the plot area (§14). */}
            <AreaChart data={data.progress} margin={{ top: 4, right: 20, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="fillInvited" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={invitedColor} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={invitedColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillResponded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={respondedColor} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={respondedColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                allowDecimals={false}
                width={44}
              />
              <Tooltip
                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                content={<ChartTooltip granularity={data.granularity} />}
              />
              {/* 2px strokes, no dots until hover — thin marks, recessive grid */}
              <Area
                type="monotone"
                dataKey="invited"
                name={SERIES.invited.label}
                stroke={invitedColor}
                strokeWidth={2}
                fill="url(#fillInvited)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
              />
              <Area
                type="monotone"
                dataKey="responded"
                name={SERIES.responded.label}
                stroke={respondedColor}
                strokeWidth={2}
                fill="url(#fillResponded)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-job breakdown — a table, because these are exact values to compare */}
      <div className="mt-10">
        <h2 className="text-h3 text-heading">By job</h2>
        <p className="mt-1 text-body-sm text-muted">
          {job ? `How ${job} is converting.` : 'How each open role is converting.'}
        </p>
        <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                  Job
                </th>
                {['Invited', 'Responded', 'Response rate', 'Hired'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 text-right font-mono text-caption font-medium text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.byJob.map((j, i) => {
                const rate = j.invited ? Math.round((j.responded / j.invited) * 100) : 0;
                return (
                  <tr key={j.jobTitle} className={cn(i > 0 && 'border-t border-border')}>
                    <td className="px-4 py-3 text-body font-medium text-heading">{j.jobTitle}</td>
                    <td className="px-4 py-3 text-right font-mono text-body-sm tabular-nums text-bodyText">
                      {j.invited}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-body-sm tabular-nums text-bodyText">
                      {j.responded}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-body-sm tabular-nums text-bodyText">
                      {rate}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-body-sm tabular-nums text-bodyText">
                      {j.hired}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
