'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { WizardProvider, useWizard } from '@/components/wizard/wizard-context';
import { WizardRail } from '@/components/wizard/wizard-rail';
import { TopBar } from '@/components/wizard/top-bar';
import { MobileProgressHeader } from '@/components/wizard/mobile-progress-header';
import { getStepNumberFromPath } from '@/lib/wizard-config';

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WizardRail currentStep={currentStep} completedSteps={completedSteps} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileProgressHeader
          currentStep={currentStep}
          completedSteps={completedSteps}
          jobId={jobId}
        />
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-28 md:pb-12">
          <div className="mx-auto w-full max-w-[1040px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
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
