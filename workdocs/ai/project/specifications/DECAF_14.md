# DECAF-14: Cross-Adapter Migration Engine Hardening

**Status:** Planned
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
Harden and standardize Decaf migrations so they can be executed deterministically across adapters and runtimes. This specification upgrades migration behavior in `core`, `for-nano`, `for-typeorm`, `for-fabric`, and `for-nest`, with emphasis on robust ordering, adapter-aware execution, and production-like verification flows. Existing migration internals are preserved where already present (`MigrationService` sorting/orchestration path and migration task handler for flavoured adapters) and extended with explicit task-builder orchestration.

## 2. Goals
*   [ ] Harden `core` migration internals, including `@migration` metadata, task-based migration paths, and deterministic sorting.
*   [ ] Add async `retrieveLastVersion` and `setCurrentVersion` handler contracts so migration execution can discover and persist runtime version independently from code/package version.
*   [ ] Support adapter/flavour-aware migration targeting so multiple adapters can coexist with independent migration handlers.
*   [ ] Add `dry-run` execution support by setting analog mode in adapter context through `repository.override(...)` and ensuring adapters do not persist when analog mode is enabled.
*   [ ] Validate end-to-end behavior with `PersistenceService` and multi-adapter migration scenarios.
*   [ ] Extend migration verification to `for-nano`, `for-typeorm`, `for-fabric`, and `for-nest`, including a Nest CLI migration path that boots without exposing routes.

## 3. User Stories / Requirements
*   **US-1:** As a developer, I want migration execution order to be deterministic by semantic version so runtime upgrades are predictable and safe.
*   **US-2:** As a developer, I want the framework to query the persisted system version asynchronously so migration decisions are adapter-agnostic.
*   **US-3:** As a developer, I want migrations to target specific adapter flavours in mixed-adapter deployments.
*   **US-4:** As an operator, I want to run migrations from Nest in a headless boot mode (without serving routes), similar to existing boot-time utility flows.
*   **Req-1:** `@migration` must expose enough metadata to support semver-aware sorting and optional flavour targeting.
*   **Req-2:** Semver comparison must use the standard npm semver implementation and preserve deterministic ordering.
*   **Req-3:** Existing `MigrationService` sorting/orchestration (non-task mode) must be kept and adapted, not replaced.
*   **Req-4:** Existing migration task handler that loads and runs flavoured adapter migrations must be preserved and integrated.
*   **Req-5:** Introduce `MigrationTaskBuilder` (wrapping `CompositeTaskBuilder`) to generate migration task steps for all migrations relevant to the target version.
*   **Req-6:** `MigrationService` must expose API to create migration task(s) by extracting/adapting current precedence logic before task submission.
*   **Req-6a:** `MigrationTaskBuilder` must expose `addMigrationStep(...)` as a migration-specific wrapper over `addStep(...)`.
*   **Req-6b:** `MigrationTaskBuilder.build()` must return a `CompositeTask` instance (same contract as `CompositeTaskBuilder`).
*   **Req-6c:** Each migration task targets a single target version; flavour may vary within steps and multiple steps per flavour are allowed.
*   **Req-7:** Migration version persistence must be adapter-agnostic through configurable handlers on `MigrationService` (`retrieveLastVersion`, `setCurrentVersion`) and must be easy to mock in tests.
*   **Req-8:** `setCurrentVersion` must run after migration task completion.
*   **Req-8a:** Current version is global state and persisted/retrieved only via handlers.
*   **Req-9:** For flavour-based sorting conflicts that cannot be resolved by current precedence logic, throw an explicit error (task mode remains unaffected by step ordering boundaries).
*   **Req-9a:** In multi-adapter task mode, generic migrations do not run; migrations must be flavour-scoped (except TaskService generic orchestration behavior).
*   **Req-10:** Rollback scope is only the failed migration, handled by migration logic; task retries are delegated to existing task retry semantics.
*   **Req-10a:** Multi-adapter execution must stop on first failure.
*   **Req-11:** `PersistenceService` must support executing migrations across multiple adapters where each adapter has its own migration handler configuration.
*   **Req-12:** `for-nano` must include integration coverage where migrations read records via repository flow and add/delete properties introduced/removed from models.
*   **Req-13:** `for-typeorm` migration tests must run in migration mode (`synchronize` configured to migration behavior, not `true`) aligned to production flows.
*   **Req-13a:** Reuse the existing `for-typeorm` Migration abstraction that wraps/inspires TypeORM migration primitives.
*   **Req-13b:** `for-typeorm` migrations must cover both record-level property add/delete migration logic and table schema changes.
*   **Req-14:** `for-fabric` must provide paired `@migration` definitions per version.
*   **Req-14a:** One path uses `FabricContractAdapter`, and `CrudContract` must expose `migrate` API to trigger migration.
*   **Req-14b:** A second path (task-driven) uses only `FabricClientAdapter` and may only invoke contract `migrate`.
*   **Req-14c:** Each Fabric migration pair must share the same flavour and same version.
*   **Req-14d:** In Fabric unit tests, migrations must revolve around reading records through `FabricContractRepository` and adding/deleting properties introduced/removed from models.
*   **Req-15:** `for-nest` must include a multi-adapter migration test (Nano + TypeORM) and a CLI command (`npx decaf migrate ...`) that boots server headlessly, runs migrations, and exits without exposing HTTP routes.
*   **Req-16:** `for-nest` migration trigger must avoid Nest lifecycle hooks and instead use an explicit init-callable function after services boot and before endpoint exposure.
*   **Req-17:** CLI flags (including `--to`, `--flavour`, `--adapter`, `--task-mode`, `--dry-run`) must take precedence over `package.json` defaults.
*   **Req-18:** `--dry-run` must set analog flag in adapter context via `repository.override(...)`; adapters must respect analog mode and skip persistence (refactor adapters where needed).

