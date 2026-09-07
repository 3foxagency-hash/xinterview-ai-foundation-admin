'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Palette, FileText, ListChecks, Shield, ClipboardCheck, Mail, CircleCheck as CheckCircle, Share2, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Circle, Lightbulb } from 'lucide-react';
import { useCustomisationPreview, type SectionState } from '@/components/wizard/customisation-preview-context';

type SubNavItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: (jobId: string) => string;
};

const NAV_ITEMS: SubNavItem[] = [
  { id: 'branding', label: 'Branding', description: 'Logo, colour and theme', icon: Palette, href: (id) => `/jobs/${id}/edit/customisation/branding` },
  { id: 'welcome', label: 'Welcome page', description: 'Headline, intro video and content', icon: FileText, href: (id) => `/jobs/${id}/edit/customisation/welcome` },
  { id: 'form', label: 'Form settings', description: 'What you collect from candidates', icon: ListChecks, href: (id) => `/jobs/${id}/edit/customisation/form` },
  { id: 'experience', label: 'Interview experience', description: 'Instructions and integrity settings', icon: Shield, href: (id) => `/jobs/${id}/edit/customisation/experience` },
  { id: 'evaluation', label: 'AI evaluation', description: 'How answers are scored', icon: ClipboardCheck, href: (id) => `/jobs/${id}/edit/customisation/evaluation` },
  { id: 'notifications', label: 'Emails and notifications', description: 'Candidate communication', icon: Mail, href: (id) => `/jobs/${id}/edit/customisation/notifications` },
  { id: 'thank-you', label: 'Thank you page', description: 'Completion message', icon: CheckCircle, href: (id) => `/jobs/${id}/edit/customisation/thank-you` },
  { id: 'social', label: 'Social preview', description: 'How the shared link looks', icon: Share2, href: (id) => `/jobs/${id}/edit/customisation/social` },
];

/** null when on the bare /customisation route — the section-list state. */
function getCurrentSection(pathname: string): string | null {
  for (const item of NAV_ITEMS) {
    if (pathname.includes(`/customisation/${item.id}`)) return item.id;
  }
  return null;
}

function StateIcon({ state }: { state: SectionState }) {
  if (state === 'complete') return <CheckCircle2 size={14} className="shrink-0 text-success" />;
  if (state === 'error') return <AlertCircle size={14} className="shrink-0 text-error" />;
  return <Circle size={14} className="shrink-0 text-muted/40" />;
}

function SubNavItemRow({
  item,
  jobId,
  state,
  onSelect,
}: {
  item: SubNavItem;
  jobId: string;
  state: SectionState;
  onSelect: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href(jobId)}
      onClick={onSelect}
      className="block focus-visible:rounded-lg"
    >
      <div className="relative flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-card-hover">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card-hover transition-colors">
          <Icon size={18} strokeWidth={1.5} className="text-muted" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-body font-semibold text-heading">{item.label}</span>
          <span className="text-body-sm text-muted">{item.description}</span>
        </div>
        <StateIcon state={state} />
      </div>
    </Link>
  );
}

interface CustomisationSubNavProps {
  jobId: string;
  /** The active section's form (e.g. <BrandingSection />). Rendered in place
   *  of the section list once a section is selected — undefined/null on the
   *  bare /customisation route, which shows the list instead. */
  children?: React.ReactNode;
}

function SectionListBody({ jobId }: { jobId: string }) {
  const { sectionStates, setActiveSection } = useCustomisationPreview();
  return (
    <>
      <div className="px-3">
        <h2 className="text-h3 text-heading">Customisation</h2>
        <p className="mt-1 text-body-sm text-muted">Personalise the candidate experience.</p>
      </div>

      <nav className="mt-5 space-y-1">
        {NAV_ITEMS.map((item) => (
          <SubNavItemRow
            key={item.id}
            item={item}
            jobId={jobId}
            state={sectionStates[item.id] ?? 'untouched'}
            onSelect={() => setActiveSection(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto px-3 pt-5">
        <div className="rounded-lg border border-primary/20 bg-active-menu-bg p-3">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-body-sm text-muted">
              A consistent brand experience helps candidates trust your company and finish the interview.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

interface CustomisationSubNavPropsFull extends CustomisationSubNavProps {
  currentSection: string | null;
}

function SectionDetailBody({ jobId, currentSection, children }: CustomisationSubNavPropsFull) {
  const item = NAV_ITEMS.find((n) => n.id === currentSection);
  return (
    <>
      <div className="px-3">
        <Link
          href={`/jobs/${jobId}/edit/customisation`}
          className="mb-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-muted transition-colors hover:text-heading"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <h2 className="text-h3 text-heading">{item?.label ?? 'Customisation'}</h2>
        {item?.description && (
          <p className="mt-1 text-body-sm text-muted">{item.description}</p>
        )}
      </div>
      <div className="mt-5 px-3">{children}</div>
    </>
  );
}

export function CustomisationSubNav({ jobId, children }: CustomisationSubNavProps) {
  const pathname = usePathname();
  const currentSection = getCurrentSection(pathname);
  const { setActiveSection } = useCustomisationPreview();

  return (
    <>
      {/* Mobile/tablet: horizontal scrolling tab strip — list state only,
          shown above the (single, shared) column below. */}
      {!currentSection && (
        <div
          className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-surface px-3 py-2 lg:hidden"
          aria-label="Customisation sections"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href(jobId)}
                onClick={() => setActiveSection(item.id)}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-body-sm font-medium text-muted transition-colors hover:bg-card-hover hover:text-heading"
              >
                <Icon size={16} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* The nav/form column — mounted exactly once regardless of viewport.
          `children` (a section's form, e.g. <BrandingSection />) owns
          network-loaded state and a preview-sync effect, so a second,
          viewport-conditional copy of it previously caused an infinite
          render loop (two instances racing to sync the same context
          slice). Sized as the 280px desktop rail at lg+, full width below
          it — one instance, repositioned by CSS, not duplicated by JSX. */}
      <aside
        className="flex w-full flex-col overflow-y-auto rounded-lg border border-border bg-surface px-3 py-5 lg:w-[280px] lg:shrink-0"
        aria-label="Customisation"
      >
        {currentSection ? (
          <SectionDetailBody jobId={jobId} currentSection={currentSection}>
            {children}
          </SectionDetailBody>
        ) : (
          <SectionListBody jobId={jobId} />
        )}
      </aside>
    </>
  );
}
