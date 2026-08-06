import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** Loading state for Settings → Integrations. */
export function IntegrationsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-4 h-4 w-96" />

      {/* API keys */}
      <div className="mt-8">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-2 h-3 w-80" />
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
          <div className="px-4 py-8">
            <Skeleton className="mx-auto h-3 w-56" />
          </div>
        </div>
      </div>

      {/* Connections */}
      <div className="mt-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-72" />
        <div className="mt-4 rounded-lg border border-border bg-surface">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 px-4 py-4',
                i > 0 && 'border-t border-border'
              )}
            >
              <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
              <div className="flex min-w-0 flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="ml-auto h-9 w-24 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
