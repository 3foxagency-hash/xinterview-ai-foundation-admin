'use client';

import * as React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { WizardProvider, useWizard } from '@/components/wizard/wizard-context';
import { WizardRail } from '@/components/wizard/wizard-rail';
import { CompactWizardRail } from '@/components/wizard/compact-wizard-rail';
import { TopBar } from '@/components/wizard/top-bar';
import { MobileProgressHeader } from '@/components/wizard/mobile-progress-header';
import { CustomisationSubNav } from '@/components/wizard/customisation-subnav';
import { getStepNumberFromPath } from '@/lib/wizard-config';

const COMPACT_KEY = 'xinterview:wizard:rail-compact';

function CustomisationShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const jobIdParam = params?.id ?? null;
  const pathname = usePathname();
  const currentStep = getStepNumberFromPath(pathname);
  const { setJobId, jobId } = useWizard();
  const [compact, setCompact] = React.useState(false);

  React.useEffect(() => {
    if (jobIdParam) setJobId(jobIdParam);
  }, [jobIdParam, setJobId]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPACT_KEY);
      if (stored !== null) setCompact(stored === 'true');
    } catch {
      // ignore
    }
    // Default to compact below 1440px
    const updateFromWidth = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 1440) {
        setCompact(true);
      }
    };
    updateFromWidth();
  }, []);

  const expandRail = () => {
    setCompact(false);
    try {
      localStorage.setItem(COMPACT_KEY, 'false');
    } catch {
      // ignore
    }
  };

  const collapseRail = () => {
    setCompact(true);
    try {
      localStorage.setItem(COMPACT_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const completedSteps = React.useMemo(() => {
    if (!jobId) return [];
    const completed: number[] = [1];
    for (let i = 2; i < currentStep; i++) completed.push(i);
    return completed;
  }, [currentStep, jobId]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {compact ? (
        <CompactWizardRail
          currentStep={currentStep}
          completedSteps={completedSteps}
          onExpand={expandRail}
        />
      ) : (
        <div className="relative">
          <WizardRail currentStep={currentStep} completedSteps={completedSteps} />
          {/* Collapse button overlay — only when expanded and below 1440 */}
          <button
            type="button"
            onClick={collapseRail}
            aria-label="Collapse navigation"
            className="absolute -right-3 top-7 z-30 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:bg-card-hover hover:text-heading xl:flex 2xl:hidden"
          >
            <span className="text-xs">‹</span>
          </button>
        </div>
      )}

      {/* Sub-nav + content column */}
      <div className="flex min-w-0 flex-1 overflow-hidden">
        {jobId && <CustomisationSubNav jobId={jobId} />}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <MobileProgressHeader
            currentStep={currentStep}
            completedSteps={completedSteps}
            jobId={jobId}
          />
          <TopBar />
          <main className="flex-1 overflow-y-auto pb-28 md:pb-12">
            <div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function CustomisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WizardProvider>
      <CustomisationShell>{children}</CustomisationShell>
    </WizardProvider>
  );
}
