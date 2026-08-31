'use client';

import * as React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { startOfDay, isBefore, addDays } from 'date-fns';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { DateStrip } from '@/components/interview/date-strip';
import { TimeWheelColumn } from '@/components/interview/time-wheel-column';
import { strings } from '@/lib/interview/strings';
import {
  formatScheduleDateLabel,
  formatTimeLabel,
  formatTimezoneAbbr,
  formatTimezoneLabel,
} from '@/lib/interview/schedule-format';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

const MIN_HOUR = 8;
const MAX_HOUR = 20;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const COMMON_TIMEZONES = [
  'Europe/Amsterdam',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Australia/Sydney',
];

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam';
  } catch {
    return 'Europe/Amsterdam';
  }
}

function timezoneOptions(detected: string): string[] {
  return Array.from(new Set([detected, ...COMMON_TIMEZONES]));
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export interface RescheduleChoice {
  date: Date;
  hour: number;
  minute: number;
  timezone: string;
}

interface RescheduleScreenProps {
  config?: InterviewConfig;
  currentBookingDate?: Date;
  currentBookingHour?: number;
  currentBookingMinute?: number;
  currentBookingTimezone?: string;
  onConfirmed?: (choice: RescheduleChoice) => void;
  onKeepOriginal?: () => void;
  onCancelInterview?: () => void;
}

export function RescheduleScreen({
  config = defaultConfig,
  currentBookingDate,
  currentBookingHour = 9,
  currentBookingMinute = 30,
  currentBookingTimezone = 'Europe/Amsterdam',
  onConfirmed,
  onKeepOriginal,
  onCancelInterview,
}: RescheduleScreenProps) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const resolvedCurrentBookingDate = React.useMemo(
    () => currentBookingDate ?? addDays(today, 4),
    [currentBookingDate, today]
  );

  const initialSelectedDate = React.useMemo(() => {
    const dayAfter = addDays(resolvedCurrentBookingDate, 1);
    return isWeekend(dayAfter) ? addDays(dayAfter, 2) : dayAfter;
  }, [resolvedCurrentBookingDate]);

  // The strip must open on whichever week actually contains the
  // pre-selected date — deriving it from the current booking instead
  // left the picked date outside the visible week whenever the day
  // after the booking rolled into the following week's Monday.
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(initialSelectedDate));
  const [selectedDate, setSelectedDate] = React.useState(() => initialSelectedDate);
  const [hour, setHour] = React.useState(currentBookingHour);
  const [minute, setMinute] = React.useState(currentBookingMinute);
  const detectedTz = React.useMemo(() => detectTimezone(), []);
  const [timezone, setTimezone] = React.useState(currentBookingTimezone || detectedTz);
  const [submitting, setSubmitting] = React.useState(false);

  const weekDays = React.useMemo(() => getWeekDays(weekStart), [weekStart]);

  const isDateDisabled = React.useCallback(
    (date: Date) => isWeekend(date) || isBefore(startOfDay(date), today),
    [today]
  );

  const isCurrentBookingDay = React.useCallback(
    (date: Date) => isSameDay(date, resolvedCurrentBookingDate),
    [resolvedCurrentBookingDate]
  );

  const isHourDisabled = (h: number) => h < MIN_HOUR || h > MAX_HOUR;

  const currentDateLabel = formatScheduleDateLabel(resolvedCurrentBookingDate);
  const currentTimeLabel = formatTimeLabel(currentBookingHour, currentBookingMinute);
  const currentTzAbbr = formatTimezoneAbbr(currentBookingTimezone);

  const newDateLabel = formatScheduleDateLabel(selectedDate);
  const newTimeLabel = formatTimeLabel(hour, minute);
  const newTzAbbr = formatTimezoneAbbr(timezone);

  const handleConfirm = async () => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSubmitting(false);
    onConfirmed?.({ date: selectedDate, hour, minute, timezone });
  };

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

        <div className="iv-layout-two-col">
          {/* Left column */}
          <div className="iv-left-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="iv-status-dot" aria-hidden="true" />
              <span className="iv-micro-label">{strings.rescheduleEyebrow(config.company.name)}</span>
            </div>

            <h1 className="iv-job-title" style={{ fontSize: 'clamp(2.25rem, 3.2vw, 2.75rem)' }}>
              {strings.rescheduleHeading}
            </h1>

            <div>
              <span className="iv-micro-label iv-current-booking-label">
                {strings.rescheduleCurrentlyBooked}
              </span>
              <p className="iv-current-booking-value iv-strike">
                {currentDateLabel} at {currentTimeLabel} ({currentTzAbbr})
              </p>
            </div>

            <p className="iv-verify-subtext" style={{ textAlign: 'left', margin: 0 }}>
              {strings.rescheduleNote}
            </p>

            <hr className="iv-hairline" />

            <div className="iv-meta-row">
              <span className="iv-meta-item">{strings.scheduleMetaDuration}</span>
              <span className="iv-meta-divider" aria-hidden="true" />
              <span className="iv-meta-item">{strings.scheduleMetaVoiceOnly}</span>
              <span className="iv-meta-divider" aria-hidden="true" />
              <span className="iv-meta-item">{strings.scheduleMetaReschedule}</span>
            </div>
          </div>

          {/* Right column — the new-time plane */}
          <div className="iv-right-col">
            <div className="iv-schedule-right">
              <div className="iv-plane iv-form-panel">
                <span className="iv-micro-label" style={{ display: 'block', marginBottom: '16px' }}>
                  {strings.rescheduleChooseATime}
                </span>

                <DateStrip
                  days={weekDays}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  onPrevWeek={() =>
                    setWeekStart((w) => {
                      const next = addDays(w, -7);
                      return isBefore(next, startOfWeek(today)) ? startOfWeek(today) : next;
                    })
                  }
                  onNextWeek={() => setWeekStart((w) => addDays(w, 7))}
                  isDisabled={isDateDisabled}
                  isCurrent={isCurrentBookingDay}
                />

                <hr className="iv-hairline" style={{ margin: '20px 0' }} />

                <span className="iv-micro-label iv-time-wheel-label">{strings.scheduleTimeLabel}</span>

                <div className="iv-time-wheel">
                  <div className="iv-time-wheel-band iv-time-wheel-band-top" aria-hidden="true" />
                  <div className="iv-time-wheel-band iv-time-wheel-band-bottom" aria-hidden="true" />
                  <TimeWheelColumn
                    values={HOURS}
                    selectedValue={hour}
                    onChange={setHour}
                    isDisabled={isHourDisabled}
                    ariaLabel="Hour"
                  />
                  <span className="iv-time-wheel-colon" aria-hidden="true">:</span>
                  <TimeWheelColumn
                    values={MINUTES}
                    selectedValue={minute}
                    onChange={setMinute}
                    ariaLabel="Minute"
                  />
                </div>

                <p className="iv-time-wheel-note">
                  {strings.scheduleCallWindowNote('08:00', '20:00')}
                </p>

                <hr className="iv-hairline" style={{ margin: '20px 0' }} />

                <div className="iv-timezone-field">
                  <span className="iv-micro-label" style={{ display: 'block', marginBottom: '8px' }}>
                    {strings.scheduleTimezoneLabel}
                  </span>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      aria-label={strings.scheduleTimezoneLabel}
                      className="iv-timezone-value-row"
                      style={{ appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      {timezoneOptions(detectedTz).map((tz) => (
                        <option key={tz} value={tz}>
                          {formatTimezoneLabel(tz)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      strokeWidth={1.5}
                      className="iv-timezone-chevron"
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-60%)', pointerEvents: 'none' }}
                    />
                  </div>
                </div>

                <p className="iv-schedule-confirm">
                  {strings.rescheduleConfirm(newDateLabel, newTimeLabel, newTzAbbr)}
                </p>

                <hr className="iv-hairline" style={{ margin: '24px 0 0 0' }} />

                <div className="iv-cta-wrap">
                  <button
                    type="button"
                    className="iv-cta"
                    onClick={handleConfirm}
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? (
                      <span className="iv-cta-spinner" aria-hidden="true" />
                    ) : (
                      <>
                        {strings.rescheduleCta}
                        <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
                      </>
                    )}
                  </button>
                  {!submitting && <div className="iv-cta-bloom" aria-hidden="true" />}
                </div>

                <div className="iv-link-row" style={{ marginTop: '16px' }}>
                  <button type="button" className="iv-text-link" onClick={onKeepOriginal}>
                    {strings.rescheduleKeepOriginal}
                  </button>
                  <span className="iv-link-row-divider" aria-hidden="true" />
                  <button type="button" className="iv-text-link" onClick={onCancelInterview}>
                    {strings.rescheduleCancelInterview}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </InterviewThemeProvider>
    </>
  );
}
