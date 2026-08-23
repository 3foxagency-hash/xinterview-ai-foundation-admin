'use client';

import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { strings } from '@/lib/interview/strings';

type BrowserKey = 'chrome' | 'safari' | 'firefox' | 'edge';

const BROWSER_LABELS: Record<BrowserKey, string> = {
  chrome: 'Chrome',
  safari: 'Safari',
  firefox: 'Firefox',
  edge: 'Edge',
};

const BROWSER_STEPS: Record<BrowserKey, readonly string[]> = {
  chrome: strings.setupHelpChrome,
  safari: strings.setupHelpSafari,
  firefox: strings.setupHelpFirefox,
  edge: strings.setupHelpEdge,
};

const BROWSER_ORDER: BrowserKey[] = ['chrome', 'safari', 'firefox', 'edge'];

function detectBrowser(): BrowserKey {
  if (typeof navigator === 'undefined') return 'chrome';
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return 'edge';
  if (/chrome|crios/i.test(ua)) return 'chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'safari';
  if (/firefox|fxios/i.test(ua)) return 'firefox';
  return 'chrome';
}

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  const detected = React.useMemo(detectBrowser, []);
  const [expanded, setExpanded] = React.useState<BrowserKey | null>(detected);

  const ordered = [
    detected,
    ...BROWSER_ORDER.filter((b) => b !== detected),
  ] as BrowserKey[];

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`iv-help-overlay ${open ? 'open' : ''}`}>
      <div className="iv-help-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="iv-help-panel"
        role="dialog"
        aria-modal="false"
        aria-label={strings.setupHelpTitle}
      >
        <div className="iv-help-header">
          <h3 className="iv-help-title">{strings.setupHelpTitle}</h3>
          <button
            type="button"
            className="iv-help-close"
            onClick={onClose}
            aria-label={strings.setupHelpClose}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {ordered.map((browser) => {
          const isExpanded = expanded === browser;
          return (
            <div
              key={browser}
              className={`iv-help-browser ${isExpanded ? 'expanded' : ''}`}
            >
              <button
                type="button"
                className="iv-help-browser-header"
                onClick={() => setExpanded(isExpanded ? null : browser)}
                aria-expanded={isExpanded}
              >
                <span className="iv-help-browser-name">
                  {BROWSER_LABELS[browser]}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  className="iv-help-browser-chevron"
                  aria-hidden="true"
                />
              </button>
              <ol className="iv-help-browser-steps">
                {BROWSER_STEPS[browser].map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
