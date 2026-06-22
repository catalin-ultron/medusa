# Medusa Monorepo — Reuse Audit
**Auditor:** Ultron  
**Repo:** catalin-ultron/medusa @ `8d4724c4`  
**Base branch:** develop  
**Date:** $(date +%Y-%m-%d)

---

## Executive Summary

Medusa is a TypeScript commerce platform organized as a Yarn monorepo (~50 packages). The code quality is production-grade across the board. The most reusable assets fall into three tiers:

| Tier | What | Value |
|------|------|-------|
| **Tier 1 — Liftable now** | Design system (UI + icons + tokens), MedusaError pattern, utility belt, DML model DSL | Copy directly into new projects |
| **Tier 2 — Pattern library** | Workflow engine, module system, DI pattern, file-system routing, provider pattern | Reimplement the API surface; swap the backend |
| **Tier 3 — Reference architecture** | Module service pattern (decorated CRUD), admin dashboard patterns, integration test harness | Use as architectural blueprint |

---

## TIER 1 — Reusable As-Is

### 1.1 Design System (`packages/design-system/`)

**`@medusajs/ui` — 44 production-grade React components** built on Radix UI + CVA + Tailwind CSS v3.

Key components worth extracting:
- **DataTable** — full-featured compound component on @tanstack/react-table (sorting, filtering, pagination)
- **Forms** — Input, Select, Checkbox, RadioGroup, Switch, CurrencyInput, DatePicker
- **Feedback** — Toast/Toaster, Alert, Badge, StatusBadge, Skeleton, ProgressAccordion
- **Overlays** — Drawer, FocusModal, Popover, DropdownMenu, Tooltip
- **Layout** — Container, Divider

**Pattern quality:** Every component uses `forwardRef` + `cva()` variants + `clx()` (clsx + tailwind-merge). Props spread onto the underlying element. Radix `asChild` pattern for composition.

**`@medusajs/icons` — ~380 React SVG icons**, tree-shakeable, CJS+ESM dual builds. Categories: UI chevrons/arrows, system files/servers, brand logos (Stripe, PayPal, Amazon), status badges.

**`@medusajs/ui-preset` — Tailwind CSS preset** with CSS custom properties for light + dark themes:
- `--bg-*`, `--fg-*`, `--border-*`, `--button-*`, `--tag-*` (neutral/red/blue/orange/green/purple)
- `--elevation-*` (box shadows for cards, modals, flyouts, tooltips)
- Dark mode via `.dark` class selector
- Typography scale + accordion keyframes

**The theming pipeline:** Figma → `@medusajs/toolbox` CLI → CSS tokens → Tailwind preset → components. This is a transferable architecture for any project that wants design-token-driven theming.

### 1.2 Error Handling Pattern (`packages/core/utils/`)

```typescript
// MedusaError — standardized error with type/code/message
throw new MedusaError(
  MedusaError.Types.NOT_FOUND,
  `Order with id: ${id} was not found`
)
```

Types: `DB_ERROR`, `DUPLICATE_ERROR`, `INVALID_ARGUMENT`, `INVALID_DATA`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `NOT_ALLOWED`, `UNEXPECTED_STATE`, `CONFLICT`

The framework's global error handler maps these to HTTP status codes (NOT_FOUND→404, DUPLICATE_ERROR→422, CONFLICT→409, UNAUTHORIZED→401). `PostgresError` enum maps known PG error codes. This pattern is dependency-free and trivially portable.

### 1.3 Utility Belt (`packages/core/utils/`)

Top 10 reusable utilities (all dependency-free or trivially portable):

| Utility | What it does |
|---------|--------------|
| `promiseAll` | `Promise.allSettled`-based with aggregate error — safer than `Promise.all` |
| `deepMerge` | Deep object merge (mutable, target-first) |
| `buildQuery` | Converts dot-notation to nested select/relation/order objects for ORM queries |
| `remoteQueryObjectToString` | Flattens nested query objects to dot-separated field paths |
| `deduplicate` | Array deduplication |
| `isDefined / isPresent / isString / isObject` | Type-narrowing guards |
| `removeUndefinedProperties` | Strips undefined from objects — clean API payloads |
| `generateEntityId` | Generates prefixed ULIDs (e.g. `prod_01ARZ3...`) |
| `validateEmail` | Email validation |
| `humanizeAmount` / `MathBN` | Money-safe math via bignumber.js |

### 1.4 DML Model DSL (`model.define()`)

```typescript
const RbacRole = model.define("rbac_role", {
  id: model.id({ prefix: "role" }).primaryKey(),
  name: model.text().searchable(),
  description: model.text().nullable(),
  metadata: model.json().nullable(),
}).indexes([{ on: ["name"], unique: true, where: "deleted_at IS NULL" }])
```

