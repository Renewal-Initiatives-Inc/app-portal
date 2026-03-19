# Requirements: Internal App Registry & Auth

## Introduction

**Organization**: Renewal Initiatives (RI) — a small nonprofit currently operating with volunteers, aiming to convert its first 2-5 people to paid employees (W-2) and engage 1099 contractors in 2026. RI also works with external collaborators from partner organizations who need access to specific internal tools.

**Problem**: RI is building a growing portfolio of internal web apps (Timesheets, Proposal Rodeo, Financial System, and more planned). Each app originally had its own authentication, forcing users to manage multiple credentials. As the portfolio grows, this pain compounds. Additionally, as RI prepares to hire employees and engage contractors, it needs a centralized place to store employee master data (legal names, tax IDs, withholding elections) that downstream systems like the financial system can query — avoiding data duplication across apps.

**Solution**: A unified authentication and employee data system using Zitadel Cloud as the identity provider, with a custom App Portal at `tools.renewalinitiatives.org` that serves as the central hub. The portal handles three jobs:

1. **SSO & App Navigation** — Users log in once and see all apps they're authorized to access.
2. **User & Permission Management** — Admins manage users and app-level permissions.
3. **Employee Data Center** — Admins capture and maintain employee payroll information (legal name, tax IDs, withholdings, pay frequency) that the financial system queries via API.

**Key Decisions**:
- Zitadel Cloud for identity management (free tier, built-in RBAC, no infrastructure to maintain)
- Email/password authentication for all users (no Google OAuth)
- Standalone Next.js app for the portal
- Employee payroll data stored in local Vercel Postgres (not Zitadel metadata)
- No granular roles within apps — admin access grants full access to all portal functions including payroll
- Financial system will be built after this system; its API client will build-to-fit the payroll API defined here

## Glossary

| Term | Definition |
|------|------------|
| **App Portal** | The central hub at tools.renewalinitiatives.org where users see their authorized apps |
| **Zitadel** | The cloud identity provider handling authentication, user management, and RBAC |
| **RBAC** | Role-Based Access Control — granting permissions based on user roles at the app level via Zitadel |
| **Internal Employee** | Person at RI who will be paid through the financial system (currently 0; Jeff and Heather planned) |
| **External Collaborator** | Partner from another organization granted access to specific apps |
| **Admin** | User with privileges to invite users, manage app permissions, and manage employee data |
| **OIDC** | OpenID Connect — the authentication protocol used between apps and Zitadel |
| **W-2 Employee** | Staff member paid through payroll with standard tax withholdings (federal, state, FICA) |
| **1099 Contractor** | Independent contractor paid without standard employer-side withholdings |
| **Withholding Elections** | Tax and benefit deductions elected for an employee: federal/state income tax, Social Security, Medicare, 401(k), HSA, workers' comp |
| **Financial System** | Downstream RI application (pre-build) that will process payroll by querying employee data from this system via API |
| **Employee Data** | Payroll-relevant information (legal name, tax IDs, worker type, pay frequency, withholding elections) stored in the portal database |
| **Pay Frequency** | How often an employee is paid: weekly, biweekly, or monthly |

## Requirements

### R1: Single Sign-On

**Traces to**: A9 (pain of multiple logins), A11 (Zitadel + Auth.js integration)

**User Story**: As a user, I want to log in once and access all my authorized apps without re-authenticating, so that I don't have to manage multiple credentials.

**Acceptance Criteria**:
1. THE System SHALL authenticate users via Zitadel using OIDC.
2. THE System SHALL maintain a session that persists across app navigation.
3. THE System SHALL redirect unauthenticated users to Zitadel login.
4. THE System SHALL support email/password authentication for all users.

---

### R2: App Portal

**Traces to**: A8 (app launcher pattern)

**User Story**: As a user, I want a central portal showing all apps I can access, so that I can easily navigate to the tools I need.

**Acceptance Criteria**:
1. THE System SHALL display a portal at tools.renewalinitiatives.org.
2. THE System SHALL show each authorized app with its icon, name, and description.
3. THE System SHALL filter the app list to show only apps the current user has permission to access.
4. THE System SHALL provide a consistent view for all user types (internal and external).
5. THE System SHALL be mobile-friendly and responsive.
6. THE System SHALL follow the visual aesthetic of renewalinitiatives.org.

---

### R3: Role-Based Access Control

**Traces to**: A3 (RBAC via Zitadel), A4 (small user count)

**User Story**: As an admin, I want to control which users can access which apps, so that external collaborators only see tools relevant to their work.

