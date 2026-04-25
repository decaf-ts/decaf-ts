# TASK-115: for-typeorm migration integration tests (data + schema) in migration mode

**ID:** TASK-115
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Pending

## 1. Description
Implement `for-typeorm` migration integration coverage where migrations add/delete model properties and also change table schemas, running in a production-like configuration that relies on migration execution flow rather than schema auto-synchronization shortcuts.

## 2. Objectives
*   [ ] Add TypeORM migration tests with model property add/delete scenarios.
*   [ ] Add TypeORM migration tests with table schema change scenarios.
*   [ ] Validate migration behavior with TypeORM configured in migration mode (`synchronize` not set to `true`).
*   [ ] Confirm compatibility with semver sorting and adapter version retrieval contracts from `core`.
*   [ ] Reuse existing `for-typeorm` Migration abstraction wrapper.

## 3. Implementation Plan
**Proposed Changes:**
*   Create integration fixtures for TypeORM entities with staged migration versions covering both data/property and schema evolution.
*   Configure test adapters using DataSourceOptions migration mode semantics (`synchronize: "migration"` or equivalent migration-mode configuration).
*   Reuse/extend existing `for-typeorm` Migration abstraction rather than creating a parallel migration flow.
*   Assert schema/data state after migration runs, including persisted version marker updates and expected table-shape changes.
*   Add dry-run assertions with analog context via `repository.override(...)` to confirm no persistence writes.

**Technical Details:**
*   Avoid relying on automatic synchronize-only paths for migration correctness.
*   Cover both clean boot and upgrade-from-existing-version flows.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration Test: `for-typeorm/tests/integration/migration.add-property.integration.test.ts`
*   [ ] Integration Test: `for-typeorm/tests/integration/migration.production-mode.integration.test.ts`

**Manual Verification:**
*   Verify migrated records include/omit expected fields and database tables reflect expected schema changes.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
