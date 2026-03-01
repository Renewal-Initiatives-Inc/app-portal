# Security Policy Alignment — Plan

**Status:** Discovery Complete → Ready for Implementation
**Last Updated:** 2026-03-01
**Author:** Jeff Takle + Claude
**Traces to:** Information Security Policy (Feb 17, 2026), 201 CMR 17.00

> **Protocol**: This section is auto-updated before session end. Start new sessions with: `@docs/security-policy-alignment-PLAN.md Continue.`

---

## 1. Problem Statement

The app-portal handles employee PII (SSNs, tax IDs, addresses) and payroll data but does not enforce several requirements from the organization's Information Security Policy — most critically, application-level encryption of Confidential data, indefinite audit log retention, and transactional audit guarantees.

---

## 2. Discovery

### Questions

1. What encryption approach for PII fields? → AES-256-GCM per policy, using existing `PAYROLL_ENCRYPTION_KEY` env var
2. Should audit log retention change to indefinite, or should the policy be amended? → Code must match policy: indefinite retention
3. How should transactional audit writes be implemented? → Drizzle ORM `db.transaction()` wrapping operation + audit insert
4. Which security headers are needed? → CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy
5. What rate limiting strategy fits a Vercel serverless deployment? → Vercel KV or upstash/ratelimit (no Redis server needed)

### Responses

All answered via codebase analysis and policy requirements. See gap analysis conversation.

### Synthesis

