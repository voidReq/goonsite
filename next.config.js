// Paths the clean (6a68.dev) build must not serve: the goon pages, the message
// board with its API and admin page, and the joke files in public/. The pages
// here are also unlisted from navigation by isListed() in lib/site.ts.
const CLEAN_BLOCKED = [
  '/goon-hub',
  '/goon-sploit',
  '/message-board',
  '/api/messages',
  '/admin/messages',
  '/api/admin/messages',
  '/goon.exe',
  '/anti-goonware.c',
  '/og-image-generator.html',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  async rewrites() {
    if (process.env.NEXT_PUBLIC_SITE_VARIANT !== 'clean') {
      // The clean build's sitemap page has no reason to exist on goonsite.
      return { beforeFiles: [{ source: '/site-map', destination: '/404' }] };
    }
    return {
      beforeFiles: CLEAN_BLOCKED.flatMap((path) => [
        { source: path, destination: '/404' },
        { source: `${path}/:rest*`, destination: '/404' },
      ]),
    };
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      punycode: false,
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: blob:; font-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self' https://ip-api.com; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
