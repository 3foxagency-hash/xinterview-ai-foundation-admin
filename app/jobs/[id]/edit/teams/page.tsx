'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, Plus, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from '@/components/wizard/wizard-context';
import { StepFooter } from '@/components/wizard/step-footer';
import { HeroBanner } from '@/components/wizard/hero-banner';
import { SectionCard } from '@/components/wizard/section-card';
import {
  getJobTeam,
  addJobTeamMembers,
  removeJobTeamMember,
  updateTeamMemberNotification,
  getCompanyMembers,
  getPlanInfo,
  type JobTeamMember,
  type CompanyMember,
  type PlanInfo,
} from '@/lib/api/jobs';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

function RolePill({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-medium',
        role === 'Admin' && 'border-primary/30 bg-active-menu-bg text-primary',
        role === 'Manager' && 'border-border bg-muted-bg text-heading',
        role === 'Executive' && 'border-border bg-muted-bg text-heading'
      )}
    >
      {role}
    </span>
  );
}

export default function TeamsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const [team, setTeam] = React.useState<JobTeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [availableMembers, setAvailableMembers] = React.useState<CompanyMember[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [memberSearch, setMemberSearch] = React.useState('');
  const [plan, setPlan] = React.useState<PlanInfo | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    getJobTeam(jobId)
      .then(setTeam)
      .catch(() => {})
      .finally(() => setLoading(false));
    getPlanInfo().then(setPlan).catch(() => {});
  }, [jobId]);

  const openAddDialog = async () => {
    setAddDialogOpen(true);
    try {
      const members = await getCompanyMembers();
      const onTeam = new Set(team.map((t) => t.id));
      setAvailableMembers(members.filter((m) => !onTeam.has(m.id)));
    } catch {
      // silent
    }
  };

  const filteredMembers = availableMembers.filter((m) => {
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddMembers = async () => {
    if (!jobId || selectedIds.size === 0) return;
    setAdding(true);
    try {
      const updated = await addJobTeamMembers(jobId, Array.from(selectedIds));
      setTeam(updated);
      track('team_member_added', { count: selectedIds.size });
      toast.success(`Added ${selectedIds.size} member${selectedIds.size > 1 ? 's' : ''}`);
      setSelectedIds(new Set());
      setAddDialogOpen(false);
    } catch {
      toast.error('Could not add team members');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!jobId) return;
    try {
      const updated = await removeJobTeamMember(jobId, memberId);
      setTeam(updated);
      track('team_member_removed', { memberId });
      toast.success(`Removed ${name}`);
    } catch {
      toast.error('Could not remove this member');
    }
  };

  const handleNotifyChange = async (memberId: string, notify: boolean) => {
    if (!jobId) return;
    setTeam((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, notifyOnComplete: notify } : m))
    );
    try {
      await updateTeamMemberNotification(jobId, memberId, notify);
    } catch {
      setTeam((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, notifyOnComplete: !notify } : m))
      );
    }
  };

  const filteredTeam = team.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const handleContinue = () => {
    if (!jobId) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      router.push(`/jobs/${jobId}/edit/customisation`);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <HeroBanner
        headline="Bring your team in"
        subtext="Choose who can see this job and who gets notified."
        step={3}
      />

      <SectionCard
        title="Team members"
        description="Team members can see this job and its candidates."
        statusDot={team.length > 1 ? 'success' : 'indigo'}
        statusTooltip={team.length > 1 ? 'Complete' : 'Only you are on this job so far'}
        footer={
          <StepFooter
            onCancel={() => jobId && router.push(`/jobs/${jobId}/edit/questions`)}
            onNext={handleContinue}
            nextLabel="Next: Customisation"
            nextLoading={saving}
          />
        }
      >
        {/* Header: search + add button */}
        <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team…"
              className="h-9 pl-9"
            />
          </div>
          <button
            type="button"
            onClick={openAddDialog}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Plus size={14} />
            Add team member
          </button>
        </div>

        {/* Team table / cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-border bg-card-hover"
              />
            ))}
          </div>
        ) : filteredTeam.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-body text-bodyText">
              {team.length === 0
                ? "No one else is on this job yet. You'll still get all notifications."
                : 'No team members match your search.'}
            </p>
            {team.length === 0 && (
              <button
                type="button"
                onClick={openAddDialog}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
              >
                <Plus size={14} />
                Add team member
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-lg border border-border md:block">
              <table className="w-full text-body">
                <thead>
                  <tr className="border-b border-border bg-card-hover text-caption text-muted">
                    <th className="px-4 py-3 text-left font-medium">Member</th>
                    <th className="px-4 py-3 text-left font-medium">Company role</th>
                    <th className="px-4 py-3 text-left font-medium">Email notifications</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeam.map((m) => {
                    const canRemove = !m.isCreator && m.role !== 'Admin';
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-active-menu-bg text-caption font-medium text-primary">
                                {m.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-body-sm font-medium text-heading">{m.name}</p>
                              <p className="text-caption text-muted">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <RolePill role={m.role} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={m.notifyOnComplete}
                              onCheckedChange={(v) => handleNotifyChange(m.id, v)}
                              disabled={!plan?.emailNotifications}
                              aria-label={`Notify ${m.name} when a candidate completes this interview`}
                            />
                            {!plan?.emailNotifications && (
                              <span className="text-caption text-muted">
                                <a
                                  href="/settings/billing"
                                  className="text-primary hover:underline"
                                >
                                  Upgrade to enable
                                </a>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => handleRemove(m.id, m.name)}
                              aria-label={`Remove ${m.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {m.isCreator && (
                            <span className="text-caption text-muted">Creator</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {filteredTeam.map((m) => {
                const canRemove = !m.isCreator && m.role !== 'Admin';
                return (
                  <div
                    key={m.id}
                    className="rounded-lg border border-border bg-surface p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-active-menu-bg text-caption font-medium text-primary">
                            {m.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-body-sm font-medium text-heading">{m.name}</p>
                          <p className="text-caption text-muted">{m.email}</p>
                        </div>
                      </div>
                      <RolePill role={m.role} />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-body-sm text-muted">
                        Notify on completion
                      </span>
                      <Switch
                        checked={m.notifyOnComplete}
                        onCheckedChange={(v) => handleNotifyChange(m.id, v)}
                        disabled={!plan?.emailNotifications}
                        aria-label={`Notify ${m.name} when a candidate completes this interview`}
                      />
                    </div>
                    {!plan?.emailNotifications && (
                      <p className="mt-1.5 text-caption text-muted">
                        <a
                          href="/settings/billing"
                          className="text-primary hover:underline"
                        >
                          Upgrade to enable
                        </a>
                      </p>
                    )}
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.id, m.name)}
                        className="mt-3 inline-flex items-center gap-1.5 text-body-sm text-error hover:underline"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    )}
                    {m.isCreator && (
                      <p className="mt-3 text-caption text-muted">Creator</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SectionCard>

      {/* Add member dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add team members</DialogTitle>
            <DialogDescription>
              Select company members to add to this job.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-3">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members…"
              className="h-9 pl-9"
            />
          </div>

          {filteredMembers.length === 0 ? (
            <div className="rounded-md border border-border bg-card-hover p-6 text-center">
              <p className="text-body-sm text-muted">
                No members found. Add people in{' '}
                <a
                  href="/settings/team"
                  className="text-primary hover:underline"
                >
                  Settings → Team members
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="max-h-[280px] space-y-1 overflow-y-auto">
              {filteredMembers.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md border p-3 transition-colors',
                    selectedIds.has(m.id)
                      ? 'border-primary/30 bg-active-menu-bg'
                      : 'border-transparent hover:bg-card-hover'
                  )}
                >
                  <Checkbox
                    checked={selectedIds.has(m.id)}
                    onCheckedChange={() => handleToggleSelect(m.id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-active-menu-bg text-caption font-medium text-primary">
                      {m.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-body-sm font-medium text-heading">{m.name}</p>
                    <p className="text-caption text-muted">{m.email}</p>
                  </div>
                  <RolePill role={m.role} />
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setAddDialogOpen(false)}
              className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddMembers}
              disabled={selectedIds.size === 0 || adding}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
            >
              {adding ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                <Check size={14} />
              )}
              Add {selectedIds.size > 0 && `${selectedIds.size} `}
              {selectedIds.size === 1 ? 'member' : 'members'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
