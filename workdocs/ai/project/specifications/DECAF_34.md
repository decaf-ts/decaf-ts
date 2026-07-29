# DECAF-34: Graph Node Type Catalogue

**Status:** In Progress — re-opened for the For-Each loop visual/execution model redesign (self-connected loop-closure port, slice input, break node, after-loop output).
**Priority:** Medium
**Owner:** AI Agent

## 1. Overview

This specification is a **reference catalogue** of every graph node type in the DECAF/Alfred graph workflow system. It consolidates the node definitions scattered across ALFRED-5 (node kinds, ports, compile targets), ALFRED-7 (module-prefixed IDs, reference-based serialization), ALFRED-8 (Angular CRUD editing, port-toggle, condition editor), UPSTREAM-1 (port-toggle metadata), and DECAF-32 (engine taxonomy, executor registry, rendering contract) into a single per-node reference.

For each node, this catalogue records:

1. **Identity** — engine kind, ALFRED-5 alias, category, icon, colour.
2. **Functionality** — what the node does and its purpose.
3. **Connections / Inputs / Outputs** — every `@input`, `@output`, and `@connection` port with label, type, and direction.
4. **UI rendering** — node shape, size, visual contract (DECAF-32 §21), and palette grouping.
5. **CRUD / Edit screen** — which properties are editable in the node-edit modal, which use the `PortToggleCrudComponent` (manual ↔ port), and which use the `ConditionEditorComponent` (code ↔ rule).

This is a **documentation-only** specification — no code tasks. All node declarations already exist in `integrations/src/graph/nodes/` (DECAF-32 TASK-228 / TASK-229). This spec cross-references them and fills in the ALFRED-8 CRUD details that were not yet documented in DECAF-32.

### 1.1 Source Specs

| Source | Contribution |
|:---|:---|
| ALFRED-5 | Node kinds, `@node`/`@input`/`@output` declarations, compile targets, validation rules, node palette, UI requirements |
| ALFRED-6 | Package boundary: workflow-node logic in `modules/core`, Mastra-specific in `brain` |
| ALFRED-7 | Module-prefixed node IDs (`core.*`), reference-based workflow serialization, DB-backed node persistence |
| ALFRED-8 | Angular web-components, `PortToggleCrudComponent`, `ConditionEditorComponent`, CRUD form decoration |
| UPSTREAM-1 | `@input`/`@output` port-toggle metadata (`GraphPortGroupMetadata.toggle`) |
| DECAF-32 §22.2 | Engine node kind taxonomy, executor registry, rendering contract (§21), loop kinds (§5.9), Agent node (§22.2.4) |

### 1.2 Node Count

| Category | Count | Kinds |
|:---|:---|:---|
| Trigger | 6 | `core.trigger.manual`, `core.trigger.webhook`, `core.trigger.schedule`, `core.trigger.event`, `core.trigger.form`, `core.trigger.chat` |
| Flow Control | 8 | `core.flow.if`, `core.flow.switch`, `core.flow.parallel`, `core.flow.errorBoundary`, `core.flow.humanApproval`, `core.flow.break`, `core.loop.foreach`, `core.loop.while`, `core.loop.until` |
| Utility | 4 | `core.flow.merge`, `core.flow.map`, `core.flow.delay`, `core.flow.return`, `core.flow.code` |
| Agent | 1 | `core.agent` |
| **Total** | **21** | |

> **Note:** The loop nodes (`core.loop.foreach/while/until`) are grouped under Flow Control in the palette but have built-in engine executors (DECAF-32 §5.9), unlike the other flow-control kinds which are graph macros compiled by ALFRED-5.

## 2. Goals

* [x] Catalogue all 20 graph node types in a single reference document.
* [x] For each node, record: identity, functionality, ports (inputs/outputs/connections), UI rendering, and CRUD edit screen.
* [x] Cross-reference the production node declarations in `integrations/src/graph/nodes/`.
* [x] Document the ALFRED-8 CRUD editing details (port-toggle, condition editor) per node.

## 3. User Stories / Requirements

* **US-1:** As a developer, I want a single reference for all node types so I don't have to cross-reference 6 different specs.
* **US-2:** As a UI developer, I want to know which properties each node exposes in the CRUD modal and which use special editors (port-toggle, condition) so I can build the edit forms correctly.
* **Req-1:** Every node kind recognized by the engine MUST be documented here with its ports and CRUD details.

## 4. Architecture & Design

All node declarations live in `integrations/src/graph/nodes/`:

