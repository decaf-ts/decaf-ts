# 07 — Cross-Cutting Platform Services Design

**Source specifications:** [DECAF-4](../specifications/DECAF_4.md), [DECAF-9](../specifications/DECAF_9.md), [DECAF-18](../specifications/DECAF_18.md), [DECAF-23](../specifications/DECAF_23.md), [DECAF-26](../specifications/DECAF_26.md), [DECAF-30](../specifications/DECAF_30.md), [DECAF-38](../specifications/DECAF_38.md), [DECAF-39](../specifications/DECAF_39.md).

## 1. Overview

The cross-cutting backbone: decorator composition (DECAF-4), scoped logging (DECAF-9) and context transition (DECAF-18), throttling (DECAF-23), provider-agnostic infrastructure services (DECAF-26/30), dynamic loading (DECAF-38), and feature gating (DECAF-39). The `logCtx → context → flags` chain is the contract every other subsystem relies on.

## 2. Goals

- G1 — Builder/decoration parity: anything expressible with decorators is expressible via runtime builders.
- G2 — Composable, declarative log-line assembly with pluggable tokens.
- G3 — Formalized context-transition semantics for predictable contextual calls.
- G4 — Clean, enum-driven `@throttle` with composable splitters.
- G5 — One provider-agnostic lifecycle for all infrastructure services (secrets, blobs, …).
- G6 — Dynamic object loading preserving decorator metadata with post-load hooks.
- G7 — Persisted, environment-driven, reader-pluggable feature flags with feature-aware decorators.

## 3. Requirements

- **Req-1 (DECAF-4):** Each module ships `overrides/ModelBuilderExtensions.ts` (via `declare module`) exposing fluent methods wrapping its decorators; `ModelBuilder`/`AttributeBuilder` store `_classDecorators`, apply via `decorateClass()` before `description()`; metadata identical to decorator syntax; auto-loaded on module import.
- **Req-2 (DECAF-9):** `LogParameterDescriptor` (`key`, `render(payload)`, `style(rendered)`, optional `actions`/`shouldInclude`); `LogParameterRegistry` singleton (`register`/`get`/`getOrdered(pattern)`); `compileLogPattern(pattern)` (`[ ... ]` optional, `{key}` token, cached). `MiniLogger.createLog` iterates descriptors, render→style, joins with separator. `Logging.register(descriptor)` for new tokens.
- **Req-3 (DECAF-18):** `ContextualLoggedClass` owns `logCtx(args, op, true?)`/`.context()`/`.flags()`/`.for(...)`/`.override(...)`; `Context.toOverrides()`/`toConfig()`; transition forced when concrete context type, `flavour`, or `operation` differs; logger inherited across derived contexts.
- **Req-4 (DECAF-23):** `@throttle(count, options?)` / `@throttle(value, mode, options?)` / `@throttle(splitter, options?)`; `ThrottleMode` (`BY_COUNT`/`BY_SIZE`); `splitByCount<T>(count)` / `splitBySize<T>(maxBytes)`; `ThrottleOptions` (`delayMs?`, `argIndex?: number | number[]`, `breakOnSingleFailure?`); metadata under `PersistenceKeys.THROTTLE`.
- **Req-5 (DECAF-26/30):** Shared `ClientBasedService` lifecycle — no-arg constructor; `initialize(...args): Promise<{config, client}>` assigns `_config`/`_client`; `@final()` getters; operations accept trailing `...args: MaybeContextualArg<any>` and log via `logCtx(...).for(method)`; `*Provider` union; `*Error extends InternalError` with `*Code` enum; `protected parseError(error)`; subpath-only provider exports; root entrypoint free of provider loads; optional peer/optional deps; `memory` provider for tests + self-hosted default.
  - Secrets (DECAF-26): `store`/`retrieve`/`delete`/`exists`/`list`/`metadata` (optional `rotate`); `ModelSecretService` + `Secret` model + `ModelSecretCrypto` (encrypted-at-rest); all crypto in `@decaf-ts/crypto`; name validation centralized.
  - Blobs (DECAF-30): `put`/`get`/`has`/`stat`/`delete`/`copy`/`list`/`url`; `BlobKey` normalization (`cleanKey`, `physicalKey` with prefix); `LocalBlobStoreService` atomic write + path-traversal protection; `BlobStoreFactory.create(config)`.
