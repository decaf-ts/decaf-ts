# TASK-222: Comprehensive Tests — Planner, Execution, Loops, Store, Pinning, Observers, Angular Bridge

**ID:** TASK-222
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add comprehensive test coverage for the graph engine: planner tests, execution tests, store tests, pinning tests, loop tests, observer tests, and Angular integration tests, matching the full test list in DECAF-32 §11. Ensure unit coverage exists before integration cases, and avoid mocking unless file/network IO.

## 2. Objectives
*   [ ] Planner tests: one-node, multi-node, fan-out, fan-in, unknown source/target node, unknown source/target port, reject non-loop cycle, deterministic layers, loop nodes as ordinary executable, loop body validated separately.
*   [ ] Execution tests: single node, workflow input->node, node->workflow output, node->downstream, independent nodes same layer, async node, ordered events, missing executor, missing required input, full `GraphExecutionResult`, `GraphExecutionContext` is a Decaf `Context`, `context.progress(...)` works.
*   [ ] Store tests: in-memory default, custom adapter, write/read/delete cached, separate by workflow id, separate by fingerprint, run runtime values, store events.
*   [ ] Pinning tests: non-pinnable cannot be pinned, pinnable can be pinned after run, pin pins upstream, pin fails if upstream not pinnable, next run uses pinned values, cached executor not called, `NODE_CACHE_HIT`, `NODE_PINNED`, unpin removes cached value, fingerprint changes on input/dependency change, pinned value not reused on fingerprint mismatch.
*   [ ] Loop tests: foreach (per-item, ordered, events, max iterations, empty array, reject non-array, child path, serial stateful), while (condition true/false, condition events, max iterations, final state), until (at least once, stops when true, max iterations, final state).
*   [ ] Observer tests: observe registers, unregister function removes, `unObserve` removes, `updateObservers` awaits async, execution emits through observers, observer failure does not crash execution.
*   [ ] Angular integration tests: RxJS bridge receives events, `events$` emits, renderer marks node running on `NODE_STARTED`, edge active on `EDGE_VALUE_ROUTED`, node cached on `NODE_CACHE_HIT`, node pinned on `NODE_PINNED`, loop iteration state updates, workflow outputs on `WORKFLOW_COMPLETED`.

## 3. Implementation Plan
**Proposed Changes:**
*   Add test files under `tests/unit/graph/` (core) and `for-angular/src/graph/` (Angular).
*   Add integration test files under `tests/integration/graph/` where live coordination is needed.

**Technical Details:**
*   Follow the existing jest config (`jest.config.js`, `ts-jest`, `*.test.ts`).
*   Avoid mocking unless file/network IO; use real in-memory adapter for store/execution tests.

## 4. Verification Plan
**Automated Tests:**
*   [ ] All test files listed above.

**Manual Verification:**
*   Run `npm run test` in the relevant modules and confirm green.

## 5. Blockers & Clarifications
*   Depends on TASK-216 (loops), TASK-219 (pinning/cache-hit), TASK-221 (Angular UI).

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
