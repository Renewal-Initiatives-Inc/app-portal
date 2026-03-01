import type { NextConfig } from "next";

// BUILD-TIME SECURITY CHECK: Prevent E2E test mode in production builds
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL_ENV === 'production';

if (isProduction && process.env.E2E_TEST_MODE) {
  throw new Error(
    '🚨 SECURITY ERROR: E2E_TEST_MODE cannot be set in production builds!\n' +
    'This would bypass authentication. Remove E2E_TEST_MODE from your environment.'
  );
}

const zitadelHost = process.env.ZITADEL_ISSUER
  ? new URL(process.env.ZITADEL_ISSUER).host
  : '';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async headers() {
    // Build CSP directives
    // Note: Next.js requires 'unsafe-inline' for scripts (hydration) and styles (Tailwind/Radix)
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: https://*.public.blob.vercel-storage.com`,
      `connect-src 'self'${zitadelHost ? ` https://${zitadelHost}` : ''}`,
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
