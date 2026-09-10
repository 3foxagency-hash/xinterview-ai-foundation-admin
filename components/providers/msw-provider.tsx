'use client';

import { useEffect, useState } from 'react';

// Module-level, not component state: React Strict Mode double-invokes
// effects in dev, and worker.start() throws "cannot configure an already
// enabled network" if called twice on the same worker instance.
let startPromise: Promise<unknown> | undefined;

function startWorker(): Promise<unknown> {
  startPromise ??= import('@/mocks/browser').then(({ worker }) =>
    worker.start({ onUnhandledRequest: 'warn' })
  );
  return startPromise;
}

/**
 * Starts the MSW browser worker before rendering children, so no request can
 * race the interceptor. See docs/msw-mocking.md for the env toggle.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(process.env.NEXT_PUBLIC_API_MOCKING === 'disabled');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING === 'disabled') return;
    startWorker().then(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
