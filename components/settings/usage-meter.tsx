import { cn } from '@/lib/utils';
import type { UsageMetric } from '@/lib/api/settings';

/**
 * One usage row: label, "used of limit", a progress bar and an explanatory
 * note. The bar turns amber past 80% and red once the allowance is exhausted.
 */
export function UsageMeter({
  metric,
  adornment,
}: {
  metric: UsageMetric;
  /** Optional control shown beside the label, e.g. an info popover */
  adornment?: React.ReactNode;
}) {
  const pct = metric.limit > 0 ? Math.min(100, (metric.used / metric.limit) * 100) : 0;
  const full = metric.used >= metric.limit;
  const near = !full && pct >= 80;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="flex items-center gap-1.5 text-body-sm font-medium text-heading">
          {metric.label}
          {adornment}
        </span>
        <span className="shrink-0 text-body-sm tabular-nums text-muted">
          {metric.used} of {metric.limit} {metric.unit}
        </span>
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted-bg"
        role="progressbar"
        aria-valuenow={metric.used}
        aria-valuemin={0}
        aria-valuemax={metric.limit}
        aria-label={`${metric.label}: ${metric.used} of ${metric.limit} ${metric.unit}`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            full ? 'bg-error' : near ? 'bg-warning' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={cn('mt-1.5 text-body-sm', full ? 'text-error' : 'text-muted')}>
        {metric.note}
      </p>
    </div>
  );
}
