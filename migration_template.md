# App Migration Guide

> **How to bring your app into the Renewal Initiatives platform**

This guide walks you through migrating an existing web application to use the Renewal Initiatives unified authentication system powered by Zitadel. After migration, your app will:

- Use single sign-on (SSO) with the App Portal at `tools.renewalinitiatives.org`
- Appear in the portal dashboard for authorized users
- Share sessions across all platform apps — users log in once

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Renewal Initiatives Platform                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐     ┌─────────────────────────────────┐  │
│   │   Zitadel       │     │        App Portal               │  │
│   │   (Identity)    │◄───►│   tools.renewalinitiatives.org  │  │
│   └────────┬────────┘     └─────────────────────────────────┘  │
│            │                                                    │
│            │ OIDC                                               │
│            │                                                    │
│   ┌────────┴────────┐     ┌─────────────────┐                  │
│   │   Your App      │     │   Other Apps    │                  │
│   │   yourapp.      │     │   (Timesheets,  │                  │
│   │   renewalinitiatives  │   Proposals)    │                  │
│   │   .org          │     │                 │                  │
│   └─────────────────┘     └─────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before starting migration, ensure you have:

- [ ] Admin access to Zitadel Console
- [ ] Admin access to the App Portal
- [ ] Access to your app's codebase and deployment (Vercel)
- [ ] Ability to configure DNS for `renewalinitiatives.org` subdomains

---

## Step 1: Choose Your Subdomain

Your app will live at `{yourapp}.renewalinitiatives.org`.

**Naming conventions:**
- Use lowercase, single words when possible
- Use hyphens for multi-word names
- Keep it short and descriptive

**Examples:**
- `timesheets.renewalinitiatives.org`
- `proposals.renewalinitiatives.org`
- `grant-tracker.renewalinitiatives.org`

---

## Step 2: Register in Zitadel

### 2.1 Access Zitadel Console

1. Go to your Zitadel instance (e.g., `https://renewal.zitadel.cloud`)
2. Log in with admin credentials
3. Navigate to the **Renewal Initiatives** project

### 2.2 Add Your Application

1. Click **+ New Application**
2. Enter your app name (e.g., "Timesheets")
3. Select application type based on your architecture:

| Your App Type | Zitadel App Type | Auth Method |
|---------------|------------------|-------------|
| Next.js / Server-rendered | Web | Code (PKCE) |
| React SPA / Vue / Angular | User Agent | PKCE |
| API only (no UI) | API | JWT Bearer |

### 2.3 Configure Redirect URIs

**Redirect URIs** (where Zitadel sends users after login):
```
https://{yourapp}.renewalinitiatives.org/api/auth/callback/zitadel  # Next.js
https://{yourapp}.renewalinitiatives.org/callback                   # SPA
http://localhost:3000/api/auth/callback/zitadel                     # Dev (Next.js)
http://localhost:5173/callback                                       # Dev (Vite SPA)
```

**Post-logout Redirect URIs**:
```
https://{yourapp}.renewalinitiatives.org
http://localhost:3000
http://localhost:5173
```

### 2.4 Note Your Credentials

After creating the application, copy:
- **Client ID**: `xxxxxxxxxxxxxxxxxxxx`
- **Issuer URL**: `https://renewal.zitadel.cloud` (or your instance URL)

---

## Step 3: Configure Your Custom Domain

### 3.1 Add Domain in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Domains**
3. Add `{yourapp}.renewalinitiatives.org`

### 3.2 Configure DNS

Add a CNAME record in your DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | `yourapp` | `cname.vercel-dns.com` |

### 3.3 Verify

Wait for DNS propagation and SSL certificate (usually 5-30 minutes).

Verify: `https://{yourapp}.renewalinitiatives.org` loads (may show auth errors until code is updated).

---

## Step 4: Update Your App's Authentication

Choose the guide that matches your framework:

### Option A: Next.js with Auth.js (Recommended for Next.js apps)

If your app uses Next.js and Auth.js (next-auth), this is the simplest path.

#### 4A.1 Install/Update Dependencies

