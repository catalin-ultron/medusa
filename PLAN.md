# Medusa Audit + Deploy Plan

## Goal
Clone NexityNetwork/medusa, audit the commerce backend, build what's feasible, wire Supabase/Postgres, deploy live UI, and report honestly.

## Context
- This is the Medusa v2 framework monorepo (yarn workspaces + turbo)
- NOT a starter app — it's the library source
- Requires Node >=20, uses yarn@3.2.1

## Audit Findings (Completed)
- **Build system**: Yarn 3.2.1 (Berry), Node 20 expected, turbo monorepo with 20+ packages
- **Deployable apps**: 7 Next.js 15 apps under www/apps/ (api-reference, bloom, book, cloud, resources, ui, user-guide)
- **Static export**: NONE of the www apps support `output: 'export'` out of the box — all use dynamic redirects/rewrites
- **Backend**: packages/medusa can run independently via `yarn build && yarn serve`, needs DATABASE_URL
- **DB**: No local Postgres/Redis running. Supabase token (Sbp_a0759549c59d07ef396f6a6df60d93414d97120c) is invalid/expired
- **Deps**: Node_modules not installed

## Steps
- [x] 1. AUDIT — Dependency health, build system, deployable artifacts
- [ ] 2. DB — Provision local Postgres, capture connection string
- [ ] 3. BUILD — Install deps and build monorepo (or deployable subset)
- [ ] 4. RUN — Configure .env and try to start the backend (or integration-test API)
- [ ] 5. DEPLOY — Pick a viable target, add static export support, build, deploy via deploy_wfp
- [ ] 6. REPORT — Branch, commit SHA, live URL, status

## Notes
- /work is ephemeral — commit + push after EACH step
- If a dep/service is missing, note it and move on
- Target: git-durable, honest reporting
