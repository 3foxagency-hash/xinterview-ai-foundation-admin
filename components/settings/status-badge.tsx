import { cn } from '@/lib/utils';
import type { MemberStatus } from '@/lib/api/settings';

interface StatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

const statusConfig: Record<MemberStatus, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'border-success/30 bg-success/10 text-success' },
  pending: { label: 'Pending invite', cls: 'border-warning/30 bg-warning/10 text-warning' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-medium',
        cfg.cls,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
