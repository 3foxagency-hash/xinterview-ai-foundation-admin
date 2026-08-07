import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/**
 * Loading state for Settings → Billing & plan. Mirrors the real page: the plan
 * hero with its usage dials, then the coupon row and three plan cards.
 */
export function BillingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      {/* Page header */}
      <Skeleton className="h-8 w-44" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-4 h-4 w-96" />

      {/* Plan hero + usage dials */}
      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="bg-muted-bg px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-[74px] w-40 rounded-lg" />
          </div>
        </div>

        <div className="border-t border-border px-5 py-5 sm:px-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-3 w-44" />
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Change plan header + cycle toggle */}
      <div className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-10 w-full rounded-md sm:w-[260px]" />
        </div>

        {/* Coupon row */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg sm:w-20" />
        </div>

        {/* Plan cards */}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-2 h-3 w-40" />
              <Skeleton className="mt-4 h-9 w-28" />
              <div className="mt-5 flex flex-col gap-2.5">
                {Array.from({ length: 7 }).map((__, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="mt-6 h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
