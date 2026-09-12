import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/**
 * Loading state shared by every customisation section (branding, welcome,
 * form, experience, evaluation, notifications, thank-you, social). Mirrors
 * SettingsSection's bordered card of stacked label/control rows.
 */
export function CustomisationSectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn('px-4 py-4', i > 0 && 'border-t border-border')}
          >
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="mt-1.5 h-3 w-52" />
            <Skeleton className="mt-3 h-10 w-full max-w-[400px] rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