14 gaps identified; 2 deferred by owner (#14 NextAuth beta, #15 employee data retention). 12 items remain across 5 implementation phases. #5 is a policy text update + UX fix (not a security control change). #11 is a one-line removal.

---

## 3. Design Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | AES-256-GCM encryption via Node.js `crypto` module for `taxId`, `stateTaxId`, `address` | Policy §6.2 requires it; `PAYROLL_ENCRYPTION_KEY` already provisioned in env |
| D1a | Port encryption utility from `financial-system/src/lib/encryption.ts` | Battle-tested, has test suite; format: `base64(iv):base64(authTag):base64(ciphertext)`. Share key: app-portal `PAYROLL_ENCRYPTION_KEY` = financial-system `PEOPLE_ENCRYPTION_KEY` |
| D2 | Encrypt on write, decrypt on read — transparent to UI layer | Minimizes blast radius; form components unchanged |
| D3 | Remove audit log deletion from cleanup cron | Policy §6.3: "retained indefinitely, never deleted" |
| D4 | Wrap all mutating operations + audit writes in `db.transaction()` | Policy §7.3: "if audit insert fails, entire operation rolls back" |
| D5 | Security headers via `next.config.ts` `headers()` function | Framework-native, no extra dependencies |
| D6 | Update policy §7.2 CSRF text to reflect Server Actions origin-check mechanism | Current protection is sufficient; policy text is outdated |
| D7 | Friendly CSRF/session-expired error page with Ted Lasso energy | Better UX for idle-timeout token expiry |
| D8 | Remove `image/svg+xml` from upload allowed types | Owner decision: no SVG needed, eliminates XSS vector |
| D9 | Rate limiting via `@upstash/ratelimit` + Vercel KV | Serverless-compatible, no infrastructure to manage |
| D10 | Strip all `console.log` debug statements from `auth.ts` | Confidential data must never be logged (§6.1) |
| D11 | Add `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `EMPLOYEE_DEACTIVATED` to audit actions | Policy §7.3 requires all admin actions audited |
| D12 | Add file magic-byte validation for uploads | MIME type alone is spoofable |

---

## 4. Requirements

### P0: Must Have

| ID | Requirement | Traces to |
|----|-------------|-----------|
| REQ-P0-1 | Encrypt `taxId`, `stateTaxId`, `address` with AES-256-GCM at application level | Policy §6.1, §6.2, 201 CMR 17.04 |
| REQ-P0-2 | Remove audit log deletion from cleanup cron; retain indefinitely | Policy §6.3 |
| REQ-P0-3 | Wrap all mutation + audit-log operations in DB transactions | Policy §7.3 |
| REQ-P0-4 | Remove debug `console.log` statements from `auth.ts` | Policy §6.1 |
| REQ-P0-5 | Remove SVG from allowed upload types | D8, Policy §7.2 |

### P1: Nice to Have (but policy-required)

| ID | Requirement | Traces to |
|----|-------------|-----------|
| REQ-P1-1 | Add CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy headers | Policy §7.2, §6.2 |
| REQ-P1-2 | Add rate limiting to auth and API endpoints | Policy §7.2, §10.1 |
| REQ-P1-3 | Add employee CRUD actions to main audit log | Policy §7.3 |
| REQ-P1-4 | Add `beforeState`/`afterState` JSON columns to audit log | Policy §7.3 |
| REQ-P1-5 | Add file magic-byte validation to upload endpoint | Policy §7.2 |
| REQ-P1-6 | Track failed login attempts for incident detection | Policy §10.1 |

### P1-Policy: Policy Text Updates (no code)

| ID | Requirement | Traces to |
|----|-------------|-----------|
| REQ-POL-1 | Update §7.2 CSRF bullet to describe Server Actions origin-check mechanism | D6 |

### P1-UX: User Experience

| ID | Requirement | Traces to |
|----|-------------|-----------|
| REQ-UX-1 | Friendly session-expired / CSRF error page with clear guidance | D7 |

### P2: Future (deferred by owner)

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-P2-1 | Upgrade NextAuth to stable release | #14 — monitor, not actionable yet |
| REQ-P2-2 | Employee PII retention/deletion automation | #15 — deferred |

---

## 5. Data Model

### Migration 1: Audit log — remove retention, add before/after state

```sql
-- Add JSON columns for before/after state
ALTER TABLE audit_logs ADD COLUMN before_state JSONB;
ALTER TABLE audit_logs ADD COLUMN after_state JSONB;
```

No structural change to `employees` table — encryption is transparent (ciphertext stored in existing `text` columns).

No structural change to `payroll_audit_log` — it already tracks field-level old/new values.

### New utility: `src/lib/encryption.ts`

Ported from `financial-system/src/lib/encryption.ts` (proven in production for Plaid tokens and vendor tax IDs).

```
encrypt(plaintext: string, keyEnvVar = 'PAYROLL_ENCRYPTION_KEY'): string   → base64(iv):base64(authTag):base64(ciphertext)
decrypt(encrypted: string, keyEnvVar = 'PAYROLL_ENCRYPTION_KEY'): string   → original plaintext
```

### Cross-project key sharing

| Project | Env var | Same key value |
|---------|---------|---------------|
| app-portal (this app) | `PAYROLL_ENCRYPTION_KEY` | ✅ shared 32-byte hex |
| financial-system | `PEOPLE_ENCRYPTION_KEY` | ✅ shared 32-byte hex |

Financial-system's `.env.example` already documents this: *"Must match the encryption key used by app-portal."*
The `PEOPLE_ENCRYPTION_KEY` env var in financial-system is currently empty — will be populated with the same value once encryption is live here.

---

## 6. Implementation Plan

### Phase 1: Critical Data Protection (REQ-P0-1, REQ-P0-4, REQ-P0-5)

| Task | Status | Files |
|------|--------|-------|
| Port `src/lib/encryption.ts` from financial-system (adapt default key to `PAYROLL_ENCRYPTION_KEY`) | ✅ | `src/lib/encryption.ts` (new) |
| Port encryption unit tests from financial-system | ✅ | `src/lib/encryption.test.ts` (new) |
| Add encrypt-on-write to `createEmployee()` and `updateEmployee()` | ✅ | `src/lib/db/employees.ts` |
| Add decrypt-on-read to `getAllEmployees()`, `getEmployeeById()`, `setEmployeeActive()` | ✅ | `src/lib/db/employees.ts` |
| Write migration script for existing plaintext → ciphertext | ✅ | `scripts/encrypt-existing-pii.ts` (new) |
| Remove all `console.log` debug lines from `extractRoles()` | ✅ | `src/lib/auth.ts` |
| Remove `image/svg+xml` from `ALLOWED_TYPES` | ✅ | `src/app/api/upload/route.ts` |

### Phase 2: Audit Integrity (REQ-P0-2, REQ-P0-3, REQ-P1-3, REQ-P1-4)

| Task | Status | Files |
|------|--------|-------|
| Remove `deleteOldAuditLogs()` call from `cleanupOldRecords()` | ✅ | `src/lib/db/cleanup.ts` |
| Remove `deleteOldAuditLogs()` function | ✅ | `src/lib/db/audit-logs.ts` |
| Add Drizzle migration: `before_state` / `after_state` JSONB columns on `audit_logs` | ✅ | `drizzle/0003_audit_log_before_after_state.sql` |
| Update `audit_logs` schema in Drizzle | ✅ | `src/lib/db/schema.ts` |
| Add `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `EMPLOYEE_DEACTIVATED` audit actions | ✅ | `src/lib/db/audit-logs.ts` |
| Wrap app CRUD + audit writes in `db.transaction()` | ✅ | `src/app/admin/apps/actions.ts` |
| Wrap user mgmt + audit writes in `db.transaction()` | ✅ | `src/app/admin/users/actions.ts` |
| Wrap employee CRUD + both audit writes in `db.transaction()` | ✅ | `src/app/admin/employees/actions.ts` |
| Populate `beforeState`/`afterState` in audit log calls | ✅ | All action files |
| Update audit log tests | ✅ | `src/lib/db/audit-logs.test.ts` |

### Phase 3: Security Headers & Upload Hardening (REQ-P1-1, REQ-P1-5)

| Task | Status | Files |
|------|--------|-------|
| Add `headers()` config with CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy | ✅ | `next.config.ts` |
| Add file magic-byte validation for PNG, JPEG, WebP | ✅ | `src/lib/upload-validation.ts` (new), `src/app/api/upload/route.ts` |
| Add magic-byte validation unit tests (11 tests) | ✅ | `src/lib/upload-validation.test.ts` (new) |
| Test CSP doesn't break inline styles (Tailwind) or Vercel analytics | 🔲 | Manual after deploy |

### Phase 4: Rate Limiting & Login Tracking (REQ-P1-2, REQ-P1-6)

| Task | Status | Files |
|------|--------|-------|
| Add `@upstash/ratelimit` + `@upstash/redis` dependencies | ✅ | `package.json` |
| Create rate-limit utility (fail-open, generous limits) | ✅ | `src/lib/rate-limit.ts` (new) |
| Apply rate limiting to API routes (upload, cron) | ✅ | `src/app/api/upload/route.ts`, `src/app/api/cron/cleanup/route.ts` |
| Apply rate limiting to server actions (mutating only) | ✅ | `apps/actions.ts`, `users/actions.ts`, `employees/actions.ts` |
| Add `LOGIN_DENIED` audit action + failed login logging | ✅ | `src/lib/auth.ts`, `src/lib/db/audit-logs.ts` |
| Update audit UI (table label + filter option) | ✅ | `audit-log-table.tsx`, `audit-log-filters.tsx` |
| Update audit-logs test (11→12 actions) | ✅ | `src/lib/db/audit-logs.test.ts` |
| Add KV env vars to `.env.example` | ✅ | `.env.example` |

### Phase 5: Policy & UX (REQ-POL-1, REQ-UX-1)

| Task | Status | Files |
|------|--------|-------|
| Update policy §7.2 CSRF text (suggested text below) | ✅ | `financial-system/docs/information-security-policy.md` |
| Create friendly session-expired error page | ✅ | `src/app/auth/error/page.tsx` |
| Style error page with warm, encouraging copy | ✅ | Same |

---

## 7. Policy Text Updates

### §7.2 — CSRF Bullet (replace existing text)

**Current:** *"CSRF protection via NextAuth.js signed tokens"*

**Proposed:**

> CSRF protection via Next.js Server Actions with automatic origin verification. Server-side mutations are invoked through React Server Actions, which validate the request `Origin` header against the application's host, rejecting cross-origin form submissions. Authentication state is maintained via encrypted, HTTP-only session cookies that are not accessible to client-side scripts.

---

## 8. Session-Expired Error Page Copy

When a user hits a CSRF or expired-session error, instead of a raw error string, display:

> **Looks like you've been away for a bit!**
>
> Your session timed out while you were off being awesome. No worries — just sign back in and you'll be right where you left off. Believe.
>
> [ Sign In Again ]

*(Button redirects to `/login`)*

---

## 9. Verification

| Check | Method |
|-------|--------|
| PII encryption works end-to-end | Unit test: encrypt → store → retrieve → decrypt roundtrip |
| Existing data migrated | Run migration script, spot-check DB for ciphertext format `iv:ciphertext:tag` |
| Audit logs no longer deleted | Remove cron call; verify via DB query after 90+ days (or unit test) |
| Transactions roll back on audit failure | Integration test: mock audit insert failure → verify main record also rolled back |
| CSP headers present | `curl -I` production URL; Playwright `response.headers()` check |
| Rate limiting works | Integration test: exceed limit → verify 429 response |
| SVG upload rejected | Upload test with `.svg` file → verify 400 |
| No debug logging | `grep console.log src/lib/auth.ts` returns empty |
| Error page displays correctly | Manual test: let session expire → verify friendly message |

---

## 10. Impact Assessment

### Cross-Project Risk: RESOLVED

Financial-system's `getActiveEmployees()` query (`src/lib/integrations/people.ts`) does **NOT** select `tax_id`, `state_tax_id`, or `address`. It reads only compensation, withholding, and classification fields. Encrypting PII columns in app-portal has **zero impact** on the payroll pipeline.

Financial-system already has:
- A production-proven `encryption.ts` utility (same AES-256-GCM, same format)
- `PEOPLE_ENCRYPTION_KEY` env var scaffolded in `.env.example`
- A comment: *"Must match the encryption key used by app-portal"*

**Deployment sequence:** Deploy app-portal encryption → set shared key in both Vercel projects → populate `PEOPLE_ENCRYPTION_KEY` in financial-system. No financial-system code changes needed for this plan.

### Phase-by-Phase Risk Matrix

| Phase | Risk | Likelihood | Mitigation |
|-------|------|-----------|------------|
| **1: PII Encryption** | Existing plaintext rows unreadable after deploy | HIGH if migration skipped | Run `scripts/encrypt-existing-pii.ts` migration BEFORE deploying new read logic |
| **1: PII Encryption** | financial-system payroll breaks | ~~HIGH~~ → **NONE** | Query doesn't touch encrypted columns |
| **1: Remove debug logs** | None | NONE | Pure deletion of console.log, no functional side effects |
| **1: Remove SVG uploads** | Existing SVG icons break | LOW | Check if any current apps use SVG icons (already in blob storage, still served) |
| **2: Remove audit deletion** | DB storage grows unbounded | LOW | At 2-5 users, years before meaningful. Monitor Neon storage. |
| **2: Add audit columns** | Existing queries break | NONE | New nullable columns; all existing reads unaffected |
| **2: Transactional audit writes** | Audit failure now rolls back primary operation | INTENDED | User sees "failed" and retries. Strictly better than silent unaudited writes. |
| **2: Transactional audit writes** | `logPayrollChanges()` needs `tx` param | MEDIUM refactor | Function signature changes; all 3 call sites in `employees/actions.ts` must update |
| **2: New audit actions** | Audit log filter dropdown grows | LOW | `audit-log-filters.tsx` auto-builds from `AUDIT_ACTIONS` — new entries appear automatically |
| **2: New audit actions** | Test count assertion breaks | CERTAIN | `audit-logs.test.ts` expects 8 actions — update to new count |
| **2: New audit actions** | Table action→label mapping misses new types | CERTAIN | `audit-log-table.tsx` needs new label entries or renders raw strings |
| **3: CSP headers** | **Entire app JS fails to load** | HIGH if too strict | Start with `Content-Security-Policy-Report-Only`; must allow `'unsafe-inline'` for scripts (Next.js hydration) and styles (Tailwind/Radix) |
| **3: CSP headers** | App icons or Zitadel avatars break | MEDIUM | Must whitelist `*.public.blob.vercel-storage.com` in `img-src` |
| **3: CSP headers** | Login breaks | MEDIUM | Must allow Zitadel issuer domain in `connect-src` |
| **3: Magic-byte validation** | Legitimate uploads rejected | LOW | Only validates first few bytes match expected PNG/JPEG/WebP signatures |
| **4: Rate limiting** | New infrastructure dependency (Vercel KV) | MEDIUM | Must decide fail-open vs. fail-closed if KV is unavailable |
| **4: Rate limiting** | Legitimate batch admin workflows throttled | LOW | Use generous limits for authenticated admin-role users |
| **4: Failed login tracking** | None | NONE | Additive logging, no functional change |
| **5: Policy text** | None | NONE | Markdown file edit in separate repo |
| **5: Error page** | Other NextAuth error types mishandled | LOW | Must handle all `?error=` param types, not just CSRF |

### Test Files Requiring Updates

| File | Why |
|------|-----|
| `src/lib/db/audit-logs.test.ts` | Action count assertion (8 → new count); new action type tests |
| `src/components/admin/audit-log-table.test.tsx` | Mock data needs `beforeState`/`afterState` fields |
| `src/test/api.integration.test.ts` | Cron cleanup response no longer includes `auditLogsDeleted`; upload rejects SVG |
| `src/mocks/handlers.ts` | Mock cleanup response; mock upload ALLOWED_TYPES (remove SVG) |
| `e2e/` | CSP may affect E2E test behavior; new error page needs E2E coverage |

---

## 11. Session Progress

### Session 1: 2026-03-01 (Discovery + Planning)

**Completed:**
- [x] Read information security policy
- [x] Full codebase security scan
- [x] Gap analysis (16 items identified)
- [x] Owner triage (#14, #15 deferred; #5 policy update + UX; #11 remove SVG)
- [x] Created plan document
- [x] Cross-project impact analysis (financial-system employee data flow)
- [x] Confirmed: financial-system does NOT read PII columns — zero cross-project risk
- [x] Confirmed: financial-system already has compatible encryption utility + `PEOPLE_ENCRYPTION_KEY` scaffolded
- [x] Full impact assessment with phase-by-phase risk matrix
- [x] Identified all test files requiring updates

**Next Steps:**
- [x] Owner approval of plan
- [x] Begin Phase 1 implementation

### Session 2: 2026-03-01 (Phase 1 — completed prior session)

Phase 1 (Critical Data Protection) completed — see task statuses above.

### Session 3: 2026-03-01 (Phase 2 — Audit Integrity)

**Completed:**
- [x] Removed `deleteOldAuditLogs()` from cleanup cron and audit-logs module (policy §6.3: indefinite retention)
- [x] Added Drizzle migration `0003_audit_log_before_after_state.sql` for `before_state`/`after_state` JSONB columns
- [x] Updated `audit_logs` schema with `beforeState`/`afterState` jsonb columns
- [x] Added 3 new audit actions: `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `EMPLOYEE_DEACTIVATED`
- [x] Updated `logAuditEvent()` to accept optional `tx` (transaction), `beforeState`, and `afterState`
- [x] Added `DbTransaction` type exported from `audit-logs.ts` for cross-module use
- [x] Updated `createApp`, `updateApp`, `deleteApp` to accept optional `tx` parameter
- [x] Updated `createEmployee`, `updateEmployee`, `setEmployeeActive`, `logPayrollChanges` to accept optional `tx` parameter
- [x] Wrapped all app CRUD + audit writes in `db.transaction()` with `beforeState`/`afterState`
- [x] Wrapped user mgmt audit + notification writes in `db.transaction()`
- [x] Wrapped all employee CRUD + payroll audit + main audit writes in `db.transaction()`
- [x] Updated audit-log-table component with new employee action labels
- [x] Updated audit-log-filters with new employee action options
- [x] Updated MSW mock handlers (removed SVG from upload types, removed audit logs from cleanup response)
- [x] Updated all test files: audit-logs.test.ts (8→11 actions), audit-log-table.test.tsx (added beforeState/afterState to mocks)
- [x] All 96 tests pass, TypeScript compiles clean (1 pre-existing unrelated type error in app-table.test.tsx)

**Next Steps:**
- [ ] Run migration `0003_audit_log_before_after_state.sql` against production DB
- [x] Begin Phase 3 implementation (Security Headers & Upload Hardening)

### Session 4: 2026-03-01 (Phase 3 — Security Headers & Upload Hardening)

**Completed:**
- [x] Added security headers via `next.config.ts` `headers()` function (D5):
  - `Content-Security-Policy` — `default-src 'self'`, `script-src`/`style-src` with `'unsafe-inline'` (Next.js/Tailwind), `img-src` whitelists `*.public.blob.vercel-storage.com`, `connect-src` whitelists Zitadel issuer, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`
  - `Strict-Transport-Security` — `max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [x] Extracted `validateMagicBytes()` to `src/lib/upload-validation.ts` (D12)
  - Validates PNG (`.PNG` header), JPEG (`FFD8FF`), and WebP (`RIFF` + `WEBP` marker)
  - Returns 400 if file content doesn't match declared MIME type
- [x] Integrated magic-byte check into upload route (`src/app/api/upload/route.ts`)
- [x] Added 11 unit tests covering all formats, edge cases (empty buffer, short buffer, RIFF-but-not-WebP, type mismatch, disguised HTML)
- [x] All 107 tests pass, TypeScript compiles clean (1 pre-existing unrelated type error in app-table.test.tsx)

**Next Steps:**
- [ ] Manual CSP verification after deploy (`curl -I` to check headers)
- [x] Begin Phase 4 implementation (Rate Limiting & Login Tracking)

### Session 5: 2026-03-01 (Phase 4 — Rate Limiting & Login Tracking)

**Completed:**
- [x] Installed `@upstash/ratelimit` + `@upstash/redis`
- [x] Created `src/lib/rate-limit.ts` — fail-open design (disabled if KV not provisioned):
  - API routes: 30 req/min sliding window (per IP)
  - Server actions: 60 req/min sliding window (per user ID)
  - Cron: 5 req/min sliding window (per IP)
  - All limiters catch errors and fail open — KV outage never blocks users
- [x] Applied rate limiting to upload POST/DELETE and cron GET routes (429 + Retry-After header)
- [x] Applied rate limiting to all mutating server actions (apps: 3, users: 6, employees: 3)
  - Skipped read-only actions (`getUnlinkedZitadelUsersAction`) and low-risk ones (notifications)
- [x] Added `LOGIN_DENIED` audit action for failed sign-in tracking (policy §10.1)
  - Fires in `signIn` callback when user lacks required roles
  - Fire-and-forget — logging failure never breaks the auth flow
  - Records user sub, email, roles, and denial reason
- [x] Updated audit UI: table label mapping + filter dropdown option for Login Denied
- [x] Updated audit-logs test: 11→12 action count
- [x] Added `KV_REST_API_URL` / `KV_REST_API_TOKEN` to `.env.example`
- [x] All 107 tests pass, TypeScript compiles clean

**Infrastructure Note:**
Rate limiting activates once Vercel KV is provisioned (Dashboard > Storage > KV). Until then, all requests are allowed through (fail-open). No code changes needed — just set the env vars.

**Next Steps:**
- [x] Provision Vercel KV and set `KV_REST_API_URL` + `KV_REST_API_TOKEN`
- [x] Begin Phase 5 implementation (Policy Text Update & Error Page)

### Session 6: 2026-03-01 (Phase 5 — Policy & UX)

**Completed:**
- [x] Updated §7.2 CSRF bullet in `financial-system/docs/information-security-policy.md` — replaced "NextAuth.js signed tokens" with Server Actions origin verification description (REQ-POL-1)
- [x] Enhanced auth error page with warm session-expired experience (REQ-UX-1, D7):
  - `SessionRequired` error now shows amber Clock icon instead of red AlertCircle
  - Friendly copy: "Looks like you've been away for a bit!" with encouraging message
  - Single "Sign In Again" button (LogIn icon) — no secondary button needed
  - All other error types retain standard destructive styling unchanged
- [x] All 107 tests pass, TypeScript compiles clean (1 pre-existing unrelated type error)

**All 5 Phases Complete.**

Remaining operational items (not code changes):
- [x] Run migration `0003_audit_log_before_after_state.sql` against production DB (already applied)
- [x] Run `scripts/encrypt-existing-pii.ts` migration (both employees already encrypted)
- [x] Provision Vercel KV (`upstash-kv-purple-pillar`, us-east, free tier) and set env vars — connection verified
- [ ] Manual CSP verification after deploy (`curl -I` to check headers)
- [ ] Set shared encryption key in both Vercel projects (`PAYROLL_ENCRYPTION_KEY` + `PEOPLE_ENCRYPTION_KEY`)
