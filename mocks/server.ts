import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Vitest only — not wired into the running Next.js app. See docs/msw-mocking.md. */
export const server = setupServer(...handlers);
