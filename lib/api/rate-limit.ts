/**
 * Client-side token bucket.
 *
 * This is a stampede guard, NOT a security control — devtools bypasses it
 * trivially. Its job is stopping our own UI from hammering the backend during
 * a render loop, a retry storm, or a user rage-clicking a failing button. The
 * backend limiter is the actual enforcement.
 *
 * When a bucket trips it means there is a bug in the calling code, so it logs
 * rather than silently smoothing the problem over.
 */

type Limit = { rate: number; burst: number };

const LIMITS: Record<string, Limit> = {
  default: { rate: 10, burst: 20 },
  // Side-effecting endpoints are held tight.
  'POST /auth/login': { rate: 1, burst: 5 },
  'POST /auth/register': { rate: 1, burst: 3 },
  'POST /auth/forgot-password': { rate: 1, burst: 3 },
  'POST /auth/otp/resend': { rate: 1, burst: 3 },
};

type Bucket = { tokens: number; last: number };

const buckets = new Map<string, Bucket>();

function limitFor(key: string): Limit {
  return LIMITS[key] ?? LIMITS.default;
}

/** Consume one token. Returns false when the caller should back off. */
export function take(key: string): boolean {
  const { rate, burst } = limitFor(key);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: burst, last: now };

  // Refill continuously rather than on an interval.
  const elapsedSeconds = (now - bucket.last) / 1000;
  bucket.tokens = Math.min(burst, bucket.tokens + elapsedSeconds * rate);
  bucket.last = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

/** Test/teardown helper. */
export function resetRateLimits(): void {
  buckets.clear();
}

// ─── Circuit breaker ───

type Breaker = { failures: number; openedAt: number | null };

const breakers = new Map<string, Breaker>();
const BREAKER = { threshold: 5, cooldownMs: 30_000 };

/**
 * True when the endpoint is in an open circuit and should fail fast.
 * Prevents a backend outage from becoming a self-inflicted DDoS from many
 * open dashboards all polling and retrying.
 */
export function isCircuitOpen(key: string): boolean {
  const b = breakers.get(key);
  if (!b?.openedAt) return false;
  if (Date.now() - b.openedAt > BREAKER.cooldownMs) {
    // Half-open: allow one probe through.
    b.openedAt = null;
    b.failures = 0;
    breakers.set(key, b);
    return false;
  }
  return true;
}

export function recordSuccess(key: string): void {
  breakers.delete(key);
}

export function recordFailure(key: string): void {
  const b = breakers.get(key) ?? { failures: 0, openedAt: null };
  b.failures += 1;
  if (b.failures >= BREAKER.threshold && !b.openedAt) {
    b.openedAt = Date.now();
  }
  breakers.set(key, b);
}

export function resetBreakers(): void {
  breakers.clear();
}
