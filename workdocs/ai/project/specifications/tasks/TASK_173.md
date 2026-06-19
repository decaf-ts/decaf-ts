# TASK-173: Implement `ModelControllerFactory`

**ID:** TASK-173
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
Build `ModelControllerFactory` in `for-http/src/server/controllers/`, using `ModelControllerBuilder` (TASK-171/172), accepting a per-model configuration object with granular toggles for which route classes to expose, defaulting to today's for-nest behavior (everything enabled) so existing consumers see no change on upgrade.

## 2. Objectives
*   [ ] Define `ModelControllerFactoryConfig` with at least: `allowStatementlessQuery: boolean`, `allowGroupingQueries: boolean | { count?, avg?, max?, min?, sum?, distinct?, group? }`, `allowBulkStatement: boolean | { create?, read?, update?, delete? }`.
*   [ ] Implement `ModelControllerFactory.create(ModelConstr, persistence, config?)` that builds a `ModelControllerBuilder`, conditionally calling its `add*Route` helpers based on `config`, and returns the built controller class.
*   [ ] All `config` fields must default such that omitting `config` entirely reproduces today's for-nest route surface (everything for-nest currently exposes stays exposed).

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-http/src/server/controllers/ModelControllerFactory.ts` and accompanying config type in `for-http/src/server/types.ts` (or a new `controllers/types.ts`). Recommendation (2026-06-19 review): a new `controllers/types.ts` is the better fit — `for-http/src/server/types.ts` currently holds only the generic, non-controller-specific `HttpVerbs`/`ServerRouteDecOptions`/etc., while `controllers/` already has its own `models.ts` for controller-layer types (`RouteParam`, `RouteResponse`, `ServerRoute`); keeping `ModelControllerFactoryConfig` alongside them is more consistent than growing the top-level `types.ts`.
*   Wire each config field to the corresponding `ModelControllerBuilder` helper(s) from TASK-171: `allowStatementlessQuery` gates `addComplexQueryRoute`/direct query exposure vs. forcing callers through `addStatementRoute` only; `allowGroupingQueries` gates `addGroupingQueryRoute` (per-aggregation when given an object); `allowBulkStatement` gates the four bulk helpers (per-operation when given an object, e.g. enabling create/read/delete but not update).

**Technical Details:**
*   `allowBulkStatement: { update: false }` (with other bulk operations implicitly `true`) must result in every bulk route except bulk-update being registered — implement granular config as "object present overrides only the keys it specifies, booleans not specified default to the top-level boolean or `true`."
*   Keep this factory free of Nest-specific imports; it must be usable by any future framework adapter.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit test: default config (no `config` argument) reproduces today's full for-nest route surface for a sample model.
*   [ ] Unit test: each boolean toggle (`false`) removes the corresponding route class entirely.
*   [ ] Unit test: granular object config (e.g. `allowBulkStatement: { update: false }`) removes only the targeted sub-route.

**Manual Verification:**
*   N/A — covered by automated tests; manual spot-check optional.

## 5. Blockers & Clarifications
*   Depends on TASK-171 (and ideally TASK-172's parity proof, to know the exact full-default route set to reproduce).

## 6. Execution Log
*   Implemented `ModelControllerFactory` and added default/granular config coverage. The factory now defaults to the current for-nest route surface, can suppress statementless query routes, and supports granular bulk toggles.
