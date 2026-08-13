/**
 * Idempotency-key replay store.
 *
 * The failure this exists to reproduce: a recruiter clicks "Send invitations to
 * 40 candidates", the request lands, the response times out, the UI shows an
 * error, they click again — and forty candidates get a second invitation from an
 * employer.
 *
 * The server contract is: store the key with its response, and a repeat within
 * the window returns the ORIGINAL response — not a new action, not an error.
 * Mocking this is what makes the client's per-intent key generation testable
 * locally instead of only in production.
 */

const KEY = '__xinterview_mock_idempotency__';
const TTL_MS = 24 * 60 * 60 * 1000;

type Entry = { body: string; status: number; storedAt: number };

function store(): Map<string, Entry> {
  const g = globalThis as typeof globalThis & { [KEY]?: Map<string, Entry> };
  if (!g[KEY]) g[KEY] = new Map();
  return g[KEY];
}

/** Keys are scoped per organisation, as the real contract requires. */
function scoped(orgId: string, key: string): string {
  return `${orgId}::${key}`;
}

export const idempotency = {
  has(orgId: string, key: string | null): boolean {
    if (!key) return false;
    const entry = store().get(scoped(orgId, key));
    if (!entry) return false;
    if (Date.now() - entry.storedAt > TTL_MS) {
      store().delete(scoped(orgId, key));
      return false;
    }
    return true;
  },

  /** Replays the original response verbatim. */
  replay(orgId: string, key: string): Response {
    const entry = store().get(scoped(orgId, key))!;
    return new Response(entry.body, {
      status: entry.status,
      headers: {
        'content-type': 'application/json',
        'x-idempotent-replay': 'true',
      },
    });
  },

  /**
   * Records a response against the key. Returns the response so a handler can
   * `return idempotency.store(...)` in one expression.
   */
  async store(
    orgId: string,
    key: string | null,
    response: Response
  ): Promise<Response> {
    if (!key) return response;
    // Read from a clone: the original body must stay unconsumed for the caller.
    const body = await response.clone().text();
    store().set(scoped(orgId, key), {
      body,
      status: response.status,
      storedAt: Date.now(),
    });
    return response;
  },

  reset(): void {
    store().clear();
  },
};
