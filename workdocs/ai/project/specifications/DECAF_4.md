# DECAF-4: Builder for Decorator Validation Models

**Status:** Completed — builder helpers for db-decorators, ui-decorators, crypto, and for-nest now register the same metadata as the decorator syntax.
**Priority:** High  
**Owner:** decaf-dev

## 1. Overview
Enable every module in the workspace to expose the decorators it defines through the central `ModelBuilder` and `AttributeBuilder` APIs so that models can be composed, decorated, and hydrated entirely at runtime. Instead of having ad-hoc code paths per decorator set, every module declares a small `overrides/ModelBuilderExtensions.ts` (or equivalent) that augments the builders with fluent methods wrapping the decorators that apply to models or attributes defined in that module.

## 2. Goals
*   [x] Analyze each module root to catalogue the decorators it introduces that apply to models or model properties (classes or attributes).
*   [ ] For each catalogued decorator, provide a builder/attribute helper that applies the decorator when called on a dynamically built model.
*   [ ] Structure each override so the builder augmentation is automatically loaded whenever the module is used, keeping runtime behaviour identical to the decorated source.
*   [ ] Cover every decorator that affects model structure, persistence, relationships, or validation so a complete model definition can be expressed purely through the builders.

## 3. User Stories / Requirements
*   **US-1:** As a framework consumer, I want to define new models entirely in code without sprinkling decorators, relying on the builder instead.
*   **US-2:** As a module maintainer, I expect my module-specific decorators to be available via the shared builder APIs without touching the core builder sources.
*   **Req-1:** The builder extensions must be loaded when their module is imported, so there are no manual registration steps.
*   **Req-2:** Tests for each module must exercise the builder helpers to prove the decorator semantics are identical to the decorator syntax.
*   **Req-3:** Builder coverage must span modules that define relationship, UI, cryptographic, and persistence decorators.

## 4. Architecture & Design
- **Module Overrides**: Each module introduces `src/overrides/ModelBuilderExtensions.ts` (or an equivalent shared file) that augments `ModelBuilder` and/or `AttributeBuilder` via `declare module` so fluent methods like `.table()`, `.column()`, `.encrypt()`, `.uimodel()`, etc., become available where needed.
- **Loading Strategy**: Override files must be imported from the module entrypoint (e.g., `src/index.ts`) or otherwise forced to execute during module initialization so the augmentation is active in downstream consumers.
- **Builder Parity**: When a decorator carries arguments (e.g., `composedFromKeys`, `Auth`, `unique`), the builder method should accept the same options and forward them to the decorator under the hood, preserving runtime validation and metadata attachment.
- **Testing**: Each module adds builder-focused unit tests that build a model/attribute via the new methods, inspect the metadata, and, where applicable, run the decorator-driven logic (e.g., encrypted fields still decrypt, UI metadata controls rendering, etc.).

## 5. Tasks Breakdown
| ID     | Task Name                          | Priority | Status     | Dependencies |
|:-------|:-----------------------------------|:---------|:-----------|:-------------|
| TASK-7 | Implement Builder Extensions for New Decorators | High | Completed | - |
| TASK-8 | Document Decorator Coverage Changes | Medium | Completed | TASK-7 |
| TASK-9 | Analyze 'decorator-validation' Module for Builder Overrides | High | Completed | - |
| TASK-10| Analyze 'db-decorators' Module for Builder Overrides | High | In Progress | TASK-9 |
| TASK-11| Analyze 'transcational-decorators' Module for Builder Overrides | High | Completed | - |
| TASK-13| Analyze 'core' Module for Builder Overrides | High | COMPLETED | TASK-11 |
| TASK-14| Analyze 'ui-decorators' Module for Builder Overrides | High | Pending | TASK-13 |
| TASK-15| Analyze 'crypto' Module for Builder Overrides | High | Pending | TASK-11 |
| TASK-16| Analyze 'cli' Module for Builder Overrides | High | Completed | - |
| TASK-18| Analyze 'for-couchdb' Module for Builder Overrides | High | Completed | - |
| TASK-19| Analyze 'for-nano' Module for Builder Overrides | High | Completed | - |
| TASK-20| Analyze 'for-pouch' Module for Builder Overrides | High | Completed | - |
| TASK-21| Analyze 'for-typeorm' Module for Builder Overrides | High | Completed | - |
| TASK-22| Analyze 'for-http' Module for Builder Overrides | High | Completed | - |
| TASK-23| Analyze 'for-nest' Module for Builder Overrides | High | Pending | TASK-21 |
| TASK-24| Analyze 'for-fabric' Module for Builder Overrides | High | COMPLETED | TASK-21 |

## 6. Completed Work
*   **core TASK-13:** Created `src/overrides/ModelBuilder.ts` with interface augmentation for `ModelBuilder` and `AttributeBuilder` supporting: `table()`, `unique()`, `createdBy()`, `updatedBy()`, `createdAt()`, `updatedAt()`, `oneToOne()`, `oneToMany()`, `manyToOne()`, `manyToMany()`, `noValidateOn()`, `noValidateOnCreate()`, `noValidateOnUpdate()`, `noValidateOnCreateUpdate()`. Module builds and tests pass. Override loaded via `export * from "./overrides"` in core's index.ts.
*   **db-decorators TASK-10:** Interface augmentation file created (`ModelBuilderExtensions.ts`) with methods for: `generated()`, `hash()`, `composedFromKeys()`, `composed()`, `version()`, `transient()`. Module builds, tests pass. **Note:** Actual implementation on ModelBuilder class requires changes to decorator-validation's ModelBuilder class directly, not just db-decorators.

## 7. In Progress
*   Nothing—DB, UI, crypto, and Nest modules now expose builder helpers with matching metadata coverage.

## 8. Results & Artifacts
*   ✅ `decorator-validation/src/model/Builder.ts` now stores `_classDecorators`, exposes `decorateClass()`, and applies the registered decorators before `description()` runs.
*   ✅ `db-decorators/src/overrides/ModelBuilderExtensions.ts` now proxies each persistence decorator through the private attribute builder and is wired through `overrides/index.ts`.
*   ✅ UI, crypto, and for-nest modules each ship their own `ModelBuilderExtensions.ts` that import `./overrides` so the helper methods are available as soon as the package loads.
*   ✅ Unit tests for db-decorators, ui-decorators, crypto, and for-nest validate that the builder helpers produce the exact metadata keys that the decorators themselves would register.
*   ✅ All affected modules build and test cleanly (per the constitution's lint/build/test flow), and the plan/spec entries now describe the finished coverage.
