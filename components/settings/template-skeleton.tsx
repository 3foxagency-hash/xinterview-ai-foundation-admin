import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** Loading state for Settings → Question library, mirroring the template table. */
export function TemplateSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-8 py-8" aria-hidden>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-4 h-4 w-96" />

      <div className="mt-8 flex items-end justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        {/* Template · Questions · Updated · Actions */}
        <div className="flex items-center gap-4 border-b border-border bg-muted-bg px-4 py-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="ml-auto h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn('flex items-center gap-4 px-4 py-3', i > 0 && 'border-t border-border')}
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="ml-auto h-4 w-6 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
