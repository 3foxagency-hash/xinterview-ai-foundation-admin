import type { RequestHandler } from 'msw';
import { authHandlers } from './auth';
import { umHandlers } from './user-management';

type Resource = 'auth' | 'user-management';

const ALL: Record<Resource, RequestHandler[]> = {
  auth: authHandlers,
  'user-management': umHandlers,
};

function activeResources(): Resource[] {
  const mode = process.env.NEXT_PUBLIC_API_MOCKING;
  if (mode === 'disabled') return [];
  if (mode === 'partial') {
    const csv = process.env.NEXT_PUBLIC_MOCK_RESOURCES ?? '';
    return csv
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is Resource => s === 'auth' || s === 'user-management');
  }
  // 'enabled' (or unset — default to on, matching NEXT_PUBLIC_API_MOCKING's
  // documented default of 'enabled' in .env.development / .env.example)
  return ['auth', 'user-management'];
}

export const handlers: RequestHandler[] = activeResources().flatMap((r) => ALL[r]);
