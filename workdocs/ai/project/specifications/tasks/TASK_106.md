# TASK-106: Implement `DecafModelControllerBuilder` with CRUD, statements, and complex queries

**ID:** TASK-106
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
Build the `DecafModelControllerBuilder` class inside the `for-nest` module so that controllers are composed via a fluent API similar to `core/src/overrides/ModelBuilder.ts`. The builder should own the logic that decides whether to add each persistence operation to the controller prototype and should expose helpers such as `addCreate`, `addRead`, `addUpdate`, `addDelete`, `addBulkCrud`, `addStatement`, `addListBy`, `addPaginateBy`, and `addComplexQueries` before calling `build()` to finalize the class.

## 2. Objectives
*   [ ] Define a builder API that teams can reuse to register each controller endpoint without hardcoding methods.
*   [ ] Wire the builder to the existing route/decorator helpers (`createRouteHandler`, `applyApiDecorators`, etc.) so Swagger metadata continues to work.
*   [ ] Keep static properties (`class` getter, `getRouteParametersFromModel`, `sqaggre` annotations) intact by copying them or applying them prior to returning the constructed prototype.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `DecafModelControllerBuilder` in `for-nest/src/decaf-model` that stores router definitions and can emit them on demand.
*   Replace the hardcoded `DynamicModelController` definition inside `FromModelController.create` with a builder invocation that registers all CRUD, bulk, statement, and query routes.
*   Include an `addComplexQueries` step that reuses `createRouteHandler` and Swagger helpers to generate decorated route definitions for repository metadata-derived queries.
*   Ensure builder steps consult the updated `BlockOperations` guard (TASK-107) to skip endpoints that should not be exposed.

**Technical Details:**
*   The builder should emit methods via `Object.defineProperty` similar to `defineRouteMethod`, keeping them non-writable.
*   Use builder hooks to register Nest decorators, request parameter decorators, and logging wrappers exactly as the current `DynamicModelController` does.
*   Provide a `build()` method that returns a class extending `DecafModelController` with the registered methods and metadata applied.

## 4. Verification Plan
**Automated Tests:**
*   _Will be covered under TASK-108._

**Manual Verification:**
*   Load a sample model controller to ensure the builder outputs the same methods/routes as the previous implementation (for example `Customer` or `Product`).

## 5. Blockers & Clarifications
*   Confirm whether any of the previously defined controller methods were used outside Nest (private helpers, static getters) so they can be ported to the builder output.

## 6. Execution Log
-   [x] Implemented `DecafModelControllerBuilder` and rewrote `FromModelController.create` so every CRUD, bulk, statement, and query route is registered through the builder.
