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
  const isCustomisation = pathname.includes('/customisation');
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
    <div className={cn('flex flex-col bg-background', isCustomisation ? 'h-dvh min-h-0' : 'min-h-0')}>
      <WizardHeader />
      <MobileStepBar
        currentStep={currentStep}
        totalSteps={WIZARD_STEPS.length}
        stepLabel={currentStepData?.label ?? ''}
      />
      {/* Customisation is pinned to the viewport height (h-dvh above) so its
          two columns can each scroll independently within a bounded box.
          Every other step leaves height unconstrained and scrolls the page
          as a whole — min-h-0 here only lets flex children shrink, it does
          not itself create a scroll boundary. */}
      <main className={cn('flex flex-1 flex-col', isCustomisation ? 'min-h-0 overflow-hidden' : 'min-h-0')}>
        <div
          className={cn(
            'flex w-full min-h-0 flex-1 flex-col px-4 py-4 md:px-8 md:py-6',
            chromeMode === 'default' && 'mx-auto max-w-[1200px]',
            isCustomisation && 'overflow-hidden'
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
