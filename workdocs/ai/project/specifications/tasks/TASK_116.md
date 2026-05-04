# TASK-116: for-fabric unit migration coverage hardening

**ID:** TASK-116
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** Medium
**Status:** In Progress — extended to cover the new Fabric contract/client migration pair plus documentation updates.

## 1. Description
Strengthen `for-fabric` migration behavior through targeted unit tests with paired `@migration` flows per version. One flow must execute via `FabricContractAdapter` using `CrudContract.migrate(...)`; the second flow (task-triggered) must use only `FabricClientAdapter` and can only invoke contract `migrate`. Migrations must revolve around `FabricContractRepository` reads plus add/delete of properties introduced/removed from models.

## 2. Objectives
*   [x] Add unit-level coverage for paired Fabric migration handlers per version.
*   [x] Validate interaction with `core` migration contracts (`retrieveLastVersion`, ordering, flavour routing).
*   [x] Ensure regression safety without requiring full Fabric integration environment.
*   [x] Ensure `CrudContract` exposes migration API callable from both paths.
*   [x] Enforce that each migration pair shares the same flavour and same version.
*   [x] Ensure migration unit scenarios use `FabricContractRepository` reads and property add/delete transformations.

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
*   [x] Unit Test: `for-fabric/tests/unit/migration.handler.test.ts`
*   [x] Unit Test: `for-fabric/tests/unit/migration.version-routing.test.ts`
*   [x] Unit Test: `for-fabric/tests/unit/migration.contract-client-pairing.test.ts`

**Manual Verification:**
*   Validate test output confirms expected migration selection for Fabric flavour and expected property add/delete results.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
*   [2026-04-25] - Added Fabric migration API and paired migration unit suites; targeted tests passed.
*   [2026-04-25] - `for-fabric` full lint/build remain blocked by pre-existing unrelated module-level issues (outside DECAF-14 scope).
*   [2026-04-25] - Extended `migration.version-routing` to validate both default legacy ordering and injected semver ordering for Fabric migration routing.
*   [2026-04-25] - Verification milestone: `for-fabric` build passed; migration-focused tests passed (`3 suites / 6 tests`) via `--testPathPatterns=migration`; unrelated full-suite integration failures remain outside DECAF-14 scope.
*   [2026-04-25] - Added contract/client `@migration` pairs that add `migrationRequired`, drop `internalMaterialCode`, and fully exercise `FabricContractRepository` reads/writes via the contract route plus the client trigger.
*   [2026-04-25] - Extended the unit suite with `migration.backfill.test.ts` to prove the live property add/delete migrations and documented the TaskEngine/MigrationService workflow across the `core`, `for-nano`, `for-typeorm`, `for-nest`, `for-http`, and `for-fabric` guides.
