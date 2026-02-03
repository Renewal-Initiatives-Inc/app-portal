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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
