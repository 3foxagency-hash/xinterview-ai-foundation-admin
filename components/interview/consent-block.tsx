'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';
import type { InterviewConfig } from '@/config/interview.mock';

interface ConsentBlockProps {
  config: InterviewConfig;
  values: { platform: boolean; employer: boolean };
  onChange: (key: 'platform' | 'employer', value: boolean) => void;
  errors: { platform?: string; employer?: string };
  touched: { platform: boolean; employer: boolean };
}

export function ConsentBlock({
  config,
  values,
  onChange,
  errors,
  touched,
}: ConsentBlockProps) {
  const { consent, company } = config;
  const showEmployer =
    consent.employerTermsUrl !== null && consent.employerPrivacyUrl !== null;

  return (
    <div className="iv-consent">
      <span className="iv-micro-label iv-consent-label">
        {strings.consentLabel}
      </span>
      <hr className="iv-consent-divider" />

      <div className="iv-consent-items">
        {/* Platform consent */}
        <label className="iv-consent-item">
          <input
            id="iv-consent-platform"
            type="checkbox"
            className="iv-consent-checkbox"
            checked={values.platform}
            onChange={(e) => onChange('platform', e.target.checked)}
            aria-invalid={touched.platform && errors.platform ? 'true' : 'false'}
            aria-describedby={
              touched.platform && errors.platform ? 'consent-platform-error' : undefined
            }
          />
          <span className="iv-consent-text">
            I agree to the{' '}
            <a
              href={consent.platformTermsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href={consent.platformPrivacyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          </span>
        </label>
        {touched.platform && errors.platform && (
          <span
            className="iv-consent-error"
            role="alert"
            id="consent-platform-error"
          >
            {errors.platform}
          </span>
        )}

        {/* Employer consent (conditional) */}
        {showEmployer && (
          <>
            <label className="iv-consent-item">
              <input
                id="iv-consent-employer"
                type="checkbox"
                className="iv-consent-checkbox"
                checked={values.employer}
                onChange={(e) => onChange('employer', e.target.checked)}
                aria-invalid={touched.employer && errors.employer ? 'true' : 'false'}
                aria-describedby={
                  touched.employer && errors.employer
                    ? 'consent-employer-error'
                    : undefined
                }
              />
              <span className="iv-consent-text">
                I agree to{' '}
                <a
                  href={consent.employerTermsUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {company.name}&apos;s hiring terms
                </a>{' '}
                and{' '}
                <a
                  href={consent.employerPrivacyUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  privacy policy
                </a>
              </span>
            </label>
            {touched.employer && errors.employer && (
              <span
                className="iv-consent-error"
                role="alert"
                id="consent-employer-error"
              >
                {errors.employer}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
