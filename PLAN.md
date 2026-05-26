# Medusa Audit + Deploy Plan

## Goal
Clone NexityNetwork/medusa, audit the commerce backend, build what's feasible, wire Supabase/Postgres, deploy live UI, and report honestly.

## Context
- This is the Medusa v2 framework monorepo (yarn workspaces + turbo)
- NOT a starter app — it's the library source
- Requires Node >=20, uses yarn@3.2.1

## Steps
- [ ] 1. AUDIT — Dependency health, build system, deployable artifacts
- [ ] 2. DB — Provision Supabase Postgres project, capture connection string
- [ ] 3. BUILD — Install deps and build monorepo (or deployable subset)
- [ ] 4. RUN — Configure .env and try to start the backend (or integration-test API)
- [ ] 5. DEPLOY — Deploy what renders (docs site, admin UI, or API static output) via deploy_wfp
- [ ] 6. REPORT — Branch, commit SHA, live URL, status

## Notes
- /work is ephemeral — commit + push after EACH step
- If a dep/service is missing, note it and move on
- Target: git-durable, honest reporting
