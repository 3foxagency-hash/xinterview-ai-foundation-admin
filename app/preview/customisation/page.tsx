'use client';

import * as React from 'react';
import { ShieldOff } from 'lucide-react';
import type { InterviewConfig } from '@/config/interview.mock';
import type { InterviewSession } from '@/config/interview-session';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';
import { interviewSession as defaultSession } from '@/config/interview-session';
import { InterviewPage } from '@/components/interview/interview-page';
import { InterviewShell } from '@/components/interview/interview-shell';
import { MonitoringDisclosure } from '@/components/interview/monitoring-disclosure';
import { CompletionScreen } from '@/components/interview/completion-screen';

type PreviewScreen = 'landing' | 'form' | 'thank-you';
type PreviewTheme = 'light' | 'dark';

interface FrameMessage {
  source: 'xinterview-customisation-preview';
  screen: PreviewScreen;
  config: InterviewConfig;
  session: InterviewSession;
  /** Only takes effect when the job's own branding theme is "Auto"
   *  (themeMode 'system') — forces which side of the toggle the preview
   *  starts on, the same way a candidate's OS light/dark setting would.
   *  It never overrides an explicit light/dark branding choice. */
  themeOverride: PreviewTheme;
}

interface FrameSnapshot {
  screen: PreviewScreen;
  config: InterviewConfig;
  session: InterviewSession;
  themeOverride: PreviewTheme;
}

function isFrameMessage(data: unknown): data is FrameMessage {
  return (
    !!data &&
    typeof data === 'object' &&
    (data as { source?: unknown }).source === 'xinterview-customisation-preview'
  );
}

const SNAPSHOT_KEY = 'xinterview-customisation-preview-snapshot';

/** Read (and immediately clear) once at mount: the "Open in new tab"
 *  button's fallback for when there's no parent window to postMessage from
 *  (see CustomisationPreviewPanel's handleOpenNewTab). localStorage rather
 *  than sessionStorage — window.open's noopener/noreferrer puts the new
 *  tab in an unrelated top-level browsing context, and sessionStorage is
 *  scoped per browsing context rather than per-origin, so it wouldn't
 *  carry over. Clearing it after reading means a later, unrelated direct
 *  visit to this route never picks up a stale snapshot from a past click. */
function readSnapshot(): FrameSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    localStorage.removeItem(SNAPSHOT_KEY);
    return JSON.parse(raw) as FrameSnapshot;
  } catch {
    return null;
  }
}

/**
 * Rendered inside the customisation preview's mobile/desktop <iframe> (see
 * CustomisationPreviewPanel), or standalone in its own tab via "Open in new
 * tab". A real iframe gives the interview page's CSS an actual narrow
 * viewport, so its `@media (max-width: 767px)` rules fire for real — a
 * scaled-down desktop layout can't do that, since a CSS transform never
 * changes the viewport the media query measures.
 *
 * Inside the iframe, state arrives via postMessage from the parent (same-
 * origin window.parent) on every edit, since this document has no access
 * to the admin's React context across the frame boundary. Opened standalone
 * there's no parent to message from, so it falls back to a one-time
 * sessionStorage snapshot taken when the tab was opened.
 */
export default function CustomisationPreviewFrame() {
  const snapshot = React.useMemo(() => readSnapshot(), []);
  const [screen, setScreen] = React.useState<PreviewScreen>(snapshot?.screen ?? 'landing');
  const [config, setConfig] = React.useState<InterviewConfig>(snapshot?.config ?? defaultConfig);
  const [session, setSession] = React.useState<InterviewSession>(snapshot?.session ?? defaultSession);
  const [themeOverride, setThemeOverride] = React.useState<PreviewTheme>(snapshot?.themeOverride ?? 'light');

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      if (!isFrameMessage(event.data)) return;
      setScreen(event.data.screen);
      setConfig(event.data.config);
      setSession(event.data.session);
      setThemeOverride(event.data.themeOverride);
    };
    window.addEventListener('message', handleMessage);
    // Tell the parent we're ready to receive state — it may have rendered
    // the iframe before this listener was attached.
    window.parent.postMessage({ source: 'xinterview-customisation-preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Only takes effect when the job's theme is "Auto" (themeMode 'system') —
  // InterviewThemeProvider ignores resolvedOverride otherwise, exactly like
  // a real session where an explicit light/dark branding choice always
  // wins. InterviewThemeProvider only reads resolvedOverride once, at
  // mount, so keying each screen by the requested override forces a real
  // remount whenever the admin's own toolbar changes it, so that click
  // actually takes effect (a live candidate toggle click inside the
  // preview would still work independently between remounts).
  const resolvedOverride = config.company.themeMode === 'system' ? themeOverride : undefined;
  const themeKey = String(resolvedOverride);

  if (screen === 'landing') {
    return (
      <InterviewPage
        key={themeKey}
        token="preview"
        configOverride={config}
        disableDevControls
        themeOverride={resolvedOverride}
      />
    );
  }

  if (screen === 'form') {
    const { integrity } = session;
    const hasIntegrity = integrity.tabSwitchDetection || integrity.requireFullScreen || integrity.disableRightClick;

    if (!hasIntegrity) {
      return (
        <InterviewShell key={themeKey} session={session} showProgressLine={false} themeOverride={resolvedOverride}>
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 p-10 text-center">
            <ShieldOff size={28} className="text-muted" strokeWidth={1.5} />
            <p className="text-body font-medium text-heading">This screen is off</p>
            <p className="max-w-[320px] text-body-sm text-muted">
              Candidates only see this disclosure step when an integrity setting — tab-switch detection, full-screen, or
              right-click blocking — is turned on in Interview experience.
            </p>
          </div>
        </InterviewShell>
      );
    }

    return (
      <InterviewShell key={themeKey} session={session} showProgressLine={false} themeOverride={resolvedOverride}>
        <div className="iv-disclosure-wrap">
          <MonitoringDisclosure integrity={integrity} totalQuestions={session.questions.length} onAcknowledge={() => {}} />
        </div>
      </InterviewShell>
    );
  }

  return <CompletionScreen key={themeKey} session={session} state="complete" themeOverride={resolvedOverride} />;
}
