# TASK-117: for-nest multi-adapter (Nano + TypeORM) migration integration boot

**ID:** TASK-117
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Pending

## 1. Description
Create `for-nest` integration coverage that boots Nest with one Nano adapter and one TypeORM adapter, then executes a migration flow that migrates both adapters in a single boot sequence. Trigger migrations through an explicit callable function after services are booted and before any endpoints are exposed, with no lifecycle hooks.

## 2. Objectives
*   [ ] Boot Nest application in tests with Nano + TypeORM adapters configured simultaneously.
*   [ ] Execute migration pipeline and confirm each adapter runs its own targeted migrations.
*   [ ] Validate multi-adapter version retrieval and semver ordering through Nest orchestration layer.

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
*   [ ] Integration Test: `for-nest/tests/integration/migration.multi-adapter.integration.test.ts`

**Manual Verification:**
*   Confirm both Nano and TypeORM stores reflect migrated schema/data state after one orchestrated run.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
