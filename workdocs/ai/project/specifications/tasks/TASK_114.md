# TASK-114: for-nano migration integration tests with repository read + property add/delete

**ID:** TASK-114
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Completed — Live CouchDB migration suites are active and passing with required property-add/backfill coverage.

## 1. Description
Add migration integration coverage in `for-nano` where migrations read records via repository flow and add/delete properties introduced/removed from models, validating that migrated documents remain consistent and queryable after version upgrades. Tests must drive a live CouchDB/NanoAdapter instance paired with the RamAdapter-backed TaskEngine, avoid any dependency on `for-typeorm`, and ensure each migration introduces the required new property/column plus default-value backfill for existing documents.

## 2. Objectives
*   [x] Build Nano migration integration tests using property add/delete migration scenarios that run against live CouchDB/NanoAdapter instances, add the required property/column, and fill existing records with the default value.
*   [x] Validate semver-ordered execution and persisted version progression via the migration handlers.
*   [x] Ensure migration behavior remains compatible with `core` flavour-aware handler contract.
*   [x] Keep the suite limited to RamAdapter + NanoAdapter (no `for-typeorm` dependency) while proving migrations operate without mocking or in-memory adapters.

## 3. Implementation Plan
**Proposed Changes:**
*   Add integration fixtures/models in `for-nano` with versioned migrations that add/delete properties while bootstrapping a live CouchDB instance via `NanoAdapter` and the RamAdapter-backed TaskEngine.
*   Ensure migration logic reads records through repository APIs before applying add/delete transformations, and introduce the new required property/column while backfilling existing documents with its default value.
*   Execute migrations via adapter handlers aligned with `core` migration orchestration and `MigrationTaskBuilder` flow without falling back to mocking or Ram-only in-memory shortcuts.
*   Validate before/after persisted records and schema expectations against the live CouchDB datastore.
*   Keep the entire test harness limited to RamAdapter and NanoAdapter only; do not import `for-typeorm` artifacts for this coverage.

**Technical Details:**
*   Use realistic migration order chains (e.g., 1.0.0 -> 1.1.0 -> 2.0.0).
*   Ensure tests assert both data transformation and final version marker persistence through configurable version handlers.
*   Include dry-run path assertions by setting analog context through `repository.override(...)` and confirming no persistence writes occur.

## 4. Verification Plan
**Automated Tests:**
*   [x] Integration Test: `for-nano/tests/integration/migration.add-property.integration.test.ts`
*   [x] Integration Test: `for-nano/tests/integration/migration.semver-order.integration.test.ts`
*   [x] Integration Test: `for-nano/tests/integration/migration.task.multi-adapter.integration.test.ts`

**Manual Verification:**
*   Inspect migrated fixture records to confirm property additions/removals and unchanged legacy fields.
*   Connect to the CouchDB fixture after migrations to ensure every record now carries the new required property populated with the default value.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
*   [2026-04-25] - Added Nano integration coverage for property add/delete and semver ordering (including dry-run path); targeted build/tests passed.
*   [2026-04-25] - Added explicit legacy-vs-semver migration ordering coverage for `for-nano` (`migration.legacy-order.integration.test.ts`) to validate default and injected strategies.
*   [2026-04-25] - Added multi-adapter task migration integration coverage in `for-nano` with failure + retry flow and version-hop task chaining assertions.
*   [2026-04-25] - Reopened: existing migration integration tests include mocked/in-memory execution paths; refactor in progress to use live CouchDB migrations with required-property additions and backfill validation.
*   [2026-04-25] - Updated refactor scope: RamAdapter+NanoAdapter-only, required property/column addition plus default-value backfill, and no reference to `for-typeorm` before the live CouchDB migrations succeed.
*   [2026-04-25] - Milestone: replaced in-memory `for-nano` migration add-property and task multi-adapter tests with live CouchDB/Postgres-backed migration flows (required-property/column add + backfill + retry path).
*   [2026-05-04] - Validation rerun against live CouchDB passed (`npm run test:integration -- --runInBand --watchman=false` in `for-nano`), confirming migration add-property and task multi-adapter suites remain green.
