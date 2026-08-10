'use client';

import * as React from 'react';
import { GripVertical, Lock, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { getStages, saveStages } from '@/lib/api/jobs';
import type { Stage, StagesInput } from '@/lib/validation/job';

function genId() {
  return `stage_${Math.random().toString(36).slice(2, 10)}`;
}

export function StagesSection({
  scopeId,
  showSaveBar = true,
}: {
  scopeId?: string;
  showSaveBar?: boolean;
}) {
  const { data, loading, update, save, saving, saved } = useCustomisationSave(
    getStages,
    saveStages,
    'stages_updated',
    scopeId
  );

  // Lets the wizard's single Next button commit this section.
  useRegisterSave('stages', save);

  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  const stages = data.stages;
  const setStages = (next: Stage[]) => update({ stages: next } as Partial<StagesInput>);

  const rename = (id: string, name: string) =>
    setStages(stages.map((s) => (s.id === id ? { ...s, name } : s)));

  const remove = (id: string) => setStages(stages.filter((s) => s.id !== id));

  const add = () => setStages([...stages, { id: genId(), name: '', locked: false }]);

  /**
   * Reorder by drag. A locked stage is neither draggable nor a valid drop
   * target, so the system stages keep their positions.
   */
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = stages.findIndex((s) => s.id === dragId);
    const to = stages.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0 || stages[from].locked || stages[to].locked) return;
    const next = [...stages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setStages(next);
  };

  const duplicate = (s: Stage) =>
    stages.some(
      (o) => o.id !== s.id && o.name.trim().toLowerCase() === s.name.trim().toLowerCase()
    );

  const customCount = stages.filter((s) => !s.locked).length;

  return (
    <div className="space-y-6">
      <section>
        {/* Header: title, context and the add action on one line */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-h3 text-heading">Stages</h3>
            <p className="mt-1 text-body-sm text-muted">
              The pipeline candidates move through.{' '}
              <span className="font-mono tabular-nums">{stages.length}</span> stages,{' '}
              <span className="font-mono tabular-nums">{customCount}</span> of them yours.
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover"
          >
            <Plus size={14} />
            Add stage
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
          {/* Column headers — sentence case, weight 500 (§12) */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
            <span className="w-5 shrink-0" aria-hidden />
            <span className="w-8 shrink-0 text-caption font-medium text-muted">#</span>
            <span className="min-w-0 flex-1 text-caption font-medium text-muted">Stage name</span>
            <span className="w-9 shrink-0" aria-hidden />
          </div>

          <ul className="divide-y divide-border">
            {stages.map((s, i) => {
              const invalid = !s.locked && (!s.name.trim() || duplicate(s));
              return (
                <li
                  key={s.id}
                  draggable={!s.locked}
                  onDragStart={() => !s.locked && setDragId(s.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDragOver={(e) => {
                    if (s.locked || !dragId) return;
                    e.preventDefault();
                    setOverId(s.id);
                  }}
                  onDragLeave={() => setOverId((o) => (o === s.id ? null : o))}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(s.id);
                    setOverId(null);
                  }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 transition-colors',
                    !s.locked && 'hover:bg-card-hover',
                    dragId === s.id && 'opacity-40',
                    overId === s.id && 'bg-card-hover ring-1 ring-inset ring-border-strong'
                  )}
                >
                  {/* Drag handle, or a lock for system stages */}
                  <span className="flex w-5 shrink-0 items-center justify-center">
                    {s.locked ? (
                      <Lock size={13} className="text-muted" aria-label="Fixed stage" />
                    ) : (
                      <GripVertical
                        size={15}
                        className="cursor-grab text-muted active:cursor-grabbing"
                        aria-hidden
                      />
                    )}
                  </span>

                  <span className="w-8 shrink-0 font-mono text-body-sm tabular-nums text-muted">
                    {i + 1}
                  </span>

                  <span className="min-w-0 flex-1">
                    {s.locked ? (
                      // A disabled input for a value that can never change reads
                      // as broken; plain text with a lock says "fixed" instead.
                      <span className="flex h-9 items-center text-body text-heading">
                        {s.name}
                      </span>
                    ) : (
                      <>
                        <Input
                          value={s.name}
                          onChange={(e) => rename(s.id, e.target.value)}
                          placeholder="Enter stage name"
                          maxLength={30}
                          aria-label={`Stage name: ${s.name || 'new stage'}`}
                          aria-invalid={invalid}
                          className={cn('h-9', invalid && 'border-error')}
                        />
                        {invalid && (
                          <p className="mt-1 text-caption text-error">
                            {!s.name.trim()
                              ? 'Enter a stage name.'
                              : 'Another stage already uses this name.'}
                          </p>
                        )}
                      </>
                    )}
                  </span>

                  <span className="flex w-9 shrink-0 items-center justify-center">
                    {!s.locked && (
                      <button
                        type="button"
                        onClick={() => remove(s.id)}
                        aria-label={`Remove ${s.name || 'stage'}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-2.5 flex items-start gap-1.5 text-caption text-muted">
          <Lock size={12} className="mt-0.5 shrink-0" aria-hidden />
          Locked stages are set automatically as candidates move through an interview, so
          they cannot be renamed, reordered or removed.
        </p>
      </section>

      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
