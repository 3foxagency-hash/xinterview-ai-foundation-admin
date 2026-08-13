'use client';

import * as React from 'react';

/**
 * Starts the MSW Service Worker before any child renders.
 *
 * Two things this file has to get right:
 *
 * 1. **Children must not render before the worker is live.** React can fire an
 *    effect-triggered fetch before registration completes, and that first
 *    request escapes to the network. Holding the tree for one tick is cheaper
 *    than debugging a request that intermittently bypasses mocking.
 *
 * 2. **The mock layer must not reach a production bundle.** Guarding a render
 *    branch is not enough — the bundler keeps any component whose body it can
 *    see, along with its dynamic imports. So the bootstrap component lives in a
 *    separate module reached only through React.lazy, and the flag that decides
 *    whether to reference it at all is a build-time constant. In a production
 *    build the reference is eliminated and the chunk is never emitted.
 */

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;
const MOCKING_FLAG = process.env.NEXT_PUBLIC_API_MOCKING;

const MOCKS_ENABLED =
  APP_ENV !== 'production' &&
  (MOCKING_FLAG === 'enabled' || MOCKING_FLAG === 'partial');

// Referenced only inside the enabled branch below, so the import is dropped
// entirely when MOCKS_ENABLED folds to false at build time.
const MswBootstrap = MOCKS_ENABLED
  ? React.lazy(() => import('./msw-bootstrap'))
  : null;

export function MswProvider({ children }: { children: React.ReactNode }) {
  if (!MOCKS_ENABLED || !MswBootstrap) return <>{children}</>;

  // Suspense fallback is null for the same reason MswBootstrap gates on
  // `ready`: nothing should render, and therefore nothing should fetch, until
  // the worker is intercepting.
  return (
    <React.Suspense fallback={null}>
      <MswBootstrap>{children}</MswBootstrap>
    </React.Suspense>
  );
}
