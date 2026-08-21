# DECAF-48: Graph Engine Logging Display & Visual Run Feedback

**Status:** Planned
**Priority:** Medium
**Owner:** Graph / Platform (cross-cutting: `ui-decorators`, `integrations`, `for-angular`)

## 1. Overview

Make a running graph workflow **observable** on the canvas in three layers, all built on top of the existing graph foundation — [DECAF-32](./DECAF_32.md) execution engine, [DECAF-35](./DECAF_35.md) shared/engine split, [DECAF-36](./DECAF_36.md) canvas, [DECAF-42](./DECAF_42.md) controlled SSE, [DECAF-9](./DECAF_9.md) logging, [DECAF-18](./DECAF_18.md) context logger, [DECAF-24](./DECAF_24.md) metadata layer, [DECAF-34](./DECAF_34.md) node catalogue — **without changing engine execution semantics** and **staying engine-agnostic** so the demo driver can later be replaced by a Mastra/NestJS implementation.

1. **Live logs widget** — a console docked on top of the workflow canvas (bottom) streaming the run's `ctx.logger` output over SSE, with Chrome-console-style level filtering.
2. **Visual run feedback** — nodes and connections light up by execution state (running / blocked-waiting / errored / faded-after-failure).
3. **Node I/O inspection** — double-click an already-ran node to expand its inputs (right) and outputs/error (left) in a reusable JSON / table / raw viewer.

The logging + visual-state **contract is engine-agnostic**: it is expressed as Observable event types plus logger custom attributes, not anything coupled to the reference interpreter. A future Mastra/NestJS driver MUST satisfy the same contract (emit the same event types, attach the same log attributes), mirroring [DECAF-32](./DECAF_32.md) §5.13 / §1.2 where Mastra reuses graph definitions but stays separate from core.

> **Approval provenance.** Product scope was approved by Product Manager on [SAA-55](/SAA/issues/SAA-55) (2026-08-19T00:48:05Z). Technical governance / architecture was approved by CTO on [SAA-56](/SAA/issues/SAA-56) (2026-08-19T00:47:46Z). Both approval summaries are recorded in the `delivery-docs` mapping on the domain root [SAA-54](/SAA/issues/SAA-54); the verbatim approved statements remain on their source issues. Implementation is delegated by CEO under separate Paperclip children carrying specification `DECAF-48`.

## 2. Goals

*   [ ] Add a `core.utility.log` Log node to the catalogue ([DECAF-34](./DECAF_34.md) amendment) whose executor logs its input through `ctx.logger` so its output appears in the widget naturally.
*   [ ] Attach `nodeId`, `workflowId`, `runId`, `user` to every run log line via decaf-ts logging custom attributes ([DECAF-9](./DECAF_9.md) `LogParameterRegistry` / `logger.for({...})`), sourced from `ctx` ([DECAF-18](./DECAF_18.md)).
*   [ ] Stream live run logs over SSE in non-default subscription mode with per-owner (run-ownership) segregation ([DECAF-42](./DECAF_42.md)); a consumer only receives events/logs for runs it owns.
*   [ ] Add a docked logs widget at the bottom of the workflow canvas with Chrome-console-style level filtering (Verbose/Info/Warnings/Errors), opening on run, collapsible/resizable, dismissible/reopenable.
*   [ ] Emit per-node/edge execution-state events on the existing Observable pipeline ([DECAF-32](./DECAF_32.md) §5.3/§5.8/§8) and map them to faded glowing border overlays: running=green, blocked=yellow, errored=red; unexecuted nodes/edges fade/disable after a failed run.
*   [ ] Introduce a `BLOCKED`/waiting visual state for nodes whose upstream dependencies have not all completed (derived from plan/execution events, no engine rewrite).
*   [ ] Double-click an already-ran node to expand an inline split view: right=inputs, left=outputs (or error), rendered by one shared component with JSON (default) / table / raw view modes.
*   [ ] Keep the frontend visualization importing only `@decaf-ts/integrations/graph/shared` ([DECAF-35](./DECAF_35.md) §4.6 ESLint boundary); never import the engine in `for-angular`.

## 3. User Stories / Requirements

