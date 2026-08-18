'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem as NavItemType } from '@/lib/nav-config';
import { NavTooltip } from './nav-tooltip';

interface NavItemProps {
  item: NavItemType;
  expanded: boolean;
  showTooltip: boolean;
}

export function NavItem({ item, expanded, showTooltip }: NavItemProps) {
  const pathname = usePathname();
  // Overview and Jobs match exactly: both have deeper routes that belong to
  // other nav entries (the job wizard lives under /jobs/new and /jobs/[id],
  // which is reached via "Create New Job", not the Jobs list).
  const exactOnly = item.href === '/dashboard' || item.href === '/jobs';
  const isActive = exactOnly
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        // Base layout
        'group relative flex items-center rounded-md transition-colors duration-100',
        expanded
          ? 'h-9 w-full gap-2.5 px-3'
          : 'h-10 w-10 justify-center',
        // Active  → solid indigo pill, matching the settings sub-nav so the
        //           two navigation levels read the same way (§8.1: active
        //           navigation is a solid fill, never a tinted pill).
        // Hover   → subtle grey wash, no hue shift.
        isActive
          ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
          : 'text-muted hover:bg-surface-hover hover:text-heading'
      )}
    >
      <Icon
        size={18}
        strokeWidth={isActive ? 2 : 1.5}
        className="shrink-0"
      />
      {expanded && (
        <span className="truncate text-body font-medium">
          {item.label}
        </span>
      )}

      {/* Count badge — expanded: pill on right (§8.1) */}
      {expanded && item.count !== undefined && item.count > 0 && (
        <span className={cn(
          'ml-auto flex h-[18px] items-center rounded-full px-2 text-[11px] font-medium tabular-nums',
          isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-surface-2 text-muted'
        )}>
          {item.count}
        </span>
      )}

      {/* Unread dot — expanded */}
      {expanded && item.unread && !item.count && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
      )}

      {/* Dot indicator — rail mode */}
      {!expanded && ((item.count !== undefined && item.count > 0) || item.unread) && (
        <span
          className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </Link>
  );

  if (!expanded && showTooltip) {
    return <NavTooltip label={item.label}>{link}</NavTooltip>;
  }

  return link;
}
