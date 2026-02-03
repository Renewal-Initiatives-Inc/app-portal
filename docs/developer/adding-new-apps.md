# Adding New Apps to the Portal

This guide explains how to integrate a new application with the Renewal Initiatives authentication system and register it in the App Portal.

## Overview

Adding a new app involves three steps:
1. Configure the app in Zitadel (identity provider)
2. Add authentication to your app using Auth.js
3. Register the app in the portal

## Prerequisites

- Access to Zitadel Console (admin account)
- A Next.js application (or similar framework supporting Auth.js)
- The app deployed or ready to deploy

## Step 1: Configure Zitadel

### 1.1 Create Application in Zitadel

1. Log in to [Zitadel Console](https://console.zitadel.cloud)
2. Navigate to your project (Renewal Initiatives)
3. Click **Applications** in the sidebar
4. Click **New** to create an application
5. Select application type: **Web**
6. Select authentication method: **PKCE** (recommended for SPAs and server-rendered apps)
7. Name your application (e.g., "My New App")

### 1.2 Configure Redirect URIs

Add the following redirect URIs:

**Development:**
```
http://localhost:3000/api/auth/callback/zitadel
```

**Production:**
```
https://your-app.renewalinitiatives.org/api/auth/callback/zitadel
```

### 1.3 Note Your Credentials

After creating the application, note:
- **Client ID** - You'll need this for your app configuration
- **Issuer URL** - Usually `https://your-instance.zitadel.cloud`

## Step 2: Add Authentication to Your App

### 2.1 Install Dependencies

```bash
npm install next-auth
```

### 2.2 Create Auth Configuration

Create `src/lib/auth.ts`:

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

### 2.3 Create API Route

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

### 2.4 Add Environment Variables

Create `.env.local`:

```env
ZITADEL_CLIENT_ID=your-client-id-from-step-1
ZITADEL_ISSUER=https://your-instance.zitadel.cloud
AUTH_SECRET=generate-a-random-secret-here
```

Generate AUTH_SECRET with:
```bash
openssl rand -base64 32
```

### 2.5 Add Session Provider

Wrap your app with SessionProvider in `src/app/layout.tsx`:

```typescript
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

### 2.6 Protect Routes

**Option A: Middleware (recommended for most pages)**

Create `src/middleware.ts`:

```typescript
import { auth } from '@/lib/auth';

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== '/login') {
    const newUrl = new URL('/api/auth/signin', req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Option B: Page-level protection**

```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/signin');
  }

  return <div>Welcome, {session.user.name}!</div>;
}
```

### 2.7 Check App-Specific Permissions

To verify a user has access to your specific app:

```typescript
import { auth } from '@/lib/auth';

export default async function AppPage() {
  const session = await auth();
  const userRoles = session?.user.roles || [];

  // Check for app-specific role (admin always has access)
  const hasAccess = userRoles.includes('admin') || userRoles.includes('app:your-app-slug');

  if (!hasAccess) {
    redirect('/?error=access_denied');
  }

  return <div>App content here</div>;
}
```

## Step 3: Register in Portal

### 3.1 Log in as Admin

1. Go to [tools.renewalinitiatives.org](https://tools.renewalinitiatives.org)
2. Log in with your admin account

### 3.2 Add the App

1. Click **Admin** in the header (or go to `/admin`)
2. Navigate to **Apps** in the sidebar
3. Click **Add App**
4. Fill in the form:
   - **Name**: Display name for the app (e.g., "My New App")
   - **Slug**: URL-friendly identifier (e.g., `my-new-app`) - used for permissions
   - **Description**: Brief description of what the app does
   - **App URL**: Full URL to your app (e.g., `https://my-app.renewalinitiatives.org`)
   - **Icon**: Upload an icon (PNG, JPEG, WebP, or SVG, max 1MB)
5. Click **Create App**

### 3.3 Assign Permissions

1. Navigate to **Users** in the admin sidebar
2. Select a user
3. Check the box next to your new app
4. Click **Save Changes**

The user will now see the app in their portal.

## Testing

### Test the Integration

1. Log in to the portal
2. Click on your new app
3. Verify you're automatically authenticated (no second login)
4. If prompted to log in again, check:
   - Redirect URIs are correct in Zitadel
   - Environment variables are set correctly
   - Cookie domain settings (for cross-origin SSO)

### Test Permission Enforcement

1. As admin, remove your app access from a test user
2. Have the test user try to access the app directly
3. Verify they're denied access

## Troubleshooting

### "Invalid redirect_uri" Error

- Verify the redirect URI in Zitadel matches exactly
- Check for trailing slashes
- Ensure both development and production URIs are added

### "User has no access" Error

- Check the user has the correct role in Zitadel
- Verify the role name matches `app:{your-slug}`
- Ensure admin users have the `admin` role

### Session Not Persisting

- Check AUTH_SECRET is set and consistent
- Verify cookie settings in Auth.js config
- For cross-origin, ensure proper CORS configuration

## Naming Conventions

Follow these conventions for consistency:

| Item | Convention | Example |
|------|------------|---------|
| App Slug | lowercase, hyphens | `my-new-app` |
| Zitadel Role | `app:{slug}` | `app:my-new-app` |
| Environment Vars | SCREAMING_SNAKE_CASE | `ZITADEL_CLIENT_ID` |

## Next Steps

- [Retrofitting Existing Apps](./retrofitting-apps.md) - If migrating from another auth provider
- [Local Development Guide](./local-development.md) - Setting up the development environment
