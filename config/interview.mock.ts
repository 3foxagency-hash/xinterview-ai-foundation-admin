/* ═══════════════════════════════════════════════════════════
   Mock configuration for the candidate interview landing page.
   The entire page renders from this object. Change values here
   to demonstrate every layout scenario and brand variant.
   ═══════════════════════════════════════════════════════════ */

export type ThemeMode = "light" | "dark" | "system";
export type InterviewState =
  | "active"
  | "expired"
  | "invalid"
  | "completed"
  | "no_questions";

export interface InterviewField {
  enabled: boolean;
  required: boolean;
}

export interface InterviewConfig {
  showIntroVideo: boolean;
  showJobDescription: boolean;

  company: {
    name: string;
    logoUrl: string | null;
    logoDarkUrl: string | null;
    brandColor: string;
    themeMode: ThemeMode;
    allowCandidateToggle: boolean;
  };

  job: {
    title: string;
    descriptionHtml: string | null;
    questionCount: number;
    estimatedMinutes: number;
  };

  introVideo: {
    url: string;
    durationLabel: string;
    presenterName: string;
    presenterTitle: string;
  } | null;

  fields: {
    firstName: InterviewField;
    lastName: InterviewField;
    email: InterviewField;
    phone: InterviewField;
    linkedin: InterviewField;
    portfolio: InterviewField;
    resume: InterviewField;
  };

  prefilled: Partial<
    Record<
      "firstName" | "lastName" | "email" | "phone" | "linkedin" | "portfolio",
      string
    >
  >;

  consent: {
    platformTermsUrl: string;
    platformPrivacyUrl: string;
    employerTermsUrl: string | null;
    employerPrivacyUrl: string | null;
  };

  disclosures: {
    aiEvaluation: boolean;
    monitoring: boolean;
  };

  state: InterviewState;

  locale: {
    current: string;
    available: string[];
  };
}

export const interviewConfig: InterviewConfig = {
  showIntroVideo: true,
  showJobDescription: true,

  company: {
    name: "Northwind",
    logoUrl: null,
    logoDarkUrl: null,
    brandColor: "#6100FC",
    themeMode: "system",
    allowCandidateToggle: true
  },

  job: {
    title: "Senior Product Designer – Consumer Experience",
    descriptionHtml:
      "<p>At Northwind, we design digital experiences that help millions of people move through their day with less friction and more delight. Our design team is small, senior, and embedded in every product decision.</p>" +
      "<h4>What you will do</h4>" +
      "<ul><li>Lead end-to-end design for features used by over 2 million customers</li><li>Partner closely with engineering and product to ship work that is both considered and practical</li><li>Conduct research with real customers, synthesize findings, and translate them into design decisions</li><li>Contribute to our growing design system and visual language</li></ul>" +
      "<h4>What we are looking for</h4>" +
      "<ul><li>5+ years of product design experience, ideally in consumer-facing software</li><li>A portfolio that demonstrates strong visual craft, systems thinking, and care for the details</li><li>Comfort with ambiguity and the ability to move from rough concept to polished delivery</li><li>Excellent communication skills and a collaborative, low-ego approach</li></ul>" +
      "<h4>What we offer</h4>" +
      "<ul><li>Competitive salary and equity</li><li>Flexible working hours and remote-friendly culture</li><li>Budget for conferences, courses, and tools</li><li>A team that genuinely cares about craft</li></ul>",
    questionCount: 4,
    estimatedMinutes: 12
  },

  introVideo: {
    // Drop a real 16:9 (or wider) clip at public/videos/intro-sample.mp4 —
    // the player crops/covers to fill the frame regardless of native size.
    url: "/videos/intro-sample.mp4",
    durationLabel: "1:24",
    presenterName: "Sarah Chen",
    presenterTitle: "Design Director"
  },

  fields: {
    firstName: { enabled: true, required: true },
    lastName: { enabled: true, required: true },
    email: { enabled: true, required: true },
    phone: { enabled: true, required: false },
    linkedin: { enabled: true, required: false },
    portfolio: { enabled: true, required: false },
    resume: { enabled: true, required: true }
  },

  prefilled: {
    firstName: "Jane",
    email: "jane.doe@gmail.com"
  },

  consent: {
    platformTermsUrl: "https://xinterview.com/terms",
    platformPrivacyUrl: "https://xinterview.com/privacy",
    employerTermsUrl: "https://northwind.com/terms",
    employerPrivacyUrl: "https://northwind.com/privacy"
  },

  disclosures: {
    aiEvaluation: true,
    monitoring: false
  },

  state: "active",

  locale: { current: "EN", available: ["EN", "NL", "DE", "FR"] }
};
