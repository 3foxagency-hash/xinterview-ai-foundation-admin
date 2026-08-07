import type { LucideIcon } from 'lucide-react';
import { Briefcase, HelpCircle, Users, SlidersHorizontal, Mail } from 'lucide-react';

export type WizardStepId = 'setup' | 'questions' | 'teams' | 'customisation' | 'invite';

export type WizardStep = {
  id: WizardStepId;
  label: string;
  description: string;
  icon: LucideIcon;
  number: number;
  /** Route pattern — uses :id for the job id, or 'new' before creation */
  href: (jobId: string | null) => string;
};

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'setup',
    label: 'Job details',
    description: 'Add basic information about the role',
    icon: Briefcase,
    number: 1,
    href: () => '/jobs/new/setup',
  },
  {
    id: 'questions',
    label: 'Questions',
    description: 'Create and customise interview questions',
    icon: HelpCircle,
    number: 2,
    href: (jobId) => `/jobs/${jobId}/edit/questions`,
  },
  {
    id: 'teams',
    label: 'Team',
    description: 'Invite your team members',
    icon: Users,
    number: 3,
    href: (jobId) => `/jobs/${jobId}/edit/teams`,
  },
  {
    id: 'customisation',
    label: 'Customisation',
    description: 'Branding, emails and experience',
    icon: SlidersHorizontal,
    number: 4,
    href: (jobId) => `/jobs/${jobId}/edit/customisation`,
  },
  {
    id: 'invite',
    label: 'Invite candidates',
    description: 'Share your interview with candidates',
    icon: Mail,
    number: 5,
    href: (jobId) => `/jobs/${jobId}/edit/invite`,
  },
];

export function getStepByNumber(num: number): WizardStep | undefined {
  return WIZARD_STEPS.find((s) => s.number === num);
}

export function getStepById(id: WizardStepId): WizardStep | undefined {
  return WIZARD_STEPS.find((s) => s.id === id);
}

export function getStepNumberFromPath(pathname: string): number {
  if (pathname.includes('/setup')) return 1;
  if (pathname.includes('/questions')) return 2;
  if (pathname.includes('/teams')) return 3;
  if (pathname.includes('/customisation')) return 4;
  if (pathname.includes('/invite')) return 5;
  return 1;
}
