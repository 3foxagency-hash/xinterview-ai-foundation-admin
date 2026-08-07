import { cn } from '@/lib/utils';
import type { UsageMetric } from '@/lib/api/settings';

/**
 * A usage allowance as a radial dial: the number leads, the ring gives the
 * proportion at a glance, and remaining allowance is stated in words. Four of
 * these read as a scannable row, where four identical bars read as a list.
 *
 * The ring is drawn with stroke-dasharray on a circle rather than a chart
 * library — one value against a limit is a meter, not a chart.
 */
export function UsageDial({
  metric,
  adornment,
}: {
  metric: UsageMetric;
  /** Optional control beside the label, e.g. an info popover */
  adornment?: React.ReactNode;
}) {
  const pct = metric.limit > 0 ? Math.min(100, (metric.used / metric.limit) * 100) : 0;
  const full = metric.used >= metric.limit;
  const near = !full && pct >= 80;
  const remaining = Math.max(0, metric.limit - metric.used);

  // r=27 in a 64px box; circumference drives the dash offset. A minimum sweep
  // keeps a non-zero allowance visible — a 1% arc is otherwise a dot that reads
  // as a rendering fault rather than "barely used".
  const r = 27;
  const c = 2 * Math.PI * r;
  const sweep = metric.used > 0 ? Math.max(pct, 2) : 0;

  const tone = full ? 'text-error' : near ? 'text-warning' : 'text-primary';

  return (
    <div className="flex items-center gap-3.5">
      <div className="relative h-16 w-16 shrink-0">
        <svg
          viewBox="0 0 64 64"
          className="h-full w-full -rotate-90"
          role="progressbar"
          aria-valuenow={metric.used}
          aria-valuemin={0}
          aria-valuemax={metric.limit}
          aria-label={`${metric.label}: ${metric.used} of ${metric.limit} ${metric.unit}`}
        >
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            strokeWidth="5"
            stroke="var(--border)"
          />
          {sweep > 0 && (
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c - (sweep / 100) * c}
              className={cn('transition-all duration-500', tone)}
              stroke="currentColor"
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-body-sm font-semibold tabular-nums text-heading">
          {Math.round(pct)}%
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-body-sm font-medium text-heading">{metric.label}</span>
          {adornment}
        </div>
        <p className="mt-0.5 text-h3 tabular-nums text-heading">
          {metric.used}
          <span className="text-body-sm font-normal text-muted"> / {metric.limit}</span>
        </p>
        <p className={cn('mt-0.5 truncate text-caption', full ? 'text-error' : 'text-muted')}>
          {full ? 'Allowance used up' : `${remaining} ${metric.unit.toLowerCase()} left`}
        </p>
      </div>
    </div>
  );
}
