'use client';

import * as React from 'react';
import { FileText, X, ArrowRight, CloudUpload as UploadCloud } from 'lucide-react';
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
  const [isDragging, setIsDragging] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const update = (key: keyof FormValues, value: string | File | null | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = (key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    if (submitAttempted) {
      setErrors(currentErrors);
    }
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
    setSubmitAttempted(true);
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
      console.log('Interview form submitted', values);
      onSubmitSuccess?.();
    } else {
      const firstErrorKey = Object.keys(currentErrors)[0];
      const el = formRef.current?.querySelector(`[name="${firstErrorKey}"], #iv-resume-dropzone, [data-field="${firstErrorKey}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement | null)?.focus?.();
    }
  };

  const processFile = (file: File) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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

  const ctaDisabled = false;

  const errorList = submitAttempted ? Object.entries(currentErrors).filter(([, v]) => v) : [];

  return (
    <form ref={formRef} className="iv-plane iv-form-panel" onSubmit={handleSubmit} noValidate>
      <span className="iv-micro-label">{strings.applyLabel}</span>
      <h2 className="iv-form-heading">{strings.formHeading}</h2>

      {errorList.length > 0 && (
        <div className="iv-error-summary" role="alert" aria-live="polite">
          <p className="iv-error-summary-title">Please fix the following before continuing:</p>
          <ul className="iv-error-summary-list">
            {errorList.map(([key, msg]) => (
              <li key={key}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

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
            id="iv-resume-dropzone"
            className={`iv-resume-dropzone${isDragging ? ' iv-resume-dropzone--dragging' : ''}${values.resume ? ' iv-resume-dropzone--filled' : ''}`}
            onClick={() => !values.resume && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            data-field="resume"
            aria-invalid={touched.resume && !!errors.resume}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!values.resume) fileInputRef.current?.click();
              }
            }}
          >
            {values.resume ? (
              <div className="iv-resume-file-card">
                <FileText size={20} strokeWidth={1.5} className="iv-resume-file-icon" />
                <div className="iv-resume-file-info">
                  <span className="iv-resume-filename">{values.resume.name}</span>
                  <span className="iv-resume-file-size">{(values.resume.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <button
                  type="button"
                  className="iv-resume-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileRemove();
                  }}
                  aria-label="Remove file"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div className="iv-resume-dropzone-empty">
                <UploadCloud size={24} strokeWidth={1.5} className="iv-resume-upload-icon" />
                <span className="iv-resume-dropzone-label">{strings.resume}</span>
                <span className="iv-resume-hint">{strings.resumeHint}</span>
              </div>
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
        >
          {strings.ctaBegin}
          <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
        </button>
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
