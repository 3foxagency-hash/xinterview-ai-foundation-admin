'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { CustomisationSubNav } from '@/components/wizard/customisation-subnav';

/**
 * Customisation renders INSIDE app/jobs/[id]/edit/layout.tsx, which already
 * provides the WizardProvider, step rail, mobile header, top bar and the
 * content column. This layout contributes only the section sub-nav.
 *
 * From lg up the two columns are the same height and scroll independently, so
 * the nav never ends up shorter than a long section — matching the shape of
 * the existing product.
 */
export default function CustomisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col lg:min-h-0 lg:flex-row lg:gap-6">
      {jobId && <CustomisationSubNav jobId={jobId} />}
      <div className="min-w-0 flex-1 lg:overflow-y-auto lg:pr-1">{children}</div>
    </div>
  );
}
