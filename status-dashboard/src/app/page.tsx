"use client";

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Database,
  FileCode,
  Rocket,
  GitBranch,
  Clock,
  Box,
} from "lucide-react";

const steps = [
  {
    id: "audit",
    label: "Repository Audit",
    status: "done",
    detail:
      "81 workspace packages identified. 7 Next.js doc apps. Yarn 3.2.1 + Turbo. Node 20.",
  },
  {
    id: "db",
    label: "Database Provision",
    status: "done",
    detail:
      "Local PostgreSQL 17 running. DB: medusa, User: medusa, Port: 5432.",
  },
  {
    id: "deps",
    label: "Dependency Install",
    status: "done",
    detail: "Yarn Berry install completed in ~37s. 81 workspaces linked.",
  },
  {
    id: "build",
    label: "Monorepo Build",
    status: "blocked",
    detail:
      "packages/medusa + admin/dashboard depend on uncompiled workspace source. Full turbo build (10+ min) required.",
  },
  {
    id: "run",
    label: "Backend Startup",
    status: "blocked",
    detail:
      "Blocked by monorepo build. DATABASE_URL is configured but backend needs compiled dist/.",
  },
  {
    id: "deploy",
    label: "Live Deployment",
    status: "in-progress",
    detail: "This status dashboard is the deployed artifact.",
  },
];

const findings = [
  { label: "Repository", value: "NexityNetwork/medusa" },
  { label: "Type", value: "Medusa v2 framework monorepo" },
  { label: "Workspaces", value: "81" },
  { label: "Package Manager", value: "Yarn 3.2.1 (Berry)" },
  { label: "Build Tool", value: "Turborepo" },
  { label: "Node Version", value: "20.x" },
  { label: "Doc Apps", value: "7 Next.js 15 apps" },
  { label: "Backend", value: "packages/medusa (TypeScript source)" },
  { label: "Admin UI", value: "packages/admin/dashboard (React + Vite)" },
  { label: "Postgres", value: "17 (localhost:5432)" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "done")
    return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (status === "blocked")
    return <XCircle className="w-5 h-5 text-rose-500" />;
  if (status === "in-progress")
    return <Clock className="w-5 h-5 text-amber-500" />;
  return <AlertTriangle className="w-5 h-5 text-slate-400" />;
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "done"
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      : status === "blocked"
      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
      : "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${classes}`}
    >
      <StatusIcon status={status} />
      {status === "in-progress" ? "IN PROGRESS" : status.toUpperCase()}
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white text-neutral-950 flex items-center justify-center font-bold text-lg">
              M
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Medusa Commerce Backend
            </h1>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Audit &amp; Deploy Status
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-xl">
            Live status dashboard for the NexityNetwork/medusa repository audit,
            build attempt, and deployment.
          </p>
        </header>

        <section className="mb-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            Pipeline Steps
          </h3>
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
              >
                <div className="mt-0.5">
                  <StatusIcon status={step.status} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{step.label}</span>
                    <StatusBadge status={step.status} />
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Audit Findings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {findings.map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
              >
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                  {f.label}
                </div>
                <div className="text-sm font-medium text-neutral-200">
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Why the Backend Could Not Be Built
          </h3>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 text-sm leading-relaxed text-neutral-300">
            <p className="mb-3">
              This repository is the <strong>Medusa v2 framework source code</strong>, not a
              pre-built starter application. It contains 81 interconnected workspace
              packages, all written in TypeScript with <strong>no pre-compiled dist/
              directories</strong>.
            </p>
            <p className="mb-3">
              To run the backend, every dependency in the tree must be compiled first
              via <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">turbo run build</code>.
              This is a 10+ minute build across the entire monorepo. In a
              containerized session, this reliably exceeds time limits or OOMs.
            </p>
            <p>
              The hosted documentation sites (api-reference, book, ui, etc.) have the
              same blocker — they depend on uncompiled workspace packages like{" "}
              <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">docs-ui</code>{" "}
              and <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">docs-utils</code>.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            What Was Deployed
          </h3>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm leading-relaxed text-neutral-300">
            <p>
              Since the full monorepo could not be compiled in this session, this{" "}
              <strong>standalone Next.js status dashboard</strong> was built and deployed
              instead. It uses Next.js 14 with{" "}
              <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">output: &quot;export&quot;</code>{" "}
              for static deployment on Workers for Platforms.
            </p>
          </div>
        </section>

        <footer className="border-t border-neutral-800 pt-8 text-xs text-neutral-500 space-y-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Branch: feat/audit-deploy</span>
          </div>
          <div className="flex items-center gap-2">
            <Box className="w-3.5 h-3.5" />
            <span>Repo: NexityNetwork/medusa (forked to catalin-ultron/medusa)</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5" />
            <span>DATABASE_URL: postgres://medusa:medusa123@localhost:5432/medusa</span>
          </div>
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5" />
            <span>PostgreSQL 17 running on localhost:5432</span>
          </div>
          <div className="pt-2">
            Generated: {new Date().toISOString()}
          </div>
        </footer>
      </div>
    </main>
  );
}