**Acceptance Criteria**:
1. THE System SHALL use Zitadel's built-in RBAC to manage app-level permissions.
2. THE System SHALL allow admins to grant or revoke app access per user.
3. THE System SHALL enforce permissions such that users cannot access unauthorized apps.
4. THE System SHALL support multiple admins (initially 2).

---

### R4: User Management

**Traces to**: A7 (external collaborator onboarding)

**User Story**: As an admin, I want to invite new users and manage existing ones, so that I can onboard collaborators and maintain the user base.

**Acceptance Criteria**:
1. THE System SHALL allow admins to invite new users via email.
2. THE System SHALL allow admins to view all users in the system.
3. THE System SHALL allow admins to deactivate user accounts.
4. THE System SHALL allow admins to assign or remove admin privileges.
5. THE System SHALL display admin functions within the app portal (not requiring Zitadel console access).

---

### R5: App Registration

**Traces to**: A12 (existing app migration), A2 (no hardcoded URLs)

**User Story**: As an admin, I want to register new apps in the portal, so that users can discover and access them.

**Acceptance Criteria**:
1. THE System SHALL allow admins to add new apps with name, description, icon, and URL.
2. THE System SHALL allow admins to edit or remove registered apps.
3. THE System SHALL provide documentation for configuring new apps to authenticate against Zitadel.

---

### R6: Notification System

**Traces to**: A8 (app portal UX)

**User Story**: As an admin, I want to see notifications about user activity in the portal, so that I stay informed without relying on email.

**Acceptance Criteria**:
1. THE System SHALL display in-app notifications for admins.
2. THE System SHALL notify admins when a user accepts an invitation.
3. THE System SHALL notify admins when a user is granted access to a new app.
4. THE System SHALL NOT send email notifications.

---

### R7: Audit Log

**Traces to**: A9 (operational visibility)

**User Story**: As an admin, I want to see a log of who accessed which apps and when, so that I can troubleshoot issues if something goes wrong.

**Acceptance Criteria**:
1. THE System SHALL record app access events (user, app, timestamp).
2. THE System SHALL provide an admin-viewable log of access events.
3. THE System SHALL retain audit logs for a reasonable period (e.g., 90 days).

---

### R8: Existing App Migration

**Traces to**: A12 (existing app migration), A2 (no hardcoded URLs)

**User Story**: As a developer, I want to migrate existing apps (Timesheets, Proposal Rodeo) to the unified auth system, so that all apps use consistent authentication.

**Acceptance Criteria**:
1. THE System SHALL provide a migration path for existing Auth.js apps.
2. THE System SHALL require custom domains for migrated apps (move from Vercel preview URLs).
3. THE System SHALL preserve app functionality after migration.
4. THE System SHALL start with Timesheets as the proof-of-concept migration.

---

### R9: Developer Documentation

**Traces to**: A11 (integration), A12 (migration)

**User Story**: As a developer, I want clear documentation on integrating apps with the auth system, so that I can build new apps or retrofit existing ones.

**Acceptance Criteria**:
1. THE System documentation SHALL include steps to configure a new Next.js app with Zitadel auth.
2. THE System documentation SHALL include steps to retrofit an existing Auth.js app.
3. THE System documentation SHALL include steps to register a new app in the portal.

---

## Employee Payroll Data Requirements

The following requirements extend the auth system to serve as the employee data center. Employee payroll information is managed on user detail pages by admins, separately from user invitation. The financial system (pre-build) will query this data via API.

**Source**: employee-payroll-data-spec.md (directional; adapted per kickoff decisions below)

**Kickoff Decisions**:
- Employee data stored in local Vercel Postgres `employee_payroll` table, keyed by Zitadel user ID
- Both W-2 employees and 1099 contractors supported
- No granular in-app roles — portal admin = full payroll access
- Employee data managed on user detail page, separate from invite flow
- Financial system API uses simple shared API key
- P0 + P1 requirements in scope; P2 (multi-state, self-service, garnishments, CSV import) deferred

---

### R10: Employee Data Model

**Traces to**: Spec REQ-001, REQ-002

**User Story**: As an admin, I want to store employee payroll information in the auth system so that the financial system has a single source of truth for employee master data without maintaining a duplicate database.

