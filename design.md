# Design: Internal App Registry & Auth

## Overview

**Problem**: Renewal Initiatives has a growing portfolio of internal web apps, each with separate authentication. Users juggle multiple credentials, and there's no centralized way to manage who can access what. Additionally, as RI prepares to hire its first employees and engage contractors, it needs a single source of truth for employee master data that downstream systems (financial system, timesheets) can rely on.

**Solution**: A unified authentication and employee data system with three components:

1. **Zitadel Cloud** — Identity provider handling authentication, user storage, and app-level RBAC
2. **App Portal** — Custom Next.js app at tools.renewalinitiatives.org serving as the central hub for app navigation, user management, and employee data management
3. **Integrated Apps** — Existing and new apps authenticating against Zitadel via OIDC; the financial system queries employee data via REST API

Users log in once via the portal, see their authorized apps, and navigate seamlessly. Admins manage users, permissions, and employee payroll data from within the portal. The financial system retrieves employee data via API without maintaining its own employee database.

## Key Design Principles

1. **Simplicity over features** — Build the minimum viable system. Avoid over-engineering for a small team.

2. **Delegate to Zitadel** — Use Zitadel's built-in capabilities (user management, RBAC, password reset) rather than building custom versions. Zitadel owns identity; the portal owns employee data.

3. **No in-app roles** — Access control lives at the app level in Zitadel. Within the portal, admin = full access to everything. No payroll-admin, no read-only views, no employee self-service. This eliminates an entire class of role-based display and access bugs.

4. **Consistent authentication** — All apps use the same OIDC flow. No special cases.

5. **Mobile-first** — The portal must work well on phones. Staff may check tools on the go.

6. **Stable over clever** — Prefer boring, well-documented patterns. This system should "just work" for years.

7. **Extensible data layer** — The portal's local database is expanding from app registry to employee data center. Design the data model cleanly so future HR functions can build on it without rearchitecting.

## Technology Approach

> **Status**: Technology decisions complete. See [technology_decisions.md](technology_decisions.md) for full rationale.

| Category | Decision |
|----------|----------|
| Identity | Zitadel Cloud (free tier) |
| Framework | Next.js 14+ (App Router) |
| Auth | Auth.js with Zitadel OIDC provider |
| Hosting | Vercel (Pro) |
| Database | Vercel Postgres (Neon) |
| ORM | Drizzle |
| File Storage | Vercel Blob (for app icons) |
| UI | shadcn/ui + Tailwind CSS |
| Testing | Vitest + Playwright |
| Encryption | Node.js crypto (AES-256-GCM) for tax ID fields |
| API Auth | Shared API key via `X-API-Key` header for system-to-system communication |

## Correctness Properties

These invariants must hold across all valid system states:

### CP1: Authorization Enforcement
**For any** app access attempt, **the system must** verify the user has explicit permission for that app before granting access.
*Validates*: R3 (RBAC)

### CP2: Session Consistency
**For any** authenticated session, **the system must** maintain the same user identity across all integrated apps without re-authentication.
*Validates*: R1 (SSO)

### CP3: Admin Privilege Boundaries
**For any** admin action (invite user, grant access, modify app, manage employee data), **the system must** verify the actor has admin privileges before executing.
*Validates*: R4 (User Management), R5 (App Registration), R18 (Payroll Access Control)

### CP4: Audit Completeness
**For any** successful app access, **the system must** record an audit event with user ID, app ID, and timestamp.
*Validates*: R7 (Audit Log)

### CP5: Portal-Permission Alignment
**For any** user viewing the portal, **the system must** display exactly the apps they have permission to access — no more, no less.
*Validates*: R2 (App Portal), R3 (RBAC)

### CP6: Tax ID Encryption
**For any** stored tax identifier (federal_tax_id, state_tax_id), **the system must** encrypt the value before writing to the database and decrypt only for authorized API responses or masked admin UI display.
*Validates*: R14 (Tax ID Security)

### CP7: Payroll Data Completeness
**For any** user with payroll_enabled=true, **the system must** ensure legal_name, federal_tax_id, pay_frequency, and worker_type are non-null.
*Validates*: R10 (Employee Data Model)

