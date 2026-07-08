# DECAF-36 — Graph Canvas Save/Auto-Save & Undo/Redo

**Status:** Completed — all 8 tasks implemented. Save button, Auto-Save toggle, Undo/Redo with ring buffer history, keyboard shortcuts, mutation detection, backend PUT endpoint. 60 for-angular tests + 172 graph tests pass.
**Priority:** High
**Owner:** decaf-dev

## 1. Overview

This specification adds explicit save, auto-save, and undo/redo controls to the graph canvas in `@decaf-ts/for-angular/graph`.

Today the graph canvas persists workflow state implicitly (via the `GraphNodeConfigStore` snapshot round-trip and the NestJS backend execution endpoint). There is no user-facing **Save** button, no **Auto-Save** toggle, and no **Undo/Redo** history. Users have no way to explicitly persist an in-progress workflow, no way to revert accidental changes, and no safety net when auto-save is disabled.

This spec introduces:

1. A **Save Workflow** button on the canvas toolbar (top-right, aligned with the existing **Start** button).
2. An **Auto-Save** toggle (default **off**) next to the Save button.
3. When **Auto-Save** is ON: every workflow mutation (node positioning, connecting/disconnecting edges, toggling ports, saving a node CRUD modal) triggers an immediate backend save of the full workflow definition/state.
4. When **Auto-Save** is OFF: the graph engine provides a Decaf `@service`-decorated `GraphHistoryService` that caches workflow snapshots in memory up to a configurable limit (default **10**). It supports **multiple workflows concurrently** (keyed by workflow ID). Undo/Redo buttons on the toolbar revert the canvas to previously cached states.

### 1.1 Scope

| In scope | Out of scope |
|:---|:---|
| Save button UI + backend save call | Backend persistence schema changes (reuses existing graph snapshot endpoint) |
| Auto-save toggle UI + debounce | Versioned/diff-based history storage on the backend |
| `GraphHistoryService` in-memory snapshot cache | Multi-user concurrent edit conflict resolution (OT/CRDT) |
| Undo/Redo buttons + keyboard shortcuts | Branching history (only linear undo/redo) |
| Multiple-workflow concurrent caching | Persistent history across page reloads (in-memory only) |
| Configurable cache limit | |

### 1.2 Architecture

```txt
@decaf-ts/for-angular/graph
  GraphToolbarComponent  (Save, Auto-Save toggle, Undo, Redo, Start)
  GraphHistoryService    (@service, in-memory snapshot ring buffer per workflowId)
  GraphAutoSaveService   (@service, debounced mutation listener → backend save)
  GraphSaveService       (@service, explicit save → backend endpoint)

@decaf-ts/integrations/graph (shared, frontend-safe)
  GraphSnapshot type (already exists from DECAF-32 §5.11)

@decaf-ts/integrations/nest/graph (backend)
  GraphExecutionController or GraphWorkflowController
    PUT /graph/workflow/:id  → persists graph snapshot (definition + state)
```

Core rules:

```txt
Save is always available (manual), regardless of auto-save state.
Auto-Save ON  → mutations debounced → backend save (history disabled or optional).
Auto-Save OFF → mutations pushed to GraphHistoryService ring buffer → Undo/Redo restores.
Undo/Redo operate on the in-memory cache only; they do NOT call the backend.
```

## 2. Goals

*   [ ] Add a **Save Workflow** button to the graph canvas toolbar, aligned with the **Start** button.
*   [ ] Add an **Auto-Save** toggle (default OFF) next to the Save button.
*   [ ] When auto-save is ON, debounce workflow mutations and call the backend to persist the full graph snapshot.
*   [ ] When auto-save is OFF, cache workflow snapshots in a `@service`-decorated `GraphHistoryService` with a configurable limit (default 10).
*   [ ] Support multiple workflows concurrently in the history cache (keyed by workflow ID).
*   [ ] Add **Undo** and **Redo** buttons that restore the canvas from the history cache.
*   [ ] Wire undo/redo keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y).
*   [ ] Disable Undo when no previous state exists; disable Redo when no future state exists.

## 3. User Stories / Requirements

### User Stories

