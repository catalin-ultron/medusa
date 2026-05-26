# Medusa Monorepo — Ultron Deploy Plan

## Context
This is the NexityNetwork/medusa framework monorepo (Medusa v2). It is NOT a runnable application — it is a library/framework repository. Goal: deploy what is feasible.

## Audit Findings
- **Type**: Yarn 3 monorepo with Turbo, 21k+ files, 20+ packages
- **Backend**: Medusa v2 commerce server — requires Node.js + PostgreSQL + Redis
- **Admin**: React 18 + Vite SPA, tightly coupled to backend (virtual modules, dynamic entry)
- **Docs**: Next.js 15 SSR sites in `www/apps/` (book, user-guide, resources, bloom)
- **No standalone app**: No starter template inside this repo. Runnable configs exist only in integration-tests/

## Deployment Targets (feasibility-ranked)
1. **Static docs site** — Pick one www Next.js app, strip server features, add `output: 'export'`, build
2. **Minimal backend** — Create a runnable app using local packages + Supabase Postgres
3. **Admin dashboard** — Only if backend runs; otherwise stub/deploy as static shell

## Steps
- [x] Clone repo, create feature branch
- [x] Audit structure
- [ ] Provision Supabase project
- [ ] Create minimal runnable Medusa backend app
- [ ] Run DB migrations against Supabase
- [ ] Attempt to build one www Next.js app for static export
- [ ] Deploy whatever builds to Workers for Platforms
- [ ] Verify live URLs, report honest status
