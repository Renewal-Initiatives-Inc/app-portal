# Local Development Guide

This guide explains how to set up the App Portal for local development.

## Prerequisites

- Node.js 18+ (recommended: use nvm)
- npm or pnpm
- Git
- PostgreSQL (optional - can use Vercel Postgres for dev)
- Access to Zitadel Console (for auth testing)

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd app-portal

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## Environment Variables

Create `.env.local` with the following variables:

```env
# Auth.js
AUTH_SECRET=your-secret-here  # Generate with: openssl rand -base64 32

# Zitadel OIDC
ZITADEL_CLIENT_ID=your-dev-client-id
ZITADEL_ISSUER=https://your-instance.zitadel.cloud

# Zitadel Management API (for user management features)
ZITADEL_SERVICE_ACCOUNT_USER_ID=your-service-account-id
ZITADEL_SERVICE_ACCOUNT_KEY_ID=your-key-id
ZITADEL_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
ZITADEL_PROJECT_ID=your-project-id
ZITADEL_ORG_ID=your-org-id

# Database (Vercel Postgres)
POSTGRES_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=...

# Vercel Blob (for icon uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

### Getting Zitadel Credentials

1. **OIDC Credentials**: Create a development application in Zitadel Console
2. **Service Account**: Create a service account for management API access
3. Ask an admin if you need help with credentials

### Getting Database Credentials

Option 1: **Use Vercel Postgres (Recommended)**
- Get credentials from Vercel project settings
- Use the development branch database

Option 2: **Local PostgreSQL**
- Install PostgreSQL locally
- Create a database: `createdb app_portal_dev`
- Update `POSTGRES_URL` to point to local instance

## Database Setup

### Run Migrations

```bash
# Generate migration files (if schema changed)
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Seed Development Data

```bash
# Seed some test apps (optional)
npm run db:seed
```

### Database Studio

View and edit data directly:

```bash
npm run db:studio
```

Opens Drizzle Studio at http://localhost:4983

## Running the App

### Development Server

```bash
npm run dev
```

Opens at http://localhost:3000

### Build for Production (locally)

```bash
npm run build
npm run start
```

## Testing

### Unit Tests

```bash
# Watch mode (development)
npm test

# Single run
npm run test:run

# With coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:e2e

# With UI
npm run test:e2e:ui

# Specific test file
npm run test:e2e -- auth.spec.ts
```

### E2E Test Setup

For E2E tests, you need test user credentials:

```env
# .env.local (for E2E tests)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password
```

Create a test user in Zitadel with known credentials for automated testing.

## Project Structure

```
app-portal/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── api/             # API routes
│   │   ├── auth/            # Auth-related pages
│   │   ├── login/           # Login page
│   │   └── page.tsx         # Home (portal)
│   ├── components/          # React components
│   │   ├── admin/           # Admin-specific components
│   │   ├── ui/              # shadcn/ui components
│   │   └── ...
│   └── lib/                 # Utilities and libraries
│       ├── auth.ts          # Auth.js configuration
│       ├── db/              # Database access (Drizzle)
│       ├── permissions.ts   # Permission checking
│       └── zitadel.ts       # Zitadel API client
├── docs/                    # Documentation
├── e2e/                     # Playwright E2E tests
├── public/                  # Static assets
└── ...
```

## Common Tasks

### Add a New Page

1. Create file in `src/app/` following Next.js App Router conventions
2. Add route protection if needed (see `src/middleware.ts`)
3. Add navigation link if appropriate

### Add a New Component

1. For UI primitives: Use shadcn/ui CLI
   ```bash
   npx shadcn@latest add button
   ```

2. For custom components: Create in appropriate directory
   - `src/components/admin/` - Admin-specific
   - `src/components/` - Shared components

### Modify Database Schema

1. Edit `src/lib/db/schema.ts`
2. Generate migration:
   ```bash
   npm run db:generate
   ```
3. Apply migration:
   ```bash
   npm run db:migrate
   ```
4. Update TypeScript types if needed

### Add a New API Route

1. Create file in `src/app/api/`
2. Export HTTP method handlers (GET, POST, etc.)
3. Add authentication check if needed:
   ```typescript
   import { auth } from '@/lib/auth';

   export async function GET() {
     const session = await auth();
     if (!session) {
       return new Response('Unauthorized', { status: 401 });
     }
     // ...
   }
   ```

## Code Style

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

### Pre-commit Checks

The project uses lint-staged and husky for pre-commit checks. Commits will fail if:
- ESLint errors exist
- TypeScript errors exist
- Tests fail

## Debugging

### VS Code Launch Configuration

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Debug Logging

Enable debug logs for Auth.js:

```env
AUTH_DEBUG=true
```

### Database Queries

Enable Drizzle query logging:

```typescript
// In development
import { drizzle } from 'drizzle-orm/vercel-postgres';

const db = drizzle(sql, { logger: true });
```

## Troubleshooting

### "Module not found" Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Auth Redirect Loops

- Check redirect URIs in Zitadel match exactly
- Clear browser cookies
- Check AUTH_SECRET is set

### Database Connection Errors

- Verify POSTGRES_URL is correct
- Check VPN/firewall if using remote database
- Try POSTGRES_URL_NON_POOLING for migrations

### Tests Failing

```bash
# Reset test database
npm run test:reset

# Run tests with verbose output
npm run test:run -- --reporter=verbose
```

## Deployment

### Preview Deployments

Every PR gets a preview deployment on Vercel automatically.

### Production Deployment

Merging to `main` triggers production deployment.

### Environment Variables

Set environment variables in Vercel project settings for each environment.

## Getting Help

- Check existing documentation in `/docs`
- Review GitHub issues for known problems
- Contact the team via Slack
- For Zitadel issues, check [Zitadel Docs](https://zitadel.com/docs)
