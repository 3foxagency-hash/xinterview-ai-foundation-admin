/* ═══════════════════════════════════════════════════════════
   Mock session configuration for the practice, interview, and
   completion screens. All behaviour is data-driven from this
   object — nothing about question lifecycle is hardcoded.
   ═══════════════════════════════════════════════════════════ */

export type QuestionType = 'video' | 'audio' | 'text' | 'choice';

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface SessionQuestion {
  id: string;
  type: QuestionType;
  text: string;
  descriptionHtml?: string;
  thinkingSeconds: number;
  answerSeconds: number | null;
  retakesAllowed: number;
  maxCharacters?: number;
  blockPaste?: boolean;
  options?: ChoiceOption[];
  multiSelect?: boolean;
}

export interface IntegrityConfig {
  tabSwitchDetection: boolean;
  requireFullScreen: boolean;
  disableRightClick: boolean;
}

export interface CompletionConfig {
  customMessage: string | null;
  redirectUrl: string | null;
  redirectDelaySeconds: number;
}

export interface InterviewSession {
  practice: {
    enabled: boolean;
    questions: SessionQuestion[];
  };
  questions: SessionQuestion[];
  integrity: IntegrityConfig;
  completion: CompletionConfig;
  candidate: {
    firstName: string | null;
  };
  company: {
    name: string;
    brandColor: string;
    themeMode: 'light' | 'dark' | 'system';
    allowCandidateToggle: boolean;
  };
}

export const interviewSession: InterviewSession = {
  practice: {
    enabled: true,
    questions: [
      {
        id: 'p1',
        type: 'video',
        text: 'Tell us your name and what role you are applying for.',
        thinkingSeconds: 10,
        answerSeconds: 60,
        retakesAllowed: 3,
      },
      {
        id: 'p2',
        type: 'video',
        text: 'What are you most excited about in this role?',
        thinkingSeconds: 15,
        answerSeconds: 60,
        retakesAllowed: 3,
      },
    ],
  },

  questions: [
    {
      id: 'q1',
      type: 'video',
      text: 'Tell us about a time you had to redesign something that was already shipped.',
      descriptionHtml:
        '<p>Think of a project where the initial solution did not work as well as expected. Walk us through what you changed and why.</p>',
      thinkingSeconds: 30,
      answerSeconds: 90,
      retakesAllowed: 3,
    },
    {
      id: 'q2',
      type: 'video',
      text: 'Walk us through your portfolio and highlight the project you are most proud of.',
      thinkingSeconds: 30,
      answerSeconds: 120,
      retakesAllowed: 2,
    },
    {
      id: 'q3',
      type: 'audio',
      text: 'Describe a time you received critical feedback. How did you respond?',
      thinkingSeconds: 20,
      answerSeconds: 90,
      retakesAllowed: 2,
    },
    {
      id: 'q4',
      type: 'text',
      text: 'Why are you interested in joining Northwind specifically?',
      descriptionHtml:
        '<p>We want to understand what draws you to our company. Mention something specific — a product, a value, or a team member — rather than a generic answer.</p>',
      thinkingSeconds: 0,
      answerSeconds: null,
      retakesAllowed: 1,
      maxCharacters: 1000,
      blockPaste: true,
    },
    {
      id: 'q5',
      type: 'choice',
      text: 'Which of these design tools do you use regularly?',
      thinkingSeconds: 0,
      answerSeconds: null,
      retakesAllowed: 1,
      multiSelect: true,
      options: [
        { id: 'a', label: 'Figma' },
        { id: 'b', label: 'Sketch' },
        { id: 'c', label: 'Adobe XD' },
        { id: 'd', label: 'Framer' },
        { id: 'e', label: 'Penpot' },
      ],
    },
    {
      id: 'q6',
      type: 'choice',
      text: 'How many years of product design experience do you have?',
      thinkingSeconds: 0,
      answerSeconds: null,
      retakesAllowed: 1,
      options: [
        { id: 'a', label: 'Less than 3 years' },
        { id: 'b', label: '3 to 5 years' },
        { id: 'c', label: '6 to 9 years' },
        { id: 'd', label: '10 or more years' },
      ],
    },
  ],

  integrity: {
    tabSwitchDetection: true,
    requireFullScreen: true,
    disableRightClick: true,
  },

  completion: {
    customMessage:
      'We appreciate the time you took to share your story with us. Our team will review your responses carefully and reach out within the next few days.',
    redirectUrl: null,
    redirectDelaySeconds: 5,
  },

  candidate: {
    firstName: 'Jane',
  },

  company: {
    name: 'Northwind',
    brandColor: '#2F5D50',
    themeMode: 'system',
    allowCandidateToggle: true,
  },
};
