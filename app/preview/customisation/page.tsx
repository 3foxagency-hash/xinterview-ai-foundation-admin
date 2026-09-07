'use client';

import * as React from 'react';
import type { InterviewConfig } from '@/config/interview.mock';
import type { InterviewSession } from '@/config/interview-session';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';
import { interviewSession as defaultSession } from '@/config/interview-session';
import { InterviewPage } from '@/components/interview/interview-page';
import { InterviewScreen } from '@/components/interview/interview-screen';
import { CompletionScreen } from '@/components/interview/completion-screen';

type PreviewScreen = 'landing' | 'form' | 'interview' | 'thank-you';

interface FrameMessage {
  source: 'xinterview-customisation-preview';
  screen: PreviewScreen;
  config: InterviewConfig;
  session: InterviewSession;
}

function isFrameMessage(data: unknown): data is FrameMessage {
  return (
    !!data &&
    typeof data === 'object' &&
    (data as { source?: unknown }).source === 'xinterview-customisation-preview'
  );
}

/**
 * Rendered only inside the customisation preview's mobile <iframe> (see
 * CustomisationPreviewPanel). A real iframe gives the interview page's CSS
 * an actual narrow viewport, so its `@media (max-width: 767px)` rules fire
 * for real — a scaled-down desktop layout can't do that, since a CSS
 * transform never changes the viewport the media query measures.
 *
 * State arrives via postMessage from the parent (same-origin window.parent)
 * on every edit, since this document has no access to the admin's React
 * context across the frame boundary.
 */
export default function CustomisationPreviewFrame() {
  const [screen, setScreen] = React.useState<PreviewScreen>('landing');
  const [config, setConfig] = React.useState<InterviewConfig>(defaultConfig);
  const [session, setSession] = React.useState<InterviewSession>(defaultSession);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      if (!isFrameMessage(event.data)) return;
      setScreen(event.data.screen);
      setConfig(event.data.config);
      setSession(event.data.session);
    };
    window.addEventListener('message', handleMessage);
    // Tell the parent we're ready to receive state — it may have rendered
    // the iframe before this listener was attached.
    window.parent.postMessage({ source: 'xinterview-customisation-preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (screen === 'landing' || screen === 'form') {
    return <InterviewPage token="preview" configOverride={config} disableDevControls />;
  }
  if (screen === 'interview') {
    return (
      <InterviewScreen
        session={session}
        forcedQuestionIndex={0}
        forcedState="thinking"
        simFailure="unsupported_browser"
      />
    );
  }
  return <CompletionScreen session={session} state="complete" />;
}