*   **US-1:** As a workflow author, I want to watch a run's logs live on the canvas so I can see what the system is doing without leaving the graph.
*   **US-2:** As a workflow author, I want to filter live logs by level (Chrome-console style) so I can focus on warnings/errors while a run is in progress.
*   **US-3:** As a workflow author, I want nodes and connections to glow by execution state so I can follow the run's progress visually.
*   **US-4:** As a workflow author, I want to double-click a node that already ran to inspect its inputs and outputs (or error) so I can debug a run.
*   **US-5:** As a tenant user, I want to receive only the run events/logs I own so I never see another user's runs.
*   **Req-1:** The system must stream live run logs over SSE sourced from the running system's `ctx.logger` (the logger passed on every step via `GraphExecutionContext`). Log-node output must appear naturally because the Log node logs via `ctx.logger` — no parallel logging path.
*   **Req-2:** The system must attach `nodeId`, `workflowId`, `runId`, `user` to every run log line as discrete custom attributes (renderable as columns, not buried in the message string) via [DECAF-9](./DECAF_9.md) / `logger.for({...})`, sourced from `ctx` ([DECAF-18](./DECAF_18.md)).
*   **Req-3:** The server must run SSE in non-default subscription mode ([DECAF-42](./DECAF_42.md)) keyed by run ownership `{ runId, ownerUser }`; every emitted graph event/log is filtered through that key before `observer.next(...)`. A consumer must never receive another user's run logs or graph events. The broadcast `/events` path stays unchanged for backward compatibility.
*   **Req-4:** The logs widget must support level filtering (Verbose/Info/Warnings/Errors mapping to trace/debug/info/warn/error/fatal) that hides non-matching lines without dropping them from the stream.
*   **Req-5:** While a workflow runs, nodes and connections must reflect execution state with a faded glowing border overlay: running=faded green, blocked/waiting=faded yellow, errored=faded red (same treatment for the active connection).
*   **Req-6:** After a failed run, all nodes and connections that were not executed must appear faded/disabled; executed-then-failed nodes keep the red error treatment.
*   **Req-7:** The visual states must be driven by the existing [DECAF-32](./DECAF_32.md) `GraphExecutionEvent` → `GraphExecutionStateMapper` pipeline (no new execution engine), extended with explicit node/edge state-transition events.
*   **Req-8:** Double-clicking a node that already ran must expand the node model both sides on the canvas (inline, not a modal): right=inputs in JSON by default with a table/raw toggle; left=outputs (same component, JSON/table) or the error when failed.
*   **Req-9:** The I/O viewer must be a single reusable component used for both inputs and outputs, with three view modes: JSON (default) / table / raw.
*   **Req-10:** The inspection panel must be read-only. Double-click disambiguates by run state: already-ran → I/O inspection; not-ran → existing edit modal ([DECAF-32](./DECAF_32.md) §20/§21.11).
*   **Req-11:** The logging + visual-state contract must stay engine-agnostic (Observable event types + logger attributes); a future Mastra/NestJS driver must satisfy the same contract.

## 4. Architecture & Design

### 4.1 Package ownership & boundaries

*   **`ui-decorators` (metadata layer).** All new node/edge **visual-state metadata** and **I/O inspection metadata** ship here, framework-neutral, no graph-library dependency — same rule as [DECAF-24](./DECAF_24.md) §4. New metadata the frontend needs must be re-exportable from `@decaf-ts/integrations/graph/shared` ([DECAF-35](./DECAF_35.md)). No engine/runtime concerns in this package.
*   **`integrations` (backend demo implementation).** The engine emits per-node log lines (via `ctx.logger`, [DECAF-18](./DECAF_18.md)) and per-node/edge execution-state events on the **existing** `Observable`/`Observer` pipeline ([DECAF-32](./DECAF_32.md) §5.3, §5.8). SSE segregation rides [DECAF-42](./DECAF_42.md) subscription mode. The contract is expressed as Observable event types + logger custom attributes, not anything coupled to the reference interpreter.
*   **`for-angular` (visualization layer).** Logs widget (bottom of canvas), level filter (Chrome-console style), visual run feedback (node/edge glow + post-fail fade), and node double-click I/O inspector. **MUST import only `@decaf-ts/integrations/graph/shared`** — enforced by the existing ESLint `no-restricted-imports` boundary ([DECAF-35](./DECAF_35.md) §4.6). The frontend consumes the run via SSE; it never imports the engine (the in-browser demo executors are already quarantined/migrated per [DECAF-35](./DECAF_35.md) TASK-232 and must not regress).

### 4.2 SSE segregation design

