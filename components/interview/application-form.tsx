'use client';

import * as React from 'react';
import { FileText, X, ArrowRight } from 'lucide-react';
import { UnderlineField } from '@/components/interview/underline-field';
import { ConsentBlock } from '@/components/interview/consent-block';
import { CountryCodeSelect } from '@/components/interview/country-code-select';
import { strings } from '@/lib/interview/strings';
import { DEFAULT_COUNTRY } from '@/lib/interview/country-codes';
import { useDetectedCountry } from '@/lib/interview/use-detected-country';
import type { InterviewConfig } from '@/config/interview.mock';

type FieldKey =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'linkedin'
  | 'portfolio';

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  resume: File | null;
  platformConsent: boolean;
  employerConsent: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  resume?: string;
  platformConsent?: string;
  employerConsent?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/;

export function ApplicationForm({
  config,
  onSubmitSuccess,
}: {
  config: InterviewConfig;
  onSubmitSuccess?: () => void;
}) {
  const { fields, prefilled, consent, company, disclosures } = config;
  const showEmployer =
    consent.employerTermsUrl !== null && consent.employerPrivacyUrl !== null;

  const [values, setValues] = React.useState<FormValues>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    resume: null,
    platformConsent: false,
    employerConsent: false,
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const update = (key: keyof FormValues, value: string | File | null | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = (key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (fields.firstName.enabled && fields.firstName.required && !values.firstName)
      e.firstName = strings.errorRequired(strings.firstName);
    if (fields.lastName.enabled && fields.lastName.required && !values.lastName)
      e.lastName = strings.errorRequired(strings.lastName);
    if (fields.email.enabled && fields.email.required && !values.email)
      e.email = strings.errorRequired(strings.email);
    else if (fields.email.enabled && values.email && !EMAIL_RE.test(values.email))
      e.email = strings.errorEmail;
    if (fields.phone.enabled && values.phone && values.phone.length < 4)
      e.phone = strings.errorRequired(strings.phone);
    if (fields.linkedin.enabled && values.linkedin && !URL_RE.test(values.linkedin))
      e.linkedin = strings.errorUrl;
    if (fields.portfolio.enabled && values.portfolio && !URL_RE.test(values.portfolio))
      e.portfolio = strings.errorUrl;
    if (fields.resume.enabled && fields.resume.required && !values.resume)
      e.resume = strings.errorRequired(strings.resume);
    if (!values.platformConsent)
      e.platformConsent = strings.consentRequired;
    if (showEmployer && !values.employerConsent)
      e.employerConsent = strings.consentRequired;
    return e;
  };

  const currentErrors = React.useMemo(() => validate(), [values, fields, showEmployer]);

  const isValid = Object.keys(currentErrors).length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      linkedin: true,
      portfolio: true,
      resume: true,
      platformConsent: true,
      employerConsent: true,
    });
    setErrors(currentErrors);
    if (isValid) {
      // Mock submit — no backend
      console.log('Interview form submitted', values);
      onSubmitSuccess?.();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTouched((prev) => ({ ...prev, resume: true }));
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrors((prev) => ({ ...prev, resume: strings.errorFileType }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, resume: strings.errorFileTooLarge }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    update('resume', file);
    setErrors((prev) => ({ ...prev, resume: undefined }));
  };

  const handleFileRemove = () => {
    update('resume', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Default the phone country from the candidate's IP-detected location,
  // but let them pick a different one — detection only fills the default,
  // it never overrides a choice the candidate already made.
  const detectedCountry = useDetectedCountry();
  const [phoneCountry, setPhoneCountry] = React.useState(DEFAULT_COUNTRY);
  const phoneCountryTouchedRef = React.useRef(false);

  React.useEffect(() => {
    if (detectedCountry && !phoneCountryTouchedRef.current) {
      setPhoneCountry(detectedCountry);
    }
  }, [detectedCountry]);

  const handlePhoneCountryChange = (countryCode: string) => {
    phoneCountryTouchedRef.current = true;
    setPhoneCountry(countryCode);
  };

  const ctaDisabled = !isValid;

  return (
    <form className="iv-plane iv-form-panel" onSubmit={handleSubmit} noValidate>
      <span className="iv-micro-label">{strings.applyLabel}</span>
      <h2 className="iv-form-heading">{strings.formHeading}</h2>

      {/* First name / Last name */}
      {(fields.firstName.enabled || fields.lastName.enabled) && (
        <div className="iv-field-pair">
          {fields.firstName.enabled && (
            <UnderlineField
              label={strings.firstName}
              name="firstName"
              value={values.firstName}
              onChange={(v) => update('firstName', v)}
              onBlur={() => handleBlur('firstName')}
              required={fields.firstName.required}
              placeholder={prefilled.firstName}
              error={touched.firstName ? errors.firstName : undefined}
              autoComplete="given-name"
            />
          )}
          {fields.lastName.enabled && (
            <UnderlineField
              label={strings.lastName}
              name="lastName"
              value={values.lastName}
              onChange={(v) => update('lastName', v)}
              onBlur={() => handleBlur('lastName')}
              required={fields.lastName.required}
              placeholder={prefilled.lastName}
              error={touched.lastName ? errors.lastName : undefined}
              autoComplete="family-name"
            />
          )}
        </div>
      )}

      {/* Email */}
      {fields.email.enabled && (
        <UnderlineField
          label={strings.email}
          name="email"
          type="email"
          value={values.email}
          onChange={(v) => update('email', v)}
          onBlur={() => handleBlur('email')}
          required={fields.email.required}
          placeholder={prefilled.email}
          error={touched.email ? errors.email : undefined}
          autoComplete="email"
        />
      )}

      {/* Phone */}
      {fields.phone.enabled && (
        <UnderlineField
          label={strings.phone}
          name="phone"
          type="tel"
          value={values.phone}
          onChange={(v) => update('phone', v)}
          onBlur={() => handleBlur('phone')}
          required={fields.phone.required}
          placeholder={prefilled.phone}
          error={touched.phone ? errors.phone : undefined}
          leftSlot={
            <CountryCodeSelect value={phoneCountry} onChange={handlePhoneCountryChange} />
          }
          autoComplete="tel"
        />
      )}

      {/* LinkedIn / portfolio */}
      {fields.linkedin.enabled && (
        <UnderlineField
          label={strings.linkedin}
          name="linkedin"
          type="url"
          value={values.linkedin}
          onChange={(v) => update('linkedin', v)}
          onBlur={() => handleBlur('linkedin')}
          required={fields.linkedin.required}
          error={touched.linkedin ? errors.linkedin : undefined}
          placeholder={prefilled.linkedin ?? 'https://linkedin.com/in/...'}
        />
      )}
      {fields.portfolio.enabled && (
        <UnderlineField
          label={strings.portfolio}
          name="portfolio"
          type="url"
          value={values.portfolio}
          onChange={(v) => update('portfolio', v)}
          onBlur={() => handleBlur('portfolio')}
          required={fields.portfolio.required}
          error={touched.portfolio ? errors.portfolio : undefined}
          placeholder={prefilled.portfolio ?? 'https://...'}
        />
      )}

      {/* Resume */}
      {fields.resume.enabled && (
        <div className="iv-field">
          <label className="iv-field-label" htmlFor="iv-resume-input">
            {strings.resumeLabel}
          </label>
          <div
            className="iv-resume-row"
            onClick={() => !values.resume && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!values.resume) fileInputRef.current?.click();
              }
            }}
          >
            <FileText size={16} strokeWidth={1.5} className="iv-resume-icon" />
            {values.resume ? (
              <>
                <span className="iv-resume-filename">{values.resume.name}</span>
                <button
                  type="button"
                  className="iv-resume-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileRemove();
                  }}
                  aria-label="Remove file"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </>
            ) : (
              <>
                <span className="iv-resume-label">{strings.resume}</span>
                <span className="iv-resume-hint">{strings.resumeHint}</span>
              </>
            )}
            <input
              ref={fileInputRef}
              id="iv-resume-input"
              type="file"
              accept="application/pdf"
              className="iv-resume-input"
              onChange={handleFileChange}
            />
          </div>
          {touched.resume && errors.resume && (
            <span className="iv-field-error" role="alert">
              {errors.resume}
            </span>
          )}
        </div>
      )}

      {/* Consent */}
      <ConsentBlock
        config={config}
        values={{
          platform: values.platformConsent,
          employer: values.employerConsent,
        }}
        onChange={(key, val) =>
          update(key === 'platform' ? 'platformConsent' : 'employerConsent', val)
        }
        errors={{
          platform: errors.platformConsent,
          employer: errors.employerConsent,
        }}
        touched={{
          platform: touched.platformConsent,
          employer: touched.employerConsent,
        }}
      />

      {/* CTA */}
      <div className="iv-cta-wrap">
        <button
          type="submit"
          className="iv-cta"
          disabled={ctaDisabled}
          aria-busy={submitted && isValid}
          aria-describedby={ctaDisabled ? 'iv-cta-disabled-reason' : undefined}
        >
          {strings.ctaBegin}
          <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
        </button>
        {!isValid && ctaDisabled && (
          <div
            id="iv-cta-disabled-reason"
            role="tooltip"
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              color: 'var(--iv-text)',
              background: 'var(--iv-surface)',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 0.15s ease',
            }}
            className="iv-cta-tooltip"
          >
            {strings.ctaDisabledTooltip}
          </div>
        )}
        <div className="iv-cta-bloom" aria-hidden="true" />
      </div>

      {/* Beneath CTA */}
      <div className="iv-beneath-cta">
        <span className="iv-beneath-line">{strings.cameraNext}</span>
        <span className="iv-beneath-line">
          {strings.responsesShared(company.name)}
        </span>
        {disclosures.monitoring && (
          <span className="iv-beneath-line">{strings.monitoring}</span>
        )}
      </div>

      {/* Trust row */}
      <div className="iv-trust-row">{strings.trustRow}</div>
    </form>
  );
}
