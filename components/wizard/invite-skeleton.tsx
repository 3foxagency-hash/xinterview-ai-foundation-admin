import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** Loading state for /jobs/[id]/edit/invite. Mirrors the 3-column layout. */
export function InviteSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_300px]"
      aria-hidden
    >
      {/* Nav column */}
      <div className="hidden rounded-lg border border-border bg-surface p-4 lg:block">
        <Skeleton className="h-5 w-20" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* Methods column */}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-3 w-56" />
            <Skeleton className="mt-4 h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* Summary rail */}
      <div className="hidden rounded-lg border border-border bg-surface p-4 xl:block">
        <Skeleton className="h-5 w-24" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
