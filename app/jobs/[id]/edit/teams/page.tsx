'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, Plus, Lock, Info, Users } from 'lucide-react';
import { useWizard } from '@/components/wizard/wizard-context';
import { StepFooter } from '@/components/wizard/step-footer';
import { TeamsSkeleton } from '@/components/wizard/teams-skeleton';
import { TeamRail } from '@/components/wizard/team-rail';
import { TeamRoleBadge } from '@/components/wizard/team-role-badge';
import { TeamMemberRow } from '@/components/wizard/team-member-row';
import { TeamBulkBar } from '@/components/wizard/team-bulk-bar';
import { AddTeamMembersSheet } from '@/components/wizard/add-team-members-sheet';
import { RemoveTeamMemberDialog } from '@/components/wizard/remove-team-member-dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { getProfile } from '@/lib/api/profile';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

type RoleFilter = 'all' | JobTeamMember['role'];

export default function TeamsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const { job, loading: wizardLoading, setSaveState, registerRetry } = useWizard();

  const [team, setTeam] = React.useState<JobTeamMember[]>([]);
  const [allMembers, setAllMembers] = React.useState<CompanyMember[]>([]);
  const [plan, setPlan] = React.useState<PlanInfo | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>('all');
  const [addSheetOpen, setAddSheetOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<{
    member: JobTeamMember;
    variant: 'remove' | 'leave';
  } | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [continuing, setContinuing] = React.useState(false);
  const [continueError, setContinueError] = React.useState(false);

  React.useEffect(() => {
    track('wizard_step_viewed', { step: 3 });
  }, []);

  React.useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    Promise.all([getJobTeam(jobId), getCompanyMembers(), getPlanInfo(), getProfile()])
      .then(([teamData, members, planData, profile]) => {
        setTeam(teamData);
        setAllMembers(members);
        setPlan(planData);
        setCurrentUserEmail(profile.email);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  const owner = team.find((m) => m.isCreator) ?? null;
  const members = team.filter((m) => !m.isCreator);
  const currentTeamIds = React.useMemo(() => new Set(team.map((m) => m.id)), [team]);
  const notificationsLocked = plan ? !plan.emailNotifications : false;
  const hasCandidates = job?.status === 'active';

  const filteredMembers = members.filter((m) => {
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  // ─── Save-state wrapper — mirrors the autosave indicator used on earlier steps ───
  const runMutation = React.useCallback(
    async (fn: () => Promise<void>) => {
      setSaveState('saving');
      try {
        await fn();
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
        registerRetry(() => runMutation(fn));
      }
    },
    [setSaveState, registerRetry]
  );

  // ─── Add people ───
  const handleAddMembers = async (ids: string[]) => {
    if (!jobId) return;
    await runMutation(async () => {
      const updated = await addJobTeamMembers(jobId, ids);
      setTeam(updated);
      track('team_member_added', { count: ids.length });
      toast.success(`Added ${ids.length} ${ids.length === 1 ? 'person' : 'people'}`);
    });
  };

  // ─── Notifications ───
  const handleNotifyChange = (memberId: string, notify: boolean) => {
    if (!jobId) return;
    setTeam((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, notifyOnComplete: notify } : m))
    );
    runMutation(async () => {
      try {
        await updateTeamMemberNotification(jobId, memberId, notify);
        track('team_notification_toggled', { on: notify });
      } catch (e) {
        setTeam((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, notifyOnComplete: !notify } : m))
        );
        throw e;
      }
    });
  };

  const handleOwnerNotifyChange = (notify: boolean) => {
    if (owner) handleNotifyChange(owner.id, notify);
  };

  // ─── Remove / leave ───
  const performRemove = async (member: JobTeamMember) => {
    if (!jobId) return;
    await runMutation(async () => {
      const updated = await removeJobTeamMember(jobId, member.id);
      setTeam(updated);
      toast.success(`Removed ${member.name}`, {
        action: {
          label: 'Undo',
          onClick: () => handleUndoRemove(member),
        },
      });
    });
  };

  const handleUndoRemove = async (member: JobTeamMember) => {
    if (!jobId) return;
    await runMutation(async () => {
      let updated = await addJobTeamMembers(jobId, [member.id]);
      if (!member.notifyOnComplete) {
        updated = await updateTeamMemberNotification(jobId, member.id, false);
      }
      setTeam(updated);
    });
  };

  const handleRemoveRequest = (member: JobTeamMember) => {
    if (hasCandidates) {
      setRemoveTarget({ member, variant: 'remove' });
    } else {
      performRemove(member);
      track('team_member_removed', { memberId: member.id });
    }
  };

  const handleLeaveRequest = (member: JobTeamMember) => {
    setRemoveTarget({ member, variant: 'leave' });
  };

  const handleConfirmRemoveTarget = async () => {
    if (!removeTarget) return;
    const { member, variant } = removeTarget;
    await performRemove(member);
    if (variant === 'leave') {
      track('team_member_left', { memberId: member.id });
      toast.message("You've left this job.");
      router.push('/jobs');
    } else {
      track('team_member_removed', { memberId: member.id });
    }
  };

  // ─── Bulk actions ───
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkNotify = (notify: boolean) => {
    const ids = Array.from(selectedIds);
    ids.forEach((id) => handleNotifyChange(id, notify));
    track('team_bulk_action', { action: notify ? 'notify_on' : 'notify_off', count: ids.length });
    clearSelection();
  };

  const handleBulkRemove = async () => {
    if (!jobId) return;
    const targets = members.filter((m) => selectedIds.has(m.id));
    const removable = targets.filter((m) => m.role !== 'Admin' && m.email !== currentUserEmail);
    const skipped = targets.filter((m) => m.role === 'Admin' || m.email === currentUserEmail);

    if (removable.length > 0) {
      await runMutation(async () => {
        let updated = team;
        for (const m of removable) {
          updated = await removeJobTeamMember(jobId, m.id);
        }
        setTeam(updated);
      });
    }

    track('team_bulk_action', { action: 'remove', count: removable.length });

    const skipNote = skipped[0]
      ? ` ${skipped[0].name} ${skipped[0].role === 'Admin' ? 'is a company admin' : "can't remove themselves"} and stays on the job.`
      : '';
    toast.success(
      `${removable.length} removed.${skipNote}`
    );
    clearSelection();
  };

  // ─── Continue ───
  const handleContinue = () => {
    if (!jobId) return;
    if (members.length === 0) {
      track('team_step_continued_empty', {});
    }
    setContinuing(true);
    setContinueError(false);
    setTimeout(() => {
      setContinuing(false);
      router.push(`/jobs/${jobId}/edit/customisation`);
    }, 500);
  };

  const totalPeople = team.length;

  if (loading || wizardLoading) {
    return <TeamsSkeleton />;
  }

  return (
    <div className="space-y-5 pb-24 md:pb-20">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left rail — sticky on desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <TeamRail people={team} />
          </div>
        </div>

        {/* Mobile summary */}
        <div className="lg:hidden">
          <TeamRail people={team} />
        </div>

        {/* Main column */}
        <div className="space-y-4">
          {/* Job owner */}
          {owner && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <h2 className="mb-3 text-body-sm font-semibold uppercase tracking-wide text-muted">
                  Job owner
                </h2>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-active-menu-bg text-body-sm font-medium text-primary">
                      {owner.initials}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-body-sm font-medium text-heading">
                          {owner.name}
                        </span>
                        <TeamRoleBadge role={owner.role} />
                        <span className="inline-flex items-center rounded-full border border-warning-border bg-warning-wash px-2.5 py-0.5 text-caption font-medium text-warning-ink">
                          Owner
                        </span>
                      </div>
                      <p className="mt-0.5 text-caption text-muted">{owner.email}</p>
                      <p className="mt-1.5 text-caption text-muted">
                        Created this job. Always has access and can&apos;t be removed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="text-right">
                      <p className="text-caption font-medium text-heading">
                        Email notifications
                      </p>
                      <p className="text-caption text-muted">
                        Email when a candidate finishes.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={owner.notifyOnComplete}
                        onCheckedChange={handleOwnerNotifyChange}
                        disabled={notificationsLocked}
                        aria-label={
                          owner.notifyOnComplete
                            ? `Turn off email notifications for ${owner.name}`
                            : `Turn on email notifications for ${owner.name}`
                        }
                      />
                      {notificationsLocked && <Lock size={13} className="text-muted" />}
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Team members */}
          <div className="rounded-lg border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-h3 text-heading">
                Team members{' '}
                <span className="text-body font-normal text-muted">({members.length})</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {members.length > 0 && (
                  <>
                    <div className="relative">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search members…"
                        className="h-9 w-52 pl-9"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                      <SelectTrigger className="h-9 w-36">
                        <SelectValue placeholder="All roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setAddSheetOpen(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                >
                  <Plus size={15} />
                  Add people
                </button>
              </div>
            </div>

            {notificationsLocked && members.length > 0 && (
              <div className="mx-4 mt-4 flex items-start gap-2 rounded-md border border-warning-border bg-warning-wash px-3 py-2.5">
                <Lock size={14} className="mt-0.5 shrink-0 text-warning-ink" />
                <p className="text-caption text-warning-ink">
                  Email notifications aren&apos;t on your current plan.{' '}
                  <a href="/settings/billing" target="_blank" rel="noopener noreferrer" className="font-medium underline">
                    See plans
                  </a>
                </p>
              </div>
            )}

            <div className="p-4">
              {selectedIds.size >= 2 && (
                <TeamBulkBar
                  selectedCount={selectedIds.size}
                  notificationsLocked={notificationsLocked}
                  onTurnOn={() => handleBulkNotify(true)}
                  onTurnOff={() => handleBulkNotify(false)}
                  onRemove={handleBulkRemove}
                  onClear={clearSelection}
                />
              )}

              {members.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <p className="max-w-sm text-body text-muted">
                    No one else is on this job yet. Only you will see candidate answers and get
                    notified.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddSheetOpen(true)}
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
                  >
                    <Plus size={14} />
                    Add people
                  </button>
                </div>
              ) : filteredMembers.length === 0 ? (
                <p className="py-10 text-center text-body-sm text-muted">
                  No team members match your search.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  {/* Column headers — grid matches TeamMemberRow's column template exactly,
                      so labels sit directly above the values they describe. */}
                  <div className="hidden border-b border-border bg-card-hover px-4 py-2.5 sm:grid sm:grid-cols-[1fr_92px_110px_170px_64px] sm:items-center sm:gap-5">
                    <span className="text-caption font-medium uppercase tracking-wide text-muted">
                      Member
                    </span>
                    <span className="flex items-center gap-1 text-caption font-medium uppercase tracking-wide text-muted">
                      Company role
                      <Info size={11} />
                    </span>
                    <span className="flex items-center gap-1 text-caption font-medium uppercase tracking-wide text-muted">
                      Access
                      <Info size={11} />
                    </span>
                    <span className="text-caption font-medium uppercase tracking-wide text-muted">
                      Email notifications
                    </span>
                    <span className="justify-self-end text-caption font-medium uppercase tracking-wide text-muted">
                      Actions
                    </span>
                  </div>
                  {filteredMembers.map((m) => (
                    <TeamMemberRow
                      key={m.id}
                      member={m}
                      isCurrentUser={m.email === currentUserEmail}
                      notificationsLocked={notificationsLocked}
                      selected={selectedIds.has(m.id)}
                      onToggleSelect={toggleSelect}
                      onNotifyChange={handleNotifyChange}
                      onRemoveRequest={handleRemoveRequest}
                      onLeaveRequest={handleLeaveRequest}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer disclaimer */}
            {members.length > 0 && (
              <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                <Users size={14} className="shrink-0 text-muted" />
                <p className="text-body-sm text-muted">
                  Everyone on a job has the same access today. Per-job permission levels are
                  coming.
                </p>
              </div>
            )}
          </div>

          {/* Soft warning — never blocks */}
          {members.length === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning-border bg-warning-wash px-4 py-3">
              <span className="text-body-sm text-warning-ink">
                Only you will be notified when candidates finish this interview.
              </span>
              <button
                type="button"
                onClick={() => setAddSheetOpen(true)}
                className="text-body-sm font-medium text-primary hover:underline"
              >
                Add people
              </button>
            </div>
          )}

          {continueError && (
            <div className="flex items-center justify-between rounded-md border border-error-border bg-error-wash px-4 py-3">
              <span className="text-body-sm text-error-ink">
                Couldn&apos;t save and continue. Try again.
              </span>
              <button
                type="button"
                onClick={handleContinue}
                className="text-body-sm font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      <StepFooter
        onBack={() => router.push(jobId ? `/jobs/${jobId}/edit/questions` : '/jobs/new/setup')}
        backLabel="Back to questions"
        onNext={handleContinue}
        nextLabel="Continue to customisation"
        nextLoading={continuing}
      />

      <AddTeamMembersSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        allMembers={allMembers}
        currentTeamIds={currentTeamIds}
        onAdd={handleAddMembers}
      />

      <RemoveTeamMemberDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        memberName={removeTarget?.member.name ?? ''}
        variant={removeTarget?.variant ?? 'remove'}
        onConfirm={handleConfirmRemoveTarget}
      />

      <span className="sr-only" aria-live="polite">
        {totalPeople} people on this job
      </span>
    </div>
  );
}
