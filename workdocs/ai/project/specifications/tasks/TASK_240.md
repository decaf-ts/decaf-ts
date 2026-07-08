# TASK-240: Configuration Provider Tokens (GRAPH_HISTORY_LIMIT, GRAPH_AUTOSAVE_DEBOUNCE_MS)

**ID:** TASK-240
**Specification:** [DECAF-36](../DECAF_36.md)
**Priority:** Medium
**Status:** Completed

## 1. Description
Create Angular injection tokens for configurable graph settings: `GRAPH_HISTORY_LIMIT` (default 10) and `GRAPH_AUTOSAVE_DEBOUNCE_MS` (default 500). Register default providers in the graph module so consumers can override at app bootstrap.

## 2. Objectives
*   [ ] Create `GRAPH_HISTORY_LIMIT` injection token (default 10).
*   [ ] Create `GRAPH_AUTOSAVE_DEBOUNCE_MS` injection token (default 500).
*   [ ] Register default providers in `for-angular/src/graph/for-angular-graph.module.ts`.
*   [ ] Document override pattern in module docs.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-angular/src/graph/tokens/graph-configuration.tokens.ts`.
*   Update `for-angular/src/graph/for-angular-graph.module.ts` to register providers.
*   Inject tokens in `GraphHistoryService` and `GraphAutoSaveService`.

**Technical Details:**
*   Use Angular `InjectionToken<T>` pattern.
*   `@Inject()` in service constructors.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: verify services receive configured values when tokens overridden.

**Manual Verification:**
*   Override `GRAPH_HISTORY_LIMIT` to 3 in app module, verify history evicts after 3 pushes.

## 5. Blockers & Clarifications
*   Depends on TASK-234 and TASK-236 (services that consume the tokens).

## 6. Execution Log
*(empty)*
