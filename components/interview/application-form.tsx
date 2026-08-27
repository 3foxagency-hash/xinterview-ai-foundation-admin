'use client';

import * as React from 'react';
import { FileText, X, ArrowRight, UploadCloud, Loader2 } from 'lucide-react';
import { UnderlineField } from '@/components/interview/underline-field';
import { ConsentBlock } from '@/components/interview/consent-block';
import { CountryCodeSelect } from '@/components/interview/country-code-select';
import { CvUpload } from '@/components/interview/cv-upload';
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

/** Visual order of the form, so "the first invalid field" (2.1c) means
 *  the first one the candidate can see, not the first key on an object. */
const FIELD_ORDER = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'linkedin',
  'portfolio',
  'resume',
  'platformConsent',
  'employerConsent',
] as const;

/** DOM id for each error-able field, used to scroll/focus it. */
const FIELD_DOM_ID: Record<string, string> = {
  firstName: 'iv-field-firstName',
  lastName: 'iv-field-lastName',
  email: 'iv-field-email',
  phone: 'iv-field-phone',
  linkedin: 'iv-field-linkedin',
  portfolio: 'iv-field-portfolio',
  resume: 'iv-resume-input',
  platformConsent: 'iv-consent-platform',
  employerConsent: 'iv-consent-employer',
};

export function ApplicationForm({
  config,
  onSubmitSuccess,
}: {
  config: InterviewConfig;
  onSubmitSuccess?: () => void;
}) {
  // NOTE: config.prefilled is intentionally not read — the form starts
  // empty by design (see the values state below). The config field is
  // retained for API compatibility.
  const { fields, consent, company, disclosures } = config;
  const showEmployer =
    consent.employerTermsUrl !== null && consent.employerPrivacyUrl !== null;

  // Every field starts empty — no prefilled values. The fields show
  // placeholders only, so a candidate always types their own answer
  // rather than editing text that was put there for them.
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
  /** True once an invalid submit has been attempted — drives the
   *  summary message near the CTA. Distinct from isSubmitting. */
  const [submitted, setSubmitted] = React.useState(false);
  /** The real submit in flight (spinner, temporarily non-clickable) —
   *  a separate concern from validation blocking (2.1c). */
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  /** Resume upload states (2.1b). */
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
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
      e.resume = strings.errorRequired(strings.resumeLabel);
    if (!values.platformConsent)
      e.platformConsent = strings.consentRequired;
    if (showEmployer && !values.employerConsent)
      e.employerConsent = strings.consentRequired;
    return e;
  };

  const currentErrors = React.useMemo(() => validate(), [values, fields, showEmployer]);

  const isValid = Object.keys(currentErrors).length === 0;

  /** Moves focus to a field and scrolls it into view smoothly (2.1c). */
  const focusField = (key: string) => {
    const id = FIELD_DOM_ID[key];
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus after the scroll starts so the browser doesn't jump-scroll
    // to the element and cancel the smooth animation.
    window.setTimeout(() => {
      (el as HTMLElement).focus({ preventScroll: true });
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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

    // 2.1c — the button is always enabled, so an invalid click must be
    // blocked here rather than by a disabled attribute: mark every
    // invalid field, announce the count, and send the candidate to the
    // first problem. It must not submit and must not navigate.
    if (!isValid) {
      setSubmitted(true);
      const firstInvalid = FIELD_ORDER.find((k) => currentErrors[k as keyof FormErrors]);
      if (firstInvalid) focusField(firstInvalid);
      return;
    }

    setSubmitted(false);
    setIsSubmitting(true);
    // Mock submit — no backend
    console.log('Interview form submitted', values);
    onSubmitSuccess?.();
  };

  /** Shared by the file input and the drop zone. Validates type and
   *  size first, then runs the uploading state before settling on the
   *  selected state (2.1b). */
  const acceptFile = (file: File) => {
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

    setErrors((prev) => ({ ...prev, resume: undefined }));
    // There is no backend yet, so this reflects the local read rather
    // than a network upload — it is real progress over the file, not a
    // fabricated bar, and it settles on the selected state either way.
    setIsUploading(true);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    reader.onloadend = () => {
      setUploadProgress(100);
      setIsUploading(false);
      update('resume', file);
    };
    reader.onerror = () => {
      setIsUploading(false);
      setErrors((prev) => ({ ...prev, resume: strings.errorFileType }));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    acceptFile(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    setIsDragging(false);
    if (values.resume || isUploading) return;
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  const handleFileRemove = () => {
    update('resume', null);
    setUploadProgress(0);
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

  const invalidCount = Object.keys(currentErrors).length;
  /** Only after an invalid submit attempt — not while the candidate is
   *  still filling the form in for the first time. */
  const showValidationSummary = submitted && !isValid;

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
              placeholder={strings.firstNamePlaceholder}
              error={touched.firstName ? currentErrors.firstName : undefined}
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
              placeholder={strings.lastNamePlaceholder}
              error={touched.lastName ? currentErrors.lastName : undefined}
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
          placeholder={strings.emailPlaceholder}
          error={touched.email ? currentErrors.email : undefined}
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
          placeholder={strings.phonePlaceholder}
          error={touched.phone ? currentErrors.phone : undefined}
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
          error={touched.linkedin ? currentErrors.linkedin : undefined}
          placeholder={strings.linkedinPlaceholder}
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
          error={touched.portfolio ? currentErrors.portfolio : undefined}
          placeholder={strings.portfolioPlaceholder}
        />
      )}

      {/* Resume */}
      {fields.resume.enabled && (
        <div className="iv-field">
          <label className="iv-field-label" htmlFor="iv-resume-input">
            {strings.resumeLabel}
          </label>
          {/* Four interchangeable designs while the team compares
              them; see components/interview/cv-upload.tsx. */}
          <CvUpload
            design={config.cvDesign ?? 1}
            file={values.resume}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            isDragging={isDragging}
            error={touched.resume ? (errors.resume || currentErrors.resume) : undefined}
            inputRef={fileInputRef}
            onFileChange={handleFileChange}
            onDrop={handleFileDrop}
            onDragOver={(e) => {
              if (values.resume || isUploading) return;
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onRemove={handleFileRemove}
          />
          {touched.resume && (errors.resume || currentErrors.resume) && (
            <span className="iv-field-error" role="alert">
              {errors.resume || currentErrors.resume}
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
          platform: currentErrors.platformConsent,
          employer: currentErrors.employerConsent,
        }}
        touched={{
          platform: touched.platformConsent,
          employer: touched.employerConsent,
        }}
      />

      {/* CTA — 2.1c: always rendered in the full primary style, never
          greyed out. Clicking it with invalid data is blocked in
          handleSubmit (which marks the fields and scrolls to the first
          one) rather than by a disabled attribute. `disabled` applies
          only to the real in-flight submit. */}
      <div className="iv-cta-wrap">
        <button
          type="submit"
          className="iv-cta"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-describedby={showValidationSummary ? 'iv-cta-validation' : undefined}
        >
          {isSubmitting ? strings.ctaSubmitting : strings.ctaBegin}
          {isSubmitting ? (
            <span className="iv-cta-spinner" aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
          )}
        </button>
        <div className="iv-cta-bloom" aria-hidden="true" />
      </div>

      {/* Validation summary — announced assertively so a screen reader
          hears why the click did nothing (2.1c). */}
      <div className="iv-cta-validation-live" aria-live="assertive">
        {showValidationSummary && (
          <p id="iv-cta-validation" className="iv-cta-validation">
            {strings.ctaValidationSummary(invalidCount)}
          </p>
        )}
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
