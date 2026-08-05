'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Bot,
  Mic,
  Phone,
  Lock,
  Check,
  Sparkles,
  Briefcase,
  Clock,
  Globe,
  ChevronDown,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobSetupSchema, type JobSetupInput, type InterviewFormat } from '@/lib/validation/job';
import { useWizard } from '@/components/wizard/wizard-context';
import { StepFooter } from '@/components/wizard/step-footer';
import { HeroBanner } from '@/components/wizard/hero-banner';
import { SectionCard } from '@/components/wizard/section-card';
import { WizardInput } from '@/components/wizard/wizard-input';
import { WizardCombobox } from '@/components/wizard/wizard-combobox';
import { RichTextEditor } from '@/components/wizard/rich-text-editor';
import { createJob, generateJobDescription } from '@/lib/api/jobs';
import { track } from '@/lib/utils/analytics';
import { timezones, getDefaultTimezone } from '@/lib/constants/timezones';
import { availableLanguages, DEFAULT_LANGUAGE } from '@/lib/constants/languages';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format as formatDate, isPast, isToday } from 'date-fns';

type FormatCard = {
  id: InterviewFormat;
  name: string;
  description: string;
  icon: typeof Video;
  locked: boolean;
  lockReason?: string;
  lockLink?: { label: string; href: string };
  recommended?: boolean;
};

const FORMAT_CARDS: FormatCard[] = [
  {
    id: 'ai_video',
    name: 'AI Video Interview',
    description: 'Candidates record video responses on their own time.',
    icon: Video,
    locked: false,
    recommended: true,
  },
  {
    id: 'ai_avatar',
    name: 'AI Avatar Interview',
    description: 'A realistic AI avatar conducts a live interview in real time.',
    icon: Bot,
    locked: true,
    lockReason: 'Available on the Growth plan.',
    lockLink: { label: 'Upgrade in Billing', href: '/settings/billing' },
  },
  {
    id: 'ai_voice',
    name: 'AI Voice Interview',
    description: 'AI interviews candidates through natural voice conversation.',
    icon: Mic,
    locked: true,
    lockReason: 'Available on the Growth plan.',
    lockLink: { label: 'Upgrade in Billing', href: '/settings/billing' },
  },
  {
    id: 'ai_phone',
    name: 'AI Phone Screening',
    description: 'AI calls and screens candidates automatically, at scale.',
    icon: Phone,
    locked: true,
    lockReason: 'Connect a phone system first.',
    lockLink: { label: 'Go to Integrations', href: '/settings/integrations' },
  },
];

const TIMEZONE_OPTIONS = timezones.map((tz) => ({ value: tz.key, label: tz.label }));

const LANGUAGE_OPTIONS = availableLanguages.map((l) => ({ value: l.lang, label: l.text }));

