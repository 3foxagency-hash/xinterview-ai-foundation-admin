'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { JobFormatSelection } from '@/components/wizard/job-format-selection';
import { JobDetailsForm } from '@/components/wizard/job-details-form';
import { JobDetailsSkeleton } from '@/components/wizard/job-details-skeleton';
import { useWizard } from '@/components/wizard/wizard-context';
import { createJob, updateJob, generateJobDescription } from '@/lib/api/jobs';
import { track } from '@/lib/utils/analytics';
import { INTERVIEW_FORMAT_CONFIG } from '@/lib/constants/interview-formats';
import type { InterviewFormat, JobSetupInput } from '@/lib/validation/job';

export default function SetupPage() {
  const router = useRouter();
  const {
    setJob,
    jobId,
    job,
    loading: wizardLoading,
    markDirty,
    clearDirty,
    patchJob,
    saveState,
    setSaveState,
    retrySave,
    setChromeMode,
  } = useWizard();
  const creatingDraftRef = React.useRef(false);
  const [subStep, setSubStep] = React.useState<'format' | 'details'>('format');
  const [format, setFormat] = React.useState<InterviewFormat>('ai_video');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    track('create_job_started');
    track('wizard_step_viewed', { step: 1 });
  }, []);

  // useLayoutEffect, not useEffect: this must land before the browser paints,
  // or the wide/tracked chrome flashes for a frame before flipping to bare.
  React.useLayoutEffect(() => {
    setChromeMode(subStep === 'format' ? 'bare' : 'wide');
    return () => setChromeMode('default');
  }, [subStep, setChromeMode]);

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

  // Fired on every field blur. Before a job exists, the first save with a
  // usable title materializes the draft (createJob); after that, every save
  // goes through the wizard's existing debounced patchJob.
  const handleFieldSave = (data: JobSetupInput) => {
    if (jobId) {
      patchJob({
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
      return;
    }
    if (!data.title.trim() || creatingDraftRef.current) return;
    creatingDraftRef.current = true;
    markDirty();
    setSaveState('saving');
    createJob({
      format,
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
    })
      .then((createdJob) => {
        setJob(createdJob);
        clearDirty();
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      })
      .catch(() => {
        setSaveState('error');
      })
      .finally(() => {
        creatingDraftRef.current = false;
      });
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

  // Editing an existing job: wait for its data before rendering the form,
  // so fields don't flash empty and then populate.
  if (jobId && wizardLoading) {
    return <JobDetailsSkeleton />;
  }

  return (
    <JobDetailsForm
      format={format}
      onBackToFormat={() => setSubStep('format')}
      jobCreated={!!jobId}
      onSubmit={handleSubmit}
      onFieldSave={handleFieldSave}
      saveState={saveState}
      onRetrySave={retrySave}
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
              availabilityWindowStart: job.availabilityWindowStart,
              availabilityWindowEnd: job.availabilityWindowEnd,
              breakBetweenInterviews: job.breakBetweenInterviews,
            }
          : undefined
      }
    />
  );
}
