# TASK-172: Port `for-nest`'s hand-written routes onto `ModelControllerBuilder`

**ID:** TASK-172
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
With `ModelControllerBuilder` (TASK-171) in place, port every route currently hand-written in `for-nest/src/decaf-model/FromModelController.ts`'s `DynamicModelController` (`create`, `createAll`, `read`, `readAll`, `update`, `updateAll`, `delete`, `deleteAll`, `listBy`, `paginateBy`, `find`, `page`, `findOneBy`, `findBy`, `statement`, plus the dynamic queries from `createQueryRoutesFromRepository`) onto the builder, and prove parity before `for-nest` is switched over (that switch is TASK-177).

## 2. Objectives
*   [ ] For each route in today's `DynamicModelController`, write the equivalent `ModelControllerBuilder` call and confirm it produces an equivalent `ServerRoute` (path, method, params, handler behavior).
*   [ ] Write parity tests comparing route-by-route behavior between the existing hardcoded controller and a `ModelControllerBuilder`-assembled one, for at least one representative model (reuse `for-nest/tests/unit/Product.ts` if suitable).
*   [ ] Confirm static helpers (`get class()`, the `pk` lookup, logging wiring) are reproducible on top of the builder's output, even though they are not exposed as HTTP routes.

## 3. Implementation Plan
**Proposed Changes:**
*   Add a test-only (or reference) assembly in `for-http/tests` (or `for-nest/tests`, whichever module owns the parity suite) that builds a controller via `ModelControllerBuilder` for the same model fixture used by `for-nest`'s existing controller tests.
*   Do not yet modify `FromModelController.ts` itself — that is TASK-177, gated on this task's parity proof.

**Technical Details:**
*   Pay special attention to the prepared-statement `statement/:method/*args` route's argument-coercion logic (numeric parsing, direction/limit/offset/bookmark handling) currently in `FromModelController.statement()` (`FromModelController.ts:501-550` as of 2026-06-19) — this is the most complex single route and must be reproduced exactly, including the `switch (name)` per-`PreparedStatementKeys` branching (`LIST_BY` pushes `direction`; `PAGE`/`PAGE_BY` rebuilds `args` into `[key, direction, { limit, offset, bookmark }]`; the six aggregation keys currently fall through as a no-op).
*   The commented-out aggregation routes (`countOf`, `maxOf`, `minOf`, `avgOf`, `sumOf`, `distinctOf`, `groupOf`) in `FromModelController.ts` (lines 552-701 as of 2026-06-19) are currently dead code (never active) — TASK-171's `addGroupingQueryRoute` should activate them for the first time; confirm with the spec owner whether activating previously-dormant routes is in scope here or should wait for `ModelControllerFactory`'s `allowGroupingQueries` toggle (TASK-173) to gate them.
*   `for-nest/tests/unit/ProductMarket.ts` already exists as a composed-PK model fixture (confirmed 2026-06-19) — use it for the composed-PK manual-verification step instead of constructing a new one. `for-http/tests/unit/composed-model.test.ts` is a second, independent composed-PK test already in `for-http` and is a useful reference for how that module's tests are structured.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Parity test suite: for each route, assert identical path/method/behavior between the old hardcoded controller and the new builder-assembled one.

**Manual Verification:**
*   Manually diff the route list (path + verb) produced by both implementations for at least two models, including one with a `@composed()` PK.

## 5. Blockers & Clarifications
*   Depends on TASK-171.
*   **Clarification:** Whether to activate the dormant aggregation routes now or defer their exposure to `ModelControllerFactory`'s config (TASK-173) — recommend deferring, so they ship disabled by default until a config flag turns them on, avoiding an unannounced surface-area change.

## 6. Execution Log
*   Added parity coverage proving `ModelControllerBuilder` matches `FromModelController.create()` for `Product` and `ProductMarket`, and matches `createQueryRoutesFromRepository()` for a decorated query/route repository fixture.
