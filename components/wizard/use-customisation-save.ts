'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useOptionalWizard } from '@/components/wizard/wizard-context';

/**
 * Autosave hook for customisation sections.
 * Loads data on mount, debounces saves, and exposes an explicit `save()` so a
 * section can offer a Save button alongside the debounce.
 */
export function useCustomisationSave<T>(
  loader: (scopeId: string) => Promise<T>,
  saver: (scopeId: string, data: T) => Promise<T>,
  eventName?: string,
  /**
   * Overrides the job id from the route. Workspace settings pass a fixed scope
   * so the same section components can edit workspace-level defaults.
   */
  scopeIdOverride?: string
) {
  const params = useParams<{ id: string }>();
  const jobId = scopeIdOverride ?? params?.id ?? null;
  // null outside the wizard — Workspace settings render these sections too.
  const wizard = useOptionalWizard();
  const markDirty = wizard?.markDirty;
  const clearDirty = wizard?.clearDirty;
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingData = React.useRef<T | null>(null);
  // Mirrors `data` so save() can read the latest value without being
  // re-created on every keystroke.
  const latest = React.useRef<T | null>(null);

  React.useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    loader(jobId)
      .then((d) => {
        setData(d);
        latest.current = d;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId, loader]);

  React.useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  const persist = React.useCallback(
    async (payload: T) => {
      if (!jobId) return;
      setSaving(true);
      try {
        await saver(jobId, payload);
        pendingData.current = null;
        clearDirty?.();
        setSaved(true);
      } catch {
        // Errors surface through the wizard's own save indicator.
      } finally {
        setSaving(false);
      }
    },
    [jobId, saver, clearDirty]
  );

  const update = React.useCallback(
    (patch: Partial<T>) => {
      // The side effects live outside the setData updater: React may invoke an
      // updater during render, and calling markDirty() there sets state on the
      // WizardProvider mid-render ("Cannot update a component while rendering a
      // different component").
      const prev = latest.current;
      if (!prev) return;
      const next = { ...prev, ...patch };
      latest.current = next;
      pendingData.current = next;
      setData(next);
      markDirty?.();
      setSaved(false);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (pendingData.current) persist(pendingData.current);
      }, 1000);
    },
    [markDirty, persist]
  );

  /** Commit immediately, cancelling any queued debounce. */
  const save = React.useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const payload = pendingData.current ?? latest.current;
    if (payload) await persist(payload);
  }, [persist]);

  return { data, loading, update, save, saving, saved, jobId };
}
