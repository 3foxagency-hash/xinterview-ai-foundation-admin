'use client';

import * as React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { strings } from '@/lib/interview/strings';
import { maskPhoneNumber } from '@/lib/interview/phone';
import { formatScheduleDateLabel, formatTimeLabel, formatTimezoneLabel } from '@/lib/interview/schedule-format';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

export type CallStatus = 'booked' | 'calling' | 'not-received';

interface CallStatusScreenProps {
  config?: InterviewConfig;
  initialStatus?: CallStatus;
  countryCode?: string;
  nationalNumber?: string;
  /** The number the AI interviewer calls FROM — not masked, it's ours. */
  callerNumber?: string;
  scheduledDate?: Date;
  scheduledHour?: number;
  scheduledMinute?: number;
  timezone?: string;
  onAddToCalendar?: () => void;
  /** Used for both "Change this time" (booked) and "Schedule for later
   *  instead" (calling / not-received) — same destination, different
   *  label depending on where the candidate is coming from. */
  onScheduleInstead?: () => void;
  onUseDifferentNumber?: () => void;
}

export function CallStatusScreen({
  config = defaultConfig,
  initialStatus = 'booked',
  countryCode = '+31',
  nationalNumber = '612344218',
  callerNumber = '+31 20 000 0000',
  scheduledDate,
  scheduledHour = 9,
  scheduledMinute = 30,
  timezone = 'Europe/Amsterdam',
  onAddToCalendar,
  onScheduleInstead,
  onUseDifferentNumber,
}: CallStatusScreenProps) {
  const [status, setStatus] = React.useState<CallStatus>(initialStatus);
  const resolvedDate = React.useMemo(() => scheduledDate ?? new Date(), [scheduledDate]);

  const maskedNumber = React.useMemo(
    () => maskPhoneNumber(countryCode, nationalNumber),
    [countryCode, nationalNumber]
  );
  const dateLabel = formatScheduleDateLabel(resolvedDate);
  const timeLabel = formatTimeLabel(scheduledHour, scheduledMinute);
  const tzLabel = formatTimezoneLabel(timezone);

  const detailLabel =
    status === 'booked'
      ? strings.callStatusBeforeCallLabel
      : status === 'calling'
        ? strings.callStatusWhileYouWaitLabel
        : strings.callStatusChecksLabel;

  const headingSize = { fontSize: 'clamp(2rem, 3vw, 2.5rem)' } as const;

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
            {status === 'calling' && (
              <div className="iv-status-mark" aria-hidden="true">
                <div className="iv-status-mark-pulse-bloom" />
                <div className="iv-status-mark-pulse-dot" />
              </div>
            )}
            {status === 'not-received' && (
              <div className="iv-status-mark iv-status-mark-warning" aria-hidden="true">
                <X size={20} strokeWidth={1} color="var(--iv-warning)" />
              </div>
            )}
            {status === 'booked' && (
              <div className="iv-status-mark" aria-hidden="true">
                <Check size={22} strokeWidth={1} color="var(--iv-accent)" />
              </div>
            )}

            <div className="iv-verify-eyebrow-row">
              <span className="iv-status-dot" aria-hidden="true" />
              <span className="iv-micro-label">{strings.scheduleEyebrow(config.company.name)}</span>
            </div>

            {status === 'booked' && (
              <>
                <h1 className="iv-job-title" style={headingSize}>
                  {strings.callStatusBookedHeading}
                </h1>
                <p className="iv-scheduled-time">
                  {dateLabel} at {timeLabel}
                </p>
                <p className="iv-status-tz">{tzLabel}</p>
              </>
            )}
            {status === 'calling' && (
              <>
                <h1 className="iv-job-title" style={headingSize}>
                  {strings.callStatusCallingHeading}
                </h1>
                <p className="iv-status-tz">{strings.callStatusCallingSub}</p>
              </>
            )}
            {status === 'not-received' && (
              <>
                <h1 className="iv-job-title" style={headingSize}>
                  {strings.callStatusRetryHeading}
                </h1>
                <p className="iv-status-tz">{strings.callStatusRetrySub}</p>
              </>
            )}

            <hr className="iv-hairline-short" />

            {status === 'booked' ? (
              <p className="iv-status-body">
                {strings.callStatusBookedBodyPrefix} <strong>{maskedNumber}</strong>.{' '}
                {strings.callStatusBookedBodySuffix}
              </p>
            ) : (
              <p className="iv-status-body">
                {strings.callStatusCallingBodyPrefix} <strong>{maskedNumber}</strong>{' '}
                {strings.callStatusCallingBodyFrom} <strong>{callerNumber}</strong>.
              </p>
            )}

            <div className="iv-centre-form">
              <div className="iv-plane iv-form-panel" style={{ textAlign: 'left' }}>
                <div className="iv-micro-label-underlined">
                  <span className="iv-micro-label">{detailLabel}</span>
                  <div className="iv-micro-label-underline" aria-hidden="true" />
                </div>

                <div className="iv-detail-list">
                  {status === 'booked' && (
                    <>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.callStatusBeforeCallRow1}</span>
                      </div>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.callStatusBeforeCallRow2(callerNumber)}</span>
                      </div>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.callStatusBeforeCallRow3}</span>
                      </div>
                    </>
                  )}
                  {status === 'calling' && (
                    <>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.callStatusWhileYouWaitRow1}</span>
                      </div>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.callStatusWhileYouWaitRow2}</span>
                      </div>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.callStatusWhileYouWaitRow3}</span>
                      </div>
                    </>
                  )}
                  {status === 'not-received' && (
                    <>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.callStatusCheck1}</span>
                      </div>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">{strings.callStatusCheck2(callerNumber)}</span>
                      </div>
                      <div className="iv-detail-row">
                        <span className="iv-detail-dot" aria-hidden="true" />
                        <span className="iv-detail-text">
                          {strings.callStatusCheck3Prefix} <strong>{maskedNumber}</strong>.
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {status === 'not-received' && (
                  <div className="iv-cta-wrap" style={{ marginTop: '24px' }}>
                    <button
                      type="button"
                      className="iv-cta"
                      onClick={() => setStatus('calling')}
                    >
                      {strings.callStatusCallAgain}
                      <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
                    </button>
                    <div className="iv-cta-bloom" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>

            {status === 'booked' && (
              <div className="iv-link-row">
                <button type="button" className="iv-text-link" onClick={onAddToCalendar}>
                  {strings.callStatusAddToCalendar}
                </button>
                <span className="iv-link-row-divider" aria-hidden="true" />
                <button type="button" className="iv-text-link" onClick={onScheduleInstead}>
                  {strings.callStatusChangeTime}
                </button>
              </div>
            )}
            {status === 'calling' && (
              <div className="iv-link-row">
                <button type="button" className="iv-text-link" onClick={() => setStatus('not-received')}>
                  {strings.callStatusDidntGetCall}
                </button>
                <span className="iv-link-row-divider" aria-hidden="true" />
                <button type="button" className="iv-text-link" onClick={onScheduleInstead}>
                  {strings.callStatusScheduleInstead}
                </button>
              </div>
            )}
            {status === 'not-received' && (
              <div className="iv-link-row">
                <button type="button" className="iv-text-link" onClick={onUseDifferentNumber}>
                  {strings.callStatusUseDifferentNumber}
                </button>
                <span className="iv-link-row-divider" aria-hidden="true" />
                <button type="button" className="iv-text-link" onClick={onScheduleInstead}>
                  {strings.callStatusScheduleInstead}
                </button>
              </div>
            )}

            {status === 'booked' && <p className="iv-verify-sms-note">{strings.callStatusCloseTab}</p>}
            {status === 'calling' && <p className="iv-verify-sms-note">{strings.callStatusKeepTabOpen}</p>}
          </div>
        </div>
      </InterviewThemeProvider>
    </>
  );
}
