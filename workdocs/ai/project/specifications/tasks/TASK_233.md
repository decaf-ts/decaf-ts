# TASK-233: Final verification of graph metadata/engine split

**ID:** TASK-233
**Specification:** [DECAF-35](../DECAF_35.md)
**Priority:** Medium
**Status:** Pending

## 1. Description
Final verification that the graph metadata/engine split is complete: all builds, lints, and tests pass across `integrations`, `for-angular`, and `for-nest`; the for-angular production bundle contains no engine code; the `@decaf-ts/integrations/graph/shared` export resolves in a fresh install.

## 2. Objectives
* [ ] `integrations`: build, lint, test green (116 graph tests).
* [ ] `for-angular`: build, lint, test green (42 tests); production bundle has no engine code.
* [ ] `for-nest`: build, lint, test green (NestJS graph module).
* [ ] `@decaf-ts/integrations/graph/shared` resolves in a fresh `node_modules` install.
* [ ] No circular imports between `shared/` and `engine/` (verified with `madge`).

## 3. Implementation Plan
**Proposed Changes:**
* None — this is a verification task. Fix any breakages discovered.

**Technical Details:**
* Bundle analysis: `npx ng build for-angular-app --source-map` then inspect `www/` for engine class names, or use `source-map-explorer`.
* Fresh install: `rm -rf for-angular/node_modules/@decaf-ts/integrations && npm install` in for-angular, then verify `require('@decaf-ts/integrations/graph/shared')` resolves.
* `madge --circular integrations/src/graph/index.ts` to verify no circular imports.

## 4. Verification Plan
**Automated Tests:**
* [ ] `npm run build && npm run lint && npm run test` in `integrations`.
* [ ] `npm run build && npm run lint && npm run test` in `for-angular`.
* [ ] `npm run build && npm run lint && npm run test` in `for-nest`.

**Manual Verification:**
* `grep -r "GraphExecutionEngine" for-angular/www/` — no matches.
* `grep -r "ForeachGraphNodeExecutor" for-angular/www/` — no matches.
* `node -e "const m = require('@decaf-ts/integrations/graph/shared'); console.log(typeof m.ALL_GRAPH_NODES)"` — prints `object`.

## 5. Blockers & Clarifications
* Depends on TASK-230, TASK-231, TASK-232.

## 6. Execution Log
* (pending)
