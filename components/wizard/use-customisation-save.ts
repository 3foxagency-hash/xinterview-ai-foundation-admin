'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useWizard } from '@/components/wizard/wizard-context';

/**
 * Autosave hook for customisation sections.
 * Loads data on mount, debounces saves, and exposes an explicit `save()` so a
 * section can offer a Save button alongside the debounce.
 */
export function useCustomisationSave<T>(
  loader: (jobId: string) => Promise<T>,
  saver: (jobId: string, data: T) => Promise<T>,
  eventName?: string
) {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const { markDirty, clearDirty } = useWizard();
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
        clearDirty();
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
      setData((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        latest.current = next;
        pendingData.current = next;
        markDirty();
        setSaved(false);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          if (pendingData.current) persist(pendingData.current);
        }, 1000);
        return next;
      });
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
