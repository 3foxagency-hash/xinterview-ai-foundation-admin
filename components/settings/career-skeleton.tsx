import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** Loading state for Settings → Careers page. Mirrors the redesigned layout. */
export function CareerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      <Skeleton className="h-8 w-44" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-4 h-4 w-96" />

      {/* Hero + share */}
      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="bg-muted-bg px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
        <div className="grid gap-4 border-t border-border px-5 py-5 sm:grid-cols-2 sm:px-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-1.5 h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Appearance + preview */}
      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-64" />
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="mt-1.5 h-3 w-40" />
                <div className="mt-2 flex gap-2">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <Skeleton key={j} className="h-7 w-7 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div>
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="mt-2 h-[210px] w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-72" />
        <div className="mt-5 space-y-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="mt-2 h-3 w-64" />
              <Skeleton className="mt-2 h-32 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-10 w-40 shrink-0 rounded-lg" />
      </div>

      {/* SEO */}
      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-3 w-72" />
        <Skeleton className="mt-5 h-[104px] w-full rounded-lg" />
        <div className="mt-5 space-y-5">
          <div>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-1.5 h-10 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="mt-1.5 h-20 w-full rounded-lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="mt-1.5 h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
