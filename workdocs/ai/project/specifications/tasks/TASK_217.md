# TASK-217: @pinnable Decorator in ui-decorators/graph + Pinning Metadata Reader

**ID:** TASK-217
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add the `@pinnable()` decorator and `GraphPinningMetadata` shape to `@decaf-ts/ui-decorators/graph` (the preferred long-term home), and ensure the graph definition readers expose pinning metadata so the Angular renderer and the core pinning policy can consume it. If extending `ui-decorators` types immediately is not desirable, implement a temporary decorator in `@decaf-ts/integrations/graph` with a clear migration note.

## 2. Objectives
*   [ ] Add `GraphPinnableOptions` and `GraphPinningMetadata` (`enabled`, `ttlMs?`, `strategy: "manual" | "automatic" | "disabled"`, `includeDependencies`, `metadata?`).
*   [ ] Add `@pinnable(options)` class decorator storing metadata under `GRAPH_PINNING_METADATA_KEY`.
*   [ ] Expose pinning metadata on `GraphNodeDefinition` (preferred: first-class `pinnable?: GraphPinningMetadata`; alternative: `node.graph.metadata.pinnable`).
*   [ ] Ensure `graphDefinitionOf(...)` / `graphNodeMetadataOf(...)` surface pinning metadata.
*   [ ] Default metadata: `{ enabled: true, strategy: "manual", includeDependencies: true }`.

## 3. Implementation Plan
**Proposed Changes:**
*   Add decorator and metadata in `ui-decorators/src/graph`.
*   Extend graph definition types/readers to surface pinning metadata.
*   Update `ui-decorators` exports and tests.

**Technical Details:**
*   Keep the decorator framework-neutral (no Angular/RxJS/Mastra).
*   Follow the existing `@node(...)`/`@port(...)` composition patterns in `ui-decorators/graph`.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `ui-decorators/tests/unit/graph.pinnable.test.ts`

**Manual Verification:**
*   Confirm a decorated class surfaces pinning metadata through the graph readers.

## 5. Blockers & Clarifications
*   **Clarification 1:** First-class `pinnable?` field on `GraphNodeDefinition` vs `node.graph.metadata.pinnable` — preferred first-class field; decide at implementation time.

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
