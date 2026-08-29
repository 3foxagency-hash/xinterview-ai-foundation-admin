'use client';

import * as React from 'react';
import { Link as LinkIcon, Mail, Upload, Building2, History, ExternalLink, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InviteSectionId = 'share-link' | 'email-invite' | 'bulk-upload' | 'ats-import' | 'invite-history';

export type NavIndicator = 'complete' | 'active' | 'neutral';

interface InviteNavProps {
  activeSection: InviteSectionId;
  indicators: Record<InviteSectionId, NavIndicator>;
  onNavigate: (id: InviteSectionId) => void;
  variant?: 'full' | 'compact';
}

const METHODS: { id: InviteSectionId; icon: typeof LinkIcon; label: string; caption: string }[] = [
  { id: 'share-link', icon: LinkIcon, label: 'Share link', caption: 'Shareable interview link' },
  { id: 'email-invite', icon: Mail, label: 'Email invite', caption: 'Invite one or more by email' },
  { id: 'bulk-upload', icon: Upload, label: 'Bulk upload', caption: 'Upload a list of candidates' },
  { id: 'ats-import', icon: Building2, label: 'Import from ATS', caption: 'Import candidates from ATS' },
  { id: 'invite-history', icon: History, label: 'Invite history', caption: 'See all invitations' },
];

function IndicatorDot({ state }: { state: NavIndicator }) {
  if (state === 'complete') {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <svg viewBox="0 0 12 12" width="8" height="8" fill="none" aria-hidden>
          <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (state === 'active') {
    return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warning" aria-hidden />;
  }
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-border-strong" aria-hidden />;
}

export function InviteNav({ activeSection, indicators, onNavigate, variant = 'full' }: InviteNavProps) {
  if (variant === 'compact') {
    return (
      <nav aria-label="Invite methods" className="flex gap-1.5 overflow-x-auto pb-1">
        {METHODS.map((m) => {
          const active = activeSection === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onNavigate(m.id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm font-medium transition-colors',
                active
                  ? 'border-primary/30 bg-active-menu-bg text-primary'
                  : 'border-border text-bodyText hover:bg-card-hover'
              )}
            >
              <m.icon size={13} />
              {m.label}
              <IndicatorDot state={indicators[m.id]} />
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
          <Mail size={18} className="text-bodyText" />
        </div>
        <div>
          <h2 className="text-h3 text-heading">Invite candidates</h2>
          <p className="mt-0.5 text-body-sm text-muted">Share your interview with the right people.</p>
        </div>
      </div>

      <nav aria-label="Invite methods" className="rounded-lg border border-border bg-surface p-1.5">
        {METHODS.map((m) => {
          const active = activeSection === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onNavigate(m.id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
                active ? 'bg-active-menu-bg' : 'hover:bg-card-hover'
              )}
            >
              <m.icon size={15} className={cn('mt-0.5 shrink-0', active ? 'text-primary' : 'text-muted')} />
              <span className="min-w-0 flex-1">
                <span className={cn('block text-body-sm font-medium', active ? 'text-primary' : 'text-heading')}>
                  {m.label}
                </span>
                <span className="block truncate text-caption text-muted">{m.caption}</span>
              </span>
              <span className="mt-1">
                <IndicatorDot state={indicators[m.id]} />
              </span>
            </button>
          );
        })}
      </nav>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start gap-2.5">
          <GraduationCap size={16} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-body-sm font-medium text-heading">
              Choose the method that works best for you.
            </p>
            <a
              href="/support"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline"
            >
              Learn more
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