| File | Contents |
|:---|:---|
| `triggers.ts` | 6 trigger node classes (`ManualTriggerNode`, `WebhookTriggerNode`, …) |
| `flow-control.ts` | 10 flow-control/utility node classes (`IfFlowNode`, `SwitchFlowNode`, …, `CodeFlowNode`) |
| `agent.ts` | `AgentNode` with `@connection()` ports |
| `base.ts` | `GraphNode` base class with overridable `static applyMetadata()` |
| `category-styles.ts` | `GraphCategoryStyle` registry (colour + icon per category) |
| `index.ts` | Barrel export |

The loop node classes (`GraphForeachLoopNode`, `GraphWhileLoopNode`, `GraphUntilLoopNode`) live in the for-angular demo layer and are declared with `core.loop.*` kinds. They have built-in engine executors (DECAF-32 §5.9).

### 4.1 Rendering Contract (DECAF-32 §21)

| Aspect | Rule |
|:---|:---|
| Node size | 96×96px (compact rounded square); Switch grows with case count; Agent is 120×140 rectangle |
| Port layout | `@input` → LEFT, `@output` → RIGHT, `@connection` → BOTTOM |
| Port distribution | `justify-content: space-evenly` along the node face |
| Default port | Always renders LAST (bottom-most) in its port group |
| Port labels | Hidden by default; visible on hover; permanently visible when connected |
| Pin button | LEFT; close (×) button RIGHTMOST (RTL-friendly) |
| Category colours | Trigger `#3b82f6`, Flow Control `#f59e0b`, Utility `#0d9488`, Agent `#7c3aed` |
| Agent shape | Rectangular (no border radius) to distinguish composite entities |

### 4.2 CRUD Editing Contract (ALFRED-8 §4)

| Editor | Used By | Behaviour |
|:---|:---|:---|
| `PortToggleCrudComponent` | All `@input` properties | Checkbox "Connect from port": unchecked = manual value field; checked = disables field, exposes port on canvas |
| `ConditionEditorComponent` | `if.condition`, `while.condition`, `doUntil.until`, `switch.cases[].condition` | Two modes: (a) **code** — textarea evaluated by VM sandbox; (b) **rule** — graphical property → operator → value builder; serializes to `ConditionExpression` |
| Standard CRUD field | All non-port, non-condition properties (e.g. `delay.amount`, `code.code`, `schedule.cron`) | Standard `@uielement` form field |

---

## 5. Trigger Nodes (ALFRED-5 §5, DECAF-32 §22.2.1)

Triggers are metadata-only entrypoints. They define how a workflow starts and produce a trigger payload on their `@output` ports. They have **no `@input` ports** (nothing feeds a trigger) and no built-in executors — the engine treats them as metadata-only entrypoints.

**Palette group:** `Triggers`
**Category colour:** `#3b82f6` (blue)
**Category icon:** `ti-bolt`

### 5.1 Manual Trigger

| Field | Value |
|:---|:---|
| **Engine kind** | `core.trigger.manual` |
| **ALFRED-5 kind** | `trigger.manual` |
| **Class** | `ManualTriggerNode` (`triggers.ts`) |
| **Icon** | `ti-hand-click` |
| **Colour** | `#3b82f6` |
| **Size** | 96×96 |
| **Purpose** | Starts the workflow when the user clicks Run. The input form is generated from the trigger's `inputSchema`. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| payload | OUTPUT | `payload` | Trigger payload | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `inputSchema` | Standard CRUD (JSON schema editor) | Drives the Run-form rendered to the user |
| `sampleInput` | Standard CRUD (JSON) | Optional sample data for testing |

**UI behaviour:** User clicks Run → UI renders input form from `inputSchema` → user submits → workflow starts.

---

### 5.2 Webhook Trigger

| Field | Value |
|:---|:---|
| **Engine kind** | `core.trigger.webhook` |
| **ALFRED-5 kind** | `trigger.webhook` |
| **Class** | `WebhookTriggerNode` (`triggers.ts`) |
| **Icon** | `ti-webhook` |
| **Colour** | `#0ea5e9` |
| **Size** | 96×96 |
| **Purpose** | Starts the workflow when an HTTP request is received on the configured path and method. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| payload | OUTPUT | `payload` | Request payload | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `path` | Standard CRUD (text input) | URL path, e.g. `/webhook` |
| `method` | Standard CRUD (select: POST/GET/PUT/PATCH) | HTTP method |
| `auth` | Standard CRUD (select: none/bearer/basic/signature) | Authentication mode |
| `responseMode` | Standard CRUD (select: immediate/after-workflow) | `immediate` = 202 Accepted; `after-workflow` = 200 with result |
| `inputMapping` | Standard CRUD (mapping editor) | Optional request-to-input mapping |

