# TASK-112: Core migration contract hardening (`@migration`, semver sort, `retrieveLastVersion`, flavour metadata)

**ID:** TASK-112
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Pending

## 1. Description
Harden `core` migration foundations by upgrading `@migration` metadata and migration sorting so execution is deterministic under semver rules. Keep and adapt existing `MigrationService` sorting/orchestration logic (used when not in task mode), adopt npm-standard semver comparison, add configurable async persistence-version handlers (`retrieveLastVersion`, `setCurrentVersion`), and extend metadata to optionally target adapter flavour.

## 2. Objectives
*   [ ] Extend `@migration` metadata contract to support explicit version metadata and optional flavour targeting.
*   [ ] Implement deterministic semver sorting using standard npm semver semantics.
*   [ ] Introduce async `retrieveLastVersion` and `setCurrentVersion` handler contracts in `MigrationService` config.
*   [ ] Preserve backward compatibility for existing migration declarations where feasible.
*   [ ] Throw explicit error on unresolved flavour-based sorting conflicts in non-task mode.
*   [ ] Ensure metadata remains compatible with existing migration dependency mechanism.

## 3. Implementation Plan
**Proposed Changes:**
*   Update `core` migration decorators/types/handlers to include sortable semver metadata and optional flavour.
*   Adapt existing `MigrationService` precedence/sorting path instead of replacing it.
*   Refactor migration engine ordering logic to use npm semver comparison with stable tie-breaking.
*   Add adapter-agnostic `retrieveLastVersion`/`setCurrentVersion` handler interfaces and wiring in migration execution context.
*   Ensure task-based migrations and decorator-driven migrations pass through a single ordering/selection pipeline.

**Technical Details:**
*   Keep migration execution independent from package version.
*   Ensure generic + flavour migrations can both execute in non-task mode.
*   In multi-adapter task mode, generic migrations do not execute (except TaskService generic orchestration behavior).
*   Add edge-case handling for pre-release versions and duplicate version declarations.
*   Version metadata persistence handlers must be straightforward to mock in tests.
*   For non-sortable flavour conflicts, fail fast with explicit error.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `core/tests/unit/migration.semver-order.test.ts`
*   [ ] Unit Test: `core/tests/unit/migration.retrieve-last-version.test.ts`
*   [ ] Unit Test: `core/tests/unit/migration.set-current-version.test.ts`
*   [ ] Unit Test: `core/tests/unit/migration.flavour-selection.test.ts`
*   [ ] Unit Test: `core/tests/unit/migration.flavour-conflict.error.test.ts`

**Manual Verification:**
*   Confirm mixed migration declarations (decorator + task metadata) produce deterministic ordered plan.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
