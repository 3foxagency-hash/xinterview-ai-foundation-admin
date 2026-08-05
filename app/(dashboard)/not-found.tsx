import Link from 'next/link';
import { SearchX } from 'lucide-react';

/**
 * 404 for unknown routes inside the (dashboard) group. Rendering within the
 * group keeps the sidebar in place, so a mistyped URL doesn't strand the user
 * outside the app shell.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-[420px] flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-bg">
          <SearchX size={28} strokeWidth={1.5} className="text-muted" aria-hidden="true" />
        </div>

        <p className="mt-6 text-caption font-semibold uppercase tracking-wider text-muted">
          Error 404
        </p>
        <h1 className="mt-2 text-h1 text-heading">Page not found</h1>
        <p className="mt-2 text-body text-bodyText">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back to overview
          </Link>
          <Link
            href="/support"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border-strong px-6 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
