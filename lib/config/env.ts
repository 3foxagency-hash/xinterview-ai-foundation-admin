import { z } from 'zod';

/**
 * Environment contract for the app.
 *
 * APP_ENV and API_MOCKING are deliberately independent axes: the most useful
 * local setup is `development` + mocking enabled — pointed at dev config, but
 * serving mock data because the endpoint does not exist on the backend yet.
 * A single `API_MODE=mock|dev|prod` variable cannot express that.
 */
const schema = z.object({
  NEXT_PUBLIC_APP_ENV: z
    .enum(['local', 'development', 'staging', 'production'])
    .default('local'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:8080'),
  NEXT_PUBLIC_API_MOCKING: z
    .enum(['enabled', 'disabled', 'partial'])
    .default('disabled'),
  /**
   * Only read when API_MOCKING=partial. Comma-separated resource names, so
   * three live endpoints and two mocked ones is expressible during
   * integration — which is what integration week actually looks like.
   */
  NEXT_PUBLIC_MOCK_RESOURCES: z.string().optional(),
});

// Referenced explicitly rather than via a loop: Next.js inlines NEXT_PUBLIC_*
// vars at build time only for statically analysable member expressions.
const parsed = schema.safeParse({
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
  NEXT_PUBLIC_MOCK_RESOURCES: process.env.NEXT_PUBLIC_MOCK_RESOURCES,
});

if (!parsed.success) {
  // Fail at module load rather than at a page render in production.
  throw new Error(
    `Invalid environment configuration:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')}`
  );
}

export const env = parsed.data;

export type AppEnv = typeof env.NEXT_PUBLIC_APP_ENV;

export const isProduction = env.NEXT_PUBLIC_APP_ENV === 'production';

/** True when any mocking is active — `enabled` or `partial`. */
export const isMocking =
  env.NEXT_PUBLIC_API_MOCKING !== 'disabled' && !isProduction;

/** Resource names mocked under `partial`. Empty set means "all of them". */
export const mockedResources = new Set(
  (env.NEXT_PUBLIC_MOCK_RESOURCES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

/**
 * Whether a given resource should be mocked.
 *
 * - `enabled`  → everything is mocked
 * - `partial`  → only the resources named in NEXT_PUBLIC_MOCK_RESOURCES
 * - `disabled` → nothing
 */
export function shouldMock(resource: string): boolean {
  if (!isMocking) return false;
  if (env.NEXT_PUBLIC_API_MOCKING === 'enabled') return true;
  return mockedResources.has(resource);
}

/**
 * Origin only — no path prefix.
 *
 * The XInterview backend serves auth at the root (`/login/tokens`,
 * `/user-management/me/`), so a global `/api/v1` prefix cannot be applied here.
 * Resources that do live under a prefix carry it in their own paths.
 */
export const apiOrigin = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');

/** Prefix used by the resources that are not yet on the real backend contract. */
export const API_V1 = '/api/v1';

/** @deprecated Use `apiOrigin` and put the prefix in the path. */
export const apiBaseUrl = `${apiOrigin}${API_V1}`;