- **Req-6 (DECAF-38):** `ObjectLoader` base + concrete loaders per family (models, adapters, repositories, services, controllers, environment, Angular components, graph nodes); resolves module source, selects named/default, preserves metadata, runs composable post-load hooks in deterministic order.
- **Req-7 (DECAF-39):** `FeatureFlag` model + feature-access assignment model; `FeatureFlagService.initialize(config)` accepts reader override (default `EnvironmeFlagReader`), resolves+caches registry → sync `isEnabled(feature)`; env `FEATURE_FLAG__FEATURE_NAME__*` normalizes to `featureFlag.featureName`; feature-aware model/endpoint/UI decorators.

## 4. Architecture & Design

See [Architecture Workbook §08](../architecture-workbook/08-platform-services.md). Key decisions:

- **`ClientBasedService` is the canonical lifecycle** — DECAF-30 corrects DECAF-26's `Service` vs `ClientBasedService` ambiguity (B20).
- **`logCtx` is the logging contract** — every integrations service operation logs through it; DECAF-18 formalizes it but is still Planned (B21).
- **Feature flags are persisted + environment-driven + reader-pluggable** — sync `isEnabled()` against a cached resolved registry.

### Provider service operation

```mermaid
sequenceDiagram
    participant Consumer
    participant Svc as ProviderService (ClientBasedService)
    participant Client as Native client
    Consumer->>Svc: new ProviderService() (no args)
    Consumer->>Svc: initialize(config, ...ctx)
    Svc->>Svc: logCtx(args, INITIALIZATION, true)
    Svc->>Client: create native client; _config/_client assigned
    Consumer->>Svc: store/put(name, value, opts, ...args)
    Svc->>Svc: logCtx(args, op, true).for(method); validate/serialize/encrypt
    Svc->>Client: provider CRUD
    alt error: Svc->>Svc: parseError -> *Error with *Code
    end
```

## 5. Public Interfaces (selected)

- `ModelBuilder#decorateClass(...)`; per-module fluent builders (`.table()`, `.encrypt()`, `.uimodel()`, …).
- `LogParameterRegistry.register/get/getOrdered`; `compileLogPattern(pattern)`; `Logging.register(descriptor)`.
- `ContextualLoggedClass.logCtx/context/flags/for/override`; `Context.toOverrides/toConfig`.
- `@throttle(...)`; `ThrottleMode`; `splitByCount<T>`/`splitBySize<T>`; `ThrottleOptions`.
- `SecretService.{store,retrieve,delete,exists,list,metadata}`; `BlobStoreService.{put,get,has,stat,delete,copy,list,url}`; `BlobStoreFactory.create(config)`.
- Subpaths: `@decaf-ts/integrations/secrets/{model,memory,aws,azure,gcp,vault,onepassword}`, `@decaf-ts/integrations/blob/{s3,azure,gcp,local,ipfs,memory}`, `@decaf-ts/integrations/loader`, `@decaf-ts/integrations/feature-flags`.
- `FeatureFlagService.initialize(config)` / `isEnabled(feature)`; `EnvironmeFlagReader`.

## 6. Open Questions / Risks

- DECAF-26 `SecretService` base-class ambiguity (`Service` vs `ClientBasedService`) — should extend `ClientBasedService` (B20).
- DECAF-18 still Planned; DECAF-26/30 already assume a stable `logCtx` contract (B21).
- DECAF-4 status inconsistency (UI/crypto/for-nest builder tasks Pending vs completion claims) (B22).
- DECAF-38 (loader): sync vs async hook contract; hooks replace vs mutate; environment-object loader targets.
- DECAF-39 (feature flags): scope (global vs tenant/namespace/env/user); annotate-only vs enforce-at-runtime; endpoint suppress-route vs register+deny; UI omit vs hidden-but-present; priority/conflict resolution.
- Crypto boundary: all primitives in `@decaf-ts/crypto`; avoid duplication drift into `integrations`.

Continue to [08 — Agent Orchestration Design](./08-agent-orchestration-design.md).
