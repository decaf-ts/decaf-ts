# TASK-152: Redesign and implement @throttle() API

**ID:** TASK-152
**Specification:** [Link to Specification](../DECAF_23.md)
**Priority:** High
**Status:** Completed

## 1. Description
Rewrite `core/src/utils/throttling.ts` to expose the new enum-driven API described in DECAF-23. The existing implementation uses raw config objects and has no exported splitter helpers. This task replaces that surface with `ThrottleMode`, `ThrottleSplitter`, `ThrottleOptions`, `splitByCount`, `splitBySize`, and updated decorator overloads while keeping the Proxy-wrapping and multi-arg-index mechanics intact.

## 2. Objectives

*   [ ] Define and export `ThrottleMode` enum (`BY_COUNT`, `BY_SIZE`).
*   [ ] Define and export `ThrottleSplitter<T>` type alias.
*   [ ] Define and export `ThrottleOptions` interface (`delayMs?`, `argIndex?`, `breakOnSingleFailure?`).
*   [ ] Implement and export `splitByCount<T>(count: number): ThrottleSplitter<T>`.
*   [ ] Implement and export `splitBySize<T>(maxBytes: number): ThrottleSplitter<T>`.
*   [ ] Implement typed `throttle()` overloads: `(number, options?)`, `(number, ThrottleMode, options?)`, `(ThrottleSplitter, options?)`.
*   [ ] `throttle(5)` defaults to `ThrottleMode.BY_COUNT`.
*   [ ] Proxy-based wrapping preserved; `argIndex` defaults to `0`.
*   [ ] `breakOnSingleFailure` resolves from `ThrottleOptions` then `ctx.get("breakOnSingleFailureInBulk")`, defaulting `true`.
*   [ ] Remove `BseThrottlingConfig`, `ThrottlingConfig`, `buildChunkBounds`.
*   [ ] Keep `estimateEntrySize`, `safeByteLength`, `mergeResult` as internal utilities.
*   [ ] All new types/functions exported from `core/src/utils/index.ts`.

## 3. Implementation Plan

**Proposed Changes:**

*   Replace `throttling.ts` content:
    - Add `ThrottleMode` enum.
    - Add `ThrottleSplitter<T>`, `ThrottleOptions`.
    - Implement `splitByCount`: `(items) => { chunks = []; for i=0; i<items.length; i+=count { chunks.push(items.slice(i, i+count)) } return chunks; }`.
    - Implement `splitBySize`: iterates items, accumulates byte estimate via `safeByteLength`; opens a new chunk whenever adding the next item would exceed `maxBytes`. Always emits at least one chunk.
    - Rewrite `throttle()` as an overloaded function with a single implementation signature that:
      1. Resolves the splitter: if first arg is a function → use directly; if number + `BY_SIZE` → `splitBySize`; otherwise → `splitByCount`.
      2. Normalises `options` (last arg, optional).
      3. Registers metadata via `apply(methodMetadata(...), ...)`.
      4. Wraps the method in a Proxy that: calls `logCtx`, normalises `argIndex`, validates targets are arrays of equal length, calls `splitter(arrays[primaryIndex])` to get chunk bounds, maps other indexed args by the same offsets, iterates chunks with optional `delayMs`, collects results via `mergeResult`, aggregates errors if `breakOnSingleFailure=false`.
*   Update `core/src/utils/index.ts` to export `ThrottleMode`, `ThrottleSplitter`, `ThrottleOptions`, `splitByCount`, `splitBySize`.

**Technical Details:**

*   `splitBySize` uses the same `safeByteLength` helper to estimate each entry. When a single item exceeds `maxBytes` it forms a chunk on its own (never silently dropped).
*   For multi-index support: the splitter is applied to `arrays[primaryIndex]` (first in `normalizedIndices`). The resulting chunk boundaries (start/end pairs) are then used to slice all other indexed arrays at the same positions.
*   The Proxy `apply` must `await` the delay with `setTimeout` wrapped in a `Promise`, same as the current implementation.

## 4. Verification Plan

**Automated Tests:**
*   [ ] Unit tests added in TASK-153 must pass after this change.
*   [ ] Existing `core/tests/unit/throttle.test.ts` tests must pass (update call sites to new API).
*   [ ] `core` build (`npm run build`) must pass.

**Manual Verification:**
*   Import `splitByCount`, `splitBySize`, `ThrottleMode` from `@decaf-ts/core` and confirm types resolve correctly in a TS consumer.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-06-09] - Task created.
*   [2026-06-09] - Implemented: `ThrottleMode`, `ThrottleSplitter`, `ThrottleOptions`, `splitByCount`, `splitBySize`, typed overloads, `buildChunkArgsList`. Removed `BseThrottlingConfig`, `ThrottlingConfig`, `buildChunkBounds`. Guard added for `ctx.get("breakOnSingleFailureInBulk")` to handle absent key. Build passes.
