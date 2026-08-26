'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { JobHeader } from '@/components/interview/job-header';
import { IntroVideo } from '@/components/interview/intro-video';
import { JobDescription } from '@/components/interview/job-description';
import { ApplicationForm } from '@/components/interview/application-form';
import { StatePage } from '@/components/interview/state-page';
import { DevPanel } from '@/components/interview/dev-panel';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

type Scenario = 'both' | 'description' | 'video' | 'neither';

function resolveScenario(config: InterviewConfig): Scenario {
  const hasDescription =
    config.job.descriptionHtml !== null &&
    config.job.descriptionHtml.replace(/<[^>]*>/g, '').trim().length >= 200;
  const hasVideo = config.introVideo !== null;

  if (hasDescription && hasVideo) return 'both';
  if (hasDescription) return 'description';
  if (hasVideo) return 'video';
  return 'neither';
}

export function InterviewPage({ token }: { token: string }) {
  const router = useRouter();
  const [config, setConfig] = React.useState<InterviewConfig>(defaultConfig);
  const [isDev, setIsDev] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDev(params.has('dev'));
  }, []);

  const scenario = resolveScenario(config);
  const isStatePage = config.state !== 'active';

  return (
    <>
      <InterviewThemeScript
        themeMode={config.company.themeMode}
        allowCandidateToggle={config.company.allowCandidateToggle}
      />
      <InterviewThemeProvider
        brandColor={config.company.brandColor}
        themeMode={config.company.themeMode}
        allowCandidateToggle={config.company.allowCandidateToggle}
      >
        <AmbientLight />

        <TopBar config={config} />

        {isStatePage ? (
          <StatePage state={config.state as Exclude<typeof config.state, 'active'>} companyName={config.company.name} />
        ) : scenario === 'neither' ? (
          // Scenario D — single centred column
          <div className="iv-layout-mode-d">
            <div className="iv-centre-content">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span className="iv-brand-mark iv-brand-mark-sm" aria-hidden="true">
                  {config.company.name.charAt(0).toUpperCase()}
                </span>
                <span className="iv-micro-label">
                  {config.company.name.toUpperCase()} · INTERVIEW
                </span>
              </div>

              <h1
                className="iv-job-title iv-title-tier-1"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}
              >
                {config.job.title}
              </h1>

              <hr className="iv-hairline-short" />

              <div className="iv-meta-row">
                <span className="iv-meta-item">
                  {config.job.questionCount} questions
                </span>
                <span className="iv-meta-divider" aria-hidden="true" />
                <span className="iv-meta-item">
                  ≈{config.job.estimatedMinutes} min
                </span>
                <span className="iv-meta-divider" aria-hidden="true" />
                <span className="iv-meta-item">Record anytime</span>
              </div>

              <div className="iv-centre-form">
                <ApplicationForm config={config} onSubmitSuccess={() => router.push(`/interview/${token}/setup`)} />
              </div>
            </div>
          </div>
        ) : (
          // Scenarios A, B, C — two columns
          <div className="iv-layout-two-col">
            {/* Left column */}
            <div className="iv-left-col">
              <JobHeader
                companyName={config.company.name}
                jobTitle={config.job.title}
                questionCount={config.job.questionCount}
                estimatedMinutes={config.job.estimatedMinutes}
                scenario={scenario}
              />

              {config.introVideo && (
                <IntroVideo video={config.introVideo} />
              )}

              {config.job.descriptionHtml &&
                config.job.descriptionHtml.replace(/<[^>]*>/g, '').trim()
                  .length >= 200 && (
                  <JobDescription
                    descriptionHtml={config.job.descriptionHtml}
                  />
                )}
            </div>

            {/* Right column — form */}
            <div className="iv-right-col">
              <ApplicationForm config={config} onSubmitSuccess={() => router.push(`/interview/${token}/setup`)} />
            </div>
          </div>
        )}

        {isDev && <DevPanel config={config} onChange={setConfig} />}
      </InterviewThemeProvider>
    </>
  );
}
