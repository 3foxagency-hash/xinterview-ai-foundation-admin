export function ReportsSkeleton() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1100px] animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="h-8 w-40 rounded bg-muted-bg" />
          <div className="mt-3 h-4 w-64 rounded bg-muted-bg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-40 rounded-md bg-muted-bg" />
          <div className="h-10 w-28 rounded-md bg-muted-bg" />
        </div>
      </div>

      {/* Stat row — no boxes, matching the real page */}
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-y border-border py-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-2.5 w-16 rounded bg-muted-bg" />
            <div className="mt-2 h-9 w-14 rounded bg-muted-bg" />
            <div className="mt-2 h-3 w-12 rounded bg-muted-bg" />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="h-5 w-40 rounded bg-muted-bg" />
            <div className="mt-2 h-3.5 w-64 rounded bg-muted-bg" />
          </div>
          <div className="flex gap-4">
            <div className="h-3.5 w-16 rounded bg-muted-bg" />
            <div className="h-3.5 w-20 rounded bg-muted-bg" />
          </div>
        </div>
        <div className="mt-5 h-[260px] w-full rounded-md bg-muted-bg sm:h-[320px]" />
      </div>

      <div className="mt-10">
        <div className="h-5 w-24 rounded bg-muted-bg" />
        <div className="mt-2 h-3.5 w-56 rounded bg-muted-bg" />
        <div className="mt-4 rounded-md border border-border bg-surface">
          <div className="h-10 border-b border-border" />
          {Array.from({ length: 4 }).map((_, i) => (
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
