# TASK-219: Engine Cache-Hit Behavior + Pin/Unpin API Delegation + Snapshot Patch Mapper

**ID:** TASK-219
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Pending

## 1. Description
Wire pinning into the engine: during node execution, when `usePinnedValues` is enabled and a node has a valid pinned value, load it from the store, emit `NODE_CACHE_HIT` and `NODE_COMPLETED` with status `CACHED`, skip executor execution, and route outgoing edges. Expose `pinNode`/`unpinNode` on `GraphExecutionEngine` delegating to `GraphPinningService`. Add `GraphExecutionSnapshotMapper` producing `GraphExecutionSnapshotPatch`.

## 2. Objectives
*   [ ] Add cache-hit branch to the node execution algorithm (resolve inputs -> compute key -> read pinned -> if pinned, set outputs, emit `NODE_CACHE_HIT`, emit `NODE_COMPLETED` with `CACHED`, route edges, skip executor).
*   [ ] Expose `pinNode(options)` and `unpinNode(options)` on `GraphExecutionEngine`, delegating to `GraphPinningService`.
*   [ ] Add `GraphExecutionSnapshotMapper` mapping `GraphExecutionResult` -> `GraphExecutionSnapshotPatch` (runId, status, nodes, edges, outputs, events).
*   [ ] Optional write-through cache when `writeThroughCache` is enabled and node is pinnable.

## 3. Implementation Plan
**Proposed Changes:**
*   Update `src/graph/execution/GraphExecutionEngine.ts` to add the cache-hit branch and pin/unpin API.
*   Create `src/graph/snapshots/GraphExecutionSnapshotMapper.ts`, `index.ts`.
*   Update `src/graph/index.ts` exports.

**Technical Details:**
*   Preferred architecture: engine owns execution, pinning service owns pin/unpin, engine delegates.
*   Snapshot patch must be consumable by `ui-decorators/graph` snapshots (do not replace the snapshot system).

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/graph/GraphExecutionEngine.cacheHit.test.ts` (next run uses pinned values, cached executor not called, `NODE_CACHE_HIT` emitted).
*   [ ] Unit Test: `tests/unit/graph/GraphExecutionSnapshotMapper.test.ts`

**Manual Verification:**
*   Confirm a pinned node is reused on the next run and the executor is not invoked.

## 5. Blockers & Clarifications
*   Depends on TASK-214 (engine) and TASK-218 (pinning service).

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