Built on MikroORM. Provides: column types (`text()`, `number()`, `boolean()`, `enum()`, `dateTime()`, `json()`), relationships (`hasOne`, `hasMany`, `belongsTo`, `manyToMany`), indexes, cascade config. All entities get implicit soft-delete (`deleted_at`). A clean, declarative schema DSL worth copying.

---

## TIER 2 — Pattern Library (Liftable with Backend Swap)

### 2.1 Workflow Engine (`packages/core/workflows-sdk/`)

The most architecturally interesting piece. A 5-function API for composing transactional workflows with automatic compensation:

```typescript
// Step — atomic unit with forward action + rollback
const chargeCustomer = createStep("charge", 
  async (amount, ctx) => {
    const result = await stripe.charge(amount)
    return new StepResponse(result, result.id) // second arg = compensation data
  },
  async (chargeId, ctx) => {
    await stripe.refund(chargeId) // runs on rollback
  }
)

// Workflow — DAG of steps
const checkoutWorkflow = createWorkflow("checkout",
  (input: WorkflowData<{ cartId: string }>) => {
    const order = createOrderStep(input.cartId)
    const payment = chargeCustomer(order.total)
    const email = transform({ order, payment }, (data) => 
      sendConfirmationEmail(data.order, data.payment)
    )
    return new WorkflowResponse(order, { hooks: [email] })
  }
)

// Execute
await checkoutWorkflow.run({ input: { cartId: "cart_123" } })
```

**Key primitives:**
- `createStep(name, invokeFn, compensateFn)` — atomic step with compensation
- `createWorkflow(name, composer)` — DAG builder; returns `.run()`, `.cancel()`, `.registerStepSuccess/Failure()`, `.retryStep()`
- `StepResponse(output, compensateInput)` — step's return value
- `transform(values, fn)` — pure data transform at runtime (deferred via proxy)
- `parallelize(...steps)` — parallel execution
- `when(condition, fn)` — conditional branching
- `createHook(name, data)` — external hook points within workflows

**Compensation model:** If any step fails, the engine walks backward through the DAG calling each step's `compensateFn` with the data returned in `StepResponse`. This is the canonical saga pattern made typesafe.

**Liftability:** The API surface (`createWorkflow`, `createStep`, `StepResponse`, `transform`, `parallelize`) is self-contained and elegant. The hard dependency is `@medusajs/orchestration` (workflow manager, transaction orchestrator, distributed transaction). To lift, reimplement the orchestration backend — a state machine + DAG executor + compensation walker — while keeping the clean API.

### 2.2 Module System (`Module()` + `MedusaService()`)

Every feature is a self-contained module:

```typescript
// Module definition
export default Module(Modules.ORDER, {
  service: OrderModuleService,
  loaders: [initialDataLoader],
})

// Service — auto-CRUD via MedusaService factory
class OrderModuleService extends MedusaService({ Order, LineItem, Shipping }) {
  // Auto-generated: retrieveOrder, listOrders, createOrders, deleteOrders, softDeleteOrders...
  
  // Custom business logic with decorators
  @InjectManager()
  @EmitEvents()
  async cancelOrder(id: string, @MedusaContext() ctx: Context) {
    // ...
  }
}
```

**MedusaService<T>** auto-generates full CRUD for every model passed in:
- `retrieve[Model]`, `list[Models]`, `listAndCount[Models]`
- `create[Models]`, `update[Models]`, `delete[Models]`, `softDelete[Models]`, `restore[Models]`

**Decorators:**
- `@InjectManager()` — wraps method in MikroORM transaction
- `@InjectTransactionManager()` — for internal/protected methods
- `@MedusaContext()` — injects shared context as last parameter
- `@EmitEvents()` — emits `created`, `updated`, `deleted` events post-mutation

This is the single highest-leverage pattern in the codebase. Adaptable to any domain — the factory + decorator pattern works the same whether models are Orders or IoT devices.

### 2.3 Provider / Strategy Pattern

Modules can swap backend implementations:

```typescript
// Provider registration
export default ModuleProvider(Modules.PAYMENT, {
  services: [StripeProviderService],
})

class StripeProviderService implements IPaymentProvider {
  static identifier = "stripe"
  async initiatePayment(data) { /* Stripe SDK */ }
  async capturePayment(data) { /* ... */ }
  async refundPayment(data) { /* ... */ }
}
```

The same pattern applies across: fulfillment (manual, 3PL), notification (local, SendGrid), file storage (local, S3), auth (emailpass, Google, GitHub), caching (memory, Redis), event bus (local, Redis), workflow engine (memory, Redis), analytics (PostHog). Classic Strategy pattern at ecosystem scale.

