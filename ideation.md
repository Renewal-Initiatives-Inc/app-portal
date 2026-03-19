# Ideation: Internal App Registry & Auth

## Meta
- Status: Ready for Kickoff
- Last Updated: 2026-02-01
- Sessions: 3

## 1. Origin
- **Entry Type**: Problem
- **Initial Statement**: "I've been building several internal web apps (timesheets, payroll, proposals, utilities). Each needs authentication. I don't want employees logging into 6 separate apps with 6 separate authentication regimes. We use Google Workspace but have outside collaborators not in our network. How do I simplify this?"
- **Refined Problem Statement**: A small nonprofit (4 internal employees + 4 external collaborators) needs unified authentication across a growing portfolio of internal web apps, with role-based access control so external users only see apps they're granted access to.

## 2. Jobs to be Done
- **Primary Job**: Log in once and access all authorized internal tools without re-authenticating
- **Related Jobs**:
  - Manage which users can access which apps (admin task)
  - Onboard external collaborators who aren't in Google Workspace
  - Build new apps that automatically integrate with the auth system
  - Retrofit existing apps (Timesheets, Proposal Rodeo) into the unified system
  - Reset password and manage profile in one place

- **Current Alternatives**:
  - Separate Auth.js implementation per app (current state)
  - Users create accounts on each app individually
  - No cross-app session sharing
  - No centralized user management

- **Switching Triggers**:
  - Pain compounds as more apps are built
  - External collaborator onboarding is awkward with per-app accounts
  - Cognitive load of multiple credentials
  - Now at 2 apps, seeing 4-5 more on the horizon—need to get ahead of it

## 3. User Segments

### Segment 1: Internal Employees
- **Context**: 4 staff members at Renewal Initiatives who need daily access to multiple internal tools (timesheets, proposals, upcoming: farm management, financial modeling)
- **Motivation**: One login for everything; stop juggling credentials; seamless movement between tools
- **Ability Barriers**: Low—these are internal team members, tolerance for initial setup
- **Potential Prompts**: Building a new tool, frustration with remembering which password goes where

### Segment 2: External Collaborators
- **Context**: 4 individuals from partner organizations (e.g., Lawrence from Farmer Veterans Coalition) who collaborate on specific projects like proposal writing
- **Motivation**: Easy access to shared tools without needing to be "inside" the organization's Google Workspace
- **Ability Barriers**: Low—described as "friendlies" with tolerance for onboarding with a small nonprofit
- **Potential Prompts**: Invitation to collaborate on a proposal, need to access shared planning tools

### Segment 3: Admins
- **Context**: Initially just the founder, but open to multiple internal employees having admin rights
- **Motivation**: Invite/manage users, grant app-level access, handle password resets
- **Ability Barriers**: None—technical founder comfortable with backend if needed
- **Potential Prompts**: New collaborator needs access, new app added to the registry

## 4. Market Landscape

### Direct Competitors

| Competitor | What They Do | Strengths | Weaknesses | Pricing |
|------------|--------------|-----------|------------|---------|
| **Zitadel Cloud** | Open-source IdP with managed cloud option | Built-in RBAC, multi-tenancy, OIDC, official Auth.js integration, ISO 27001 | API versioning complexity; free tier has no SLA | Free <100 DAU, Pro $100/mo |
| **Clerk** | Managed auth with pre-built UI components | Excellent Next.js integration, 5-min setup, organizations feature | Advanced RBAC requires Pro ($25/mo) + add-on ($100/mo); cloud-only | Free <10K MAU, paid for RBAC |
| **Auth0** | Enterprise identity platform | Full-featured, robust security, wide protocol support | Expensive, complex for small teams, overkill | Free <7.5K MAU, then $$$$ |
| **Supabase Auth** | Auth bundled with Postgres BaaS | Great free tier, integrates with DB, RLS for permissions | Less focused on multi-app SSO; RBAC via RLS is learning curve | Free <50K MAU |
| **Firebase Auth** | Google's auth service | Generous free tier (50K MAU), good mobile support | Google ecosystem lock-in, not SSO-focused | Free <50K MAU |

