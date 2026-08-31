import { Video, Mic, Bot, Phone, MessageCircle, MessageSquareText, type LucideIcon } from 'lucide-react';
import type { InterviewFormat } from '@/lib/validation/job';

export type FormatTone = 'settings' | 'jobs' | 'reports' | 'ai' | 'candidates' | 'interviews';

export type FormatConfig = {
  id: InterviewFormat;
  name: string;
  description: string;
  icon: LucideIcon;
  tone: FormatTone;
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
    name: 'AI Video Interview',
    description: 'Candidates record video responses on their own time.',
    icon: Video,
    tone: 'settings',
    recommended: true,
  },
  {
    id: 'ai_avatar',
    name: 'AI Avatar Interview',
    description: 'A realistic AI avatar conducts a live interview in real time.',
    icon: Bot,
    tone: 'jobs',
    isLive: true,
  },
  {
    id: 'ai_voice',
    name: 'AI Voice Interview',
    description: 'AI interviews candidates through a natural voice conversation.',
    icon: Mic,
    tone: 'reports',
  },
  {
    id: 'ai_phone',
    name: 'AI Phone Screening',
    description: 'AI calls and screens candidates automatically, at scale.',
    icon: Phone,
    tone: 'ai',
    locked: true,
    lockReason: 'AI calls and screens candidates automatically, at scale.',
    lockPlan: 'Growth',
    isLive: true,
  },
  {
    id: 'ai_whatsapp',
    name: 'AI WhatsApp Interview',
    description: 'AI interviews candidates through an interactive WhatsApp conversation.',
    icon: MessageCircle,
    tone: 'candidates',
    locked: true,
    lockReason: 'AI interviews candidates through an interactive WhatsApp conversation.',
    lockPlan: 'Growth',
  },
  {
    id: 'ai_sms',
    name: 'AI SMS Interview',
    description: 'AI screens candidates through automated text conversations.',
    icon: MessageSquareText,
    tone: 'interviews',
    locked: true,
    lockReason: 'AI screens candidates through automated text conversations.',
    lockPlan: 'Growth',
  },
];
