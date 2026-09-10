import { cn } from '@/lib/utils';
import type { Role } from '@/lib/api/settings';

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleStyles: Record<Role, string> = {
  Owner: 'border-primary/30 bg-active-menu-bg text-primary',
  MA: 'border-border bg-muted-bg text-heading',
  EX: 'border-border bg-muted-bg text-bodyText',
};

const roleLabels: Record<Role, string> = {
  Owner: 'Owner',
  MA: 'Manager',
  EX: 'Executive',
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-medium',
        roleStyles[role],
        className
      )}
    >
      {roleLabels[role]}
    </span>
  );
}
