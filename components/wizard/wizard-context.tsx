'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getJob, updateJob, type Job } from '@/lib/api/jobs';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface WizardContextValue {
  jobId: string | null;
  job: Job | null;
  loading: boolean;
  saveState: SaveState;
  setJobId: (id: string | null) => void;
  setJob: (job: Job) => void;
  patchJob: (patch: Partial<Job>) => void;
  markDirty: () => void;
  clearDirty: () => void;
  isDirty: boolean;
  retrySave: () => void;
  hasJob: boolean;
}

const WizardContext = React.createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = React.useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}

/**
 * Same context, but null outside a WizardProvider instead of throwing.
 *
 * The customisation sections are reused verbatim in Workspace settings, where
 * there is no wizard around them. They still need markDirty/clearDirty when
 * they *are* in the wizard, so this lets one component serve both.
 */
export function useOptionalWizard() {
  return React.useContext(WizardContext);
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [jobId, setJobIdState] = React.useState<string | null>(null);
  const [job, setJobState] = React.useState<Job | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saveState, setSaveState] = React.useState<SaveState>('idle');
  const [isDirty, setIsDirty] = React.useState(false);
  const pendingPatch = React.useRef<Partial<Job> | null>(null);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const setJob = React.useCallback((j: Job) => {
    setJobState(j);
    setJobIdState(j.id);
  }, []);

  const setJobId = React.useCallback((id: string | null) => {
    setJobIdState(id);
  }, []);

  const markDirty = React.useCallback(() => setIsDirty(true), []);
  const clearDirty = React.useCallback(() => setIsDirty(false), []);

  const doSave = React.useCallback(
    async (id: string, patch: Partial<Job>) => {
      setSaveState('saving');
      try {
        const updated = await updateJob(id, patch);
        setJobState(updated);
        setSaveState('saved');
        setIsDirty(false);
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    },
    []
  );

  const patchJob = React.useCallback(
    (patch: Partial<Job>) => {
      if (!jobId) return;
      pendingPatch.current = { ...(pendingPatch.current ?? {}), ...patch };
      setIsDirty(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState('saving');
      saveTimer.current = setTimeout(() => {
        if (jobId && pendingPatch.current) {
          doSave(jobId, pendingPatch.current);
          pendingPatch.current = null;
        }
      }, 1000);
    },
    [jobId, doSave]
  );

  const retrySave = React.useCallback(() => {
    if (jobId && pendingPatch.current) {
      doSave(jobId, pendingPatch.current);
      pendingPatch.current = null;
    }
  }, [jobId, doSave]);

  React.useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setLoading(true);
    getJob(jobId)
      .then((j) => {
        if (!cancelled) setJobState(j);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const value: WizardContextValue = {
    jobId,
    job,
    loading,
    saveState,
    setJobId,
    setJob,
    patchJob,
    markDirty,
    clearDirty,
    isDirty,
    retrySave,
    hasJob: !!jobId,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
