import NextAuth from 'next-auth';
import Zitadel from 'next-auth/providers/zitadel';

// Zitadel role claim key for project roles
const ZITADEL_ROLES_CLAIM = 'urn:zitadel:iam:org:project:roles';

/**
 * Extract roles from Zitadel profile claims
 * Zitadel returns roles as: { "role_name": { "org_id": "org_name" } }
 * We extract just the role names as a string array
 */
function extractRoles(profile: Record<string, unknown>): string[] {
  const rolesClaim = profile[ZITADEL_ROLES_CLAIM];
  if (!rolesClaim || typeof rolesClaim !== 'object') {
    return [];
  }
  return Object.keys(rolesClaim as Record<string, unknown>);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID!,
      issuer: process.env.ZITADEL_ISSUER!,
      authorization: {
        params: {
          // Request roles scope to include project roles in the token
          scope: 'openid profile email urn:zitadel:iam:org:project:roles',
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
