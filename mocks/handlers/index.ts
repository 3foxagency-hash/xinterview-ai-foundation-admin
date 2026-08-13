import type { RequestHandler } from 'msw';
import { shouldMock } from '@/lib/config/env';
import { authHandlers } from './auth';
import { jobHandlers } from './jobs';

/**
 * Handler registry, keyed by resource name.
 *
 * The keys are the values accepted in NEXT_PUBLIC_MOCK_RESOURCES, so under
 * `API_MOCKING=partial` a resource can be mocked while its neighbours hit the
 * real backend. That is what integration week actually looks like — endpoints
 * going live one at a time, not a single flip.
 */
const REGISTRY: Record<string, RequestHandler[]> = {
  auth: authHandlers,
  jobs: jobHandlers,
};

export const MOCKED_RESOURCES = Object.keys(REGISTRY);

/** Handlers active for the current environment configuration. */
export function activeHandlers(): RequestHandler[] {
  return Object.entries(REGISTRY)
    .filter(([resource]) => shouldMock(resource))
    .flatMap(([, handlers]) => handlers);
}

export const handlers = activeHandlers();
