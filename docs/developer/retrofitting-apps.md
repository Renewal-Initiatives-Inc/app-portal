# Retrofitting Existing Apps

This guide explains how to migrate an existing Auth.js (NextAuth) application to use Zitadel authentication.

## Overview

If your app already uses Auth.js with a different provider (e.g., Google, GitHub, or a custom provider), you can migrate to Zitadel with minimal changes.

## Before You Start

### Checklist

- [ ] Access to Zitadel Console
- [ ] App currently uses Auth.js
- [ ] Custom domain set up (or planned)
- [ ] Test user account available

### Plan Your Migration

1. Set up Zitadel configuration (can run in parallel with existing auth)
2. Test in development
3. Update production environment variables
4. Remove old provider

## Step 1: Create Zitadel Application

Follow the steps in [Adding New Apps](./adding-new-apps.md#step-1-configure-zitadel) to:

1. Create an OIDC application in Zitadel
2. Configure redirect URIs for your app
3. Note your Client ID and Issuer

## Step 2: Update Auth Configuration

### Current Configuration (Example)

Your current `auth.ts` might look like:

```typescript
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});
```

### New Configuration

Replace with Zitadel:

```typescript
import NextAuth from 'next-auth';
import Zitadel from 'next-auth/providers/zitadel';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID!,
      issuer: process.env.ZITADEL_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        // Extract roles from Zitadel claims
        if (profile && 'urn:zitadel:iam:org:project:roles' in profile) {
          const rolesObj = profile['urn:zitadel:iam:org:project:roles'] as Record<string, unknown>;
          token.roles = Object.keys(rolesObj);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub || '';
      session.user.roles = (token.roles as string[]) || [];
      return session;
    },
  },
});
```

### Extend Types (if using TypeScript)

Add to `src/types/next-auth.d.ts`:

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    roles?: string[];
    accessToken?: string;
  }
}
```

## Step 3: Update Environment Variables

### Remove Old Variables

```env
# Remove these
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Add New Variables

```env
# Add these
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_ISSUER=https://your-instance.zitadel.cloud
AUTH_SECRET=generate-a-new-secret
```

**Important:** Generate a new AUTH_SECRET even if you had one before:

```bash
openssl rand -base64 32
```

## Step 4: Set Up Custom Domain (If Not Already)

For SSO to work seamlessly between the portal and your app, use a subdomain of `renewalinitiatives.org`.

### In Vercel

1. Go to your project's **Settings > Domains**
2. Add your custom domain (e.g., `myapp.renewalinitiatives.org`)
3. Follow DNS configuration instructions

### Update Zitadel

Add the production redirect URI:
```
https://myapp.renewalinitiatives.org/api/auth/callback/zitadel
```

## Step 5: Handle User Migration

### User IDs Will Change

Zitadel user IDs are different from your old provider's IDs. Plan for this:

**Option A: No User Data (Simplest)**
If your app doesn't store user-specific data, no migration needed.

**Option B: Map by Email**
If you have user data keyed by ID, create a migration:

```typescript
// One-time migration script
async function migrateUserIds() {
  const users = await db.users.findAll();

  for (const user of users) {
    // Look up Zitadel user by email
    const zitadelUser = await lookupZitadelUserByEmail(user.email);

    // Update your records
    await db.users.update(user.id, {
      zitadelId: zitadelUser.id,
    });
  }
}
```

**Option C: Keep Both**
Store both old and new IDs, link on first login:

```typescript
callbacks: {
  async signIn({ user, account }) {
    const existingUser = await db.users.findByEmail(user.email);
    if (existingUser && !existingUser.zitadelId) {
      await db.users.update(existingUser.id, {
        zitadelId: user.id,
      });
    }
    return true;
  },
}
```

## Step 6: Test the Migration

### Development Testing

1. Start your app locally
2. Clear all cookies and session storage
3. Navigate to a protected page
4. Verify redirect to Zitadel login
5. Log in with your Zitadel credentials
6. Verify session is created correctly
7. Check `session.user.roles` contains expected roles

### Production Testing

1. Deploy with new configuration
2. Test with a non-admin user account
3. Verify:
   - Login flow works
   - SSO from portal works (click app → no re-login)
   - Logout works
   - Permissions are enforced

## Step 7: Register in Portal

1. Log in to the admin portal
2. Navigate to **Apps > Add App**
3. Register your app with appropriate details
4. Assign permissions to users

## Step 8: Clean Up

After successful migration:

1. Remove old provider dependencies (if no longer needed):
   ```bash
   npm uninstall @auth/google-provider
   ```

2. Remove old environment variables from all environments

3. Delete old OAuth app from previous provider's console (Google, GitHub, etc.)

## Rollback Plan

If issues arise, you can temporarily revert:

1. **Keep old config available**: Don't delete your old `auth.ts` immediately
2. **Environment variables**: Have old values documented
3. **Quick revert**: Swap environment variables back and redeploy

## Troubleshooting

### "OAuthAccountNotLinked" Error

User already exists with a different provider. Options:
- Ask user to log in with original method
- Admin can link accounts in Zitadel Console
- Clear the user's existing sessions

### Session Data Missing

If custom session data is missing:
- Check the `callbacks.session` function
- Verify token data is being passed correctly
- Check TypeScript types are extended properly

### Old Sessions Still Active

After switching providers, old sessions may persist:
- Clear cookies in browser
- Generate new AUTH_SECRET (invalidates all sessions)

### Cross-Origin Session Issues

For SSO between portal and app:
- Ensure same parent domain (`*.renewalinitiatives.org`)
- Check cookie `sameSite` settings
- Verify no conflicting cookies

## Migration Checklist

- [ ] Zitadel application created
- [ ] Auth.js configuration updated
- [ ] Environment variables updated (all environments)
- [ ] Custom domain configured
- [ ] User data migrated (if applicable)
- [ ] Development testing complete
- [ ] Production testing complete
- [ ] App registered in portal
- [ ] User permissions assigned
- [ ] Old provider removed
- [ ] Documentation updated

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check server logs
3. Review Zitadel audit logs
4. Contact the portal administrator