---

### 5.3 Schedule Trigger

| Field | Value |
|:---|:---|
| **Engine kind** | `core.trigger.schedule` |
| **ALFRED-5 kind** | `trigger.schedule` |
| **Class** | `ScheduleTriggerNode` (`triggers.ts`) |
| **Icon** | `ti-calendar-time` |
| **Colour** | `#6366f1` |
| **Size** | 96×96 |
| **Purpose** | Starts the workflow on a cron-like schedule with timezone support. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| payload | OUTPUT | `payload` | Scheduled payload | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `cron` | Standard CRUD (cron expression editor) | e.g. `0 * * * *` |
| `timezone` | Standard CRUD (text/timezone select) | Default `UTC` |
| `payload` | Standard CRUD (JSON) | Optional static payload for each tick |

---

### 5.4 Event Trigger

| Field | Value |
|:---|:---|
| **Engine kind** | `core.trigger.event` |
| **ALFRED-5 kind** | `trigger.event` |
| **Class** | `EventTriggerNode` (`triggers.ts`) |
| **Icon** | `ti-broadcast` |
| **Colour** | `#8b5cf6` |
| **Size** | 96×96 |
| **Purpose** | Starts the workflow when an event is published on the configured internal event bus topic. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| payload | OUTPUT | `payload` | Event payload | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `topic` | Standard CRUD (text input) | Event bus topic name |
| `inputSchema` | Standard CRUD (JSON schema editor) | Schema for the event payload |

---

### 5.5 Form Trigger

| Field | Value |
|:---|:---|
| **Engine kind** | `core.trigger.form` |
| **ALFRED-5 kind** | `trigger.form` |
| **Class** | `FormTriggerNode` (`triggers.ts`) |
| **Icon** | `ti-forms` |
| **Colour** | `#ec4899` |
| **Size** | 96×96 |
| **Purpose** | Starts the workflow when a generated form is submitted. Field definitions drive the form schema. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| payload | OUTPUT | `payload` | Form submission | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `title` | Standard CRUD (text input) | Form title |
| `description` | Standard CRUD (textarea) | Optional form description |
| `fields` | Standard CRUD (array editor) | Each field: `name`, `label`, `type` (text/number/boolean/select/textarea/json), `required`, `options` |

---

### 5.6 Chat Trigger

| Field | Value |
|:---|:---|
| **Engine kind** | `core.trigger.chat` |
| **ALFRED-5 kind** | `trigger.chat` |
| **Class** | `ChatTriggerNode` (`triggers.ts`) |
| **Icon** | `ti-message-circle` |
| **Colour** | `#14b8a6` |
| **Size** | 96×96 |
| **Purpose** | Starts the workflow when a chat message is received. Emits message, sessionId, and userId. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| message | OUTPUT | `message` | Message | `string` |
| sessionId | OUTPUT | `sessionId` | Session ID | `string` |
| userId | OUTPUT | `userId` | User ID | `string` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `inputSchema` | Standard CRUD (JSON schema editor) | Default: `{ message: string, sessionId?: string, userId?: string }` |

---

## 6. Flow-Control Nodes (ALFRED-5 §6, DECAF-32 §22.2.2)

Flow-control nodes are **graph-level macros**. The engine's planner recognises them as ordinary executable nodes, but they have no built-in executors (except the loop kinds). Downstream projects (ALFRED) register custom executors or compile them into Mastra composition APIs.

**Palette group:** `Flow Control`
**Category colour:** `#f59e0b` (amber)
**Category icon:** `ti-arrows-split-2`

### 6.1 If / Then / Else

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.if` |
| **ALFRED-5 kind** | `flow.if` |
| **Class** | `IfFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-arrows-split-2` |
| **Colour** | `#f59e0b` |
| **Size** | 96×96 |
| **Purpose** | Conditional branch. Evaluates the configured condition and routes the input to the matching output. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| value | INPUT | `value` | Input value | `unknown` |
| then | OUTPUT | `then` | Then | `unknown` |
| else | OUTPUT | `else` | Else | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `value` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `condition` | `ConditionEditorComponent` | Code mode (VM expression) or Rule mode (`ConditionExpression` tree: property → operator → value) |

**Validation:** Must have ≥1 `then` edge, ≥1 `else` edge; condition must be safe `ConditionExpression`.

---

