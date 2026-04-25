# TASK-116: for-fabric unit migration coverage hardening

**ID:** TASK-116
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** Medium
**Status:** Pending

## 1. Description
Strengthen `for-fabric` migration behavior through targeted unit tests with paired `@migration` flows per version. One flow must execute via `FabricContractAdapter` using `CrudContract.migrate(...)`; the second flow (task-triggered) must use only `FabricClientAdapter` and can only invoke contract `migrate`. Migrations must revolve around `FabricContractRepository` reads plus add/delete of properties introduced/removed from models.

## 2. Objectives
*   [ ] Add unit-level coverage for paired Fabric migration handlers per version.
*   [ ] Validate interaction with `core` migration contracts (`retrieveLastVersion`, ordering, flavour routing).
*   [ ] Ensure regression safety without requiring full Fabric integration environment.
*   [ ] Ensure `CrudContract` exposes migration API callable from both paths.
*   [ ] Enforce that each migration pair shares the same flavour and same version.
*   [ ] Ensure migration unit scenarios use `FabricContractRepository` reads and property add/delete transformations.

## 3. Implementation Plan
**Proposed Changes:**
*   Add/extend Fabric migration unit suites for both paired paths (`FabricContractAdapter` direct path and `FabricClientAdapter` task path).
*   Introduce fixtures that simulate version progression and migration applicability.
*   Use `FabricContractRepository` access to load records during migration and validate add/delete property transformations.
*   Validate that task path is limited to invoking contract `migrate` only.
*   Validate error normalization for invalid version metadata and unavailable version retrieval.

**Technical Details:**
*   Keep tests deterministic and isolated from network/infrastructure dependencies.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-fabric/tests/unit/migration.handler.test.ts`
*   [ ] Unit Test: `for-fabric/tests/unit/migration.version-routing.test.ts`
*   [ ] Unit Test: `for-fabric/tests/unit/migration.contract-client-pairing.test.ts`

**Manual Verification:**
*   Validate test output confirms expected migration selection for Fabric flavour and expected property add/delete results.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
