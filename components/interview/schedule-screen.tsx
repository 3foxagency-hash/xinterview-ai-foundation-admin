'use client';

import * as React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { startOfDay, isBefore } from 'date-fns';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { DateStrip } from '@/components/interview/date-strip';
import { TimeWheelColumn } from '@/components/interview/time-wheel-column';
import { strings } from '@/lib/interview/strings';
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

/** "Europe/Amsterdam" + now → "Europe/Amsterdam · CEST (GMT+2)" */
function formatTimezoneLabel(tz: string): string {
  const region = tz.replace(/_/g, ' ');
  const now = new Date();
  const abbr =
    new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? '';
  const offset =
    new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? '';
  // Some ICU builds have no real abbreviation for a zone and fall back to
  // the offset for 'short' too (e.g. "GMT+2" instead of "CEST"), which
  // would otherwise print the redundant "GMT+2 (GMT+2)".
  if (!abbr || abbr === offset) return `${region} · ${offset || abbr}`;
  return `${region} · ${abbr} (${offset})`;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  // Monday-first week, matching the brief's Mon–Sun strip.
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

interface ScheduleScreenProps {
  config?: InterviewConfig;
  countryCode?: string;
  nationalNumber?: string;
  onConfirmed?: (choice: { mode: 'now' | 'later'; date?: Date; hour?: number; minute?: number; timezone?: string }) => void;
}

export function ScheduleScreen({
  config = defaultConfig,
  countryCode = '+31',
  nationalNumber = '612344218',
  onConfirmed,
}: ScheduleScreenProps) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const [mode, setMode] = React.useState<'now' | 'later'>('later');
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(today));
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [hour, setHour] = React.useState(9);
  const [minute, setMinute] = React.useState(30);
  const detectedTz = React.useMemo(() => detectTimezone(), []);
  const [timezone, setTimezone] = React.useState(detectedTz);
  const [submitting, setSubmitting] = React.useState(false);

  const maskedNumber = React.useMemo(() => {
    const digits = nationalNumber.replace(/\D/g, '');
    if (digits.length <= 5) return `${countryCode} ${digits}`;
    const visibleStart = digits.slice(0, 1);
    const middle = digits.slice(1, -4);
    const end = digits.slice(-4);
    const maskedMiddle = (middle.match(/.{1,2}/g) ?? []).map((g) => '•'.repeat(g.length)).join(' ');
    const endGroups = (end.match(/.{1,2}/g) ?? [end]).join(' ');
    return `${countryCode} ${visibleStart} ${maskedMiddle} ${endGroups}`;
  }, [countryCode, nationalNumber]);

  const weekDays = React.useMemo(() => getWeekDays(weekStart), [weekStart]);

  const isDateDisabled = React.useCallback(
    (date: Date) => isWeekend(date) || isBefore(startOfDay(date), today),
    [today]
  );

  const isHourDisabled = (h: number) => h < MIN_HOUR || h > MAX_HOUR;

  const dateLabel = `${selectedDate.toLocaleDateString('en-US', { weekday: 'long' })} ${selectedDate.getDate()} ${selectedDate.toLocaleDateString('en-US', { month: 'long' })}`;
  const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const tzAbbr =
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value ?? timezone;

  const handleConfirm = async () => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSubmitting(false);
    onConfirmed?.(
      mode === 'now'
        ? { mode }
        : { mode, date: selectedDate, hour, minute, timezone }
    );
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
              <span className="iv-micro-label">{strings.scheduleEyebrow(config.company.name)}</span>
            </div>

            <h1 className="iv-job-title" style={{ fontSize: 'clamp(2.25rem, 3.2vw, 2.75rem)' }}>
              {strings.scheduleHeading}
            </h1>

            <p className="iv-verify-subtext" style={{ textAlign: 'left', margin: 0 }}>
              {strings.scheduleSubtext} <strong>{maskedNumber}</strong>.
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

          {/* Right column — the choice plane */}
          <div className="iv-right-col">
            <div className="iv-schedule-right">
              <div className="iv-plane iv-form-panel">
                <span className="iv-micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                  {strings.scheduleChooseATime}
                </span>

                <div className="iv-option-list">
                  <button
                    type="button"
                    className={`iv-option-row${mode === 'now' ? ' iv-option-row-selected' : ''}`}
                    onClick={() => setMode('now')}
                    aria-pressed={mode === 'now'}
                  >
                    <span className="iv-option-radio" aria-hidden="true">
                      {mode === 'now' && <span className="iv-option-radio-dot" />}
                    </span>
                    <span className="iv-option-copy">
                      <span className="iv-option-label">{strings.scheduleCallNowLabel}</span>
                      <span className="iv-option-sub">{strings.scheduleCallNowSub}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`iv-option-row${mode === 'later' ? ' iv-option-row-selected' : ''}`}
                    onClick={() => setMode('later')}
                    aria-pressed={mode === 'later'}
                  >
                    <span className="iv-option-radio" aria-hidden="true">
                      {mode === 'later' && <span className="iv-option-radio-dot" />}
                    </span>
                    <span className="iv-option-copy">
                      <span className="iv-option-label">{strings.scheduleLaterLabel}</span>
                      <span className="iv-option-sub">{strings.scheduleLaterSub}</span>
                    </span>
                  </button>
                </div>

                {mode === 'later' && (
                  <>
                    <hr className="iv-hairline" style={{ margin: '20px 0' }} />

                    <DateStrip
                      days={weekDays}
                      selectedDate={selectedDate}
                      onSelect={setSelectedDate}
                      onPrevWeek={() => setWeekStart((w) => {
                        const next = new Date(w);
                        next.setDate(next.getDate() - 7);
                        return isBefore(next, startOfWeek(today)) ? startOfWeek(today) : next;
                      })}
                      onNextWeek={() => setWeekStart((w) => {
                        const next = new Date(w);
                        next.setDate(next.getDate() + 7);
                        return next;
                      })}
                      isDisabled={isDateDisabled}
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
                      <p className="iv-timezone-hint">{strings.scheduleTimezoneHint}</p>
                    </div>

                    <p className="iv-schedule-confirm">
                      {strings.scheduleConfirmLater(dateLabel, timeLabel, tzAbbr)}
                    </p>
                  </>
                )}

                {mode === 'now' && (
                  <p className="iv-schedule-confirm">{strings.scheduleConfirmNow}</p>
                )}

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
                        {mode === 'now' ? strings.scheduleCtaNow : strings.scheduleCta}
                        <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
                      </>
                    )}
                  </button>
                  {!submitting && <div className="iv-cta-bloom" aria-hidden="true" />}
                </div>

                <p className="iv-verify-sms-note">{strings.scheduleReminderNote}</p>
              </div>
            </div>
          </div>
        </div>
      </InterviewThemeProvider>
    </>
  );
}
