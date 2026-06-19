# TASK-174: Composed-PK-aware route generation in `ModelControllerFactory`

**ID:** TASK-174
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
Make `ModelControllerFactory` (TASK-173) aware of `@composed()` primary keys: derive route paths from the composed metadata, register fallback routes for every combination the composed decorator's `filterEmpty` option allows to be omitted, and drive overall statement/query route coverage from the actual `PreparedStatementKeys`/`PersistenceKeys` enums rather than hardcoded strings.

## 2. Objectives
*   [ ] When `Model.pk(ModelConstr)` resolves to a property decorated with `composed(...)` (`db-decorators/src/model/decorators.ts`), read its metadata (`DBKeys.COMPOSED` — the same metadata `for-nest/src/decaf-model/FromModelController.ts`'s `getRouteParametersFromModel` already reads: `args`, `separator`, `filterEmpty`, `hash`, `prefix`, `suffix`) to build the route path (`:key1/:key2/...`).
*   [ ] When `filterEmpty` permits one or more composed parts to be omitted, register the additional route variants needed so every legal present/absent combination of those parts resolves to a working route, not just the all-parts-present case.
*   [ ] Enumerate the full statement/query surface from `PreparedStatementKeys` (`core/src/query/constants.ts`) and `PersistenceKeys.{QUERY,STATEMENT}` (`core/src/persistence/constants.ts`) so `ModelControllerFactoryConfig` (TASK-173) and `ModelControllerBuilder` (TASK-171) stay in sync with the enum automatically, rather than needing a manual update whenever a new prepared statement is added.

## 3. Implementation Plan
**Proposed Changes:**
*   Add composed-PK path derivation to `ModelControllerFactory`/`ModelControllerBuilder`, reusing the existing metadata-reading logic from `FromModelController.getRouteParametersFromModel` as a reference implementation (move or share it, do not silently duplicate it long-term).
*   Iterate `Object.values(PreparedStatementKeys)` / the relevant `PersistenceKeys` members when building the default route set, instead of writing out each name by hand.

**Technical Details:**
*   `filterEmpty` on `composed(...)` can be `boolean | string[]` — `true` means any part may be omitted, an array names which specific parts may be omitted. Route fallback generation must honor both forms.
*   Confirm against an existing model fixture with a composed PK that the generated routes actually resolve for every legal combination before calling this done — **no need to construct one** (2026-06-19 review): `for-nest/tests/unit/ProductMarket.ts` and `for-nest/tests/e2e/fakes/models/{Product,ProductAdmin}.ts` already exist as composed-PK fixtures in `for-nest`, as do `core/tests/e2e/models/{Market,Leaflet,Batch,LeafletFile}.ts` in `core`, `for-http/tests/unit/composed-model.test.ts` in `for-http`, and `db-decorators/tests/unit/composed.test.ts` for the decorator itself. Reuse one of these rather than authoring a new fixture.
*   `FromModelController.getRouteParametersFromModel` (`for-nest/src/decaf-model/FromModelController.ts:1052-1086`) is the exact reference implementation to read: it pulls `Metadata.get(ModelClazz, Metadata.key(DBKeys.COMPOSED, pk))`, dedupes `composed.args` (falling back to `[pk]` if not composed), joins into `:key1/:key2` via `path = ':' + uniqueKeys.join('/:')`, and builds `getPK` via `composed.separator`. Confirmed it reads only `args`/`separator` — it never touches `filterEmpty`, which is exactly why no fallback routes exist today.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit test: a model with a non-optional composed PK (`filterEmpty: false`) produces exactly one read/update/delete path shape.
*   [ ] Unit test: a model with `filterEmpty: true` (or a specific array) produces the full set of fallback routes for every legal omission combination.
*   [ ] Unit test: the generated statement/query route set matches `Object.values(PreparedStatementKeys)` with no manual drift.

**Manual Verification:**
*   Exercise the generated routes against a composed-PK model end-to-end (e.g. via an integration test hitting the assembled controller) to confirm no combination 404s.

## 5. Blockers & Clarifications
*   Depends on TASK-173.
*   **Clarification:** Confirm whether existing `for-nest` consumers already rely on composed-PK route behavior that must remain byte-for-byte identical (current `FromModelController.getRouteParametersFromModel` does **not** generate fallback routes for omitted composed parts at all today — this is new coverage, not a like-for-like port, so it should not change today's default route paths, only add the missing fallbacks).

## 6. Execution Log
*   Extended `ModelControllerFactory` to generate composed-PK fallback CRUD routes when `filterEmpty` allows trailing omissions, and added granular grouping-config coverage for the object form.
