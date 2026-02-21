# DECAF-4: Builder for Decorator Validation Models

**Status:** In Progress — module-specific builder overrides exist for many decorators, but outstanding module analyses/overrides remain pending.  
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
| TASK-10| Analyze 'db-decorators' Module for Builder Overrides | High | Pending | TASK-9 |
| TASK-11| Analyze 'transcational-decorators' Module for Builder Overrides | High | Completed | - |
| TASK-13| Analyze 'core' Module for Builder Overrides | High | Pending | TASK-11 |
| TASK-14| Analyze 'ui-decorators' Module for Builder Overrides | High | Pending | TASK-13 |
| TASK-15| Analyze 'crypto' Module for Builder Overrides | High | Pending | TASK-11 |
| TASK-16| Analyze 'cli' Module for Builder Overrides | High | Completed | - |
| TASK-18| Analyze 'for-couchdb' Module for Builder Overrides | High | Completed | - |
| TASK-19| Analyze 'for-nano' Module for Builder Overrides | High | Completed | - |
| TASK-20| Analyze 'for-pouch' Module for Builder Overrides | High | Completed | - |
| TASK-21| Analyze 'for-typeorm' Module for Builder Overrides | High | Completed | - |
| TASK-22| Analyze 'for-http' Module for Builder Overrides | High | Completed | - |
| TASK-23| Analyze 'for-nest' Module for Builder Overrides | High | Pending | TASK-21 |
| TASK-24| Analyze 'for-fabric' Module for Builder Overrides | High | Completed | - |

## 6. Open Questions / Risks
*   How will builder augmentation be bundled for modules consumed via ESM vs. CommonJS? Ensure both loader models execute the override.
*   Are there any decorators defined outside these modules (e.g., in `decorator-validation/src/validation/decorators.ts`) that still need builder coverage even though no additional override exists?
*   What is the order of applying overrides if multiple modules extend the same builder property simultaneously?

## 7. Results & Artifacts
*   Module-specific builder overrides under each module’s `src/overrides` folder (existing for completed analyses, pending for the modules still waiting on implementation).
*   Tests within each module verifying builder helpers emit the same metadata as the decorator syntax.
*   Updated documentation referencing builder coverage (see TASK-8) plus the new spec/plan entries.
***EOF
