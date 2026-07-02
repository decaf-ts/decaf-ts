# TASK-218: Pinning Policy, Dependency Resolver, and Pinning Service with Fingerprints

**ID:** TASK-218
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Pending

## 1. Description
Implement the core pinning subsystem: `GraphPinningPolicy` (canPin/shouldUsePinnedValue), `GraphPinningDependencyResolver` (upstream dependency subtree, all-or-nothing in v1), and `GraphPinningService` (compute cache keys, pin/unpin, read pinned values, emit pinning events). Fingerprints must be stable and include workflow id, node id/kind, definition/executor versions, relevant inputs, and dependency fingerprints.

## 2. Objectives
*   [ ] Add `GraphPinningPolicy` reading `GraphPinningMetadata` from plan nodes.
*   [ ] Add `GraphPinningDependencyResolver` returning the upstream dependency set (excluding `$workflow`).
*   [ ] Add `GraphPinningService` with `pinNode`, `unpinNode`, `readPinnedValue`, `createValueKey`.
*   [ ] Pinning is all-or-nothing: if any upstream dependency is not pinnable, `pinNode` fails with `GraphPinningError`.
*   [ ] Unpin only unpins the selected node by default.
*   [ ] Fingerprints: stable JSON with recursively sorted keys + SHA-256 (stable JSON fallback for in-memory tests).
*   [ ] Emit `NODE_PINNED`, `NODE_UNPINNED` events.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `src/graph/pinning/GraphPinningPolicy.ts`, `GraphPinningDependencyResolver.ts`, `GraphPinningService.ts`, `GraphPinningMetadata.ts`, `index.ts`.
*   Update `src/graph/index.ts` exports.

**Technical Details:**
*   `createValueKey` builds a `GraphValueKey` from workflow, plan node, inputs, and dependency fingerprints.
*   `pinNode` resolves dependencies, verifies all are pinnable, writes pinned values for dependencies first, then the selected node.
*   Automatic pin strategy is metadata-supported but v1 default is manual.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/graph/GraphPinningPolicy.test.ts`
*   [ ] Unit Test: `tests/unit/graph/GraphPinningDependencyResolver.test.ts`
*   [ ] Unit Test: `tests/unit/graph/GraphPinningService.test.ts` (non-pinnable cannot be pinned, pin pins upstream, pin fails if upstream not pinnable, unpin removes cached value, fingerprint changes on input/dependency change, pinned value not reused on fingerprint mismatch).

**Manual Verification:**
*   Confirm all-or-nothing dependency pinning and fingerprint stability.

## 5. Blockers & Clarifications
*   Depends on TASK-212 (value store) and TASK-217 (pinning metadata).

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