*   Use opt-in subscription mode ([DECAF-42](./DECAF_42.md)), non-default. Broadcast `/events` stays unchanged for backward compatibility.
*   **Subscription scoping keyed by run ownership**: a subscription carries `{ runId, ownerUser }`; the server filters every emitted graph event through that key before `observer.next(...)`. A consumer only receives events for runs it owns. `runId` + owning user are the ownership tuple.
*   **Event channel/namespace**: define a dedicated graph-run namespace, e.g. `graph.run` with sub-topics `graph.run.log` (per-node log lines) and `graph.run.state` (node/edge execution-state updates). Subscribe via `POST /events/subscribe` with the run-scoped topic filter; `POST /events/unsubscribe` on close ([DECAF-42](./DECAF_42.md) Req-2/3). Reuse the existing `/graph/events` SSE stream ([DECAF-32](./DECAF_32.md) §5.13/Req-13, [DECAF-36](./DECAF_36.md) §4.6) extended to subscription mode.
*   **Identity propagation**: the owning user is established by the existing auth-handler → `DecafRequestContext` → `ctx` chain ([DECAF-36](./DECAF_36.md) Req-B5). The run is created by `POST /graph/execute`, which returns `runId`; the client subscribes with that `runId` and its authenticated identity. The server rejects/filters subscriptions whose user does not own the run.

### 4.3 Logging attributes

*   Every log line emitted during a run carries custom attributes via the [DECAF-9](./DECAF_9.md) `LogParameter` / `logger.for({...})` mechanism: `nodeId`, `workflowId`, `runId`, `user`. Sourced from `ctx` ([DECAF-18](./DECAF_18.md)) — the run/user identity flows through `ctx` on every step; node executors read them from `ctx` and attach via `log.for({ nodeId, workflowId, runId, user })`.
*   Register these as `LogParameterDescriptor`s (or attach per-call via `.for`) so they render in the MiniLogger pattern when present ([DECAF-9](./DECAF_9.md) §4.1, §4.6). The SSE log channel serializes the structured payload (level, message, attributes, timestamp), not just the formatted string, so the frontend can filter by level and display node/workflow/run/user columns.
*   **Log-node output flows through the same `ctx.logger` path** so it appears in the stream naturally. [DECAF-34](./DECAF_34.md) currently has no dedicated Log node in the catalogue; this spec resolves that by adding a minimal `core.utility.log` Log node whose executor logs its input through `ctx.logger` at a configurable level with the standard attributes — the cleanest match to the brief's "Log nodes logging must also appear".

### 4.4 Visual state model

*   Define a node/edge execution-state enum in `shared` (frontend-safe, [DECAF-35](./DECAF_35.md) §4.3 — shared enums live in `shared/constants.ts`): `IDLE | RUNNING | BLOCKED | SUCCEEDED | FAILED | SKIPPED(DISABLED)`. Map to UI:
    *   `RUNNING` → faded green glowing border (node + edge).
    *   `BLOCKED` (waiting on upstream nodes) → faded yellow (node + edge).
    *   `FAILED` → faded red (node + edge).
    *   After a run fails: all unexecuted nodes/edges render faded/disabled (`SKIPPED`/`DISABLED`).
*   The engine emits this state as part of the **existing** Observable event stream — extend `GraphExecutionEventType` ([DECAF-32](./DECAF_32.md) §8, currently `NODE_*`, `EDGE_VALUE_ROUTED`, etc.) with explicit node/edge state-transition events (e.g. `NODE_STATE_CHANGED`, `EDGE_STATE_CHANGED` carrying `{ nodeId|edgeId, state, runId, workflowId }`). The frontend `GraphExecutionStateMapper` ([DECAF-35](./DECAF_35.md) §4.7) already maps `GraphExecutionEventType` → UI state; extend it for the new state events. Do **not** introduce a second out-of-band channel; visual state rides the same SSE stream the logs do (under `graph.run.state`).
*   **`BLOCKED` derivation**: a node is `BLOCKED` when it is reachable in the plan but its upstream dependencies have not all completed (distinct from `IDLE`/not-yet-reached). Derived from the plan and execution events; no engine rewrite.
*   Keep the contract engine-agnostic: the state enum + event shape are what a Mastra/NestJS driver must emit. The reference interpreter produces them directly; a future driver maps its own runtime states onto them.

### 4.5 Colour reconciliation with DECAF-32 §21.9

[DECAF-32](./DECAF_32.md) §21.9 currently uses running=amber, succeeded=green, failed=red, cached=indigo, pinned=purple. This spec's run-feedback overlay uses running=green, blocked=yellow, errored=red, faded=unexecuted-after-failure. Per the PM decision the brief's colours win for the **live run-feedback overlay**; `cached`/`pinned` semantics stay intact. The implementation must reconcile §21.9 — either revise §21.9's running colour or layer the new overlay semantics on top — with CTO confirmation of the cleanest reconciliation (open item, §6).