```bash
npm install next-auth@beta  # or your current version
```

#### 4A.2 Update Auth Configuration

**File**: `src/lib/auth.ts` (or `auth.ts`)

```typescript
import NextAuth from 'next-auth';
import Zitadel from 'next-auth/providers/zitadel';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID!,
      issuer: process.env.ZITADEL_ISSUER!,
      authorization: {
        params: {
          scope: 'openid profile email urn:zitadel:iam:org:project:roles',
        },
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      // Define your public routes
      const publicRoutes = ['/', '/login'];
      const { pathname } = request.nextUrl;

      if (publicRoutes.includes(pathname)) return true;
      return !!auth;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.id = profile.sub;
        // Extract roles if needed
        const rolesClaim = profile['urn:zitadel:iam:org:project:roles'];
        token.roles = rolesClaim ? Object.keys(rolesClaim) : [];
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      session.user.roles = (token.roles as string[]) || [];
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  trustHost: true,
});
```

#### 4A.3 Update Login Page

```typescript
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <form
      action={async () => {
        'use server';
        await signIn('zitadel', { redirectTo: '/dashboard' });
      }}
    >
      <button type="submit">
        Sign in with Renewal Initiatives
      </button>
    </form>
  );
}
```

#### 4A.4 Add Environment Variables

**`.env.local`**:
```
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_ISSUER=https://renewal.zitadel.cloud
AUTH_SECRET=generate-a-random-secret
```

---

### Option B: React SPA (Vite, Create React App, etc.)

For single-page applications without a server component.

#### 4B.1 Install Dependencies

```bash
npm install oidc-client-ts react-oidc-context
```

#### 4B.2 Create OIDC Configuration

**File**: `src/auth/oidc-config.ts`

```typescript
import { UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';

export const oidcConfig: UserManagerSettings = {
  authority: import.meta.env.VITE_ZITADEL_ISSUER,
  client_id: import.meta.env.VITE_ZITADEL_CLIENT_ID,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email urn:zitadel:iam:org:project:roles',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
};
```

#### 4B.3 Wrap App with Provider

**File**: `src/main.tsx`

```typescript
import { AuthProvider } from 'react-oidc-context';
import { oidcConfig } from './auth/oidc-config';

createRoot(document.getElementById('root')!).render(
  <AuthProvider {...oidcConfig}>
    <App />
  </AuthProvider>
);
```

#### 4B.4 Create Callback Page

**File**: `src/pages/Callback.tsx`

```typescript
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

export function Callback() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading) {
      if (auth.isAuthenticated) {
        navigate('/', { replace: true });
      }
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return <div>Signing in...</div>;
}
```

#### 4B.5 Use Auth in Components

```typescript
import { useAuth } from 'react-oidc-context';

function MyComponent() {
  const auth = useAuth();

  if (auth.isLoading) return <div>Loading...</div>;

  if (!auth.isAuthenticated) {
    return <button onClick={() => auth.signinRedirect()}>Sign in</button>;
  }

  return (
    <div>
      <p>Hello, {auth.user?.profile.name}</p>
      <button onClick={() => auth.signoutRedirect()}>Sign out</button>
    </div>
  );
}
```

#### 4B.6 Add Environment Variables

**`.env.local`** (Vite):
```
VITE_ZITADEL_ISSUER=https://renewal.zitadel.cloud
VITE_ZITADEL_CLIENT_ID=your-client-id
```

---

### Option C: Express/Node.js Backend

If your app has a separate backend that validates tokens.

#### 4C.1 Install Dependencies

```bash
npm install jose
```

#### 4C.2 Create Auth Middleware

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER!;
const JWKS = createRemoteJWKSet(
  new URL(`${ZITADEL_ISSUER}/.well-known/jwks.json`)
);

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ZITADEL_ISSUER,
    });

    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: Object.keys(payload['urn:zitadel:iam:org:project:roles'] || {}),
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Step 5: Remove Legacy Authentication

After verifying the new auth works:

1. **Remove password-related code**:
   - Password hashing utilities
   - Password reset flows
   - Registration endpoints (Zitadel handles this)

