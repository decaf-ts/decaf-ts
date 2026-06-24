# TASK-185: E2E verification with complex models, per-model config, module overrides, and full Axios API coverage

**ID:** TASK-185
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
Verify the entire DECAF-10 primitive stack end-to-end with a dedicated e2e test that defines complex test models (with relations and `@composed()` primary keys), boots a controller for each model under a different configuration expressed via model decoration (`@controllerConfig`), and overrides some of those per-model configs through the module-level configuration — proving both configuration layers (decoration-driven and module-driven) drive `ModelControllerFactory` route materialization correctly. The full API surface MUST be integration tested using a real `HttpAdapter` (`AxiosHttpAdapter` from `for-http`) as the client.

## 2. Objectives
*   [x] Define test models complex enough to exercise the full controller-builder surface:
    - A single-PK model.
    - A `@composed()` multi-part PK model with `filterEmpty` enabled (so fallback routes are required).
    - A model with `@relation()`/cross-model references (honoring the Cross-Relationship Guardrail: exactly one side `populate: true`, the opposite side `populate: false` weak reference typed as `<pk_type> | <Class>`).
*   [x] Each test model MUST have its controller booted under a distinct `ModelControllerFactory` configuration expressed by decorating the model class with `@controllerConfig(...)` — e.g. one model allows grouping queries, another disables bulk update, a third allows statementless queries, a fourth blocks a prepared statement via `@BlockOperations`.
*   [x] The e2e test MUST additionally override some of the per-model decoration-driven configurations through the module-level configuration (e.g. `DecafModuleOptions.controllerConfig`), proving the module config takes precedence over per-model decoration metadata where the two conflict.
*   [x] The e2e test MUST assert, over live HTTP, that each model's exposed route surface matches its effective configuration (decoration-driven as overridden by module config) — blocked routes return 404, allowed routes return the expected status codes.
*   [x] The full API surface MUST be integration tested using a real `AxiosHttpAdapter` as the client — no in-process/in-memory shortcut. Every operation class MUST be exercised over the wire: CRUD (create/read/update/delete), bulk operations, prepared-statement routes (listBy/paginateBy/find/page/findOneBy/findBy), grouping/aggregation queries (count/avg/max/min/sum/distinct/group), complex/dynamic queries, composed-PK routes (including filterEmpty fallback shapes), and server-emitted events (SSE delivery from the events module for each model operation).

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-nest/tests/e2e/decaf-model-controller-builder.e2e.test.ts`.
*   Define test models under `for-nest/tests/e2e/fakes/models/` (or inline in the test file) covering single-PK, composed-PK with filterEmpty, and relational models.
*   Decorate each model with `@controllerConfig(...)` with different config knobs.
*   Boot a live Nest app with `DecafModule.forRootAsync(...)` passing `controllerConfig` overrides for some models.
*   Use `AxiosHttpAdapter` as the HTTP client to exercise every route.
*   Use `EventSource` to verify SSE event delivery.

**Technical Details:**
*   Follow the pattern established by `decaf-model-exposure.integration.test.ts` for app boot, Nano test resources, cleanup, and Axios usage.
*   Use `RamAdapter` for all models (no external DB dependency needed for the config-verification tests).
*   For each model, assert that routes blocked by `@BlockOperations` or disabled by config return 404.
*   For each model, assert that allowed routes return expected status codes and correct data.

## 4. Verification Plan
**Automated Tests:**
*   [x] E2E Test: `for-nest/tests/e2e/decaf-model-controller-builder.e2e.test.ts`

**Manual Verification:**
*   Inspect the route coverage against the live app boot logs and confirm the expected models are exposed with the correct config-driven route surface.

## 5. Blockers & Clarifications
*   Depends on TASK-177 (FromModelController rewrite with `@controllerConfig` support).
*   Renumbered from TASK-181 on 2026-06-23 after an ID collision with DECAF-27's inventory task (which retains TASK-181).

## 6. Execution Log
*   Completed. All 17 e2e tests pass using real `AxiosHttpAdapter` over live HTTP.
*   Coverage: CRUD, bulk, prepared statements (listBy/paginateBy/find/page/findOneBy/findBy), grouping queries (count/avg/max/min/sum/distinct/group — both allowed and blocked), `@query` complex/dynamic queries, `@route` custom routes, composed-PK with filterEmpty fallback, cross-model relations, SSE events (create/update/delete), per-model `@controllerConfig`, module-level overrides, `@BlockOperations`.
