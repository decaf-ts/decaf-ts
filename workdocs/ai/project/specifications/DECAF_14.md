# DECAF-14: Cross-Adapter Migration Engine Hardening

**Status:** In Progress
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
Harden and standardize Decaf migrations so they can be executed deterministically across adapters and runtimes. This specification upgrades migration behavior in `core`, `for-nano`, `for-typeorm`, `for-fabric`, and `for-nest`, with emphasis on robust ordering, adapter-aware execution, and production-like verification flows. Existing migration internals are preserved where already present (`MigrationService` sorting/orchestration path and migration task handler for flavoured adapters) and extended with explicit task-builder orchestration.

## 2. Goals
*   [x] Harden `core` migration internals, including `@migration` metadata, task-based migration paths, and deterministic sorting.
*   [x] Add async `retrieveLastVersion` and `setCurrentVersion` handler contracts so migration execution can discover and persist runtime version independently from code/package version.
*   [x] Support adapter/flavour-aware migration targeting so multiple adapters can coexist with independent migration handlers.
*   [x] Preserve `--dry-run` CLI/config flag compatibility (shape and precedence) without enabling runtime persistence bypass behavior.
*   [x] Validate end-to-end behavior with `PersistenceService` and multi-adapter migration scenarios.
*   [x] Extend migration verification to `for-nano`, `for-typeorm`, `for-fabric`, and `for-nest`, including a Nest CLI migration path that boots without exposing routes.
*   [x] Rework the `core`, `for-nano`, and `for-typeorm` migration integration suites so they execute against live CouchDB/Postgres instances without mocking or in-memory adapters, always applying schema changes (adding a required column/property and backfilling existing records with the default value).
    `for-nano` coverage must remain confined to RamAdapter/NanoAdapter (no dependency on `for-typeorm`), `for-typeorm` flows must exercise both NanoAdapter and TypeORMAdapter, and `for-nest` migration verification is now free to leverage the validated live adapters once it resumes.

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
*   **Req-18:** `--dry-run` remains a compatibility flag in CLI/config parsing and precedence resolution only; migration execution path does not alter persistence behavior based on this flag.

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
*   `dry-run` remains a compatibility-only flag and does not alter runtime adapter persistence behavior.
*   Headless Nest migration CLI flow must reuse existing server bootstrap patterns and avoid route exposure.
*   Migration integration tests for `core`, `for-nano`, and `for-typeorm` must run against live CouchDB/Postgres adapters (no mocking or in-memory shortcuts) while introducing schema changes that add required columns/properties and backfill existing records with default values. `for-nano` coverage must only rely on RamAdapter + NanoAdapter (no `for-typeorm` dependency), `for-typeorm` suites must combine NanoAdapter with TypeORMAdapter for multi-adapter ordering, and `for-nest` verification will depend on these flows before invoking Ram for TaskEngine plus Nano/TypeORM for migrations.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID           | Task Name                            | Priority | Status  | Dependencies |
|:-------------|:-------------------------------------|:---------|:--------|:-------------|
| TASK-112 | [Core migration contract hardening (`@migration`, semver sort, `retrieveLastVersion`, flavour metadata)](./tasks/TASK_112.md) | High     | Completed | -            |
| TASK-113 | [Core PersistenceService migration orchestration with multi-adapter handlers](./tasks/TASK_113.md) | High     | Completed | TASK-112 |
| TASK-114 | [for-nano migration integration tests with model property additions](./tasks/TASK_114.md) | High     | Completed | TASK-113 |
| TASK-115 | [for-typeorm migration integration tests in production-like migration mode](./tasks/TASK_115.md) | High     | Completed | TASK-113 |
| TASK-116 | [for-fabric unit migration coverage hardening](./tasks/TASK_116.md) | Medium   | Completed | TASK-113 |
| TASK-117 | [for-nest multi-adapter (Nano + TypeORM) migration integration boot](./tasks/TASK_117.md) | High     | Completed | TASK-114,TASK-115 |
| TASK-118 | [for-nest CLI migration command (headless boot, no route exposure)](./tasks/TASK_118.md) | High     | Completed | TASK-117 |

