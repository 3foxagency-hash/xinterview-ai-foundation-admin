import { cn } from '@/lib/utils';
import type { MemberStatus } from '@/lib/api/settings';

interface StatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

/* Status badge per Design System v2.0 §13.1: 20px height, pill radius,
   8px horizontal padding, 6px dot with a 6px gap, 12/16/500 text. Color
   is never the only signal — the label is always present. */
const statusConfig: Record<MemberStatus, { label: string; dot: string; cls: string }> = {
  active: { label: 'Active', dot: 'bg-success', cls: 'bg-success-wash text-success-ink' },
  pending: { label: 'Pending invite', dot: 'bg-warning', cls: 'bg-warning-wash text-warning-ink' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
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
