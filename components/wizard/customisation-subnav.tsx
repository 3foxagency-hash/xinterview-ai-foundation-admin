'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Palette,
  FileText,
  ListChecks,
  CheckCircle,
  Share2,
  Shield,
  Mail,
  ClipboardCheck,
  Tags,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

type SubNavSection = {
  id: string;
  label: string;
  items: SubNavItem[];
};

type SubNavItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: (jobId: string) => string;
  hasError?: boolean;
};

const SECTIONS: SubNavSection[] = [
  {
    id: 'candidate-experience',
    label: 'Candidate experience',
    items: [
      { id: 'branding', label: 'Branding', description: 'Logo, colours & theme', icon: Palette, href: (id) => `/jobs/${id}/edit/customisation/branding` },
      { id: 'welcome', label: 'Welcome page', description: 'Headline, intro video & content', icon: FileText, href: (id) => `/jobs/${id}/edit/customisation/welcome` },
      { id: 'form', label: 'Form settings', description: 'Fields & information', icon: ListChecks, href: (id) => `/jobs/${id}/edit/customisation/form` },
      { id: 'thank-you', label: 'Thank you page', description: 'Completion message', icon: CheckCircle, href: (id) => `/jobs/${id}/edit/customisation/thank-you` },
      { id: 'social', label: 'Social preview', description: 'Link preview settings', icon: Share2, href: (id) => `/jobs/${id}/edit/customisation/social` },
    ],
  },
  {
    id: 'interview',
    label: 'Interview',
    items: [
      { id: 'experience', label: 'Interview experience', description: 'Instructions & integrity settings', icon: Shield, href: (id) => `/jobs/${id}/edit/customisation/experience` },
      { id: 'notifications', label: 'Emails & notifications', description: 'Candidate communication', icon: Mail, href: (id) => `/jobs/${id}/edit/customisation/notifications` },
    ],
  },
  {
    id: 'evaluation',
    label: 'Evaluation',
    items: [
      { id: 'evaluation', label: 'AI evaluation', description: 'Scoring criteria & weighting', icon: ClipboardCheck, href: (id) => `/jobs/${id}/edit/customisation/evaluation` },
      { id: 'scoring', label: 'Scoring labels', description: 'Score bands & naming', icon: Tags, href: (id) => `/jobs/${id}/edit/customisation/scoring` },
      { id: 'stages', label: 'Stages', description: 'Pipeline stages', icon: GitBranch, href: (id) => `/jobs/${id}/edit/customisation/stages` },
    ],
  },
];

function getCurrentSection(pathname: string): string {
  for (const section of SECTIONS) {
    for (const item of section.items) {
      if (pathname.includes(`/customisation/${item.id}`)) return item.id;
    }
  }
  return 'branding';
}

function SubNavItemRow({
  item,
  isActive,
  jobId,
  sectionIndex,
  itemIndex,
}: {
  item: SubNavItem;
  isActive: boolean;
  jobId: string;
  sectionIndex: number;
  itemIndex: number;
}) {
  const Icon = item.icon;
  const content = (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-lg p-3 transition-colors',
        isActive && 'bg-active-menu-bg',
        !isActive && 'hover:bg-card-hover'
      )}
    >
      {/* Left bar for active */}
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
      {item.hasError && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Has unresolved required fields" />
      )}
    </div>
  );

  return (
    <Link
      href={item.href(jobId)}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg"
      aria-current={isActive ? 'page' : undefined}
    >
      {content}
    </Link>
  );
}

interface CustomisationSubNavProps {
  jobId: string;
  sectionErrors?: Record<string, boolean>;
}

export function CustomisationSubNav({ jobId, sectionErrors }: CustomisationSubNavProps) {
  const pathname = usePathname();
  const currentSection = getCurrentSection(pathname);

  return (
    <>
      {/* Desktop sub-nav — fixed width sidebar */}
      <aside
        className="sticky top-0 hidden h-screen w-[280px] shrink-0 overflow-y-auto border-r border-border bg-surface px-3 py-6 md:block"
        aria-label="Customisation sections"
      >
        <div className="px-3">
          <h2 className="text-h2 text-heading">Customisation</h2>
          <p className="mt-1 text-body-sm text-muted">Personalise the candidate experience</p>
        </div>

        <div className="mt-6 space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.id}>
              <p className="mb-3 px-3 text-caption font-medium uppercase tracking-wider text-muted">
                {section.label}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <SubNavItemRow
                    key={item.id}
                    item={{
                      ...item,
                      hasError: sectionErrors?.[item.id],
                    }}
                    isActive={currentSection === item.id}
                    jobId={jobId}
                    sectionIndex={0}
                    itemIndex={0}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile/tablet: horizontal scrolling tab strip */}
      <div
        className="flex items-center gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-3 md:hidden"
        aria-label="Customisation sections"
      >
        {SECTIONS.flatMap((section) => section.items).map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <Link
              key={item.id}
              href={item.href(jobId)}
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
