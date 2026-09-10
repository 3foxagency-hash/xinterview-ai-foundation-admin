import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

/**
 * MSW's default per-request console.group log is easy to miss (collapsed,
 * mixed in with app logs), and mocked responses can show as opaque in the
 * Network tab (served by the Service Worker, not a real network round trip).
 * This prints one always-visible line per *mocked* request/response so you
 * don't have to rely on the Network tab to see what's happening. Static
 * assets, Next.js internals and RSC navigations are excluded — they are
 * never mocked and would otherwise drown out the signal.
 */
function isNoise(url: string): boolean {
  return (
    url.includes('/_next/') ||
    /\?_rsc=/.test(url) ||
    /\.(js|css|png|jpg|jpeg|svg|ico|woff2?|mp4|webm)(\?|$)/.test(url)
  );
}

worker.events.on('response:mocked', async ({ request, response }) => {
  if (isNoise(request.url)) return;
  const body = await response.clone().text().catch(() => '');
  console.log(
    `%c[MSW ← ${response.status}] ${request.method} ${request.url}`,
    response.ok ? 'color:#2e9e5b' : 'color:#d9534f',
    '\n',
    body
  );
});

worker.events.on('request:unhandled', ({ request }) => {
  if (isNoise(request.url)) return;
  console.warn(`[MSW ✗ unhandled — falls through to real fetch] ${request.method} ${request.url}`);
});
