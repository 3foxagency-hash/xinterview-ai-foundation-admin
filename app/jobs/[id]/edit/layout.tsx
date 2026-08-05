'use client';

import * as React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { WizardProvider, useWizard } from '@/components/wizard/wizard-context';
import { WizardRail } from '@/components/wizard/wizard-rail';
import { TopBar } from '@/components/wizard/top-bar';
import { MobileProgressHeader } from '@/components/wizard/mobile-progress-header';
import { getStepNumberFromPath } from '@/lib/wizard-config';

function EditShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const jobIdParam = params?.id ?? null;
  const pathname = usePathname();
  const currentStep = getStepNumberFromPath(pathname);
  const { setJobId, jobId } = useWizard();

  React.useEffect(() => {
    if (jobIdParam) setJobId(jobIdParam);
  }, [jobIdParam, setJobId]);

  const completedSteps = React.useMemo(() => {
    if (!jobId) return [];
    const completed: number[] = [1];
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
        {/* min-h-0 lets a step opt into filling the viewport (Customisation
            does, so its two columns can scroll independently) while normal
            steps still scroll the page as a whole. */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-28 md:pb-12">
          <div className="mx-auto flex w-full min-h-0 max-w-[1040px] flex-1 flex-col px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
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
