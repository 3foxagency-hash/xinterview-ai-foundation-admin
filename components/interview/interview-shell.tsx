'use client';

import * as React from 'react';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { interviewConfig as defaultLandingConfig } from '@/config/interview.mock';
import type { InterviewSession } from '@/config/interview-session';

interface InterviewShellProps {
  session: InterviewSession;
  children: React.ReactNode;
  showProgressLine?: boolean;
  progressPercent?: number;
  practiceMode?: boolean;
  /** Forwarded to InterviewThemeProvider's resolvedOverride — see that
   *  prop's own doc. Only the admin preview passes this. */
  themeOverride?: 'light' | 'dark';
}

export function InterviewShell({
  session,
  children,
  showProgressLine = true,
  progressPercent = 0,
  practiceMode = false,
  themeOverride,
}: InterviewShellProps) {
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
        resolvedOverride={themeOverride}
      >
        <AmbientLight />
        <TopBar config={landingConfig} />

        {practiceMode && (
          <div className="iv-practice-label" role="status">
            PRACTICE — NOT RECORDED
          </div>
        )}

        {showProgressLine && (
          <div className="iv-progress-line" aria-hidden="true">
            <div
              className="iv-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="iv-interview-shell">{children}</div>
      </InterviewThemeProvider>
    </>
  );
}
