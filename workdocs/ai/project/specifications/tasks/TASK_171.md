# TASK-171: Implement `ModelControllerBuilder`

**ID:** TASK-171
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
Build `ModelControllerBuilder` in `for-http/src/server/controllers/`, composing (not duplicating) `ServerControllerBuilder` (TASK-170), and exposing model-aware route helpers that mirror everything currently hand-written in `for-nest/src/decaf-model/FromModelController.ts`.

## 2. Objectives
*   [ ] Define `ModelControllerBuilder<T extends Model<boolean>>` wrapping a `ServerControllerBuilder` instance (composition, not inheritance duplication of its internals).
*   [ ] Add CRUD helpers: `addCreateRoute`, `addReadRoute`, `addUpdateRoute`, `addDeleteRoute`.
*   [ ] Add bulk helpers: `addBulkCreateRoute`, `addBulkReadRoute`, `addBulkUpdateRoute`, `addBulkDeleteRoute`.
*   [ ] Add statement helpers: `addStatementRoute` (generic `statement/:method/*args`) plus named shortcuts (`addListByRoute`, `addPaginateByRoute`, `addFindRoute`, `addPageRoute`, `addFindOneByRoute`, `addFindByRoute`).
*   [ ] Add grouping/aggregation helpers: `addGroupingQueryRoute` for `PreparedStatementKeys.{COUNT_OF,MAX_OF,MIN_OF,AVG_OF,SUM_OF,DISTINCT_OF,GROUP_OF}` (today these exist only as commented-out dead code in `FromModelController.ts`).
*   [ ] Add `addComplexQueryRoute`/`addComplexQueries` reusing the existing dynamic-query-from-repository-metadata logic (today's `FromModelController.createQueryRoutesFromRepository`).
*   [ ] Every helper must consult `isOperationBlocked(ModelConstr, kind, value)` (the real `core` 3-arg signature) before registering its route, and skip registration entirely (not just hide from docs) when blocked.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-http/src/server/controllers/ModelControllerBuilder.ts`.
*   Reuse `DecafModelController`/`RequestContext` already in `for-http/server/controllers/controllers.ts` for persistence resolution (`Service.get`/`ModelService.getService`/`Repository.forModel` fallback chain, same as `FromModelController.getPersistence`).
*   Import `isOperationBlocked` from `@decaf-ts/core` directly — no local re-implementation.

**Technical Details:**
*   Each `add*Route` helper builds a `ServerRoute` via `ServerMethodBuilder` (TASK-170) with the handler set via `withImplementation(...)`, then calls the underlying `ServerControllerBuilder.addMethodFromRoute(...)` (skipping entirely when `isOperationBlocked` says so).
*   Keep all Nest-specific concerns (Swagger decorators, `@Param`/`@Query` parameter decorators) out of this file — they belong in `for-nest`'s consumption of this builder (TASK-177), not here.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit test per helper: route is registered when not blocked, omitted when blocked via `@BlockOperations`.
*   [ ] Unit test: `addComplexQueryRoute` wires the same query metadata `createQueryRoutesFromRepository` does today.

**Manual Verification:**
*   Build a controller for a sample model (e.g. `Product`) via `ModelControllerBuilder` and confirm the resulting route set matches today's `FromModelController.create()` output.

## 5. Blockers & Clarifications
*   Depends on TASK-170 (handler-carrying generic builder) being in place first.
*   **Cross-reference (2026-06-19 review, Audit finding #2):** The persistence fallback chain this task reuses from `for-http/server/controllers/controllers.ts` (`DecafModelController.persistence()`) is *also* independently duplicated in `for-nest/src/controllers.ts`'s own `DecafModelController` (see TASK-179). Building this task's handlers on top of for-http's `DecafModelController` (not a new third copy) is what makes TASK-179's later retirement of the `for-nest` duplicate actually pay off — don't introduce a third implementation of the same fallback chain inside `ModelControllerBuilder`'s helpers.

## 6. Execution Log
*   Implemented `ModelControllerBuilder` in `for-http/src/server/controllers/` with CRUD, bulk, statement, named prepared-statement, grouping, and complex-query helpers. The builder consults `isOperationBlocked(...)` before registration and composes `ServerControllerBuilder` instead of duplicating it.
