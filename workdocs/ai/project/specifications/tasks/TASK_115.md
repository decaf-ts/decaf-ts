# TASK-115: for-typeorm migration integration tests (data + schema) in migration mode

**ID:** TASK-115
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Completed — Live Postgres + Nano migration integration suites now pass with required column/property changes and default-value backfills, unlocking `for-nest` verification.

## 1. Description
Implement `for-typeorm` migration integration coverage where migrations add/delete model properties and also change table schemas, running in a production-like configuration against a live Postgres database. Tests must pair the TypeORMAdapter-based migrations with NanoAdapter-driven ordering, enforce the addition of the required new column/property plus default-value backfill for existing rows, and avoid mocking/in-memory adapters before allowing `for-nest` coverage to resume.

## 2. Objectives
*   [x] Add TypeORM migration tests with model property add/delete scenarios that run against a live Postgres instance, add the required column/property, and backfill existing rows with the default value.
*   [x] Add TypeORM migration tests with table schema change scenarios that cover real SQL schema updates.
*   [x] Validate migration behavior with TypeORM configured in migration mode (`synchronize` not set to `true`) while pairing NanoAdapter ordering with TypeORMAdapter migrations.
*   [x] Confirm compatibility with semver sorting and adapter version retrieval contracts from `core`.
*   [x] Reuse existing `for-typeorm` Migration abstraction wrapper.
*   [x] Prove the suite relies on NanoAdapter + TypeORMAdapter without mocking or in-memory shortcuts before `for-nest` coverage can proceed.

## 3. Implementation Plan
**Proposed Changes:**
*   Create integration fixtures for TypeORM entities with staged migration versions covering both data/property and schema evolution, and bring up a live Postgres database for these runs.
*   Configure test adapters using DataSourceOptions migration mode semantics (`synchronize: "migration"` or equivalent migration-mode configuration) so the TypeORMAdapter performs real SQL migrations that add the required column/property and backfill existing rows with its default value.
*   Reuse/extend existing `for-typeorm` Migration abstraction rather than creating a parallel migration flow, but couple the TypeORMAdapter migrations with NanoAdapter ordering to match multi-adapter execution.
*   Assert schema/data state after migration runs, including persisted version marker updates, expected table-shape changes, and the presence of the new column/values.
*   Add dry-run assertions with analog context via `repository.override(...)` to confirm no persistence writes and avoid mocking or in-memory shortcuts entirely.

**Technical Details:**
*   Avoid relying on automatic synchronize-only paths for migration correctness.
*   Cover both clean boot and upgrade-from-existing-version flows.

## 4. Verification Plan
**Automated Tests:**
*   [x] Integration Test: `for-typeorm/tests/integration/migration.add-property.integration.test.ts`
*   [x] Integration Test: `for-typeorm/tests/integration/migration.production-mode.integration.test.ts`
*   [x] Integration Test: `for-typeorm/tests/integration/migration.task.multi-adapter.integration.test.ts`

**Manual Verification:**
*   Verify migrated records include/omit expected fields and database tables reflect expected schema changes.
*   Inspect the live Postgres instance after migration to confirm the new required column/property exists and every legacy row now carries the default value.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
*   [2026-04-25] - Added TypeORM migration-mode integration coverage (property and schema evolution); targeted build/tests passed.
*   [2026-04-25] - Added versioning-strategy coverage for `for-typeorm` (`migration.versioning.integration.test.ts`) asserting default legacy ordering plus injectable semver ordering.
*   [2026-04-25] - Added multi-adapter task migration integration coverage in `for-typeorm` with failed migration + retry cases and chained version-hop tasks.
*   [2026-04-25] - Reopened: existing migration integration tests include mocked/in-memory execution paths; refactor in progress to use live Postgres migrations with required-column additions and backfill validation.
*   [2026-04-25] - Updated refactor scope: enforce NanoAdapter+TypeORMAdapter multi-adapter coverage, add required column/default-value backfill, and ban mocking/in-memory shortcuts before `for-nest` migrations resume.
*   [2026-04-25] - Milestone: replaced in-memory `for-typeorm` migration add-property and task multi-adapter tests with live CouchDB/Postgres-backed migration flows (required-property/column add + backfill + retry path).
*   [2026-04-25] - Adjusted the migration add-property and task multi-adapter suites to combine live NanoAdapter ordering with TypeORMAdapter migrations so each live upgrade adds required schema columns/properties and backfills defaults before clearing for-nest coverage.
*   [2026-04-25] - Validation: `migration.add-property.integration.test.ts` and `migration.task.multi-adapter.integration.test.ts` now pass against live nano/postgres instances (required schemas/backfill verified).
