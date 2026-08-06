import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/**
 * Loading state for Settings → Billing & plan. Mirrors the real page: header,
 * the two-column current-plan card, and the three subscription plan cards.
 */
export function BillingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-8 py-8" aria-hidden>
      {/* Page header */}
      <Skeleton className="h-8 w-44" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-4 h-4 w-96" />

      {/* Current plan — name left, renewal right, coupon below */}
      <div className="mt-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-56" />
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-36" />
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2 border-t border-border pt-5">
            <Skeleton className="h-3 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Usage — four meters in two columns */}
      <div className="mt-8">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-2 h-3 w-72" />
        <div className="mt-4 grid gap-5 rounded-lg border border-border bg-surface p-4 md:grid-cols-2 md:gap-x-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* Subscription plans */}
      <div className="mt-8">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-3 w-72" />
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <Skeleton className="mx-auto h-10 w-[280px] rounded-md" />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-5">
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
    </div>
  );
}
