import { Video, Mic, Type, Bot, Phone, type LucideIcon } from 'lucide-react';
import type { InterviewFormat } from '@/lib/validation/job';

export type FormatConfig = {
  id: InterviewFormat;
  name: string;
  description: string;
  icon: LucideIcon;
  benefits: string[];
  recommended?: boolean;
  locked?: boolean;
  lockReason?: string;
  lockPlan?: string;
  setupRequired?: { label: string; href: string };
  isLive?: boolean;
};

export const INTERVIEW_FORMAT_CONFIG: FormatConfig[] = [
  {
    id: 'ai_video',
    name: 'Video interview',
    description: 'Candidates record their answers on video.',
    icon: Video,
    benefits: [
      'Face-to-face experience',
      'See expressions and body language',
      'Best for behavioural and cultural fit',
    ],
    recommended: true,
  },
  {
    id: 'ai_voice',
    name: 'Audio interview',
    description: 'Candidates record their answers in audio.',
    icon: Mic,
    benefits: [
      'Voice-focused responses',
      'Easier and faster for candidates',
      'Great for initial screening',
    ],
  },
  {
    id: 'text',
    name: 'Text interview',
    description: 'Candidates type their answers.',
    icon: Type,
    benefits: [
      'No recording needed',
      'Accessible and convenient',
      'Structured written responses',
    ],
  },
  {
    id: 'ai_avatar',
    name: 'AI avatar interview',
    description: 'A realistic AI avatar conducts a live interview.',
    icon: Bot,
    benefits: [
      'Real-time conversation',
      'Natural back-and-forth dialogue',
      'Adaptive follow-up questions',
    ],
    locked: true,
    lockReason: 'Available on the Growth plan.',
    lockPlan: 'Growth',
    isLive: true,
  },
  {
    id: 'ai_phone',
    name: 'AI phone screening',
    description: 'AI calls and screens candidates at scale.',
    icon: Phone,
    benefits: [
      'Automated phone interviews',
      'Reaches candidates anywhere',
      'High-volume screening',
    ],
    setupRequired: { label: 'Connect a phone number', href: '/settings/integrations' },
    isLive: true,
  },
];