**Acceptance Criteria**:
1. THE System SHALL store employee payroll data in an `employee_payroll` table in Vercel Postgres, keyed by Zitadel user ID.
2. THE System SHALL support the following fields: `legal_name` (string, 255 chars, required), `federal_tax_id` (string, encrypted, required), `state_tax_id` (string, encrypted, nullable), `pay_frequency` (enum: WEEKLY/BIWEEKLY/MONTHLY, required), `worker_type` (enum: W2_EMPLOYEE/CONTRACTOR_1099, required), `withholding_elections` (JSON, nullable), `payroll_enabled` (boolean, default false), `created_at` (timestamp), `updated_at` (timestamp).
3. THE System SHALL store `withholding_elections` as a JSON object with entries for: `federal_income_tax` (enabled, filing_status, allowances, additional_withholding), `state_income_tax` (enabled, state, allowances, additional_withholding), `social_security` (enabled), `medicare` (enabled), `retirement_401k` (enabled, type, value), `hsa` (enabled, type, value), `workers_comp` (enabled).
4. THE System SHALL validate the withholding_elections JSON schema on save, rejecting invalid structure, negative values, and percentages greater than 100%.
5. THE System SHALL enforce uniqueness of `federal_tax_id` across all employee records.
6. THE System SHALL support both W-2 employees and 1099 contractors via the `worker_type` field.

---

### R11: Employee Data Management

**Traces to**: Spec REQ-003, REQ-007, REQ-008, REQ-012

**User Story**: As an admin, I want to manage employee payroll data from a user's detail page so that I can set up and update employee information separately from the user invitation flow and on my own schedule.

**Acceptance Criteria**:
1. THE System SHALL display an "Employee Data" section on the user detail/edit page.
2. THE System SHALL provide a toggle to enable payroll tracking for a user.
3. THE System SHALL use progressive disclosure: enabling payroll reveals worker type selection, then legal name, tax ID, pay frequency, and withholding elections.
4. THE System SHALL pre-check federal income tax, state income tax (MA), Social Security, and Medicare when worker type is W-2 Employee.
5. THE System SHALL leave Social Security and Medicare unchecked when worker type is 1099 Contractor.
6. THE System SHALL update withholding defaults when the admin switches between W-2 and 1099 worker types.
7. THE System SHALL show 401(k) and HSA options with expandable percentage/flat-amount inputs when checked. 401(k) and HSA each support PERCENTAGE (e.g., 5% of gross) or FLAT_AMOUNT (e.g., $100/paycheck).
8. THE System SHALL display a "last updated" timestamp for existing employee records.
9. THE System SHALL require confirmation via modal before allowing changes to `federal_tax_id` on existing records.
10. THE System SHALL use the same form component for initial setup and subsequent edits.
11. THE System SHALL NOT display the employee data section as part of the user invitation flow.

---

### R12: Tax ID Validation and Masking

**Traces to**: Spec REQ-004

**User Story**: As an admin, I want the system to validate tax ID format and mask it after entry so that data entry errors are caught immediately and sensitive data is protected in the UI.

**Acceptance Criteria**:
1. THE System SHALL accept SSN format (XXX-XX-XXXX).
2. THE System SHALL accept EIN format (XX-XXXXXXX).
3. THE System SHALL reject formats without dashes, displaying: "Please use XXX-XX-XXXX for SSN or XX-XXXXXXX for EIN."
4. THE System SHALL reject non-numeric characters in tax ID fields.
5. THE System SHALL mask tax IDs in the admin UI after entry, showing only last 4 digits (e.g., XXX-XX-1234).
6. THE System SHALL display "This tax ID is already in use" if a duplicate is entered, without revealing which user holds the existing ID.

---

### R13: Payroll Data API

**Traces to**: Spec REQ-005, REQ-006

**User Story**: As the financial system, I want to query employee payroll data from the auth system via API so that I can process payroll without maintaining a duplicate employee database.

**Acceptance Criteria**:
1. THE System SHALL expose `GET /api/v1/users/{user_id}/payroll` returning full payroll data for a payroll-enabled user.
2. THE System SHALL expose `GET /api/v1/users/payroll` returning a list of all payroll-enabled users with: user_id, legal_name, pay_frequency, worker_type, payroll_enabled, and last_updated.
3. THE System SHALL return 404 for users who do not exist or do not have payroll enabled.
4. THE System SHALL authenticate API requests via a shared API key in the `X-API-Key` request header.
5. THE System SHALL return 401 for requests with missing or invalid API keys.
6. THE System SHALL return full (unmasked) `federal_tax_id` in individual user API responses to authenticated clients.
7. THE System SHALL NOT include `federal_tax_id` in the list endpoint response.
8. THE System SHALL support pagination on the list endpoint via `limit` and `offset` query parameters.
9. THE System SHALL include a `last_updated` timestamp in all payroll data responses.
10. THE System SHALL return 503 if the database is unavailable, with message "Service temporarily unavailable."

