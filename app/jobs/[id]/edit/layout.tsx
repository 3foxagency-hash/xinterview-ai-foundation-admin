'use client';

import * as React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { WizardProvider, useWizard } from '@/components/wizard/wizard-context';
import { WizardHeader } from '@/components/wizard/wizard-header';
import { MobileStepBar } from '@/components/wizard/mobile-step-bar';
import { getStepNumberFromPath, WIZARD_STEPS } from '@/lib/wizard-config';
import { cn } from '@/lib/utils';

function EditShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const jobIdParam = params?.id ?? null;
  const pathname = usePathname();
  const currentStep = getStepNumberFromPath(pathname);
  const { setJobId, chromeMode, setChromeMode } = useWizard();

  React.useEffect(() => {
    if (jobIdParam) setJobId(jobIdParam);
  }, [jobIdParam, setJobId]);

  // Every post-creation step uses the same full-bleed 'wide' chrome as the
  // pre-creation Job Details page (app/jobs/new/layout.tsx) — otherwise
  // Questions/Team render inside the 1200px-capped 'default' shell while
  // Job Details/Customisation don't, and the left rail ends up starting at
  // a visibly different x-position from one step to the next.
  React.useLayoutEffect(() => {
    setChromeMode('wide');
    return () => setChromeMode('default');
  }, [setChromeMode]);

  const currentStepData = WIZARD_STEPS[currentStep - 1];

  return (
    <div className="flex min-h-0 flex-col bg-background">
      <WizardHeader />
      <MobileStepBar
        currentStep={currentStep}
        totalSteps={WIZARD_STEPS.length}
        stepLabel={currentStepData?.label ?? ''}
      />
      {/* min-h-0 lets a step opt into filling the viewport (Customisation
          does, so its two columns can scroll independently) while normal
          steps still scroll the page as a whole. */}
      <main className="flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            'flex w-full min-h-0 flex-1 flex-col px-4 py-4 md:px-8 md:py-6',
            chromeMode === 'default' && 'mx-auto max-w-[1200px]'
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WizardProvider>
      <EditShell>{children}</EditShell>
    </WizardProvider>
  );
}
