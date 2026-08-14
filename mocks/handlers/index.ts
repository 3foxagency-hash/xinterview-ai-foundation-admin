import type { RequestHandler } from 'msw';
import { shouldMock } from '@/lib/config/env';
import { authHandlers } from './auth';
import { userManagementHandlers } from './user-management';
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
  // Registered after auth: /user-management/me/ must not be shadowed by a
  // broader auth pattern, and MSW matches in array order.
  'user-management': userManagementHandlers,
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
