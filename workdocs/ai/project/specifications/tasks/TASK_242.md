# TASK-242: Backend Architecture Refactor — Adapter-Agnostic Module, @service(Model) Services, Context Propagation

**ID:** TASK-242
**Specification:** [DECAF-36](../DECAF_36.md)
**Priority:** High
**Status:** Completed

## 1. Description
Refactor the graph execution backend to follow proper Decaf-ts architecture:
- Remove hardcoded `RamAdapter` from `GraphExecutionModule` — make it adapter-agnostic.
- Remove `@uses(RAM_FLAVOUR)` from models — make them flavour-agnostic.
- Replace raw repository injection tokens (`GRAPH_RESULT_REPOSITORY`, `GRAPH_WORKFLOW_REPOSITORY`) with `@service(Model)`-decorated `ModelService` subclasses.
- Controller MUST inject services (not repositories) and pass `DecafRequestContext` to all service calls for automatic user propagation.
- Delete `GraphExecutionResultRepository.ts` and `GraphWorkflowRepository.ts` (no longer needed).

## 2. Objectives
*   [ ] `GraphExecutionResultModel` and `GraphWorkflowModel` have no `@uses(...)` — bind to `Adapter.currentFlavour`.
*   [ ] `GraphResultService extends ModelService<GraphExecutionResultModel>` with `@service(GraphExecutionResultModel)`.
*   [ ] `GraphWorkflowService extends ModelService<GraphWorkflowModel>` with `@service(GraphWorkflowModel)`.
*   [ ] `GraphExecutionController` injects services via constructor DI, passes `DecafRequestContext` as trailing context arg.
*   [ ] `GraphExecutionModule` does not hardcode `RamAdapter`; `initAdapter` option bootstraps RamAdapter for standalone dev only.
*   [ ] Remove `GRAPH_RESULT_REPOSITORY` / `GRAPH_WORKFLOW_REPOSITORY` injection tokens.
*   [ ] Delete `GraphExecutionResultRepository.ts` and `GraphWorkflowRepository.ts`.
*   [ ] All existing graph tests pass.

## 3. Implementation Plan
**Proposed Changes:**
*   Rewrite `GraphExecutionResultModel.ts` — remove `@uses(RAM_FLAVOUR)`.
*   Rewrite `GraphWorkflowModel.ts` — remove `@uses(RAM_FLAVOUR)`.
*   Create `GraphResultService.ts` — `@service(GraphExecutionResultModel)` extending `ModelService`.
*   Create `GraphWorkflowService.ts` — `@service(GraphWorkflowModel)` extending `ModelService`.
*   Rewrite `GraphExecutionController.ts` — inject services, pass `DecafRequestContext`.
*   Rewrite `GraphExecutionModule.ts` — adapter-agnostic, provide services directly.
*   Delete `GraphExecutionResultRepository.ts`, `GraphWorkflowRepository.ts`.
*   Update `index.ts` exports.

**Technical Details:**
*   `ModelService` from `@decaf-ts/core` provides all CRUD methods with context propagation via `logCtx(args, op)`.
*   `@service(Model)` class decorator registers the service as a singleton injectable.
*   `DecafRequestContext` from `@decaf-ts/for-nest` is request-scoped, carries auth user/roles/org via `ctx.accumulate(...)`.
*   `@Optional()` injection of `DecafRequestContext` allows standalone use without `DecafCoreModule`.

## 4. Verification Plan
**Automated Tests:**
*   [ ] All existing graph unit tests pass (172 tests).
*   [ ] All existing e2e tests pass (9 tests).
*   [ ] `npm run build` clean in `integrations`.
*   [ ] `npm run lint` clean in `integrations`.

**Manual Verification:**
*   Start backend standalone — verify adapter bootstraps and endpoints work.
*   Verify service methods receive context when `DecafRequestContext` is available.

## 5. Blockers & Clarifications
*   The unit test `graph-execution-module.test.ts` calls `controller.execute()` directly (not via HTTP), so `DecafRequestContext` is not injected via NestJS DI. The `@Optional()` injection handles this (undefined context).

## 6. Execution Log
*   [Date] - Started task.
*   [Date] - Rewrote models (removed `@uses(RAM_FLAVOUR)`), created `GraphResultService` and `GraphWorkflowService` with `@service(Model)`, rewrote controller to inject services + `DecafRequestContext`, rewrote module to be adapter-agnostic, deleted old repository files and injection tokens.
*   [Date] - Updated unit tests to use services instead of repository tokens. Added PUT endpoint test. All 173 graph tests pass, build clean, lint clean.
