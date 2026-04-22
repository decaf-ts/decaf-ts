# TASK-105 analysis — controller pipeline & BlockOperations

## Controller pipeline
- `FromModelController.create` builds a `DynamicModelController` that extends `DecafModelController` plus the query-only base returned by `createQueryRoutesFromRepository`. All query-amplifying metadata (`DECAF_ROUTE`, `PersistenceKeys.QUERY`) is applied inside that helper.
- The body of `DynamicModelController` contains every HTTP handler (CRUD, bulk, prepared statement, named query, list/paginate/find helpers) decorated with Swagger/Nest metadata; each method resolves the persistence layer via `this.persistence(ctx)` and calls repository or service methods directly.
- Static helpers such as `getRouteParametersFromModel` already expose the composed PK path, which is re-used by the controller constructor and the `@DecafParams` decorator.

## BlockOperations usage
- `@BlockOperations` is defined in `db-decorators/src/operations/decorators.ts` and stores metadata under `OperationKeys.REFLECT + OperationKeys.BLOCK` via `storeHandlerMetadata`. It currently only accepts `CrudOperations[]`.
- `core/src/utils/utils.ts` exposes `isOperationBlocked(Model, CrudOperations)` that reads that metadata and invokes the stored handler. The only current runtime consumer is `core/src/utils/decorators.ts`, where `OperationGuard` rethrows when the model is blocked.

## sqaggre metadata
- A repository-wide search for `sqaggre` returned no implementation in source files—only the DECAF-10 spec mentions it. That probably means the builder must be ready to copy such metadata when introduced, but there is no existing producer to inspect today.

## Update
- The new builder now replays the dynamic controller pipeline, copes with `@BlockOperations` blocking for CRUD/bulk/statements, and can propagate any future `sqaggre` annotations by copying the static metadata onto the generated prototypes.
