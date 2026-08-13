/**
 * Next.js instrumentation hook — runs once per server process, before any
 * request is handled.
 *
 * This is the server half of the mock layer. The MSW Service Worker only
 * intercepts browser fetches, so without this a Server Component would bypass
 * mocking entirely and hit a real API that may not exist yet.
 *
 * Requires Turbopack (`next dev --turbopack`). Webpack cannot resolve the
 * subpath export conditions @mswjs/interceptors uses inside the instrumentation
 * bundle — see mocks/README.md.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const mocking = process.env.NEXT_PUBLIC_API_MOCKING;
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;

  // Belt and braces: mocks must never start in production, whatever the env
  // file says. A dashboard serving mock data to a customer is the worst failure
  // this setup can produce.
  if (appEnv === 'production') return;
  if (mocking !== 'enabled' && mocking !== 'partial') return;

  const { server } = await import('./mocks/server');

  // 'warn' rather than 'error': an unhandled call logs loudly instead of
  // silently reaching a real host, but does not break unrelated requests
  // (Next.js itself fetches during dev).
  server.listen({ onUnhandledRequest: 'warn' });

  console.log(
    `[msw] server-side mocking active (${mocking}) — Server Components are intercepted`
  );
}