### Indirect Competitors (Self-Hosted)

| Solution | How it's used for this job | Gap it leaves |
|----------|---------------------------|---------------|
| **Authentik** | Modern open-source IdP, Docker-friendly, OIDC/SAML support | Requires hosting infrastructure (VPS or similar); learning curve for flows/policies |
| **Keycloak** | Enterprise-grade IdP by Red Hat, protocol powerhouse | Heavy, complex, steep learning curve; overkill for 8 users |
| **Authelia** | Lightweight reverse proxy auth companion | Not a full IdP—only handles auth gate, not user management |

### DIY with Auth.js

| Approach | Pros | Cons |
|----------|------|------|
| **Auth.js + subdomain cookies** | Free, already familiar, Vercel-native, full control | Requires careful cookie config (different for dev/prod); must build RBAC + user management UI yourself; some GitHub issues report CSRF errors with v5 subdomains |

### Market Signals
- IAM market growing at 12-16% CAGR, expected to reach $50B+ by 2026
- Cloud-based IAM adoption accelerating, especially for remote/distributed teams
- Zero Trust principles becoming standard (60% enterprise adoption by 2025 per Gartner)
- Open-source solutions (Authentik, Keycloak) gaining traction for cost-conscious orgs
- Nonprofit sector increasingly adopting MFA and centralized auth as cybersecurity awareness grows

### Opportunity Gaps
1. **"Good enough" SSO for tiny teams**: Enterprise solutions are overkill; self-hosted requires infrastructure; Auth.js requires building everything yourself. There's a gap for small teams (<20 users) who need SSO without the enterprise overhead or DIY complexity.
2. **Mixed user populations**: Most solutions assume either "all internal" or "all external" users. Supporting both employees (Google Workspace) and external collaborators (email/password) in one clean system is underserved.
3. **App-level permissions without enterprise pricing**: Clerk's organizations feature is close but paywalled. Most free solutions require building RBAC from scratch.

### Emerging Direction
**Zitadel Cloud + custom App Portal** is the recommended approach:
- Free at this scale (100 DAU limit >> 8 users)
- No infrastructure to maintain (fully managed cloud)
- Built-in RBAC eliminates need for custom permissions system
- Official Auth.js/NextAuth.js integration
- ISO 27001 certified security
- Open-source escape hatch if needed later

**Alternatives considered but not recommended:**
- **Auth.js + subdomain cookies**: Free but requires building RBAC yourself; Auth.js v5 has documented subdomain issues
- **Authentik on VPS**: Robust but requires $5/mo hosting + maintenance overhead; documentation gaps reported

## 5. Assumptions Log

| ID | Assumption | Category | Importance | Confidence | Evidence | Validation Strategy |
|----|------------|----------|------------|------------|----------|---------------------|
| A1 | Auth.js subdomain cookie sharing works reliably in production | Solution | High | Medium | Documented in Auth.js docs but requires careful dev/prod config; GitHub issues show CSRF errors with v5 for some users | Build proof-of-concept with 2 subdomains before committing |
| A2 | Moving existing apps (Timesheets, Proposal Rodeo) to subdomains won't break functionality | Solution | High | Medium | Standard DNS/Vercel operation, but apps may have hardcoded URLs or assumptions | Test with one app first; audit for absolute URLs |
| A3 | Custom RBAC (user-to-app permissions) can be built simply with Auth.js + Neon | Solution | High | Medium | Common pattern (user table, app table, permissions join table) but adds ongoing maintenance | Design schema early; prototype admin UI |
| A4 | User count will remain small (<50) and not exceed free tier limits | Market | Medium | High | Small nonprofit with project-specific external collaborators | Low risk; monitor if org grows significantly |
| A5 | Free/open-source Auth.js is sufficient; no need for paid services | Market | Medium | High | Research confirms pattern is viable and documented | Proceed with free option; have Clerk as fallback |
| A6 | Self-hosting Authentik would be more overhead than DIY Auth.js | Solution | Medium | Medium | Authentik is easier than Keycloak but still requires VPS, Docker, maintenance | Compare effort: ~10hr Auth.js setup vs ~5hr Authentik + ongoing hosting |
| A7 | External collaborators will use email/password auth without friction | User | Medium | High | Described as "friendlies" with tolerance; standard pattern they're familiar with | Low risk; could add Google OAuth later if needed |
| A8 | Landing page "app launcher" pattern provides good UX | Solution | Low | High | Common pattern (Google Workspace, Microsoft 365, enterprise portals) | Build simple version; iterate based on feedback |
| A9 | The pain of multiple logins justifies building this solution now | Problem | High | High | User confirmed pain is real and growing with each new app | Already validated through discovery |
| A10 | Zitadel Cloud free tier will remain available and sufficient | Market | High | High | No signs of removal; 100 DAU is 12x headroom; open-source fallback exists | Monitor Zitadel announcements; low risk |
| A11 | Zitadel + Auth.js integration will work reliably for our use case | Solution | High | Medium | Official example exists; some StackOverflow issues suggest config errors possible | Build proof-of-concept first |
| A12 | Existing apps can be migrated to Zitadel auth without major refactoring | Solution | High | Medium | Apps already use Auth.js; changing provider should be straightforward | Audit existing auth code before starting |

