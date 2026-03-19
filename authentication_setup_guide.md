# Authentication Setup Guide

> **Build new apps with Zitadel authentication from day one**

This guide walks you through building a new web application integrated with the Renewal Initiatives platform. Your app will have single sign-on (SSO) with the App Portal and all other platform apps from the start.

**Already have an existing app?** See [migration_template.md](migration_template.md) instead.

---

## What You'll Build

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
│   ┌────────┴────────┐                                          │
│   │   YOUR NEW APP  │ ◄── You are here                         │
│   │   yourapp.renewalinitiatives.org                           │
│   └─────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

After completing this guide, your app will:
- Use SSO with all platform apps — users log in once
- Appear in the portal dashboard for authorized users
- Support role-based access control via Zitadel

---

## Prerequisites

Before starting, ensure you have:

- [ ] **Subdomain chosen**: `{yourapp}.renewalinitiatives.org`
- [ ] **Framework decided**: Next.js, React SPA, or Express backend
- [ ] **Access to**:
  - Zitadel Console (ask Jeff or Heather for access)
  - Vercel Dashboard
  - DNS for `renewalinitiatives.org`
  - App Portal admin access

### Naming Rules

Your subdomain should be:
- Lowercase letters only
- Hyphens for multi-word names (e.g., `grant-tracker`)
- Short and descriptive

**Examples**: `timesheets`, `proposals`, `expense-reports`, `grant-tracker`

---

## Step 1: Zitadel Application Setup

This is the most important step. Getting this right from the start prevents common authentication errors.

### 1.1 Choose Your Application Type

| Your Framework | Zitadel Type | Why |
|----------------|--------------|-----|
| Next.js (App Router) | **Web** | Server-side token handling, supports secrets |
| React SPA (Vite/CRA) | **User Agent** | Client-side only, uses PKCE (no secrets) |
| Express/Node.js API only | **API** | Backend service, validates tokens from clients |

> **Building a React SPA with Express backend?** Register a **User Agent** application for the frontend. The backend validates tokens from that client — it doesn't need its own registration unless it serves other clients.

### 1.2 Create Your Application

1. Go to **Zitadel Console**: `https://renewal-initiatives-hgo6bh.us1.zitadel.cloud`
2. Log in with your admin credentials
3. Navigate to **Projects** → **Renewal Initiatives**
4. Click **+ New Application**
5. Enter:
   - **Name**: Your app's display name (e.g., "Grant Tracker")
   - **Type**: Select based on the table above
6. Click **Continue**

### 1.3 Configure Authentication Method

**For Web (Next.js)**:
- Select **Code** (Authorization Code Flow)
- Enable **PKCE** (recommended for security, even with server-side apps)

**For User Agent (SPA)**:
- PKCE is automatically enforced (no client secrets in browsers)

### 1.4 Configure Redirect URIs

**This is the #1 source of authentication errors.** URLs must match **exactly** — including protocol, port, and trailing slashes.

#### For Next.js (Web)

**Redirect URIs** (where Zitadel sends users after login):
```
https://{yourapp}.renewalinitiatives.org/api/auth/callback/zitadel
http://localhost:3000/api/auth/callback/zitadel
```

**Post-Logout Redirect URIs**:
```
https://{yourapp}.renewalinitiatives.org
http://localhost:3000
```

#### For React SPA (User Agent)

**Redirect URIs**:
```
https://{yourapp}.renewalinitiatives.org/callback
http://localhost:5173/callback
http://localhost:3000/callback
```

**Post-Logout Redirect URIs**:
```
https://{yourapp}.renewalinitiatives.org
http://localhost:5173
http://localhost:3000
```

> **Common mistakes**: Missing `http://` vs `https://`, wrong port numbers, trailing slashes where there shouldn't be any.

### 1.5 Save Your Credentials

After creating the application, note these values:

| Credential | Example | Used For |
|------------|---------|----------|
| **Client ID** | `358210924559048499` | `ZITADEL_CLIENT_ID` env var |
| **Issuer URL** | `https://renewal-initiatives-hgo6bh.us1.zitadel.cloud` | `ZITADEL_ISSUER` env var |
| **Project ID** | `358210659915177779` | Role scopes (Next.js) |

