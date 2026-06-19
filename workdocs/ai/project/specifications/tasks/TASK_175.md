# TASK-175: Relocate request `Transformer` primitives to `for-http/server`

**ID:** TASK-175
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** Medium
**Status:** Complete

## 1. Description
`for-nest/src/ram/RamRequestTransformer.ts` (`RamTransformer`) and the `RequestToContextTransformer`/`requestToContextTransformer` it imports from `for-nest/src/interceptors/context.ts` are framework-agnostic request-shape-to-context mappers with no Nest-specific dependency. Move them into `for-http/src/server/` alongside the other primitives, re-exporting from `for-nest` so existing imports keep working.

## 2. Objectives
*   [x] Move `RequestToContextTransformer`/`requestToContextTransformer` (currently `for-nest/src/interceptors/context.ts`) into `for-http/src/server/` (e.g. `transformers/types.ts` or similar).
*   [x] Move `RamTransformer` (currently `for-nest/src/ram/RamRequestTransformer.ts`) into `for-http/src/server/transformers/`.
*   [x] Add re-export shims at the old `for-nest` paths so existing consumers do not break.
*   [x] Update every internal `for-nest` import of these to the new `for-http/server` location (the shims are for external consumers, not for `for-nest`'s own code).

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-http/src/server/transformers/` with the relocated files, exported from `for-http/src/server/index.ts`.
*   Replace `for-nest/src/interceptors/context.ts` and `for-nest/src/ram/RamRequestTransformer.ts` with thin re-export files pointing at `@decaf-ts/for-http`.
*   Grep `for-nest/src` for internal imports of the old paths and update them to the new `for-http/server` import.

**Technical Details:**
*   `for-nest` already depends on `@decaf-ts/for-http`, so no new dependency wiring is needed.
*   Confirm `RamTransformer`'s commented-out `@requestToContextTransformer("ram")` decorator usage — decide whether to re-enable it as part of this move or leave it as-is (out of scope unless trivial).

## 4. Verification Plan
**Automated Tests:**
*   [x] Existing `for-nest` tests referencing these transformers continue to pass unchanged (via the re-export shims).
*   [x] New `for-http` unit test covering `RamTransformer.from(...)` behavior (currently untested in either location).

**Manual Verification:**
*   Confirm `import { RamTransformer } from "@decaf-ts/for-nest"` (old path) and `import { RamTransformer } from "@decaf-ts/for-http"` (new path) both resolve to the same implementation.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   Implemented in `for-http/src/server/transformers/` with compatibility shims retained in `for-nest`.
