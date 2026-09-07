'use client';

import * as React from 'react';
import { Monitor, Smartphone, Sun, Moon, ExternalLink, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCustomisationPreview,
  type PreviewScreen,
} from '@/components/wizard/customisation-preview-context';
import { buildPreviewConfig, buildPreviewSession } from '@/components/wizard/customisation-preview-context';
import type { InterviewConfig } from '@/config/interview.mock';
import type { InterviewSession } from '@/config/interview-session';
import { track } from '@/lib/utils/analytics';

const SCREEN_LABELS: { value: PreviewScreen; label: string }[] = [
  { value: 'landing', label: 'Landing page' },
  { value: 'form', label: 'Start form' },
  { value: 'interview', label: 'Interview' },
  { value: 'thank-you', label: 'Thank you' },
];

function EvaluationSummaryPanel() {
  const { state, setActiveSection } = useCustomisationPreview();
  const evaluation = state.evaluation;

  if (!evaluation) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-body-sm text-muted">Loading evaluation settings…</p>
      </div>
    );
  }

  const totalWeight = evaluation.factors.reduce((sum, f) => sum + f.weight, 0);
  const unlinkedQuestions = evaluation.questionScoring.filter(
    (qs) => !qs.excludedFromScoring && qs.factorIds.length === 0
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-muted-bg px-3 py-2">
        <Eye size={14} className="shrink-0 text-muted" />
        <span className="text-body-sm font-medium text-muted">Not visible to candidates</span>
      </div>

      <h3 className="text-h3 text-heading">Evaluation summary</h3>
      <p className="mt-1 text-body-sm text-muted">
        How the AI scores candidate responses. Candidates never see this.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-body-sm font-semibold text-heading">Weight distribution</p>
          <div className="flex h-8 w-full overflow-hidden rounded-md border border-border">
            {evaluation.factors.length === 0 ? (
              <div className="flex w-full items-center justify-center text-caption text-muted">
                No factors yet
              </div>
            ) : (
              evaluation.factors.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-center text-caption font-medium text-primary-foreground"
                  style={{
                    backgroundColor: 'var(--primary)',
                    width: `${f.weight}%`,
                  }}
                  title={`${f.name || 'Untitled'}: ${f.weight}%`}
                >
                  {f.weight > 10 ? `${f.weight}%` : ''}
                </div>
              ))
            )}
          </div>
          <p className="mt-1.5 text-caption tabular-nums text-muted">
            Total: {totalWeight}%{totalWeight !== 100 && ` · ${100 - totalWeight > 0 ? `${100 - totalWeight}% remaining` : `${Math.abs(100 - totalWeight)}% over`}`}
          </p>
        </div>

        <div>
          <p className="mb-2 text-body-sm font-semibold text-heading">Factors</p>
          {evaluation.factors.length === 0 ? (
            <p className="text-body-sm text-muted">No evaluation factors configured.</p>
          ) : (
            <div className="space-y-2">
              {evaluation.factors.map((f) => {
                const linkedCount = evaluation.questionScoring.filter((qs) =>
                  qs.factorIds.includes(f.id)
                ).length;
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2"
                  >
                    <div>
                      <p className="text-body-sm font-medium text-heading">
                        {f.name || 'Untitled factor'}
                      </p>
                      <p className="text-caption text-muted">
                        {linkedCount} question{linkedCount !== 1 ? 's' : ''} linked
                      </p>
                    </div>
                    <span className="text-body-sm tabular-nums text-muted">{f.weight}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {unlinkedQuestions.length > 0 && (
          <div>
            <p className="mb-2 text-body-sm font-semibold text-error">Unlinked questions</p>
            <div className="space-y-1.5">
              {unlinkedQuestions.map((qs) => (
                <button
                  key={qs.questionId}
                  type="button"
                  onClick={() => setActiveSection('evaluation')}
                  className="block w-full rounded-md border border-border bg-error-banner-bg px-3 py-2 text-left text-body-sm text-heading transition-colors hover:border-error/30"
                >
                  {qs.questionId} — Jump to fix →
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmailPreviewPanel() {
  const { state, previewTheme } = useCustomisationPreview();
  const notifications = state.notifications;
  const branding = state.branding;

  const bgColor = previewTheme === 'dark' ? '#1a1a1a' : '#ffffff';
  const textColor = previewTheme === 'dark' ? '#ededed' : '#171717';
  const mutedColor = previewTheme === 'dark' ? '#a1a1a1' : '#525252';
  const borderColor = previewTheme === 'dark' ? '#2e2e2e' : '#e5e5e5';

  if (!notifications) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-body-sm text-muted">Loading notification settings…</p>
      </div>
    );
  }

  const email = notifications.email;
  const companyName = branding?.companyTitle || 'Your Company';

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <h3 className="text-h3 text-heading">Email preview</h3>
      <p className="mt-1 text-body-sm text-muted">
        How candidates receive email notifications. Merge fields show sample values.
      </p>

      <div className="mt-5 flex-1 overflow-hidden rounded-lg border border-border" style={{ backgroundColor: bgColor }}>
        <div className="border-b p-4" style={{ borderColor }}>
          <div className="flex items-center gap-2">
            {branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoUrl} alt="" className="h-8 w-8 rounded object-contain" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded text-caption font-bold text-white"
                style={{ backgroundColor: branding?.primaryColour || 'var(--primary)' }}
              >
                {companyName.charAt(0)}
              </div>
            )}
            <span className="text-body-sm font-medium" style={{ color: textColor }}>
              {companyName}
            </span>
          </div>
        </div>
        <div className="p-4">
          <p className="text-caption" style={{ color: mutedColor }}>
            Subject
          </p>
          <p className="mb-3 text-body-sm font-medium" style={{ color: textColor }}>
            {email.notifyOnCompletion
              ? 'Your interview is complete'
              : email.rejectionMessageEnabled
                ? 'Update on your application'
                : 'Your interview with ' + companyName}
          </p>
          <div className="rounded-md border p-3" style={{ borderColor, color: textColor }}>
            <p className="text-body-sm">
              Hi Jane,
              <br />
              <br />
              {email.notifyOnCompletion
                ? 'Thank you for completing your interview. Our team will review your responses and be in touch within the next few days.'
                : email.rejectionMessageEnabled
                  ? email.rejectionMessage || 'Thank you for your time. We have decided not to move forward with your application at this time.'
                  : 'This is a reminder about your pending interview. Please complete it at your earliest convenience.'}
              <br />
              <br />
              Best regards,
              <br />
              {companyName}
            </p>
          </div>
        </div>
      </div>

      {notifications.sms.notifyOnCompletion && (
        <div className="mt-4">
          <p className="mb-2 text-body-sm font-semibold text-heading">SMS preview</p>
          <div className="mx-auto max-w-[280px] rounded-2xl border border-border bg-surface p-3">
            <div className="rounded-lg bg-muted-bg px-3 py-2">
              <p className="text-body-sm text-heading">
                {companyName}: Your interview is complete. Our team will be in touch soon.
              </p>
              <p className="mt-1 text-right text-caption text-muted">
                {('Your interview is complete. Our team will be in touch soon.').length} chars
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialLinkPreview() {
  const { state } = useCustomisationPreview();
  const social = state.social;
  const branding = state.branding;
  const domain = 'xinterview.ai';

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <h3 className="text-h3 text-heading">Social link preview</h3>
      <p className="mt-1 text-body-sm text-muted">
        How the interview link appears when shared.
      </p>

      <div className="mt-5 overflow-hidden rounded-lg border border-border shadow-sm" style={{ maxWidth: 420 }}>
        <div className="flex h-[210px] items-center justify-center bg-card-hover">
          {social?.shareImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={social.shareImageUrl} alt="Share preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              {branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt="" className="h-12 w-12 rounded object-contain" />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded text-body font-bold text-white"
                  style={{ backgroundColor: branding?.primaryColour || 'var(--primary)' }}
                >
                  {(branding?.companyTitle || 'X').charAt(0)}
                </div>
              )}
              <span className="text-body-sm text-muted">1200 × 630</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-caption uppercase text-muted">{domain}</p>
          <p className="mt-1 text-body-sm font-medium text-heading">
            {social?.previewTitle || 'Your preview title appears here'}
          </p>
          <p className="mt-0.5 line-clamp-2 text-caption text-muted">
            {social?.previewDescription || 'Your description appears here.'}
          </p>
        </div>
      </div>
    </div>
  );
}

const PHONE_WIDTH = 375;
const PHONE_HEIGHT = 812;
/** Extra room around the phone chassis (border + a little breathing room)
 *  so the scale-to-fit math doesn't shave the bezel off against the panel edge. */
const PHONE_CHROME_PADDING = 24;

interface PreviewFramePayload {
  screen: PreviewScreen;
  config: InterviewConfig;
  session: InterviewSession;
}

/**
 * Keeps a preview <iframe> fed with live state via postMessage. Both the
 * mobile and desktop previews render the real interview components inside
 * /preview/customisation instead of the admin bundle rendering them inline
 * and shrinking the result with a CSS transform — the interview CSS relies
 * on things a `transform: scale()` can't fake for an inner document: real
 * `@media (max-width: 767px)` breakpoints (a shrunk box is still the same
 * viewport underneath) and `100vh`-based panel heights (which resolve
 * against the real browser window regardless of an ancestor's transform,
 * so an inner scroll panel would size itself far taller than the visible,
 * scaled-down box and trap scroll input intended for the outer container).
 * An iframe has its own genuine viewport matching its element box, so both
 * kinds of CSS resolve correctly and native scrolling just works.
 *
 * The iframe can't read the admin's React context across the frame
 * boundary, so state arrives via postMessage on every change instead of
 * props/children.
 */
function usePreviewFrameSync(payload: PreviewFramePayload) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = React.useState(false);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.source === 'xinterview-customisation-preview-ready') {
        setIframeReady(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  React.useEffect(() => {
    if (!iframeReady) return;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      { source: 'xinterview-customisation-preview', ...payload },
      window.location.origin
    );
  }, [iframeReady, payload]);

  return iframeRef;
}

function MobileFrame({ payload }: { payload: PreviewFramePayload }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const iframeRef = usePreviewFrameSync(payload);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const { width, height } = el.getBoundingClientRect();
      const availableW = width - PHONE_CHROME_PADDING;
      const availableH = height - PHONE_CHROME_PADDING;
      const next = Math.min(1, availableW / PHONE_WIDTH, availableH / PHONE_HEIGHT);
      setScale(next > 0 ? next : 1);
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scaledWidth = PHONE_WIDTH * scale;
  const scaledHeight = PHONE_HEIGHT * scale;

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      {/* Phone chassis, sized directly at its final on-screen pixels rather
          than rendered at a fixed 375×812 and shrunk with `transform:
          scale()`. A CSS transform on an iframe's ancestor doesn't reliably
          carry mouse-wheel/trackpad input through to the iframe in Chromium
          — clicks still hit-test correctly, but scrolling inside the frame
          stops responding. Sizing the iframe (and the notch/buttons around
          it) to the real scaled dimensions means there's no transform in
          the way, so native scroll just works; the trade-off is the
          candidate CSS sees e.g. a 260px-wide viewport instead of exactly
          375px, which still sits comfortably inside the same mobile
          breakpoint. */}
      <div
        className="relative shrink-0 select-none overflow-hidden rounded-[2.5rem] border-[6px] border-border-strong bg-surface shadow-lg"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <div
          className="absolute -left-[3px] rounded-l-sm bg-border-strong"
          style={{ top: 96 * scale, height: 64 * scale, width: 3 }}
          aria-hidden
        />
        <div
          className="absolute -right-[3px] rounded-r-sm bg-border-strong"
          style={{ top: 128 * scale, height: 96 * scale, width: 3 }}
          aria-hidden
        />
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-2xl bg-border-strong"
          style={{ height: 24 * scale, width: 128 * scale }}
          aria-hidden
        />
        {/* Padding-top clears the notch so real page content (a logo, a nav
            bar) doesn't render underneath it, like a phone's safe-area inset. */}
        <iframe
          ref={iframeRef}
          src="/preview/customisation"
          title="Mobile preview"
          className="h-full w-full border-0"
          style={{ paddingTop: 32 * scale }}
        />
      </div>
    </div>
  );
}

function DesktopFrame({ payload }: { payload: PreviewFramePayload }) {
  const iframeRef = usePreviewFrameSync(payload);

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      {/* Full-size iframe — no CSS scaling. The panel's own dimensions ARE
          the iframe's viewport, so 100vh-based panel heights and native
          scroll (wheel, trackpad momentum, scrollbar drag) all behave
          exactly as they would in a real browser window, just narrower. */}
      <iframe
        ref={iframeRef}
        src="/preview/customisation"
        title="Desktop preview"
        className="h-full w-full border-0"
      />
    </div>
  );
}

export function CustomisationPreviewPanel() {
  const {
    state,
    activeSection,
    previewScreen,
    setPreviewScreen,
    previewDevice,
    setPreviewDevice,
    previewTheme,
    setPreviewTheme,
    jobTitle,
  } = useCustomisationPreview();

  const config = React.useMemo(
    () => buildPreviewConfig(state, jobTitle, previewTheme),
    [state, jobTitle, previewTheme]
  );
  const session = React.useMemo(
    () => buildPreviewSession(state, jobTitle, previewTheme),
    [state, jobTitle, previewTheme]
  );

  const isEvaluation = activeSection === 'evaluation';
  const isNotifications = activeSection === 'notifications';
  const isSocial = activeSection === 'social';

  const handleOpenNewTab = () => {
    track('preview_opened_new_tab', { section: activeSection });
  };

  return (
    <aside
      className="hidden min-w-[420px] flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface xl:flex"
      aria-label="Live preview"
      role="complementary"
    >
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-h3 text-heading">Preview</h3>
            <p className="text-caption text-muted">See what candidates will see.</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Device toggle */}
            <div className="inline-flex items-center rounded-md border border-border bg-card-hover p-0.5">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                aria-pressed={previewDevice === 'desktop'}
                aria-label="Desktop preview"
                className={cn(
                  'rounded px-2 py-1 transition-colors',
                  previewDevice === 'desktop'
                    ? 'bg-surface text-heading shadow-sm'
                    : 'text-muted hover:text-heading'
                )}
              >
                <Monitor size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                aria-pressed={previewDevice === 'mobile'}
                aria-label="Mobile preview"
                className={cn(
                  'rounded px-2 py-1 transition-colors',
                  previewDevice === 'mobile'
                    ? 'bg-surface text-heading shadow-sm'
                    : 'text-muted hover:text-heading'
                )}
              >
                <Smartphone size={14} />
              </button>
            </div>
            {/* Theme toggle */}
            <div className="inline-flex items-center rounded-md border border-border bg-card-hover p-0.5">
              <button
                type="button"
                onClick={() => setPreviewTheme('light')}
                aria-pressed={previewTheme === 'light'}
                aria-label="Light preview"
                className={cn(
                  'rounded px-2 py-1 transition-colors',
                  previewTheme === 'light'
                    ? 'bg-surface text-heading shadow-sm'
                    : 'text-muted hover:text-heading'
                )}
              >
                <Sun size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme('dark')}
                aria-pressed={previewTheme === 'dark'}
                aria-label="Dark preview"
                className={cn(
                  'rounded px-2 py-1 transition-colors',
                  previewTheme === 'dark'
                    ? 'bg-surface text-heading shadow-sm'
                    : 'text-muted hover:text-heading'
                )}
              >
                <Moon size={14} />
              </button>
            </div>
            {/* Open in new tab */}
            <button
              type="button"
              onClick={handleOpenNewTab}
              aria-label="Open preview in new tab"
              className="rounded-md border border-border bg-card-hover p-1.5 text-muted transition-colors hover:text-heading"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Screen switcher */}
        {!isEvaluation && !isNotifications && !isSocial && (
          <div className="mt-3 flex items-center gap-1 overflow-x-auto">
            {SCREEN_LABELS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setPreviewScreen(s.value)}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-caption font-medium transition-colors',
                  previewScreen === s.value
                    ? 'bg-active-menu-bg text-primary'
                    : 'text-muted hover:bg-card-hover hover:text-heading'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview body */}
      <div className="min-h-0 flex-1 overflow-hidden bg-[var(--background-200)] p-3">
        {isEvaluation ? (
          <EvaluationSummaryPanel />
        ) : isNotifications ? (
          <EmailPreviewPanel />
        ) : isSocial ? (
          <SocialLinkPreview />
        ) : previewDevice === 'mobile' ? (
          <MobileFrame payload={{ screen: previewScreen, config, session }} />
        ) : (
          <DesktopFrame payload={{ screen: previewScreen, config, session }} />
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-4 py-2">
        <p className="text-caption text-muted">Preview only — buttons are inactive.</p>
      </div>
    </aside>
  );
}
