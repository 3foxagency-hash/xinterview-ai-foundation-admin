'use client';

import * as React from 'react';
import { MoreHorizontal, Lock, UserPlus, AlertCircle, RotateCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { SettingsPage } from '@/components/settings';
import { RoleBadge } from '@/components/settings/role-badge';
import { StatusBadge } from '@/components/settings/status-badge';
import { InviteDialog } from '@/components/settings/invite-dialog';
import { ChangeRoleDialog } from '@/components/settings/change-role-dialog';
import { RemoveMemberDialog } from '@/components/settings/remove-member-dialog';
import { TeamSkeleton } from '@/components/settings/team-skeleton';
import {
  getTeamRoster,
  getCurrentUser,
  inviteMember,
  resendInvite,
  cancelInvite,
  changeMemberRole,
  removeMember,
  copyInviteLink,
  type TeamMember,
  type CurrentUser,
  type Role,
} from '@/lib/api/settings';
import { getSettingsErrorMessage, getSettingsErrorCode } from '@/lib/errors/settings-messages';
import { track } from '@/lib/utils/analytics';
import { cn } from '@/lib/utils';

export default function TeamPage() {
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [seatLimit, setSeatLimit] = React.useState(15);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [changeRoleTarget, setChangeRoleTarget] = React.useState<TeamMember | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<TeamMember | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [roster, user] = await Promise.all([getTeamRoster(), getCurrentUser()]);
      setMembers(roster.members);
      setSeatLimit(roster.seatLimit);
      setCurrentUser(user);
    } catch (e) {
      setLoadError(true);
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const seatsUsed = members.length;
  const seatsFull = seatsUsed >= seatLimit;
  const usagePct = seatLimit > 0 ? Math.min((seatsUsed / seatLimit) * 100, 100) : 0;
  const usageColor = seatsFull ? 'bg-error' : usagePct >= 80 ? 'bg-warning' : 'bg-primary';

  const canManage = currentUser?.role === 'Owner' || currentUser?.role === 'Admin';
  const isOwner = currentUser?.isOwner ?? false;
  const companyName = 'XInterview';

  // ── Invite ──
  const handleInvite = async (email: string, role: 'Admin' | 'Member') => {
    try {
      const newMember = await inviteMember(email, role);
      setMembers((m) => [...m, newMember]);
      toast.success(`Invite sent to ${email}`);
      track('team_member_invited', { email, role });
    } catch (e) {
      const code = getSettingsErrorCode(e);
      if (code === 'seat_limit_reached') throw e;
      throw e;
    }
  };

  // ── Row actions: each takes its own row's id ──
  const handleResend = async (inviteId: string, email: string) => {
    try {
      await resendInvite(inviteId);
      toast.success(`Invite resent to ${email}`);
      track('invite_resent', { inviteId });
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    }
  };

  const handleCopyLink = (inviteId: string) => {
    const link = copyInviteLink(inviteId);
    navigator.clipboard?.writeText(link).catch(() => {});
    toast.success('Invite link copied to clipboard');
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId);
      setMembers((m) => m.filter((mem) => mem.id !== inviteId));
      toast.success('Invite cancelled');
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    }
  };

  const handleRoleChange = async (newRole: 'Admin' | 'Member') => {
    if (!changeRoleTarget) return;
    const memberId = changeRoleTarget.id;
    try {
      await changeMemberRole(memberId, newRole);
      setMembers((m) =>
        m.map((mem) => (mem.id === memberId ? { ...mem, role: newRole } : mem))
      );
      toast.success(`${changeRoleTarget.name} is now ${newRole}`);
      track('member_role_changed', { memberId, newRole });
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
      throw e;
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    const memberId = removeTarget.id;
    try {
      await removeMember(memberId);
      setMembers((m) => m.filter((mem) => mem.id !== memberId));
      toast.success(`${removeTarget.name} removed from ${companyName}`);
      track('team_member_removed', { memberId });
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
      throw e;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <TeamSkeleton />;
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-[800px] flex-col items-center justify-center px-8 py-20">
        <AlertCircle size={32} strokeWidth={1.5} className="text-muted" />
        <p className="mt-4 text-body text-muted">We could not load your team.</p>
        <button
          type="button"
          onClick={loadData}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RotateCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  const onlyOwner = members.length === 1 && members[0]?.role === 'Owner';

  return (
    <>
      <SettingsPage
        title="Team members"
        scope="company"
        companyName={companyName}
        description="Everyone with access to your XInterview account."
      >
        {/* ── HEADER ROW ── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-body-sm text-bodyText">
              {seatsUsed} of {seatLimit} seats used
            </span>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted-bg">
              <div
                className={cn('h-full transition-all', usageColor)}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {seatsFull && (
              <p className="mt-1 text-body-sm text-error">
                You've used all your seats.{' '}
                <a href="/dashboard/settings/billing" className="underline hover:no-underline">
                  Upgrade your plan
                </a>
              </p>
            )}
            {!seatsFull && usagePct >= 80 && (
              <p className="mt-1 text-body-sm text-warning">
                You're close to your seat limit.
              </p>
            )}
          </div>

          <div className="relative">
            {canManage ? (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                disabled={seatsFull}
                aria-label={seatsFull ? 'Invite member — seat limit reached' : 'Invite member'}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-md px-4 text-button transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                  seatsFull
                    ? 'cursor-not-allowed bg-muted-bg text-muted'
                    : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover'
                )}
              >
                <UserPlus size={16} strokeWidth={2} />
                Invite member
              </button>
            ) : (
              <button
                type="button"
                disabled
                aria-label="Only owners and admins can invite members"
                className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md bg-muted-bg px-4 text-button text-muted"
              >
                <Lock size={14} />
                Invite member
              </button>
            )}
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted-bg">
                <th scope="col" className="px-4 py-2.5 text-left text-caption font-semibold uppercase tracking-wider text-muted">
                  Member
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-caption font-semibold uppercase tracking-wider text-muted">
                  Role
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-caption font-semibold uppercase tracking-wider text-muted">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-caption font-semibold uppercase tracking-wider text-muted">
                  Joined / Invited
                </th>
                <th scope="col" className="px-4 py-2.5 text-right text-caption font-semibold uppercase tracking-wider text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {onlyOwner ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <p className="text-body text-muted">It's just you right now</p>
                      <button
                        type="button"
                        onClick={() => setInviteOpen(true)}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <UserPlus size={14} />
                        Invite your first team member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border transition-colors last:border-b-0 hover:bg-card-hover"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-active-menu-bg text-caption font-semibold text-primary"
                          aria-hidden
                        >
                          {member.initials}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-body font-medium text-heading">
                            {member.name}
                          </span>
                          <span className="truncate text-body-sm text-muted">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-4 py-3 text-body-sm text-muted">
                      {member.status === 'active' ? formatDate(member.joinedAt) : formatDate(member.invitedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {member.role !== 'Owner' && canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Actions for ${member.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-card-hover hover:text-bodyText focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.status === 'active' ? (
                              <>
                                <DropdownMenuItem
                                  onSelect={() => setChangeRoleTarget(member)}
                                  className="text-body text-heading"
                                >
                                  Change role
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => setRemoveTarget(member)}
                                  className="text-body text-error focus:text-error"
                                >
                                  Remove from team
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onSelect={() => handleResend(member.id, member.email)}
                                  className="text-body text-heading"
                                >
                                  Resend invite
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => handleCopyLink(member.id)}
                                  className="text-body text-heading"
                                >
                                  Copy invite link
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => handleCancelInvite(member.id)}
                                  className="text-body text-error focus:text-error"
                                >
                                  Cancel invite
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        member.role !== 'Owner' && !canManage ? null : null
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SettingsPage>

      {/* ── DIALOGS ── */}
      {canManage && (
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvite={handleInvite}
          seatsFull={seatsFull}
        />
      )}

      {changeRoleTarget && (
        <ChangeRoleDialog
          open={!!changeRoleTarget}
          onOpenChange={(open) => { if (!open) setChangeRoleTarget(null); }}
          memberName={changeRoleTarget.name}
          currentRole={changeRoleTarget.role}
          onConfirm={handleRoleChange}
        />
      )}

      {removeTarget && (
        <RemoveMemberDialog
          open={!!removeTarget}
          onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
          memberName={removeTarget.name}
          companyName={companyName}
          onConfirm={handleRemove}
        />
      )}
    </>
  );
}
