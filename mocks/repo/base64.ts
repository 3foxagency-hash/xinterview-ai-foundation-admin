/**
 * Isomorphic base64url helpers.
 *
 * Handlers run in BOTH runtimes — the browser Service Worker and Node — so
 * anything they touch must exist in both. `Buffer` is Node-only: using it here
 * throws inside the worker, which surfaces as a 500 from the mock and looks
 * like a handler bug rather than a missing global.
 */

export function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64Url(input: string): string {
  const padded = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