### CP8: Payroll Audit Immutability
**For any** create or update to employee payroll fields, **the system must** generate an immutable audit log entry recording what changed, by whom, and when.
*Validates*: R15 (Payroll Audit Log)

### CP9: Tax ID Uniqueness
**For any** federal_tax_id value, **the system must** ensure at most one employee record exists with that identifier.
*Validates*: R10 (Employee Data Model), R12 (Tax ID Validation)

## Business Logic Flows

### Flow 1: User Login

```
1. User navigates to tools.renewalinitiatives.org
2. Portal checks for valid session
3. If no session → redirect to Zitadel login
4. User enters email/password on Zitadel
5. Zitadel authenticates and redirects back with OIDC tokens
6. Portal creates session and displays authorized apps
```

### Flow 2: App Access

```
1. User clicks an app in the portal
2. User is redirected to app URL (e.g., timesheets.renewalinitiatives.org)
3. App checks for valid session
4. If no session → redirect to Zitadel (user already logged in, no prompt)
5. Zitadel returns tokens to app
6. App verifies user has permission for this app (via Zitadel roles/claims)
7. App grants access
```

### Flow 3: User Invitation

```
1. Admin opens user management in portal
2. Admin enters new user's email and selects app permissions
3. Portal calls Zitadel API to create user and send invite
4. New user receives email with activation link
5. User sets password via Zitadel
6. Notification appears in admin's portal dashboard
7. User can now log in and see assigned apps
```

### Flow 4: Grant App Access

```
1. Admin opens user management in portal
2. Admin selects existing user
3. Admin toggles app permissions
4. Portal calls Zitadel API to update user roles
5. Notification appears in admin dashboard
6. User sees new app on next portal visit
```

### Flow 5: Register New App

```
1. Admin opens app management in portal
2. Admin enters app name, description, icon URL, and app URL
3. Portal stores app in registry database
4. Admin configures new app to use Zitadel (see Developer Guide)
5. App appears in portal for users with permission
```

### Flow 6: Enable Employee Payroll Data

```
1. Admin navigates to user detail page in portal
2. Admin clicks "Enable Employee Data" toggle
3. Form expands: worker type selection (W-2 or 1099)
4. Admin selects worker type; withholding defaults populate accordingly
5. Form reveals: legal name, federal tax ID, pay frequency, withholding elections
6. Admin fills in required fields and adjusts withholdings as needed
7. Admin submits; portal validates input:
   - Tax ID format (SSN or EIN)
   - Tax ID uniqueness
   - Withholding election schema
   - Required fields present
8. Portal encrypts tax ID fields and saves to employee_payroll table
9. Audit log entry created (all fields recorded as "created")
10. Webhook fires to financial system (if configured)
```

### Flow 7: Update Employee Payroll Data

```
1. Admin navigates to user detail page for a payroll-enabled user
2. Employee Data section shows current data with masked tax ID and "last updated" timestamp
3. Admin modifies fields (e.g., updates 401(k) percentage, changes pay frequency)
4. If changing federal_tax_id → confirmation modal: "Are you sure? Current ID ends in XXXX."
5. Admin submits; portal validates and saves changes
6. Audit log entry created with old and new values (tax IDs masked in log)
7. Webhook fires with list of changed field names
```

### Flow 8: Financial System Queries Payroll Data

```
1. Financial system sends GET /api/v1/users/payroll with X-API-Key header
2. Portal validates API key against stored secret
3. If invalid → return 401
4. Portal queries employee_payroll table for payroll_enabled users
5. Portal returns JSON list (no tax IDs in list endpoint)
6. Financial system sends GET /api/v1/users/{id}/payroll for individual detail
7. Portal decrypts tax IDs and returns full payroll data
8. Access logged with timestamp and client identifier
```

## API Design

### Authentication