*   **US-1:** As a workflow designer, I want a **Save** button so that I can explicitly persist my work when I'm ready.
*   **US-2:** As a workflow designer, I want an **Auto-Save** toggle so that I don't lose changes if I forget to save manually.
*   **US-3:** As a workflow designer, I want **Undo/Redo** buttons so that I can revert accidental changes (especially when auto-save is off).
*   **US-4:** As a workflow designer, I want the history cache to support **multiple workflows** so that switching between workflows doesn't lose undo history.
*   **US-5:** As a workflow designer, I want **keyboard shortcuts** for undo/redo so that I can work efficiently.

### Functional Requirements

*   **Req-1:** The **Save** button MUST be rendered on the top-right of the canvas toolbar, aligned with the **Start** button.
*   **Req-2:** The **Auto-Save** toggle MUST default to **OFF**.
*   **Req-3:** When **Auto-Save** is ON, any of the following mutations MUST trigger a debounced backend save (debounce default 500ms, configurable):
    *   Node positioning (drag end)
    *   Edge connection (new edge created)
    *   Edge disconnection (edge removed)
    *   Port toggle (port mode changed in `GraphNodeConfigStore`)
    *   Node CRUD modal save (values/portModes/metadata changed)
*   **Req-4:** When **Auto-Save** is OFF, the same mutations MUST push a snapshot to `GraphHistoryService` instead of calling the backend.
*   **Req-5:** `GraphHistoryService` MUST be decorated with `@service()` from `@decaf-ts/core`.
*   **Req-6:** `GraphHistoryService` MUST maintain a separate history stack per workflow ID, supporting **multiple concurrent workflows**.
*   **Req-7:** `GraphHistoryService` MUST enforce a configurable maximum cache size (default 10). When the limit is reached, the oldest snapshot is evicted (FIFO/ring buffer).
*   **Req-8:** **Undo** MUST pop the current state from the history stack and restore the previous snapshot to the canvas. **Redo** MUST re-apply a previously undone snapshot.
*   **Req-9:** **Undo** MUST be disabled (visually + functionally) when the history stack is at its initial state. **Redo** MUST be disabled when there are no snapshots to re-apply.
*   **Req-10:** The backend save endpoint MUST persist the full graph snapshot (graph definition + node configs + metadata) so that the workflow can be fully restored on reload.
*   **Req-11:** Keyboard shortcuts: `Ctrl/Cmd+Z` → Undo; `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` → Redo. Shortcuts MUST be disabled when focus is inside a text input/textarea/code editor to avoid conflicts.
*   **Req-12:** The Save button MUST show a loading indicator while the backend save is in flight and a success/error toast on completion.
*   **Req-13:** All errors MUST throw Decaf error types (`BaseError` subclasses). Never throw native `Error`.

### Backend Architectural Requirements

*   **Req-B1:** The `GraphExecutionModule` MUST be **adapter-agnostic**. It MUST NOT hardcode any specific adapter (e.g. `RamAdapter`). When used standalone (`initAdapter: true`), it MAY bootstrap a default adapter for development. When used within a host application (`initAdapter: false`), it MUST rely on the adapter already configured by `DecafModule.forRoot(...)`.
*   **Req-B2:** Persisted models (`GraphExecutionResultModel`, `GraphWorkflowModel`) MUST NOT hardcode a flavour via `@uses(...)`. They MUST be flavour-agnostic so they bind to whichever adapter the host application has configured via `Adapter.setCurrent(...)`.
*   **Req-B3:** The system MUST NEVER call a repository directly. All persistence operations MUST go through a matching `ModelService` subclass:
    *   `GraphResultService extends ModelService<GraphExecutionResultModel>` — decorated with `@service(GraphExecutionResultModel)`.
    *   `GraphWorkflowService extends ModelService<GraphWorkflowModel>` — decorated with `@service(GraphWorkflowModel)`.
