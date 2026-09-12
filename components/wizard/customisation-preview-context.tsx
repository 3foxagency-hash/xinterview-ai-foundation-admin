'use client';

import * as React from 'react';
import type { InterviewConfig, ThemeMode } from '@/config/interview.mock';
import type { InterviewSession } from '@/config/interview-session';
import type {
  BrandingInput,
  WelcomePageInput,
  FormSettingsInput,
  InterviewExperienceInput,
  ThankYouPageInput,
  SocialPreviewInput,
  NotificationsInput,
  AiEvaluationInput,
} from '@/lib/validation/job';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';
import { interviewSession as defaultSession } from '@/config/interview-session';
import { track } from '@/lib/utils/analytics';

export type PreviewScreen = 'landing' | 'form' | 'thank-you';
export type PreviewDevice = 'desktop' | 'mobile';
export type PreviewTheme = 'light' | 'dark';

export type SectionState = 'untouched' | 'complete' | 'error';

export interface CustomisationPreviewState {
  branding: BrandingInput | null;
  welcome: WelcomePageInput | null;
  form: FormSettingsInput | null;
  experience: InterviewExperienceInput | null;
  evaluation: AiEvaluationInput | null;
  notifications: NotificationsInput | null;
  thankYou: ThankYouPageInput | null;
  social: SocialPreviewInput | null;
}

export interface CustomisationPreviewContextValue {
  state: CustomisationPreviewState;
  setSectionData: <K extends keyof CustomisationPreviewState>(
    key: K,
    data: NonNullable<CustomisationPreviewState[K]>
  ) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  previewScreen: PreviewScreen;
  setPreviewScreen: (screen: PreviewScreen) => void;
  previewDevice: PreviewDevice;
  setPreviewDevice: (device: PreviewDevice) => void;
  previewTheme: PreviewTheme;
  setPreviewTheme: (theme: PreviewTheme) => void;
  sectionStates: Record<string, SectionState>;
  setSectionState: (section: string, state: SectionState) => void;
  blockingSections: string[];
  setBlockingSections: (sections: string[]) => void;
  jobTitle: string;
}

const Ctx = React.createContext<CustomisationPreviewContextValue | null>(null);

export function useCustomisationPreview(): CustomisationPreviewContextValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useCustomisationPreview must be used within CustomisationPreviewProvider');
  return ctx;
}

export function useOptionalCustomisationPreview(): CustomisationPreviewContextValue | null {
  return React.useContext(Ctx);
}

const SECTION_TO_SCREEN: Record<string, PreviewScreen> = {
  branding: 'landing',
  welcome: 'landing',
  // The apply form ("Tell us who you are") lives on the landing page
  // itself in the real candidate flow — the "Start form" preview screen
  // is actually the pre-interview integrity disclosure, unrelated to what
  // candidates fill in here.
  form: 'landing',
  experience: 'form',
  evaluation: 'landing',
  notifications: 'landing',
  'thank-you': 'thank-you',
  social: 'landing',
};

export function sectionToPreviewScreen(section: string): PreviewScreen {
  return SECTION_TO_SCREEN[section] ?? 'landing';
}

