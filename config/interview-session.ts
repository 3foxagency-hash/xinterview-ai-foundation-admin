/* ═══════════════════════════════════════════════════════════
   Mock session configuration for the practice, interview, and
   completion screens. All behaviour is data-driven from this
   object — nothing about question lifecycle is hardcoded.

   `company` is derived from interview.mock.ts's InterviewConfig
   rather than duplicated here — this is the same candidate
   session as the landing/setup pages, so brand color, theme
   mode, etc. must stay in sync everywhere. Change them in one
   place (interview.mock.ts).
   ═══════════════════════════════════════════════════════════ */

import { interviewConfig } from '@/config/interview.mock';

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
  /** Shown under the "Instructions" heading on the completion screen, in
   *  place of the old fixed "what happens next" bullet list. */
  instructions: string | null;
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
  /** Live conversational interview (avatar + voice routes). LiveKit
   *  will supply the real tracks; these are the presentation values. */
  live: {
    /** Video shown in the AI interviewer's avatar tile. Stands in for
     *  the LiveKit avatar track until that is wired up; it loops
     *  silently, so it reads as a talking head without pretending to
     *  be a live participant. */
    avatarVideoUrl: string | null;
    interviewerName: string;
    /** Total expected duration, for the top progress line. */
    estimatedMinutes: number;
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
        descriptionHtml:
          '<p>This is a quick warm-up question to help you get comfortable with the format before the real interview begins.</p>',
        thinkingSeconds: 10,
        answerSeconds: 60,
        retakesAllowed: 3,
      },
      {
        id: 'p2',
        type: 'audio',
        text: 'Describe how you would explain a complex technical decision to a non-technical stakeholder.',
        descriptionHtml:
          '<p>We want to understand how you simplify complexity without losing accuracy or confidence.</p>' +
          '<p>In your answer, consider a real scenario and walk us through your approach.</p>' +
          '<ul><li>How did you determine what mattered most to the stakeholder?</li><li>What approach did you take to explain it clearly?</li><li>What was the outcome of your communication?</li></ul>',
        thinkingSeconds: 10,
        answerSeconds: 90,
        retakesAllowed: 3,
      },
      {
        id: 'p3',
        type: 'choice',
        text: "Which approach would you take first when a feature's adoption drops sharply after release?",
        descriptionHtml:
          '<p>We want to understand how you think through product and user challenges.</p>' +
          '<p>Choose the option that best reflects your first move in this situation.</p>',
        thinkingSeconds: 0,
        answerSeconds: null,
        retakesAllowed: 1,
        options: [
          { id: 'a', label: 'Analyze usage analytics to identify where users are dropping off in the flow.' },
          { id: 'b', label: 'Talk to users to understand what changed in their experience or expectations.' },
          { id: 'c', label: 'Review recent product and design changes to pinpoint any potential regressions.' },
          { id: 'd', label: 'Launch a marketing campaign to re-engage users and drive adoption back up.' },
        ],
      },
      {
        id: 'p4',
        type: 'text',
        text: 'How would you approach the first ninety days in this role?',
        descriptionHtml:
          "<p>We're looking for how you'd prioritize learning, building trust, and delivering early impact.</p>" +
          '<p>Consider how you would assess the landscape and set yourself up for long-term success.</p>',
        thinkingSeconds: 0,
        answerSeconds: null,
        retakesAllowed: 1,
        maxCharacters: 1500,
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
      type: 'audio',
      text: 'Describe a time you received critical feedback. How did you respond?',
      thinkingSeconds: 20,
      answerSeconds: 90,
      retakesAllowed: 2,
    },
    {
      id: 'q3',
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
  ],

  integrity: {
    tabSwitchDetection: true,
    requireFullScreen: true,
    disableRightClick: true,
  },

  completion: {
    customMessage:
      'We appreciate the time you took to share your story with us. Our team will review your responses carefully and reach out within the next few days.',
    instructions:
      'The hiring team will review your responses and follow up by email within the next few business days. No further action is needed from you right now.',
    redirectUrl: null,
    redirectDelaySeconds: 5,
  },

  candidate: {
    firstName: 'Jane',
  },

  live: {
    avatarVideoUrl: '/videos/intro-sample.mp4',
    interviewerName: 'AI Interviewer',
    estimatedMinutes: 18,
  },

  company: {
    name: interviewConfig.company.name,
    brandColor: interviewConfig.company.brandColor,
    themeMode: interviewConfig.company.themeMode,
    allowCandidateToggle: interviewConfig.company.allowCandidateToggle,
  },
};
