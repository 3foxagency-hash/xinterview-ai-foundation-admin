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
  const [overflowing, setOverflowing] = React.useState(false);

  // Measure whether the middle nav block fits. If not, switch to top-aligned scroll.
  React.useEffect(() => {
    const el = middleRef.current;
    if (!el) return;
    const check = () => {
      const fits = el.scrollHeight <= el.clientHeight;
      setOverflowing(!fits);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded]);

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

      {/* ── MIDDLE ZONE (primary nav, vertically centered with overflow fallback) ── */}
      <nav
        ref={middleRef}
        aria-label="Main navigation"
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto px-3',
          overflowing ? 'justify-start' : 'justify-center'
        )}
      >
        <div className={cn('flex flex-col gap-2 py-2', overflowing ? '' : 'my-auto')}>
          {primaryNavGroups.map((group, gi) => (
            <div key={group.label} className="flex flex-col gap-1">
              {/* Group label: text in expanded, 1px divider in rail */}
              {expanded ? (
                <span className="px-3 pb-1 pt-2 text-caption uppercase tracking-wider text-muted">
                  {group.label}
                </span>
              ) : (
                gi > 0 && <div className="mx-2 my-1 h-px bg-border" />
              )}

              <div className="flex flex-col gap-1">
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

      {/* ── BOTTOM ZONE ── */}
      <div className="flex shrink-0 flex-col gap-1 px-3 pb-4">
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