All payroll API endpoints require the `X-API-Key` header with a shared secret stored in environment variables on both the portal and the financial system. No scoped permissions — valid key = full read access.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users/payroll` | List all payroll-enabled employees (no tax IDs) |
| GET | `/api/v1/users/{user_id}/payroll` | Get individual employee payroll data (includes tax IDs) |
| GET | `/api/v1/users/{user_id}/payroll/audit` | Get payroll change audit trail |

The API is **read-only**. Payroll data is created and updated through the portal admin UI only. This keeps the write path simple (one entry point, consistent validation, guaranteed audit logging).

### Response Shapes

**List Endpoint** — `GET /api/v1/users/payroll?limit=50&offset=0`
```json
{
  "users": [
    {
      "user_id": "zitadel-user-uuid",
      "legal_name": "Jane Doe",
      "worker_type": "W2_EMPLOYEE",
      "pay_frequency": "BIWEEKLY",
      "payroll_enabled": true,
      "last_updated": "2026-02-10T15:30:00Z"
    }
  ],
  "count": 1,
  "limit": 50,
  "offset": 0
}
```

**Detail Endpoint** — `GET /api/v1/users/{user_id}/payroll`
```json
{
  "user_id": "zitadel-user-uuid",
  "legal_name": "Jane Doe",
  "worker_type": "W2_EMPLOYEE",
  "federal_tax_id": "123-45-6789",
  "state_tax_id": null,
  "pay_frequency": "BIWEEKLY",
  "withholding_elections": {
    "federal_income_tax": {
      "enabled": true,
      "filing_status": "SINGLE",
      "allowances": 1,
      "additional_withholding": 0.00
    },
    "state_income_tax": {
      "enabled": true,
      "state": "MA",
      "allowances": 1,
      "additional_withholding": 0.00
    },
    "social_security": { "enabled": true },
    "medicare": { "enabled": true },
    "retirement_401k": {
      "enabled": true,
      "type": "PERCENTAGE",
      "value": 5.00
    },
    "hsa": { "enabled": false },
    "workers_comp": { "enabled": false }
  },
  "payroll_enabled": true,
  "last_updated": "2026-02-10T15:30:00Z"
}
```

**Audit Endpoint** — `GET /api/v1/users/{user_id}/payroll/audit`
```json
{
  "entries": [
    {
      "field_name": "retirement_401k.value",
      "old_value": "3.00",
      "new_value": "5.00",
      "changed_by": "admin-zitadel-uuid",
      "changed_at": "2026-02-10T15:30:00Z"
    }
  ],
  "count": 1
}
```

**Webhook Payload** — `POST {configured_webhook_url}`
```json
{
  "event": "payroll.employee.updated",
  "user_id": "zitadel-user-uuid",
  "changed_fields": ["retirement_401k.value", "pay_frequency"],
  "timestamp": "2026-02-10T15:30:00Z"
}
```

### Error Responses

| Status | When | Body |
|--------|------|------|
| 401 | Missing or invalid API key | `{"error": "Invalid API key"}` |
| 404 | User not found or payroll not enabled | `{"error": "User not found or payroll not enabled"}` |
| 503 | Database unavailable | `{"error": "Service temporarily unavailable"}` |

## Data Model

### Stored in Zitadel
- Users (email, password hash, profile)
- Roles/permissions (user-to-app mappings)
- Sessions

### Stored in Portal Database

**Apps**: id, name, description, icon_url, app_url, created_at

**AuditLog**: id, user_id, app_id, action, timestamp

**Notifications**: id, admin_id, message, read, created_at

**EmployeePayroll** (new):
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto-generated |
| zitadel_user_id | string | FK to Zitadel user, unique |
| legal_name | varchar(255) | required |
| federal_tax_id | text | encrypted, required, unique |
| state_tax_id | text | encrypted, nullable |
| worker_type | enum | W2_EMPLOYEE, CONTRACTOR_1099, required |
| pay_frequency | enum | WEEKLY, BIWEEKLY, MONTHLY, required |
| payroll_enabled | boolean | default false |
| withholding_elections | jsonb | nullable, schema-validated |
| created_at | timestamp | auto |
| updated_at | timestamp | auto on update |

**Indexes**: `payroll_enabled` (for fast list queries), `zitadel_user_id` (unique, for lookups), `federal_tax_id` (unique, for duplicate detection — note: index on encrypted value, uniqueness checked at application level before encryption)

**PayrollAuditLog** (new):
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto-generated |
| employee_zitadel_user_id | string | FK to EmployeePayroll |
| field_name | varchar(100) | required |
| old_value | text | nullable (null on create), tax IDs masked |
| new_value | text | required, tax IDs masked |
| changed_by | string | Zitadel user ID of admin |
| changed_at | timestamp | auto |

**PayrollAuditLog is append-only.** No UPDATE or DELETE operations permitted.

### Encryption Approach

Tax ID fields (federal_tax_id, state_tax_id) use **application-level encryption**:

1. **Algorithm**: AES-256-GCM via Node.js `crypto` module
2. **Key**: `PAYROLL_ENCRYPTION_KEY` environment variable (32-byte key, generated via `crypto.randomBytes(32)`)
3. **Storage format**: `{iv}:{authTag}:{ciphertext}` — IV and auth tag stored alongside ciphertext
4. **Encrypt on write**: Before any INSERT or UPDATE to tax ID columns
5. **Decrypt on read**: Only for API responses (full value) or admin UI (last 4 digits)
6. **Uniqueness check**: Compare plaintext values before encryption; the encrypted column cannot be used for database-level uniqueness enforcement, so uniqueness is enforced at the application layer

## Error Handling Strategy

### User Errors

| Error | Handling |
|-------|----------|
| Invalid credentials | Zitadel displays error on login page with retry option |
| Unauthorized app access | Redirect to portal with message "You don't have access to this app" |
| Expired session | Redirect to Zitadel login, then back to original destination |
| Invalid invitation link | Display error page with contact admin instructions |
| Payroll validation fails | Show inline errors per field, preserve entered data, highlight invalid fields |
| Duplicate tax ID | Show "This tax ID is already in use" without revealing whose |
| Missing required payroll fields | Prevent submission, highlight required fields |
| Invalid tax ID format | Show format guidance: "Please use XXX-XX-XXXX for SSN or XX-XXXXXXX for EIN" |

### System Errors

| Error | Handling |
|-------|----------|
| Zitadel unavailable | Display maintenance page, suggest retry later |
| Database unavailable | Graceful degradation: show apps from cache if possible, disable admin functions |
| App registration fails | Display error to admin with specific reason, allow retry |
| Encryption/decryption failure | Log error with context, show "Unable to save employee data, please try again" |
| Webhook delivery fails | Log failure, retry with exponential backoff (3 attempts), surface in admin notifications after final failure |
| API key invalid | Return 401 with "Invalid API key" |

### Principle

- Never expose technical details to users
- Log all errors with context for debugging
- Provide clear next steps (retry, contact admin, etc.)
- Tax IDs never appear in logs, error messages, or stack traces

## Testing Strategy

### Unit Tests

- **Portal API routes**: Test each endpoint with mocked Zitadel responses
- **Permission logic**: Test app filtering based on various role configurations
- **Audit logging**: Test that events are recorded correctly
- **Tax ID validation**: SSN format, EIN format, invalid formats, edge cases (dashes, letters, too short/long)
- **Withholding election validation**: Valid schemas, invalid values (negative, >100%), missing required fields
- **Encryption round-trip**: Verify encrypt → store → decrypt recovers original value
- **API key authentication**: Valid key, missing key, invalid key
- **Payroll CRUD**: Create, read, update employee payroll records
- **Audit log generation**: Verify entries created on every change with correct old/new values
- **Webhook payload generation**: Verify correct event type, changed fields, no sensitive data

### Integration Tests

- **Auth flow**: End-to-end login via Zitadel (using test accounts)
- **Cross-app session**: Verify session persists when navigating between portal and app
- **Admin operations**: Test invite, permission grant, app registration via UI
- **Employee data lifecycle**: Enable payroll → fill form → save → view masked → edit → verify audit log
- **API endpoints**: Query list, query individual, verify response shapes and auth
- **Webhook delivery**: Mock webhook receiver, verify payload on payroll data change

### Property-Based Tests

For each Correctness Property, create tests that verify the invariant holds across randomized inputs:

- **CP1**: Generate random user/app combinations, verify access denied without explicit permission
- **CP5**: For random permission sets, verify portal displays exactly matching apps
- **CP6**: For random tax ID strings, verify encrypted value differs from plaintext and decryption recovers original
- **CP7**: Attempt to set payroll_enabled=true with missing required fields; verify rejection
- **CP9**: Attempt to create two employees with same tax ID; verify rejection

### Manual Testing

- Mobile responsiveness on real devices
- Visual alignment with renewalinitiatives.org aesthetic
- External collaborator onboarding flow (invite through first login)
- Employee data form: progressive disclosure, W-2/1099 toggle behavior, withholding defaults
- Tax ID masking: verify full SSN never visible after initial entry

## Developer Guide

### Configuring a New App for Zitadel Auth

1. **Create application in Zitadel Console**
   - Navigate to your Zitadel project
   - Add new application (type: Web, auth method: PKCE)
   - Set redirect URI: `https://your-app.renewalinitiatives.org/api/auth/callback/zitadel`
   - Note the Client ID

