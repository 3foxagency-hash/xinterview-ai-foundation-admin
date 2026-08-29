import { Video, Mic, Type, ListChecks, type LucideIcon } from 'lucide-react';
import type { InterviewFormat } from '@/lib/validation/job';

export type QuestionType = 'video' | 'audio' | 'text' | 'single_choice';

export type QuestionTypeConfig = {
  id: QuestionType;
  label: string;
  icon: LucideIcon;
  /** Tailwind text-* class resolved from a semantic token. */
  colorClass: string;
  /** Tailwind bg-* class for dots and chips. */
  dotClass: string;
};

export const QUESTION_TYPE_CONFIG: Record<QuestionType, QuestionTypeConfig> = {
  video: {
    id: 'video',
    label: 'Video',
    icon: Video,
    colorClass: 'text-primary',
    dotClass: 'bg-primary',
  },
  audio: {
    id: 'audio',
    label: 'Audio',
    icon: Mic,
    colorClass: 'text-info',
    dotClass: 'bg-info',
  },
  text: {
    id: 'text',
    label: 'Text',
    icon: Type,
    colorClass: 'text-success',
    dotClass: 'bg-success',
  },
  single_choice: {
    id: 'single_choice',
    label: 'Single choice',
    icon: ListChecks,
    colorClass: 'text-warning',
    dotClass: 'bg-warning',
  },
};

export const ALL_QUESTION_TYPES: QuestionType[] = ['video', 'audio', 'text', 'single_choice'];

/** Which question types can be added for a given interview format. */
export function getAvailableQuestionTypes(format: InterviewFormat): QuestionType[] {
  switch (format) {
    case 'ai_video':
      return ['video', 'text', 'single_choice'];
    case 'ai_voice':
      return ['audio', 'text', 'single_choice'];
    case 'text':
      return ['text', 'single_choice'];
    default:
      return ['text', 'single_choice'];
  }
}

export const THINKING_TIME_OPTIONS = [
  { value: 'none', label: 'No thinking time' },
  { value: '15s', label: '15 seconds' },
  { value: '30s', label: '30 seconds' },
  { value: '60s', label: '60 seconds' },
  { value: '2min', label: '2 minutes' },
];

export const ANSWER_TIME_OPTIONS = [
  { value: '30s', label: '30 seconds' },
  { value: '1min', label: '1 minute' },
  { value: '2min', label: '2 minutes' },
  { value: '3min', label: '3 minutes' },
  { value: '5min', label: '5 minutes' },
];

export const RETAKES_OPTIONS = [
  { value: 0, label: 'No retakes' },
  { value: 1, label: '1 retry' },
  { value: 2, label: '2 retries' },
  { value: 3, label: '3 retries' },
];

/** Parse a thinking/answer time string into seconds. */
export function parseTimeToSeconds(value: string | undefined): number {
  if (!value || value === 'none') return 0;
  if (value.endsWith('min')) return parseInt(value, 10) * 60;
  if (value.endsWith('s')) return parseInt(value, 10);
  return 0;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return '0 min';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds}s`;
}
