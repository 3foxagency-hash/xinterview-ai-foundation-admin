'use client';

import * as React from 'react';

/**
 * Starts the MSW browser worker, then renders its children.
 *
 * Deliberately a separate module from msw-provider so it can be reached only
 * through React.lazy — that is what keeps MSW, the handlers and the mock seed
 * data out of a production bundle. Do not import this file directly.
 */
export default function MswBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const [{ worker }, { restoreScenario }, { attachResponseLogger }] =
        await Promise.all([
          import('@/mocks/browser'),
          import('@/mocks/scenarios'),
          import('@/mocks/log-responses'),
        ]);

      restoreScenario();

      // Chrome often renders an empty Response tab for Service Worker-fulfilled
      // requests, so the body is logged to the console instead.
      attachResponseLogger(worker);

      await worker.start({
        serviceWorker: { url: '/mockServiceWorker.js' },
        quiet: false,

        /**
         * Warn only about unhandled *API* calls.
         *
         * The default 'warn' also fires for Next.js's own traffic — RSC payload
         * fetches (`/login?_rsc=…`), HMR polling, static assets — which buries
         * the one warning that matters (a real endpoint with no handler) under
         * noise on every navigation.
         */
        onUnhandledRequest(request, print) {
          const { pathname, origin } = new URL(request.url);

          // Next.js internals and same-origin page/asset requests.
          if (
            pathname.startsWith('/_next') ||
            pathname.startsWith('/__next') ||
            request.url.includes('_rsc=') ||
            (origin === location.origin && !pathname.startsWith('/api'))
          ) {
            return;
          }

          // Static media and fonts served from a CDN are real assets we do not
          // mock, so warning about them is pure noise.
          if (/\.(mp4|webm|png|jpe?g|svg|gif|webp|woff2?|ico|css)$/i.test(pathname)) {
            return;
          }

          print.warning();
        },
      });

      if (!cancelled) setReady(true);
    })().catch((error) => {
      // Failing open is deliberate: a worker that will not start should not
      // leave a blank page. Calls fall through to the real API and log loudly.
      console.error('[msw] worker failed to start, continuing unmocked', error);
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
