'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CustomisationSubNav } from '@/components/wizard/customisation-subnav';
import { StepFooter } from '@/components/wizard/step-footer';
import { CandidatePreviewPanel } from '@/components/wizard/candidate-preview-panel';
import {
  CustomisationSaveProvider,
  useCustomisationRegistry,
} from '@/components/wizard/customisation-save-registry';
import { Monitor, Eye } from 'lucide-react';

export default function CustomisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;

  return (
    <CustomisationSaveProvider>
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-1 flex-col lg:min-h-0 lg:flex-row lg:gap-6 lg:overflow-hidden">
          {jobId && <CustomisationSubNav jobId={jobId} />}
          {/* Editor pane */}
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-[var(--background-200)] p-5 lg:h-full lg:overflow-y-auto">
            {children}
          </div>
          {/* Live preview pane — desktop only */}
          <div className="hidden shrink-0 flex-col xl:flex xl:w-[360px]">
            <div className="mb-2 flex items-center gap-2 px-1">
              <Eye size={15} className="text-primary" strokeWidth={1.5} />
              <span className="text-body-sm font-semibold text-heading">Live preview</span>
              <span className="ml-auto flex items-center gap-1 text-caption text-muted">
                <Monitor size={13} strokeWidth={1.5} />
                Candidate view
              </span>
            </div>
            <div className="flex-1 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <CandidatePreviewPanel />
            </div>
          </div>
        </div>
        {jobId && <CustomisationFooter jobId={jobId} />}
      </div>
    </CustomisationSaveProvider>
  );
}

function CustomisationFooter({ jobId }: { jobId: string }) {
  const router = useRouter();
  const registry = useCustomisationRegistry();
  const [saving, setSaving] = React.useState(false);

  const handleNext = async () => {
    setSaving(true);
    try {
      await registry?.saveAll();
      router.push(`/jobs/${jobId}/edit/invite`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 shrink-0 border-t border-border pt-5">
      <StepFooter
        onCancel={() => router.push(`/jobs/${jobId}/edit/teams`)}
        onNext={handleNext}
        nextLabel="Next: Invite candidates"
        nextLoading={saving}
      />
    </div>
  );
}
