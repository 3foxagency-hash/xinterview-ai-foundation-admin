import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Browser-side MSW. Intercepts fetches made from Client Components via a
 * Service Worker.
 *
 * This is only half the setup — Server Components bypass the Service Worker
 * entirely. See instrumentation.ts for the Node half. Enabling only this one is
 * the classic failure: the client-side path works, the RSC path silently hits a
 * real host, and it looks like a mysterious environment bug.
 */
export const worker = setupWorker(...handlers);
