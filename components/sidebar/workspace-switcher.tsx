'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getWorkspaces,
  getActiveWorkspace,
  setActiveWorkspace,
  createWorkspace,
  WORKSPACE_NAME_MAX,
  type Workspace,
} from '@/lib/api/workspaces';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

const PANEL_WIDTH = 248;

/**
 * Workspace switcher, under the logo. Lists the workspaces you belong to and
 * offers "Create new workspace".
 *
 * The panel is positioned fixed rather than absolute: the sidebar is
 * `overflow-hidden`, so an absolutely-positioned panel gets clipped when the
 * rail is collapsed to 72px.
 */
export function WorkspaceSwitcher({ expanded }: { expanded: boolean }) {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [active, setActive] = React.useState<Workspace | null>(null);
  const [open, setOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, cur] = await Promise.all([getWorkspaces(), getActiveWorkspace()]);
        if (cancelled) return;
        setWorkspaces(list);
        setActive(cur);
      } catch {
        /* the switcher is non-critical; the sidebar still works without it */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const place = React.useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(
      Math.max(8, r.left),
      Math.max(8, window.innerWidth - PANEL_WIDTH - 8)
    );
    setPos({ left, top: r.bottom + 6 });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSwitch = async (ws: Workspace) => {
    setOpen(false);
    if (ws.id === active?.id) return;
    try {
      const next = await setActiveWorkspace(ws.id);
      setActive(next);
      toast.success(`Switched to ${next.name}`);
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    }
  };

  const handleCreated = (ws: Workspace) => {
    setWorkspaces((prev) => [...prev, ws]);
    setActive(ws);
    setCreateOpen(false);
    toast.success(`${ws.name} created`);
  };

  if (!active) {
    return <div className={cn('h-10 rounded-md bg-muted-bg', expanded ? 'mx-3' : 'mx-2 w-10')} />;
  }

  return (
    <>
      <div className={cn(expanded ? 'px-3' : 'px-2')}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Workspace: ${active.name}. Switch workspace`}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex items-center rounded-md border border-border transition-colors hover:bg-card-hover',
            expanded ? 'h-10 w-full gap-2 px-2' : 'h-10 w-10 justify-center'
          )}
        >
          <Monogram initials={active.initials} />
          {expanded && (
            <>
              <span className="min-w-0 flex-1 truncate text-left text-body-sm font-medium text-heading">
                {active.name}
              </span>
              <span className="shrink-0 rounded-full bg-muted-bg px-2 py-0.5 text-caption font-medium text-muted">
                {active.plan}
              </span>
              <ChevronsUpDown size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
            </>
          )}
        </button>
      </div>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Workspaces"
          className="fixed z-50 rounded-md border border-border bg-surface p-1.5 shadow-lg"
          style={{
            left: pos?.left ?? 0,
            top: pos?.top ?? 0,
            width: PANEL_WIDTH,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          <p className="px-2 py-1.5 text-caption font-medium text-muted">Workspaces</p>
          <div className="flex flex-col gap-0.5">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                role="menuitem"
                onClick={() => handleSwitch(ws)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-card-hover"
              >
                <Monogram initials={ws.initials} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm font-medium text-heading">
                    {ws.name}
                  </span>
                  <span className="block text-caption text-muted">{ws.plan} plan</span>
                </span>
                {ws.id === active.id && (
                  <Check size={14} className="shrink-0 text-heading" aria-hidden />
                )}
              </button>
            ))}
          </div>

          <div className="my-1.5 h-px bg-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-2 py-2 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover"
          >
            <Plus size={14} />
            Create new workspace
          </button>
        </div>
      )}

      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </>
  );
}

function Monogram({ initials }: { initials: string }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted-bg text-caption font-medium text-heading"
      aria-hidden
    >
      {initials}
    </span>
  );
}

function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (ws: Workspace) => void;
}) {
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setName('');
      setError(null);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ws = await createWorkspace(name);
      onCreated(ws);
    } catch (err) {
      setError(getSettingsErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription className="text-body text-muted">
            A workspace has its own customisation, careers page and notification
            templates. Billing and your team stay shared.
          </DialogDescription>
        </DialogHeader>

        {/* noValidate so zod-style messages aren't pre-empted by the native bubble */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 py-2">
          <div>
            <label
              htmlFor="workspace-name"
              className="mb-1.5 block text-body-sm font-medium text-heading"
            >
              Workspace name
            </label>
            <input
              ref={inputRef}
              id="workspace-name"
              value={name}
              maxLength={WORKSPACE_NAME_MAX}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Engineering hiring"
              aria-invalid={!!error}
              aria-describedby={error ? 'workspace-name-error' : undefined}
              className={cn(
                'h-10 w-full rounded-md border bg-surface px-3 text-body text-heading placeholder:text-muted transition-colors',
                error ? 'border-error' : 'border-border hover:border-border-strong'
              )}
            />
            {error && (
              <p id="workspace-name-error" role="alert" className="mt-1.5 text-body-sm text-error">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              aria-busy={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create workspace
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
