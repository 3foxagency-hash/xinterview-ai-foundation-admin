'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { CustomisationSubNav } from '@/components/wizard/customisation-subnav';
import { StepFooter } from '@/components/wizard/step-footer';
import {
  CustomisationSaveProvider,
  useCustomisationRegistry,
} from '@/components/wizard/customisation-save-registry';
import {
  CustomisationPreviewProvider,
  useCustomisationPreview,
} from '@/components/wizard/customisation-preview-context';
import { CustomisationPreviewPanel } from '@/components/wizard/customisation-preview-panel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export default function CustomisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;

  return (
    <CustomisationSaveProvider>
      <CustomisationPreviewProvider jobTitle="Senior Product Designer">
        <CustomisationShell jobId={jobId}>{children}</CustomisationShell>
      </CustomisationPreviewProvider>
    </CustomisationSaveProvider>
  );
}

function CustomisationShell({ jobId, children }: { jobId: string | null; children: React.ReactNode }) {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const { blockingSections } = useCustomisationPreview();

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      {/* Three columns: nav | settings | preview.
          Below xl (1280px) the preview becomes a sheet toggle.
          Below lg (900px) the nav becomes a compact strip. */}
      <div className="flex min-w-0 flex-1 flex-col lg:min-h-0 lg:flex-row lg:gap-4 lg:overflow-hidden">
        {jobId && <CustomisationSubNav jobId={jobId} />}

        {/* Settings column — capped at 560px (narrow enough to hand the
            preview real room, wide enough that its label/field rows don't
            wrap awkwardly) so the preview, which is what actually shows the
            effect of these settings, gets the lion's share of the width. */}
        <div className="min-w-0 flex-1 rounded-lg border border-border bg-[var(--background-200)] p-5 lg:h-full lg:w-[560px] lg:flex-none lg:overflow-y-auto">
          {children}
        </div>

        {/* Preview column — visible only on xl+, grows to fill remaining width */}
        <CustomisationPreviewPanel />

        {/* Preview toggle for below xl */}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="fixed bottom-6 right-6 z-sticky inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-button font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary-hover xl:hidden"
          aria-label="Open preview"
        >
          <Eye size={16} />
          Preview
        </button>
      </div>

      {/* Footer */}
      {jobId && <CustomisationFooter jobId={jobId} blockingSections={blockingSections} />}

      {/* Preview sheet for below xl */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Preview</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden p-4">
            <PreviewSheetContent />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PreviewSheetContent() {
  return (
    <div className="h-full overflow-y-auto">
      <CustomisationPreviewPanel />
    </div>
  );
}

function CustomisationFooter({
  jobId,
  blockingSections,
}: {
  jobId: string;
  blockingSections: string[];
}) {
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

  const isBlocked = blockingSections.length > 0;

  return (
    <div className="mt-4 shrink-0 border-t border-border pt-4">
      {isBlocked && (
        <p className="mb-3 text-body-sm text-error">
          Fix{' '}
          {blockingSections.map((s, i) => (
            <React.Fragment key={s}>
              <a
                href={`/jobs/${jobId}/edit/customisation/${s}`}
                className="font-medium underline"
              >
                {s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </a>
              {i < blockingSections.length - 2 ? ', ' : i === blockingSections.length - 2 ? ' and ' : ''}
            </React.Fragment>
          ))}
          {' '}
          to continue.
        </p>
      )}
      <StepFooter
        onBack={() => router.push(`/jobs/${jobId}/edit/teams`)}
        backLabel="Back to Team"
        onNext={handleNext}
        nextLabel="Continue to invite candidates"
        nextLoading={saving}
        nextDisabled={isBlocked}
        nextTooltip={isBlocked ? 'Resolve blocking errors to continue' : undefined}
      />
    </div>
  );
}