### 6.2 Switch

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.switch` |
| **ALFRED-5 kind** | `flow.switch` |
| **Class** | `SwitchFlowNode` (`flow-control.ts`) — extends `GraphNode` |
| **Icon** | `ti-arrows-shuffle` |
| **Colour** | `#f97316` |
| **Size** | 120×140 (grows +24px per case) |
| **Purpose** | Multi-branch switch. Routes the input to the first matching case output, or the default output. |

**Ports (dynamic):**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| value | INPUT | `value` | Input value | `unknown` |
| `<case.outputPort>` | OUTPUT | per case | Case label | `unknown` |
| default | OUTPUT | `default` | Default | `unknown` (always LAST) |

> The `SwitchFlowNode` overrides `static applyMetadata(meta: SwitchNodeMetadata): NodeMetadataChange` to compute ports and size from `meta.cases`. Each case gets its own output port; the `default` port always renders last.

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `value` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `cases` | Standard CRUD (array editor) | Each case: `id`, `label`, `outputPort`, `condition` |
| `cases[].condition` | `ConditionEditorComponent` | Per-case condition (code ↔ rule) |
| `hasDefault` | Standard CRUD (checkbox) | When true, `default` output port is visible |

**Validation:** Cases must have stable IDs, be ordered; default case should be last; case conditions must be safe.

---

### 6.3 For Each (Loop)

| Field | Value |
|:---|:---|
| **Engine kind** | `core.loop.foreach` |
| **ALFRED-5 kind** | `flow.foreach` |
| **Class** | `GraphForeachLoopNode` (for-angular demo layer) |
| **Icon** | `ti-repeat` |
| **Colour** | `#eab308` (yellow) |
| **Size** | 120×140 |
| **Purpose** | Iterates over an input array and executes a body subworkflow for each item (or slice of items). Has a **built-in engine executor** (`ForeachGraphNodeExecutor`, DECAF-32 §5.9). |

**Port model (revised):**

The For-Each node has a **self-connected loop-closure port** on the bottom edge (rendered via the `@connection` decorator, the only bottom-side port primitive) that MUST be connected to its own `body` output port. This symbolizes the loop: the `body` output carries the current item(s) into the loop body, and the `loop` connection port on the bottom receives the processed result back, closing the loop. The loop body itself is still compiled from `metadata.loop.body` (a `GraphWorkflowDefinition`); the `body`→`loop` self-connection is the visual contract that encloses the body nodes. When the node is placed on the canvas empty (no body connected), the `loop` port shows a **placeholder** that the user can click to add nodes to the loop body. The `loop` port can only and MUST at all times close the loop on all the nodes inside the for-each.

The renderer supports three port sides: `@input` (LEFT), `@output` (RIGHT), and `@connection` (BOTTOM). There is no TOP-side port; `completed` is therefore a regular `@output` port on the RIGHT, ordered after `body`.

| Port | Direction | Side | Handle | Label | Type | Notes |
|:---|:---|:---|:---|:---|:---|:---|
| items | INPUT | LEFT | `items` | Items | `unknown[]` | Must be an array or mapped to an array. |
| slice | INPUT (config) | LEFT | `slice` | Slice size | `number` | How many items are taken from the input list at a time. Default `1`. Port is NOT open by default (configuration-only). |
| item | OUTPUT | RIGHT | `item` | Item | `unknown` | Carries the current item(s) into the loop body. MUST be connected to the `loop` connection port. The connection is mandatory and non-deletable; a ghost/placeholder node always sits between `item` and `loop`. |
| loop | CONNECTION (loop-closure) | BOTTOM | `loop` | Loop closure | `unknown` | `@connection` port. Receives the processed result from the body nodes. MUST be self-connected to `item` via a ghost node. `connectionRules.allowSelf: true`. |
| completed | OUTPUT | TOP | `completed` | After loop | `unknown[]` | Represents the flow after the loop ends. Carries the collected results array. Rendered on the TOP side of the node. |

**Visual contract:**

```txt
         ○ completed (TOP — after-loop output)
    ┌───────────────────────────┐
    │  [×] [⚙] [📌]             │
    │     [ti-repeat]           │
    │     For Each              │
    │                           │
    │ ○ items      item     ○───┼──→ [ghost/add] ──→ loop ○
    │ ○ slice (config)          │
    │                           │
    │         ○ loop (BOTTOM)   │
    └───────────────────────────┘
```

