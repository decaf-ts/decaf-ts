# TASK-117: for-nest multi-adapter (Nano + TypeORM) migration integration boot

**ID:** TASK-117
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** In Progress — Reopened; migration integration test files are not present under `for-nest/tests` in the current tree.

## 1. Description
Create `for-nest` integration coverage that boots Nest with one Nano adapter and one TypeORM adapter, then executes a migration flow that migrates both adapters in a single boot sequence. Trigger migrations through an explicit callable function after services are booted and before any endpoints are exposed, with no lifecycle hooks.

## 2. Objectives
*   [x] Boot Nest application in tests with Nano + TypeORM adapters configured simultaneously.
*   [x] Execute migration pipeline and confirm each adapter runs its own targeted migrations.
*   [x] Validate multi-adapter version retrieval and semver ordering through Nest orchestration layer.

## 3. Implementation Plan
**Proposed Changes:**
*   Add integration test module/bootstrap fixtures in `for-nest` for dual-adapter setup.
*   Expose a callable migration trigger function wired at init-time (post service creation, pre endpoint exposure), following core methodology.
*   Validate outcomes in both persistence backends after migration completes.

**Technical Details:**
*   Ensure adapter-specific flavour metadata routes migrations correctly.
*   Confirm migration orchestration errors are surfaced with adapter context.
*   Multi-adapter migration flow must stop on first failure.

## 4. Verification Plan
**Automated Tests:**
*   [x] Integration Test: `for-nest/tests/integration/migration.multi-adapter.integration.test.ts`

**Manual Verification:**
*   Confirm both Nano and TypeORM stores reflect migrated schema/data state after one orchestrated run.

## 5. Blockers & Clarifications
*   Current tree has no migration integration test files under `for-nest/tests` (`rg --files tests | rg migration` produced no matches on 2026-05-04), so required live Nest migration coverage is not currently enforceable.

## 6. Execution Log
*   [2026-04-25] - Task created.
-   [2026-04-25] - Added explicit callable `runMigrations(...)` path and multi-adapter Nest integration test; targeted tests passed.
-   [2026-04-25] - Added Nest migration versioning strategy integration test (`migration.versioning.strategy.integration.test.ts`) validating default legacy plus injectable semver strategy behavior.
-   [2026-04-25] - Verification milestone: `for-nest` build passed; full suite passed (`20 passed / 4 skipped`); migration-targeted suites passed (`2 suites / 3 tests`).
-   [2026-04-25] - Updated Nest migration orchestration to use `MigrationService` task tracking path (`DecafCoreModule.migrate` returns migration services for caller-managed tracking in task mode).
-   [2026-04-25] - Reworked `for-nest` multi-adapter integration test to run live Nano/Postgres migrations that add required schema changes and backfill defaults before proceeding with CLI coverage.
-   [2026-04-25] - Executed the updated multi-adapter migration test against live CouchDB/Postgres stacks; the schema-change/backfill flow completed and version markers now reflect `1.1.0-nest-live`.
-   [2026-05-04] - Revalidation found no migration integration test files in `for-nest/tests`, while full suite still passes; task reopened until live Nano+TypeORM migration coverage is restored and passing in the current repository state.
