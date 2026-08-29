'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWizard } from '@/components/wizard/wizard-context';
import { StepFooter } from '@/components/wizard/step-footer';
import { InviteNav, type InviteSectionId, type NavIndicator } from '@/components/wizard/invite-nav';
import { InviteSummaryRail } from '@/components/wizard/invite-summary-rail';
import { ShareLinkCard } from '@/components/wizard/share-link-card';
import { EmailInviteCard } from '@/components/wizard/email-invite-card';
import { BulkUploadCard } from '@/components/wizard/bulk-upload-card';
import { AtsImportCard } from '@/components/wizard/ats-import-card';
import { InviteHistoryCard } from '@/components/wizard/invite-history-card';
import { PublishDialog, type PublishSummaryData } from '@/components/wizard/publish-dialog';
import {
  getJob,
  getJobTeam,
  getQuestions,
  getBranding,
  getPlanInfo,
  type JobTeamMember,
  type Question,
} from '@/lib/api/jobs';
import {
  getLinkSettings,
  getCustomFields,
  getInviteCandidates,
  type LinkSettings,
  type CustomField,
  type InviteCandidate,
} from '@/lib/api/invites';
import { parseTimeToSeconds } from '@/lib/constants/question-types';
import { track } from '@/lib/utils/analytics';

const SECTIONS: InviteSectionId[] = ['share-link', 'email-invite', 'bulk-upload', 'ats-import', 'invite-history'];

