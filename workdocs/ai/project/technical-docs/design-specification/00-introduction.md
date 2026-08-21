# 00 — Introduction & Design Principles

## 1. Overview

decaf-ts is a decorator-first, metadata-driven, flavour-aware TypeScript application framework. A single set of decorated models drives backend persistence, HTTP controllers, transaction coordination, authorization, task/graph orchestration, and Angular UI rendering. This design specification defines the per-subsystem design and the cross-cutting principles that govern it.

## 2. Design Principles (derived from the specs)

These principles recur across nearly every DECAF specification and are normative for new work:

- **P1 — Contract in core, behaviour in adapter.** Define the contract once in `@decaf-ts/core` (or the most foundational package); expose an adapter/override point; route runtime behaviour through that point. *Evidence:* `Adapter.transactionLock()` (DECAF-7), `@sequence` propagation (DECAF-11), `@migration` flavour targeting (DECAF-14), `@mirror` routing (DECAF-37/47), `ContextLock` override.
- **P2 — Flavour-awareness.** A single model can be persisted/transported across multiple flavours (DB dialects, Fabric vs Couch, transport flavours). Decoration metadata and adapter override points carry flavour-specific behaviour. *Evidence:* DECAF-6 driver detection, DECAF-14 flavour-targeted migrations, DECAF-7 per-adapter locks.
- **P3 — Metadata-driven UI.** The same decorators the backend persists drive UI rendering. *Evidence:* `ui-decorators`/`for-angular` (DECAF-24, 25, 32, 44, 45), `@namespace`/`@hideFor`/`@showFor` (DECAF-33).
- **P4 — Provider-agnostic infrastructure services.** Secrets (DECAF-26) and blobs (DECAF-30) share one `ClientBasedService` lifecycle so providers are interchangeable and cheap to learn.
- **P5 — Strict package boundaries, enforced not conventional.** ESLint `no-restricted-imports` + package `exports` maps. `integrations` is DOM-free and backend-only; `for-angular` cannot import backend-only packages; the graph engine is split out of the browser bundle (`./shared` vs `./graph`, DECAF-35).
- **P6 — Real integration verification.** Specs forbid mocking the database (DECAF-14, DECAF-15) and require live CouchDB/Postgres/Keycloak stacks.
- **P7 — Decaf-only error types.** Runtime errors are `InternalError`/`UnsupportedError`/`ValidationError`/`*Error extends InternalError` (DECAF-26/30/40/41), never raw `Error`.
- **P8 — Builder/decoration parity.** Anything expressible with decorators is expressible via the runtime `ModelBuilder`/`AttributeBuilder` (DECAF-4).
- **P9 — Scoped logging & context propagation.** Every service operation logs via `this.logCtx(args, op, true).for(this.method)` and propagates `Context` through derivations (DECAF-18, consumed by DECAF-26/30/32/48).
- **P10 — Reference, not distributed.** The graph engine is a reference interpreter; downstream compilers reuse definitions but stay separate (DECAF-32 §1.2/§22).

## 3. Non-Goals

- The org-based authorization system (DECAF-33) is **domain-neutral**: product-specific concepts are forbidden; only neutral primitives are modelled.
- The graph execution engine is **not** a production distributed orchestrator (DECAF-32).
- mcp-server packaging/tooling is out of scope (DECAF-16, DECAF-31, mcp-server CLI boot parts of DECAF-17).

## 4. Status Caveat

Source specifications are at varying maturity (Completed / In Progress / Planned / Draft / Rejected). Design statements here inherit that maturity. Where a spec's self-reported status conflicts with its task table, the conflict is flagged in [10 — Overlaps & Contradictions](./10-overlaps-contradictions.md) and the design treats the more conservative state as authoritative.

Continue to [01 — Persistence & Adapter Design](./01-persistence-design.md).
