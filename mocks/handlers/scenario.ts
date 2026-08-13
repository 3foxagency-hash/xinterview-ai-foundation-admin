import { delay } from 'msw';
import { activeScenario } from '../scenarios';
import { forbidden, rateLimited, serverError, latency } from '../repo/respond';

/**
 * Applies the active scenario before a handler does any real work.
 *
 * Returns a Response to short-circuit with, or null to continue normally.
 * Every handler calls this first, so a scenario applies uniformly instead of
 * each handler reimplementing its own failure branches.
 */
export async function applyScenario(): Promise<Response | null> {
  const scenario = activeScenario();

  switch (scenario) {
    case 'error500':
      await delay(latency());
      return serverError();

    case 'forbidden':
      await delay(latency());
      return forbidden();

    case 'rateLimited':
      await delay(latency());
      return rateLimited(60, 'Too many requests. Please try again shortly.');

    case 'offline':
      // Simulates a genuine network failure rather than an HTTP error, so the
      // client's NETWORK_ERROR path is exercised.
      return Response.error();

    case 'slow':
      await delay(3000);
      return null;

    case 'empty':
    case 'default':
    default:
      await delay(latency());
      return null;
  }
}

/** True when list endpoints should return zero records. */
export function isEmptyScenario(): boolean {
  return activeScenario() === 'empty';
}
