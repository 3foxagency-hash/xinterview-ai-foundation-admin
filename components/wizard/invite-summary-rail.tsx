'use client';

import Link from 'next/link';
import { Check, X, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InviteCandidate, LinkSettings } from '@/lib/api/invites';

interface InviteSummaryRailProps {
  jobId: string;
  candidates: InviteCandidate[];
  linkSettings: LinkSettings | null;
  hasTitleAndDescription: boolean;
  hasQuestions: boolean;
  estimatedMinutes: number | null;
  brandingConfigured: boolean;
}

export function InviteSummaryRail({
  jobId,
  candidates,
  linkSettings,
  hasTitleAndDescription,
  hasQuestions,
  estimatedMinutes,
  brandingConfigured,
}: InviteSummaryRailProps) {
  const emailCount = candidates.filter((c) => c.method === 'email').length;
  const bulkCount = candidates.filter((c) => c.method === 'bulk').length;
  const atsCount = candidates.filter((c) => c.method === 'ats').length;
  const total = candidates.length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-body-sm font-semibold text-heading">Invitation summary</h3>

        <div className="mt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-bodyText">Share link</span>
            <span className={cn('text-body-sm font-medium', linkSettings?.active ? 'text-success' : 'text-muted')}>
              {linkSettings?.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-bodyText">Email invites</span>
            <span className="text-body-sm tabular-nums text-heading">{emailCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-bodyText">Bulk upload</span>
            <span className="text-body-sm tabular-nums text-heading">{bulkCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-bodyText">Imported from ATS</span>
            <span className="text-body-sm tabular-nums text-heading">{atsCount}</span>
          </div>
        </div>

        <div className="my-3 h-px bg-border" />

        <div className="flex items-center justify-between">
          <span className="text-body-sm font-semibold text-heading">Total invitations</span>
          <span className="text-h3 font-semibold tabular-nums text-heading">{total}</span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface p-4">
        <Mail size={15} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-body-sm text-muted">
          Candidates get an email with the interview details and a link to start.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-body-sm font-semibold text-heading">What candidates will see</h3>
        <ul className="mt-3 space-y-2.5">
          <li className="flex items-start gap-2">
            {hasTitleAndDescription ? (
              <Check size={15} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <X size={15} className="mt-0.5 shrink-0 text-muted" />
            )}
            <span className="text-body-sm text-bodyText">Job title and description</span>
          </li>
          <li className="flex items-start gap-2">
            {hasQuestions ? (
              <Check size={15} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <X size={15} className="mt-0.5 shrink-0 text-muted" />
            )}
            <span className="text-body-sm text-bodyText">Interview instructions</span>
          </li>
          <li className="flex items-start gap-2">
            {estimatedMinutes ? (
              <Check size={15} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <X size={15} className="mt-0.5 shrink-0 text-muted" />
            )}
            <div>
              <span className="text-body-sm text-bodyText">Estimated time</span>
              {estimatedMinutes && (
                <span className="block text-caption text-muted">{estimatedMinutes} minutes</span>
              )}
            </div>
          </li>
          <li className="flex items-start gap-2">
            {brandingConfigured ? (
              <Check size={15} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <X size={15} className="mt-0.5 shrink-0 text-muted" />
            )}
            <div>
              <span className="text-body-sm text-bodyText">Company branding</span>
              <span className="block text-caption text-muted">
                {brandingConfigured ? 'Configured in Customisation' : 'Not configured yet'}
              </span>
            </div>
          </li>
        </ul>
        <Link
          href={`/jobs/${jobId}/edit/customisation`}
          className="mt-3 inline-block text-body-sm font-medium text-primary hover:underline"
        >
          Review and edit in Customisation
        </Link>
      </div>
    </div>
  );
}
