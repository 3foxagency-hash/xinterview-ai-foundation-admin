'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { JobFormatSelection } from '@/components/wizard/job-format-selection';
import { JobDetailsForm } from '@/components/wizard/job-details-form';
import { useWizard } from '@/components/wizard/wizard-context';
import { createJob, updateJob, generateJobDescription } from '@/lib/api/jobs';
import { track } from '@/lib/utils/analytics';
import { INTERVIEW_FORMAT_CONFIG } from '@/lib/constants/interview-formats';
import type { InterviewFormat, JobSetupInput } from '@/lib/validation/job';

export default function SetupPage() {
  const router = useRouter();
  const { setJob, jobId, job, markDirty, clearDirty, patchJob } = useWizard();
  const [subStep, setSubStep] = React.useState<'format' | 'details'>('format');
  const [format, setFormat] = React.useState<InterviewFormat>('ai_video');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    track('create_job_started');
    track('wizard_step_viewed', { step: 1 });
  }, []);

  React.useEffect(() => {
    if (subStep === 'details') {
      track('wizard_step_viewed', { step: 1, substep: 'details' });
    }
  }, [subStep]);

  // Skip format selection if only one format is available
  React.useEffect(() => {
    const selectable = INTERVIEW_FORMAT_CONFIG.filter((f) => !f.locked && !f.setupRequired);
    if (selectable.length === 1 && subStep === 'format') {
      setFormat(selectable[0].id);
      setSubStep('details');
    }
  }, [subStep]);

  const handleFormatContinue = () => {
    track('interview_format_selected', { format });
    setSubStep('details');
  };

  const handleGenerateDescription = async (
    title: string,
    language: string
  ): Promise<string | null> => {
    try {
      return await generateJobDescription(title, language);
    } catch {
      return null;
    }
  };

  const handleSubmit = async (data: JobSetupInput) => {
    setSubmitting(true);
    try {
      if (jobId && job) {
        const updated = await updateJob(jobId, {
          title: data.title,
          timezone: data.timezone,
          applicationDeadline: data.applicationDeadline,
          interviewLanguage: data.interviewLanguage,
          description: data.description,
          department: data.department,
          employmentType: data.employmentType,
          experienceLevel: data.experienceLevel,
          locationType: data.locationType,
          location: data.location,
          interviewDuration: data.interviewDuration,
          availabilityWindowStart: data.availabilityWindowStart,
          availabilityWindowEnd: data.availabilityWindowEnd,
          breakBetweenInterviews: data.breakBetweenInterviews,
        });
        setJob(updated);
        clearDirty();
        track('job_created', {
          format: data.format,
          language: data.interviewLanguage,
          employment_type: data.employmentType,
          has_description: Boolean(data.description?.trim()),
        });
        router.push(`/jobs/${jobId}/edit/questions`);
      } else {
        const createdJob = await createJob({
          format: data.format,
          title: data.title,
          timezone: data.timezone,
          applicationDeadline: data.applicationDeadline,
          interviewLanguage: data.interviewLanguage,
          description: data.description ?? '',
          department: data.department,
          employmentType: data.employmentType,
          experienceLevel: data.experienceLevel,
          locationType: data.locationType,
          location: data.location,
          interviewDuration: data.interviewDuration,
          availabilityWindowStart: data.availabilityWindowStart,
          availabilityWindowEnd: data.availabilityWindowEnd,
          breakBetweenInterviews: data.breakBetweenInterviews,
        });
        setJob(createdJob);
        clearDirty();
        track('job_created', {
          format: data.format,
          language: data.interviewLanguage,
          employment_type: data.employmentType,
          has_description: Boolean(data.description?.trim()),
        });
        router.push(`/jobs/${createdJob.id}/edit/questions`);
      }
    } catch {
      // stay on page — error is retryable via the button
    } finally {
      setSubmitting(false);
    }
  };

  if (subStep === 'format') {
    return (
      <JobFormatSelection
        selected={format}
        onSelect={setFormat}
        onContinue={handleFormatContinue}
      />
    );
  }

  return (
    <JobDetailsForm
      format={format}
      onBackToFormat={() => setSubStep('format')}
      jobCreated={!!jobId}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={jobId ? 'Save and continue' : 'Next: Questions'}
      onGenerateDescription={handleGenerateDescription}
      initialData={
        job
          ? {
              title: job.title,
              timezone: job.timezone,
              applicationDeadline: job.applicationDeadline,
              interviewLanguage: job.interviewLanguage,
              description: job.description,
              department: job.department,
              employmentType: job.employmentType as JobSetupInput['employmentType'],
              experienceLevel: job.experienceLevel as JobSetupInput['experienceLevel'],
              locationType: job.locationType as JobSetupInput['locationType'],
              location: job.location,
              interviewDuration: job.interviewDuration,
            }
          : undefined
      }
    />
  );
}