export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const { job, setJob } = useWizard();

  const [loading, setLoading] = React.useState(true);
  const [team, setTeam] = React.useState<JobTeamMember[]>([]);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [brandingConfigured, setBrandingConfigured] = React.useState(false);
  const [atsAllowedByPlan, setAtsAllowedByPlan] = React.useState(true);
  const [linkSettings, setLinkSettings] = React.useState<LinkSettings | null>(null);
  const [customFields, setCustomFields] = React.useState<CustomField[]>([]);
  const [candidates, setCandidates] = React.useState<InviteCandidate[]>([]);

  const [activeSection, setActiveSection] = React.useState<InviteSectionId>('share-link');
  const [publishOpen, setPublishOpen] = React.useState(false);

  const sectionRefs = React.useRef<Record<InviteSectionId, HTMLElement | null>>({
    'share-link': null,
    'email-invite': null,
    'bulk-upload': null,
    'ats-import': null,
    'invite-history': null,
  });

  React.useEffect(() => {
    track('wizard_step_viewed', { step: 5 });
  }, []);

  React.useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    Promise.all([
      getJobTeam(jobId),
      getQuestions(jobId),
      getBranding(jobId),
      getPlanInfo(),
      getLinkSettings(jobId),
      getCustomFields(jobId),
      getInviteCandidates(jobId),
    ])
      .then(([teamData, questionData, branding, plan, link, fields, invites]) => {
        setTeam(teamData);
        setQuestions(questionData);
        setBrandingConfigured(!!branding.companyTitle?.trim() || !!branding.logoUrl?.trim());
        setAtsAllowedByPlan(plan.atsImport);
        setLinkSettings(link);
        setCustomFields(fields);
        setCandidates(invites);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  // ─── Scroll-spy ───
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id as InviteSectionId;
          if (SECTIONS.includes(id)) setActiveSection(id);
        }
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 }
    );
    for (const id of SECTIONS) {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [loading]);

  const handleNavigate = (id: InviteSectionId) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    setActiveSection(id);
  };

  const isDraft = job?.status !== 'active';

  const estimatedSeconds = questions.reduce((sum, q) => {
    return sum + parseTimeToSeconds(q.thinkingTime) + parseTimeToSeconds(q.answerTime);
  }, 0);
  const estimatedMinutes = questions.length > 0 ? Math.ceil(estimatedSeconds / 60) : null;
  const interviewDuration = parseInt(job?.interviewDuration ?? '30', 10);

  const indicators: Record<InviteSectionId, NavIndicator> = {
    'share-link': linkSettings?.active ? 'complete' : isDraft ? 'active' : 'neutral',
    'email-invite': candidates.some((c) => c.method === 'email') ? 'complete' : 'neutral',
    'bulk-upload': candidates.some((c) => c.method === 'bulk') ? 'active' : 'neutral',
    'ats-import': candidates.some((c) => c.method === 'ats') ? 'complete' : 'neutral',
    'invite-history': 'neutral',
  };

  const publishData: PublishSummaryData | null =
    jobId && job
      ? {
          jobId,
          title: job.title,
          format: job.format,
          questionCount: questions.length,
          estimatedMinutes: estimatedMinutes ?? 0,
          interviewDuration,
          teamSize: team.length,
          inviteCount: candidates.length,
        }
      : null;

  const handlePublished = async () => {
    if (!jobId) return;
    const [updatedJob, link, invites] = await Promise.all([
      getJob(jobId),
      getLinkSettings(jobId),
      getInviteCandidates(jobId),
    ]);
    setJob(updatedJob);
    setLinkSettings(link);
    setCandidates(invites);
  };

  const registerSection = (sectionId: InviteSectionId) => (el: HTMLDivElement | null) => {
    sectionRefs.current[sectionId] = el;
  };

  if (loading || !jobId) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_300px]">
        <div className="hidden h-64 animate-pulse rounded-lg border border-border bg-card-hover md:block" />
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-lg border border-border bg-card-hover" />
          <div className="h-40 animate-pulse rounded-lg border border-border bg-card-hover" />
        </div>
        <div className="hidden h-64 animate-pulse rounded-lg border border-border bg-card-hover xl:block" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-20">
      {/* Mobile / tablet horizontal switcher */}
      <div className="md:hidden">
        <InviteNav activeSection={activeSection} indicators={indicators} onNavigate={handleNavigate} variant="compact" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_300px]">
        {/* Column 1 — nav (desktop) */}
        <div className="hidden md:block">
          <div className="sticky top-4">
            <InviteNav activeSection={activeSection} indicators={indicators} onNavigate={handleNavigate} />
          </div>
        </div>

        {/* Column 2 — methods */}
        <div className="min-w-0 space-y-6">
          <div ref={registerSection('share-link')}>
            <ShareLinkCard
              id="share-link"
              jobId={jobId}
              isDraft={isDraft}
              candidateUrl={job?.candidateUrl ?? ''}
              applicationDeadline={job?.applicationDeadline ?? ''}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-caption font-medium text-muted">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div ref={registerSection('email-invite')}>
            <EmailInviteCard
              id="email-invite"
              jobId={jobId}
              candidates={candidates}
              customFields={customFields}
              onCustomFieldsChanged={setCustomFields}
              onCandidatesChanged={setCandidates}
            />
          </div>

          <div ref={registerSection('bulk-upload')}>
            <BulkUploadCard
              id="bulk-upload"
              jobId={jobId}
              candidates={candidates}
              customFields={customFields}
              onCandidatesChanged={setCandidates}
            />
          </div>

          <div ref={registerSection('ats-import')}>
            <AtsImportCard
              id="ats-import"
              jobId={jobId}
              atsAllowedByPlan={atsAllowedByPlan}
              candidates={candidates}
              onCandidatesChanged={setCandidates}
            />
          </div>

          <div ref={registerSection('invite-history')}>
            <InviteHistoryCard
              id="invite-history"
              jobId={jobId}
              candidates={candidates}
              onCandidatesChanged={setCandidates}
            />
          </div>

          {/* Summary — inline below methods under xl */}
          <div className="xl:hidden">
            <InviteSummaryRail
              jobId={jobId}
              candidates={candidates}
              linkSettings={linkSettings}
              hasTitleAndDescription={!!job?.title?.trim() && !!job?.description?.trim()}
              hasQuestions={questions.length > 0}
              estimatedMinutes={estimatedMinutes}
              brandingConfigured={brandingConfigured}
            />
          </div>
        </div>

        {/* Column 3 — summary (desktop, sticky) */}
        <div className="hidden xl:block">
          <div className="sticky top-4">
            <InviteSummaryRail
              jobId={jobId}
              candidates={candidates}
              linkSettings={linkSettings}
              hasTitleAndDescription={!!job?.title?.trim() && !!job?.description?.trim()}
              hasQuestions={questions.length > 0}
              estimatedMinutes={estimatedMinutes}
              brandingConfigured={brandingConfigured}
            />
          </div>
        </div>
      </div>

      <StepFooter
        onBack={() => router.push(`/jobs/${jobId}/edit/customisation`)}
        backLabel="Back to customisation"
        onNext={() => setPublishOpen(true)}
        nextLabel="Review and publish"
      />

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        data={publishData}
        onPublished={handlePublished}
      />
    </div>
  );
}