*   **Req-B4:** Services MUST be injected into NestJS controllers via constructor injection (standard Nest DI when the module provides them directly) or via the `@Service(Model)` parameter decorator from `@decaf-ts/for-nest`. The controller MUST NOT use string-based `@Inject(SOME_TOKEN)` for persistence.
*   **Req-B5:** The user MUST propagate **automatically** from the auth handler → context → transformers → services → repositories → adapters. The controller MUST pass the `DecafRequestContext` (request-scoped `Context`) as the trailing contextual argument to every service call. The auth handler's `bindToContext(ctx, data)` accumulates `{ user, roles, organization }` onto the context; transformers map these to adapter-specific keys (e.g. `UUID` for RamAdapter). The adapter's `@createdBy`/`@updatedBy` handlers read the user from the context automatically.
*   **Req-B6:** The `GraphExecutionModule` MUST NOT export injection tokens like `GRAPH_RESULT_REPOSITORY` or `GRAPH_WORKFLOW_REPOSITORY`. It MUST export the service classes (`GraphResultService`, `GraphWorkflowService`) instead.
*   **Req-B7:** The `DecafRequestContext` MUST be injected `@Optional()` so the module works both standalone (without `DecafCoreModule`) and within a host app (with `DecafModule`). When `DecafRequestContext` is unavailable, service calls proceed without a context (the adapter uses its default user).

### Non-Functional Requirements

*   **NFR-1:** The history cache MUST be in-memory only (no persistence). Clearing the page/tab loses undo history.
*   **NFR-2:** The auto-save debounce MUST be configurable via a provider token (e.g., `GRAPH_AUTOSAVE_DEBOUNCE_MS`).
*   **NFR-3:** The history cache limit MUST be configurable via a provider token (e.g., `GRAPH_HISTORY_LIMIT`).
*   **NFR-4:** Snapshot serialization MUST reuse the existing `buildGraphRendererSnapshot()` from DECAF-32 §20.4 (no new serialization format).
*   **NFR-5:** `GraphHistoryService` and `GraphAutoSaveService` MUST be frontend-safe (no `isolated-vm`, `acorn`, or `typescript` imports; no backend-only engine code).

## 4. Architecture & Design

### 4.1 Toolbar Layout

```txt
┌─────────────────────────────────────────────────────────────────┐
│  [Undo] [Redo]        [Auto-Save: OFF]        [Save]  [Start]  │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║                     Graph Canvas                           ║  │
│  ║                                                             ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────────┘
```

*   **Undo/Redo** — left cluster (history controls).
*   **Auto-Save toggle** — center-right.
*   **Save** + **Start** — right cluster, aligned.
*   Undo/Redo are disabled (greyed out) when history is empty / at the boundary.

### 4.2 `GraphHistoryService`

```typescript
@service()
export class GraphHistoryService {
  // Per-workflow ring buffer: workflowId → snapshots[]
  private histories: Map<string, GraphSnapshot[]>;
  // Per-workflow cursor (current position in the stack)
  private cursors: Map<string, number>;
  // Configurable limit (default 10)
  private limit: number;

  // Push a new snapshot onto the current workflow's history.
  // If the cursor is not at the top, truncate the redo stack first.
  push(workflowId: string, snapshot: GraphSnapshot): void;

  // Undo: move cursor back, return the snapshot at the new position.
  // Returns undefined if at the bottom (no undo available).
  undo(workflowId: string): GraphSnapshot | undefined;

  // Redo: move cursor forward, return the snapshot at the new position.
  // Returns undefined if at the top (no redo available).
  redo(workflowId: string): GraphSnapshot | undefined;

  canUndo(workflowId: string): boolean;
  canRedo(workflowId: string): boolean;

  // Clear history for a specific workflow (e.g., on workflow switch or reset).
  clear(workflowId: string): void;

  // Clear all histories.
  clearAll(): void;

  // Set the cache limit (configurable at bootstrap).
  setLimit(limit: number): void;
}
```

**Ring buffer semantics:**
*   `push()` appends a snapshot. If the buffer exceeds `limit`, the oldest entry is evicted.
*   If `push()` is called when the cursor is not at the top (i.e., after an undo), the redo stack (entries after the cursor) is truncated before the new snapshot is pushed. This is standard undo/redo semantics.
*   `undo()` returns the snapshot at `cursor - 1` and decrements the cursor. Returns `undefined` if `cursor === 0`.
*   `redo()` returns the snapshot at `cursor + 1` and increments the cursor. Returns `undefined` if `cursor === top`.
*   `canUndo()` → `cursor > 0`.
*   `canRedo()` → `cursor < top`.

### 4.3 `GraphAutoSaveService`

