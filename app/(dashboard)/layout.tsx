'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/sidebar/use-sidebar';
import { Sidebar } from '@/components/sidebar/sidebar';
import { MobileDrawer } from '@/components/sidebar/mobile-drawer';
import type { ProfileMenuUser } from '@/components/sidebar/profile-menu';
import { BrandWordmark } from '@/components/ui/brand-mark';

const demoUser: ProfileMenuUser = {
  name: 'Sarah Chen',
  email: 'sarah.chen@xinterview.ai',
  role: 'Recruiter',
  initials: 'SC',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebar = useSidebar();
  const pathname = usePathname();
  const { setMobileOpen } = sidebar;

  // Close mobile drawer on navigation — only depend on stable callback, not the whole object
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const showRail = sidebar.mobileReady && !sidebar.isMobile;
  const showMobileButton = sidebar.mobileReady && sidebar.isMobile;

  // Prevent flash of wrong width: use a stable default until we know the layout
  const expanded = showRail ? sidebar.expanded : true;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — fixed, does not scroll with page */}
      {showRail && (
        <div className="fixed inset-y-0 left-0 z-30 h-screen">
          <Sidebar
            expanded={expanded}
            onToggle={sidebar.toggle}
            user={demoUser}
          />
        </div>
      )}

      {/* Mobile drawer */}
      {showMobileButton && (
        <MobileDrawer
          open={sidebar.mobileOpen}
          onClose={() => sidebar.setMobileOpen(false)}
          user={demoUser}
        />
      )}

      {/* Content area */}
      <div
        className={
          showRail
            ? expanded
              ? 'ml-[260px] flex h-screen min-w-0 w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 motion-reduce:transition-none'
              : 'ml-[72px] flex h-screen min-w-0 w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 motion-reduce:transition-none'
            : 'flex h-screen min-w-0 w-0 flex-1 flex-col overflow-hidden'
        }
      >
        {/* Mobile top bar — menu button + logo */}
        {showMobileButton && (
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={() => sidebar.setMobileOpen(true)}
              aria-label="Open navigation"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-bodyText hover:bg-card-hover"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
            <BrandWordmark height={20} />
          </div>
        )}

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
