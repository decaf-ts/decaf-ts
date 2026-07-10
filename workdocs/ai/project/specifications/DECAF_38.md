# DECAF-38 — Integrations Object Loader Framework

**Status:** Completed
**Priority:** High
**Owner:** AI Agent

## 1. Overview

Add a reusable object-loading layer to `@decaf-ts/integrations` that can dynamically resolve TypeScript exports and apply configurable post-load hooks. The primary entrypoint should expose a named `ObjectLoader` class, with specialized concrete loaders for the main Decaf object families: models, adapters, repositories, services, controllers, environment objects, Angular components, and graph nodes.

The goal is to make object discovery and post-processing consistent across integration modules instead of scattering ad-hoc `import()` logic, manual registration, and local normalization steps throughout the codebase. The loader abstraction must preserve class metadata and remain flexible enough to support both backend-oriented and frontend-oriented object types.

This spec covers the loader API, its hook pipeline, the package export surface, and the concrete loader variants required by the current Decaf modules.

## 2. Goals

*   [x] Define a single `ObjectLoader` base contract for dynamic TS object loading.
*   [x] Support configurable post-load hooks that run after each object is resolved.
*   [x] Provide concrete loaders for models, adapters, repositories, services, controllers, environment objects, Angular components, and graph nodes.
*   [x] Preserve metadata and type identity when loaded objects are decorated Decaf classes.
*   [x] Expose the loader surface from `@decaf-ts/integrations` in a way that is convenient for module consumers.
*   [x] Keep the loader mechanism generic enough to support both `for-nest` and `for-angular` use cases.

## 3. User Stories / Requirements

*   **US-1:** As a module author, I want to load a TypeScript object dynamically and run a post-load hook so I can normalize or register it without duplicating boilerplate.
*   **US-2:** As a maintainer, I want one loader abstraction for the common Decaf object families so that each module follows the same loading pattern.
*   **US-3:** As a frontend or backend consumer, I want graph nodes, Angular components, and NestJS controllers to participate in the same loading contract so their registration behavior stays predictable.
*   **Req-1:** `ObjectLoader` must load named or default TS exports without stripping metadata from decorated classes.
*   **Req-2:** Post-load hooks must be configurable and composable, and they must run after resolution in a deterministic order.
*   **Req-3:** Concrete loaders must exist for models, adapters, repositories, services, controllers, environment objects, Angular components, and graph nodes.
*   **Req-4:** The graph-node loader surface must cover both `ui-decorators/graph` and `integrations/graph` consumers.
*   **Req-5:** The loader API must remain framework-agnostic at the base layer so module-specific loaders can extend it without coupling to NestJS or Angular runtime details.

## 4. Architecture & Design

The proposed implementation should live under a dedicated loader subtree in `integrations`, with a package-level named export that surfaces the base loader and its concrete variants.

### 4.1 Base loader contract

`ObjectLoader` should define the common dynamic-loading workflow:

1. Resolve a module source, either from a package subpath or a file path.
2. Select the target export, defaulting to the module default export when no explicit name is provided.
3. Return the loaded TS object with its metadata intact.
4. Execute any configured post-load hooks in order.
5. Return the final object to the caller.

The hook pipeline should be reusable for all loader variants and should allow a hook to inspect both the loaded object and the loader context before deciding whether to transform it or leave it unchanged.

### 4.2 Concrete loaders

The base loader should be specialized into a small set of object-family loaders:

| Loader | Responsibility |
|:---|:---|
| `ModelObjectLoader` | Load decorated Decaf model classes and apply model-specific registration or normalization hooks. |
| `AdapterObjectLoader` | Load adapter classes and attach adapter-specific metadata or lifecycle hooks. |
| `RepositoryObjectLoader` | Load repository classes and support repository registration conventions. |
| `ServiceObjectLoader` | Load service classes and support service registration or dependency wiring. |
| `ControllerObjectLoader` | Load controller classes, including NestJS-facing controllers under `for-nest`. |
| `EnvironmentObjectLoader` | Load environment/configuration objects and apply environment-specific post-processing. |
| `AngularComponentObjectLoader` | Load Angular component classes and preserve Angular metadata for the frontend pipeline. |
| `GraphNodeObjectLoader` | Load graph node classes from `ui-decorators/graph` and `integrations/graph`. |

These loaders should reuse the base hook pipeline rather than reimplementing load semantics independently.

### 4.3 Graph and UI surface

The graph-related loaders need special attention because the project already has a split between shared graph metadata and execution-engine code. The loader spec should support both of these paths:

*   `ui-decorators/graph` for metadata-only graph node declarations.
*   `integrations/graph` for runtime graph objects and integration-facing graph helpers.

That means graph loading must preserve node metadata, port declarations, and any downstream registration side effects without requiring consumers to know which graph package owns the class source.

### 4.4 Package export surface

The package should expose the loader contract from `@decaf-ts/integrations` as a named export, and it should also make the concrete loaders available from a dedicated loader surface if the implementation needs a subpath for tree shaking or discovery.

The exact export shape is intentionally left flexible here, but the final API must:

*   make the base `ObjectLoader` easy to import,
*   keep the concrete loaders discoverable,
*   and avoid forcing consumers to reach into internal module paths.

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| DECAF-38-1 | Define the base `ObjectLoader` contract and post-load hook pipeline | High | Completed | - |
| DECAF-38-2 | Implement loaders for models, adapters, repositories, services, and controllers | High | Completed | DECAF-38-1 |
| DECAF-38-3 | Implement loaders for environment objects, Angular components, and graph nodes | High | Completed | DECAF-38-1 |
| DECAF-38-4 | Wire package exports, documentation, and verification coverage for the loader surface | Medium | Completed | DECAF-38-2, DECAF-38-3 |

## 6. Open Questions / Risks

*   Should post-load hooks be allowed to replace the loaded export entirely, or should they only mutate/augment it in place?
*   Should hook execution be synchronous only, or should the contract explicitly allow async hooks?
*   Does the environment-object loader target configuration classes, runtime env snapshots, or both?
*   Should the package expose one generic loader factory plus concrete subclasses, or only the concrete subclasses?
*   The graph-node surface spans both metadata-only and runtime graph packages, so the exact import boundary should be documented before implementation starts.

## 7. Results & Artifacts

*   A documented `ObjectLoader` contract for `@decaf-ts/integrations`.
*   A reusable post-load hook pipeline for dynamic TS object loading.
*   Concrete loader variants for the main Decaf object families.
*   Package-level export guidance for the new loader surface.
*   Clarified graph-node loading expectations across `ui-decorators/graph` and `integrations/graph`.
*   Implemented loader subtree under `integrations/src/loader/` and subpath export `@decaf-ts/integrations/loader`.
