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

const TROUBLESHOOTING_STEPS = [
  'Refresh the page if your camera or microphone stops working.',
  'Close other apps that might be using your camera or microphone.',
  'Check your internet connection if uploads are slow.',
  'Try switching to a different browser if problems persist.',
];

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
  recordingActive?: boolean;
}

type Section = 'browser' | 'troubleshooting' | 'handoff' | 'report';

export function HelpPanel({ open, onClose, recordingActive = false }: HelpPanelProps) {
  const detected = React.useMemo(detectBrowser, []);
  const [expanded, setExpanded] = React.useState<BrowserKey | null>(detected);
  const [activeSection, setActiveSection] = React.useState<Section>('browser');
  const [reportText, setReportText] = React.useState('');
  const [reportSent, setReportSent] = React.useState(false);

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

  const sections: { key: Section; label: string }[] = [
    { key: 'browser', label: strings.helpCameraMic },
    { key: 'troubleshooting', label: strings.helpTroubleshooting },
    { key: 'handoff', label: strings.helpDeviceHandoff },
    { key: 'report', label: strings.helpReport },
  ];

  return (
    <div className={`iv-help-overlay ${open ? 'open' : ''}`}>
      <div className="iv-help-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="iv-help-panel"
        role="dialog"
        aria-modal="false"
        aria-label={strings.helpTitle}
      >
        <div className="iv-help-header">
          <h3 className="iv-help-title">{strings.helpTitle}</h3>
          <button
            type="button"
            className="iv-help-close"
            onClick={onClose}
            aria-label={strings.setupHelpClose}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="iv-help-tabs">
          {sections.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`iv-help-tab ${activeSection === s.key ? 'active' : ''}`}
              onClick={() => setActiveSection(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {activeSection === 'browser' && (
          <div className="iv-help-section">
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
        )}

        {activeSection === 'troubleshooting' && (
          <div className="iv-help-section">
            <ol className="iv-help-browser-steps" style={{ display: 'block', paddingLeft: '20px' }}>
              {TROUBLESHOOTING_STEPS.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {activeSection === 'handoff' && (
          <div className="iv-help-section">
            {recordingActive ? (
              <p className="iv-help-disabled-note">{strings.helpDeviceHandoffDisabled}</p>
            ) : (
              <>
                <p className="iv-help-handoff-body">
                  {strings.helpDeviceHandoffBody}
                </p>
                <div className="iv-qr-placeholder" aria-label="QR code placeholder">
                  <div className="iv-qr-grid" aria-hidden="true">
                    {Array.from({ length: 49 }, (_, i) => (
                      <span
                        key={i}
                        className={Math.random() > 0.5 ? 'iv-qr-cell filled' : 'iv-qr-cell'}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeSection === 'report' && (
          <div className="iv-help-section">
            {reportSent ? (
              <p className="iv-help-report-sent" role="status">
                {strings.helpReportSent}
              </p>
            ) : (
              <>
                <textarea
                  className="iv-help-report-input"
                  placeholder={strings.helpReportPlaceholder}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows={4}
                />
                <button
                  type="button"
                  className="iv-cta"
                  onClick={() => setReportSent(true)}
                  disabled={!reportText.trim()}
                  style={{ marginTop: '12px' }}
                >
                  {strings.helpReportSubmit}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
