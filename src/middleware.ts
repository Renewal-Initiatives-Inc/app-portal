export { auth as middleware } from '@/lib/auth';

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
    '/((?!login|auth|api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
