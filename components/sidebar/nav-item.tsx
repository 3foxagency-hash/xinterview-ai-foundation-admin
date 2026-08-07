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
  const isActive =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        // Base layout
        'group relative flex items-center rounded-md transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
        expanded
          ? 'h-9 w-full gap-2.5 px-3'
          : 'h-10 w-10 justify-center',
        // Stripe pattern:
        // Active  → no background, just indigo text + icon
        // Hover   → very subtle gray background, text stays body color (no hue shift)
        // Default → body-color text, no background
        isActive
          ? 'text-primary'
          : 'text-bodyText hover:bg-muted-bg'
      )}
    >
      <Icon
        size={18}
        strokeWidth={isActive ? 2 : 1.5}
        className="shrink-0"
      />
      {expanded && (
        <span className={cn(
          'truncate text-body',
          isActive ? 'font-semibold' : 'font-normal'
        )}>
          {item.label}
        </span>
      )}

      {/* Count badge — expanded: pill on right */}
      {expanded && item.count !== undefined && item.count > 0 && (
        <span className={cn(
          'ml-auto rounded-full px-2 py-0.5 text-caption font-semibold tabular-nums',
          isActive ? 'bg-primary/10 text-primary' : 'bg-muted-bg text-muted-foreground'
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
