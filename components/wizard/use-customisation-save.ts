'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useWizard } from '@/components/wizard/wizard-context';

/**
 * Autosave hook for customisation sections.
 * Loads data on mount, debounces saves through the wizard context's saveState.
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
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingData = React.useRef<T | null>(null);

  React.useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    loader(jobId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId, loader]);

  const update = React.useCallback(
    (patch: Partial<T>) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        pendingData.current = next;
        markDirty();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          if (jobId && pendingData.current) {
            saver(jobId, pendingData.current).then(() => {
              clearDirty();
            }).catch(() => {});
            pendingData.current = null;
          }
        }, 1000);
        return next;
      });
    },
    [jobId, saver, markDirty, clearDirty]
  );

  return { data, loading, update, jobId };
}