The `item` output (right) connects through a mandatory ghost/placeholder node to the `loop` connection port (bottom), enclosing the loop body nodes visually. The ghost node acts as an "add node" button — clicking it opens the palette to insert a node into the loop body. The `item`→ghost→`loop` connection is mandatory and non-deletable. `completed` is the TOP-side output, carrying the collected results after the loop ends.

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `items` | `PortToggleCrudComponent` | Manual array OR connected from upstream port |
| `slice` | Standard CRUD (number input) | Positive integer; default `1`. How many items per iteration. Port NOT open by default. |
| `maxIterations` | Standard CRUD (number input) | Positive integer; default `100` |
| `body` | Graph subworkflow editor / placeholder | The body is the `metadata.loop.body` sub-workflow. Click the `loop` placeholder to add nodes. |

**Validation:**
* Input `items` must be an array or mappable to an array (non-array inputs are wrapped in a single-element array with a warning).
* `slice` must be a positive integer; default `1`.
* The `loop` input port MUST be connected to the `body` output port at all times (the loop must close).
* `maxIterations` must be a positive integer.
* If a `core.flow.break` node fires inside the loop body, the loop terminates early and `completed` carries the results collected so far.

---

### 6.3.1 Break

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.break` |
| **ALFRED-5 kind** | (none — DECAF addition) |
| **Class** | `BreakFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-square-arrow-right` |
| **Colour** | `#ef4444` (red) |
| **Size** | 96×96 |
| **Purpose** | Breaks out of the enclosing loop (foreach/while/until). When executed inside a loop body, the loop terminates early and the loop's `completed`/`state` output carries the results collected so far. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| value | INPUT | `value` | Value | `unknown` |
| broken | OUTPUT | `broken` | Broken | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|:---|
| `value` | `PortToggleCrudComponent` | Value to forward (the loop collects this as the last partial result) |

**Validation:** Must only be used inside a loop body (`core.loop.foreach`, `core.loop.while`, `core.loop.until`). Using a Break node outside a loop is a validation error.

**Execution semantics:** When the `BreakFlowNode` executor runs, it throws a special `GraphBreakSignal` that the enclosing loop executor catches. The loop stops iterating, emits a `LOOP_COMPLETED` event with a `broken: true` metadata flag, and returns the results collected so far on the `completed` output port.

---

### 6.4 While (Loop)

| Field | Value |
|:---|:---|
| **Engine kind** | `core.loop.while` |
| **ALFRED-5 kind** | `flow.while` |
| **Class** | `GraphWhileLoopNode` (for-angular demo layer) |
| **Icon** | `ti-arrows-loop` |
| **Colour** | `#0891b2` (cyan) |
| **Size** | 96×96 |
| **Purpose** | Pre-condition loop. Repeats the body subworkflow while a condition remains true. Has a **built-in engine executor** (`WhileGraphNodeExecutor`). |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| input | INPUT | `input` | Input | `unknown` |
| body | OUTPUT | `body` | Body (subworkflow) | `branch` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `input` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `condition` | `ConditionEditorComponent` | Loop condition (code ↔ rule); evaluated before each iteration |
| `maxIterations` | Standard CRUD (number input) | Required positive integer; default 100 |

**Validation:** `maxIterations` required; condition must be safe; body branch must be connected.

---

### 6.5 Do Until (Loop)

| Field | Value |
|:---|:---|
| **Engine kind** | `core.loop.until` |
| **ALFRED-5 kind** | `flow.doUntil` |
| **Class** | `GraphUntilLoopNode` (for-angular demo layer) |
| **Icon** | `ti-player-stop` |
| **Colour** | `#db2777` (pink) |
| **Size** | 96×96 |
| **Purpose** | Post-condition loop. Runs the body subworkflow until a condition becomes true (runs at least once). Has a **built-in engine executor** (`UntilGraphNodeExecutor`). |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| input | INPUT | `input` | Input | `unknown` |
| body | OUTPUT | `body` | Body (subworkflow) | `branch` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `input` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `until` | `ConditionEditorComponent` | Exit condition (code ↔ rule); evaluated after each iteration |
| `maxIterations` | Standard CRUD (number input) | Required positive integer; default 100 |

**Validation:** `maxIterations` required; body branch must be connected; until condition must be safe; node always runs at least once.

---

### 6.6 Parallel

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.parallel` |
| **ALFRED-5 kind** | `flow.parallel` |
| **Class** | `ParallelFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-arrows-vertical` |
| **Colour** | `#06b6d4` |
| **Size** | 96×96 |
| **Purpose** | Splits execution into concurrent branches. All branches run in parallel and outputs are collected. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| value | INPUT | `value` | Input value | `unknown` |
| branches | OUTPUT | `branches` | Branches (collected) | `unknown[]` |

