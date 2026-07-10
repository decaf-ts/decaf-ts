# TASK-231: ESLint boundary + repoint for-angular imports

**ID:** TASK-231
**Specification:** [DECAF-35](../DECAF_35.md)
**Priority:** High
**Status:** Done

## 1. Description
Add an ESLint `no-restricted-imports` rule in for-angular that forbids importing `@decaf-ts/integrations/graph` (bare) and any `@decaf-ts/integrations/graph/*` subpath except `./shared`. Repoint all for-angular production imports that currently use `@decaf-ts/integrations/graph` to `@decaf-ts/integrations/graph/shared`. Leave the in-browser demo executor files (handled by TASK-232) with a temporary ESLint override.

## 2. Objectives
* [x] Add `no-restricted-imports` rule to for-angular ESLint config: block `@decaf-ts/integrations/graph` (bare) and `@decaf-ts/integrations/graph/*` pattern, allow `@decaf-ts/integrations/graph/shared`.
* [x] Repoint production imports: `SwitchNodeMetadata`, `SwitchCase`, `SwitchCaseCondition`, `ConditionExpression`, `CodeCondition`, `ExprValue`, `NodeMetadataChange` → `@decaf-ts/integrations/graph/shared`.
* [x] Repoint `GraphExecutionEventType` (used by `GraphExecutionStateMapper`) → `@decaf-ts/integrations/graph/shared`.
* [x] Add a temporary ESLint override for the demo executor files (`graph-demo-executors.ts`, `GraphExecutionService.ts`, `GraphExecutionEventSubjectObserver.ts`, `GraphExecutionStateMapper.spec.ts`) allowing `@decaf-ts/integrations/graph` until TASK-232 lands.
* [x] `npm run lint`, `npm run build`, `npm run test` in for-angular all pass.

## 3. Implementation Plan
**Proposed Changes:**
* Edit for-angular's ESLint config (`.eslintrc.json` or `eslint.config.js`) to add the `no-restricted-imports` rule with the pattern + allow list.
* Add an `overrides` entry for `src/graph/execution/{graph-demo-executors,GraphExecutionService,GraphExecutionEventSubjectObserver,GraphExecutionStateMapper.spec}.ts` that disables the rule (temporary, removed in TASK-232).
* Update import statements in:
  * `for-angular/src/graph/types.ts`
  * `for-angular/src/graph/utils.ts`
  * `for-angular/src/graph/components/graph-node-template/graph-node-template.component.ts`
  * `for-angular/src/graph/components/graph-switch-edit-modal/graph-switch-edit-modal.component.ts`
  * `for-angular/src/graph/components/graph-condition-editor/graph-condition-editor.component.ts`
  * `for-angular/src/graph/execution/GraphExecutionStateMapper.ts`

**Technical Details:**
* The `no-restricted-imports` pattern syntax: `{ "patterns": ["@decaf-ts/integrations/graph/*"], "allow": ["@decaf-ts/integrations/graph/shared"] }` blocks all subpaths except `./shared`. Add a separate entry for the bare `"@decaf-ts/integrations/graph"` string to block the full export.
* The temporary override uses `files: [...]` + `rules: { "no-restricted-imports": "off" }` so only the demo files are exempt.

## 4. Verification Plan
**Automated Tests:**
* [x] `npm run lint` in for-angular — 0 errors (production code clean, demo files exempt).
* [x] `npm run build` in for-angular — production build succeeds.
* [x] `npm run test` in for-angular — 42 tests pass.

**Manual Verification:**
* Temporarily change a production import back to `@decaf-ts/integrations/graph` and confirm lint fails.
* Confirm the demo files still import `@decaf-ts/integrations/graph` (full) without lint error.

## 5. Blockers & Clarifications
* Depends on TASK-230 (the `./graph/shared` export must exist).

## 6. Execution Log
* (pending)