2. **Install Auth.js with Zitadel provider**
   ```bash
   npm install next-auth
   ```

3. **Configure Auth.js**
   ```typescript
   // auth.ts
   import NextAuth from "next-auth"
   import Zitadel from "next-auth/providers/zitadel"

   export const { handlers, auth, signIn, signOut } = NextAuth({
     providers: [
       Zitadel({
         clientId: process.env.ZITADEL_CLIENT_ID,
         issuer: process.env.ZITADEL_ISSUER,
       }),
     ],
   })
   ```

4. **Add environment variables**
   ```
   ZITADEL_CLIENT_ID=your-client-id
   ZITADEL_ISSUER=https://your-instance.zitadel.cloud
   AUTH_SECRET=generate-a-secret
   ```

5. **Protect routes**
   ```typescript
   import { auth } from "@/auth"

   export default async function ProtectedPage() {
     const session = await auth()
     if (!session) redirect("/api/auth/signin")
     return <div>Welcome {session.user.name}</div>
   }
   ```

6. **Register app in portal**
   - Log in as admin at tools.renewalinitiatives.org
   - Add app with name, description, icon, and URL

### Retrofitting an Existing Auth.js App

1. **Replace existing provider with Zitadel**
   - Remove current provider configuration
   - Add Zitadel provider as shown above

