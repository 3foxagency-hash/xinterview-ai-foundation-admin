'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CustomisationSubNav } from '@/components/wizard/customisation-subnav';
import { StepFooter } from '@/components/wizard/step-footer';
import {
  CustomisationSaveProvider,
  useCustomisationRegistry,
} from '@/components/wizard/customisation-save-registry';

/**
 * Customisation renders INSIDE app/jobs/[id]/edit/layout.tsx, which already
 * provides the WizardProvider, step rail, mobile header, top bar and the
 * content column. This layout contributes the section sub-nav and the single
 * step footer.
 *
 * The footer belongs here rather than in each section: customisation is one
 * wizard step made of many panels, so it gets one commit action like Questions
 * and Team do, not a Save button per panel.
 */
export default function CustomisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;

  return (
    <CustomisationSaveProvider>
      {/* Column stack: the two panes on top, then one footer spanning both.
          Keeping the footer outside the scrolling content column means it sits
          on the page's own baseline rather than tracking the right pane. */}
      {/* min-h-0 on the stack and the row is what makes the columns scroll
          themselves instead of stretching the page: without it a tall right
          pane grows past the viewport and <main> takes over the scrolling. */}
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-1 flex-col lg:min-h-0 lg:flex-row lg:gap-6 lg:overflow-hidden">
          {jobId && <CustomisationSubNav jobId={jobId} />}
          <div className="min-w-0 flex-1 lg:h-full lg:overflow-y-auto lg:pr-1">
            {children}
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
      // Commits whatever is pending across the customisation step. When the
      // real API lands this becomes the single batched request.
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
