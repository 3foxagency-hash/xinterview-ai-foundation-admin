'use client';

import * as React from 'react';

const STORAGE_KEY = 'xinterview-sidebar-expanded';
const MOBILE_BREAKPOINT = 1024;

export type SidebarState = {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  isMobile: boolean;
  /** true until the first effect runs to confirm we're on desktop — prevents flash */
  mobileReady: boolean;
};

export function useSidebar(): SidebarState {
  const [expanded, setExpandedState] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [mobileReady, setMobileReady] = React.useState(false);

  // Restore persisted expanded state without a flash.
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setExpandedState(stored === 'true');
    } catch {
      // ignore unreadable storage
    }
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setMobileReady(true);
      if (mobile) setMobileOpen(false);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const setExpanded = React.useCallback((v: boolean) => {
    setExpandedState(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      // ignore unwritable storage
    }
  }, []);

  const toggle = React.useCallback(() => {
    setExpandedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return {
    expanded,
    setExpanded,
    toggle,
    mobileOpen,
    setMobileOpen,
    isMobile,
    mobileReady,
  };
}
