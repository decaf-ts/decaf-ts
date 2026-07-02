# TASK-212: Configurable Value Store Adapter API + In-Memory Adapter + Runtime Wrapper

**ID:** TASK-212
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Completed

## 1. Description
Define the configurable graph value store contract (`GraphValueStoreAdapter`), provide the default `InMemoryGraphValueStoreAdapter`, define `GraphValueKey`/`GraphCachedValue`, and add the `GraphValueStore` runtime wrapper that holds runtime values for the current execution and delegates persistent/cache/pinned values to the adapter.

## 2. Objectives
*   [x] Add `GraphValueKey` (`workflowId`, `nodeId`, `fingerprint`, optional `namespace`/`version`).
*   [x] Add `GraphCachedValue` (`key`, `outputs`, `pinned`, `createdAt`, `updatedAt`, optional `expiresAt`/`metadata`).
*   [x] Add `GraphValueStoreAdapter` interface with `read`, `write`, `delete`, `has`, and optional `list`, `clearRun`, `readRuntimeValues`, `writeRuntimeValues`.
*   [x] Add `InMemoryGraphValueStoreAdapter` as the default.
*   [x] Add `GraphValueStore` with `seedWorkflowInputs`, `setNodeOutputs`, `getPort`, `hasPort`, `setWorkflowOutput`, `getWorkflowValues`, `readCached`, `writeCached`, `deleteCached`, `snapshot`.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `src/graph/store/GraphValueKey.ts`, `GraphCachedValue.ts`, `GraphValueStoreAdapter.ts`, `InMemoryGraphValueStoreAdapter.ts`, `GraphValueStore.ts`, `index.ts`.
*   Update `src/graph/index.ts` exports.

**Technical Details:**
*   `GRAPH_WORKFLOW_BOUNDARY` (`$workflow`) is used as the runtime-values key for workflow inputs/outputs.
*   The in-memory adapter serializes keys as `namespace:workflowId:nodeId:version:fingerprint`.
*   The runtime wrapper must not assume any specific adapter implementation.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: `tests/unit/graph/InMemoryGraphValueStoreAdapter.test.ts`
*   [x] Unit Test: `tests/unit/graph/GraphValueStore.test.ts`

**Manual Verification:**
*   Confirm values are separated by workflow id and fingerprint.
*   Confirm runtime values and cached values are distinct.

## 5. Blockers & Clarifications
*   None anticipated.

## 6. Execution Log
*   [completed] - Implemented during DECAF-32.