function FormatCardView({
  card,
  selected,
  onSelect,
}: {
  card: FormatCard;
  selected: boolean;
  onSelect: (id: InterviewFormat) => void;
}) {
  const Icon = card.icon;
  const [showTooltip, setShowTooltip] = React.useState(false);

  if (card.locked) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTooltip((v) => !v)}
          aria-label={`${card.name} — locked`}
          className="flex w-full items-start gap-4 rounded-lg border border-border bg-surface p-5 text-left opacity-60 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card-hover">
            <Icon size={20} strokeWidth={1.5} className="text-muted" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-h3 text-heading">{card.name}</h3>
              <Lock size={14} className="text-muted" />
            </div>
            <p className="mt-1 text-body-sm text-muted">{card.description}</p>
            <span className="mt-2 inline-flex items-center rounded-full border border-border bg-muted-bg px-2 py-0.5 text-caption text-muted">
              Available on Growth
            </span>
          </div>
        </button>
        {showTooltip && (
          <div
            role="tooltip"
            className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-surface p-4 shadow-lg"
          >
            <p className="text-body-sm text-heading">{card.lockReason}</p>
            {card.lockLink && (
              <a
                href={card.lockLink.href}
                className="mt-2 inline-block text-body-sm font-medium text-primary hover:underline"
              >
                {card.lockLink.label} →
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              className="mt-3 block text-caption text-muted hover:text-heading"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(card.id)}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-4 rounded-lg border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'border-primary bg-active-menu-bg shadow-sm'
          : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors',
          selected ? 'border-primary bg-primary/10' : 'border-border bg-card-hover'
        )}
      >
        <Icon
          size={20}
          strokeWidth={1.5}
          className={selected ? 'text-primary' : 'text-bodyText'}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-h3 text-heading">{card.name}</h3>
          {card.recommended && (
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-active-menu-bg px-2 py-0.5 text-caption font-medium text-primary">
              Recommended
            </span>
          )}
        </div>
        <p className="mt-1 text-body-sm text-muted">{card.description}</p>
      </div>
      <div
        className={cn(
          'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-primary bg-primary' : 'border-border-strong'
        )}
        aria-hidden
      >
        {selected && <Check size={12} className="text-primary-foreground" strokeWidth={3} />}
      </div>
    </button>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { setJob, markDirty, clearDirty } = useWizard();
  const [subStep, setSubStep] = React.useState<'format' | 'details'>('format');
  const [format, setFormat] = React.useState<InterviewFormat>('ai_video');
  const [submitting, setSubmitting] = React.useState(false);
  const [generatingDesc, setGeneratingDesc] = React.useState(false);
  const [deadlineDate, setDeadlineDate] = React.useState<Date | undefined>();
  const [deadlineOpen, setDeadlineOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobSetupInput>({
    resolver: zodResolver(jobSetupSchema),
    defaultValues: {
      format: 'ai_video',
      title: '',
      timezone: getDefaultTimezone(),
      applicationDeadline: '',
      interviewLanguage: DEFAULT_LANGUAGE,
      description: '',
    },
  });

  React.useEffect(() => {
    setValue('format', format);
  }, [format, setValue]);

  const titleValue = watch('title');
  const languageValue = watch('interviewLanguage');
  const timezoneValue = watch('timezone');

  const onFormatContinue = () => {
    track('interview_format_selected', { format });
    setSubStep('details');
  };

  const onGenerateDescription = async () => {
    if (!titleValue || titleValue.length < 2) return;
    setGeneratingDesc(true);
    try {
      // The API expects a human-readable language name, not the BCP-47 code.
      const languageName =
        availableLanguages.find((l) => l.lang === languageValue)?.text ?? languageValue;
      const desc = await generateJobDescription(titleValue, languageName);
      setValue('description', desc);
      markDirty();
      track('description_ai_generated', { title: titleValue });
    } catch {
      // silent
    } finally {
      setGeneratingDesc(false);
    }
  };

  const onSubmit = async (data: JobSetupInput) => {
    setSubmitting(true);
    try {
      const job = await createJob({
        format: data.format,
        title: data.title,
        timezone: data.timezone,
        applicationDeadline: data.applicationDeadline,
        interviewLanguage: data.interviewLanguage,
        description: data.description ?? '',
      });
      setJob(job);
      clearDirty();
      track('job_created', { jobId: job.id, format: data.format });
      router.push(`/jobs/${job.id}/edit/questions`);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  if (subStep === 'format') {
    return (
      <div className="space-y-6">
        <HeroBanner
          headline="How should candidates be interviewed?"
          subtext="You can't change this after the job is created."
          step={1}
        />
        <SectionCard
          title="Interview format"
          description="Choose the format that best fits this role."
          statusDot="indigo"
          statusTooltip="1 required field remaining"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FORMAT_CARDS.map((card) => (
              <FormatCardView
                key={card.id}
                card={card}
                selected={format === card.id}
                onSelect={setFormat}
              />
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onFormatContinue}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-button text-primary-foreground shadow-md transition-all hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Continue
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      <HeroBanner
        headline="Let's start with the basics"
        subtext="These details shape the candidate experience and landing page."
        step={1}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard
          title="Job details"
          description="Add basic information about the role."
          statusDot={hasErrors ? 'indigo' : 'success'}
          statusTooltip={hasErrors ? 'Some required fields need attention' : 'Complete'}
          footer={
            <StepFooter
              onCancel={() => setSubStep('format')}
              onNext={handleSubmit(onSubmit)}
              nextLabel="Next: Questions"
              nextLoading={submitting}
            />
          }
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Job position — free text. Roles are unbounded, so there is no
                fixed list to pick from. */}
            <WizardInput
              label="Job position"
              required
              icon={Briefcase}
              {...register('title')}
              onBlur={() => markDirty()}
              placeholder="e.g. Senior Frontend Engineer"
              error={errors.title?.message}
              autoComplete="off"
            />

            {/* Timezone */}
            <WizardCombobox
              label="Timezone"
              required
              icon={Clock}
              options={TIMEZONE_OPTIONS}
              value={timezoneValue}
              onChange={(v) => {
                setValue('timezone', v, { shouldValidate: true });
                markDirty();
              }}
              searchPlaceholder="Search timezones…"
              error={errors.timezone?.message}
            />

            {/* Application deadline */}
            <div>
              <label className="mb-2 block text-body-sm font-semibold text-heading">
                Application deadline <span className="ml-0.5 text-error">*</span>
              </label>
              <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center gap-3 rounded-md border border-border bg-surface px-3 text-left text-body text-heading transition-all hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-active-menu-bg">
                      <CalendarIcon size={16} strokeWidth={1.5} className="text-primary" />
                    </div>
                    <span className={cn(!deadlineDate && 'text-muted')}>
                      {deadlineDate ? formatDate(deadlineDate, 'PPP') : 'Pick a date'}
                    </span>
                    <ChevronDown size={16} className="ml-auto text-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineDate}
                    onSelect={(d) => {
                      if (d && !isPast(d)) {
                        setDeadlineDate(d);
                        setValue('applicationDeadline', formatDate(d, 'yyyy-MM-dd'), {
                          shouldValidate: true,
                        });
                        markDirty();
                        // Close on pick — otherwise the calendar stays open and
                        // you have to click elsewhere to dismiss it.
                        setDeadlineOpen(false);
                      }
                    }}
                    disabled={(d) => isPast(d) && !isToday(d)}
                  />
                  <p className="border-t border-border px-3 py-2 text-caption text-muted">
                    Past dates are not available.
                  </p>
                </PopoverContent>
              </Popover>
              {errors.applicationDeadline && (
                <p role="alert" className="mt-1.5 text-body-sm text-error">
                  {errors.applicationDeadline.message}
                </p>
              )}
            </div>

            {/* Interview language */}
            <WizardCombobox
              label="Interview language"
              required
              icon={Globe}
              options={LANGUAGE_OPTIONS}
              value={languageValue}
              onChange={(v) => {
                setValue('interviewLanguage', v, { shouldValidate: true });
                markDirty();
              }}
              searchPlaceholder="Search languages…"
              error={errors.interviewLanguage?.message}
            />
          </div>

          {/* Job description */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-body-sm font-semibold text-heading">
                Job description
              </label>
              <button
                type="button"
                onClick={onGenerateDescription}
                disabled={generatingDesc || !titleValue || titleValue.length < 2}
                aria-busy={generatingDesc}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-primary bg-transparent px-4 text-button text-primary transition-colors hover:bg-active-menu-bg disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Sparkles size={16} />
                {generatingDesc ? 'Generating…' : 'Generate with AI'}
              </button>
            </div>
            <RichTextEditor
              value={watch('description') ?? ''}
              onChange={(val) => {
                setValue('description', val);
                markDirty();
              }}
              generating={generatingDesc}
            />
            <p className="mt-2 text-body-sm text-muted">
              Adding a description changes the candidate landing page to a two-column layout.
            </p>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
