'use client';

import * as React from 'react';
import {
  Briefcase,
  Clock,
  Globe,
  Calendar as CalendarIcon,
  MapPin,
  Plus,
  FileText,
  Info,
  Check,
  X,
  Pencil,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { SegmentedControl } from '@/components/settings/segmented-control';
import {
  format as formatDate,
  isPast,
  isToday,
  isValid as isValidDate,
  parse as parseDateFns,
} from 'date-fns';
import { WizardInput } from './wizard-input';
import { WizardCombobox } from './wizard-combobox';
import { SectionCard } from './section-card';
import { JobDetailsRail, type RailSection } from './job-details-rail';
import { JobDescriptionSection, type JobDescriptionViewState } from './job-description-section';
import { StepFooter } from './step-footer';
import type { SaveState } from './wizard-context';
import {
  DEPARTMENTS,
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  DURATION_OPTIONS,
  BREAK_OPTIONS,
} from '@/lib/constants/job-options';
import { INTERVIEW_FORMAT_CONFIG, TONE_TILE } from '@/lib/constants/interview-formats';
import { timezones, getCompanyDefaultTimezone, resolveInitialTimezone } from '@/lib/constants/timezones';
import { availableLanguages, DEFAULT_LANGUAGE } from '@/lib/constants/languages';
import { searchPlaces } from '@/lib/api/jobs';
import type { JobSetupInput, InterviewFormat } from '@/lib/validation/job';
import { track } from '@/lib/utils/analytics';

interface JobDetailsFormProps {
  format: InterviewFormat;
  onBackToFormat: () => void;
  jobCreated: boolean;
  onSubmit: (data: JobSetupInput) => void;
  onFieldSave?: (data: JobSetupInput) => void;
  saveState?: SaveState;
  onRetrySave?: () => void;
  submitting: boolean;
  submitLabel: string;
  onGenerateDescription: (title: string, language: string) => Promise<string | null>;
  initialData?: Partial<JobSetupInput>;
}

const TIMEZONE_OPTIONS = timezones.map((tz) => ({ value: tz.key, label: tz.label }));
const LANGUAGE_OPTIONS = availableLanguages.map((l) => ({ value: l.lang, label: l.text }));
const COMPANY_TIMEZONE = getCompanyDefaultTimezone();

const JOB_TITLE_MAX = 120;

const ERROR_MESSAGES = {
  title: 'Enter a job title.',
  titleLength: 'Job title must be 120 characters or fewer.',
  timezone: 'Select a timezone.',
  interviewLanguage: 'Select an interview language.',
  applicationDeadline: 'Choose an application deadline.',
  applicationDeadlinePast: 'Pick a date in the future.',
  applicationDeadlineInvalid: 'Enter a valid date, e.g. 15 June 2026.',
  location: 'Add a location, or set this role to Remote.',
  interviewDuration: 'Select an interview duration.',
} as const;

/** Accepts a handful of common typed formats before falling back to native parsing. */
function parseTypedDate(text: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const formats = ['d MMMM yyyy', 'MMMM d, yyyy', 'MMM d, yyyy', 'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy'];
  for (const fmt of formats) {
    const parsed = parseDateFns(trimmed, fmt, new Date());
    if (isValidDate(parsed)) return parsed;
  }
  const native = new Date(trimmed);
  return isValidDate(native) ? native : null;
}

export function JobDetailsForm({
  format,
  onBackToFormat,
  jobCreated,
  onSubmit,
  onFieldSave,
  saveState,
  onRetrySave,
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
    // SSR-safe default (no Intl call) — the effect below upgrades this to the
    // device zone client-side once, per the §5.1 resolution order.
    timezone: initialData?.timezone ?? COMPANY_TIMEZONE,
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
  const [deadlineText, setDeadlineText] = React.useState(
    initialData?.applicationDeadline ? formatDate(new Date(initialData.applicationDeadline), 'PPP') : ''
  );
  const [deadlineOpen, setDeadlineOpen] = React.useState(false);
  const [generatingDesc, setGeneratingDesc] = React.useState(false);
  const [descriptionView, setDescriptionView] = React.useState<JobDescriptionViewState>(
    initialData?.description ? 'summary' : 'empty'
  );
  const [titleSuggestions, setTitleSuggestions] = React.useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('role');

  // Timezone detection (§5.1) — 'saved' means initialData already carried a
  // value (never re-detect); 'detected'/'company' come from the resolver
  // effect below; 'manual' is set the instant the user picks one themself.
  const [timezoneSource, setTimezoneSource] = React.useState<'saved' | 'detected' | 'company' | 'manual'>(
    initialData?.timezone ? 'saved' : 'company'
  );
  const detectedOnceRef = React.useRef(false);

  // Department "add new" inline row.
  const [departments, setDepartments] = React.useState<string[]>(DEPARTMENTS);
  const [addingDepartment, setAddingDepartment] = React.useState(false);
  const [newDepartmentDraft, setNewDepartmentDraft] = React.useState('');

  // Location place-search.
  const [locationSuggestions, setLocationSuggestions] = React.useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = React.useState(false);
  const locationSearchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const descSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatConfig = INTERVIEW_FORMAT_CONFIG.find((f) => f.id === format);
  const isLiveFormat = formatConfig?.isLive ?? false;
  const isRemote = formData.locationType === 'remote';

  const update = <K extends keyof JobSetupInput>(key: K, value: JobSetupInput[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Detection runs once, client-side only (so it never disagrees with the
  // SSR-safe initial render), and only for a job that has no saved timezone.
  React.useEffect(() => {
    if (detectedOnceRef.current || initialData?.timezone) return;
    detectedOnceRef.current = true;
    const { timezone, source } = resolveInitialTimezone({ savedTimezone: null, companyTimezone: COMPANY_TIMEZONE });
    setFormData((prev) => ({ ...prev, timezone }));
    setTimezoneSource(source === 'saved' ? 'company' : source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computeErrors = (): Partial<Record<keyof JobSetupInput, string>> => {
    const e: Partial<Record<keyof JobSetupInput, string>> = {};
    if (formData.title.trim().length < 2) e.title = ERROR_MESSAGES.title;
    else if (formData.title.length > JOB_TITLE_MAX) e.title = ERROR_MESSAGES.titleLength;
    if (!formData.timezone) e.timezone = ERROR_MESSAGES.timezone;
    if (!formData.interviewLanguage) e.interviewLanguage = ERROR_MESSAGES.interviewLanguage;
    if (!formData.applicationDeadline) {
      e.applicationDeadline = ERROR_MESSAGES.applicationDeadline;
    } else {
      const date = new Date(formData.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) e.applicationDeadline = ERROR_MESSAGES.applicationDeadlinePast;
    }
    if (!isRemote && !formData.location?.trim()) {
      e.location = ERROR_MESSAGES.location;
    }
    if (isLiveFormat && !formData.interviewDuration) {
      e.interviewDuration = ERROR_MESSAGES.interviewDuration;
    }
    return e;
  };

  const validateField = (key: keyof JobSetupInput) => {
    const all = computeErrors();
    setErrors((prev) => ({ ...prev, [key]: all[key] }));
    return !all[key];
  };

  const handleSubmit = (ev?: React.FormEvent) => {
    ev?.preventDefault();
    const all = computeErrors();
    setErrors(all);
    const firstErrorKey = Object.keys(all)[0] as keyof JobSetupInput | undefined;
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
      return;
    }
    onSubmit(formData);
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

  const handleDescriptionChange = (val: string) => {
    update('description', val);
    if (descSaveTimer.current) clearTimeout(descSaveTimer.current);
    descSaveTimer.current = setTimeout(() => {
      onFieldSave?.({ ...formData, description: val });
      track('job_details_saved', { section: 'description' });
    }, 1000);
  };

  React.useEffect(() => {
    import('@/lib/api/jobs').then(({ getPreviousJobTitles }) => {
      getPreviousJobTitles().then(setTitleSuggestions).catch(() => {});
    });
  }, []);

  const filteredSuggestions = titleSuggestions
    .filter((s) => s.toLowerCase().includes(formData.title.toLowerCase()) && s !== formData.title)
    .slice(0, 5);

  const handleLocationChange = (value: string) => {
    update('location', value);
    if (locationSearchTimer.current) clearTimeout(locationSearchTimer.current);
    if (!value.trim()) {
      setLocationSuggestions([]);
      return;
    }
    locationSearchTimer.current = setTimeout(() => {
      searchPlaces(value)
        .then(setLocationSuggestions)
        .catch(() => setLocationSuggestions([]));
    }, 200);
  };

  const handleDepartmentValueChange = (v: string) => {
    if (v === '__add__') {
      setAddingDepartment(true);
      return;
    }
    const next = v === '__none__' ? '' : v;
    update('department', next);
    onFieldSave?.({ ...formData, department: next });
    track('job_details_saved', { section: 'role' });
  };

  const commitNewDepartment = () => {
    const name = newDepartmentDraft.trim();
    if (!name) {
      setAddingDepartment(false);
      return;
    }
    setDepartments((prev) => (prev.includes(name) ? prev : [...prev, name]));
    update('department', name);
    onFieldSave?.({ ...formData, department: name });
    track('job_details_saved', { section: 'role' });
    setAddingDepartment(false);
    setNewDepartmentDraft('');
  };

  const commitDeadline = (date: Date) => {
    setDeadlineDate(date);
    setDeadlineText(formatDate(date, 'PPP'));
    const iso = formatDate(date, 'yyyy-MM-dd');
    update('applicationDeadline', iso);
    setErrors((prev) => ({ ...prev, applicationDeadline: undefined }));
    onFieldSave?.({ ...formData, applicationDeadline: iso });
    track('job_details_saved', { section: 'schedule' });
  };

  const handleDeadlineTextBlur = () => {
    if (!deadlineText.trim()) {
      setErrors((prev) => ({ ...prev, applicationDeadline: ERROR_MESSAGES.applicationDeadline }));
      return;
    }
    const parsed = parseTypedDate(deadlineText);
    if (!parsed) {
      setErrors((prev) => ({ ...prev, applicationDeadline: ERROR_MESSAGES.applicationDeadlineInvalid }));
      return;
    }
    if (isPast(parsed) && !isToday(parsed)) {
      setErrors((prev) => ({ ...prev, applicationDeadline: ERROR_MESSAGES.applicationDeadlinePast }));
      return;
    }
    commitDeadline(parsed);
  };

  const useCompanyTimezone = () => {
    update('timezone', COMPANY_TIMEZONE);
    setTimezoneSource('manual');
    onFieldSave?.({ ...formData, timezone: COMPANY_TIMEZONE });
    track('job_details_saved', { section: 'schedule' });
  };

  const roleComplete = formData.title.trim().length >= 2;
  const scheduleComplete =
    !!formData.timezone &&
    !!formData.interviewLanguage &&
    !!formData.applicationDeadline &&
    (!isLiveFormat || !!formData.interviewDuration);
  const descriptionComplete = !!formData.description?.trim();

  const sections: RailSection[] = [
    {
      id: 'role',
      label: 'Role',
      caption: 'Role title, department & type',
      status: errors.title || errors.location ? 'error' : roleComplete ? 'complete' : activeSection === 'role' ? 'in_progress' : 'incomplete',
      icon: Briefcase,
    },
    {
      id: 'schedule',
      label: 'Schedule & Language',
      caption: 'Duration, timezone & language',
      status:
        errors.timezone || errors.interviewLanguage || errors.applicationDeadline || errors.interviewDuration
          ? 'error'
          : scheduleComplete
            ? 'complete'
            : activeSection === 'schedule'
              ? 'in_progress'
              : 'incomplete',
      icon: CalendarIcon,
    },
    {
      id: 'description',
      label: 'Job Description',
      caption: 'Description, requirements & skills',
      status: descriptionComplete ? 'complete' : activeSection === 'description' ? 'in_progress' : 'incomplete',
      icon: FileText,
    },
  ];

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRetrySave = () => {
    if (jobCreated) {
      onRetrySave?.();
    } else {
      onFieldSave?.(formData);
    }
  };

  const deadlineResolved = deadlineDate ? formatDate(deadlineDate, 'PPP') : null;
  const timezoneLabel = TIMEZONE_OPTIONS.find((t) => t.value === formData.timezone)?.label ?? formData.timezone;
  const companyTimezoneLabel =
    TIMEZONE_OPTIONS.find((t) => t.value === COMPANY_TIMEZONE)?.label ?? COMPANY_TIMEZONE;
  const showTimezoneDetectedHint = timezoneSource === 'detected';
  const showTimezoneMismatch = timezoneSource === 'detected' && formData.timezone !== COMPANY_TIMEZONE;

  return (
    <div className="space-y-5 pb-24 sm:pb-20">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left rail — sticky on desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
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
          {/* Format strip — confined to the right column, not spanning
              above the left rail as well. */}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              {formatConfig && (
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                    TONE_TILE[formatConfig.tone]
                  )}
                >
                  <formatConfig.icon size={22} />
                </div>
              )}
              <div>
                <span className="block text-h3 text-heading">
                  {formatConfig?.name ?? 'Interview format'}
                </span>
                {formatConfig?.description && (
                  <span className="block text-body-sm text-muted">{formatConfig.description}</span>
                )}
              </div>
            </div>
            {jobCreated ? (
              <span className="text-body-sm text-muted" title="The interview format can't be changed after a job is created.">
                The interview format can&apos;t be changed after a job is created.
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  track('job_format_change_clicked');
                  onBackToFormat();
                }}
                className="inline-flex shrink-0 items-center gap-0.5 text-body-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-md"
              >
                Change
                <ChevronRight size={16} />
              </button>
            )}
          </div>

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
                    onBlur={() => {
                      validateField('title');
                      setShowTitleSuggestions(false);
                      onFieldSave?.(formData);
                      track('job_details_saved', { section: 'role' });
                    }}
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
                          onMouseDown={(e) => {
                            // mousedown, not click: fires before the input's
                            // blur handler so the suggestion is applied first.
                            e.preventDefault();
                            update('title', suggestion);
                            setShowTitleSuggestions(false);
                            onFieldSave?.({ ...formData, title: suggestion });
                            track('job_title_suggestion_used');
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
                  {addingDepartment ? (
                    <div className="flex h-12 items-center gap-2">
                      <Input
                        autoFocus
                        value={newDepartmentDraft}
                        onChange={(e) => setNewDepartmentDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitNewDepartment();
                          }
                          if (e.key === 'Escape') {
                            setAddingDepartment(false);
                            setNewDepartmentDraft('');
                          }
                        }}
                        placeholder="Department name"
                        className="h-12"
                      />
                      <button
                        type="button"
                        onClick={commitNewDepartment}
                        className="inline-flex h-9 shrink-0 items-center rounded-md bg-primary px-3 text-button text-primary-foreground hover:bg-primary-hover"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingDepartment(false);
                          setNewDepartmentDraft('');
                        }}
                        aria-label="Cancel adding department"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-card-hover hover:text-heading"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <Select
                      value={formData.department || '__none__'}
                      onValueChange={handleDepartmentValueChange}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {departments.map((dept) => (
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
                  )}
                </div>

                {/* Employment type */}
                <div>
                  <label className="mb-2 block text-body-sm font-semibold text-heading">
                    Employment type
                  </label>
                  <Select
                    value={formData.employmentType ?? '__none__'}
                    onValueChange={(v) => {
                      const next = v === '__none__' ? undefined : (v as JobSetupInput['employmentType']);
                      update('employmentType', next);
                      onFieldSave?.({ ...formData, employmentType: next });
                      track('job_details_saved', { section: 'role' });
                    }}
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
                    onValueChange={(v) => {
                      const next = v === '__none__' ? undefined : (v as JobSetupInput['experienceLevel']);
                      update('experienceLevel', next);
                      onFieldSave?.({ ...formData, experienceLevel: next });
                      track('job_details_saved', { section: 'role' });
                    }}
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
                  <SegmentedControl
                    id="location-type"
                    size="lg"
                    options={LOCATION_TYPE_OPTIONS}
                    value={formData.locationType}
                    onChange={(v) => {
                      const next = v as JobSetupInput['locationType'];
                      const nextLocation = next === 'remote' ? '' : formData.location;
                      setFormData((prev) => ({ ...prev, locationType: next, location: nextLocation }));
                      onFieldSave?.({ ...formData, locationType: next, location: nextLocation });
                      track('job_details_saved', { section: 'role' });
                    }}
                  />
                </div>

                {/* Location */}
                <div className="relative">
                  <WizardInput
                    label="Location"
                    required={!isRemote}
                    icon={MapPin}
                    name="location"
                    value={formData.location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onBlur={() => {
                      validateField('location');
                      setShowLocationSuggestions(false);
                      onFieldSave?.(formData);
                      track('job_details_saved', { section: 'role' });
                    }}
                    placeholder={isRemote ? 'Not needed for remote roles' : 'e.g. London, UK'}
                    error={errors.location}
                    disabled={isRemote}
                    infoTooltip={isRemote ? "Remote roles don't need a location." : undefined}
                    autoComplete="off"
                    trailing={
                      formData.location && !isRemote ? (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            update('location', '');
                            setLocationSuggestions([]);
                            onFieldSave?.({ ...formData, location: '' });
                          }}
                          aria-label="Clear location"
                          className="flex h-6 w-6 items-center justify-center rounded-sm text-muted hover:bg-card-hover hover:text-heading"
                        >
                          <X size={14} />
                        </button>
                      ) : undefined
                    }
                  />
                  {showLocationSuggestions && !isRemote && locationSuggestions.length > 0 && (
                    <div
                      role="listbox"
                      aria-label="Matching places"
                      className="absolute z-dropdown mt-1 w-full rounded-md border border-border bg-surface shadow-lg"
                    >
                      {locationSuggestions.map((place) => (
                        <button
                          key={place}
                          type="button"
                          role="option"
                          aria-selected={false}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            update('location', place);
                            setShowLocationSuggestions(false);
                            setLocationSuggestions([]);
                            onFieldSave?.({ ...formData, location: place });
                          }}
                          className="flex w-full items-center px-3 py-2.5 text-left text-body text-heading transition-colors hover:bg-card-hover"
                        >
                          {place}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Section 2 — Schedule & Language */}
          <div id="section-schedule" className="scroll-mt-6">
            <SectionCard
              title="Schedule & language"
              description={
                isLiveFormat
                  ? 'Set the interview duration, availability and language.'
                  : 'Set the timezone, language and expiry.'
              }
              icon={Clock}
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Interview duration — live formats only */}
                {isLiveFormat && (
                  <div>
                    <label className="mb-2 block text-body-sm font-semibold text-heading">
                      Interview duration <span className="ml-0.5 text-error">*</span>
                    </label>
                    <Select
                      value={formData.interviewDuration}
                      onValueChange={(v) => {
                        update('interviewDuration', v);
                        onFieldSave?.({ ...formData, interviewDuration: v });
                        track('job_details_saved', { section: 'schedule' });
                      }}
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
                    {errors.interviewDuration && (
                      <p role="alert" className="mt-1.5 text-body-sm text-error">
                        {errors.interviewDuration}
                      </p>
                    )}
                  </div>
                )}

                {/* Timezone */}
                <div>
                  <WizardCombobox
                    label="Timezone"
                    required
                    icon={Clock}
                    options={TIMEZONE_OPTIONS}
                    value={formData.timezone}
                    onChange={(v) => {
                      update('timezone', v);
                      setTimezoneSource('manual');
                      onFieldSave?.({ ...formData, timezone: v });
                      track('job_details_saved', { section: 'schedule' });
                    }}
                    searchPlaceholder="Search timezones…"
                    error={errors.timezone}
                  />
                  {showTimezoneDetectedHint && (
                    <p className="mt-1.5 text-caption text-muted">Detected from your device.</p>
                  )}
                  {showTimezoneMismatch && (
                    <p className="mt-1.5 text-caption text-muted">
                      Your company is set to {companyTimezoneLabel}.{' '}
                      <button
                        type="button"
                        onClick={useCompanyTimezone}
                        className="font-medium text-primary hover:underline"
                      >
                        Use that instead?
                      </button>
                    </p>
                  )}
                </div>

                {/* Interview language */}
                <WizardCombobox
                  label="Interview language"
                  required
                  icon={Globe}
                  options={LANGUAGE_OPTIONS}
                  value={formData.interviewLanguage}
                  onChange={(v) => {
                    update('interviewLanguage', v);
                    onFieldSave?.({ ...formData, interviewLanguage: v });
                    track('job_details_saved', { section: 'schedule' });
                  }}
                  searchPlaceholder="Search languages…"
                  error={errors.interviewLanguage}
                  description="Questions and candidate instructions use this language."
                />

                {/* Application deadline — typable, with a calendar fallback */}
                <div>
                  <label className="mb-2 block text-body-sm font-semibold text-heading">
                    Application deadline <span className="ml-0.5 text-error">*</span>
                  </label>
                  <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-active-menu-bg">
                        <CalendarIcon size={16} strokeWidth={1.5} className="text-primary" />
                      </div>
                      <input
                        type="text"
                        name="applicationDeadline"
                        value={deadlineText}
                        onChange={(e) => setDeadlineText(e.target.value)}
                        onBlur={handleDeadlineTextBlur}
                        placeholder="e.g. 15 June 2026"
                        aria-invalid={!!errors.applicationDeadline}
                        className={cn(
                          'h-12 w-full rounded-md border bg-surface pl-12 pr-10 text-body text-heading transition-all placeholder:text-muted',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                          errors.applicationDeadline ? 'border-error' : 'border-border'
                        )}
                      />
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="Open calendar"
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted hover:bg-card-hover hover:text-heading"
                        >
                          <CalendarIcon size={16} />
                        </button>
                      </PopoverTrigger>
                    </div>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deadlineDate}
                        onSelect={(d) => {
                          if (d && !isPast(d)) {
                            commitDeadline(d);
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

                {/* Break between interviews — live formats only (buffers scheduled slots;
                    async formats like AI Video have no back-to-back slots to buffer). */}
                {isLiveFormat && (
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
                      onValueChange={(v) => {
                        const next = v === '__none__' ? '' : v;
                        update('breakBetweenInterviews', next);
                        onFieldSave?.({ ...formData, breakBetweenInterviews: next });
                        track('job_details_saved', { section: 'schedule' });
                      }}
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
                )}
              </div>

              {/* Availability window — only for live formats — its own full-width row so the
                  start/end pair doesn't crowd or misalign against the single-column fields above. */}
              {isLiveFormat && (
                <div className="mt-6">
                  <div className="flex items-center gap-2">
                    <label className="text-body-sm font-semibold text-heading">
                      Availability window
                    </label>
                    <span className="text-caption text-muted">(optional)</span>
                    <span className="flex items-center gap-1 text-caption text-muted" title="The date and time range candidates can start the interview.">
                      <Info size={12} /> When candidates can start
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <WizardInput
                      label="Availability start"
                      name="availabilityWindowStart"
                      type="date"
                      value={formData.availabilityWindowStart}
                      onChange={(e) => update('availabilityWindowStart', e.target.value)}
                      onBlur={() => {
                        onFieldSave?.(formData);
                        track('job_details_saved', { section: 'schedule' });
                      }}
                      placeholder="Start date"
                    />
                    <WizardInput
                      label="Availability end"
                      name="availabilityWindowEnd"
                      type="date"
                      value={formData.availabilityWindowEnd}
                      onChange={(e) => update('availabilityWindowEnd', e.target.value)}
                      onBlur={() => {
                        onFieldSave?.(formData);
                        track('job_details_saved', { section: 'schedule' });
                      }}
                      placeholder="End date"
                    />
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Section 3 — Job Description */}
          <div id="section-description" className="scroll-mt-6">
            <SectionCard
              title="Job description"
              description="Add a summary, key responsibilities and requirements."
              icon={FileText}
              headerAction={
                descriptionView === 'summary' ? (
                  <button
                    type="button"
                    onClick={() => setDescriptionView('editing')}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
                  >
                    <Pencil size={16} /> Edit description
                  </button>
                ) : undefined
              }
            >
              <JobDescriptionSection
                value={formData.description ?? ''}
                onChange={handleDescriptionChange}
                jobTitle={formData.title}
                onGenerate={handleGenerate}
                generating={generatingDesc}
                view={descriptionView}
                onViewChange={setDescriptionView}
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
        backLabel="Back to interview format"
        onNext={() => handleSubmit()}
        nextLabel={submitLabel}
        nextLoading={submitting}
        saveState={saveState}
        onRetrySave={handleRetrySave}
      />
    </div>
  );
}
