import { z } from 'zod';

/**
 * Environment contract for the app.
 */
const schema = z.object({
  NEXT_PUBLIC_APP_ENV: z
    .enum(['local', 'development', 'staging', 'production'])
    .default('local'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:8080'),
});

// Referenced explicitly rather than via a loop: Next.js inlines NEXT_PUBLIC_*
// vars at build time only for statically analysable member expressions.
const parsed = schema.safeParse({
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
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
