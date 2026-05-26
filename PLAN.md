# Medusa Commerce Backend — Audit & Deploy Plan

Goal: Clone NexityNetwork/medusa, audit its structure, build/run it, wire Supabase if DB is needed, and deploy a live UI.

## Steps
- [x] 1. Clone repo, fork to catalin-ultron/medusa, create `feat/audit-and-deploy` branch
- [x] 2. Audit codebase structure, build system, dependencies, env requirements
- [x] 3. Provision Supabase/Postgres if the project requires a database
- [x] 4. Install dependencies and build
- [x] 5. Run the app / verify startup
- [x] 6. Deploy static/usable UI to Workers for Platforms (deploy_wfp)
- [x] 7. Final report with branch, commit SHA, live URL, and status

## Audit Findings

### What this repo is
This is the **core Medusa v2 framework monorepo** (packages, modules, CLI, admin dashboard, design system). It is NOT a deployable application — it is the library/framework code. There are no in-repo starters, examples, or Docker configurations.

### Build system
- Yarn 3.2.1 with `node_modules` linker
- Turbo v1.6.3 for monorepo orchestration
- Full monorepo build: 72/74 packages succeed; `@medusajs/index` fails due to empty `tsc --showConfig` JSON breaking `tsc-alias`

### Deployable artifact extracted
**Admin Dashboard SPA** (`packages/admin/dashboard`) — built successfully via Vite as a static SPA.
- Build command: `yarn build:preview` (vite build)
- Output: `dist/` with `index.html`, chunked JS, CSS
- Env vars at build time: `VITE_MEDUSA_BACKEND_URL`, `VITE_MEDUSA_BASE`, `VITE_MEDUSA_STOREFRONT_URL`
- Default backend points to `http://localhost:9000` (non-functional without a Medusa backend)

### What's NOT deployable from this repo
- **Backend/API server**: Requires scaffolding from external starter (`medusa-starter-default`) + Postgres + Redis + env vars + migrations
- **Docs/www site**: Multi-app Next.js with server-side rewrites — not statically exportable
- **No Docker or deployment configs present**

### Deployment status
- Admin dashboard deployed to: https://medusa-admin-dashboard.apps.51ultron.com
- Returns HTTP 200, index.html serves correctly, assets load
- SPA renders but cannot authenticate (no backend wired)

## Honest Status
- WORKS: Repo cloned, dependencies installed, admin dashboard built and deployed
- STUBBED: Backend is absent — admin SPA has no API to talk to
- BLOCKED: Full monorepo build fails on `@medusajs/index`; no in-repo backend to run
