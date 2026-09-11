'use client';

import * as React from 'react';
import type { ThemeMode } from '@/config/interview.mock';
import {
  deriveTokens,
  tokensToStyle,
  assertContrast,
} from '@/lib/interview/theme';

type ResolvedTheme = 'light' | 'dark';

interface InterviewThemeProviderProps {
  brandColor: string;
  themeMode: ThemeMode;
  allowCandidateToggle: boolean;
  /** Skips the no-flash script/localStorage handoff and sets the starting
   *  resolved theme directly. That handoff only works across a real
   *  server-rendered page load — a caller that re-renders this provider
   *  client-side with new props (e.g. the admin customisation preview,
   *  which drives it via postMessage inside an iframe) has no such page
   *  load to hook into, so it can pass this instead. Real candidate
   *  sessions never pass it, so their behavior is unchanged. */
  resolvedOverride?: ResolvedTheme;
  children: React.ReactNode;
}

interface InterviewThemeContextValue {
  resolved: ResolvedTheme;
  toggle: () => void;
  canToggle: boolean;
}

const InterviewThemeContext = React.createContext<InterviewThemeContextValue>({
  resolved: 'light',
  toggle: () => {},
  canToggle: false,
});

export function useInterviewTheme(): InterviewThemeContextValue {
  return React.useContext(InterviewThemeContext);
}

const STORAGE_KEY = 'interview-theme';

/** No-flash inline script: resolves the theme before first paint. */
export function InterviewThemeScript({
  themeMode,
  allowCandidateToggle,
}: {
  themeMode: ThemeMode;
  allowCandidateToggle: boolean;
}) {
  const script = `
(function(){
  try {
    var mode = ${JSON.stringify(themeMode)};
    var allowToggle = ${JSON.stringify(allowCandidateToggle)};
    var stored = null;
    if (allowToggle) {
      stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    }
    var resolved;
    if (stored === 'light' || stored === 'dark') {
      resolved = stored;
    } else if (mode === 'light' || mode === 'dark') {
      resolved = mode;
    } else {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-interview-theme', resolved);
  } catch(e) {
    document.documentElement.setAttribute('data-interview-theme', 'light');
  }
})();
`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}

export function InterviewThemeProvider({
  brandColor,
  themeMode,
  allowCandidateToggle,
  resolvedOverride,
  children,
}: InterviewThemeProviderProps) {
  const [resolved, setResolved] = React.useState<ResolvedTheme>(resolvedOverride ?? 'light');

  // Read the pre-applied theme from the no-flash script. Skipped when a
  // caller passes resolvedOverride directly — see the prop's own doc. Note
  // resolvedOverride only ever affects the INITIAL value here; a caller
  // that changes it later (our preview's Light/Dark buttons) must remount
  // this provider (e.g. via `key`) to have the new value take effect,
  // since a live candidate toggle click needs to keep working independent
  // of whatever the override said at mount time.
  React.useEffect(() => {
    if (resolvedOverride) return;
    const current = document.documentElement.getAttribute(
      'data-interview-theme',
    ) as ResolvedTheme | null;
    if (current === 'light' || current === 'dark') {
      setResolved(current);
    }
    // Deliberately mount-only: resolvedOverride is only meant to seed the
    // initial value (see the prop's own doc) — reacting to later changes
    // here would fight the candidate's own toggle() calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow system changes when in system mode and no stored preference.
  React.useEffect(() => {
    if (themeMode !== 'system' || !allowCandidateToggle) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const next: ResolvedTheme = e.matches ? 'dark' : 'light';
      setResolved(next);
      document.documentElement.setAttribute('data-interview-theme', next);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode, allowCandidateToggle]);

  const canToggle = themeMode === 'system' && allowCandidateToggle;

  const toggle = React.useCallback(() => {
    if (!canToggle) return;
    setResolved((prev) => {
      const next: ResolvedTheme = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      document.documentElement.setAttribute('data-interview-theme', next);
      return next;
    });
  }, [canToggle]);

  // Derive tokens and assert contrast in dev.
  const tokens = React.useMemo(() => {
    if (process.env.NODE_ENV !== 'production') {
      assertContrast(brandColor);
    }
    return deriveTokens(brandColor);
  }, [brandColor]);

  const style = React.useMemo(
    () => tokensToStyle(resolved === 'dark' ? tokens.dark : tokens.light),
    [tokens, resolved],
  );

  const contextValue = React.useMemo(
    () => ({ resolved, toggle, canToggle }),
    [resolved, toggle, canToggle],
  );

  return (
    <InterviewThemeContext.Provider value={contextValue}>
      <div className="interview-page" style={style} data-theme={resolved}>
        {children}
      </div>
    </InterviewThemeContext.Provider>
  );
}
