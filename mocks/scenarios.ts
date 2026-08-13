/**
 * Named scenarios, switchable at runtime from the dev panel.
 *
 * Most production bugs live in the states nobody looked at, so every resource
 * ships an error and an empty scenario that a reviewer can reach in seconds
 * without editing code.
 *
 * Handlers read the active scenario via `activeScenario()` and branch before
 * doing any real work.
 */

export const SCENARIOS = [
  'default',
  'empty',
  'error500',
  'slow',
  'forbidden',
  'rateLimited',
  'offline',
] as const;

export type Scenario = (typeof SCENARIOS)[number];

export const SCENARIO_LABELS: Record<Scenario, string> = {
  default: 'Default — happy path',
  empty: 'Empty — no records',
  error500: 'Server error — 500 on every call',
  slow: 'Slow — 3s latency',
  forbidden: 'Forbidden — 403 on every call',
  rateLimited: 'Rate limited — 429 with retry-after',
  offline: 'Offline — network failure',
};

/**
 * Scenario state lives on globalThis rather than a module variable so the
 * browser worker and any server-side handler instance in the same process
 * observe the same value.
 */
const KEY = '__xinterview_mock_scenario__';
const STORAGE_KEY = 'xinterview:mock-scenario';

type Store = { scenario: Scenario };

function store(): Store {
  const g = globalThis as typeof globalThis & { [KEY]?: Store };
  if (!g[KEY]) g[KEY] = { scenario: 'default' };
  return g[KEY];
}

export function activeScenario(): Scenario {
  return store().scenario;
}

export function setScenario(next: Scenario): void {
  store().scenario = next;
  // Persist so a page reload keeps the reviewer in the state they selected.
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing or storage disabled — in-memory only is fine.
    }
  }
}

/** Restores the persisted scenario. Called once when the worker starts. */
export function restoreScenario(): Scenario {
  if (typeof localStorage === 'undefined') return activeScenario();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (SCENARIOS as readonly string[]).includes(saved)) {
      store().scenario = saved as Scenario;
    }
  } catch {
    // Ignore.
  }
  return activeScenario();
}