> ALFRED-5 defines dynamic output ports per branch (`branches[].id`), but the production declaration in `flow-control.ts` uses a single `branches` output array. The ALFRED-5 compile target uses `builder.parallel(branches)` with per-branch subgraphs.

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `value` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `branches` | Standard CRUD (array editor) | Each branch: `id`, `label`; one output port per branch |

**Validation:** Must have ≥2 branches; branch IDs must be stable; every branch should be connected or explicitly disabled.

---

### 6.7 Error Boundary (Try / Catch / Finally)

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.errorBoundary` |
| **ALFRED-5 kind** | `flow.errorBoundary` |
| **Class** | `ErrorBoundaryFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-shield-check` |
| **Colour** | `#ef4444` |
| **Size** | 96×96 |
| **Purpose** | Wraps the input in a try/catch/finally. Emits the result on success, or the error on failure. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| value | INPUT | `value` | Input value | `unknown` |
| result | OUTPUT | `result` | Result (success) | `unknown` |
| error | OUTPUT | `error` | Error (failure) | `unknown` |

> ALFRED-5 defines three branch outputs: `tryBranch`, `catchBranch`, `finallyBranch`. The production declaration in `flow-control.ts` simplifies to `result` + `error` outputs. The `finally` branch is optional and controlled by `metadata.finally`.

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `value` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `catchMode` | Standard CRUD (select: continue/rethrow) | `continue` = swallow error, emit on `error` port; `rethrow` = propagate |
| `finally` | Standard CRUD (checkbox) | When true, a `finally` branch is expected |

---

### 6.8 Human Approval

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.humanApproval` |
| **ALFRED-5 kind** | `flow.humanApproval` |
| **Class** | `HumanApprovalFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-user-check` |
| **Colour** | `#d946ef` |
| **Size** | 96×96 |
| **Purpose** | Suspends execution until a human approves or rejects. Emits the approved value or a rejection. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| value | INPUT | `value` | Input value (pending approval) | `unknown` |
| approved | OUTPUT | `approved` | Approved | `unknown` |
| rejected | OUTPUT | `rejected` | Rejected | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `value` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `title` | Standard CRUD (text input) | Approval request title |
| `message` | Standard CRUD (textarea) | Approval request message |
| `approvers` | Standard CRUD (array of user IDs) | Optional list of approver IDs |
| `timeoutMs` | Standard CRUD (number input) | Suspension timeout; default 86400000 (24h) |

**Recommended usage:** Follow with an If node checking `approved === true`.

---

## 7. Utility Nodes (ALFRED-5 §6.7–6.12, §7, DECAF-32 §22.2.3)

Utility nodes compile into concrete Mastra steps. The engine treats them as ordinary executable nodes.

**Palette group:** `Data` / `Code`
**Category colour:** `#0d9488` (teal)
**Category icon:** `ti-tool`

### 7.1 Merge

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.merge` |
| **ALFRED-5 kind** | `flow.merge` |
| **Class** | `MergeFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-arrows-merge` |
| **Colour** | `#0d9488` |
| **Size** | 96×96 |
| **Purpose** | Merges multiple branch outputs into a single normalised output object. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| values | INPUT | `values` | Branch outputs | `unknown[]` |
| merged | OUTPUT | `merged` | Merged output | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `values` | `PortToggleCrudComponent` | Manual array OR connected from upstream branches |
| `strategy` | Standard CRUD (select: pass-through/pick-first/object/array/custom) | Default `object` |
| `mapping` | Standard CRUD (mapping editor) | Optional custom mapping spec |

---

### 7.2 Map / Set

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.map` |
| **ALFRED-5 kind** | `flow.map` |
| **Class** | `MapFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-arrows-right-left` |
| **Colour** | `#84cc16` |
| **Size** | 96×96 |
| **Purpose** | Transforms the current input into a new output object using the configured mapper. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| value | INPUT | `value` | Input value | `unknown` |
| result | OUTPUT | `result` | Transformed output | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `value` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `mapping` | Standard CRUD (mapping editor) | `MappingSpec` defining the transform |

---

### 7.3 Delay

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.delay` |
| **ALFRED-5 kind** | `flow.delay` |
| **Class** | `DelayFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-clock-hour-4` |
| **Colour** | `#a3a3a3` |
| **Size** | 96×96 |
| **Purpose** | Pauses execution for the configured duration, then forwards the input unchanged. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| value | INPUT | `value` | Input value | `unknown` |
| valueOut | OUTPUT | `value` | Output value (forwarded) | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `value` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `amount` | Standard CRUD (number input) | Duration amount |
| `unit` | Standard CRUD (select: ms/seconds/minutes/hours) | Default `seconds` |

---

