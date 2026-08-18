'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { settingsNavGroups, type SettingsNavGroup } from '@/lib/settings-nav-config';
import { NavTooltip } from '@/components/sidebar/nav-tooltip';

interface SettingsSubNavProps {
  collapsed?: boolean;
  /** 'strip' renders a horizontal scroller for mobile */
  variant?: 'sidebar' | 'strip';
  /** Heading above the list. */
  title?: string;
  /** Which nav tree to render — organisation settings by default. */
  groups?: SettingsNavGroup[];
}

export function SettingsSubNav({
  collapsed = false,
  variant = 'sidebar',
  title = 'Settings',
  groups = settingsNavGroups,
}: SettingsSubNavProps) {
  const pathname = usePathname();

  // Mobile: one horizontal row of labelled pills, grouped headings dropped
  // since there is no room for them.
  if (variant === 'strip') {
    return <StripNav pathname={pathname} groups={groups} />;
  }

  return (
    <nav
      aria-label="Settings navigation"
      className={cn(
        'flex h-full flex-col border-r border-border bg-surface',
        collapsed ? 'w-14' : 'w-[240px]'
      )}
    >
      {!collapsed && (
        <div className="shrink-0 px-4 pb-3 pt-6">
          <h2 className="text-h2 text-heading">{title}</h2>
        </div>
      )}

      <div className={cn('flex-1 overflow-y-auto pb-6', collapsed ? 'px-2 pt-4' : 'px-3 pt-2')}>
        {groups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-5')}>
            {collapsed || !group.label ? (
              gi > 0 && <div className="mx-2 my-2 h-px bg-border" />
            ) : (
              // §10: a named group uses label-12 weight 500 gray-900 in
              // sentence case — uppercase tracking competes with the nav labels.
              <span className="block px-3 pb-2 text-caption font-medium text-muted">
                {group.label}
              </span>
            )}

            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                const linkEl = (
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center rounded-md transition-colors duration-100',
                      collapsed
                        ? 'h-10 w-10 justify-center'
                        : 'h-9 w-full gap-2 px-3',
                      isActive
                        ? 'bg-primary font-medium text-primary-foreground hover:bg-primary-hover'
                        : item.danger
                          ? 'text-error hover:bg-card-hover'
                          : 'text-muted hover:bg-surface-hover hover:text-heading'
                    )}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                    {!collapsed && (
                      <span className="truncate text-body">{item.label}</span>
                    )}
                  </Link>
                );

                return collapsed ? (
                  <NavTooltip key={item.href} label={item.label}>
                    {linkEl}
                  </NavTooltip>
                ) : (
                  <React.Fragment key={item.href}>{linkEl}</React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

/**
 * Mobile settings nav: one horizontal row of labelled pills. An icon-only rail
 * was unusable here — 15 unlabelled icons with no way to tell them apart.
 * Group headings are dropped since there is no room for them.
 */
function StripNav({ pathname, groups }: { pathname: string; groups: SettingsNavGroup[] }) {
  const items = React.useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const activeRef = React.useRef<HTMLAnchorElement>(null);

  // Bring the current page into view so you can see where you are in a list
  // that is mostly off-screen.
  React.useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);

  return (
    <nav
      aria-label="Settings navigation"
      // The right-edge fade signals there is more to scroll — without it the
      // strip looks like it only holds the few visible items.
      className="relative border-b border-border bg-surface after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-l after:from-surface after:to-transparent"
    >
      <div className="flex gap-1 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={isActive ? activeRef : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-body-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  : item.danger
                    ? 'text-error hover:bg-card-hover'
                    : 'text-muted hover:bg-surface-hover hover:text-heading'
              )}
            >
              <Icon size={14} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