### Priority Matrix

**Test First** (High Importance, Low/Medium Confidence):
- **A11**: Zitadel + Auth.js integration — build proof-of-concept with portal + one app
- **A12**: Existing app migration — audit Timesheets auth code, estimate refactor effort
- **A2**: Verify existing apps don't have hardcoded URLs or assumptions that break

**Monitor** (High Importance, High Confidence):
- **A9**: Problem validation — already confirmed, proceed with confidence
- **A10**: Zitadel free tier availability — stable, open-source fallback exists

**Validate Later** (Lower priority):
- A4, A7, A8 — these are lower risk or can be adjusted mid-stream

**Superseded by Zitadel approach:**
- A1 (subdomain cookies) — no longer needed; using OIDC instead
- A3 (custom RBAC) — Zitadel provides built-in RBAC
- A5, A6 — confirmed; Zitadel Cloud is free and requires no VPS

## 6. Solution Hypotheses

### Hypothesis 1: Zitadel Cloud + App Portal (Recommended)

- **Description**: Use Zitadel Cloud as the identity provider (handles authentication, user management, RBAC). Build a custom "App Portal" on `tools.renewalinitiatives.org` that serves as the landing page showing users their authorized apps. Each app (Timesheets, Proposal Rodeo, etc.) authenticates against Zitadel via OIDC using the official Auth.js provider.
- **Key Differentiator**: Enterprise-grade identity management with built-in RBAC, zero infrastructure to maintain, free at this scale.
- **Target Segment**: All segments—internal employees, external collaborators, and admins all benefit from centralized auth and the app portal.
- **Validates Assumptions**: A1 (replaces subdomain cookies with proper OIDC), A3 (RBAC built-in, not custom), A5 (free tier sufficient), A6 (no VPS needed)
- **Key Risks**:
  - Dependency on Zitadel's cloud service (mitigated: open-source, could self-host later)
  - Auth.js + Zitadel integration requires careful redirect URI configuration
  - Free tier has no SLA (same infrastructure as Pro, but no guarantees)
- **Prior Art**: Zitadel has 12.9k GitHub stars, 245 contributors, ISO 27001 certified. Official Next.js + Auth.js integration example maintained by Zitadel team. Used in production by companies requiring multi-tenant identity.

### Hypothesis 2: DIY Auth.js Hub

- **Description**: Build a central auth app on `tools.renewalinitiatives.org` using Auth.js with subdomain cookie sharing. All apps move to subdomains (timesheets.renewalinitiatives.org, etc.). Build custom RBAC with Neon DB (users, apps, permissions tables). Build admin UI for user/permission management.
- **Key Differentiator**: Full control, no external dependencies, uses familiar stack.
- **Target Segment**: Primarily benefits admin (full control) but adds maintenance burden.
- **Validates Assumptions**: A1 (subdomain cookies), A2 (subdomain migration), A3 (custom RBAC)
- **Key Risks**:
  - Auth.js v5 subdomain cookie config has documented issues (CSRF errors)
  - Must build and maintain RBAC yourself
  - More surface area for bugs and security issues
