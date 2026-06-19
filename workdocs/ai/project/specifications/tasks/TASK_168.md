# TASK-168: Verb-specific route decorators in `for-http/server`

**ID:** TASK-168
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
`for-http/src/server/decorators.ts` only exports the generic `route(httpMethod, path)` decorator. Add one decorator per HTTP verb (`get`, `post`, `put`, `patch`, `del`) that simply calls `route(verb, path)`, and audit `for-nest` for any place that builds route decoration logic itself instead of going through `for-http/server`.

## 2. Objectives
*   [x] Add `get(path)`, `post(path)`, `put(path)`, `patch(path)`, and `del(path)` to `for-http/src/server/decorators.ts`, each a thin wrapper around `route(verb, path)`. **Naming correction (2026-06-19 review, verified with `tsc`):** a function/decorator literally named `delete` is a `SyntaxError` - `delete` is a reserved keyword in JS/TS and cannot be a `BindingIdentifier` (`export function delete(path) {}` fails to compile: `tsc` reports `TS1359: Identifier expected. 'delete' is a reserved word`; using it at a call site like `@delete("/foo")` would also misparse as the `delete` *operator* applied to `("/foo")`, not a decorator call). The fifth decorator is exported as `del` per user direction.
*   [x] Export the new decorators from `for-http/src/server/index.ts`.
*   [x] Enumerate every place in `for-nest/src` that currently maps an HTTP verb to a Nest decorator (`for-nest/src/decaf-model/decorators/ApiOperationFromModel.ts` maps verbs to `@Get`/`@Post`/etc. from `@nestjs/common` directly) and confirm whether that logic should keep using Nest's own decorators (it must - `for-http/server`'s verb decorators are for framework-agnostic route *metadata*, not a replacement for Nest's HTTP wiring) or whether it should additionally read `for-http/server`'s `route` metadata.

## 3. Implementation Plan
**Proposed Changes:**
*   Add the five verb-decorator exports to `for-http/src/server/decorators.ts`.
*   Update `for-http/src/server/index.ts` if exports need to be added explicitly (currently a blanket `export * from "./decorators"`, so likely no change needed there beyond adding the functions).

**Technical Details:**
*   Each decorator must produce metadata identical to calling `route(verb, path)` directly - i.e. `get("/x")` and `route("GET", "/x")` must be indistinguishable to any consumer reading `ServerKeys.ROUTE` metadata.
*   Do not rename or remove the existing `route()` export; the verb decorators are additive sugar.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit test in `for-http/tests/unit` asserting each verb decorator produces the same metadata as the equivalent `route(verb, path)` call.

**Manual Verification:**
*   Decorate a sample method with `@get("/foo")` and confirm `Metadata.get(...)` returns the expected `{ path, httpMethod: "GET", handler }`.

## 5. Blockers & Clarifications
*   **Resolved:** The fifth decorator is `del(...)` rather than `delete(...)` because `delete` is reserved and the user requested the `del` alias.
*   `for-http` currently has zero test files touching `server/` at all (confirmed 2026-06-19: no `for-http/tests/unit/*server*|*controller*|*route*`) - the unit test in Objective/Verification will be the first in this area; a reasonable new path is `for-http/tests/unit/server-decorators.test.ts`.

## 6. Execution Log
*   [2026-06-19] - Implemented `get`/`post`/`put`/`patch`/`del` wrappers over `route(...)`, confirmed `for-nest` should keep using Nest decorators for HTTP wiring, and added parity tests against the generic route metadata.