### 2.4 File-System Route Loading

Routes are loaded by convention — file path = URL:

```
src/api/admin/orders/route.ts        → GET  /admin/orders
src/api/admin/orders/[id]/route.ts   → GET  /admin/orders/:id
```

Each `route.ts` exports named functions matching HTTP methods (`GET`, `POST`, `PUT`, `DELETE`). Route files can export `AUTHENTICATE=false`, `CORS=false` for opt-out. A `RoutesLoader` scans + loads, a `RoutesSorter` sorts by specificity, a `RoutesFinder` provides O(1) lookup. Middleware chain: body parser → validator → CORS → auth → locale → user middleware → route handler → error handler.

### 2.5 Typed DI Container

```typescript
// Awilix-based, fully typed via declaration merging
const container: MedusaContainer<{
  orderService: IOrderModuleService
  productService: IProductModuleService
}>

const orderService = container.resolve("orderService") // typed as IOrderModuleService
```

The `MedusaContainer<Cradle>` pattern where `resolve(key)` returns a fully typed result is excellent. Portable to any DI library — just wrap it with a typed facade.

---

## TIER 3 — Reference Architecture

### 3.1 Admin Dashboard (`packages/admin/dashboard/`)

React admin UI (Vite-based). Architecture is modular:
- **Routing:** file-system-based, likely React Router
- **HTTP client:** thin wrapper at `src/client/client.ts`
- **API modules:** 40+ domain modules (`src/api/`) barrel-exported
- **i18n:** i18next with cookie/localStorage/header detection, English fallback
- **Hooks:** domain-specific data hooks (e.g. `useProducts`, `useOrders`)

Patterns worth lifting: the API module barrel pattern, the client wrapper, the i18n configuration.

### 3.2 Integration Test Harness (`integration-tests/` + `packages/medusa-test-utils/`)

**`medusaIntegrationTestRunner`** orchestrates:
1. Container creation
2. Database setup (create, migrate, sync links)
3. App startup
4. Returns `{ dbConnection, getContainer, api, dbUtils, getMedusaApp }`

Jest-based, `@swc/jest` for fast TS transform, parallel suites via `projects` config. A robust pattern for full-stack testing with real infrastructure. The `init-modules.ts` helper creates an isolated MikroORM + MedusaApp per test.

### 3.3 CLI Architecture (`packages/medusa-cli/`)

Yargs-based CLI with commands: `new`, `start`, `build`, `develop`, `exec`, `user`. Pattern: `create-cli.ts` registers commands + codemods, each command in its own file. Clean, minimal CLI architecture worth copying.

### 3.4 Type System Patterns (`packages/core/types/`)

- **DTO tri-separation:** `common/` (read shape), `mutations/` (write payload), `service/` (module interface)
- **`ModuleExports<T>`:** generic module contract `{ service, loaders, runMigrations?, revertMigration? }`
- **`Constructor<T>`:** `new (...args: any[]) => T` — used throughout for class-based DI
- **`I*ModuleService`:** interface contracts with standardized CRUD signatures

---

## What NOT to Reuse

- **Commerce-specific business logic** — order totals, tax calculation, payment flows, cart logic. These are tightly coupled to commerce domains.
- **The MikroORM dependency** — the DML + service layer is built on MikroORM. Adapting to another ORM requires rewriting the auto-CRUD factory.
- **`@medusajs/orchestration`** — the workflow execution engine is transaction-orchestrator-specific. Lift the API pattern, not the implementation.
- **Express-based HTTP layer** — functional but not novel. The route-loader pattern is more interesting than the Express wiring.

---

## Summary Matrix

| Asset | Tier | Effort to Reuse | Domain-Agnostic |
|-------|------|-----------------|-----------------|
| Design system (UI + icons + tokens) | 1 | Low — copy packages | Yes |
| MedusaError + error handler | 1 | Low — single file | Yes |
| Utility belt | 1 | Low — cherry-pick functions | Yes |
| DML model DSL | 1 | Medium — coupled to MikroORM | Yes |
| Workflow engine API | 2 | High — reimplement orchestration backend | Yes |
| Module system (factory + decorators) | 2 | Medium — swap ORM adapter | Yes |
| Provider/strategy pattern | 2 | Low — pattern only | Yes |
| File-system route loading | 2 | Medium — reimplement for target HTTP lib | Yes |
| Typed DI container | 2 | Low — wrap any DI lib | Yes |
| Admin dashboard patterns | 3 | Low — reference only | Partially |
| Integration test harness | 3 | Medium — reimplement with project DB | Yes |
| CLI architecture | 3 | Low — reference only | Yes |
| Commerce service methods | — | N/A | No |