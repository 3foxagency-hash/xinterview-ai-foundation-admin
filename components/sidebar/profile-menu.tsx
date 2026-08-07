'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import {
  ChevronsUpDown,
  CircleCheck,
  CreditCard,
  Building2,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProfileMenuUser {
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface ProfileMenuProps {
  user: ProfileMenuUser;
  expanded: boolean;
}

const themeOrder = ['light', 'dark', 'system'] as const;
type ThemeMode = (typeof themeOrder)[number];

const themeIcon: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabel: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function ProfileMenu({ user, expanded }: ProfileMenuProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);

  const currentTheme = (theme as ThemeMode) ?? 'system';
  const ThemeIcon = mounted ? themeIcon[currentTheme] ?? Monitor : Monitor;

  const menuItems = React.useMemo(
    () => [
      { id: 'account', label: 'Account', icon: CircleCheck, href: '/dashboard/account' },
      { id: 'billing', label: 'Billing', icon: CreditCard, href: '/dashboard/billing' },
      { id: 'organizations', label: 'Organizations', icon: Building2, href: '/dashboard/organizations' },
    ],
    []
  );

  const focusableItems = React.useMemo(() => {
    const items: { ref: (el: HTMLButtonElement | HTMLAnchorElement | null) => void; action: () => void; }[] = [];
    items.push({ ref: (el) => { itemRefs.current[0] = el; }, action: () => cycleTheme() });
    menuItems.forEach((mi, i) => {
      items.push({
        ref: (el) => { itemRefs.current[i + 1] = el; },
        action: () => {},
      });
    });
    items.push({
      ref: (el) => { itemRefs.current[menuItems.length + 1] = el; },
      action: () => { handleLogout(); },
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItems]);

  const totalItems = focusableItems.length;

  const cycleTheme = React.useCallback(() => {
    const currentIdx = themeOrder.indexOf(currentTheme);
    const next = themeOrder[(currentIdx + 1) % themeOrder.length];
    setTheme(next);
  }, [currentTheme, setTheme]);

  const handleLogout = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const openMenu = React.useCallback(() => {
    setOpen(true);
    React.startTransition(() => {});
  }, []);

  const closeMenu = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      openMenu();
      // focus first item after menu opens
      requestAnimationFrame(() => itemRefs.current[0]?.focus());
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = itemRefs.current.findIndex((el) => el === document.activeElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (currentIndex + 1) % totalItems;
      itemRefs.current[next]?.focus();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (currentIndex - 1 + totalItems) % totalItems;
      itemRefs.current[prev]?.focus();
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      itemRefs.current[0]?.focus();
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      itemRefs.current[totalItems - 1]?.focus();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      closeMenu();
    }
  };

  // Outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closeMenu]);

  // Focus trap + focus first item on open
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: FocusEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        e.preventDefault();
        itemRefs.current[0]?.focus();
      }
    };
    document.addEventListener('focusin', handler);
    requestAnimationFrame(() => itemRefs.current[0]?.focus());
    return () => document.removeEventListener('focusin', handler);
  }, [open]);

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => (open ? closeMenu() : openMenu())}
      onKeyDown={handleTriggerKeyDown}
      className={cn(
        'flex w-full items-center gap-2 rounded-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        expanded ? 'h-10 px-2' : 'h-10 w-10 justify-center',
        'hover:bg-card-hover'
      )}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-caption font-semibold text-primary"
        aria-hidden="true"
      >
        {user.initials}
      </span>
      {expanded && (
        <>
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span className="truncate text-body-sm font-semibold text-heading">{user.name}</span>
            <span className="truncate text-caption text-muted">{user.role}</span>
          </span>
          <ChevronsUpDown size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
        </>
      )}
    </button>
  );

  return (
    <div className="relative">
      {trigger}

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="User menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute bottom-[calc(100%+8px)] left-0 z-50 w-[260px]',
            'rounded-lg border border-border bg-surface p-2 shadow-lg'
          )}
          style={{
            transform: 'translateY(-4px)',
            animation: 'fadeInRise 150ms ease-out',
          }}
        >
          {/* Header */}
          <div className="px-2 py-2">
            <p className="text-body font-semibold text-heading">{user.name}</p>
            <p className="truncate text-body-sm text-muted">{user.email}</p>
          </div>

          <div className="my-1 h-px bg-border" />

          {/* Theme row */}
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-body-sm text-bodyText">Theme</span>
            <button
              type="button"
              ref={(el) => { itemRefs.current[0] = el; }}
              role="menuitem"
              aria-label={`Theme: ${mounted ? themeLabel[currentTheme] : 'System'}. Click to cycle.`}
              onClick={cycleTheme}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                'text-muted hover:bg-card-hover hover:text-bodyText',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
            >
              <ThemeIcon size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="my-1 h-px bg-border" />

          {/* Menu items */}
          {menuItems.map((mi, i) => {
            const Icon = mi.icon;
            return (
              <a
                key={mi.id}
                href={mi.href}
                ref={(el) => { itemRefs.current[i + 1] = el; }}
                role="menuitem"
                className={cn(
                  'flex h-9 items-center gap-2.5 rounded-md px-2 text-body-sm text-bodyText',
                  'hover:bg-card-hover',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
              >
                <Icon size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
                <span>{mi.label}</span>
              </a>
            );
          })}

          <div className="my-1 h-px bg-border" />

          {/* Log out */}
          <button
            type="button"
            ref={(el) => { itemRefs.current[menuItems.length + 1] = el; }}
            role="menuitem"
            onClick={handleLogout}
            className={cn(
              'flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-body-sm text-error',
              'hover:bg-error-banner-bg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error'
            )}
          >
            <LogOut size={20} strokeWidth={1.5} className="shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