2. **Remove session management code**:
   - Custom session tables/stores
   - JWT signing utilities
   - Login/logout API endpoints

3. **Clean up environment variables**:
   - Remove old auth secrets
   - Remove OAuth provider credentials

---

## Step 6: Create Role in Zitadel

Before registering your app in the portal, you must create the corresponding role in Zitadel. The portal does **not** auto-create roles.

1. Log into [Zitadel Console](https://renewal-initiatives-hgo6bh.us1.zitadel.cloud/ui/console)
2. Navigate to **Projects** → Select the **Renewal Initiatives** project
3. Go to the **Roles** tab
4. Click **New Role**
5. Enter:
   - **Key**: `app:{your-app-slug}` (e.g., `app:expense-reports`)
   - **Display Name**: Your app name (e.g., "Expense Reports")
   - **Group**: `Applications` (optional, helps organize roles)
6. Click **Save**

> ⚠️ **Important**: The role key **must** match the slug you'll use when registering the app in the portal. If the role doesn't exist, admins won't be able to grant users access to the app.

---

## Step 7: Register in App Portal

1. Log into `tools.renewalinitiatives.org` as an admin
2. Navigate to **Admin → Apps**
3. Click **Add New App**
4. Fill in:
   - **Name**: Your app's display name
   - **Slug**: Must match the role key suffix (e.g., `expense-reports` for role `app:expense-reports`)
   - **Description**: Brief description for users
   - **URL**: `https://{yourapp}.renewalinitiatives.org`
   - **Icon**: Upload an icon (recommended: 256x256 PNG)

---

## Step 8: Configure User Access

1. In App Portal, go to **Admin → Users**
2. For each user who should access your app:
   - Open their user detail page
   - Check the box for your app under "App Permissions"
   - Save changes

> **Note**: If you see an error like "Cannot grant access: roles not found in Zitadel", go back to Step 6 and create the role in Zitadel Console.

---

## Step 9: Test SSO Flow

### Test 1: Portal → Your App

1. Clear all cookies
2. Go to `tools.renewalinitiatives.org`
3. Log in with Zitadel
4. Click your app's card
5. **Expected**: Lands on your app, already logged in (no second login)

### Test 2: Direct Access

1. Clear all cookies
2. Go directly to `{yourapp}.renewalinitiatives.org`
3. **Expected**: Redirected to Zitadel login, then back to app

### Test 3: Session Sharing

1. Log in via your app
2. Open `tools.renewalinitiatives.org` in a new tab
3. **Expected**: Already logged in to portal

### Test 4: Logout

1. Log out from your app
2. Go to portal
3. **Expected**: Also logged out (SSO logout)

---

## Role-Based Access Control

### Available Roles

| Role | Description |
|------|-------------|
| `admin` | Portal administrator with full access |
| `app:{slug}` | Access to a specific app |

### Checking Roles in Your App

**Next.js (Auth.js)**:
```typescript
const session = await auth();
const isAdmin = session?.user?.roles?.includes('admin');
```

**React SPA**:
```typescript
const auth = useAuth();
const roles = auth.user?.profile['urn:zitadel:iam:org:project:roles'] || {};
const isAdmin = 'admin' in roles;
```

**Express Backend**:
```typescript
const isAdmin = req.user.roles.includes('admin');
```

---

## Troubleshooting

### "Invalid redirect URI" error

- Check that all redirect URIs are registered in Zitadel
- Ensure URLs match exactly (including trailing slashes)
- Verify the protocol (http vs https)

### SSO not working between apps

- Ensure all apps use the same Zitadel instance
- Check that domains are all under `*.renewalinitiatives.org`
- Verify cookies aren't being blocked

### User can't access app after migration

- Check user has the `app:{slug}` role in portal
- Verify the user exists in Zitadel
- Check browser console for specific errors

### Token validation failing (backend)

- Verify `ZITADEL_ISSUER` is correct
- Check the token is being passed in `Authorization: Bearer {token}`
- Ensure JWKS endpoint is accessible from your backend

---

## Lessons Learned (from Proposal Rodeo Migration)

These insights come from our first app migration (Proposal Rodeo, a Next.js app). They may help you avoid common pitfalls.

### Configuration Gotchas

1. **Scope must include roles claim**

   When configuring Zitadel, include `urn:zitadel:iam:org:project:roles` in the scope to receive role information in the token:
   ```typescript
   scope: 'openid profile email urn:zitadel:iam:org:project:roles'
   ```
   Without this, the roles claim will be empty even if the user has roles assigned.

2. **JWT session strategy with DrizzleAdapter**

   When using Auth.js with DrizzleAdapter, explicitly set `session.strategy: 'jwt'`. The adapter defaults to database sessions, which conflicts with how roles are passed through the JWT callback.

3. **trustHost: true is essential**

   For Vercel deployments with custom domains, set `trustHost: true` in Auth.js config. Without this, redirect URLs may fail validation.

4. **Client-side vs Server-side signIn**

   Use `next-auth/react` for client components and the server-side `signIn` from your auth config for server actions. Mixing these up causes hydration errors.

### What Worked Well

1. **Start with one simple app** — Validating the entire Zitadel + SSO setup on Proposal Rodeo (which already used Auth.js) meant we could isolate auth issues from framework complexity.

2. **Test redirect URIs early** — Adding both production and localhost URIs upfront prevented "invalid redirect" errors during development.

3. **Keep the login page simple** — A single "Sign in with Renewal Initiatives" button is cleaner than showing provider options. Users don't need to choose.

4. **Role extraction in callbacks** — Handling role extraction in the `jwt` callback and passing to `session` callback provides consistent access to roles across the app.

### Verification Steps That Proved Most Valuable

1. **Zitadel Console → Test token** — Use Zitadel's built-in token viewer to verify claims are present before debugging app code.

2. **Browser DevTools → Application → Cookies** — Verify session cookies are being set correctly, especially for SSO across subdomains.

3. **Network tab → OIDC flow** — Watch the redirect sequence to identify where auth flow breaks.

---

## Migration Checklist

Use this checklist to track your migration progress:

- [ ] **Zitadel Setup**
  - [ ] Application registered in Zitadel Console
  - [ ] Redirect URIs configured
  - [ ] Client ID obtained

- [ ] **Custom Domain**
  - [ ] Domain added in Vercel
  - [ ] DNS CNAME record configured
  - [ ] SSL certificate active

- [ ] **Code Changes**
  - [ ] Auth library installed/configured
  - [ ] Login page updated
  - [ ] Environment variables set
  - [ ] Legacy auth code removed

- [ ] **Zitadel Role Setup**
  - [ ] Role `app:{slug}` created in Zitadel Console
  - [ ] Role key matches app slug exactly

- [ ] **Portal Integration**
  - [ ] App registered in portal (slug matches role key)
  - [ ] Users granted access

- [ ] **Testing**
  - [ ] Portal → App SSO works
  - [ ] Direct access works
  - [ ] Session sharing works
  - [ ] Logout works across apps
  - [ ] All app functionality works

---

## Getting Help

- **Documentation issues**: Open an issue in the `app-portal` repository
- **Auth.js questions**: [Auth.js Documentation](https://authjs.dev)
- **Zitadel questions**: [Zitadel Documentation](https://zitadel.com/docs)
- **General help**: Contact Jeff or Heather

---

## Architecture Decisions

### Why Zitadel?

- Free tier supports our user count
- Built-in RBAC without custom code
- OIDC-compliant (works with standard libraries)
- No infrastructure to maintain (cloud-hosted)

### Why Auth.js for Next.js apps?

- First-class Zitadel provider support
- Handles session management
- Works with App Router and Server Components
- Same library across all Next.js apps

### Why `oidc-client-ts` for SPAs?

- Well-maintained, TypeScript-native
- Standard OIDC/PKCE support
- `react-oidc-context` provides clean React integration

### Role Naming Conventions

- `admin` — Platform administrator
- `app:{slug}` — Access to a specific app (e.g., `app:timesheets`)

---

*Last updated: Phase 7B completion*
