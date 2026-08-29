import { cn } from '@/lib/utils';
import type { InviteStatus } from '@/lib/api/invites';

interface InviteStatusBadgeProps {
  status: InviteStatus;
  className?: string;
}

const statusConfig: Record<InviteStatus, { label: string; dot: string; cls: string }> = {
  queued: { label: 'Queued', dot: 'bg-muted-foreground', cls: 'bg-muted-bg text-muted' },
  sent: { label: 'Sent', dot: 'bg-info', cls: 'bg-info-wash text-info-ink' },
  opened: { label: 'Opened', dot: 'bg-primary', cls: 'bg-active-menu-bg text-primary' },
  started: { label: 'Started', dot: 'bg-warning', cls: 'bg-warning-wash text-warning-ink' },
  completed: { label: 'Completed', dot: 'bg-success', cls: 'bg-success-wash text-success-ink' },
  bounced: { label: 'Bounced', dot: 'bg-error', cls: 'bg-error-wash text-error-ink' },
  revoked: { label: 'Revoked', dot: 'bg-muted-foreground', cls: 'bg-muted-bg text-muted' },
};

export function InviteStatusBadge({ status, className }: InviteStatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[12px] font-medium leading-4',
        cfg.cls,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', cfg.dot)} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
