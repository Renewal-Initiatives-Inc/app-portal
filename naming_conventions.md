# Naming Conventions

Claude: Read this before generating UI components, API routes, or tests.

---

## UI Foundations

| Setting | Value |
|---------|-------|
| Accessibility | WCAG 2.1 AA / Section 508 |
| Reference site | renewalinitiatives.org |
| Component library | shadcn/ui (Radix primitives) |
| Color scheme | Light mode |
| Primary color | #2c5530 (forest green) |

---

## REQUIRED: Test IDs

All interactive elements must have `data-testid` attributes for Playwright tests.

```tsx
// Pattern: {component}-{element}-{identifier?}

// Buttons
<Button data-testid="app-card-link-timesheets">Timesheets</Button>
<Button data-testid="user-invite-submit">Send Invite</Button>
<Button data-testid="modal-close">Close</Button>
<Button data-testid="app-delete-confirm">Delete</Button>

// Forms
<form data-testid="app-create-form">
<input data-testid="app-name-input" />
<input data-testid="user-email-input" />

// Lists and items
<div data-testid="app-list">
<div data-testid="app-item-timesheets">
<tr data-testid="user-row-jeff@example.com">

// Modals
<dialog data-testid="user-invite-modal">
<dialog data-testid="app-delete-modal">

// Navigation
<nav data-testid="admin-nav">
<a data-testid="nav-link-users">
```

**NOT**: `data-testid="button1"` or `data-testid="submitBtn"` or missing testids on interactive elements.

---

## REQUIRED: Modal Props

All modals must use consistent callback naming.

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;           // Called when modal should close (X, escape, backdrop)
  onSubmit?: (data: T) => void;  // Called when primary action succeeds
}

// Usage
<UserInviteModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={(user) => handleUserCreated(user)}
/>
```

**NOT**: `onCancel`, `handleClose`, `isOpen` (use `open`), `onSave` (use `onSubmit`).

---

## REQUIRED: Error State

```tsx
// Form-level error (single message)
const [error, setError] = useState<string | null>(null);

// Field-level errors (validation)
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

// Display patterns
{error && <Alert variant="destructive">{error}</Alert>}
{fieldErrors.email && <p className="text-destructive text-sm">{fieldErrors.email}</p>}
```

**NOT**: `errorMessage`, `errors` (ambiguous), `formError`, `validationErrors`.

---

## REQUIRED: Date/Timestamp Fields

```tsx
// Database columns (snake_case, use *_at for timestamps)
created_at: timestamp('created_at').defaultNow()
updated_at: timestamp('updated_at')
accessed_at: timestamp('accessed_at')

// TypeScript properties (camelCase, use *At for timestamps)
createdAt: Date
updatedAt: Date
accessedAt: Date

// Date-only fields (no time component) use *Date
birthDate: Date
startDate: Date
```

**NOT**: `createdOn`, `dateCreated`, `creation_date`, `timestamp`.

---

## Naming Patterns

| Context | Convention | Example |
|---------|------------|---------|
| React components | PascalCase | `AppCard`, `UserInviteModal` |
| React hooks | camelCase, `use` prefix | `useAuth`, `useApps` |
| TypeScript files | kebab-case | `app-card.tsx`, `use-auth.ts` |
| Database tables | snake_case, plural | `apps`, `audit_logs` |
| Database columns | snake_case | `icon_url`, `created_at` |
| API routes | kebab-case | `/api/apps`, `/api/audit-log` |
| Environment variables | SCREAMING_SNAKE_CASE | `ZITADEL_CLIENT_ID` |
| CSS classes | kebab-case (Tailwind) | `bg-primary`, `text-destructive` |
| Test files | `*.test.ts(x)` or `*.spec.ts` | `app-card.test.tsx` |
| E2E test files | `*.spec.ts` in `/e2e` | `e2e/auth.spec.ts` |

---

## Toolset-Enforced (No Action Needed)

These are automatically enforced by our tooling:

| Tool | Enforces |
|------|----------|
| Drizzle ORM | DB columns snake_case, TypeScript camelCase |
| TypeScript | Type safety, import paths |
| ESLint | Code style, unused imports |
| Prettier | Formatting consistency |
| Tailwind | Utility class ordering |

---

## Component File Structure

```
src/
  components/
    ui/                    # shadcn/ui components (Button, Card, etc.)
    app-card.tsx           # Custom components
    app-card.test.tsx      # Co-located unit tests
  app/
    (portal)/              # Route group for portal pages
    (admin)/               # Route group for admin pages
    api/                   # API routes
  lib/
    db/
      schema.ts            # Drizzle schema
      index.ts             # DB client
    auth.ts                # Auth.js config
    zitadel.ts             # Zitadel API client
  e2e/                     # Playwright E2E tests
```

---

## Import Ordering

```tsx
// 1. React/Next
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. External packages
import { eq } from 'drizzle-orm';

// 3. Internal absolute imports
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

// 4. Relative imports
import { AppCard } from './app-card';

// 5. Types (if separate)
import type { App } from '@/lib/db/schema';
```