---

### R14: Tax ID Security

**Traces to**: Spec REQ-009

**User Story**: As an employee, I want my tax ID stored securely so that my sensitive financial information is protected from unauthorized access.

**Acceptance Criteria**:
1. THE System SHALL encrypt `federal_tax_id` and `state_tax_id` at rest using AES-256 application-level encryption before writing to the database.
2. THE System SHALL decrypt tax IDs only when needed: for API responses to authenticated clients, or for masked display (last 4 digits) in admin UI.
3. THE System SHALL serve all API endpoints over HTTPS only.
4. THE System SHALL log all API requests to payroll endpoints with timestamp and requesting client identifier.

---

### R15: Payroll Audit Log

**Traces to**: Spec REQ-011

**User Story**: As an admin, I want an audit trail of all changes to employee payroll data so that I can track who changed what and when for compliance and error resolution.

**Acceptance Criteria**:
1. THE System SHALL generate an immutable audit log entry for every create or update to payroll fields.
2. THE System SHALL record: user_id (whose data changed), field_name, old_value, new_value, changed_by (admin who made the change), changed_at (timestamp).
3. THE System SHALL mask tax ID values in audit log entries (store only last 4 digits for old/new values of tax ID fields).
4. THE System SHALL display the payroll audit log on the user detail page, filterable by date range.
5. THE System SHALL expose `GET /api/v1/users/{user_id}/payroll/audit` returning the audit trail for authenticated API clients.
6. THE System SHALL prevent deletion or modification of audit log entries.

---

### R16: Payroll Change Webhook

**Traces to**: Spec REQ-013

**User Story**: As the financial system, I want to be notified when employee payroll data changes so that I use the most current withholding elections and pay frequency for payroll processing.

**Acceptance Criteria**:
1. THE System SHALL send a POST request to a configurable webhook URL when any payroll field is created or updated.
2. THE System SHALL include in the webhook payload: event type (`payroll.employee.created` or `payroll.employee.updated`), user_id, list of changed field names, and timestamp.
3. THE System SHALL NOT include sensitive data (tax IDs, full withholding details) in webhook payloads.
4. THE System SHALL retry failed webhook deliveries up to 3 times with exponential backoff.
5. THE System SHALL log failed webhook deliveries for admin review.

---

### R17: Form Help Text

**Traces to**: Spec REQ-014

**User Story**: As an admin, I want inline help text and clear validation messages so that I can enter employee data correctly without needing external reference materials.

**Acceptance Criteria**:
1. THE System SHALL display help text below each payroll form field explaining expected input.
2. THE System SHALL display validation errors in red below the relevant field with specific corrective guidance (not generic "invalid" messages).
3. THE System SHALL ensure help text does not interfere with screen reader accessibility.

---

### R18: Payroll Access Control

**Traces to**: Spec REQ-010 (simplified per RI organizational decision)

**User Story**: As an admin, I want payroll data access to follow the same simple model as all other portal functions — if you're an admin, you have full access — so that there are no role-based display or access bugs to maintain.

**Acceptance Criteria**:
1. THE System SHALL grant full read/write access to all employee payroll data for portal admins.
2. THE System SHALL NOT implement payroll-specific roles, employee self-service views, or read-only payroll access levels.
3. THE System SHALL authenticate financial system API access via a single shared API key with full read access to all payroll data.
4. THE System SHALL hide the Employee Data section entirely from non-admin portal users.

---

## Out of Scope

### Original Portal (unchanged)
- Google OAuth or other social login providers
- Email notifications
- Self-service password reset UI in portal (handled by Zitadel)
- User profile management in portal (handled by Zitadel)

### Employee Payroll Data (P2 — deferred)
- Multi-state tax withholding (v1 supports MA only)
- Employee self-service portal for updating withholding elections
- Advanced withholding types (garnishments, child support, union dues, multiple retirement accounts)
- Bulk CSV import of employee payroll data
- Payroll processing logic (belongs in financial system, not here)

## Initial Users

| Name | Role | Current Status | Access |
|------|------|----------------|--------|
| Jeff | Admin | Volunteer (planned W-2 employee) | All apps |
| Heather | Admin | Volunteer (planned W-2 employee) | All apps |

Additional internal employees, 1099 contractors, and external collaborators will be added as the organization grows.
