'use client';

import * as React from 'react';

type Saver = () => Promise<void> | void;

type RegistryValue = {
  /** A section registers its flush function while mounted. */
  register: (id: string, save: Saver) => () => void;
  /** Commit every mounted section — used by the step footer. */
  saveAll: () => Promise<void>;
};

const Ctx = React.createContext<RegistryValue | null>(null);

/**
 * Collects the save function of each customisation section that is currently
 * mounted, so the wizard's single "Next" button can commit them together.
 *
 * Only the section you are looking at is mounted at a time, so in practice this
 * flushes that section's pending debounce before navigating. Once the real API
 * lands and every section is submitted in one request, `saveAll` is the single
 * place that has to change.
 */
export function CustomisationSaveProvider({ children }: { children: React.ReactNode }) {
  const savers = React.useRef(new Map<string, Saver>());

  const register = React.useCallback((id: string, save: Saver) => {
    savers.current.set(id, save);
    return () => {
      savers.current.delete(id);
    };
  }, []);

  const saveAll = React.useCallback(async () => {
    // Sequential rather than parallel: these all write to the same job record,
    // and the mock store is last-write-wins.
    for (const save of Array.from(savers.current.values())) {
      await save();
    }
  }, []);

  const value = React.useMemo(() => ({ register, saveAll }), [register, saveAll]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Null outside the wizard — Workspace settings renders sections without it. */
export function useCustomisationRegistry() {
  return React.useContext(Ctx);
}

/** Registers a section's save function for as long as it is mounted. */
export function useRegisterSave(id: string, save: Saver) {
  const registry = useCustomisationRegistry();
  const latest = React.useRef(save);
  latest.current = save;

  React.useEffect(() => {
    if (!registry) return;
    return registry.register(id, () => latest.current());
  }, [registry, id]);
}
