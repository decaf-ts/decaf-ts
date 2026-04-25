# TASK-113: Core PersistenceService migration orchestration with multi-adapter handlers

**ID:** TASK-113
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Pending

## 1. Description
Integrate hardened migration behavior into `PersistenceService` so migrations can run across multiple adapters in one flow, with each adapter using its own migration handler and version persistence path. Add `MigrationTaskBuilder` support so migration steps are generated and submitted as composite tasks using extracted/adapted precedence logic from `MigrationService`.

## 2. Objectives
*   [ ] Enable multi-adapter migration orchestration through `PersistenceService`.
*   [ ] Validate independent handler execution and version retrieval per adapter/flavour.
*   [ ] Ensure task-based migration execution remains correct in multi-adapter scenarios.
*   [ ] Provide `MigrationService` API to create migration tasks (via `MigrationTaskBuilder`) before submission.
*   [ ] Persist current version via `setCurrentVersion` when migration task resolution completes.
*   [ ] Implement `MigrationTaskBuilder.addMigrationStep(...)` wrapper API and ensure `build()` returns `CompositeTask`.
*   [ ] Ensure each migration task targets one version; flavours may vary across steps.

## 3. Implementation Plan
**Proposed Changes:**
*   Update `PersistenceService` migration orchestration APIs to coordinate adapter-specific handlers.
*   Wire per-adapter `retrieveLastVersion`/`setCurrentVersion` execution and flavour-aware migration selection.
*   Introduce `MigrationTaskBuilder` wrapping `CompositeTaskBuilder` and append one step per relevant migration to target version.
*   Extract/adapt existing `MigrationService` precedence logic to build the migration task graph before submission.
*   Add support for running migration batches that target distinct adapters in the same service boot/runtime sequence.
*   Add a final post-migration task step to call `setCurrentVersion` once full target-version migration task succeeds.

**Technical Details:**
*   Keep adapter boundaries explicit to prevent cross-adapter version contamination.
*   Ensure failure behavior is deterministic and surfaced with adapter/flavour context.
*   Rollback is local to failed migration implementation; task retries reuse existing task retry behavior.
*   Stop on first failure in multi-adapter execution.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration Test: `core/tests/integration/persistence.migration.multi-adapter.test.ts`
*   [ ] Unit Test: `core/tests/unit/persistence.migration.handler-routing.test.ts`
*   [ ] Unit Test: `core/tests/unit/migration-task-builder.test.ts`
*   [ ] Integration Test: `core/tests/integration/migration.task.set-version-on-finish.test.ts`

**Manual Verification:**
*   Run a multi-adapter migration fixture and confirm execution stops at first failure.
*   Confirm `setCurrentVersion` runs once, after full target-version completion.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
