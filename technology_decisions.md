# Technology Decisions: Internal App Registry & Auth

## Purpose

This document records technology stack decisions for the App Portal at tools.renewalinitiatives.org. Each decision includes the options considered, rationale, and tradeoffs accepted.

## Decision-Making Philosophy

- **Right-sized for 8 users** — Avoid over-engineering. Solutions should be simple to maintain.
- **Free tiers preferred** — Nonprofit budget. Choose services with generous free tiers.
- **Boring is good** — Well-documented, stable technologies over cutting-edge options.
- **Consistency with existing apps** — Align with Timesheets and Proposal Rodeo where sensible.

## Confirmed Constraints

| Constraint | Source |
|------------|--------|
| Zitadel Cloud for identity management | requirements.md |
| Next.js for the App Portal | design.md |
| Auth.js with Zitadel OIDC provider | design.md |
| Vercel for hosting | design.md |
| Email/password auth only (no social login) | requirements.md |
| 8 users total (4 internal, 4 external) | requirements.md |
| Mobile-first responsive design | design.md |
| Match renewalinitiatives.org aesthetic | requirements.md R2 |

---

## Decision Log

### Decision 1: Database — Vercel Postgres (Neon)

**Date**: 2026-02-01

**Options Considered**:
- Vercel Postgres (Neon) — Zero-config PostgreSQL integrated with Vercel
- Supabase — PostgreSQL with extras (auth, storage) we don't need
- Turso (SQLite) — Edge SQLite, simpler but less common

**Rationale**: Already hosting on Vercel, so this is zero-friction. PostgreSQL is reliable and well-documented. Free tier (256MB, 60 compute hours/month) far exceeds our needs for ~8 users.

**Key Tradeoffs Accepted**: Vendor lock-in to Vercel ecosystem (acceptable since we're already committed to Vercel hosting).

**Dependencies**: Will use Drizzle or Prisma as ORM (to be decided with testing framework).

---

### Decision 2: File Storage — Vercel Blob

**Date**: 2026-02-01

**Options Considered**:
- Vercel Blob — Simple file storage integrated with Vercel
- Cloudflare R2 — S3-compatible, overkill for this scale
- Database (base64) — Works but hacky, bloats DB

**Rationale**: Unified Vercel stack, dead-simple API, Pro tier gives 5GB (need ~5MB). One line to upload, store URL in database.

**Key Tradeoffs Accepted**: Another Vercel lock-in (trivial to migrate — just files with URLs).

**Dependencies**: None.

---

### Decision 3: Deployment Environments — Dev + Prod

**Date**: 2026-02-01

**Options Considered**:
- Dev + Prod — Preview deployments for testing, main branch = production
- Dev + Staging + Prod — Extra staging environment for pre-prod validation

**Rationale**: Small user base (8 users), solo maintainer. Preview deployments provide isolated testing per PR. Vercel's instant rollback covers mistakes. Staging adds complexity without proportional benefit.

**Key Tradeoffs Accepted**: No dedicated staging environment. Must trust preview deployments as final check before merging.

**Environment Notes**:
- Local: Mac (development)
- Preview: Vercel preview deployments (per PR/push)
- Production: tools.renewalinitiatives.org
- No OS mismatch concerns (Mac → Vercel Linux handled by build process)

---

### Decision 4: Testing Framework — Vitest + Playwright

**Date**: 2026-02-01

**Options Considered**:
- Vitest + Playwright — Modern, fast, handles multi-tab SSO testing
- Jest + Cypress — Traditional, slower, Cypress has single-tab limitation
- Vitest only — Skips E2E, insufficient for auth flow testing

**Rationale**: Vitest is faster than Jest with identical API. Playwright handles complex auth flows (multi-tab, cross-origin redirects to Zitadel). Both have excellent TypeScript support and are the modern standard for Next.js.

**Key Tradeoffs Accepted**: Fewer existing tutorials than Jest/Cypress (mitigated by good official docs).

**Dependencies**: None.

**Related Decision**: Using **Drizzle ORM** for database access — lighter than Prisma, generates cleaner SQL, pairs well with Vitest for testing.

---

### Decision 5: UI/UX Foundations — shadcn/ui + Tailwind CSS

**Date**: 2026-02-01

**Options Considered**:
- shadcn/ui + Tailwind — Copy-paste components on Radix primitives, highly customizable
- Radix UI + hand-written CSS — Unstyled primitives, more CSS to maintain
- Plain CSS only — Maximum control, but reinvents accessibility wheels

**Rationale**: shadcn/ui provides accessible components (modals, dropdowns, tables) built on Radix. Tailwind integrates with existing CSS custom properties. Components are owned (not a dependency), allowing full customization to match renewalinitiatives.org aesthetic.

**Key Tradeoffs Accepted**: Tailwind learning curve (mitigated by good docs and IDE support).

**UI Summary**:
- Accessibility baseline: WCAG 2.1 AA / Section 508
- Reference site: renewalinitiatives.org
- Primary color: #2c5530 (forest green)
- Color scheme: Light mode
- Fonts: System font stack (-apple-system, etc.)

---