```typescript
@service()
export class GraphAutoSaveService {
  // Debounced save trigger
  private debouncedSave: (...args: any[]) => void;

  // Enable/disable auto-save (bound to toggle UI)
  enabled: boolean;

  // Called by mutation sources (drag end, edge connect/disconnect, port toggle, node CRUD save)
  // Debounces and then calls GraphSaveService.save()
  onMutation(workflowId: string, snapshot: GraphSnapshot): void;

  // Flush any pending debounced save immediately (e.g., on page unload)
  flush(): void;
}
```

### 4.4 `GraphSaveService`

```typescript
@service()
export class GraphSaveService {
  // Calls the backend PUT /graph/workflow/:id endpoint with the full snapshot
  async save(workflowId: string, snapshot: GraphSnapshot, ...args: MaybeContextArgs): Promise<void>;

  // Returns whether a save is currently in flight (for UI loading indicator)
  isSaving(): boolean;
}
```

### 4.5 Mutation Detection

Workflow mutations are detected from existing Angular signals/event emitters:

| Mutation | Signal/Event Source | Action |
|:---|:---|:---|
| Node positioning (drag end) | `ngDiagram` drag end event / `nodePosition` signal | `onMutation()` |
| Edge connection | `onEdgeCreate` / edge-added signal | `onMutation()` |
| Edge disconnection | `onEdgeRemove` / edge-removed signal | `onMutation()` |
| Port toggle | `GraphNodeConfigStore.setPortMode()` / `portModes` signal change | `onMutation()` |
| Node CRUD save | `GraphNodeEditModalComponent.save()` result | `onMutation()` |

### 4.6 Backend Architecture

The backend extends the existing NestJS graph module (`integrations/src/nest/graph/`) following the Decaf service/repository pattern:

```txt
DecafModule.forRoot({ conf: [[AnyAdapter, config, transformer?]] })
  → Adapter.setCurrent(flavour)
  → models bind to Adapter.currentFlavour (no @uses hardcoded)

GraphExecutionModule.forRoot({ initAdapter: false })
  → GraphResultService (@service(GraphExecutionResultModel))
  → GraphWorkflowService (@service(GraphWorkflowModel))
  → GraphExecutionController
      constructor(engine, resultService, workflowService, @Optional() requestContext)
      execute()     → resultService.saveResult(result, requestContext)
      getResult()   → resultService.findByRunId(runId, requestContext)
      saveWorkflow()→ workflowService.saveSnapshot(id, snapshot, requestContext)
```

**User propagation chain:**

```txt
Request → AuthInterceptor → authHandler.authorize(ctx, model, roles, requestContext)
  → extractFromAuth(request) → { user, roles, organization }
  → bindToContext(ctx, data) → ctx.accumulate({ user, roles, organization })
  → applyTransformers() → e.g. RamTransformer reads ctx.user → { UUID: user }
  → Controller passes requestContext as trailing arg to service methods
  → ModelService.logCtx(args, op) extracts context
  → Repository.forModel(model).create(model, ctx)
  → Adapter @createdBy handler reads UUID from ctx → sets createdBy field
```

**Endpoints:**

| Method | Path | Service Method | Description |
|:---|:---|:---|:---|
| `POST` | `/graph/execute` | `resultService.saveResult(result, ctx)` | Execute workflow + persist result |
| `GET` | `/graph/results/:runId` | `resultService.findByRunId(runId, ctx)` | Retrieve persisted result |
| `PUT` | `/graph/workflow/:id` | `workflowService.saveSnapshot(id, snapshot, ctx)` | Create or update workflow snapshot |
| `GET` | `/graph/events` | (SSE stream) | Stream execution events |

### 4.7 State Machine

