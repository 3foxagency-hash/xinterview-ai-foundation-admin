import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

function Row({ control = 'h-10 w-full md:w-[400px]' }: { control?: string }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-52" />
      </div>
      <Skeleton className={cn('shrink-0 rounded-md', control)} />
    </div>
  );
}

/** Loading state for Settings → Careers page. */
export function CareerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      <Skeleton className="h-8 w-44" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-4 h-4 w-96" />

      {/* Share */}
      <div className="mt-8">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-3 w-72" />
        <div className="mt-4 flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Branding */}
      <div className="mt-8">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-2 h-3 w-64" />
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <Row control="h-6 w-11" />
          <Row control="h-8 w-56" />
          <Row control="h-8 w-56" />
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-72" />
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <div className="border-b border-border p-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-64" />
            <Skeleton className="mt-3 h-32 w-full rounded-md" />
          </div>
          <div className="p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-64" />
            <Skeleton className="mt-3 h-32 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="mt-8">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-2 h-3 w-72" />
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <Row control="h-10 w-40" />
          <Row control="h-10 w-40" />
          <div className="border-t border-border p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-10 w-full rounded-md" />
          </div>
          <div className="border-t border-border p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-20 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