export function CustomisationPreviewProvider({
  children,
  jobTitle = 'Senior Product Designer',
}: {
  children: React.ReactNode;
  jobTitle?: string;
}) {
  const [state, setState] = React.useState<CustomisationPreviewState>({
    branding: null,
    welcome: null,
    form: null,
    experience: null,
    evaluation: null,
    notifications: null,
    thankYou: null,
    social: null,
  });
  const [activeSection, setActiveSectionInternal] = React.useState('branding');
  const [previewScreen, setPreviewScreen] = React.useState<PreviewScreen>('landing');
  const [previewDevice, setPreviewDeviceInternal] = React.useState<PreviewDevice>('desktop');
  const [previewTheme, setPreviewThemeInternal] = React.useState<PreviewTheme>('light');
  const [sectionStates, setSectionStates] = React.useState<Record<string, SectionState>>({});
  const [blockingSections, setBlockingSections] = React.useState<string[]>([]);

  const setSectionData = React.useCallback(
    <K extends keyof CustomisationPreviewState>(
      key: K,
      data: NonNullable<CustomisationPreviewState[K]>
    ) => {
      // Bail out when this section's data hasn't actually changed. Without
      // this, every render of the memoized context value (itself keyed on
      // `state`) hands consumers' usePreviewSync effects a new `ctx`
      // reference, their effect deps see that as a change, they call
      // setSectionData again with the same data, state gets a new object
      // identity regardless, and the cycle never settles — an infinite
      // "Maximum update depth exceeded" loop.
      setState((prev) => (prev[key] === data ? prev : { ...prev, [key]: data }));
    },
    []
  );

  const setSectionState = React.useCallback((section: string, s: SectionState) => {
    setSectionStates((prev) => ({ ...prev, [section]: s }));
  }, []);

  const setActiveSection = React.useCallback((section: string) => {
    setActiveSectionInternal(section);
    const screen = sectionToPreviewScreen(section);
    setPreviewScreen(screen);
    track('customization_section_viewed', { section });
  }, []);

  const setPreviewDevice = React.useCallback((device: PreviewDevice) => {
    setPreviewDeviceInternal(device);
    track('preview_device_changed', { device });
  }, []);

  const setPreviewTheme = React.useCallback((theme: PreviewTheme) => {
    setPreviewThemeInternal(theme);
    track('preview_theme_changed', { theme });
  }, []);

  const value = React.useMemo<CustomisationPreviewContextValue>(
    () => ({
      state,
      setSectionData,
      activeSection,
      setActiveSection,
      previewScreen,
      setPreviewScreen,
      previewDevice,
      setPreviewDevice,
      previewTheme,
      setPreviewTheme,
      sectionStates,
      setSectionState,
      blockingSections,
      setBlockingSections,
      jobTitle,
    }),
    [
      state,
      setSectionData,
      activeSection,
      setActiveSection,
      previewScreen,
      previewDevice,
      setPreviewDevice,
      previewTheme,
      setPreviewTheme,
      sectionStates,
      setSectionState,
      blockingSections,
      jobTitle,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function mapFieldRequirement(req: string): { enabled: boolean; required: boolean } {
  if (req === 'off') return { enabled: false, required: false };
  if (req === 'required') return { enabled: true, required: true };
  return { enabled: true, required: false };
}

export function buildPreviewConfig(
  state: CustomisationPreviewState,
  jobTitle: string
): InterviewConfig {
  const branding = state.branding;
  const welcome = state.welcome;
  const form = state.form;
  const experience = state.experience;

  const themeMode: ThemeMode = branding
    ? branding.theme === 'auto'
      ? 'system'
      : branding.theme
    : 'system';

  const config: InterviewConfig = {
    ...defaultConfig,
    company: {
      name: branding?.companyTitle || defaultConfig.company.name,
      logoUrl: branding?.logoUrl || null,
      logoDarkUrl: null,
      brandColor: branding?.primaryColour || defaultConfig.company.brandColor,
      themeMode,
      allowCandidateToggle: true,
    },
    job: {
      ...defaultConfig.job,
      // The welcome page's "Headline" field doubles as the job title shown
      // on the landing page preview — it's editable text closest to what a
      // candidate reads as the role name, so a change there should be
      // reflected immediately rather than needing a separate title field.
      title: welcome?.headline || jobTitle || defaultConfig.job.title,
      estimatedMinutes: welcome?.estimatedTime ?? defaultConfig.job.estimatedMinutes,
    },
    showIntroVideo: welcome?.introVideoEnabled ?? defaultConfig.showIntroVideo,
    showJobDescription: defaultConfig.showJobDescription,
    showLogo: !!branding?.logoUrl || defaultConfig.showLogo,
    // Mirrors showIntroVideo's own fallback above: while `welcome` hasn't
    // loaded yet (null), both must default to the same "video showing" as
    // defaultConfig — otherwise showIntroVideo defaults true but introVideo
    // defaults null, and resolveLayoutMode requires both to show a video.
    introVideo: (welcome?.introVideoEnabled ?? defaultConfig.showIntroVideo)
      ? {
          url: welcome?.introVideoUrl || defaultConfig.introVideo?.url || '',
          durationLabel: defaultConfig.introVideo?.durationLabel ?? '1:24',
          presenterName: defaultConfig.introVideo?.presenterName ?? '',
          presenterTitle: defaultConfig.introVideo?.presenterTitle ?? '',
        }
      : null,
    fields: form
      ? {
          firstName: mapFieldRequirement(form.firstName),
          lastName: mapFieldRequirement(form.lastName),
          email: mapFieldRequirement(form.email),
          phone: mapFieldRequirement(form.phone),
          linkedin: mapFieldRequirement(form.linkedin),
          portfolio: mapFieldRequirement(form.portfolio),
          resume: mapFieldRequirement(form.resume),
        }
      : defaultConfig.fields,
    consent: form
      ? {
          platformTermsUrl: defaultConfig.consent.platformTermsUrl,
          platformPrivacyUrl: defaultConfig.consent.platformPrivacyUrl,
          employerTermsUrl: form.termsEnabled ? form.termsUrl || null : null,
          employerPrivacyUrl: form.privacyPolicyEnabled ? form.privacyPolicyUrl || null : null,
        }
      : defaultConfig.consent,
    disclosures: {
      aiEvaluation: state.evaluation?.automaticEvaluation ?? defaultConfig.disclosures.aiEvaluation,
      monitoring:
        experience?.tabSwitchDetection ||
        experience?.disableCopyPaste ||
        experience?.enforceFullScreen ||
        false,
    },
    state: 'active',
  };

  return config;
}

export function buildPreviewSession(
  state: CustomisationPreviewState,
  jobTitle: string
): InterviewSession {
  const branding = state.branding;
  const experience = state.experience;
  const thankYou = state.thankYou;

  const themeMode: 'light' | 'dark' | 'system' = branding
    ? branding.theme === 'auto'
      ? 'system'
      : branding.theme
    : 'system';

  return {
    ...defaultSession,
    integrity: {
      tabSwitchDetection: experience?.tabSwitchDetection ?? false,
      requireFullScreen: experience?.enforceFullScreen ?? false,
      disableRightClick: experience?.disableCopyPaste ?? false,
    },
    completion: {
      // The completion screen has one editable message slot above
      // "Instructions" — the "Title" field drives it (not "Completion
      // message"), since that's the sentence candidates actually read
      // there ("Thank you for completing your interview...").
      customMessage: thankYou?.title || defaultSession.completion.customMessage,
      // "Instructions" replaces the old fixed "what happens next" bullet
      // list — its paragraph comes from the "Completion message" field.
      instructions: thankYou?.completionMessage || defaultSession.completion.instructions,
      redirectUrl: thankYou?.redirectEnabled ? thankYou.redirectUrl || null : null,
      redirectDelaySeconds: thankYou?.redirectDelay ?? 5,
    },
    company: {
      name: branding?.companyTitle || defaultSession.company.name,
      brandColor: branding?.primaryColour || defaultSession.company.brandColor,
      themeMode,
      allowCandidateToggle: true,
    },
  };
}