### 4.6 Node I/O inspection data shape

*   Per executed node, the engine exposes a structured payload the frontend can fetch (or receive on `NODE_COMPLETED`):

    ```
    {
      runId, workflowId, nodeId, state,
      inputs: Record<portName, value>,
      outputs?: Record<portName, value>,   // present when SUCCEEDED
      error?: GraphExecutionErrorPayload   // present when FAILED (DECAF-32 §5.4 / §8)
    }
    ```

*   Double-click on an already-ran node opens an **expanded split view**: right pane = inputs, left pane = outputs (or error). **One shared component renders both sides** with three view modes: **JSON (default) / table / raw**. No per-side custom component.
*   This payload is frontend-safe (pure data) and must be deliverable via `graph/shared` types + the SSE state channel (or a `GET /graph/results/:runId` lookup keyed by node, extending [DECAF-36](./DECAF_36.md) §4.6). No engine import in `for-angular`.

### 4.7 Gesture disambiguation

Double-click on a node **with execution results** → I/O inspection (this spec). Double-click on a node **without results** → existing edit modal ([DECAF-32](./DECAF_32.md) §20/§21.11). Editing node configuration stays on the existing edit modal; the I/O panel is read-only.

### 4.8 Run → SSE → widget flow

```mermaid
sequenceDiagram
    participant Client as for-angular (canvas)
    participant Server as for-nest (graph module)
    participant Engine as integrations (engine, ctx.logger)
    participant Sub as SSE subscription registry

    Client->>Server: POST /graph/execute (auth user) → runId
    Client->>Server: POST /events/subscribe { topic: graph.run.*, runId } (auth user)
    Server->>Sub: register { runId, ownerUser }
    Server-->>Sub: filter check: subscriber owns runId ✓
    loop run
        Engine->>Engine: execute node via ctx (carries runId, workflowId, user)
        Engine->>Engine: ctx.logger.for({nodeId,workflowId,runId,user}).log(...)
        Engine-->>Server: Observable NODE_STATE_CHANGED / EDGE_STATE_CHANGED / log event
        Server->>Sub: ownership filter (runId, ownerUser)
        Sub-->>Client: SSE graph.run.log / graph.run.state (only owned run)
        Client->>Client: logs widget: append + level-filter; canvas: node/edge glow
    end
    Engine-->>Server: NODE_COMPLETED { inputs, outputs | error }
    Server-->>Client: SSE graph.run.state (node result payload)
    Client->>Client: double-click ran node → inline I/O split view (JSON/table/raw)
    Client->>Server: POST /events/unsubscribe (on close)
```

## 5. Tasks Breakdown

This specification is broken down into phased work items. Per the [SAA-55](/SAA/issues/SAA-55) / [SAA-56](/SAA/issues/SAA-56) approvals, task decomposition, assignment, and the per-task Paperclip children are owned by CEO/CTO and will carry specification `DECAF-48`. Phasing is a sequencing recommendation, not a hard release split; the specialist may bundle into one specification with phased tasks.

| Phase | Work item | Layer | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|:---|
| 1 | Add `core.utility.log` Log node executor + catalogue amendment ([DECAF-34](./DECAF_34.md)) | integrations / ui-decorators | High | Pending | - |
| 1 | Register `nodeId`/`workflowId`/`runId`/`user` log attributes via [DECAF-9](./DECAF_9.md) `logger.for(...)`, sourced from `ctx` ([DECAF-18](./DECAF_18.md)) | integrations | High | Pending | - |
| 1 | SSE subscription-mode segregation keyed by `{ runId, ownerUser }` on `graph.run.log` / `graph.run.state` ([DECAF-42](./DECAF_42.md)) | integrations / for-nest | High | Pending | - |
| 1 | Logs widget docked at canvas bottom: live SSE stream, Chrome-console level filter, open-on-run, collapsible/resizable | for-angular | High | Pending | 1 (SSE segregation, log attributes) |
| 2 | Node/edge execution-state enum in `shared` + `NODE_STATE_CHANGED`/`EDGE_STATE_CHANGED` events on the existing Observable ([DECAF-32](./DECAF_32.md) §5.3/§5.8/§8) | integrations / ui-decorators | High | Pending | - |
| 2 | `GraphExecutionStateMapper` extension + faded glowing overlays (running=green, blocked=yellow, errored=red) and post-fail fade for unexecuted nodes/edges | for-angular | High | Pending | 2 (state events) |
| 2 | Reconcile run-feedback colours with [DECAF-32](./DECAF_32.md) §21.9 (CTO-confirmed reconciliation); keep `cached`/`pinned` intact | for-angular / ui-decorators | Medium | Pending | 2 (overlay) |
| 3 | Per-node I/O result payload (`inputs`/`outputs`/`error`) via SSE state channel or `GET /graph/results/:runId` ([DECAF-36](./DECAF_36.md) §4.6) | integrations | Medium | Pending | - |
| 3 | Reusable JSON (default) / table / raw viewer component (one shared component for inputs and outputs|error) | for-angular | Medium | Pending | 3 (I/O payload) |
| 3 | Double-click gesture disambiguation (already-ran → I/O inspection; not-ran → edit modal) + inline split-view expand | for-angular | Medium | Pending | 3 (viewer) |
| X | Engine-agnostic conformance tests asserting the event/attribute contract; ESLint boundary stays green; SSE fan-out + ownership-filter live test (5+ observers) | integrations / for-angular | High | Pending | 1, 2 |

