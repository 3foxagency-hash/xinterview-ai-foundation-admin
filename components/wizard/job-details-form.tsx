'use client';

import * as React from 'react';
import {
  Briefcase,
  Clock,
  Globe,
  Calendar as CalendarIcon,
  ChevronDown,
  MapPin,
  Plus,
  FileText,
  Info,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format as formatDate, isPast, isToday } from 'date-fns';
import { WizardInput } from './wizard-input';
import { WizardCombobox } from './wizard-combobox';
import { SectionCard } from './section-card';
import { JobDetailsRail, type RailSection } from './job-details-rail';
import { JobDescriptionSection } from './job-description-section';
import { StepFooter } from './step-footer';
import {
  DEPARTMENTS,
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  DURATION_OPTIONS,
  BREAK_OPTIONS,
} from '@/lib/constants/job-options';
import { INTERVIEW_FORMAT_CONFIG } from '@/lib/constants/interview-formats';
import { timezones, getDefaultTimezone } from '@/lib/constants/timezones';
import { availableLanguages, DEFAULT_LANGUAGE } from '@/lib/constants/languages';
import type { JobSetupInput, InterviewFormat } from '@/lib/validation/job';
import { track } from '@/lib/utils/analytics';

interface JobDetailsFormProps {
  format: InterviewFormat;
  onBackToFormat: () => void;
  jobCreated: boolean;
  onSubmit: (data: JobSetupInput) => void;
  submitting: boolean;
  submitLabel: string;
  onGenerateDescription: (title: string, language: string) => Promise<string | null>;
  initialData?: Partial<JobSetupInput>;
}

const TIMEZONE_OPTIONS = timezones.map((tz) => ({ value: tz.key, label: tz.label }));
const LANGUAGE_OPTIONS = availableLanguages.map((l) => ({ value: l.lang, label: l.text }));

const JOB_TITLE_MAX = 120;

