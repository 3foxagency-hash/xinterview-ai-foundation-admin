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
import { DisplayToggles } from '@/components/interview/display-toggles';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';
import { strings } from '@/lib/interview/strings';
import { Clock } from 'lucide-react';
import { titleTierClass } from '@/components/interview/job-header';

type Scenario = 'both' | 'description' | 'video' | 'neither';

/** Section 3 layout mode. A/B/C/D map onto the existing scenario
 *  names: A = both, B = video only, C = description only, D = neither. */
type LayoutMode = 'A' | 'B' | 'C' | 'D';

const MODE_TO_SCENARIO: Record<LayoutMode, Scenario> = {
  A: 'both',
  B: 'video',
  C: 'description',
  D: 'neither',
};

function hasRealDescription(config: InterviewConfig): boolean {
  return (
    config.job.descriptionHtml !== null &&
    config.job.descriptionHtml.replace(/<[^>]*>/g, '').trim().length >= 200
  );
}

/** A block shows only when the job's display flag is on AND it has
 *  content to show. The flag is the hiring manager's switch; the
 *  content check stops an empty card rendering when the flag is on
 *  but there is nothing behind it. */
function resolveLayoutMode(config: InterviewConfig): LayoutMode {
  const showVideo = config.showIntroVideo && config.introVideo !== null;
  const showDescription = config.showJobDescription && hasRealDescription(config);

  return showVideo ? (showDescription ? 'A' : 'B') : showDescription ? 'C' : 'D';
}

interface InterviewPageProps {
  token: string;
  /** Overrides the mock config this screen otherwise self-initializes
   *  from — used by the admin customisation preview to render this exact
   *  screen against live draft data instead of the static mock. Omitted
   *  (the real candidate route), behavior is unchanged. */
  configOverride?: InterviewConfig;
  /** Disables the dev-only toggles (`?dev`, `?preview=A|B|C|D`, the
   *  DisplayToggles panel) when rendering a controlled configOverride —
   *  those exist for testing the live route and would otherwise let the
   *  preview drift from what the admin form actually says. */
  disableDevControls?: boolean;
  /** Forwarded to InterviewThemeProvider's resolvedOverride — see that
   *  prop's own doc. Only the admin preview passes this. */
  themeOverride?: 'light' | 'dark';
}

