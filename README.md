# App Portal

Internal application portal and people directory for [Renewal Initiatives](https://renewalinitiatives.org) — a 501(c)(3) nonprofit focused on affordable housing and regenerative agriculture.

## What It Does

- **Unified SSO** — Single sign-on landing page for all Renewal Initiatives applications via Zitadel
- **People Directory** — Employee profiles, compensation data, and organizational structure
- **App Launcher** — Central hub linking to the financial system, timesheets, expense reports, and proposal tools

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Auth | Zitadel OIDC |
| Hosting | Vercel |

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Built With

Built by a non-developer + [Claude Code](https://claude.ai/claude-code) as a demonstration of AI-assisted application development.

## License

[MIT](LICENSE)
