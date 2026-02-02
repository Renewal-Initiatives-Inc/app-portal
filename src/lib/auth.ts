import NextAuth from 'next-auth';
import Zitadel from 'next-auth/providers/zitadel';

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
  // Debug: Log the full profile to see what claims Zitadel returns
  console.log('[Auth Debug] Full profile claims:', JSON.stringify(profile, null, 2));
  console.log('[Auth Debug] Looking for claims:', ZITADEL_ROLES_CLAIM_GENERIC, 'or', ZITADEL_ROLES_CLAIM_SPECIFIC);

  // Try generic claim first, then project-specific
  let rolesClaim = profile[ZITADEL_ROLES_CLAIM_GENERIC];
  if (!rolesClaim) {
    console.log('[Auth Debug] Generic claim not found, trying project-specific');
    rolesClaim = profile[ZITADEL_ROLES_CLAIM_SPECIFIC];
  }
  console.log('[Auth Debug] Roles claim:', JSON.stringify(rolesClaim, null, 2));

  if (!rolesClaim || typeof rolesClaim !== 'object') {
    console.log('[Auth Debug] No roles claim found or invalid type');
    return [];
  }
  const roles = Object.keys(rolesClaim as Record<string, unknown>);
  console.log('[Auth Debug] Extracted roles:', roles);
  return roles;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID!,
      issuer: process.env.ZITADEL_ISSUER!,
      authorization: {
        params: {
          // Request roles scope and audience for project to include roles in the token
          // Include both generic roles claim and project-specific audience
          scope: `openid profile email urn:zitadel:iam:org:project:roles urn:zitadel:iam:org:project:id:${process.env.ZITADEL_PROJECT_ID}:aud`,
        },
      },
    }),
  ],
  callbacks: {
    authorized: async ({ auth }) => {
      // Logged in users are authenticated
      return !!auth;
    },
    jwt: async ({ token, account, profile }) => {
      // Persist user ID and roles from Zitadel to the JWT
      if (account && profile) {
        token.userId = profile.sub ?? undefined;
        token.roles = extractRoles(profile as Record<string, unknown>);
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Add user ID and roles to session
      if (token.userId) {
        session.user.id = token.userId as string;
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
