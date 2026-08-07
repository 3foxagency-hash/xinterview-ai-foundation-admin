import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** Loading state for Settings → Integrations. Mirrors the redesigned layout. */
export function IntegrationsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-4 h-4 w-96" />

      {/* Connections — a card grid */}
      <div className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-full" />
                  <Skeleton className="mt-1.5 h-3 w-3/4" />
                </div>
              </div>
              <Skeleton className="mt-4 h-9 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Branding preference */}
      <div className="mt-8 flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="mt-2 h-3 w-72" />
          </div>
        </div>
        <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
      </div>

      {/* API keys */}
      <div className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="mt-4 rounded-md border border-dashed border-border-strong px-6 py-10">
          <Skeleton className="mx-auto h-5 w-5 rounded" />
          <Skeleton className="mx-auto mt-3 h-4 w-32" />
          <Skeleton className="mx-auto mt-2 h-3 w-56" />
        </div>
      </div>
    </div>
  );
}
