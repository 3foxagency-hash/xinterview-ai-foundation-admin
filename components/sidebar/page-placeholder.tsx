import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  /** Icon from the nav entry, so the page reads as the section you clicked into */
  icon?: LucideIcon;
  description?: string;
  /** Hidden on the overview page, where "back to overview" would be a no-op */
  showBackLink?: boolean;
}

export function PagePlaceholder({
  title,
  icon: Icon,
  description = 'This section is coming soon.',
  showBackLink = true,
}: PagePlaceholderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-[420px] flex-col items-center text-center">
        {Icon && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-active-menu-bg">
            <Icon size={28} strokeWidth={1.5} className="text-primary" aria-hidden="true" />
          </div>
        )}

        <h1 className={Icon ? 'mt-6 text-h1 text-heading' : 'text-h1 text-heading'}>
          {title}
        </h1>
        <p className="mt-2 text-body text-bodyText">{description}</p>

        {showBackLink && (
          <Link
            href="/dashboard"
            className="mt-8 inline-flex h-10 items-center justify-center rounded-md border border-border-strong px-6 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back to overview
          </Link>
        )}
      </div>
    </div>
  );
}
