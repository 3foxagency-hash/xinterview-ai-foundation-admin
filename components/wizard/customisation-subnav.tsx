'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Palette, FileText, ListChecks, Shield, ClipboardCheck, Mail, CircleCheck as CheckCircle, Share2, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Circle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
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

function getCurrentSection(pathname: string): string {
  for (const item of NAV_ITEMS) {
    if (pathname.includes(`/customisation/${item.id}`)) return item.id;
  }
  return 'branding';
}

function StateIcon({ state }: { state: SectionState }) {
  if (state === 'complete') return <CheckCircle2 size={14} className="shrink-0 text-success" />;
  if (state === 'error') return <AlertCircle size={14} className="shrink-0 text-error" />;
  return <Circle size={14} className="shrink-0 text-muted/40" />;
}

function SubNavItemRow({
  item,
  isActive,
  jobId,
  state,
  onSelect,
}: {
  item: SubNavItem;
  isActive: boolean;
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
      aria-current={isActive ? 'page' : undefined}
    >
      <div
        className={cn(
          'relative flex items-center gap-3 rounded-lg p-3 transition-colors',
          isActive && 'bg-active-menu-bg',
          !isActive && 'hover:bg-card-hover'
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-[calc(100%-8px)] w-[3px] -translate-y-1/2 rounded-full bg-primary" />
        )}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors',
            isActive ? 'bg-primary' : 'bg-card-hover'
          )}
        >
          <Icon
            size={18}
            strokeWidth={1.5}
            className={isActive ? 'text-primary-foreground' : 'text-muted'}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              'text-body font-semibold',
              isActive ? 'text-primary' : 'text-heading'
            )}
          >
            {item.label}
          </span>
          <span className="text-body-sm text-muted">{item.description}</span>
        </div>
        <StateIcon state={state} />
      </div>
    </Link>
  );
}

interface CustomisationSubNavProps {
  jobId: string;
}

export function CustomisationSubNav({ jobId }: CustomisationSubNavProps) {
  const pathname = usePathname();
  const currentSection = getCurrentSection(pathname);
  const { sectionStates, setActiveSection } = useCustomisationPreview();

  return (
    <>
      {/* Desktop nav */}
      <aside
        className="hidden w-[260px] shrink-0 flex-col overflow-y-auto rounded-lg border border-border bg-surface px-3 py-5 lg:flex"
        aria-label="Customisation sections"
      >
        <div className="px-3">
          <h2 className="text-h3 text-heading">Customisation</h2>
          <p className="mt-1 text-body-sm text-muted">Personalise the candidate experience.</p>
        </div>

        <nav className="mt-5 space-y-1">
          {NAV_ITEMS.map((item) => (
            <SubNavItemRow
              key={item.id}
              item={item}
              isActive={currentSection === item.id}
              jobId={jobId}
              state={sectionStates[item.id] ?? 'untouched'}
              onSelect={() => setActiveSection(item.id)}
            />
          ))}
        </nav>

        <div className="mt-auto px-3 pt-5">
          <div className="rounded-lg border border-border bg-muted-bg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-warning" />
              <p className="text-body-sm text-muted">
                A consistent brand experience helps candidates trust your company and finish the interview.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile/tablet: horizontal scrolling tab strip */}
      <div
        className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-surface px-3 py-2 lg:hidden"
        aria-label="Customisation sections"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <Link
              key={item.id}
              href={item.href(jobId)}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors',
                isActive
                  ? 'bg-active-menu-bg text-primary'
                  : 'text-muted hover:bg-card-hover hover:text-heading'
              )}
            >
              <Icon size={16} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
