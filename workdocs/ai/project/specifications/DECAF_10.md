# DECAF-10 — DecafModelControllerBuilder for for-nest and BlockOperations coverage

- **Status:** In Progress
- **Priority:** High
- **Goal:** Provide a builder-driven NestJS controller generator for each model that respects `@BlockOperations`, reuses the existing dynamic query metadata, and extends the decorator guard to cover prepared statements and query keys.

---

## 1. Overview
Deliver a new `DecafModelControllerBuilder` inside the `for-nest` module so that every `ModelController` prototype can be composed through a `ModelBuilder`-like API rather than by defining a concrete class with hardcoded routes. This builder will orchestrate CRUD endpoints, bulk helpers, prepared statements, and dynamically generated repository queries while honoring everything currently blocked via `@BlockOperations` (including the new prepared-statement/query-key targets). The static helpers (`class` getter, pk lookup, logging helpers, `sqaggre` annotations, etc.) must continue to exist on the generated prototypes but never be exposed as NestJS routes.

## 2. Goals
*   [ ] Design a builder API (`addCreate`, `addStatement`, `addListBy`, `addComplexQueries`, etc.) that progressively assembles the controller prototype without embedding specific methods in the class definition.
*   [ ] Plug the builder into the existing controller factory so every model route honors the current persistence metadata and the `BlockOperations` flags (including the new statement/query-key domain).
*   [ ] Expand the `BlockOperations` decorator/guard so it can also block prepared statements and query-key routes (e.g., `listBy`, `paginateBy`) and verify that controllers generated via the builder skip the blocked APIs.

## 3. User Stories / Requirements
*   **US-1:** As a NestJS maintainer, I want controller constructors built through reusable builder steps, so I can ensure the generated surface remains consistent with metadata without hand-editing each route.
*   **US-2:** As a security reviewer, I need every model controller to automatically skip routes that are blocked by `@BlockOperations`, including both CRUD operations and repository statements/queries.
*   **Req-1:** The controller builder must never hardcode route methods; every endpoint is injected via builder helpers (`addCreate`, `addRead`, `addStatement`, `addComplexQueries`, etc.).
*   **Req-2:** The builder must trust the existing dynamic query generation and expose it via an `addComplexQueries` helper so decorated repository queries continue to be wired into the controller surface.
*   **Req-3:** The `sqaggre` annotations/documentation on each controller should be left untouched, and any automation that currently inspects them must behave the same after the builder refactor.

## 4. Architecture & Design
`DecafModelControllerBuilder` will sit alongside the current `FromModelController` logic. It should mimic the fluent API style seen in `core/src/overrides/ModelBuilder.ts`, allowing chained calls to register route segments before finally materializing the prototype.

Key responsibilities:
*   Maintain a list of route builders keyed by operation (create/read/update/delete/bulk, prepared statements, dynamic queries).
*   Consult `@decaf-ts/db-decorators` metadata (including the new `BlockOperations` targets and the current query decoration) to decide which builders should emit actual methods versus being skipped.
*   Preserve the static `get class()` getter, PK helper, and logger wiring so the generated class remains indistinguishable from the manually defined `DynamicModelController`.
*   Provide a dedicated `addComplexQueries` method that iterates over repository metadata and wires each decorated query into the Nest controller, reusing the existing `createRouteHandler` and Swagger decorators.
*   Ensure `sqaggre` annotations (as currently defined) are left on the prototype; if they are produced via metadata, the builder should reapply them before finalizing the class.

The new `BlockOperations` guard will live in the shared `@decaf-ts/db-decorators`/`core` stack. It will expose a richer argument signature so controllers can ask the guard whether a CRUD operation, prepared statement key, or query key is blocked before resolving the builder step. `DecafModelControllerBuilder` will call this guard before registering each route.

## 5. Tasks Breakdown
| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-105 | [Analyze the existing controller pipeline and BlockOperations coverage](./tasks/TASK_105.md) | High | Completed | - |
| TASK-106 | [Implement `DecafModelControllerBuilder` that wires builder helpers for CRUD, statements, and dynamic queries](./tasks/TASK_106.md) | High | Completed | TASK-105 |
| TASK-107 | [Extend `BlockOperations` to understand prepared statements and query keys](./tasks/TASK_107.md) | High | Completed | TASK-105 |
| TASK-108 | [Add tests/docs that prove builder respects `BlockOperations`, preserves `sqaggre`, and wires dynamic queries](./tasks/TASK_108.md) | Medium | In Progress | TASK-106/TASK-107 |

## 6. Open Questions / Risks
*   Are there existing `sqaggre` annotations tied to a static class definition that the builder must copy verbatim onto the generated prototype?
*   Do any modules rely on controller methods that currently exist but are not decorated as Nest routes (e.g., utility helpers)? The builder must keep those methods accessible even if they are not exposed over HTTP.
*   How should the `BlockOperations` decorator surface the new query-key targets (string names, enums, metadata)? Keep the API backwards compatible with decorators that currently pass `CrudOperations`.

## 7. Results & Artifacts
*   New `DecafModelControllerBuilder` class in `for-nest/src/decaf-model` inspired by `core/src/overrides/ModelBuilder.ts`.
*   Extended `BlockOperations` decorator/guard to protect prepared statements and query keys.
*   Tests or integration stories that verify blocked operations are no longer registered, complex queries remain available through `addComplexQueries`, and any tooling touching `sqaggre` annotations still finds the expected metadata.
*   Added `BulkOperationBlockTarget` so decorators can disable the entire bulk surface and updated the builder tests to cover both the query metadata wiring and the new bulk-all guard.
