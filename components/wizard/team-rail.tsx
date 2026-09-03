'use client';

import * as React from 'react';
import { Users, Lightbulb } from 'lucide-react';
import type { JobTeamMember } from '@/lib/api/jobs';

interface TeamRailProps {
  /** Owner plus every assigned team member. */
  people: JobTeamMember[];
}

const ROLE_ORDER: JobTeamMember['role'][] = ['Admin', 'Manager', 'Executive'];

export function TeamRail({ people }: TeamRailProps) {
  const totalCount = people.length;

  const roleCounts = React.useMemo(() => {
    const counts: Partial<Record<JobTeamMember['role'], number>> = {};
    for (const p of people) {
      counts[p.role] = (counts[p.role] ?? 0) + 1;
    }
    return counts;
  }, [people]);

  const notifyOnCount = people.filter((p) => p.notifyOnComplete).length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        {/* Step header */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card-hover">
            <Users size={18} className="text-bodyText" />
          </div>
          <div>
            <h2 className="text-h3 text-heading">Team</h2>
            <p className="mt-0.5 text-body-sm text-muted">
              Choose who works on this job and who gets notified.
            </p>
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-heading">People on this job</span>
          <span className="text-body-sm font-semibold tabular-nums text-heading">
            {totalCount}
          </span>
        </div>

        {/* Role breakdown — only roles present */}
        <div className="mt-3 space-y-2">
          {ROLE_ORDER.filter((role) => roleCounts[role]).map((role) => (
            <div key={role} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={
                    role === 'Admin'
                      ? 'h-2 w-2 shrink-0 rounded-full bg-primary'
                      : role === 'Manager'
                        ? 'h-2 w-2 shrink-0 rounded-full bg-info'
                        : 'h-2 w-2 shrink-0 rounded-full bg-success'
                  }
                  aria-hidden
                />
                <span className="text-body-sm text-bodyText">{role}</span>
              </div>
              <span className="text-body-sm tabular-nums text-muted">{roleCounts[role]}</span>
            </div>
          ))}
        </div>

        <div className="my-3 h-px bg-border" />

        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-heading">Email notifications on</span>
          <span className="text-body-sm font-semibold tabular-nums text-heading">
            {notifyOnCount}
          </span>
        </div>
        <p className="mt-0.5 text-caption text-muted">of {totalCount} members</p>
      </div>

      {/* Tip card */}
      <div className="rounded-lg border border-primary/20 bg-active-menu-bg p-4">
        <div className="flex items-start gap-2.5">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <h3 className="text-body-sm font-semibold text-heading">Tip</h3>
            <p className="mt-0.5 text-body-sm text-muted">
              Everyone added here can see and edit this job, including candidate answers. Add
              only the people who need it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
