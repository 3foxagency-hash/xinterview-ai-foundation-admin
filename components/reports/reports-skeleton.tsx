export function ReportsSkeleton() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1100px] animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-8 w-40 rounded bg-muted-bg" />
          <div className="mt-3 h-4 w-64 rounded bg-muted-bg" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-10 w-full rounded-md bg-muted-bg sm:w-44" />
          <div className="h-10 w-full rounded-md bg-muted-bg sm:w-28" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4">
            <div className="h-3.5 w-20 rounded bg-muted-bg" />
            <div className="mt-2 h-7 w-12 rounded bg-muted-bg" />
            <div className="mt-2 h-3 w-24 rounded bg-muted-bg" />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-5">
        <div className="h-5 w-40 rounded bg-muted-bg" />
        <div className="mt-2 h-3.5 w-64 rounded bg-muted-bg" />
        <div className="mt-3 flex gap-4">
          <div className="h-3.5 w-16 rounded bg-muted-bg" />
          <div className="h-3.5 w-20 rounded bg-muted-bg" />
        </div>
        <div className="mt-4 h-[260px] w-full rounded-md bg-muted-bg sm:h-[320px]" />
      </div>

      <div className="mt-6">
        <div className="h-5 w-24 rounded bg-muted-bg" />
        <div className="mt-2 h-3.5 w-56 rounded bg-muted-bg" />
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <div className="h-10 border-b border-border bg-muted-bg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
              <div className="h-4 flex-1 rounded bg-muted-bg" />
              <div className="h-4 w-12 rounded bg-muted-bg" />
              <div className="h-4 w-12 rounded bg-muted-bg" />
              <div className="h-4 w-12 rounded bg-muted-bg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
