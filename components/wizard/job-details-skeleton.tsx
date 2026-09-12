import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/**
 * Loading state for the job details step (/jobs/new/setup, also reused when
 * editing an existing job's details). Shown only while an existing job's
 * data is still loading — a brand-new job has nothing to fetch.
 */
export function JobDetailsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-6" aria-hidden>
      <Skeleton className="h-7 w-52" />
      <Skeleton className="mt-3 h-4 w-80" />

      <div className="mt-8 space-y-6 rounded-lg border border-border bg-surface p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-2 h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
