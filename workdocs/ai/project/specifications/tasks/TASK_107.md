# TASK-107: Extend `BlockOperations` to cover statements and query keys

**ID:** TASK-107
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
Expand the current `@decaf-ts/db-decorators`/`@decaf-ts/core` `BlockOperations` guard so it can also be used to block prepared statements (e.g., `PreparedStatementKeys.LIST_BY`, `PreparedStatementKeys.PAGE`) and repository query keys (`PersistenceKeys.QUERY`). The new metadata should allow `DecafModelControllerBuilder` to ask whether a CRUD operation, statement, or query route is disallowed before registering it.

## 2. Objectives
*   [ ] Add new decorator payloads that register statement/query identifiers in addition to `CrudOperations`.
*   [ ] Update `core/src/utils/utils.ts` (and any consumers) so `isOperationBlocked` can answer whether a given CRUD operation, prepared statement, or query is blocked.
*   [ ] Keep the decorator API backwards compatible so existing `@BlockOperations([OperationKeys.CREATE])` users continue to work without change.

## 3. Implementation Plan
**Proposed Changes:**
*   Extend the `BlockOperationIf`/`BlockOperations` helpers in `db-decorators` so they can store metadata describing the block target type (`crud`, `statement`, `query`) and its identifier/enum value.
*   Update `core/src/utils/utils.ts` so `isOperationBlocked(ModelConstructor, targetType, identifier)` returns `true` whenever the metadata matches, while still supporting the old single-parameter form.
*   Document how to call `@BlockOperations` to disable `PreparedStatementKeys` like `listBy`/`find` and repository queries defined via `PersistenceKeys.QUERY`.

**Technical Details:**
*   Use a tagged union for the metadata payload (e.g., `{ kind: "crud", value: CrudOperations.CREATE }`, `{ kind: "statement", value: PreparedStatementKeys.PAGE_BY }`).
*   Ensure the metadata key remains `OperationKeys.REFLECT + OperationKeys.BLOCK` so existing decorators still work.
*   Update any helpers (e.g., `core/utils/decorators.ts`) that rely on `isOperationBlocked` to pass the new parameters when checking statements/queries.

## 4. Verification Plan
**Automated Tests:**
*   Add unit tests for `isOperationBlocked` that cover CRUD, statement, and query targets.
*   Add regression tests that run the previously documented model controllers and assert blocked statements/queries are not registered.

**Manual Verification:**
*   Apply `@BlockOperations` to block a prepared statement and verify the controller no longer exposes the corresponding Nest route.

## 5. Blockers & Clarifications
*   Decide whether query keys should be passed as strings or enums; prefer reusing `PreparedStatementKeys`/`PersistenceKeys` constants for clarity.

## 6. Execution Log
-   [x] Extended `BlockOperations` metadata to support statement/query/bulk descriptors and updated guards/tests to exercise the richer `isOperationBlocked` signature.
-   [x] Added the `BulkOperationBlockTarget` descriptor so `@BlockOperations` can macro-block every bulk endpoint in a single statement.
