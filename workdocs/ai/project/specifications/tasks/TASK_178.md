# TASK-178: Regression tests and documentation for the broadened DECAF-10 scope

**ID:** TASK-178
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** Medium
**Status:** Pending

## 1. Description
Close out the broadened spec with regression coverage proving the end-to-end behavior change is safe, and documentation across `for-http` and `for-nest` covering every new primitive introduced (verb decorators, the handler-carrying builders, `ModelControllerBuilder`/`ModelControllerFactory`, the relocated Transformers, the new auth module's `forRoot()`, and the `for-nest/src/controllers.ts` unification). The live model-exposure integration suite now lives in TASK-180 and should be referenced here when the final regression pass is documented.

## 2. Objectives
*   [ ] Full regression run across `for-http` and `for-nest` (unit, integration, e2e) after TASK-168 through TASK-177, TASK-179, and TASK-180 land, with no unexplained failures.
*   [ ] `for-http/workdocs/5-HowToUse.md`: document `@route`/verb decorators, `ServerControllerBuilder`/`ServerMethodBuilder`, `ModelControllerBuilder`, `ModelControllerFactory` (including the full config surface and `@composed()` fallback-route behavior), and the relocated Transformers.
*   [ ] `for-nest/workdocs/5-HowToUse.md`: document the rewritten `FromModelController` (what changed under the hood, what stayed byte-for-byte compatible), the new `auth` module's `forRoot(options)`, the re-export shims' deprecation status for the relocated Transformer/auth paths, and the retirement of `for-nest`'s local `DecafController`/`DecafModelController` (TASK-179) in favor of `for-http/server`'s versions.
*   [ ] Update DECAF_10.md's "Results & Artifacts" section with the final list of shipped files once all tasks land.

## 3. Implementation Plan
**Proposed Changes:**
*   Add/update docs as listed in Objectives.
*   Run the full test suites for both modules and capture pass counts (matching the convention used in DECAF-7's "Completion Notes," e.g. "`core` suite: N suites / M tests passing").

**Technical Details:**
*   Document the `allowStatementlessQuery`/`allowGroupingQueries`/`allowBulkStatement` config surface with concrete before/after route-list examples, the same way DECAF-7 documented `maxConcurrentTransactions`'s four behavioral cases.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Full `for-http` suite green.
*   [ ] Full `for-nest` suite green.

**Manual Verification:**
*   Read through both updated `HowToUse.md` files as a new consumer would, confirming the documented examples actually match the shipped API.

## 5. Blockers & Clarifications
*   Depends on TASK-175, TASK-176, TASK-177, and TASK-179 all being complete.

## 6. Execution Log
*   Pending.
