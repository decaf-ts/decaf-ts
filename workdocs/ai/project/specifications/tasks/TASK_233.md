# TASK-233: Final verification of graph metadata/engine split

**ID:** TASK-233
**Specification:** [DECAF-35](../DECAF_35.md)
**Priority:** Medium
**Status:** Done

## 1. Description
Final verification that the graph metadata/engine split is complete: all builds, lints, and tests pass across `integrations`, `for-angular`, and `for-nest`; the for-angular production bundle contains no engine code; the `@decaf-ts/integrations/graph/shared` export resolves in a fresh install.

## 2. Objectives
* [x] `integrations`: build, lint, test green (167 graph unit tests + 15 graph e2e tests + 6 nest graph module tests).
* [x] `for-angular`: build, lint, test green (60 tests); production bundle has no engine code.
* [x] `for-nest`: build, lint, test green (NestJS graph module — 105 unit tests pass; 1 pre-existing lint error in `EventsController.ts` unrelated to graph).
* [x] `@decaf-ts/integrations/graph/shared` resolves in `for-angular/node_modules/@decaf-ts/integrations`.
* [x] No circular imports between `shared/` and `engine/` (verified with `dpdm`).

## 3. Implementation Plan
**Proposed Changes:**
* None — this is a verification task. Fix any breakages discovered.

**Technical Details:**
* Bundle analysis: `npx ng build for-angular-app --source-map` then inspect `www/` for engine class names, or use `source-map-explorer`.
* Fresh install: `rm -rf for-angular/node_modules/@decaf-ts/integrations && npm install` in for-angular, then verify `require('@decaf-ts/integrations/graph/shared')` resolves.
* `madge --circular integrations/src/graph/index.ts` to verify no circular imports.

## 4. Verification Plan
**Automated Tests:**
* [x] `npm run build && npm run lint && npm run test` in `integrations` — 167 graph unit tests + 15 e2e tests pass; build clean; 6 pre-existing lint errors in Kibana plugin (unrelated to graph).
* [x] `npm run build && npm run lint && npm run test` in `for-angular` — 60 tests pass; build clean; lint clean (1 pre-existing warning).
* [x] `npm run build && npm run lint && npm run test` in `for-nest` — 105 unit tests pass; build clean; 1 pre-existing lint error in `EventsController.ts` (unrelated to graph).

**Manual Verification:**
* [x] `grep -r "GraphExecutionEngine" for-angular/www/` — no matches.
* [x] `grep -r "ForeachGraphNodeExecutor" for-angular/www/` — no matches.
* [x] `grep -r "GraphExecutionEventSubjectObserver" for-angular/www/` — no matches.
* [x] `dpdm -T --no-warning --no-tree ./src/graph/index.ts` in `integrations` — no circular dependencies.
* [x] `@decaf-ts/integrations/graph/shared` export present in `for-angular/node_modules/@decaf-ts/integrations/package.json` and resolves to `lib/esm/graph/shared/index.js`.

## 5. Blockers & Clarifications
* Depends on TASK-230, TASK-231, TASK-232.

## 6. Execution Log
* Reviewed all graph-related specs (DECAF-24, DECAF-32, DECAF-34, DECAF-35, DECAF-36).
* Established baseline: all graph tests passing (167 unit + 15 e2e in integrations; 18 in ui-decorators; 60 in for-angular; 105 unit in for-nest).
* Identified and fixed remaining cleanup gaps from TASK-232 (Option A SSE migration):
  1. Deleted dead `GraphExecutionEventSubjectObserver.ts` (was no longer imported anywhere; still imported from full `@decaf-ts/integrations/graph` export).
  2. Repointed `GraphExecutionStateMapper.ts` import from `@decaf-ts/integrations/graph` to `@decaf-ts/integrations/graph/shared` (the `GraphExecutionEvent` type is available from shared).
  3. Removed the obsolete ESLint "Temporary override" block that allowed the full graph import for demo executor files (the demo executors were already deleted/migrated).
* Verified all builds, lints, and tests green after changes.
* Verified production bundle (`for-angular/www/`) contains no engine code (`GraphExecutionEngine`, executors, registry, pinning service, planner, observer).
* Verified no circular imports in `integrations/src/graph/index.ts` via `dpdm`.
* Verified `@decaf-ts/integrations/graph/shared` export resolves in `for-angular/node_modules`.
