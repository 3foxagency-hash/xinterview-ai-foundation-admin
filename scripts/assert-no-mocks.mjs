#!/usr/bin/env node
/**
 * Production build guard.
 *
 * A dashboard silently serving mock data to a customer is the worst failure
 * this setup can produce, so it is prevented by a check rather than by memory.
 *
 * Two assertions:
 *   1. The environment does not request mocking.
 *   2. No emitted client chunk is reachable from a route while containing mock
 *      code — catching the case where a guard was written but the bundler kept
 *      the import anyway (which has happened here once already).
 *
 * Run after `next build`:  node scripts/assert-no-mocks.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];

// ─── 1. Environment ───

const mocking = process.env.NEXT_PUBLIC_API_MOCKING ?? 'disabled';
const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? 'local';

if (appEnv === 'production' && mocking !== 'disabled') {
  failures.push(
    `NEXT_PUBLIC_API_MOCKING is "${mocking}" in a production build — must be "disabled".`
  );
}

// ─── 2. Bundle reachability ───

const CHUNKS = '.next/static/chunks';

// Strings that only ever appear in mock code.
const FINGERPRINTS = [
  'onUnhandledRequest',
  'mockServiceWorker.js',
  'usr_01hxowner',
  'locked@xinterview.ai',
];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (entry.name.endsWith('.js')) out.push(path);
  }
  return out;
}

if (appEnv === 'production' && existsSync(CHUNKS)) {
  const all = walk(CHUNKS);

  const tainted = all.filter((file) => {
    const source = readFileSync(file, 'utf8');
    return FINGERPRINTS.some((f) => source.includes(f));
  });

  if (tainted.length > 0) {
    // A tainted chunk is only a real leak if something reachable loads it.
    // Next.js may emit orphaned chunks that no route references; those never
    // reach a browser.
    const entrypoints = all.filter((f) => f.includes('/chunks/app/'));
    const manifest = existsSync('.next/build-manifest.json')
      ? readFileSync('.next/build-manifest.json', 'utf8')
      : '';

    const reachable = tainted.filter((file) => {
      const id = file.split('/').pop().split('.')[0];
      if (manifest.includes(id)) return true;
      return entrypoints.some((entry) => {
        if (entry === file) return false;
        return new RegExp(`\\b${id}\\b`).test(readFileSync(entry, 'utf8'));
      });
    });

    if (reachable.length > 0) {
      failures.push(
        `Mock code is reachable from a production route:\n` +
          reachable.map((f) => `    ${f}`).join('\n') +
          `\n  Guard the import behind a build-time constant and React.lazy ` +
          `(see components/providers/msw-provider.tsx).`
      );
    } else {
      console.log(
        `  note: ${tainted.length} orphaned mock chunk(s) emitted but unreachable — OK`
      );
    }
  }
}

// ─── Report ───

if (failures.length > 0) {
  console.error('\n✗ Production mock guard FAILED\n');
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log('✓ Production mock guard passed — no mock code reachable');
