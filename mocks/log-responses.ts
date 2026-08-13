import type { SetupWorker } from 'msw/browser';

/**
 * Logs every mocked response body to the console.
 *
 * Why this exists: Chrome DevTools frequently shows an **empty Response tab**
 * for requests fulfilled by a Service Worker. The body is genuinely there —
 * `Network.getResponseBody` returns it over the debugging protocol — but the
 * panel often fails to render it, because the request was answered by the
 * worker rather than travelling over the wire.
 *
 * Rather than fight the Network panel, MSW's own lifecycle events give us the
 * response directly. Each entry is a collapsed console group holding the status,
 * timing and the parsed JSON body — expandable and searchable, and it survives
 * navigation if "Preserve log" is on.
 *
 * Toggle at runtime from the console:
 *
 *   __msw.log(false)   // silence
 *   __msw.log(true)    // re-enable
 */

const STORAGE_KEY = 'xinterview:mock-response-log';

function enabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  // Default on: the whole point is that you see bodies without opting in.
  return localStorage.getItem(STORAGE_KEY) !== 'off';
}

function setEnabled(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Private browsing — in-memory default is fine.
  }
  console.info(`[msw] response logging ${on ? 'enabled' : 'disabled'}`);
}

const STYLES = {
  ok: 'color:#1F5C4A;font-weight:600',
  clientError: 'color:#9A4A26;font-weight:600',
  serverError: 'color:#9A3226;font-weight:600',
  dim: 'color:#807C74',
};

function statusStyle(status: number): string {
  if (status >= 500) return STYLES.serverError;
  if (status >= 400) return STYLES.clientError;
  return STYLES.ok;
}

export function attachResponseLogger(worker: SetupWorker): void {
  const started = new Map<string, number>();

  worker.events.on('request:start', ({ requestId }) => {
    started.set(requestId, performance.now());
  });

  worker.events.on('response:mocked', async ({ response, request, requestId }) => {
    if (!enabled()) return;

    const ms = started.has(requestId)
      ? Math.round(performance.now() - started.get(requestId)!)
      : null;
    started.delete(requestId);

    // The response is consumed downstream, so read a clone.
    let body: unknown;
    let raw = '';
    try {
      raw = await response.clone().text();
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw; // Non-JSON (HTML error page, plain text).
    }

    const path = new URL(request.url).pathname;

    console.groupCollapsed(
      `%c⇄ MSW%c ${request.method} ${path} %c${response.status}%c${ms !== null ? ` · ${ms}ms` : ''}`,
      STYLES.dim,
      'color:inherit',
      statusStyle(response.status),
      STYLES.dim
    );
    console.log('Response:', body);
    if (request.method !== 'GET') {
      // Request bodies matter most on writes, and MSW has already consumed the
      // original — clone before reading so the handler still sees it.
      request
        .clone()
        .text()
        .then((text) => {
          if (!text) return;
          try {
            console.log('Request: ', JSON.parse(text));
          } catch {
            console.log('Request: ', text);
          }
        })
        .catch(() => undefined);
    }
    console.log('%cURL:', STYLES.dim, request.url);
    console.groupEnd();
  });

  // Unhandled requests are the ones that reveal a missing handler, so they get
  // a visible warning rather than being silently absent from the log.
  worker.events.on('request:unhandled', ({ request }) => {
    if (!enabled()) return;
    const { pathname, origin } = new URL(request.url);
    if (origin === location.origin && !pathname.startsWith('/api')) return;
    console.warn(`[msw] unhandled — no handler for ${request.method} ${pathname}`);
  });

  // Console handle, so the log can be silenced without a code change.
  (window as typeof window & { __msw?: unknown }).__msw = {
    log: setEnabled,
    get enabled() {
      return enabled();
    },
  };

  console.info(
    '%c[msw]%c response logging is ON — every mocked call is logged with its body. ' +
      'Disable with __msw.log(false)',
    STYLES.ok,
    'color:inherit'
  );
}
