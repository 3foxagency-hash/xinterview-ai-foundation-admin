'use client';

import * as React from 'react';
import Link from 'next/link';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { primaryNavGroups, bottomNavItems } from '@/lib/nav-config';
import { NavItem } from './nav-item';
import { ProfileMenu, type ProfileMenuUser } from './profile-menu';

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
  user: ProfileMenuUser;
}

export function Sidebar({ expanded, onToggle, user }: SidebarProps) {
  const middleRef = React.useRef<HTMLElement>(null);

  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        'flex h-full flex-col border-r border-border bg-surface transition-[width] duration-200 motion-reduce:transition-none overflow-hidden',
        expanded ? 'w-[260px]' : 'w-[72px]'
      )}
    >
      {/* ── TOP ZONE ── */}
      <div className={cn('flex shrink-0 items-center py-4', expanded ? 'gap-2 px-3' : 'flex-col gap-3 px-2')}>
        {/* Logo always visible */}
        <Link
          href="/dashboard"
          aria-label="XInterview home"
          className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-button font-bold text-primary-foreground">
            X
          </span>
          {expanded && (
            <span className="whitespace-nowrap text-h3 font-semibold tracking-tight text-heading">XInterview</span>
          )}
        </Link>

        {/* Future "New interview" primary action slot */}

        {/* Toggle button — ChatGPT style: beside logo when expanded, below logo when rail */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md text-muted transition-colors',
            'hover:bg-card-hover hover:text-bodyText',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            'h-8 w-8',
            expanded && 'ml-auto'
          )}
        >
          <PanelLeft size={18} strokeWidth={1.5} className="shrink-0" />
        </button>
      </div>

      {/* ── MIDDLE ZONE (primary nav) ──
          Top-aligned. Centring this block left ~170px of dead space between
          the last primary item and the bottom group on a normal screen. */}
      <nav
        ref={middleRef}
        aria-label="Main navigation"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-1"
      >
        <div className="flex flex-col gap-4 pb-2">
          {primaryNavGroups.map((group, gi) => (
            <div key={group.label} className="flex flex-col gap-1">
              {/* Group label: text in expanded, 1px divider in rail */}
              {expanded ? (
                <span className="px-3 pb-1 text-caption font-medium uppercase tracking-wider text-muted">
                  {group.label}
                </span>
              ) : (
                gi > 0 && <div className="mx-2 my-1 h-px bg-border" />
              )}

              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    expanded={expanded}
                    showTooltip
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── BOTTOM ZONE ──
          Separated from the scrolling nav by a rule so the two groups read as
          distinct even when the nav list is long enough to reach it. */}
      <div className="mt-2 flex shrink-0 flex-col gap-0.5 border-t border-border px-3 pb-3 pt-3">
        {bottomNavItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            expanded={expanded}
            showTooltip
          />
        ))}

        <div className="mt-4">
          <ProfileMenu user={user} expanded={expanded} />
        </div>
      </div>
    </aside>
  );
}
