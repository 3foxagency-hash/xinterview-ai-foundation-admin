'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { OtpCodeInput } from '@/components/interview/otp-code-input';
import { strings } from '@/lib/interview/strings';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 24;

/** ("+31", "612344218") → "+31 6 •• •• 42 18" — the country code and
 *  the last four digits stay visible, everything between is masked in
 *  pairs. Takes the country code and national number as separate
 *  arguments (matching how the application form's phone field already
 *  stores them via CountryCodeSelect) rather than parsing them back
 *  out of one string — a fixed \d{1,3} split can't tell a 2-digit
 *  country code from a 3-digit one apart from the digits after it. */
function maskPhoneNumber(countryCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, '');
  if (digits.length <= 5) return `${countryCode} ${digits}`;

  const visibleStart = digits.slice(0, 1);
  const middle = digits.slice(1, -4);
  const end = digits.slice(-4);
  const maskedMiddle = (middle.match(/.{1,2}/g) ?? [])
    .map((group) => '•'.repeat(group.length))
    .join(' ');
  const endGroups = (end.match(/.{1,2}/g) ?? [end]).join(' ');

  return `${countryCode} ${visibleStart} ${maskedMiddle} ${endGroups}`;
}

interface PhoneVerifyScreenProps {
  config?: InterviewConfig;
  /** Mocked here until the real number the candidate entered on the
   *  application form is wired in. */
  countryCode?: string;
  nationalNumber?: string;
  onVerified?: () => void;
  onUseDifferentNumber?: () => void;
}

export function PhoneVerifyScreen({
  config = defaultConfig,
  countryCode = '+31',
  nationalNumber = '612344218',
  onVerified,
  onUseDifferentNumber,
}: PhoneVerifyScreenProps) {
  const [code, setCode] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = React.useState(RESEND_SECONDS);
  const maskedNumber = React.useMemo(
    () => maskPhoneNumber(countryCode, nationalNumber),
    [countryCode, nationalNumber]
  );
  const isComplete = code.length === CODE_LENGTH;

  React.useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const handleChange = (next: string) => {
    setCode(next);
    if (error) setError(null);
  };

  const handleVerify = async () => {
    if (!isComplete || submitting) return;
    setSubmitting(true);
    setError(null);
    // Mock verification — any complete code succeeds after a short delay,
    // standing in for the real SMS-verification API.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSubmitting(false);
    onVerified?.();
  };

  const handleResend = () => {
    if (resendSeconds > 0) return;
    setResendSeconds(RESEND_SECONDS);
    setCode('');
    toast(strings.verifyResentToast(maskedNumber));
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

        <div className="iv-layout-centre">
          <div className="iv-centre-content">
            <div className="iv-verify-eyebrow-row">
              <span className="iv-status-dot" aria-hidden="true" />
              <span className="iv-micro-label">{strings.verifyEyebrow(config.company.name)}</span>
            </div>

            <h1 className="iv-job-title" style={{ fontSize: 'clamp(1.875rem, 3.6vw, 3rem)' }}>
              {strings.verifyHeading}
            </h1>

            <p className="iv-verify-subtext">
              {strings.verifySubtext} <strong>{maskedNumber}</strong>.
            </p>

            <div className="iv-centre-form">
              <div className="iv-plane iv-form-panel">
                <span className="iv-micro-label iv-verify-code-label">
                  {strings.verifyCodeLabel}
                </span>

                <OtpCodeInput
                  value={code}
                  onChange={handleChange}
                  onComplete={() => setError(null)}
                  error={!!error}
                  disabled={submitting}
                  autoFocus
                />

                {error && (
                  <p role="alert" className="iv-field-error" style={{ textAlign: 'center', marginTop: '10px' }}>
                    {error}
                  </p>
                )}

                <div className="iv-verify-resend-row">
                  <span className="iv-verify-resend-left">
                    {strings.verifyDidntGetIt}
                    <button
                      type="button"
                      className="iv-verify-resend-link"
                      onClick={handleResend}
                      disabled={resendSeconds > 0}
                    >
                      {strings.verifyResendCode}
                    </button>
                  </span>
                  {resendSeconds > 0 && (
                    <span className="iv-verify-resend-timer">
                      {strings.verifyResendIn(resendSeconds)}
                    </span>
                  )}
                </div>

                <hr className="iv-hairline" style={{ margin: '24px 0 0 0' }} />

                <div className="iv-cta-wrap">
                  <button
                    type="button"
                    className={`iv-cta${!isComplete ? ' iv-cta-incomplete' : ''}`}
                    disabled={!isComplete || submitting}
                    onClick={handleVerify}
                    aria-busy={submitting}
                  >
                    {submitting ? (
                      <span className="iv-cta-spinner" aria-hidden="true" />
                    ) : (
                      <>
                        {strings.verifyCta}
                        <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
                      </>
                    )}
                  </button>
                  {isComplete && !submitting && <div className="iv-cta-bloom" aria-hidden="true" />}
                </div>

                <p className="iv-verify-sms-note">{strings.verifySmsRatesNote}</p>
              </div>
            </div>

            <button
              type="button"
              className="iv-verify-different-number"
              onClick={onUseDifferentNumber}
            >
              {strings.verifyUseDifferentNumber}
            </button>
          </div>
        </div>
      </InterviewThemeProvider>
    </>
  );
}
