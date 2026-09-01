import { MdVideocam, MdPerson, MdMic, MdPhone, MdSms } from 'react-icons/md';
import { SiWhatsapp } from 'react-icons/si';
import type { IconType } from 'react-icons';
import type { InterviewFormat } from '@/lib/validation/job';

export type FormatTone = 'settings' | 'jobs' | 'reports' | 'ai' | 'candidates' | 'interviews';

/** Solid/filled icon set (Material Design + Simple Icons for brand logos). */
export type FormatIcon = IconType;

export type FormatConfig = {
  id: InterviewFormat;
  name: string;
  description: string;
  icon: FormatIcon;
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
    icon: MdVideocam,
    tone: 'settings',
    recommended: true,
  },
  {
    id: 'ai_avatar',
    name: 'AI Avatar Interview',
    description: 'A realistic AI avatar conducts a live interview in real time.',
    icon: MdPerson,
    tone: 'jobs',
    isLive: true,
  },
  {
    id: 'ai_voice',
    name: 'AI Voice Interview',
    description: 'AI interviews candidates through a natural voice conversation.',
    icon: MdMic,
    tone: 'reports',
  },
  {
    id: 'ai_phone',
    name: 'AI Phone Screening',
    description: 'AI calls and screens candidates automatically, at scale.',
    icon: MdPhone,
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
    icon: SiWhatsapp,
    tone: 'candidates',
    locked: true,
    lockReason: 'AI interviews candidates through an interactive WhatsApp conversation.',
    lockPlan: 'Growth',
  },
  {
    id: 'ai_sms',
    name: 'AI SMS Interview',
    description: 'AI screens candidates through automated text conversations.',
    icon: MdSms,
    tone: 'interviews',
    locked: true,
    lockReason: 'AI screens candidates through automated text conversations.',
    lockPlan: 'Growth',
  },
];
