import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** Loading state for the candidates directory. */
export function CandidatesSkeleton() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-80" />

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-16 rounded-md" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-56 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>

      <Skeleton className="mt-4 h-4 w-32" />

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-4 border-b border-border bg-muted-bg px-4 py-3">
          {[24, 20, 16, 14, 20].map((w, i) => (
            <Skeleton key={i} className={`h-3 w-${w}`} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn('flex items-center gap-4 px-4 py-3', i > 0 && 'border-t border-border')}>
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="ml-auto h-4 w-32 shrink-0" />
            <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
            <Skeleton className="h-8 w-24 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
