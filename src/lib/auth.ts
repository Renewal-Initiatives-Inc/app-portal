import NextAuth from 'next-auth';
import Zitadel from 'next-auth/providers/zitadel';
import { isE2ETestMode, getE2EMockSession } from './test-mode';
import { logAuditEvent, AUDIT_ACTIONS } from './db/audit-logs';

// Zitadel role claim keys - check both generic and project-specific formats
const ZITADEL_ROLES_CLAIM_GENERIC = 'urn:zitadel:iam:org:project:roles';
const ZITADEL_PROJECT_ID = process.env.ZITADEL_PROJECT_ID || '';
const ZITADEL_ROLES_CLAIM_SPECIFIC = `urn:zitadel:iam:org:project:${ZITADEL_PROJECT_ID}:roles`;

/**
 * Extract roles from Zitadel profile claims
 * Zitadel returns roles as: { "role_name": { "org_id": "org_name" } }
 * We extract just the role names as a string array
 * Checks both generic and project-specific claim formats
 */
function extractRoles(profile: Record<string, unknown>): string[] {
  // Try generic claim first, then project-specific
  let rolesClaim = profile[ZITADEL_ROLES_CLAIM_GENERIC];
  if (!rolesClaim) {
    rolesClaim = profile[ZITADEL_ROLES_CLAIM_SPECIFIC];
  }

  if (!rolesClaim || typeof rolesClaim !== 'object') {
    return [];
  }
  return Object.keys(rolesClaim as Record<string, unknown>);
}

const nextAuth = NextAuth({
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID!,
      issuer: process.env.ZITADEL_ISSUER!,
      authorization: {
        params: {
          // Request roles scope and audience for project to include roles in the token
          // IMPORTANT: Use urn:zitadel:iam:org:projects:roles (plural "projects") to request roles
          // The claim returned will be urn:zitadel:iam:org:project:{projectid}:roles
          scope: `openid profile email urn:zitadel:iam:org:projects:roles urn:zitadel:iam:org:project:id:${process.env.ZITADEL_PROJECT_ID}:aud`,
        },
      },
    }),
  ],
  callbacks: {
    signIn: async ({ profile }) => {
      const roles = extractRoles(profile as Record<string, unknown>);
      if (!roles.includes('admin') && !roles.includes('app:app-portal')) {
        // Log denied login for incident detection (policy §10.1)
        // Fire-and-forget — don't block the auth flow
        const p = profile as Record<string, unknown>;
        logAuditEvent(
          (p.sub as string) || 'unknown',
          (p.email as string) || 'unknown',
          AUDIT_ACTIONS.LOGIN_DENIED,
          null,
          { afterState: { roles, reason: 'missing required role' } }
        ).catch(() => {/* swallow — logging failure must not break auth */});
        return false;
      }
      return true;
    },
    authorized: async ({ auth }) => {
      // Logged in users are authenticated
      return !!auth;
    },
    jwt: async ({ token, account, profile }) => {
      // Persist user ID, email, and roles from Zitadel to the JWT
      if (account && profile) {
        token.userId = profile.sub ?? undefined;
        token.email = profile.email ?? token.email;
        token.name = profile.name ?? token.name;
        token.roles = extractRoles(profile as Record<string, unknown>);
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Add user ID, email, and roles to session
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      if (token.name) {
        session.user.name = token.name as string;
      }
      session.user.roles = (token.roles as string[]) || [];
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  trustHost: true,
});

// Export handlers, signIn, signOut directly from NextAuth
export const { handlers, signIn, signOut } = nextAuth;

// Re-export the original auth for use in middleware (which can't use test mode)
export const authOriginal = nextAuth.auth;

/**
 * Wrapped auth function that supports E2E test mode.
 * In test mode, returns a mock session instead of checking real authentication.
 *
 * SECURITY: Test mode is protected by multiple safeguards in test-mode.ts
 * and will never activate in production environments.
 */
export async function auth(): Promise<{
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles: string[];
  };
  expires: string;
} | null> {
  // Check if E2E test mode is active (has multiple production safeguards)
  if (isE2ETestMode()) {
    const mockSession = getE2EMockSession();
    if (mockSession) {
      return mockSession;
    }
  }

  // Normal authentication flow
  return nextAuth.auth() as Promise<{
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: string[];
    };
    expires: string;
  } | null>;
}