```txt
                    ┌──────────────────────────────┐
                    │     Auto-Save Toggle          │
                    │                               │
              ┌─────┴─────┐                   ┌─────┴─────┐
              │   OFF     │                   │    ON     │
              └─────┬─────┘                   └─────┬─────┘
                    │                               │
  mutation ─→ push to history              mutation ─→ debounce ─→ backend save
              undo/redo available                       undo/redo disabled (or optional)
              manual Save available                     manual Save available
```

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| TASK-234 | `GraphHistoryService` — in-memory ring buffer with multi-workflow support | High | Completed | - |
| TASK-235 | `GraphSaveService` + backend `PUT /graph/workflow/:id` endpoint | High | Completed | - |
| TASK-236 | `GraphAutoSaveService` — debounced mutation listener | High | Completed | TASK-235 |
| TASK-237 | `GraphToolbarComponent` — Save, Auto-Save toggle, Undo, Redo buttons | High | Completed | TASK-234, TASK-236 |
| TASK-238 | Mutation detection wiring — connect existing signals/events to auto-save/history | High | Completed | TASK-234, TASK-236 |
| TASK-239 | Keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z) with input-focus guard | Medium | Completed | TASK-237 |
| TASK-240 | Configuration provider tokens (`GRAPH_HISTORY_LIMIT`, `GRAPH_AUTOSAVE_DEBOUNCE_MS`) | Medium | Completed | TASK-234, TASK-236 |
| TASK-241 | Tests — history service, auto-save debounce, save endpoint, mutation detector | High | Completed | TASK-234–TASK-240 |
| TASK-242 | Backend architecture refactor — adapter-agnostic module, `@service(Model)` services, context propagation, remove injection tokens | High | Completed | TASK-235 |

## 6. Open Questions / Risks

*   **Q1:** Should auto-save ON disable undo/redo entirely, or keep a lightweight local history for undo even when auto-save is on? *(Default: disable undo/redo when auto-save is ON — the backend is the source of truth.)*
*   **Q2:** Should the Save button be disabled while auto-save is ON? *(Default: no — manual save is always available as a "save now" shortcut, bypassing the debounce.)*
*   **Q3:** Should undo/redo persist across a page reload via `sessionStorage`? *(Default: no — in-memory only per NFR-1. If needed, a future spec can add session persistence.)*
*   **Risk 1:** Large workflows may produce heavy snapshots; pushing 10 copies in memory could be expensive. Mitigation: snapshots are structural clones (not deep copies of the DOM), and the limit is configurable. For very large workflows, the limit can be lowered.
*   **Risk 2:** Rapid mutations (e.g., dragging a node) could flood the history. Mitigation: node-position changes should push a single snapshot on drag-end, not on every mouse-move event. The auto-save debounce handles this for the save path; the history path should use the same drag-end event.

## 7. Results & Artifacts

### Frontend (`for-angular/src/graph/`)

*   `services/GraphHistoryService.ts` — `@service` ring buffer with multi-workflow support.
*   `services/GraphSaveService.ts` — calls backend `PUT /graph/workflow/:id`.
*   `services/GraphAutoSaveService.ts` — debounced mutation listener.
*   `services/GraphMutationDetectorService.ts` — routes mutations to auto-save or history.
*   `services/GraphKeyboardShortcutsService.ts` — Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z with input-focus guard.
*   `components/graph-toolbar/graph-toolbar.component.ts` — toolbar with Save/Auto-Save/Undo/Redo.
*   `tokens/graph-configuration.tokens.ts` — `GRAPH_HISTORY_LIMIT`, `GRAPH_AUTOSAVE_DEBOUNCE_MS`.
*   `utils.ts` — `buildSnapshot()` / `restoreFromSnapshot()` on `GraphRendererComponent`.
*   Tests: `services/*.spec.ts` — history, auto-save, save, mutation detector.

### Backend (`integrations/src/nest/graph/`)

*   `GraphExecutionResultModel.ts` — flavour-agnostic model (no `@uses`).
*   `GraphWorkflowModel.ts` — flavour-agnostic model (no `@uses`).
*   `GraphResultService.ts` — `@service(GraphExecutionResultModel)` extending `ModelService`.
*   `GraphWorkflowService.ts` — `@service(GraphWorkflowModel)` extending `ModelService`.
*   `GraphExecutionController.ts` — injects services via constructor DI, passes `DecafRequestContext` to all service calls.
*   `GraphExecutionModule.ts` — adapter-agnostic, provides services directly, `initAdapter` option for standalone dev only.
*   Removed: `GraphExecutionResultRepository.ts`, `GraphWorkflowRepository.ts` (replaced by services).
*   Removed: `GRAPH_RESULT_REPOSITORY`, `GRAPH_WORKFLOW_REPOSITORY` injection tokens.