export function JobDetailsForm({
  format,
  onBackToFormat,
  jobCreated,
  onSubmit,
  submitting,
  submitLabel,
  onGenerateDescription,
  initialData,
}: JobDetailsFormProps) {
  const [formData, setFormData] = React.useState<JobSetupInput>({
    format,
    title: initialData?.title ?? '',
    department: initialData?.department ?? '',
    employmentType: initialData?.employmentType,
    experienceLevel: initialData?.experienceLevel,
    locationType: initialData?.locationType ?? 'remote',
    location: initialData?.location ?? '',
    interviewDuration: initialData?.interviewDuration ?? '30',
    timezone: initialData?.timezone ?? getDefaultTimezone(),
    applicationDeadline: initialData?.applicationDeadline ?? '',
    interviewLanguage: initialData?.interviewLanguage ?? DEFAULT_LANGUAGE,
    availabilityWindowStart: initialData?.availabilityWindowStart ?? '',
    availabilityWindowEnd: initialData?.availabilityWindowEnd ?? '',
    breakBetweenInterviews: initialData?.breakBetweenInterviews ?? '',
    description: initialData?.description ?? '',
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof JobSetupInput, string>>>({});
  const [deadlineDate, setDeadlineDate] = React.useState<Date | undefined>(
    initialData?.applicationDeadline ? new Date(initialData.applicationDeadline) : undefined
  );
  const [deadlineOpen, setDeadlineOpen] = React.useState(false);
  const [generatingDesc, setGeneratingDesc] = React.useState(false);
  const [titleSuggestions, setTitleSuggestions] = React.useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('role');

  const formatConfig = INTERVIEW_FORMAT_CONFIG.find((f) => f.id === format);
  const isLiveFormat = formatConfig?.isLive ?? false;
  const isRemote = formData.locationType === 'remote';

  const update = <K extends keyof JobSetupInput>(key: K, value: JobSetupInput[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateField = (key: keyof JobSetupInput) => {
    const newErrors: Partial<Record<keyof JobSetupInput, string>> = {};
    if (key === 'title' && formData.title.trim().length < 2) {
      newErrors.title = 'Enter a job title.';
    }
    if (key === 'title' && formData.title.length > JOB_TITLE_MAX) {
      newErrors.title = 'Job title must be 120 characters or fewer.';
    }
    if (key === 'timezone' && !formData.timezone) {
      newErrors.timezone = 'Select a timezone.';
    }
    if (key === 'interviewLanguage' && !formData.interviewLanguage) {
      newErrors.interviewLanguage = 'Select an interview language.';
    }
    if (key === 'applicationDeadline' && !formData.applicationDeadline) {
      newErrors.applicationDeadline = 'Choose an application deadline.';
    }
    if (key === 'applicationDeadline' && formData.applicationDeadline) {
      const date = new Date(formData.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        newErrors.applicationDeadline = 'Pick a date in the future.';
      }
    }
    if (key === 'location' && !isRemote && !formData.location?.trim()) {
      newErrors.location = 'Add a location, or set this role to Remote.';
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = () => {
    const newErrors: Partial<Record<keyof JobSetupInput, string>> = {};
    if (formData.title.trim().length < 2) newErrors.title = 'Enter a job title.';
    if (!formData.timezone) newErrors.timezone = 'Select a timezone.';
    if (!formData.interviewLanguage) newErrors.interviewLanguage = 'Select an interview language.';
    if (!formData.applicationDeadline) newErrors.applicationDeadline = 'Choose an application deadline.';
    else {
      const date = new Date(formData.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) newErrors.applicationDeadline = 'Pick a date in the future.';
    }
    if (!isRemote && !formData.location?.trim()) {
      newErrors.location = 'Add a location, or set this role to Remote.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateAll()) {
      const firstErrorKey = Object.keys(newErrors())[0] as keyof JobSetupInput | undefined;
      if (firstErrorKey) {
        const el = document.querySelector(`[name="${firstErrorKey}"]`) as HTMLElement | null;
        el?.focus();
        const sectionMap: Record<string, string> = {
          title: 'role',
          department: 'role',
          employmentType: 'role',
          experienceLevel: 'role',
          locationType: 'role',
          location: 'role',
          timezone: 'schedule',
          interviewLanguage: 'schedule',
          applicationDeadline: 'schedule',
          interviewDuration: 'schedule',
        };
        const sectionId = sectionMap[firstErrorKey as string];
        if (sectionId) {
          setActiveSection(sectionId);
          document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      return;
    }
    onSubmit(formData);
  };

  // Re-compute errors for focus handling without stale closure
  const newErrors = () => {
    const ne: Partial<Record<keyof JobSetupInput, string>> = {};
    if (formData.title.trim().length < 2) ne.title = 'Enter a job title.';
    if (!formData.timezone) ne.timezone = 'Select a timezone.';
    if (!formData.interviewLanguage) ne.interviewLanguage = 'Select an interview language.';
    if (!formData.applicationDeadline) ne.applicationDeadline = 'Choose an application deadline.';
    else {
      const date = new Date(formData.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) ne.applicationDeadline = 'Pick a date in the future.';
    }
    if (!isRemote && !formData.location?.trim()) {
      ne.location = 'Add a location, or set this role to Remote.';
    }
    return ne;
  };

  const handleGenerate = async (): Promise<string | null> => {
    if (formData.title.trim().length < 2) return null;
    setGeneratingDesc(true);
    try {
      const languageName =
        availableLanguages.find((l) => l.lang === formData.interviewLanguage)?.text ??
        formData.interviewLanguage;
      const desc = await onGenerateDescription(formData.title, languageName);
      track('job_description_ai_generated', { title: formData.title });
      return desc;
    } catch {
      return null;
    } finally {
      setGeneratingDesc(false);
    }
  };

  React.useEffect(() => {
    import('@/lib/api/jobs').then(({ getPreviousJobTitles }) => {
      getPreviousJobTitles().then(setTitleSuggestions).catch(() => {});
    });
  }, []);

  const filteredSuggestions = titleSuggestions
    .filter((s) => s.toLowerCase().includes(formData.title.toLowerCase()) && s !== formData.title)
    .slice(0, 5);

  const roleComplete = formData.title.trim().length >= 2;
  const scheduleComplete = !!formData.timezone && !!formData.interviewLanguage && !!formData.applicationDeadline;
  const descriptionComplete = !!formData.description?.trim();

  const sections: RailSection[] = [
    { id: 'role', label: 'Role', caption: 'Role title, department & type', status: roleComplete ? 'complete' : activeSection === 'role' ? 'in_progress' : 'incomplete' },
    { id: 'schedule', label: 'Schedule & language', caption: 'Duration, timezone & language', status: scheduleComplete ? 'complete' : activeSection === 'schedule' ? 'in_progress' : 'incomplete' },
    { id: 'description', label: 'Job description', caption: 'Description, requirements & skills', status: descriptionComplete ? 'complete' : activeSection === 'description' ? 'in_progress' : 'incomplete' },
  ];

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const deadlineResolved = deadlineDate ? formatDate(deadlineDate, 'PPP') : null;
  const timezoneLabel = TIMEZONE_OPTIONS.find((t) => t.value === formData.timezone)?.label ?? formData.timezone;

  return (
    <div className="space-y-6 pb-24 md:pb-20">
      {/* Format strip */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          {formatConfig && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card-hover">
              <formatConfig.icon size={16} strokeWidth={1.5} className="text-bodyText" />
            </div>
          )}
          <span className="text-body-sm font-semibold text-heading">
            {formatConfig?.name ?? 'Interview format'}
          </span>
        </div>
        {jobCreated ? (
          <span className="text-body-sm text-muted" title="The interview format can't be changed after a job is created.">
            The interview format can&apos;t be changed after a job is created.
          </span>
        ) : (
          <button
            type="button"
            onClick={onBackToFormat}
            className="text-body-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-md"
          >
            Change
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Left rail — sticky on desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <JobDetailsRail
              sections={sections}
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
          </div>
        </div>

        {/* Mobile section chips */}
        <div className="flex gap-2 overflow-x-auto lg:hidden">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => handleSectionClick(section.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-caption font-medium transition-colors',
                activeSection === section.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-surface text-muted'
              )}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Main column */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 — Role */}
          <div id="section-role" className="scroll-mt-6">
            <SectionCard
              title="Role"
              description="Basic information about the position you are hiring for."
              icon={Briefcase}
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Job title */}
                <div className="relative">
                  <WizardInput
                    label="Job title"
                    required
                    icon={Briefcase}
                    name="title"
                    value={formData.title}
                    onChange={(e) => update('title', e.target.value)}
                    onBlur={() => validateField('title')}
                    onFocus={() => setShowTitleSuggestions(true)}
                    placeholder="e.g. Senior Frontend Engineer"
                    error={errors.title}
                    autoComplete="off"
                    maxLength={JOB_TITLE_MAX}
                  />
                  {showTitleSuggestions && filteredSuggestions.length > 0 && (
                    <div
                      role="listbox"
                      aria-label="Previously used job titles"
                      className="absolute z-dropdown mt-1 w-full rounded-md border border-border bg-surface shadow-lg"
                    >
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          role="option"
                          aria-selected={false}
                          onClick={() => {
                            update('title', suggestion);
                            setShowTitleSuggestions(false);
                          }}
                          className="flex w-full items-center px-3 py-2.5 text-left text-body text-heading transition-colors hover:bg-card-hover"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-caption tabular-nums text-muted">
                    {formData.title.length}/{JOB_TITLE_MAX}
                  </p>
                </div>

                {/* Department */}
                <div>
                  <label className="mb-2 block text-body-sm font-semibold text-heading">
                    Department
                  </label>
                  <Select
                    value={formData.department || '__none__'}
                    onValueChange={(v) => update('department', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                      <SelectItem value="__add__">
                        <span className="flex items-center gap-2 text-primary">
                          <Plus size={14} /> Add new department
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Employment type */}
                <div>
                  <label className="mb-2 block text-body-sm font-semibold text-heading">
                    Employment type
                  </label>
                  <Select
                    value={formData.employmentType ?? '__none__'}
                    onValueChange={(v) =>
                      update('employmentType', v === '__none__' ? undefined : (v as JobSetupInput['employmentType']))
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience level */}
                <div>
                  <label className="mb-2 block text-body-sm font-semibold text-heading">
                    Experience level
                  </label>
                  <Select
                    value={formData.experienceLevel ?? '__none__'}
                    onValueChange={(v) =>
                      update('experienceLevel', v === '__none__' ? undefined : (v as JobSetupInput['experienceLevel']))
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location type */}
                <div>
                  <label className="mb-2 block text-body-sm font-semibold text-heading">
                    Location type
                  </label>
                  <div className="flex h-12 items-center rounded-md border border-border-strong bg-surface p-1" role="radiogroup" aria-label="Location type">
                    {LOCATION_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={formData.locationType === opt.value}
                        onClick={() => {
                          update('locationType', opt.value as JobSetupInput['locationType']);
                          if (opt.value === 'remote') update('location', '');
                        }}
                        className={cn(
                          'flex h-full flex-1 items-center justify-center rounded-sm text-body-sm font-medium transition-all',
                          formData.locationType === opt.value
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted hover:text-heading'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="mb-2 block text-body-sm font-semibold text-heading">
                    Location
                    {!isRemote && <span className="ml-0.5 text-error">*</span>}
                  </label>
                  <WizardInput
                    label="Location"
                    icon={MapPin}
                    name="location"
                    value={formData.location}
                    onChange={(e) => update('location', e.target.value)}
                    onBlur={() => validateField('location')}
                    placeholder={isRemote ? 'Not needed for remote roles' : 'e.g. London, UK'}
                    error={errors.location}
                    disabled={isRemote}
                    description={isRemote ? "Remote roles don't need a location." : undefined}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Section 2 — Schedule & Language */}
          <div id="section-schedule" className="scroll-mt-6">
            <SectionCard
              title="Schedule & language"
              description="Set the interview length, availability and language."
              icon={Clock}
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Interview duration */}
                <div>
                  <label className="mb-2 block text-body-sm font-semibold text-heading">
                    Interview duration
                  </label>
                  <Select
                    value={formData.interviewDuration}
                    onValueChange={(v) => update('interviewDuration', v)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-caption text-muted">
                    Shown to candidates as the expected time commitment.
                  </p>
                </div>

                {/* Timezone */}
                <WizardCombobox
                  label="Timezone"
                  required
                  icon={Clock}
                  options={TIMEZONE_OPTIONS}
                  value={formData.timezone}
                  onChange={(v) => update('timezone', v)}
                  searchPlaceholder="Search timezones…"
                  error={errors.timezone}
                />

                {/* Interview language */}
                <WizardCombobox
                  label="Interview language"
                  required
                  icon={Globe}
                  options={LANGUAGE_OPTIONS}
                  value={formData.interviewLanguage}
                  onChange={(v) => update('interviewLanguage', v)}
                  searchPlaceholder="Search languages…"
                  error={errors.interviewLanguage}
                  description="Questions and candidate instructions use this language."
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
                        className="flex h-12 w-full items-center gap-3 rounded-md border border-border bg-surface px-3 text-left text-body text-heading transition-all hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
                            update('applicationDeadline', formatDate(d, 'yyyy-MM-dd'));
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
                      {errors.applicationDeadline}
                    </p>
                  )}
                  {deadlineResolved && !errors.applicationDeadline && (
                    <p className="mt-1.5 text-caption text-muted">
                      Cutoff: {deadlineResolved} ({timezoneLabel})
                    </p>
                  )}
                </div>

                {/* Availability window — only for live formats */}
                {isLiveFormat && (
                  <>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <label className="text-body-sm font-semibold text-heading">
                          Availability window
                        </label>
                        <span className="text-caption text-muted">(optional)</span>
                        <span className="flex items-center gap-1 text-caption text-muted" title="The date and time range candidates can start the interview.">
                          <Info size={12} /> When candidates can start
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <WizardInput
                          label="Availability start"
                          name="availabilityWindowStart"
                          type="date"
                          value={formData.availabilityWindowStart}
                          onChange={(e) => update('availabilityWindowStart', e.target.value)}
                          placeholder="Start date"
                        />
                        <WizardInput
                          label="Availability end"
                          name="availabilityWindowEnd"
                          type="date"
                          value={formData.availabilityWindowEnd}
                          onChange={(e) => update('availabilityWindowEnd', e.target.value)}
                          placeholder="End date"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <label className="mb-2 block text-body-sm font-semibold text-heading">
                          Break between interviews
                        </label>
                        <span className="flex items-center gap-1 text-caption text-muted" title="Buffer time between consecutive candidate interviews.">
                          <Info size={12} />
                        </span>
                      </div>
                      <Select
                        value={formData.breakBetweenInterviews || '__none__'}
                        onValueChange={(v) => update('breakBetweenInterviews', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BREAK_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Section 3 — Job Description */}
          <div id="section-description" className="scroll-mt-6">
            <SectionCard
              title="Job description"
              description="Add a short description, key responsibilities and required skills."
              icon={FileText}
            >
              <JobDescriptionSection
                value={formData.description ?? ''}
                onChange={(val) => update('description', val)}
                jobTitle={formData.title}
                onGenerate={handleGenerate}
                generating={generatingDesc}
              />
              <p className="mt-3 text-body-sm text-muted">
                Optional — this field never blocks progress.
              </p>
            </SectionCard>
          </div>
        </form>
      </div>

      {/* Fixed footer */}
      <StepFooter
        onBack={onBackToFormat}
        backLabel="Back to format"
        onNext={() => handleSubmit()}
        nextLabel={submitLabel}
        nextLoading={submitting}
      />
    </div>
  );
}
