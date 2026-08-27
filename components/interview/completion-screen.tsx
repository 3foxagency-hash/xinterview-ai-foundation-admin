'use client';

import * as React from 'react';
import { Check, Clock } from 'lucide-react';
import { strings } from '@/lib/interview/strings';
import type { InterviewSession } from '@/config/interview-session';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { interviewConfig as defaultLandingConfig } from '@/config/interview.mock';

export type EndState = 'complete' | 'already_completed' | 'expired' | 'invalid';

interface CompletionScreenProps {
  session: InterviewSession;
  state: EndState;
}

export function CompletionScreen({ session, state }: CompletionScreenProps) {
  const [redirectCountdown, setRedirectCountdown] = React.useState(
    session.completion.redirectDelaySeconds,
  );
  const [redirectCancelled, setRedirectCancelled] = React.useState(false);
  const landingConfig = React.useMemo(
    () => ({
      ...defaultLandingConfig,
      company: {
        ...defaultLandingConfig.company,
        name: session.company.name,
        brandColor: session.company.brandColor,
        themeMode: session.company.themeMode,
        allowCandidateToggle: session.company.allowCandidateToggle,
      },
    }),
    [session.company],
  );

  const firstName = session.candidate.firstName;
  const questionCount = session.questions.length;

  const today = new Date('2026-08-23T11:42:00');
  const dateStr = today.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  const timeStr = today.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  React.useEffect(() => {
    if (state !== 'complete' || !session.completion.redirectUrl || redirectCancelled) return;
    if (redirectCountdown <= 0) {
      window.location.href = session.completion.redirectUrl;
      return;
    }
    const id = setTimeout(() => setRedirectCountdown((p) => p - 1), 1000);
    return () => clearTimeout(id);
  }, [state, session.completion.redirectUrl, redirectCountdown, redirectCancelled]);

  return (
    <>
      <InterviewThemeScript
        themeMode={session.company.themeMode}
        allowCandidateToggle={session.company.allowCandidateToggle}
      />
      <InterviewThemeProvider
        brandColor={session.company.brandColor}
        themeMode={session.company.themeMode}
        allowCandidateToggle={session.company.allowCandidateToggle}
      >
        <AmbientLight />
        <TopBar config={landingConfig} />

        <div className="iv-completion-page">
        <div className="iv-completion-wrap">
          {state === 'complete' && (
            <>
              <div className="iv-complete-mark" aria-hidden="true">
                <Check size={28} strokeWidth={1} />
              </div>
              <span className="iv-micro-label iv-complete-eyebrow">
                {strings.completeEyebrow(session.company.name)}
              </span>
              <h1 className="iv-complete-heading">
                {strings.completeThankYou(firstName)}
              </h1>
              <p className="iv-complete-submitted">
                {strings.completeSubmitted}
              </p>
              <hr className="iv-complete-hairline" />
              <div className="iv-complete-summary">
                <span>{strings.completeQuestionsAnswered(questionCount)}</span>
                <span className="iv-meta-divider" aria-hidden="true" />
                <span>{strings.completeSubmittedDate(`${dateStr}, ${timeStr}`)}</span>
              </div>

              <div className="iv-next-steps iv-plane">
                {session.completion.customMessage && (
                  <p className="iv-next-steps-message">
                    {session.completion.customMessage}
                  </p>
                )}
                <span className="iv-next-steps-label">
                  {strings.completeNextSteps}
                </span>
                <div className="iv-next-steps-underline" aria-hidden="true" />
                <ul className="iv-next-steps-list">
                  <li>
                    <span className="iv-next-steps-dot" aria-hidden="true" />
                    {strings.completeStepReview}
                  </li>
                  <li>
                    <span className="iv-next-steps-dot" aria-hidden="true" />
                    {strings.completeStepEmail}
                  </li>
                  <li>
                    <span className="iv-next-steps-dot" aria-hidden="true" />
                    {strings.completeStepShared}
                  </li>
                </ul>
              </div>

              <p className="iv-complete-close">{strings.completeCloseTab}</p>
              <a href="#" className="iv-complete-link">
                {strings.completeQuestionsLink}
              </a>

              {session.completion.redirectUrl && !redirectCancelled && (
                <div className="iv-redirect-row">
                  <span className="iv-redirect-countdown">
                    {strings.completeRedirectIn(redirectCountdown, session.company.name)}
                  </span>
                  <button
                    type="button"
                    className="iv-link-button"
                    onClick={() => setRedirectCancelled(true)}
                  >
                    {strings.completeRedirectStay}
                  </button>
                </div>
              )}
            </>
          )}

          {state === 'already_completed' && (
            <>
              <div className="iv-complete-mark secondary" aria-hidden="true">
                <Check size={28} strokeWidth={1} />
              </div>
              <span className="iv-micro-label iv-complete-eyebrow">
                {strings.alreadyCompleteEyebrow(session.company.name)}
              </span>
              <h1 className="iv-complete-heading">
                {strings.alreadyCompleteTitle}
              </h1>
              <p className="iv-complete-submitted">
                {strings.alreadyCompleteBody(dateStr)}
              </p>
            </>
          )}

          {state === 'expired' && (
            <>
              <div className="iv-complete-mark warning" aria-hidden="true">
                <Clock size={28} strokeWidth={1} />
              </div>
              <span className="iv-micro-label iv-complete-eyebrow">
                {strings.expiredEyebrow(session.company.name)}
              </span>
              <h1 className="iv-complete-heading">
                {strings.expiredTitle}
              </h1>
              <p className="iv-complete-submitted">
                {strings.expiredBody}
              </p>
              <a href="#" className="iv-complete-link">
                {strings.expiredContact}
              </a>
            </>
          )}

          {state === 'invalid' && (
            <>
              <div className="iv-complete-mark warning" aria-hidden="true">
                <Clock size={28} strokeWidth={1} />
              </div>
              <span className="iv-micro-label iv-complete-eyebrow">
                {strings.invalidEyebrow(session.company.name)}
              </span>
              <h1 className="iv-complete-heading">
                {strings.invalidTitle}
              </h1>
              <p className="iv-complete-submitted">
                {strings.invalidBody}
              </p>
              <a href="#" className="iv-complete-link">
                {strings.invalidContact}
              </a>
            </>
          )}
        </div>
        </div>
      </InterviewThemeProvider>
    </>
  );
}
