'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { settingsNavGroups } from '@/lib/settings-nav-config';
import { NavTooltip } from '@/components/sidebar/nav-tooltip';

interface SettingsSubNavProps {
  collapsed?: boolean;
}

export function SettingsSubNav({ collapsed = false }: SettingsSubNavProps) {
  const pathname = usePathname();

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
          <h2 className="text-h2 text-heading">Settings</h2>
        </div>
      )}

      <div className={cn('flex-1 overflow-y-auto pb-6', collapsed ? 'px-2 pt-4' : 'px-3 pt-2')}>
        {settingsNavGroups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-5')}>
            {collapsed ? (
              gi > 0 && <div className="mx-2 my-2 h-px bg-border" />
            ) : (
              <span className="block px-3 pb-1 text-caption font-medium uppercase tracking-wider text-muted">
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
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
                      collapsed
                        ? 'h-10 w-10 justify-center'
                        : 'h-9 w-full gap-2 px-3',
                      isActive
                        ? 'bg-active-menu-bg font-medium text-primary'
                        : item.danger
                          ? 'text-error hover:bg-card-hover'
                          : 'text-bodyText hover:bg-card-hover'
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
