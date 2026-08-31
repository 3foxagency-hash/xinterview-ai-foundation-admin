'use client';

import * as React from 'react';
import { X, ArrowRight } from 'lucide-react';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { strings } from '@/lib/interview/strings';
import { formatScheduleDateLabel, formatTimeLabel, formatTimezoneAbbr } from '@/lib/interview/schedule-format';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

export type CancelStep = 'confirm' | 'cancelled';

interface CancelScreenProps {
  config?: InterviewConfig;
  initialStep?: CancelStep;
  bookingDate?: Date;
  bookingHour?: number;
  bookingMinute?: number;
  bookingTimezone?: string;
  onKeepInterview?: () => void;
  onRescheduleInstead?: () => void;
  onContactHiringTeam?: () => void;
}

export function CancelScreen({
  config = defaultConfig,
  initialStep = 'confirm',
  bookingDate,
  bookingHour = 9,
  bookingMinute = 30,
  bookingTimezone = 'Europe/Amsterdam',
  onKeepInterview,
  onRescheduleInstead,
  onContactHiringTeam,
}: CancelScreenProps) {
  const [step, setStep] = React.useState<CancelStep>(initialStep);
  const resolvedDate = React.useMemo(() => bookingDate ?? new Date(), [bookingDate]);
  const jobTitle = config.job.title;

  const dateLabel = formatScheduleDateLabel(resolvedDate);
  const timeLabel = formatTimeLabel(bookingHour, bookingMinute);
  const tzAbbr = formatTimezoneAbbr(bookingTimezone);
  const bookingLine = `${dateLabel} at ${timeLabel} (${tzAbbr})`;

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

        <div className="iv-layout-centre">
          <div className="iv-centre-content">
            <div
              className={`iv-status-mark${step === 'cancelled' ? ' iv-status-mark-quiet' : ' iv-status-mark-warning'}`}
              aria-hidden="true"
            >
              <X
                size={20}
                strokeWidth={1}
                color={step === 'cancelled' ? 'var(--iv-text-secondary)' : 'var(--iv-warning)'}
              />
            </div>

            <div className="iv-verify-eyebrow-row">
              <span className="iv-status-dot" aria-hidden="true" />
              <span className="iv-micro-label">{strings.cancelEyebrow(config.company.name)}</span>
            </div>

            <h1 className="iv-job-title" style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)' }}>
              {step === 'confirm' ? strings.cancelHeading : strings.cancelledHeading}
            </h1>

            <p className={`iv-cancel-booking-line${step === 'cancelled' ? ' iv-strike' : ''}`}>
              {bookingLine}
            </p>

            <hr className="iv-hairline-short" />

            <div className="iv-centre-form">
              <div className="iv-plane iv-form-panel" style={{ textAlign: 'left' }}>
                <div className="iv-micro-label-underlined">
                  <span className="iv-micro-label">
                    {step === 'confirm' ? strings.cancelWhatThisMeansLabel : strings.cancelledWhatHappensLabel}
                  </span>
                  <div className="iv-micro-label-underline" aria-hidden="true" />
                </div>

                <div className="iv-detail-list">
                  {step === 'confirm' ? (
                    <>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.cancelRow1}</span>
                      </div>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.cancelRow2(jobTitle)}</span>
                      </div>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.cancelRow3}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.cancelledRow1(jobTitle)}</span>
                      </div>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.cancelledRow2(config.company.name)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {step === 'confirm' ? (
              <>
                <div className="iv-cta-wrap" style={{ width: '100%', maxWidth: '560px' }}>
                  <button type="button" className="iv-cta" onClick={onKeepInterview}>
                    {strings.cancelKeepInterview}
                    <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
                  </button>
                  <div className="iv-cta-bloom" aria-hidden="true" />
                </div>

                <button type="button" className="iv-text-link" onClick={onRescheduleInstead}>
                  {strings.cancelRescheduleInstead}
                </button>

                <hr className="iv-hairline-short" style={{ width: '100%', maxWidth: '560px' }} />

                <div style={{ width: '100%', maxWidth: '560px' }}>
                  <button
                    type="button"
                    className="iv-cta-outline-warning"
                    onClick={() => setStep('cancelled')}
                  >
                    {strings.cancelConfirmCta}
                  </button>
                </div>

                <p className="iv-verify-sms-note">{strings.cancelHint}</p>
              </>
            ) : (
              <>
                <button type="button" className="iv-text-link" onClick={onContactHiringTeam}>
                  {strings.cancelledContactTeam}
                </button>
                <p className="iv-verify-sms-note">{strings.cancelledCloseTab}</p>
              </>
            )}
          </div>
        </div>
      </InterviewThemeProvider>
    </>
  );
}
