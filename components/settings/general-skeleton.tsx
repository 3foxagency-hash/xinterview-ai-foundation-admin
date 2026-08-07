import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** One label/helper + control row, matching SettingsRow's real geometry. */
function Row({ helper = true, control }: { helper?: boolean; control: string }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        {helper && <Skeleton className="h-3 w-52" />}
      </div>
      <Skeleton className={cn('shrink-0', control)} />
    </div>
  );
}

/**
 * Loading state for Settings → General. Mirrors the real page's structure —
 * page header, logo card, and the six-row company details card — so the layout
 * does not shift when data arrives.
 */
export function GeneralSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      {/* Page header */}
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-4 h-4 w-96" />

      {/* Company logo */}
      <div className="mt-8">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-md" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>
      </div>

      {/* Company details */}
      <div className="mt-8">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
          <Row control="h-10 w-full md:w-[400px] rounded-md" />
          <Row control="h-10 w-full md:w-[400px] rounded-md" />
          <Row control="h-10 w-full md:w-[400px] rounded-md" />
          <Row control="h-10 w-full md:w-[400px] rounded-md" />
          <Row control="h-10 w-full md:w-[400px] rounded-md" />
          <Row control="h-10 w-full md:w-[400px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