## 4. Architecture & Design
Primary modules:
*   `core`: migration metadata contract, existing `MigrationService` precedence/sort orchestration, `MigrationTaskBuilder` + task-based migration orchestration, configurable persistence-version handlers, `PersistenceService` multi-adapter execution.
*   `for-nano`: adapter migration verification with repository-read migration scenarios that add/delete model properties.
*   `for-typeorm`: adapter migration verification under migration mode configuration, reusing existing Migration abstraction for both data/property and table schema migrations.
*   `for-fabric`: paired migration-path unit validation (`FabricContractAdapter` and `FabricClientAdapter` task path) with shared flavour/version pairing.
*   `for-nest`: explicit init-callable migration function (no lifecycle hook), multi-adapter orchestration, CLI integration via `@decaf-ts/cli` and `for-nest/src/cli-module.ts`.

Design constraints:
*   Semver ordering must use npm standard semver implementation and be covered by targeted edge-case tests.
*   Generic migrations and flavour-scoped migrations both run in non-task orchestration; in multi-adapter task mode, only flavour-scoped migrations execute.
*   Conflicting flavour precedence that cannot be deterministically sorted must fail fast with a clear error.
*   Failed migration rollback is local to failed migration, with retries delegated to task engine behavior.
*   Multi-adapter migration orchestration stops on first failure.
*   `dry-run` must propagate analog context through `repository.override(...)` and prevent adapter persistence.
*   Headless Nest migration CLI flow must reuse existing server bootstrap patterns and avoid route exposure.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID           | Task Name                            | Priority | Status  | Dependencies |
|:-------------|:-------------------------------------|:---------|:--------|:-------------|
| TASK-112 | [Core migration contract hardening (`@migration`, semver sort, `retrieveLastVersion`, flavour metadata)](./tasks/TASK_112.md) | High     | Pending | -            |
| TASK-113 | [Core PersistenceService migration orchestration with multi-adapter handlers](./tasks/TASK_113.md) | High     | Pending | TASK-112 |
| TASK-114 | [for-nano migration integration tests with model property additions](./tasks/TASK_114.md) | High     | Pending | TASK-113 |
| TASK-115 | [for-typeorm migration integration tests in production-like migration mode](./tasks/TASK_115.md) | High     | Pending | TASK-113 |
| TASK-116 | [for-fabric unit migration coverage hardening](./tasks/TASK_116.md) | Medium   | Pending | TASK-113 |
| TASK-117 | [for-nest multi-adapter (Nano + TypeORM) migration integration boot](./tasks/TASK_117.md) | High     | Pending | TASK-114,TASK-115 |
| TASK-118 | [for-nest CLI migration command (headless boot, no route exposure)](./tasks/TASK_118.md) | High     | Pending | TASK-117 |

## 6. Open Questions / Risks
*   Production-like TypeORM migration testing may require tighter fixture lifecycle controls to avoid cross-test contamination.
*   Headless Nest migration boot must enforce safeguards to prevent accidental listener startup in test/dev modes.

## 7. Results & Artifacts
*   Updated migration contracts and execution flow in `core`.
*   New/updated unit and integration tests in `core`, `for-nano`, `for-typeorm`, `for-fabric`, and `for-nest`.
*   New Nest CLI migration command and related tests/documentation.
*   Plan/spec/task updates reflecting final status and verification outcomes.
