import NextAuth from 'next-auth';
import Zitadel from 'next-auth/providers/zitadel';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID!,
      issuer: process.env.ZITADEL_ISSUER!,
      authorization: {
        params: {
          scope: 'openid profile email',
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
      // Persist user ID from Zitadel to the JWT
      if (account && profile) {
        token.userId = profile.sub;
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Add user ID to session
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  trustHost: true,
});
