# TASK-256: MigrationService singleton orchestration

**ID:** TASK-256
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Completed

## 1. Description
Refactor `MigrationService.migrateAdapters(...)` to use the singleton registered by `@service()` instead of constructing one migration service per adapter. Preserve adapter-scoped version handlers, generic-migration selection, stop-on-first-failure behavior, and task tracking across all selected adapters.

## 2. Objectives
*   [x] Preserve the undecorated base class while allowing an application subclass decorated with `@service()` to orchestrate through its singleton instance.
*   [x] Execute all selected adapter migrations through one service instance without rebooting it per adapter.
*   [x] Accumulate adapter-scoped task/version tracking on the singleton and expose one `track()`/`retry()` surface.
*   [x] Update downstream Nano, TypeORM, Nest, and Fabric migration consumers and verification coverage.

## 3. Implementation Plan
**Proposed Changes:**
*   Refactor `core/src/migrations/MigrationService.ts` so `migrateAdapters(...)` returns one service; decorated application subclasses use their `Service.get(Subclass)` singleton instance.
*   Separate invocation/adapter migration configuration from `ClientBasedService` lifecycle configuration.
*   Retain the adapter and `setCurrentVersion` handler alongside each queued migration task.
*   Update callers that iterate returned migration-service arrays.

**Technical Details:**
*   The base static compatibility entry point delegates to one base instance; decorated subclasses invoke the instance entry point obtained from `Service.get(Subclass)`.
*   Reset task tracking once per orchestration run, not once per adapter.
*   Keep task dependency chains adapter-local and retain stop-on-first-failure sequencing.
*   Preserve the multi-adapter generic default while forwarding an explicit `includeGenericInTaskMode` override.

## 4. Verification Plan
**Automated Tests:**
*   [x] Core unit coverage proving one singleton instance is used for multiple adapters.
*   [x] Core migration handler, version, task tracking, build, lint, and targeted test suites.
*   [x] Downstream migration-focused builds/tests in `for-nano`, `for-typeorm`, `for-nest`, and `for-fabric` where locally available.

**Manual Verification:**
*   [x] Confirm no production caller expects an array of migration services.
*   [x] Confirm task tracking persists the correct version through each adapter's handler.

## 5. Blockers & Clarifications
*   No blockers. Generic/default-flavour selection remains opt-in for multi-adapter task mode through `includeGenericInTaskMode: true`; the singleton/orchestration model is the primary runtime change.

## 6. Execution Log
*   [2026-08-08] - Task created and implementation started after reviewing DECAF-14 and affected module callers.
*   [2026-08-08] - Replaced per-adapter construction/boot with a single orchestration instance and updated Nest/TypeORM tracking consumers.
*   [2026-08-08] - Added explicit multi-adapter generic-flag forwarding and updated Core, Nano, and TypeORM usage documentation.
*   [2026-08-08] - Core build/lint and six focused migration suites passed (8 tests). Nano, TypeORM, Fabric, and Nest builds passed against the new Core API.
*   [2026-08-08] - Live Nano + Ram multi-adapter verification passed against CouchDB (1 suite, 1 test). Isolated Fabric verification hit the workspace's linked `@decaf-ts/decoration` metadata mismatch. Nest lint retains its unrelated `EventsController.ts` unsafe `Function` error.
