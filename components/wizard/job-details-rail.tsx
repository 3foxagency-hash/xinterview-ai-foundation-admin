'use client';

import * as React from 'react';
import { CircleAlert as AlertCircle, Info, Lightbulb, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

export type RailSectionStatus = 'complete' | 'incomplete' | 'in_progress' | 'error';

export interface RailSection {
  id: string;
  label: string;
  caption: string;
  status: RailSectionStatus;
  icon: LucideIcon;
}

interface JobDetailsRailProps {
  sections: RailSection[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export function JobDetailsRail({ sections, activeSection, onSectionClick }: JobDetailsRailProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-h3 text-heading">Job Details</h2>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-muted" />
              </TooltipTrigger>
              <TooltipContent>What candidates see on the interview landing page.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="mt-1 text-body-sm text-muted">
          Add the role information and job requirements.
        </p>

        <p className="mb-2 mt-4 text-caption font-semibold uppercase tracking-wide text-muted">
          Sections
        </p>
        <nav className="space-y-2" aria-label="Job details sections">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSectionClick(section.id)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                  isActive
                    ? 'border-primary bg-active-menu-bg'
                    : 'border-border bg-surface hover:border-primary/30 hover:bg-card-hover'
                )}
              >
                <span
                  className={cn(
                    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    section.status === 'error'
                      ? 'bg-error-wash text-error-ink'
                      : isActive
                        ? 'bg-active-menu-bg text-primary'
                        : 'bg-card-hover text-muted'
                  )}
                  aria-hidden
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {section.status === 'error' && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-error-foreground">
                      <AlertCircle size={10} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-body-sm font-semibold',
                      isActive ? 'text-primary' : 'text-heading'
                    )}
                  >
                    {section.label}
                  </span>
                  <span className="block text-caption text-muted">{section.caption}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tip card */}
      <div className="rounded-lg border border-primary/20 bg-active-menu-bg p-4">
        <div className="flex items-start gap-2.5">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <h3 className="text-body-sm font-semibold text-heading">Tip</h3>
            <p className="mt-0.5 text-body-sm text-muted">
              Clear role details help attract the right candidates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
