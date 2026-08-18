'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import type { ProfileMenuUser } from './profile-menu';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  user: ProfileMenuUser;
}

export function MobileDrawer({ open, onClose, user }: MobileDrawerProps) {
  // Lock body scroll while drawer is open
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-drawer lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close navigation"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-overlay"
      />

      {/* Drawer — always expanded on mobile, above scrim */}
      <div
        className={cn(
          'absolute left-0 top-0 z-10 h-full',
          'motion-reduce:animate-none'
        )}
        style={{
          animation: 'drawerSlideIn 200ms ease-out',
        }}
      >
        <Sidebar expanded onToggle={onClose} user={user} />
      </div>
    </div>
  );
}