The Issuer URL and Project ID are the same for all apps — they're your Zitadel instance.

### 1.6 Create the App Role in Zitadel

Before users can access your app, the role must exist:

1. In Zitadel Console, go to **Projects** → **Renewal Initiatives** → **Roles**
2. Click **New Role**
3. Enter:
   - **Key**: `app:{your-slug}` (e.g., `app:grant-tracker`)
   - **Display Name**: Your app name (e.g., "Grant Tracker")
   - **Group**: `Applications`
4. Click **Save**

> **Important**: The role key must match the slug you'll use in the App Portal.

---

## Step 2: Domain Setup

### 2.1 Add Domain in Vercel

1. Create your Vercel project (or open existing)
2. Go to **Settings** → **Domains**
3. Add `{yourapp}.renewalinitiatives.org`

### 2.2 Configure DNS

Add a CNAME record:

| Type | Name | Value |
|------|------|-------|
| CNAME | `yourapp` | `cname.vercel-dns.com` |

### 2.3 Wait for SSL

Vercel automatically provisions SSL certificates. This takes 5-30 minutes.

**Verify**: `https://{yourapp}.renewalinitiatives.org` loads (auth errors are OK at this stage).

---

## Step 3: Framework Implementation

Choose your framework:

- [Path A: Next.js + Auth.js](#path-a-nextjs--authjs) (recommended for full-stack)
- [Path B: React SPA + OIDC Client](#path-b-react-spa--oidc-client)
- [Path C: Express + JWT Validation](#path-c-express--jwt-validation)

---

### Path A: Next.js + Auth.js

#### 3A.1 Create Your Project

```bash
npx create-next-app@latest my-app --typescript --tailwind --app --src-dir
cd my-app
```

#### 3A.2 Install Auth.js

```bash
npm install next-auth@beta
```

#### 3A.3 Create Auth Configuration

**File**: `src/lib/auth.ts`

```typescript
import NextAuth from 'next-auth';
import Zitadel from 'next-auth/providers/zitadel';

// Zitadel role claim - check both generic and project-specific formats
const ZITADEL_ROLES_CLAIM = 'urn:zitadel:iam:org:project:roles';
const ZITADEL_PROJECT_ID = process.env.ZITADEL_PROJECT_ID || '';

/**
 * Extract roles from Zitadel profile claims
 * Zitadel returns roles as: { "role_name": { "org_id": "org_name" } }
 */
function extractRoles(profile: Record<string, unknown>): string[] {
  // Try generic claim first, then project-specific
  let rolesClaim = profile[ZITADEL_ROLES_CLAIM];
  if (!rolesClaim) {
    rolesClaim = profile[`urn:zitadel:iam:org:project:${ZITADEL_PROJECT_ID}:roles`];
  }

  if (!rolesClaim || typeof rolesClaim !== 'object') {
    return [];
  }

  return Object.keys(rolesClaim as Record<string, unknown>);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID!,
      issuer: process.env.ZITADEL_ISSUER!,
      authorization: {
        params: {
          // Request roles scope - note: "projects" is plural in the request
          // The claim returned uses singular "project"
          scope: `openid profile email urn:zitadel:iam:org:projects:roles urn:zitadel:iam:org:project:id:${ZITADEL_PROJECT_ID}:aud`,
        },
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      // Define public routes that don't require auth
      const publicRoutes = ['/', '/login'];
      const { pathname } = request.nextUrl;

      if (publicRoutes.includes(pathname)) return true;
      return !!auth;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.userId = profile.sub;
        token.roles = extractRoles(profile as Record<string, unknown>);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
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
```

#### 3A.4 Add Type Declarations

**File**: `src/types/next-auth.d.ts`

```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    roles?: string[];
  }
}
```

#### 3A.5 Create API Route Handler

**File**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

#### 3A.6 Add Middleware

**File**: `src/middleware.ts`

```typescript
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    // Protect all routes except public ones
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### 3A.7 Create Login Page

**File**: `src/app/login/page.tsx`

```typescript
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Welcome</h1>
        <p className="text-gray-600">Sign in to continue</p>

        <form
          action={async () => {
            'use server';
            await signIn('zitadel', { redirectTo: '/dashboard' });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-[#2c5530] px-4 py-2 text-white hover:bg-[#234426]"
          >
            Sign in with Renewal Initiatives
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### 3A.8 Create Error Page

**File**: `src/app/auth/error/page.tsx`

```typescript
export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="mt-2 text-gray-600">
          {searchParams.error || 'An error occurred during sign in.'}
        </p>
        <a href="/login" className="mt-4 inline-block text-[#2c5530] underline">
          Try again
        </a>
      </div>
    </div>
  );
}
```

#### 3A.9 Use Auth in Components

**Server Component**:
```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const isAdmin = session.user.roles.includes('admin');

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      {isAdmin && <p>You have admin privileges</p>}
    </div>
  );
}
```

**Client Component** (for sign out):
```typescript
'use client';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out
    </button>
  );
}
```

---

### Path B: React SPA + OIDC Client

#### 3B.1 Create Your Project

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
```

#### 3B.2 Install Dependencies

```bash
npm install oidc-client-ts react-oidc-context react-router-dom
```

#### 3B.3 Create OIDC Configuration

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

#### 3B.4 Create Auth Hook

**File**: `src/auth/useAppAuth.ts`

```typescript
import { useAuth } from 'react-oidc-context';

const ROLES_CLAIM = 'urn:zitadel:iam:org:project:roles';

export function useAppAuth() {
  const oidc = useAuth();

  const rolesClaim = oidc.user?.profile?.[ROLES_CLAIM] as Record<string, unknown> | undefined;
  const roles = rolesClaim ? Object.keys(rolesClaim) : [];
  const isAdmin = roles.includes('admin');
  const hasAppAccess = (appSlug: string) => isAdmin || roles.includes(`app:${appSlug}`);

  return {
    ...oidc,
    roles,
    isAdmin,
    hasAppAccess,
  };
}
```

#### 3B.5 Update App Entry

**File**: `src/main.tsx`

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { BrowserRouter } from 'react-router-dom';
import { oidcConfig } from './auth/oidc-config';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
```

#### 3B.6 Create Callback Page

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
        const returnTo = sessionStorage.getItem('returnTo') || '/';
        sessionStorage.removeItem('returnTo');
        navigate(returnTo, { replace: true });
      } else if (auth.error) {
        console.error('Auth error:', auth.error);
        navigate('/login?error=auth_failed', { replace: true });
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Signing in...</p>
    </div>
  );
}
```

#### 3B.7 Create Login Page

**File**: `src/pages/Login.tsx`

```typescript
import { useAuth } from 'react-oidc-context';
import { Navigate, useSearchParams } from 'react-router-dom';

export function Login() {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = () => {
    sessionStorage.setItem('returnTo', '/');
    auth.signinRedirect();
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Welcome</h1>
        <p className="text-gray-600">Sign in to continue</p>

        {error && (
          <p className="text-red-600">Sign in failed. Please try again.</p>
        )}

        <button
          onClick={handleLogin}
          className="w-full rounded-md bg-[#2c5530] px-4 py-2 text-white hover:bg-[#234426]"
        >
          Sign in with Renewal Initiatives
        </button>
      </div>
    </div>
  );
}
```

#### 3B.8 Create Protected Route Component

**File**: `src/components/ProtectedRoute.tsx`

```typescript
import { useAuth } from 'react-oidc-context';
import { Navigate, useLocation } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    sessionStorage.setItem('returnTo', location.pathname);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

#### 3B.9 Set Up Routes

**File**: `src/App.tsx`

```typescript
import { Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { Callback } from './pages/Callback';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

---

### Path C: Express + JWT Validation

For API backends that validate tokens from frontend clients.

#### 3C.1 Install Dependencies

```bash
npm install jose express cors
npm install -D @types/express @types/cors typescript
```

#### 3C.2 Create Auth Middleware

**File**: `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER!;
const ROLES_CLAIM = 'urn:zitadel:iam:org:project:roles';

// Create JWKS client - cached automatically by jose
const JWKS = createRemoteJWKSet(
  new URL(`${ZITADEL_ISSUER}/oauth/v2/keys`)
);

interface ZitadelPayload extends JWTPayload {
  email?: string;
  name?: string;
  [ROLES_CLAIM]?: Record<string, unknown>;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email?: string;
        name?: string;
        roles: string[];
        isAdmin: boolean;
      };
    }
  }
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ZITADEL_ISSUER,
    });

    const zitadel = payload as ZitadelPayload;
    const rolesClaim = zitadel[ROLES_CLAIM] || {};
    const roles = Object.keys(rolesClaim);

    req.user = {
      sub: zitadel.sub!,
      email: zitadel.email,
      name: zitadel.name,
      roles,
      isAdmin: roles.includes('admin'),
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
```

#### 3C.3 Use in Routes

**File**: `src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import { requireAuth, requireAdmin } from './middleware/auth';

const app = express();

// CORS for your frontend
app.use(cors({
  origin: [
    'https://yourapp.renewalinitiatives.org',
    'http://localhost:5173',
  ],
  credentials: true,
}));

app.use(express.json());

// Public route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected route
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    id: req.user!.sub,
    email: req.user!.email,
    roles: req.user!.roles,
  });
});

