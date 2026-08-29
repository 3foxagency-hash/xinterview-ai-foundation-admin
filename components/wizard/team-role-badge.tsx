import { cn } from '@/lib/utils';
import type { CompanyMember } from '@/lib/api/jobs';

interface TeamRoleBadgeProps {
  role: CompanyMember['role'];
  className?: string;
}

const roleStyles: Record<CompanyMember['role'], string> = {
  Admin: 'border-primary/30 bg-active-menu-bg text-primary',
  Manager: 'border-border bg-muted-bg text-heading',
  Executive: 'border-border bg-muted-bg text-heading',
};

export function TeamRoleBadge({ role, className }: TeamRoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-medium',
        roleStyles[role],
        className
      )}
    >
      {role}
    </span>
  );
}