## 6. Open Questions / Risks

*   **Colour reconciliation with [DECAF-32](./DECAF_32.md) §21.9** — PM decision: brief's colours win for the live run-feedback overlay (running=green, blocked=yellow, errored=red); `cached`/`pinned` semantics stay intact. CTO to confirm the cleanest reconciliation (revise §21.9's running colour vs layer the new overlay on top). Owner: CTO.
*   **`BLOCKED`/waiting state** — not present in the engine's current `PENDING/RUNNING/SUCCEEDED/FAILED/SKIPPED/CANCELLED/CACHED` set. In scope: introduce a waiting/blocked visual state derived from incomplete upstream dependencies (no engine rewrite). Derivation rule defined in §4.4.
*   **Double-click vs edit-modal conflict** ([DECAF-32](./DECAF_32.md) §21.11) — resolved: disambiguate by run state (already-ran → I/O inspection; not-ran → edit modal). §4.7.
*   **Log transport** — product requires live SSE streaming with per-owner segregation; the transport choice (dedicated logs SSE channel vs log events carried on the existing graph-events SSE) is an implementation decision for the spec/CTO. §4.2 defines the `graph.run.log` / `graph.run.state` namespace.
*   **Log node existence** — [DECAF-34](./DECAF_34.md) has no dedicated Log node. Resolved: add a `core.utility.log` Log node (logs its input via `ctx.logger` at a configurable level). §4.3.
*   **SSE fan-out + ownership-filter correctness** — must test 5+ concurrent `HttpAdapter` observers in subscription mode and prove each receives only its own runs' events ([DECAF-42](./DECAF_42.md) Req-6/7). Ownership-filter tests are mandatory.
*   **Contract drift between reference interpreter and future Mastra driver** — mitigate by keeping the event/attribute contract minimal, documented, and asserted by engine-agnostic conformance tests.
*   **Frontend boundary regression** — [DECAF-35](./DECAF_35.md) ESLint rule must stay green; the new widget/inspector must not import the engine.
*   **Log volume / SSE backpressure on large runs** — define a sensible per-run log cap and level awareness at the source (frontend filter is a view concern; do not stream debug logs to a console filtered to error only without server-side level awareness).
*   **`ctx` identity absent for unauthenticated/standalone module runs** ([DECAF-36](./DECAF_36.md) Req-B7 `@Optional()` request context) — define behaviour: attribute `user` as `null`/`system` when absent; ownership filter still keys on `runId` for that case.
*   **Non-goals (v1):** no persistent log store / search / replay across runs (live streaming + level filtering only); no editing from the I/O inspection panel (read-only); no change to engine execution semantics (loops, pinning, planning, value store); no multi-user collaboration features; no redefinition of the node catalogue beyond adding the Log node; no new frontend/backend boundary changes beyond using the existing [DECAF-35](./DECAF_35.md) split and [DECAF-42](./DECAF_42.md) subscription mode; no mobile/responsive canvas redesign; no production Mastra/NestJS driver (the demo engine satisfies the contract now; the driver is a separate future issue).

## 7. Results & Artifacts

*   `workdocs/ai/project/specifications/DECAF_48.md` (this specification)
*   `workdocs/ai/project/plan.md`
*   `AGENTS.md` (constitution)

Implementation artifacts (Log node executor, log-attribute descriptors, SSE subscription-mode segregation, state events + mapper, logs widget, visual overlays, I/O viewer, conformance/ownership tests) are produced by the delegated implementation children and recorded here when they complete.
