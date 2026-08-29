'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type RailSectionStatus = 'complete' | 'incomplete' | 'in_progress';

export interface RailSection {
  id: string;
  label: string;
  caption: string;
  status: RailSectionStatus;
}

interface JobDetailsRailProps {
  sections: RailSection[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export function JobDetailsRail({ sections, activeSection, onSectionClick }: JobDetailsRailProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-h3 text-heading">Job details</h2>
        <p className="mt-1 text-body-sm text-muted">
          Add the role information and job requirements.
        </p>
      </div>
      <nav className="space-y-1" aria-label="Job details sections">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSectionClick(section.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
              activeSection === section.id
                ? 'bg-active-menu-bg'
                : 'hover:bg-card-hover'
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-bold tabular-nums',
                section.status === 'complete'
                  ? 'bg-success text-success-foreground'
                  : section.status === 'in_progress'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border-strong text-muted'
              )}
              aria-hidden
            >
              {section.status === 'complete' ? '✓' : ''}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  'block text-body-sm font-semibold',
                  activeSection === section.id ? 'text-primary' : 'text-heading'
                )}
              >
                {section.label}
              </span>
              <span className="block text-caption text-muted">{section.caption}</span>
            </div>
          </button>
        ))}
      </nav>
      <div className="rounded-lg bg-active-menu-bg px-4 py-3">
        <p className="text-body-sm text-muted">
          Clear role details help attract the right candidates.
        </p>
      </div>
    </div>
  );
}
