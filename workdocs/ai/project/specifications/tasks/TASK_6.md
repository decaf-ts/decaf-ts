# TASK-6: FilesystemAdapter tests & docs

**ID:** TASK-6  
**Specification:** [Link to Specification](../DECAF_3.md)  
**Priority:** High  
**Status:** Completed

## 1. Description
Add automated tests, performance benchmarks, and documentation for the new `FilesystemAdapter`, ensuring it matches `RamAdapter` semantics and is safe to operate in production.

## 2. Objectives
*   [x] Create Jest suites (unit + integration) that cover CRUD/bulk/query, index maintenance, and restart scenarios.
*   [x] Provide fixtures/utilities to spin up temporary filesystem databases during tests without polluting the repo.
*   [x] Document configuration, migration guidance, and operational caveats (locking, disk usage, cleanup).

## 3. Implementation Plan
**Proposed Changes:**
*   Introduce shared adapter-fixture helpers under `core/tests/fs/__helpers__` that can spin up disposable directories, instantiate repositories against either `RamAdapter` or `FilesystemAdapter`, and tear everything down.
*   Expand `core/tests/unit/filesystem-adapter.test.ts` into a full suite that validates:
    - Persistence between instances.
    - Index JSON creation/update/removal.
    - Bulk operations and prepared statements using the shared fixtures.
    - Config knobs (`rootDir`, custom `fs`, JSON spacing).
*   Add regression tests that parameterise existing repository/statement suites to run against both adapters (at least the light-weight ones such as query aggregate + pagination) to assert parity without duplicating all Ram coverage.
*   Document the adapter in `core/README.md`, `workdocs/ai/project/specifications/DECAF_3.md`, and the plan/task logs so future tasks understand how to configure and test it (include sample config + directory layout diagrams).

## 4. Verification Plan
**Automated Tests:**
*   [x] Run the new filesystem-specific suites plus the rest of the Jest suite via `npm run test` (see console logs for `tests/unit/filesystem-adapter.test.ts` and `tests/unit/fs/helpers.test.ts`).
*   [x] Execute `npm run lint` and `npm run build` from `./core` to guarantee type safety.

**Manual Verification:**
*   [x] Inspected the generated on-disk folders (via the test helpers and local runs) to confirm structure matches the documentation.
*   [x] Updated `plan.md`, `DECAF_3.md`, and both task files with execution logs + final status once tests were green.

## 5. Blockers & Clarifications
*   Decide where to surface configuration (env vars vs. adapter constructor args).
*   Determine retention policy for temporary test directories.

## 6. Execution Log
*   [2026-02-21] - Added filesystem fixtures (`tests/fs/**`) and the dedicated Jest suites for helpers and adapter behaviour.
*   [2026-02-21] - Documented configuration/usage in `core/README.md` and `core/workdocs/5-HowToUse.md`, then ran `npm run lint`, `npm run build`, and `npm run test`.
*   [2026-02-21] - Captured results across plan/spec/task files to close DECAF-3.
