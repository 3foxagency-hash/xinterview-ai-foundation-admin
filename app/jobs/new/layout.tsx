'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { WizardProvider, useWizard } from '@/components/wizard/wizard-context';
import { WizardHeader } from '@/components/wizard/wizard-header';
import { MobileStepBar } from '@/components/wizard/mobile-step-bar';
import { getStepNumberFromPath, WIZARD_STEPS } from '@/lib/wizard-config';

function WizardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = getStepNumberFromPath(pathname);
  const { jobId } = useWizard();

  const completedSteps = React.useMemo(() => {
    const completed: number[] = [];
    if (jobId && currentStep > 1) completed.push(1);
    for (let i = 2; i < currentStep; i++) completed.push(i);
    return completed;
  }, [currentStep, jobId]);

  const currentStepData = WIZARD_STEPS[currentStep - 1];

  return (
    <div className="flex min-h-0 flex-col bg-background">
      <WizardHeader />
      <MobileStepBar
        currentStep={currentStep}
        totalSteps={WIZARD_STEPS.length}
        stepLabel={currentStepData?.label ?? ''}
      />
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 py-4 md:px-8 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WizardProvider>
      <WizardShell>{children}</WizardShell>
    </WizardProvider>
  );
}