2. **Update callback URLs**
   - In Zitadel Console, add your app's callback URL
   - Remove old provider's OAuth app if applicable

3. **Set up custom domain**
   - In Vercel, add custom domain (e.g., timesheets.renewalinitiatives.org)
   - Update DNS records

4. **Test authentication flow**
   - Verify login works via Zitadel
   - Verify session is recognized when coming from portal

5. **Register in portal**
   - Add app to portal registry
   - Assign permissions to users

### Integrating the Payroll API (for financial-system)

1. **Obtain API key**
   - Admin generates API key in portal settings (or configures via environment variable)
   - Store as `AUTH_SYSTEM_API_KEY` in financial-system environment

2. **Query employee list**
   ```bash
   GET https://tools.renewalinitiatives.org/api/v1/users/payroll
   X-API-Key: {your-api-key}
   ```

3. **Query individual employee**
   ```bash
   GET https://tools.renewalinitiatives.org/api/v1/users/{user_id}/payroll
   X-API-Key: {your-api-key}
   ```

4. **Configure webhook receiver** (optional)
   - Implement POST endpoint in financial-system to receive payroll change notifications
   - Set webhook URL in portal configuration
   - Webhook delivers changed field names only — query the detail endpoint for updated values

## Rollout Plan

### Phase 1: Proof of Concept (complete)
1. Set up Zitadel Cloud instance
2. Build minimal App Portal (login, app list)
3. Migrate Timesheets to Zitadel auth
4. Test with Jeff and Heather only

### Phase 2: Core Features (complete)
1. Add admin UI (user management, app registration)
2. Add notification system
3. Add audit logging
4. Migrate Proposal Rodeo

### Phase 3: Polish & Expand (complete)
1. Refine mobile experience
2. Add remaining internal employees
3. Invite external collaborators
4. Document and handoff

### Phase 4: Employee Payroll Data (upcoming)
1. Database schema: employee_payroll and payroll_audit_log tables
2. Employee data UI on user detail page (form, validation, progressive disclosure)
3. Tax ID encryption module
4. Payroll REST API endpoints
5. Payroll audit log
6. Webhook notifications
7. Integration testing with financial system API contract
