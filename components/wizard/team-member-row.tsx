'use client';

import * as React from 'react';
import { Trash2, MoveVertical as MoreVertical, LogOut, Info } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { TeamRoleBadge } from './team-role-badge';
import { NotificationLockPopover } from './notification-lock-popover';
import type { JobTeamMember } from '@/lib/api/jobs';

interface TeamMemberRowProps {
  member: JobTeamMember;
  isCurrentUser: boolean;
  notificationsLocked: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onNotifyChange: (id: string, notify: boolean) => void;
  onRemoveRequest: (member: JobTeamMember) => void;
  onLeaveRequest: (member: JobTeamMember) => void;
}

export function TeamMemberRow({
  member,
  isCurrentUser,
  notificationsLocked,
  selected,
  onToggleSelect,
  onNotifyChange,
  onRemoveRequest,
  onLeaveRequest,
}: TeamMemberRowProps) {
  const isAdmin = member.role === 'Admin';

  return (
    <div className="border-b border-border px-4 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        {/* Identity — its own line on narrow screens */}
        <div className="flex min-w-0 basis-full items-center gap-3 sm:basis-auto sm:flex-1">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(member.id)}
            aria-label={`Select ${member.name}`}
          />
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-active-menu-bg text-caption font-medium text-primary">
              {member.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-body-sm font-medium text-heading">
              {member.name}
              {isCurrentUser && <span className="font-normal text-muted"> (You)</span>}
            </p>
            <p className="truncate text-caption text-muted">{member.email}</p>
          </div>
        </div>

        {/* Role, access, notifications, actions — wraps to its own line on narrow screens */}
        <div className="flex basis-full flex-wrap items-center gap-4 sm:basis-auto sm:flex-nowrap sm:justify-end sm:gap-5">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default">
                  <TeamRoleBadge role={member.role} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                Their role at the company, not on this job.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-default items-center gap-1 text-body-sm text-bodyText">
                  Full access
                  <Info size={12} className="text-muted" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                Everyone on a job has the same access today. Per-job permission levels are
                coming.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1.5">
            <Switch
              checked={member.notifyOnComplete}
              onCheckedChange={(v) => onNotifyChange(member.id, v)}
              disabled={notificationsLocked}
              aria-label={
                notificationsLocked
                  ? `Email notifications for ${member.name} are locked on your current plan`
                  : member.notifyOnComplete
                    ? `Turn off email notifications for ${member.name} when a candidate finishes`
                    : `Turn on email notifications for ${member.name} when a candidate finishes`
              }
            />
            {notificationsLocked && <NotificationLockPopover memberName={member.name} />}
          </div>

          {/* Remove / leave */}
          {isCurrentUser ? (
            <DropdownMenu>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`More actions for ${member.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-card-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    You can&apos;t remove yourself from a job you&apos;re on.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onLeaveRequest(member)}
                  className="text-error"
                >
                  <LogOut size={14} /> Leave this job
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isAdmin ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md text-muted opacity-50">
                    <Trash2 size={14} />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  Company admins always have access to every job.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              type="button"
              onClick={() => onRemoveRequest(member)}
              aria-label={`Remove ${member.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