- **Prior Art**: Vercel has official subdomain-auth template. Pattern is well-documented but requires careful implementation. Multiple GitHub issues show users struggling with dev/prod config differences.

### Hypothesis 3: Authentik on VPS

- **Description**: Self-host Authentik on a $5/mo VPS (DigitalOcean, Vultr, etc.). Apps authenticate against Authentik via OIDC. Authentik provides user management UI, RBAC, and SSO out of the box. Build app portal separately.
- **Key Differentiator**: Full control with less DIY than Auth.js; more robust than DIY but requires hosting.
- **Target Segment**: Admin benefits from Authentik's built-in management UI; others benefit from stable SSO.
- **Validates Assumptions**: A6 (compare VPS overhead vs Zitadel Cloud)
- **Key Risks**:
  - Requires VPS maintenance (updates, monitoring, occasional restarts)
  - Authentik documentation has gaps according to user feedback
  - Additional monthly cost ($5/mo) vs Zitadel Cloud (free)
- **Prior Art**: Authentik has 14.5k GitHub stars, active community. Simpler than Keycloak but still has learning curve. Reddit feedback is mixed on documentation quality.

### Recommendation

**Pursue Hypothesis 1 (Zitadel Cloud + App Portal)** because:

1. **Free at your scale** — 100 DAU limit is 12x what you need; no risk of hitting paywalls
2. **No infrastructure to maintain** — fully managed cloud service; same team that builds it runs it
3. **RBAC is built-in** — don't need to design schemas or build admin UIs for permissions
4. **Official Auth.js integration** — maintained example repo, documented in NextAuth.js docs
5. **Stability over complexity** — aligns with your priority of "gnarly setup is fine if it's stable long-term"
6. **Open-source escape hatch** — if Zitadel Cloud ever becomes problematic, you can self-host
7. **ISO 27001 certified** — appropriate security posture for a nonprofit handling internal data

**Key risks to monitor:**
- Zitadel Cloud free tier availability (currently stable, no signs of removal)
- Auth.js integration during initial setup (follow official example closely)

**Critical assumptions validated by this approach:**
- A3 (RBAC complexity) — eliminated; Zitadel handles it
- A5 (free tier sufficient) — confirmed; 100 DAU >> 8 users
- A6 (VPS overhead) — eliminated; no VPS needed

**Assumptions still to validate during implementation:**
- A2 (migrating existing apps) — apps need redirect URI updates, not subdomain migration
- A8 (app portal UX) — build simple version, iterate

## 7. Open Questions for /kickoff

### Requirements Questions
- [ ] What should the app portal URL be? `tools.renewalinitiatives.org` or something else?
- [ ] Should external collaborators see a different portal view than internal employees, or just filtered apps?
- [ ] Do you want Google OAuth as a sign-in option for internal employees (in addition to email/password)?
- [ ] What information should the portal display for each app? (Icon, name, description, last accessed?)

### Technical Questions
- [ ] Are Timesheets and Proposal Rodeo currently on custom domains or Vercel preview URLs?
- [ ] Do the existing apps have any hardcoded URLs or auth logic that needs refactoring?
- [ ] Should the app portal be a standalone Next.js app or part of an existing app?
- [ ] Do you want to start with a proof-of-concept (portal + one app) or full implementation?

### Migration Questions
- [ ] What's the plan for existing user accounts in Timesheets and Proposal Rodeo?
- [ ] Can existing users be migrated to Zitadel, or will they re-register?
- [ ] What's the rollout order? (Portal first, then migrate apps one by one?)

### Admin & Operations Questions
- [ ] Who should be able to invite new users? Just you, or any admin?
- [ ] Do you want email notifications when users are invited or when access is granted?
- [ ] Should there be an audit log of who accessed what app and when?

### User Research Gaps
- [ ] Should we get feedback from Lawrence (external collaborator) on the onboarding flow?
- [ ] Any specific UX preferences from internal employees?