### 7.4 Return

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.return` |
| **ALFRED-5 kind** | `flow.return` |
| **Class** | `ReturnFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-arrow-back-up` |
| **Colour** | `#22c55e` |
| **Size** | 96×96 |
| **Purpose** | Normalises the input into the final workflow output object. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| value | INPUT | `value` | Input value | `unknown` |
| result | OUTPUT | `result` | Returned output | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `value` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `outputSchema` | Standard CRUD (JSON/Zod schema editor) | Schema for the normalised output |
| `mapping` | Standard CRUD (mapping editor) | Optional output mapping |

---

### 7.5 Code

| Field | Value |
|:---|:---|
| **Engine kind** | `core.flow.code` |
| **ALFRED-5 kind** | `flow.code` |
| **Class** | `CodeFlowNode` (`flow-control.ts`) |
| **Icon** | `ti-code` |
| **Colour** | `#7c3aed` |
| **Size** | 96×96 |
| **Purpose** | Runs user-authored JS/TS in a restricted VM sandbox. Supports placeholder syntax for workflow data references. |

**Ports:**

| Port | Direction | Handle | Label | Type |
|:---|:---|:---|:---|:---|
| input | INPUT | `input` | Input (accessible as `$input`) | `unknown` |
| result | OUTPUT | `result` | Code execution result | `unknown` |

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `input` | `PortToggleCrudComponent` | Manual value OR connected from upstream port |
| `code` | Code editor (textarea with `{{ }}` placeholder autocomplete) | User-authored JS/TS code |
| `language` | Standard CRUD (select: js/ts) | Default `ts` |
| `timeoutMs` | Standard CRUD (number input) | Sandbox timeout; default 1000 |
| `memoryMb` | Standard CRUD (number input) | Sandbox memory limit; default 32 |
| `outputSchema` | Standard CRUD (JSON/Zod schema editor) | Optional output schema for validation |
| `placeholderMode` | Standard CRUD (select: path-only) | Placeholder resolution mode |

**Placeholder syntax (ALFRED-5 §7.5–7.7, DECAF-32 §22.4):**

| Placeholder | Meaning |
|:---|:---|
| `{{ $input }}` / `{{ $json }}` | Full current input object |
| `{{ $input.foo }}` | Path inside current input |
| `{{ $item }}` / `{{ $item.foo }}` | Current foreach loop item |
| `{{ $index }}` | Current loop index |
| `{{ $vars.foo }}` | Workflow variable |
| `{{ $output }}` | Current draft output |
| `{{ $node["Node Name"].output }}` | Output of another (upstream) node |
| `{{ $node["Node Name"].output.foo }}` | Path inside another node output |

**Sandbox constraints:** No imports, filesystem, network, process, global access, or system APIs. Output must be JSON-serializable.

---

## 8. Agent Nodes (DECAF-32 §22.2.4)

Agent nodes wrap an AI agent (LLM + tools + memory) as a single graph node. They differ from utility nodes in that they declare **connection ports** for their structural dependencies rather than receiving them as regular `@input` values.

**Palette group:** `Agent`
**Category colour:** `#7c3aed` (violet)
**Category icon:** `ti-robot`

### 8.1 Agent

| Field | Value |
|:---|:---|
| **Engine kind** | `core.agent` |
| **ALFRED-5 kind** | (none — DECAF-32 addition) |
| **Class** | `AgentNode` (`agent.ts`) |
| **Icon** | `ti-robot` (resolved from category) |
| **Colour** | `#7c3aed` (resolved from category) |
| **Size** | 120×140 |
| **Shape** | Rectangle (no border radius — distinguishes composite entities) |
| **Purpose** | AI agent that orchestrates a model, memory, and workspace to complete a task. |

**Ports:**

| Port | Direction | Handle | Label | Type | Side |
|:---|:---|:---|:---|:---|:---|
| prompt | INPUT | `prompt` | Prompt | `string` | LEFT |
| response | OUTPUT | `response` | Response | `string` | RIGHT |
| actions | OUTPUT | `actions` | Actions | `unknown[]` | RIGHT |
| model | CONNECTION | `model` | Model (LLM) | `void` | BOTTOM (`#3b82f6`) |
| memory | CONNECTION | `memory` | Memory store | `void` | BOTTOM (`#10b981`) |
| workspace | CONNECTION | `workspace` | Workspace/context | `void` | BOTTOM (`#f59e0b`) |

> Connection ports are coloured by their `category` field, not by the node's accent colour. The renderer reads the category from `port.graph.category` and resolves the colour from the category style registry.

**CRUD / Edit screen:**

