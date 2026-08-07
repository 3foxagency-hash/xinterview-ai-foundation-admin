import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-border', className)}
    />
  );
}

export function TeamSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-8 py-8" aria-hidden>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="mt-2 h-4 w-64" />
      <Skeleton className="mt-4 h-4 w-96" />

      <div className="mt-8 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-1.5 w-40" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <div className="flex items-center gap-4 border-b border-border bg-muted-bg px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-4 px-4 py-3',
              i > 0 && 'border-t border-border'
            )}
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="ml-auto h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
