/* ═══════════════════════════════════════════════════════════
   All user-facing strings for the candidate interview page.
   English only for now; the language selector switches a value
   but does not need real translations yet.
   ═══════════════════════════════════════════════════════════ */

export const strings = {
  // Top bar
  help: 'Help',
  poweredBy: 'Powered by XInterview',

  // Eyebrow
  eyebrow: (company: string) => `${company.toUpperCase()} · INTERVIEW`,

  // Meta row
  metaQuestions: (n: number) => `${n} questions`,
  metaEstimated: (n: number) => `≈${n} min`,
  metaRecord: 'Record anytime',

  // Job description
  jobDescriptionLabel: 'JOB DESCRIPTION',
  showMore: 'Show more ↓',
  showLess: 'Show less ↑',

  // Form
  applyLabel: 'APPLY',
  formHeading: 'Tell us who you are',

  // Field labels
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  linkedin: 'LinkedIn URL',
  portfolio: 'Portfolio URL',
  resume: 'Attach your CV',
  resumeHint: 'PDF · 5MB',

  // Optional link
  addLinks: '+ Add LinkedIn or portfolio',
  hideLinks: '− Remove',

  // Pre-filled
  fieldLocked: 'Locked',

  // Consent
  consentLabel: 'CONSENT',
  consentPlatform: 'I agree to the XInterview Terms of Service and Privacy Policy',
  consentPlatformLinks: (termsUrl: string, privacyUrl: string) =>
    `<a href="${termsUrl}" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer">Privacy Policy</a>`,
  consentEmployer: (company: string) =>
    `I agree to ${company}'s hiring terms and privacy policy`,
  consentEmployerLinks: (company: string, termsUrl: string, privacyUrl: string) =>
    `<a href="${termsUrl}" target="_blank" rel="noopener noreferrer">${company}'s hiring terms</a> and <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer">privacy policy</a>`,
  consentRequired: 'You must agree to continue',

  // CTA
  ctaBegin: 'Begin interview',
  ctaDisabledTooltip: 'Please complete all required fields and consents',

  // Beneath CTA
  cameraNext: 'Camera and microphone check comes next.',
  responsesShared: (company: string) =>
    `Your responses are shared only with the ${company} hiring team.`,
  aiEvaluation: 'Your responses will be evaluated by AI to help the hiring team review them efficiently.',
  monitoring: 'Your session may be monitored for security and integrity purposes.',

  // Trust row
  trustRow: 'AUTO-SAVED · ENCRYPTED · NO APP NEEDED',

  // Validation
  errorRequired: (field: string) => `${field} is required`,
  errorEmail: 'Enter a valid email address',
  errorUrl: 'Enter a valid URL',
  errorFileTooLarge: 'File must be 5MB or less',
  errorFileType: 'Only PDF files are accepted',
  errorConsent: 'You must agree to continue',

  // State pages
  stateExpiredTitle: 'This interview link has expired',
  stateExpiredBody: 'The deadline for this interview has passed. Please contact the hiring team if you believe this is an error.',
  stateExpiredContact: 'Contact the hiring team',

  stateInvalidTitle: "We couldn't find this interview",
  stateInvalidBody: 'The link may be mistyped or incomplete. Please check your invitation email and try again.',

  stateCompletedTitle: "You've already completed this interview",
  stateCompletedBody: (date: string) =>
    `Your responses were received on ${date}. The hiring team will be in touch with next steps.`,
  stateCompletedDate: '14 August 2026',

  stateNoQuestionsTitle: "This interview isn't ready yet",
  stateNoQuestionsBody: 'Interview cannot start as no questions have been set up. Please get in touch with the HR team.',

  // Video
  videoPlayLabel: 'Play intro video',
  videoPresenter: (name: string, title: string) => `${name}, ${title}`,

  // Theme
  themeToggleLight: 'Switch to light mode',
  themeToggleDark: 'Switch to dark mode',

  // Language
  languageLabel: 'Language',
} as const;
