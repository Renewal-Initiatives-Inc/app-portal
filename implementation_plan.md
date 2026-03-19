# Implementation Plan: Internal App Registry & Auth

## Overview

Build a unified authentication portal at tools.renewalinitiatives.org for Renewal Initiatives. Users log in once via Zitadel and see all apps they're authorized to access. Admins manage users, permissions, and app registration from within the portal.

**Approach**: Incremental delivery. Each phase produces something testable. Start with authentication working, then add admin features, then polish.

---

## Phase 0: Technology Stack Decisions

**Status**: Complete

See [technology_decisions.md](technology_decisions.md) for full details.

| Category | Decision |
|----------|----------|
| Database | Vercel Postgres (Neon) |
| ORM | Drizzle |
| File Storage | Vercel Blob |
| Environments | Dev + Prod (preview deployments) |
| Testing | Vitest + Playwright |
| UI | shadcn/ui + Tailwind CSS |
| Auth | Zitadel Cloud + Auth.js |
| Hosting | Vercel (Pro) |

---

## Phase 1: Project Scaffolding

**Goal**: Set up the Next.js project with all tooling configured.

**Tasks**:
1. Initialize Next.js 14+ with App Router and TypeScript
2. Configure Tailwind CSS with custom color palette from renewalinitiatives.org
3. Initialize shadcn/ui and add base components (Button, Card)
4. Set up Drizzle ORM with Vercel Postgres connection
5. Create initial database schema (apps, audit_log, notifications tables)
6. Configure Vitest for unit tests
7. Configure Playwright for E2E tests
8. Set up ESLint and Prettier
9. Create GitHub repository and connect to Vercel

**Deliverable**: Empty Next.js app deployed to Vercel with all tooling working. Database tables created. Test commands run successfully.

---

## Phase 2: Authentication Integration

**Goal**: Users can log in via Zitadel and see a basic authenticated page.

**Tasks**:
1. Create Zitadel Cloud instance and configure project
2. Register App Portal as OIDC application in Zitadel
3. Install and configure Auth.js with Zitadel provider
4. Create login/logout flows
5. Protect routes with authentication middleware
6. Display current user info on authenticated pages
7. Write E2E test for login flow

**Deliverable**: Users can log in at tools.renewalinitiatives.org via Zitadel and see their name. Unauthenticated users are redirected to login.

---

## Phase 3: App Portal UI

**Goal**: Authenticated users see a grid of apps they can access.

**Tasks**:
1. Create portal dashboard layout (header, main content area)
2. Build app card component (icon, name, description, link)
3. Fetch apps from database and filter by user permissions
4. Create responsive grid layout for app cards
5. Add empty state for users with no apps
6. Style to match renewalinitiatives.org aesthetic
7. Write unit tests for permission filtering logic

**Deliverable**: Users see their authorized apps displayed as cards. Clicking a card navigates to the app URL.

---

## Phase 4: Admin - App Registration

**Goal**: Admins can add, edit, and remove apps from the registry.

**Tasks**:
1. Create admin layout with navigation
2. Build app list view (table with edit/delete actions)
3. Build app creation form (name, description, URL, icon upload)
4. Implement Vercel Blob upload for app icons
5. Build app edit form
6. Add delete confirmation modal
7. Restrict admin routes to users with admin role
8. Write E2E tests for app CRUD operations

**Deliverable**: Admins can manage the app registry. Apps appear in portal for authorized users.

---

## Phase 5: Admin - User Management

**Goal**: Admins can invite users and manage their app permissions.

**Tasks**:
1. Build user list view (table showing all users from Zitadel)
2. Implement Zitadel Management API integration
3. Build user invite form (email, initial app permissions)
4. Build user detail view (current permissions, toggle access per app)
5. Implement user deactivation
6. Implement admin role assignment
7. Write E2E tests for user management flows

**Deliverable**: Admins can invite users, grant/revoke app access, and manage admin privileges.

---

## Phase 6: Notifications & Audit Log

**Goal**: Admins see activity notifications and can review access history.

**Tasks**:
1. Create notification data model and API
2. Build notification dropdown in admin header
3. Generate notifications for: user accepted invite, user granted app access
4. Mark notifications as read
5. Create audit log recording (user, app, timestamp on access)
6. Build audit log viewer with filtering
7. Implement 90-day retention cleanup (cron or Vercel scheduled function)
8. Write tests for notification and audit logic

**Deliverable**: Admins see a notification badge with recent activity. Audit log shows who accessed what and when.

---

## Phase 7: Timesheets Migration

**Goal**: Migrate existing Timesheets app to use Zitadel authentication.

**Tasks**:
1. Register Timesheets as OIDC application in Zitadel
2. Set up custom domain (timesheets.renewalinitiatives.org)
3. Replace existing Auth.js provider with Zitadel
4. Verify session sharing between portal and Timesheets
5. Register Timesheets in portal app registry
6. Assign permissions to Jeff and Heather
7. Test complete flow: portal login → click Timesheets → no re-auth
8. Write E2E test for cross-app SSO

**Deliverable**: Timesheets uses Zitadel auth. Users can access it from the portal without re-authenticating.

---

## Phase 8: Polish & Documentation

**Goal**: Refine the experience and document for future maintenance.

**Tasks**:
1. Mobile responsiveness audit and fixes
2. Error handling review (user-friendly messages)
3. Loading states for all async operations
4. Accessibility audit (keyboard navigation, screen reader testing)
5. Write developer documentation (how to add new apps)
6. Write admin documentation (how to manage users)
7. Performance review (Lighthouse audit)

**Deliverable**: Production-ready portal with documentation. Ready for additional users.

---

## Phase Dependencies

```
Phase 1 (Scaffolding)
    ↓
Phase 2 (Auth)
    ↓
Phase 3 (Portal UI)
    ↓
    ├── Phase 4 (App Registration)
    │       ↓
    └── Phase 5 (User Management)
            ↓
        Phase 6 (Notifications & Audit)
            ↓
        Phase 7 (Timesheets Migration)
            ↓
        Phase 8 (Polish & Docs)
```

Phases 4 and 5 can be worked in parallel after Phase 3.

---

## Risk Areas & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Zitadel API complexity | Could slow user management features | Start with Zitadel console for MVP, add API integration incrementally |
| Cross-origin session sharing | SSO might not "just work" | Test early in Phase 2 with a simple second app |
| Icon upload edge cases | Large files, wrong formats | Validate on client, enforce size limits, show clear errors |
| Audit log growth | Could hit DB limits over years | 90-day retention, monitor usage, upgrade tier if needed |

---

## Success Criteria

- [ ] Users log in once and access all authorized apps without re-authentication
- [ ] Admins can invite users and manage permissions without touching Zitadel console
- [ ] Admins can register new apps with icons
- [ ] Portal displays only apps the user has permission to access
- [ ] Audit log records app access events
- [ ] Timesheets app successfully migrated to Zitadel auth
- [ ] Portal is responsive on mobile devices
- [ ] All E2E tests pass
- [ ] Documentation exists for adding new apps
