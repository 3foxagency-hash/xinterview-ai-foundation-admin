'use client';

import * as React from 'react';
import { Info, GitBranch } from 'lucide-react';
import { SettingsSection } from '@/components/settings/settings-section';
import { features } from '@/lib/constants/features';

/** Mirrors the default pipeline in the live product. */
const DEFAULT_STAGES = [
  { name: 'Invited', description: 'Candidate has been invited to the interview.' },
  { name: 'In progress', description: 'Candidate is completing their interview.' },
  { name: 'Review', description: 'Interview is complete and awaiting review.' },
  { name: 'Shortlisted', description: 'Candidate has been shortlisted.' },
  { name: 'Live interview', description: 'Candidate has moved to a live interview.' },
  { name: 'Hired', description: 'Candidate has been hired.' },
  { name: 'Rejected', description: 'Candidate has been rejected.' },
];

export default function StagesPage() {
  return (
    <div className="space-y-6">
      <SettingsSection
        title="Stages"
        description="The pipeline stages candidates move through."
      >
        {/* Info panel */}
        <div className="flex items-start gap-2 bg-active-menu-bg/30 px-4 py-4">
          <Info size={16} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-body-sm text-heading">
              Custom stages are not available yet.
            </p>
            <p className="mt-1 text-body-sm text-muted">
              The stages below are the default pipeline. Every candidate moves through them automatically.
            </p>
          </div>
        </div>

        {/* Read-only stage list */}
        <div className="divide-y divide-border">
          {DEFAULT_STAGES.map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card-hover">
                <GitBranch size={16} className="text-muted" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-caption tabular-nums text-muted">
                    {i + 1}
                  </span>
                  <span className="text-body font-medium text-heading">{stage.name}</span>
                </div>
                <p className="mt-1 text-body-sm text-muted">{stage.description}</p>
              </div>
              {!features.customStages && (
                <span className="text-caption text-muted">Default</span>
              )}
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