| Property | Editor | Notes |
|:---|:---|:---|
| `prompt` | `PortToggleCrudComponent` (textarea) | Supports placeholder expressions like `{{ $input.brief }}` or `{{ $node["Research"].output.summary }}` |
| `response` | Standard CRUD (textarea, read-only at runtime) | Agent's output response |
| `actions` | Standard CRUD (array, read-only at runtime) | Actions taken by the agent |
| `model` | Connection port (canvas wiring) | Connected on the canvas, not in the modal |
| `memory` | Connection port (canvas wiring) | Connected on the canvas, not in the modal |
| `workspace` | Connection port (canvas wiring) | Connected on the canvas, not in the modal |

---

## 9. Node Palette Summary (ALFRED-5 §10)

```txt
Triggers
- Manual Trigger       (core.trigger.manual)
- Webhook Trigger      (core.trigger.webhook)
- Schedule Trigger     (core.trigger.schedule)
- Event Trigger        (core.trigger.event)
- Form Trigger         (core.trigger.form)
- Chat Trigger         (core.trigger.chat)

Flow Control
- If / Then / Else     (core.flow.if)
- Switch               (core.flow.switch)
- For Each             (core.loop.foreach)
- While                (core.loop.while)
- Do Until             (core.loop.until)
- Parallel             (core.flow.parallel)
- Try / Catch          (core.flow.errorBoundary)
- Human Approval       (core.flow.humanApproval)
- Delay                (core.flow.delay)
- Return               (core.flow.return)

Data / Utility
- Merge                (core.flow.merge)
- Map / Set            (core.flow.map)

Code
- Code                 (core.flow.code)

Agent
- Agent                (core.agent)
```

## 10. Global Validation Rules (ALFRED-5 §11)

1. Exactly one trigger exists, unless multi-trigger workflows are supported.
2. Trigger has at least one outgoing edge.
3. No disconnected runtime nodes exist.
4. All required input ports are connected.
5. Flow-control branches have required outgoing branches.
6. Switch cases are ordered and have stable IDs.
7. ForEach input is array-like.
8. While and Do Until have `maxIterations`.
9. Cycles are only valid inside loop constructs.
10. Parallel has at least two branches.
11. Branch and parallel outputs are merged or schema-compatible.
12. Return node defines workflow output schema.
13. Code Node placeholders are valid.
14. Code Node references only upstream nodes.
15. Code Node output is JSON serializable.
16. Code Node output matches schema when configured.
17. Webhook paths are unique.
18. Schedule cron expressions are valid.
19. Form fields produce a valid input schema.
20. Human Approval has title and message.

## 11. Tasks Breakdown

This is a documentation-only specification. No code tasks.

| ID | Task Name | Priority | Status | Dependencies |
|:--|:--|:--|:--|:--|
| — | (documentation only — node declarations already exist in DECAF-32 TASK-228/TASK-229) | — | — | — |

## 12. Open Questions / Risks

* **Loop node declarations:** The three loop kinds (`core.loop.foreach/while/until`) are currently declared in the for-angular demo layer, not in `integrations/src/graph/nodes/`. Should they be promoted to production declarations? (Low risk — they work as-is for the demo; ALFRED-7 will provide the production declarations.)
* **Switch dynamic ports:** The `SwitchFlowNode` uses `static applyMetadata()` to compute ports at runtime. The ALFRED-5 spec defines `portsForSwitch()` as a standalone function. The production declaration uses the `GraphNode` base class pattern instead. These are equivalent.
* **Parallel port model:** ALFRED-5 defines dynamic per-branch output ports; the production declaration uses a single `branches` array output. ALFRED's compilation layer may need to reconcile this.
* **Error Boundary branches:** ALFRED-5 defines three branch outputs (`try`/`catch`/`finally`); the production declaration uses `result`/`error` with a `finally` metadata flag. Downstream compilers should map accordingly.

## 13. Results & Artifacts

* `workdocs/ai/project/specifications/DECAF_34.md` — this catalogue.
* `integrations/src/graph/nodes/triggers.ts` — 6 trigger node declarations.
* `integrations/src/graph/nodes/flow-control.ts` — 10 flow-control/utility node declarations.
* `integrations/src/graph/nodes/agent.ts` — Agent node declaration.
* `integrations/src/graph/nodes/base.ts` — `GraphNode` base class with `applyMetadata()`.
* `integrations/src/graph/nodes/category-styles.ts` — Category style registry.
* `decaf-ts/workdocs/ai/project/specifications/DECAF_32.md` §22.2 — Engine node kind taxonomy (canonical reference).