## 8. Research Log
| Date | Topic | Source | Key Findings |
|------|-------|--------|--------------|
| 2026-02-01 | SSO landscape | Brave Search (multiple queries) | Enterprise solutions (Okta, Auth0) are expensive and overkill. Clerk has gotchas on RBAC in free tier. Self-hosted (Keycloak, Authentik) requires infrastructure. |
| 2026-02-01 | Auth.js multi-app | GitHub issues, Vercel docs, Reddit | Subdomain cookie sharing is well-documented. Vercel has official template. Set cookie domain to `.rootdomain.org` and all subdomains share session. |
| 2026-02-01 | Clerk limitations | Clerk docs, Reddit, pricing page | Free tier is 10K MAU but advanced roles/permissions require Pro + add-on. Basic RBAC possible via metadata workaround. |
| 2026-02-01 | Google Workspace + externals | Google docs, architecture guides | Can use Google as one identity provider alongside email/password for external users. Federated identity is standard pattern. |
| 2026-02-01 | Self-hosted IdP comparison | House of FOSS, Reddit r/selfhosted, Supertokens blog | Authentik is best for small/medium teams (simpler than Keycloak). Authelia is lightweight but not a full IdP. Keycloak is enterprise-grade but overkill and complex. |
| 2026-02-01 | Managed auth comparison | Clerk articles, DevToolsAcademy, Reddit, HN | Clerk best for fast setup + Next.js; Supabase good if you need DB too; Firebase has generous free tier but Google lock-in. All hit pricing walls at scale or for advanced RBAC. |
| 2026-02-01 | Auth.js v5 subdomain issues | GitHub issues #10915, #2414, #405; StackOverflow | Auth.js v5 has some CSRF issues with subdomains; requires careful cookie config with different settings for dev vs prod. Well-documented but not plug-and-play. |
| 2026-02-01 | IAM market trends | Precedence Research, Grand View, Fortune BI | IAM market growing 12-16% CAGR; cloud-based solutions dominating; Zero Trust adoption accelerating. |
| 2026-02-01 | Authentik for small teams | Authentik blog, Reddit r/Authentik, comparison articles | Authentik works well for small teams, Docker-friendly, modern UI. Open source version sufficient for small teams. Less complex than Keycloak. |
| 2026-02-01 | Nonprofit security practices | NTEN, 501 Commons, EFF | Nonprofits increasingly adopting MFA and centralized auth; best practices emphasize strong passwords + MFA + access control. |
| 2026-02-01 | Small team SSO options | TrustRadius, G2, Reddit | JumpCloud free tier for 10 users may be going away. Zitadel Cloud emerged as strong option with 100 DAU free tier. |
| 2026-02-01 | Zitadel pricing deep-dive | zitadel.com/pricing | Free tier: $0, 100 DAU, all features, unlimited users stored. Pro: $100/mo, 25K DAU, custom domain, SLA. |
| 2026-02-01 | Zitadel Next.js integration | Zitadel docs, GitHub example repo | Official NextAuth.js provider. Uses OIDC Authorization Code + PKCE. Well-documented with maintained example. |
| 2026-02-01 | Zitadel user experiences | Reddit r/devops, r/selfhosted, r/homelab | Self-hosted documentation has gaps; Cloud version is easier. API versioning (V1/V2/V3) can be confusing. Low memory footprint (~512MB). No LDAP sync (irrelevant for this use case). |
| 2026-02-01 | Zitadel project health | GitHub zitadel/zitadel | 12.9k stars, 245 contributors, 929 forks. Latest release v4.10.1 (Jan 30, 2026). Active development. |
| 2026-02-01 | Zitadel security | Zitadel Trust Center, blog | ISO 27001 certified. 99.5% SLA on Pro (free tier uses same infrastructure). Team that builds it runs the cloud service. |
| 2026-02-01 | Zitadel vs Authentik | House of FOSS, Reddit, comparison articles | Zitadel better for multi-tenancy. Authentik more flexible but resource-intensive. Both support OIDC. Zitadel Cloud eliminates VPS need. |
