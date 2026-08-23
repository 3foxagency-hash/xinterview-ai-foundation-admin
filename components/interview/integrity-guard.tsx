'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';
import type { IntegrityConfig } from '@/config/interview-session';

type GuardType = 'tab_switch' | 'fullscreen' | 'browser_back' | 'second_tab' | 'unsupported';

interface IntegrityGuardProps {
  type: GuardType;
  onContinue: () => void;
}

export function IntegrityGuard({ type, onContinue }: IntegrityGuardProps) {
  const config: Record<GuardType, { title: string; body: string; cta: string }> = {
    tab_switch: {
      title: strings.tabSwitchTitle,
      body: strings.tabSwitchBody,
      cta: strings.tabSwitchContinue,
    },
    fullscreen: {
      title: strings.fullscreenTitle,
      body: strings.fullscreenBody,
      cta: strings.fullscreenReturn,
    },
    browser_back: {
      title: strings.errorBrowserBack,
      body: strings.errorBrowserBackBody,
      cta: strings.errorBrowserBackStay,
    },
    second_tab: {
      title: strings.errorSecondTab,
      body: strings.errorSecondTabBody,
      cta: strings.errorSecondTabContinue,
    },
    unsupported: {
      title: strings.errorUnsupportedBrowser,
      body: strings.errorUnsupportedBody,
      cta: strings.errorCopyLink,
    },
  };

  const { title, body, cta } = config[type];
  const [copied, setCopied] = React.useState(false);

  const handleCta = () => {
    if (type === 'unsupported') {
      try {
        navigator.clipboard?.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
      return;
    }
    if (type === 'fullscreen') {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    onContinue();
  };

  return (
    <div className="iv-guard-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="iv-guard-plane iv-plane">
        <h2 className="iv-guard-title">{title}</h2>
        <p className="iv-guard-body">{body}</p>
        {type === 'unsupported' && copied && (
          <p className="iv-guard-copied" role="status">{strings.errorLinkCopied}</p>
        )}
        <div className="iv-controls-group">
          <button type="button" className="iv-cta" onClick={handleCta}>
            {type === 'unsupported' && copied ? strings.errorLinkCopied : cta}
          </button>
          <div className="iv-cta-bloom" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/** Hook that manages tab-switch detection, fullscreen, right-click disabling. */
export function useIntegrityGuards(
  integrity: IntegrityConfig,
  active: boolean,
) {
  const [guard, setGuard] = React.useState<GuardType | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = React.useState(0);
  const fullscreenExitCount = React.useRef(0);

  React.useEffect(() => {
    if (!active || !integrity.tabSwitchDetection) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setTabSwitchCount((c) => {
          const next = c + 1;
          if (next === 1) setGuard('tab_switch');
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [active, integrity.tabSwitchDetection]);

  React.useEffect(() => {
    if (!active || !integrity.requireFullScreen) return;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) return;
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        fullscreenExitCount.current++;
        setGuard('fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [active, integrity.requireFullScreen]);

  React.useEffect(() => {
    if (!active || !integrity.disableRightClick) return;
    const onContext = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', onContext);
    return () => document.removeEventListener('contextmenu', onContext);
  }, [active, integrity.disableRightClick]);

  const requestFullscreen = React.useCallback(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile || !integrity.requireFullScreen) return;
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [integrity.requireFullScreen]);

  return { guard, setGuard, tabSwitchCount, requestFullscreen };
}
