# TASK-114: for-nano migration integration tests with repository read + property add/delete

**ID:** TASK-114
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add migration integration coverage in `for-nano` where migrations read records via repository flow and add/delete properties introduced/removed from models, validating that migrated documents remain consistent and queryable after version upgrades.

## 2. Objectives
*   [ ] Build Nano migration integration tests using property add/delete migration scenarios.
*   [ ] Validate semver-ordered execution and persisted version progression.
*   [ ] Ensure migration behavior remains compatible with `core` flavour-aware handler contract.

## 3. Implementation Plan
**Proposed Changes:**
*   Add integration fixtures/models in `for-nano` with versioned migrations that add/delete properties.
*   Ensure migration logic reads records through repository APIs before applying add/delete transformations.
*   Execute migrations via adapter handlers aligned with `core` migration orchestration and `MigrationTaskBuilder` flow.
*   Validate before/after persisted records and schema expectations.

**Technical Details:**
*   Use realistic migration order chains (e.g., 1.0.0 -> 1.1.0 -> 2.0.0).
*   Ensure tests assert both data transformation and final version marker persistence through configurable version handlers.
*   Include dry-run path assertions by setting analog context through `repository.override(...)` and confirming no persistence writes occur.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration Test: `for-nano/tests/integration/migration.add-property.integration.test.ts`
*   [ ] Integration Test: `for-nano/tests/integration/migration.semver-order.integration.test.ts`

**Manual Verification:**
*   Inspect migrated fixture records to confirm property additions/removals and unchanged legacy fields.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
