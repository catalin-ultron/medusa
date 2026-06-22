# Medusa repo reuse map

This file maps the main packages in this repo into three buckets:
- reuse now
- reuse with refactor
- do not reuse

Assumption: reuse means a new application or platform team can lift the package into a product with reasonable effort, not merely import it inside another Medusa-based codebase.

## Reuse now

### Core platform
- `packages/core/framework`
  - Why: strongest reusable platform layer. Already bundles config, HTTP, module wiring, workflows, runtime bootstrapping.
  - Caveat: still opinionated around Medusa conventions.

- `packages/core/orchestration`
  - Why: generic orchestration and transaction coordination.
  - Caveat: best fit if you also keep the Medusa container and module model.

- `packages/core/modules-sdk`
  - Why: core module abstraction and service wiring.
  - Caveat: tightly aligned with Medusa module lifecycle.

- `packages/core/workflows-sdk`
  - Why: reusable workflow authoring and execution primitives.
  - Caveat: strongest when paired with orchestration and module SDK.

- `packages/deps`
  - Why: centralized dependency layer around Awilix, MikroORM, PG, Zod, and telemetry dependencies.
  - Caveat: infra utility only, not product logic.

### UI system
- `packages/design-system/ui`
  - Why: highest-confidence UI reuse target for admin and product interfaces.
  - Caveat: expect light theme and token cleanup.

- `packages/design-system/icons`
  - Why: low-coupling visual asset package.
  - Caveat: useful mainly if you want the same icon language.

## Reuse with refactor

### App composition
- `packages/medusa`
  - Why: full backend composition layer with good wiring and integration patterns.
  - Caveat: not a clean reusable package by itself. Treat as reference app.

- `packages/core/core-flows`
  - Why: valuable if you want the same workflow patterns and some commerce flow logic.
  - Caveat: domain-heavy.

### Domain modules
- `packages/modules/product`
- `packages/modules/order`
- `packages/modules/cart`
- `packages/modules/customer`
- `packages/modules/payment`
- `packages/modules/pricing`
- `packages/modules/promotion`
- `packages/modules/inventory`
- `packages/modules/fulfillment`
- `packages/modules/tax`
- `packages/modules/region`
- `packages/modules/store`
- `packages/modules/user`
- `packages/modules/auth`
- `packages/modules/settings`
- `packages/modules/currency`
- `packages/modules/sales-channel`
- `packages/modules/stock-location`
- `packages/modules/notification`
- `packages/modules/analytics`
- `packages/modules/translation`
- `packages/modules/api-key`
- `packages/modules/locking`
- `packages/modules/file`
- `packages/modules/index`
- `packages/modules/link-modules`
  - Why: solid bounded modules with real business and platform logic.
  - Caveat: coupled to Medusa data model, events, workflows, and service contracts.

### Infra modules
- `packages/modules/cache-inmemory`
- `packages/modules/cache-redis`
- `packages/modules/caching`
- `packages/modules/event-bus-local`
- `packages/modules/event-bus-redis`
- `packages/modules/workflow-engine-inmemory`
- `packages/modules/workflow-engine-redis`
  - Why: strong infrastructure modules.
  - Caveat: best reused behind the same contracts.

### Provider modules
- `packages/modules/providers/payment-stripe`
- `packages/modules/providers/file-s3`
- `packages/modules/providers/file-local`
- `packages/modules/providers/notification-sendgrid`
- `packages/modules/providers/notification-local`
- `packages/modules/providers/auth-google`
- `packages/modules/providers/auth-github`
- `packages/modules/providers/auth-emailpass`
- `packages/modules/providers/analytics-posthog`
- `packages/modules/providers/analytics-local`
- `packages/modules/providers/locking-redis`
- `packages/modules/providers/locking-postgres`
- `packages/modules/providers/caching-redis`
- `packages/modules/providers/fulfillment-manual`
  - Why: useful adapter implementations and strong integration reference code.
  - Caveat: reusable only if your provider interface matches Medusa’s.

### Admin stack
- `packages/admin/dashboard`
  - Why: complete admin shell with tables, forms, routing, data fetching, and operational UI patterns.
  - Caveat: too Medusa-shaped to drop into another app unchanged.

- `packages/admin/admin-sdk`
  - Why: useful if you want the same admin API and client structure.
  - Caveat: likely tied to Medusa endpoints and resource shapes.

- `packages/admin/admin-shared`
- `packages/admin/admin-bundler`
- `packages/admin/admin-vite-plugin`
  - Why: good support infrastructure for the dashboard stack.
  - Caveat: most useful if you keep the dashboard architecture.

- `packages/design-system/ui-preset`
- `packages/design-system/toolbox`
  - Why: useful support packages around the UI system.
  - Caveat: lower standalone value than `ui` and `icons`.

### Plugins
- `packages/plugins/draft-order`
- `packages/plugins/loyalty`
  - Why: reusable feature slices if you want those exact capabilities.
  - Caveat: plugin hooks and domain events will need adaptation.

## Do not reuse

### Repo-specific tooling
- `packages/cli/medusa-cli`
- `packages/cli/medusa-dev-cli`
- `packages/cli/create-medusa-app`
- `packages/cli/http-types-generator`
- `packages/cli/oas/oas-github-ci`
- `packages/cli/oas/medusa-oas-cli`
  - Why: Medusa-specific scaffolding, DX, and release tooling.
  - Caveat: worth studying for patterns, not direct adoption.

### Internal support
- `packages/medusa-test-utils`
  - Why: internal test harness code, not runtime product value.
  - Caveat: useful only if you fork Medusa testing conventions.

- `packages/medusa-telemetry`
  - Why: internal observability plumbing with limited portable product value.
  - Caveat: inspect for instrumentation ideas only.

## Recommendation

If you want to move fast, keep the platform kernel and UI system:
- `packages/core/framework`
- `packages/core/orchestration`
- `packages/core/modules-sdk`
- `packages/core/workflows-sdk`
- `packages/design-system/ui`
- `packages/design-system/icons`

Then selectively adopt:
- workflow-engine, cache, event-bus, auth, file, notification provider packages
- dashboard only if you want a Medusa-style admin shell

Avoid extracting:
- CLI packages
- test utils
- telemetry internals
- the full `packages/medusa` app as a reusable module
