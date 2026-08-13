'use client';

import * as React from 'react';

/**
 * Dev-only environment badge and scenario switcher.
 *
 * Two jobs:
 *
 * 1. The badge says which environment the tab points at, and whether data is
 *    mocked. This is what prevents "I ran a destructive action against prod"
 *    and "I demoed mock data and called it real".
 * 2. The scenario switcher makes the five-state contract real. A reviewer on a
 *    preview deploy can reach the empty, error and rate-limited states in
 *    seconds without editing code — and most production bugs live in exactly
 *    the states nobody looked at.
 *
 * The body lives in a separate module behind React.lazy: a render-time guard
 * alone does not stop the bundler from including a component it can see, so the
 * reference itself must disappear at build time.
 */

const PANEL_ENABLED = process.env.NEXT_PUBLIC_APP_ENV !== 'production';

const PanelBody = PANEL_ENABLED
  ? React.lazy(() => import('./dev-mock-panel-body'))
  : null;

export function DevMockPanel() {
  if (!PANEL_ENABLED || !PanelBody) return null;
  return (
    <React.Suspense fallback={null}>
      <PanelBody />
    </React.Suspense>
  );
}
