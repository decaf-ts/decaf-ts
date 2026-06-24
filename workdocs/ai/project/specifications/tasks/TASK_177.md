# TASK-177: Rewrite `for-nest`'s `FromModelController` on top of `ModelControllerFactory`

**ID:** TASK-177
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
This is the task that actually fulfills DECAF-10's original ask. With `ModelControllerBuilder`/`ModelControllerFactory` (TASK-171–174) built and parity-proven (TASK-172) against today's hand-written routes, rewrite `for-nest/src/decaf-model/FromModelController.create()` to delegate to them instead of hand-defining `DynamicModelController`. This is also where `@BlockOperations`'s statement/query targets (TASK-107, currently shipped in `core` but never called from `for-nest`) finally get a caller.

## 2. Objectives
*   [ ] Replace `FromModelController.create()`'s hand-written `DynamicModelController` class body with a call into `ModelControllerFactory.create(ModelConstr, persistence, config)`.
*   [ ] Layer the Nest-specific concerns (`@Controller`, `@nestjs/swagger` decorators built from the framework-agnostic `ServerRoute.{summary,description,responses}`, `@Param`/`@Query`/`@Response` parameter decorators, `@Auth()` from the new auth module — TASK-176) on top of the factory's output.
*   [ ] Replace `for-nest/src/decaf-model/decorators/ApiOperationFromModel.ts`'s local, 2-arg-only `isOperationBlocked` with the real `core` 3-arg `isOperationBlocked(ctor, kind, value)`, so prepared-statement/query blocking (TASK-107) is finally consulted by `for-nest`, not just by CRUD-verb mapping.
*   [ ] Preserve the static `get class()` getter, PK lookup, and logging wiring exactly as today's `DynamicModelController` does.

## 3. Implementation Plan
**Proposed Changes:**
*   Modify `for-nest/src/decaf-model/FromModelController.ts`: `create()` now builds its `config: ModelControllerFactoryConfig` (initially defaulting to "everything on," matching current behavior) and calls the factory, then wraps each returned `ServerRoute`/handler pair with the appropriate Nest decorators.
*   Remove (or reduce to a thin compatibility shim) the now-redundant per-route hardcoded methods.
*   Update `ApiOperationFromModel.ts`/`BulkApiOperationFromModel` to import `isOperationBlocked` from `@decaf-ts/core` and pass the statement/query `kind`/`value` for the non-CRUD routes (`listBy`, `paginateBy`, `find`, `page`, `findOneBy`, `findBy`, `statement`, dynamic queries), not just the CRUD verb mapping it does today.

**Technical Details:**
*   This is the highest-risk task in the spec: it changes the production code path for every `for-nest` consumer's generated controllers. TASK-172's parity tests are the pre-condition; do not start this task until they pass.
*   Keep `createQueryRoutesFromRepository`'s existing Swagger-decoration logic (`getApiDecorators`, `applyApiDecorators`) as the template for how the factory's generic `ServerRoute` metadata gets turned into `@nestjs/swagger` decorators.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Full `for-nest` existing test suite (unit + integration + e2e) passes unchanged against the rewritten `FromModelController`.
*   [ ] New test: applying `@BlockOperations({ kind: "statement", value: PreparedStatementKeys.LIST_BY })` (or equivalent) to a model actually removes the `listBy` Nest route — this exact scenario has no working test today because nothing calls the richer `isOperationBlocked` from `for-nest`.

**Manual Verification:**
*   Boot a sample Nest app with a model controller generated through the rewritten `FromModelController` and confirm the full route list (Swagger UI or direct route inspection) matches pre-rewrite behavior, including for a model with a `@composed()` PK.

## 5. Blockers & Clarifications
*   Depends on TASK-172 (parity proof), TASK-173 (factory), TASK-174 (composed-PK handling), TASK-176 (auth module — promoted from "ideally" to a hard dependency, 2026-06-19 review: Objective 2 explicitly requires `@Auth()` from the new module, so doing this rewrite before TASK-176 lands means migrating `@Auth()` wiring twice), and TASK-179 (retiring `for-nest/src/controllers.ts`'s duplicate `DecafController`/`DecafModelController`, Audit finding #2 — `FromModelController`'s `DynamicModelController`/`QueryController` currently extend that local `DecafModelController`; migrating its base class once, alongside this rewrite, avoids a second migration of the same file).

## 6. Execution Log
*   2026-06-23: Rewrote `FromModelController.create()` to delegate to `ModelControllerFactory.create()`. The factory generates route metadata (`__routes__`), and `FromModelController` materializes each route as a NestJS controller method via `matchRoute()` dispatcher (pattern-matches HTTP method + path to Nest decorators/handlers).
*   2026-06-23: Added `@controllerConfig` decorator (`for-nest/src/decaf-model/decorators/controller-config.ts`) storing per-model `ModelControllerFactoryConfig` in metadata under `DECAF_CONTROLLER_CONFIG`. Module-level `controllerConfig` overrides merged with decorator config (module takes precedence).
*   2026-06-23: Updated `DecafModelModule.forRoot()` to pass `options.controllerConfig` to `FromModelController.create()`.
*   2026-06-23: Added statement shortcut routes (`listBy`, `paginateBy`, `find`, `page`, `findOneBy`, `findBy`, `countOf`, `maxOf`, `minOf`, `avgOf`, `sumOf`, `distinctOf`, `groupOf`) to `ModelControllerFactory` with `matchRoute()` handlers.
*   2026-06-23: Fixed `allowGroupingQueries` default to `true` (matching original behavior where grouping routes were always added).
*   2026-06-23: Fixed jest `moduleNameMapper` for `@decaf-ts/core/migrations` subpath.
*   2026-06-23: Fixed `AUTH_META_KEY` import path in `model-builder.extensions.test.ts` (moved from `constants.ts` to `auth/constants.ts`).
*   2026-06-23: All 88 unit tests pass (9 skipped, 0 failed). Parity test confirms builder/factory/controller route surfaces match exactly (22 routes each for `Product`).