export function InterviewPage({ token, configOverride, disableDevControls, themeOverride }: InterviewPageProps) {
  const router = useRouter();
  const [config, setConfig] = React.useState<InterviewConfig>(configOverride ?? defaultConfig);
  const [isDev, setIsDev] = React.useState(false);
  /** ?preview=A|B|C|D — testing override so all four modes can be
   *  checked without editing job settings. Testing only. */
  const [previewMode, setPreviewMode] = React.useState<LayoutMode | null>(null);

  React.useEffect(() => {
    if (disableDevControls) return;
    const params = new URLSearchParams(window.location.search);
    setIsDev(params.has('dev'));
    const preview = params.get('preview')?.toUpperCase();
    if (preview === 'A' || preview === 'B' || preview === 'C' || preview === 'D') {
      setPreviewMode(preview);
    }
  }, [disableDevControls]);

  // Keep `config` in sync with a live configOverride (e.g. the admin
  // customisation preview re-computing this on every keystroke). Real
  // candidate sessions never pass configOverride, so this is a no-op there.
  React.useEffect(() => {
    if (configOverride) setConfig(configOverride);
  }, [configOverride]);

  const layoutMode = previewMode ?? resolveLayoutMode(config);
  const scenario = MODE_TO_SCENARIO[layoutMode];
  const isStatePage = config.state !== 'active';

  // Never render an empty wrapper for a hidden block — these gate the
  // JSX itself rather than hiding it with visibility/opacity.
  const renderVideo = layoutMode === 'A' || layoutMode === 'B';
  const renderDescription = layoutMode === 'A' || layoutMode === 'C';

  /** The apply form is one shared child in all four modes. */
  // Mode D's title is the page's only visual anchor, so it may scale up
  // a tier — but still bounded by length so it never overflows.
  const centreTitleTier = titleTierClass(config.job.title);

  const applyForm = (
    <ApplicationForm
      config={config}
      onSubmitSuccess={() => router.push(`/interview/${token}/setup`)}
    />
  );

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
        resolvedOverride={themeOverride}
      >
        <AmbientLight />

        <TopBar config={config} />

        {isStatePage ? (
          <StatePage state={config.state as Exclude<typeof config.state, 'active'>} companyName={config.company.name} />
        ) : layoutMode === 'D' ? (
          // Mode D — no left-column content at all, so the page
          // becomes a single centred column rather than an empty half.
          // This is the one mode where the two-column rule (1.1) does
          // not apply.
          <div className="iv-layout-centre">
            <div className="iv-centre-content">
              <div className="iv-centre-eyebrow">
                <span className="iv-micro-label">
                  {strings.eyebrow(config.company.name)}
                </span>
              </div>

              {/* Title sized by the shared tier system rather than a
                  hardcoded 6rem clamp, which overflowed and truncated
                  longer roles ("Senior Product Designer –…"). */}
              <h1 className={`iv-job-title ${centreTitleTier}`}>
                {config.job.title}
              </h1>

              <hr className="iv-hairline-short" />

              <div className="iv-meta-row">
                <span className="iv-meta-item">
                  {strings.metaQuestions(config.job.questionCount)}
                </span>
                <span className="iv-meta-divider" aria-hidden="true" />
                <span className="iv-meta-item">
                  <Clock
                    size={13}
                    strokeWidth={1.5}
                    className="iv-meta-icon"
                    aria-hidden="true"
                  />
                  {strings.metaEstimatedPlain(config.job.estimatedMinutes)}
                </span>
                <span className="iv-meta-divider" aria-hidden="true" />
                <span className="iv-meta-item">{strings.metaRecord}</span>
              </div>

              <div className="iv-centre-form">{applyForm}</div>

              <div className="iv-trust-row iv-centre-trust">
                {strings.trustRow}
              </div>
            </div>
          </div>
        ) : (
          // Modes A, B, C — two columns. data-mode drives the
          // per-mode sizing (hero video in B, full-height JD in C).
          <div className="iv-layout-two-col" data-mode={layoutMode}>
            {/* Left column */}
            <div className="iv-left-col">
              <JobHeader
                companyName={config.company.name}
                jobTitle={config.job.title}
                questionCount={config.job.questionCount}
                estimatedMinutes={config.job.estimatedMinutes}
                scenario={scenario}
              />

              {renderVideo && config.introVideo && (
                <IntroVideo video={config.introVideo} />
              )}

              {/* No "About this interview" block here: it restated the
                  question count, duration and "record anytime" that the
                  meta row above the video already shows. Mode B fills
                  its column by letting the video take the full width
                  instead (see the data-mode='B' rules in the CSS). */}

              {renderDescription && config.job.descriptionHtml && (
                <JobDescription
                  descriptionHtml={config.job.descriptionHtml}
                  fillColumn={layoutMode === 'C'}
                />
              )}
            </div>

            {/* Right column — form (same shared child as every mode) */}
            <div
              className={`iv-right-col ${
                config.stickyForm === false ? 'is-static' : ''
              }`}
            >
              {applyForm}
            </div>
          </div>
        )}

        {/* TEMPORARY — remove with the API integration (see
            components/interview/display-toggles.tsx). Hidden when a live
            configOverride is driving this screen (the admin preview) so its
            floating panel doesn't sit on top of / fight with that data. */}
        {!disableDevControls && <DisplayToggles config={config} onChange={setConfig} />}

        {isDev && !disableDevControls && <DevPanel config={config} onChange={setConfig} />}
      </InterviewThemeProvider>
    </>
  );
}
