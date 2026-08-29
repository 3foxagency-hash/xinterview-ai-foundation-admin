'use client';

import * as React from 'react';
import { Search, Check, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TeamRoleBadge } from './team-role-badge';
import type { CompanyMember } from '@/lib/api/jobs';

interface AddTeamMembersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allMembers: CompanyMember[];
  currentTeamIds: Set<string>;
  onAdd: (ids: string[]) => Promise<void>;
}

export function AddTeamMembersSheet({
  open,
  onOpenChange,
  allMembers,
  currentTeamIds,
  onAdd,
}: AddTeamMembersSheetProps) {
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedIds(new Set());
    }
  }, [open]);

  const everyoneAlreadyAdded = allMembers.every((m) => currentTeamIds.has(m.id));

  const filtered = allMembers.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const toggle = (id: string) => {
    if (currentTeamIds.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setAdding(true);
    try {
      await onAdd(Array.from(selectedIds));
      onOpenChange(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add people</SheetTitle>
          <SheetDescription>
            Choose people from your company to work on this job.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
          <div className="relative mb-3 shrink-0">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="h-9 pl-9"
              aria-label="Search company members"
            />
          </div>

          {everyoneAlreadyAdded ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-border bg-card-hover p-6 text-center">
              <p className="text-body-sm text-muted">
                Everyone in your company is already on this job.
              </p>
              <a
                href="/settings/team"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-body-sm font-medium text-primary hover:underline"
              >
                Invite more people in Settings → Members
              </a>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-border bg-card-hover p-6 text-center">
              <p className="text-body-sm text-heading">No one matches &quot;{search}&quot;.</p>
              <p className="mt-2 text-body-sm text-muted">
                Not in your company yet?{' '}
                <a
                  href="/settings/team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  Invite them in Settings → Members
                </a>
              </p>
            </div>
          ) : (
            <ul
              role="listbox"
              aria-multiselectable="true"
              aria-label="Company members"
              className="min-h-0 flex-1 space-y-1 overflow-y-auto"
            >
              {filtered.map((m) => {
                const alreadyAdded = currentTeamIds.has(m.id);
                const checked = alreadyAdded || selectedIds.has(m.id);
                return (
                  <li key={m.id} role="option" aria-selected={checked}>
                    <label
                      className={cn(
                        'flex items-center gap-3 rounded-md border p-3 transition-colors',
                        alreadyAdded
                          ? 'cursor-not-allowed border-transparent opacity-60'
                          : checked
                            ? 'cursor-pointer border-primary/30 bg-active-menu-bg'
                            : 'cursor-pointer border-transparent hover:bg-card-hover'
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={alreadyAdded}
                        onCheckedChange={() => toggle(m.id)}
                        aria-label={m.name}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-active-menu-bg text-caption font-medium text-primary">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-sm font-medium text-heading">
                          {m.name}
                        </p>
                        <p className="truncate text-caption text-muted">{m.email}</p>
                      </div>
                      {alreadyAdded ? (
                        <span className="shrink-0 text-caption text-muted">Already added</span>
                      ) : (
                        <TeamRoleBadge role={m.role} />
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <SheetFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selectedIds.size === 0 || adding}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {adding ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {selectedIds.size === 0
              ? 'Add people'
              : `Add ${selectedIds.size} ${selectedIds.size === 1 ? 'person' : 'people'}`}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
