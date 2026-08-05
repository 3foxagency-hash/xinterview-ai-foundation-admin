'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { SettingsSelect } from './settings-select';
import { features } from '@/lib/constants/features';
import type { Role } from '@/lib/api/settings';

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  currentRole: Role;
  onConfirm: (newRole: 'Admin' | 'Member') => Promise<void>;
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  memberName,
  currentRole,
  onConfirm,
}: ChangeRoleDialogProps) {
  const [newRole, setNewRole] = React.useState<'Admin' | 'Member'>('Member');
  const [loading, setLoading] = React.useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) {
      setNewRole(currentRole === 'Owner' ? 'Member' : currentRole);
      setLoading(false);
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open, currentRole]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(newRole);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!features.editableRoles) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription className="text-body text-muted">
            Updating <strong className="text-heading">{memberName}</strong>'s role. This changes what they can do across your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <SettingsSelect
            label="New role"
            value={newRole}
            onChange={(v) => setNewRole(v as 'Admin' | 'Member')}
            options={[
              { value: 'Member', label: 'Member' },
              { value: 'Admin', label: 'Admin' },
            ]}
            description={
              newRole === 'Admin'
                ? 'Admins can invite members, change roles, and manage all jobs and candidates.'
                : 'Members can view and manage jobs and candidates. They cannot invite or remove team members.'
            }
          />
        </div>

        <DialogFooter className="gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || newRole === currentRole}
            aria-busy={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-all hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Save role
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
