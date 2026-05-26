# Medusa Audit + Deploy Plan

## Goal
Clone NexityNetwork/medusa, audit the commerce backend, build what's feasible, wire Supabase/Postgres, deploy live UI, and report honestly.

## Context
- This is the Medusa v2 framework monorepo (yarn workspaces + turbo)
- NOT a starter app — it's the library source
- Requires Node >=20, uses yarn@3.2.1

## Audit Findings (Completed)
- **Build system**: Yarn 3.2.1 (Berry), Node 20 expected, turbo monorepo with 81 workspace packages
- **Deployable apps**: 7 Next.js 15 apps under www/apps/ (api-reference, bloom, book, cloud, resources, ui, user-guide)
- **Static export**: NONE of the www apps support `output: 'export'` out of the box — all use dynamic redirects/rewrites
- **Backend**: packages/medusa can run independently via `yarn build && yarn serve`, needs DATABASE_URL
- **DB**: No local Postgres/Redis running. Supabase token (Sbp_a0759549c59d07ef396f6a6df60d93414d97120c) is invalid/expired
- **Deps**: Node_modules installed successfully (~37s) via yarn berry node-modules linker

## Build Blockers
- **Backend build**: packages/medusa depends on 20+ workspace packages (framework, core, modules) — all are uncompiled TypeScript source. Building the backend requires compiling the entire dependency tree first.
- **Admin dashboard**: Same blocker — @medusajs/dashboard depends on @medusajs/admin-bundler, @medusajs/admin-sdk, etc., all uncompiled source.
- **www apps**: All depend on workspace packages (docs-ui, docs-utils, remark-rehype-plugins) which are also uncompiled source.
- **Conclusion**: A full `turbo run build` is required before any package can be used. This is a 10+ minute build with 81 workspaces. Not feasible in this session.

## Steps
- [x] 1. AUDIT — Dependency health, build system, deployable artifacts
- [ ] 2. DB — Provision local Postgres, capture connection string
- [ ] 3. BUILD — Install deps and build monorepo (or deployable subset)
- [ ] 4. RUN — Configure .env and try to start the backend (or integration-test API)
- [ ] 5. DEPLOY — Create standalone deployable app using published Medusa UI, build, deploy via deploy_wfp
- [ ] 6. REPORT — Branch, commit SHA, live URL, status

## Notes
- /work is ephemeral — commit + push after EACH step
- If a dep/service is missing, note it and move on
- Target: git-durable, honest reporting