## 6. Open Questions / Risks
*   `for-fabric` full-suite integration tests currently expose unrelated infrastructure/auth/gateway issues; DECAF-14 verification is targeted to migration-focused suites.
*   `for-nest` build command currently depends on `for-fabric` bin symlink availability in local node_modules; CLI migration verification was completed via targeted test suites.
*   Coordinating live CouchDB/Postgres migrations (with schema changes/backfill) without mocking or in-memory adapters while keeping `for-nano` isolated from `for-typeorm` may require dedicated integration fixtures and careful adapter bootstrapping.

## 7. Results & Artifacts
*   Updated migration contracts and execution flow in `core`.
*   New/updated unit and integration tests in `core`, `for-nano`, `for-typeorm`, `for-fabric`, and `for-nest`.
*   New Nest CLI migration command and related tests/documentation.
*   Plan/spec/task updates reflecting final status and verification outcomes.

## 8. Completion Notes
*   Core migration hardening, handler contracts, semver ordering, flavour conflict detection, and migration task builder are implemented.
*   `@migration` decorator parsing in `core` is strategy-agnostic; semver-specific interpretation is isolated to `SemverMigrationVersioning`.
*   `SemverMigrationVersioning` is no longer re-exported via migration index barrels and is not imported by runtime migration flows; it is exposed as an explicit direct subpath export for opt-in consumers.
*   Multi-adapter migration orchestration now lives in `MigrationService` (`migrateAdapters`, `migrateNormally`, `migrateViaTasks`); `PersistenceService` no longer contains migration logic or `MigrationService` coupling.
*   `MigrationService` multi-adapter migration orchestration is implemented and verified; dry-run runtime behavior was removed while preserving flag compatibility.
*   `MigrationService` task mode now enqueues per-version migration tasks (version-hop chaining via task dependencies), exposes explicit `track(...)` and `retry(...)`, and leaves waiting behavior to callers.
*   Adapter-focused test coverage landed for `for-nano`, `for-typeorm`, and `for-fabric` migration scenarios.
*   `for-nest` now exposes explicit callable migration execution and a headless CLI `migrate` command with CLI-over-package precedence and task-mode support.
*   `for-nest` CLI task-mode migration path now waits through explicit `MigrationService.track(...)` calls after task enqueue.
*   `for-nest` CLI task-mode migration now also attaches the active CLI logger to queued migration task trackers before waiting, so migration task progress/status logs are emitted through the command logger.
*   Migration strategy coverage now explicitly validates both default legacy ordering and injectable semver ordering in `core`, `for-nano`, `for-typeorm`, `for-fabric`, and `for-nest`.
*   Verification milestone (2026-04-25): builds passed for `core`, `for-nano`, `for-typeorm`, `for-fabric`, and `for-nest`; migration suites passed in `core`, `for-nano`, `for-typeorm`, and `for-nest`; `for-fabric` full unit suite passed (`npm run test:unit -- --runInBand`).
*   Reopened milestone (2026-04-25): `TASK-114` and `TASK-115` were reopened to replace mocked/in-memory migration integration tests with live CouchDB/Postgres migration flows that include required property/column addition plus default-value backfill.
    This restart enforces RamAdapter+NanoAdapter-only coverage for `for-nano`, couples NanoAdapter with TypeORMAdapter for `for-typeorm`, and clears the way for `for-nest` migration work now that the live suites are green.
*   Validation milestone (2026-05-04): module readiness rerun in requested order (`core => for-nano => for-typeorm => for-fabric => for-nest`) confirms `core` full tests pass, `for-nano` live integration passes, `for-typeorm` live integration passes, and `for-fabric` unit suite passes.
*   Validation finding (2026-05-04): `for-nest` currently contains no migration integration test files under `tests/` (`rg --files tests | rg migration` returns no matches), so task-level migration coverage for Nest is not presently enforceable despite the full Nest suite passing.
