import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Node-side MSW. Intercepts fetches made from Server Components, Route
 * Handlers, Vitest and Playwright's server-side calls.
 *
 * Started from instrumentation.ts in dev, and from the test setup file in
 * tests. Handlers are shared with the browser worker, so a contract change
 * breaks the dev environment and the test suite at the same time — which is how
 * the mock layer pays for itself twice.
 */
export const server = setupServer(...handlers);
