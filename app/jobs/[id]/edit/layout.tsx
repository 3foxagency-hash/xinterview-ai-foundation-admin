'use client';

import * as React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { WizardProvider, useWizard } from '@/components/wizard/wizard-context';
import { WizardHeader } from '@/components/wizard/wizard-header';
import { MobileStepBar } from '@/components/wizard/mobile-step-bar';
import { getStepNumberFromPath, WIZARD_STEPS } from '@/lib/wizard-config';

function EditShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const jobIdParam = params?.id ?? null;
  const pathname = usePathname();
  const currentStep = getStepNumberFromPath(pathname);
  const { setJobId } = useWizard();

  React.useEffect(() => {
    if (jobIdParam) setJobId(jobIdParam);
  }, [jobIdParam, setJobId]);

  const currentStepData = WIZARD_STEPS[currentStep - 1];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <WizardHeader />
      <MobileStepBar
        currentStep={currentStep}
        totalSteps={WIZARD_STEPS.length}
        stepLabel={currentStepData?.label ?? ''}
      />
      {/* min-h-0 lets a step opt into filling the viewport (Customisation
          does, so its two columns can scroll independently) while normal
          steps still scroll the page as a whole. */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-28 md:pb-12">
        <div className="mx-auto flex w-full min-h-0 max-w-[1040px] flex-1 flex-col px-4 py-6 md:px-8 md:py-8">
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
