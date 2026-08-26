/* ═══════════════════════════════════════════════════════════
   All user-facing strings for the candidate interview page.
   English only for now; the language selector switches a value
   but does not need real translations yet.
   ═══════════════════════════════════════════════════════════ */

export const strings = {
  // Top bar
  help: 'Help',

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
  resumeLabel: 'Resume',
  resume: 'Attach your CV',
  resumeHint: 'PDF · 5MB',

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

  // ── Device setup screen ──

  // Eyebrow & heading
  setupEyebrow: (company: string) => `${company.toUpperCase()} · INTERVIEW`,
  setupHeading: 'Check your setup',
  setupSubtext: 'A quick check so nothing surprises you mid-interview.',
  setupMicroLabel: 'SETUP',

  // State headings
  setupCheckingHeading: 'Checking your setup',
  setupReadyHeading: 'Everything looks good',
  setupDeniedHeading: 'We need camera access',
  setupNoDeviceHeading: "We can't find your camera",
  setupWeakConnectionHeading: 'Your connection looks slow',

  // Camera preview
  setupLiveLabel: 'Live',
  setupCameraAriaLabel: 'Live camera self-view preview',
  setupCheckingPreview: 'Checking your camera and microphone',

  // Mic meter
  setupMicLevelLabel: 'MIC LEVEL',
  setupMicTestHint: 'Say something to test',
  setupMicActive: 'Microphone is picking up sound',
  setupMicSilent: 'Microphone is quiet',
  setupNotRecorded: 'Nothing is recorded until you start an answer.',

  // Check rows
  setupCameraLabel: 'Camera',
  setupMicrophoneLabel: 'Microphone',
  setupConnectionLabel: 'Connection',
  setupCheckingLabel: 'Checking…',
  setupDeviceReady: 'Detected and ready',
  setupConnectionStable: 'Your answers will upload smoothly.',
  setupConnectionWeak: 'Your upload speed is low — answers may take longer to save.',

  // Connection results — upload matters most here since every recorded
  // answer has to be uploaded, so it drives the strong/weak verdict;
  // download is shown alongside for context only. Rendered as a status
  // badge plus two separate labeled speed rows (see ConnectionCheckRow),
  // not one long sentence.
  setupConnectionStrongBadge: 'Strong connection',
  setupConnectionWeakBadge: 'Weak connection',
  setupUploadLabel: 'Upload',
  setupDownloadLabel: 'Download',
  setupSpeedMbps: (mbps: number) => `${mbps} Mbps`,

  // Device selectors
  setupCameraSelectLabel: 'Camera',
  setupMicSelectLabel: 'Microphone',
  setupNoVideoDevices: 'No camera found',
  setupNoAudioDevices: 'No microphone found',
  setupDefaultCamera: 'Default camera',
  setupDefaultMic: 'Default microphone',

  // CTA
  setupCtaBegin: 'Begin interview',
  setupCtaTryAgain: 'Try again',
  setupCtaContinueAnyway: 'Continue anyway',

  // Secondary action
  setupPracticeLink: 'Try a practice question first',

  // Help link
  setupHelpLink: 'How to enable access',
  setupHelpTitle: 'Enable camera and microphone access',

  // Help panel — browser instructions
  setupHelpChrome: [
    'Click the camera or microphone icon in the address bar.',
    'Select Allow for both camera and microphone.',
    'Reload this page to apply the changes.',
  ],
  setupHelpSafari: [
    'Open Safari > Settings > Websites.',
    'Find this site in the Camera and Microphone lists.',
    'Set both to Allow, then reload this page.',
  ],
  setupHelpFirefox: [
    'Click the shield icon in the address bar.',
    'Clear the camera and microphone permissions.',
    'Reload this page and allow access when prompted.',
  ],
  setupHelpEdge: [
    'Click the lock icon in the address bar.',
    'Set Camera and Microphone to Allow.',
    'Reload this page to apply the changes.',
  ],
  setupHelpClose: 'Close',

  // ── Practice screen ──

  practiceLabel: 'PRACTICE — NOT RECORDED',
  practiceEyebrow: (company: string) => `${company.toUpperCase()} · PRACTICE`,
  practiceHeading: 'Try a practice question',
  practiceSubtext: 'Get comfortable with the format. Nothing here is saved or sent to the hiring team.',
  practiceMicroLabel: 'PRACTICE',
  practiceReadyHeading: 'Ready to begin?',
  practiceReadyBody: 'Practice answers aren\'t saved. The real interview starts now.',
  practiceBeginCta: 'Begin interview',
  practiceAgainLink: 'Practise again',
  practiceBackLink: 'Back to setup',

  // ── Interview shell ──

  questionOf: (current: number, total: number) => `QUESTION ${current} OF ${total}`,
  yourAnswerLabel: 'YOUR ANSWER',
  selectOneLabel: 'SELECT ONE',
  selectAllLabel: 'SELECT ALL THAT APPLY',

  // ── Question meta row ──

  metaVideo: 'Video answer',
  metaAudio: 'Audio answer',
  metaText: 'Written answer',
  metaChoice: 'Multiple choice',
  metaUpTo: (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `Up to ${m}:${String(s).padStart(2, '0')}` : `Up to ${m} min`;
  },
  metaTakes: (n: number) => `${n} ${n === 1 ? 'take' : 'takes'}`,
  metaCharacters: (n: number) => `Up to ${n} characters`,

  // ── Question description ──

  descriptionShowMore: 'Show more ↓',
  descriptionShowLess: 'Show less ↑',

  // ── Lifecycle states ──

  thinkingHeading: 'Get ready',
  thinkingStartsIn: (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `Recording starts in ${m}:${String(s).padStart(2, '0')}`;
  },
  thinkingStartNow: 'Start now',

  readyHeading: 'Ready when you are',
  readyStartRecording: 'Start recording',
  readyStartAnswering: 'Start answering',
  readyTimerStartsLine: 'The timer starts when you begin.',

  activeStopRecording: 'Stop recording',
  activeStopAnswering: 'Finish answer',
  activeRecLabel: 'REC',

  warningTimeRemaining: (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')} remaining`;
  },

  expiredSaved: 'Time\'s up — your answer was saved.',

  reviewHeading: 'Review your answer',
  reviewSubmitContinue: 'Submit and continue',
  reviewRecordAgain: (remaining: number) =>
    `Record again (${remaining} ${remaining === 1 ? 'take' : 'takes'} left)`,
  reviewRetake: 'Retake',
  reviewNoRetakes: 'No retakes remaining',
  reviewPlayLabel: 'Play answer',
  reviewPauseLabel: 'Pause',
  reviewDuration: (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  },

  // Inactivity after review
  inactivityCountdown: (seconds: number) =>
    `Keeping this answer in 0:${String(seconds).padStart(2, '0')}`,
  inactivityHoldOn: 'Hold on',

  // ── Upload ──

  uploadingLabel: 'Uploading your answer',
  uploadingKeepOpen: 'Keep this tab open until the upload finishes.',
  uploadingSlow: 'Still uploading — your connection is slow. Please keep this tab open.',
  uploadingRetry: 'Try again',
  uploadingContinueWithout: 'Continue without this answer',
  uploadingRetryFailed: (attempts: number) =>
    `Upload failed after ${attempts} attempts. You can try again or continue without this answer.`,

  // ── Text answer ──

  textCharCount: (current: number, max: number) => `${current} / ${max} characters`,
  textPasteBlocked: 'Pasting isn\'t allowed for written answers.',
  textPlaceholder: 'Write your answer here…',
  textWriteToContinue: 'Write your answer to continue.',

  // ── Choice answer ──

  choiceSelectToContinue: 'Select an option to continue.',

  // ── Audio recorder ──

  audioListening: 'Listening',

  // ── Timer ──

  timerAriaStart: 'Recording started',
  timerAraThirty: '30 seconds remaining',
  timerAriaFifteen: '15 seconds remaining',
  timerAriaExpired: 'Time is up',

  // ── Integrity ──

  disclosureTitle: 'Before you begin',
  disclosureWelcome: "You've made it to the interview — take a breath, you're in good hands.",
  disclosureWelcomeBody:
    "There's no one watching live, and no trick questions. Answer like you would in a real conversation: take your time to think, speak naturally, and be yourself. If you stumble over a word or need a second to collect your thoughts, that's completely fine — it happens to everyone.",

  disclosureInstructionsTitle: 'A few things to know',
  disclosureInstructionQuestions: (n: number) => `You'll be asked ${n} questions — a mix of video, audio, multiple choice, and written responses.`,
  disclosureInstructionThinking: 'Most questions give you a short moment to think before recording starts, so you can gather your thoughts first.',
  disclosureInstructionRetakes: "Some questions let you re-record if you're not happy with your first take — the exact number of retakes is shown on each question.",
  disclosureInstructionFinal: "Once you submit an answer, it's final — you won't be able to go back and change it, so review your recording before continuing.",
  disclosureInstructionEnvironment: 'Find a quiet, well-lit space, and double check your camera and microphone are working before you start.',

  disclosureIntegrityTitle: 'What we monitor, and why',
  disclosureIntegrityIntro:
    "To keep the process fair for every candidate, this interview includes a few automated checks. They're standard practice — here's exactly what they do:",
  disclosureTabSwitch: "Tab activity: if you switch away from this tab during a question, it's logged and shared with the hiring team. Stay on this page while recording.",
  disclosureFullScreen: "Full screen mode: the interview runs in full screen. If you exit it, you'll be prompted to return before you can continue.",
  disclosureRightClick: "Right-click and shortcuts: copy, paste, and right-click are disabled during written answers to keep responses genuinely your own.",
  disclosureAcknowledge: 'I understand, begin',
  disclosureContinue: 'Continue',

  tabSwitchTitle: 'Please stay on this tab',
  tabSwitchBody: 'Switching tabs during the interview is recorded and shared with the hiring team. Please stay on this tab to continue.',
  tabSwitchContinue: 'Continue interview',

  fullscreenTitle: 'Return to full screen',
  fullscreenBody: 'This interview needs to run in full screen. Please return to full screen to continue.',
  fullscreenReturn: 'Return to full screen',

  // ── Error states ──

  errorCameraDisconnected: 'Your camera disconnected during recording. Your partial answer was saved.',
  errorCameraReconnect: 'Reconnect and retake',
  errorPermissionRevoked: 'Microphone or camera permission was revoked. Let\'s check your devices and come back to this question.',
  errorPermissionRecheck: 'Check devices',
  errorNetworkDrop: 'Reconnecting…',
  errorNetworkRestored: 'Connection restored. Your answer will upload automatically.',
  errorSessionExpired: 'Your session timed out',
  errorSessionRestore: 'Restore session',
  errorUnsupportedBrowser: 'Your browser doesn\'t support video recording',
  errorUnsupportedBody: 'This interview needs a browser that supports video recording. Try Chrome, Firefox, Safari, or Edge — or copy the link to open it on another device.',
  errorCopyLink: 'Copy link',
  errorLinkCopied: 'Link copied',
  errorStorageWarning: 'Your device is low on storage. Recording may fail if you continue.',
  errorBrowserBack: 'You can\'t go back to previous questions',
  errorBrowserBackBody: 'Each answer is final once submitted. Please stay on the current question.',
  errorBrowserBackStay: 'Stay on this question',
  errorSecondTab: 'This interview is open in another tab',
  errorSecondTabBody: 'This interview is now open in another tab. You can continue it there.',
  errorSecondTabContinue: 'Continue here',

  // ── Completion ──

  completeEyebrow: (company: string) => `${company.toUpperCase()} · INTERVIEW COMPLETE`,
  completeThankYou: (name: string | null) =>
    name ? `Thank you, ${name}` : 'Thank you',
  completeSubmitted: 'Your responses have been submitted to the hiring team.',
  completeQuestionsAnswered: (n: number) => `${n} questions answered`,
  completeSubmittedDate: (date: string) => `Submitted ${date}`,
  completeNextSteps: 'WHAT HAPPENS NEXT',
  completeStepReview: 'The hiring team will review your responses',
  completeStepEmail: 'You\'ll receive an email about next steps',
  completeStepShared: 'Your responses are shared only with the hiring team',
  completeCloseTab: 'You can close this tab now.',
  completeQuestionsLink: 'Questions about your application?',
  completeRedirectIn: (seconds: number, company: string) =>
    `Taking you to ${company} in ${seconds}…`,
  completeRedirectStay: 'Stay on this page',

  alreadyCompleteEyebrow: (company: string) => `${company.toUpperCase()} · INTERVIEW COMPLETE`,
  alreadyCompleteTitle: 'You\'ve already completed this interview',
  alreadyCompleteBody: (date: string) =>
    `Your responses were received on ${date}. The hiring team will be in touch with next steps.`,

  expiredEyebrow: (company: string) => `${company.toUpperCase()} · INTERVIEW`,
  expiredTitle: 'This interview link has expired',
  expiredBody: 'The deadline for this interview has passed. Please contact the hiring team if you believe this is an error.',
  expiredContact: 'Contact the hiring team',

  invalidEyebrow: (company: string) => `${company.toUpperCase()} · INTERVIEW`,
  invalidTitle: 'We couldn\'t find this interview',
  invalidBody: 'The link may be mistyped or incomplete. Please check your invitation email and try again.',
  invalidContact: 'Contact support',

  // ── Help ──

  helpTitle: 'Help',
  helpCameraMic: 'Camera and microphone',
  helpTroubleshooting: 'Troubleshooting',
  helpReport: 'Report a problem',
  helpDeviceHandoff: 'Continue on your phone',
  helpDeviceHandoffBody: 'Scan this code with your phone camera to continue this interview on a mobile device.',
  helpDeviceHandoffDisabled: 'Hand-off is disabled while recording.',
  helpReportPlaceholder: 'Describe what\'s happening…',
  helpReportSubmit: 'Send report',
  helpReportSent: 'Report sent. The team will look into it.',
} as const;
