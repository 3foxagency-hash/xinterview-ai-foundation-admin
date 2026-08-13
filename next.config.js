/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },

  /**
   * MSW's Node build must not be bundled by webpack.
   *
   * `msw/node` imports @mswjs/interceptors via subpath exports
   * (./ClientRequest, ./XMLHttpRequest, ...) which Next's bundler fails to
   * resolve, producing "Package path ./ClientRequest is not exported".
   * Marking it external makes it a runtime `require`, where Node's own
   * resolver handles the exports field correctly.
   *
   * Server-only: the browser worker (msw/browser) bundles fine.
   */
  serverExternalPackages: ['msw', '@mswjs/interceptors'],
};

module.exports = nextConfig;