// Admin-only route
app.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
  res.json({ message: 'Admin data here' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Step 4: Environment Variables

### Next.js (`.env.local`)

```env
# Zitadel OIDC
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_ISSUER=https://renewal-initiatives-hgo6bh.us1.zitadel.cloud
ZITADEL_PROJECT_ID=358210659915177779

# Auth.js - generate with: openssl rand -base64 32
AUTH_SECRET=your-generated-secret
AUTH_TRUST_HOST=true
```

### React SPA (`.env.local` for Vite)

```env
VITE_ZITADEL_ISSUER=https://renewal-initiatives-hgo6bh.us1.zitadel.cloud
VITE_ZITADEL_CLIENT_ID=your-client-id
```

### Express Backend (`.env`)

```env
ZITADEL_ISSUER=https://renewal-initiatives-hgo6bh.us1.zitadel.cloud
PORT=3001
```

### Vercel Deployment

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add all required variables for Production
3. **Redeploy** after adding variables

---

## Step 5: Register in App Portal

1. Log into `tools.renewalinitiatives.org` as an admin
2. Navigate to **Admin** → **Apps**
3. Click **Add New App**
4. Fill in:
   - **Name**: Your app's display name
   - **Slug**: Must match the role key (e.g., `grant-tracker` for role `app:grant-tracker`)
   - **Description**: Brief description for users
   - **URL**: `https://{yourapp}.renewalinitiatives.org`
   - **Icon**: Upload a 256x256 PNG (optional)
5. Click **Save**

### Grant User Access

1. In App Portal, go to **Admin** → **Users**
2. Click on a user to edit
3. Check the box for your app under permissions
4. Click **Save**

---

## Step 6: Testing Checklist

### Local Development

- [ ] App runs on localhost
- [ ] Login redirects to Zitadel
- [ ] Callback processes successfully (no redirect errors)
- [ ] Session persists on page refresh
- [ ] User info (name, email) displays correctly
- [ ] Roles are extracted and accessible
- [ ] Logout clears session

### Production Deployment

- [ ] Custom domain loads with SSL (`https://{yourapp}.renewalinitiatives.org`)
- [ ] Environment variables set in Vercel
- [ ] Login/logout flow works on production

### SSO Integration

- [ ] **Portal → App**: Log into portal, click your app card, no re-login needed
- [ ] **App → Portal**: Log into your app, visit portal, already logged in
- [ ] **Cross-app**: Log into App A, visit App B, already logged in
- [ ] **Logout cascade**: Log out anywhere, logged out everywhere

### Role-Based Access

- [ ] Admin user sees admin features
- [ ] Non-admin user cannot access admin routes
- [ ] User without `app:{slug}` role is denied (if your app checks this)

---

## Quick Reference

### Zitadel URLs

| Purpose | URL |
|---------|-----|
| Console | `https://renewal-initiatives-hgo6bh.us1.zitadel.cloud` |
| Issuer | `https://renewal-initiatives-hgo6bh.us1.zitadel.cloud` |
| JWKS | `https://renewal-initiatives-hgo6bh.us1.zitadel.cloud/oauth/v2/keys` |

### Required Scopes

```
openid profile email urn:zitadel:iam:org:project:roles
```

For Next.js with project-specific audience:
```
openid profile email urn:zitadel:iam:org:projects:roles urn:zitadel:iam:org:project:id:{PROJECT_ID}:aud
```

### Role Patterns

| Role | Access |
|------|--------|
| `admin` | All apps + admin features |
| `app:{slug}` | Specific app only (e.g., `app:timesheets`) |

### Callback URLs by Framework

| Framework | Callback Pattern |
|-----------|------------------|
| Next.js | `/api/auth/callback/zitadel` |
| React SPA | `/callback` |

### Role Checking Code

**Next.js**:
```typescript
const session = await auth();
const isAdmin = session?.user?.roles?.includes('admin');
```

**React SPA**:
```typescript
const { roles, isAdmin } = useAppAuth();
const hasAccess = roles.includes('app:myapp');
```

**Express**:
```typescript
const isAdmin = req.user?.isAdmin;
const hasRole = req.user?.roles.includes('app:myapp');
```

---

## Troubleshooting

### "Invalid redirect URI"

**Cause**: Callback URL doesn't match exactly what's registered in Zitadel.

**Fix**:
1. Check for trailing slashes (they matter!)
2. Verify protocol (`http` vs `https`)
3. Check port numbers for localhost
4. Ensure BOTH production AND development URLs are registered

### "Invalid issuer"

**Cause**: `ZITADEL_ISSUER` env var doesn't match token issuer.

**Fix**: Use exactly `https://renewal-initiatives-hgo6bh.us1.zitadel.cloud` (no trailing slash)

### Roles not appearing

**Cause**: Scope doesn't request roles, or user has no roles assigned.

**Fix**:
1. Ensure scope includes `urn:zitadel:iam:org:project:roles`
2. For Next.js, use `urn:zitadel:iam:org:projects:roles` (plural) in the request
3. Verify user has roles in Zitadel Console or App Portal

### SSO not working between apps

**Cause**: Apps not on same domain or cookies blocked.

**Fix**:
1. Ensure all apps use `*.renewalinitiatives.org`
2. Check browser isn't blocking third-party cookies
3. Verify same Zitadel issuer for all apps

### Auth.js "trustHost" error

**Cause**: Custom domain not trusted.

**Fix**: Add `trustHost: true` to NextAuth config and set `AUTH_TRUST_HOST=true` in env.

---

## Architecture Reference

### Why Zitadel?

- Free tier supports our ~8 user organization
- Built-in RBAC without custom code
- OIDC-compliant (standard libraries work)
- Cloud-hosted (no infrastructure to maintain)

### Why Auth.js for Next.js?

- First-class Zitadel provider
- Built-in session management
- Works with App Router and Server Components
- Consistent across all Next.js apps

### Why oidc-client-ts for SPAs?

- Well-maintained, TypeScript-native
- Standard OIDC/PKCE support
- `react-oidc-context` provides clean React integration

### Why jose for Express?

- Lightweight JWT verification
- No dependencies on full OIDC libraries
- Automatic JWKS caching

**For full rationale**: See [technology_decisions.md](technology_decisions.md)

---

## Getting Help

- **Documentation issues**: Open an issue in the `app-portal` repository
- **Auth.js questions**: [Auth.js Documentation](https://authjs.dev)
- **Zitadel questions**: [Zitadel Documentation](https://zitadel.com/docs)
- **General help**: Contact Jeff or Heather

---

*See [migration_template.md](migration_template.md) for migrating existing apps.*
