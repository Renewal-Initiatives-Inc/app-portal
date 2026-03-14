import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authOriginal } from '@/lib/auth';

/**
 * Check if E2E test mode is enabled.
 * This is a simplified check for edge runtime (middleware).
 * Has the same safeguards as the main isE2ETestMode() function.
 */
function isE2ETestModeEdge(): boolean {
  // SAFEGUARD 1: Never enable in Node production environment
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // SAFEGUARD 2: Never enable in Vercel production deployment
  if (process.env.VERCEL_ENV === 'production') {
    return false;
  }

  // SAFEGUARD 3: Must be explicitly enabled
  return process.env.E2E_TEST_MODE === 'true';
}

export async function middleware(request: NextRequest) {
  // In E2E test mode, allow all requests through without auth check
  if (isE2ETestModeEdge()) {
    return NextResponse.next();
  }

  // Normal auth middleware - use the original NextAuth auth
  // @ts-expect-error - NextAuth middleware typing is complex
  return authOriginal(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (auth page)
     * - /auth/* (auth callbacks and errors)
     * - /api/auth/* (Auth.js API routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico, /sitemap.xml, /robots.txt (metadata files)
     */
    '/((?!login|auth|api/auth|api/cron|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
