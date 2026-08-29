'use client';

import * as React from 'react';
import { Building2, Search, Lock, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  getAtsConnection,
  connectAtsForDemo,
  getAtsSources,
  getAtsCandidates,
  addInviteCandidates,
  type AtsSource,
  type AtsCandidate,
  type InviteCandidate,
} from '@/lib/api/invites';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';

interface AtsImportCardProps {
  id?: string;
  jobId: string;
  atsAllowedByPlan: boolean;
  candidates: InviteCandidate[];
  onCandidatesChanged: (candidates: InviteCandidate[]) => void;
}

const SUPPORTED_ATS = ['Greenhouse', 'Lever', 'Ashby', 'Workday'];

export function AtsImportCard({ id, jobId, atsAllowedByPlan, candidates, onCandidatesChanged }: AtsImportCardProps) {
  const [connected, setConnected] = React.useState(false);
  const [connectionName, setConnectionName] = React.useState<string | undefined>();
  const [connecting, setConnecting] = React.useState(false);
  const [sources, setSources] = React.useState<AtsSource[]>([]);
  const [sourceId, setSourceId] = React.useState<string | null>(null);
  const [stageId, setStageId] = React.useState<string | null>(null);
  const [atsCandidates, setAtsCandidates] = React.useState<AtsCandidate[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState('');
  const [loadingCandidates, setLoadingCandidates] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  React.useEffect(() => {
    getAtsConnection().then((c) => {
      setConnected(c.connected);
      setConnectionName(c.name);
    });
  }, []);

  React.useEffect(() => {
    if (connected) getAtsSources().then(setSources);
  }, [connected]);

  React.useEffect(() => {
    if (!stageId) {
      setAtsCandidates([]);
      return;
    }
    setLoadingCandidates(true);
    getAtsCandidates(stageId)
      .then(setAtsCandidates)
      .finally(() => setLoadingCandidates(false));
  }, [stageId]);

  const existingEmails = React.useMemo(
    () => new Set(candidates.map((c) => c.email.toLowerCase())),
    [candidates]
  );

  const handleConnect = async () => {
    track('ats_import_opened', {});
    setConnecting(true);
    try {
      const c = await connectAtsForDemo();
      setConnected(c.connected);
      setConnectionName(c.name);
    } finally {
      setConnecting(false);
    }
  };

  const filteredCandidates = atsCandidates.filter((c) => {
    if (existingEmails.has(c.email.toLowerCase())) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const alreadyInvitedCount = atsCandidates.filter((c) => existingEmails.has(c.email.toLowerCase())).length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    const toImport = atsCandidates.filter((c) => selected.has(c.id));
    if (toImport.length === 0) return;
    setImporting(true);
    try {
      const added = await addInviteCandidates(
        jobId,
        'ats',
        toImport.map((c) => {
          const [firstName, ...rest] = c.name.split(' ');
          return { firstName, lastName: rest.join(' '), email: c.email, source: connectionName };
        })
      );
      onCandidatesChanged([...candidates, ...added]);
      track('ats_import_completed', { source: connectionName, count: added.length });
      toast.success(`Imported ${added.length} ${added.length === 1 ? 'candidate' : 'candidates'}`);
      setSelected(new Set());
    } catch {
      toast.error('Could not import candidates');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div id={id} className="scroll-mt-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-h3 text-heading">
            <Building2 size={16} className="text-muted" />
            Import from ATS
          </h3>
          <p className="mt-1 text-body-sm text-muted">
            Invite candidates from your connected ATS.
          </p>
        </div>
      </div>

      {!atsAllowedByPlan ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-md border border-border bg-card-hover px-6 py-8 text-center">
          <Lock size={18} className="text-muted" />
          <p className="text-body-sm text-heading">ATS import isn&apos;t on your current plan.</p>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="text-body-sm font-medium text-primary hover:underline">
                See plans
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-64">
              <p className="text-body-sm text-heading">
                ATS import is part of the <span className="font-semibold">Growth plan</span> and above.
              </p>
              <a
                href="/settings/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-body-sm font-medium text-primary hover:underline"
              >
                See plans
              </a>
            </PopoverContent>
          </Popover>
        </div>
      ) : !connected ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-md border border-dashed border-border-strong px-6 py-8 text-center">
          <Building2 size={20} className="text-muted" />
          <p className="text-body font-medium text-heading">Not connected yet</p>
          <p className="max-w-sm text-body-sm text-muted">
            Supported: {SUPPORTED_ATS.join(', ')}.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="mt-1 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {connecting && <Loader2 size={14} className="animate-spin" />}
            Connect an ATS
          </button>
          <p className="text-caption text-muted">Opens integration settings in a new tab.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-success-border bg-success-wash px-3 py-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
            <span className="text-body-sm text-success-ink">Connected to {connectionName}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-body-sm font-semibold text-heading">Source</label>
              <select
                value={sourceId ?? ''}
                onChange={(e) => {
                  setSourceId(e.target.value || null);
                  setStageId(null);
                  setSelected(new Set());
                }}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-heading"
              >
                <option value="">Choose a source…</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-body-sm font-semibold text-heading">Stage</label>
              <select
                value={stageId ?? ''}
                onChange={(e) => {
                  setStageId(e.target.value || null);
                  setSelected(new Set());
                }}
                disabled={!sourceId}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-heading disabled:opacity-50"
              >
                <option value="">Choose a stage…</option>
                {sources.find((s) => s.id === sourceId)?.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {stageId && (
            <>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidates…"
                  className="h-9 pl-9"
                />
              </div>

              {loadingCandidates ? (
                <div className="h-24 animate-pulse rounded-md border border-border bg-card-hover" />
              ) : filteredCandidates.length === 0 ? (
                <p className="py-6 text-center text-body-sm text-muted">
                  {alreadyInvitedCount > 0
                    ? 'Everyone in this stage is already invited.'
                    : 'No candidates in this stage.'}
                </p>
              ) : (
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1">
                  {filteredCandidates.map((c) => (
                    <li key={c.id}>
                      <label
                        className={cn(
                          'flex items-center gap-3 rounded-md p-2.5 transition-colors',
                          selected.has(c.id) ? 'bg-active-menu-bg' : 'hover:bg-card-hover'
                        )}
                      >
                        <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} aria-label={c.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body-sm font-medium text-heading">{c.name}</p>
                          <p className="truncate text-caption text-muted">{c.email}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-border bg-muted-bg px-2 py-0.5 text-caption text-muted">
                          {c.stage}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                {importing && <Loader2 size={14} className="animate-spin" />}
                Import {selected.size > 0 ? `${selected.size} ` : ''}selected
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
