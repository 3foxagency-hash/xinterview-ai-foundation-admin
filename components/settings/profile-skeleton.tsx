import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** Loading state for Settings → Profile. Mirrors the two-column layout. */
export function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[800px] px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-3 h-4 w-64" />
      <Skeleton className="mt-4 h-4 w-full max-w-[420px]" />

      {/* Identity card */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <Skeleton className="h-24 rounded-none sm:h-28" />
        <div className="flex items-end gap-5 px-5 pb-5">
          <Skeleton className="-mt-14 h-24 w-24 shrink-0 rounded-2xl" />
          <div className="flex flex-col gap-2 pb-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {/* Personal details */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-3 w-64" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={cn(i >= 4 && 'sm:col-span-2')}>
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="mt-1.5 h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="min-w-0 space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-3 w-44" />
            <Skeleton className="mt-4 h-10 w-full rounded-lg" />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-3 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="mt-1 h-3.5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
