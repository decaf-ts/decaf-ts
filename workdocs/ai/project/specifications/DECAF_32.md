# DECAF-32 — Decaf Graph Execution Engine

**Status:** Re-opened — Phase 2: Production Integration (Phase 1 core engine completed; graph page wiring and full-stack e2e validation pending)
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
This specification defines a native graph execution engine for `@decaf-ts/integrations/graph`.

The engine executes graph workflows declared using `@decaf-ts/ui-decorators/graph`, emits execution updates through Decaf's existing `Observable`/`Observer` pipeline, integrates with `@decaf-ts/for-angular/graph`, supports explicit structured loops, supports configurable value stores, and supports pinnable/cacheable nodes for expensive operations.

The engine is intended to be a **reference interpreter** for Decaf graph workflows, not a production distributed workflow orchestrator.

Project-specific engines, such as a Mastra-based AI backend, should be able to reuse the same graph definitions and planning concepts, but should remain separate from this core implementation.

### 1.1 High-Level Architecture

```txt
@decaf-ts/ui-decorators/graph
  graph declaration layer
  decorators, ports, metadata, definitions, snapshots

@decaf-ts/integrations/graph
  graph execution layer
  planning, validation, executor registry, value routing,
  structured loops, configurable value stores, execution result,
  pinning/cache behavior, Observable events

@decaf-ts/for-angular/graph
  graph UI layer
  Angular canvas rendering, workflow input forms,
  RxJS bridge, node/edge/loop execution-state visualization

project-specific backend, e.g. Mastra
  production AI execution layer
  compiles Decaf graph plans into Mastra workflows
```

Core rule:

```txt
Decaf graph definitions are the source of truth.
Core graph engine is the reference runtime.
Angular is a UI adapter.
Mastra or other backends are execution adapters/compilers.
```

### 1.1.1 Downstream Consumer — the-alfred-ai

The `the-alfred-ai` project (repo: `/home/tvenceslau/local-workspace/the-alfred-ai`) is the primary downstream consumer of this engine. Its specifications — ALFRED-4, ALFRED-5, ALFRED-6, ALFRED-7, ALFRED-8, and UPSTREAM-1 (in `the-alfred-ai/workdocs/ai/project/specifications/`) — define a Mastra-based workflow editor that compiles Decaf graph snapshots into Mastra workflows.

**Source-of-truth boundary:** This specification (DECAF-32) is the canonical source for all **Mastra-agnostic** graph functionality — graph declaration, metadata, execution engine, loops, pinning, snapshots, and Angular rendering. The ALFRED specs MUST reference this specification for those concerns and MAY NOT re-define or duplicate them. The ALFRED specs own only the **Mastra-specific** compilation layer (compiling Decaf graph snapshots into Mastra `createStep()` / `createWorkflow()` / composition-API calls).

**Mastra-agnostic concepts owned by DECAF-32 (referenced by ALFRED):**

| Concept | DECAF-32 section | ALFRED spec that references it |
|:---|:---|:---|
| Graph declaration decorators (`@node`, `@input`, `@output`, `@graph`) | §1.2 | ALFRED-5 §2.7, ALFRED-7 §1, ALFRED-8 §1 |
| Graph definition readers (`graphDefinitionOf`, `graphWorkflowDefinitionOf`) | §1.2 | ALFRED-7 §4.1 |
| Graph snapshot types & round-trip | §5.11, §20.4 | ALFRED-7 §4.6, ALFRED-8 §4.5 |
| Structured loop executors (`foreach`, `while`, `until`) | §5.9 | ALFRED-5 §6.3–6.5 |
| Node executor registry pattern | §5.8, §10 | ALFRED-5 §4.7 (StepFactory) |
| Execution plan / topological planner | §5.7 | ALFRED-5 §9 (compilePath) |
| Angular graph renderer & node templates | §5.12, §21 | ALFRED-8 §4.2–4.3 |
| Node-edit modal with port-toggle CRUD | §20 | ALFRED-8 §4.2 (PortToggleCrudComponent) |
| Minimal node visual contract | §21 | ALFRED-8 §4.3 (node web-components) |
| Pinnable nodes & cache | §5.6 | (no ALFRED equivalent — DECAF-only) |

**Mastra-specific concepts owned by ALFRED (not in DECAF-32):**

| Concept | ALFRED spec | Notes |
|:---|:---|:---|
| Mastra workflow compilation (`createStep`, `createWorkflow`, `.branch()`, `.foreach()`, `.dowhile()`, `.dountil()`, `.parallel()`) | ALFRED-5 §9 | Brain-resident; core never imports `@mastra/*`. |
| `MastraManaged*` primitives (Agent, Workflow, Step, Tool, Model, Prompt) | ALFRED-5 §4.8, ALFRED-4 | Brain wrappers around Mastra core objects. |
| `Managed*Builder` concrete implementations | ALFRED-5 §4.8, ALFRED-4 | Brain builders returning `MastraManaged*` instances. |
| `CompileContext` with `StepFactory` / `WorkflowBuilderFactory` / `WorkflowRunner` | ALFRED-5 §4.5 | Bridge between Mastra-agnostic compiler logic and Mastra runtime. |
| Trigger node compilation (webhook handler, schedule cron, form handler) | ALFRED-5 §5 | Compiles to Mastra runtime route metadata + workflow runner. |
| Code Node sandbox (`isolated-vm`, `acorn` validation, `typescript` transpilation) | ALFRED-5 §7 | Brain-resident to keep heavy deps out of core. |
| DB-backed node persistence (`ai_nodes`, `ai_node_categories`) | ALFRED-7 §4.4 | Alfred-specific persistence layer (Decaf `Repository` pattern). |
| Condition expression DSL (`ConditionExpression`) | ALFRED-5 §8 | Declarative, serializable; ALFRED-8 condition editor renders it. |
| Module-prefixed node IDs (`core.flow.if`, `core.trigger.manual`) | ALFRED-7 §4.3 | Alfred convention for globally-unique node IDs. |

### 1.2 Existing Foundation

`@decaf-ts/ui-decorators/graph` already provides graph primitives and metadata:

```ts
GraphKeys
PortDirection
GraphNodeMetadata
GraphWorkflowMetadata
GraphPortMetadata
GraphPortDefinition
GraphNodeDefinition
GraphWorkflowDefinition
GraphWorkflowRelationMetadata
GraphConnectionRule
GraphPortGroupMetadata
```

It also provides readers:

```ts
graphDefinitionOf(...)
graphWorkflowDefinitionOf(...)
graphPortsOf(...)
graphLeafPortsOf(...)
graphNodeMetadataOf(...)
graphWorkflowMetadataOf(...)
graphPortDefinitionOf(...)
```

The core engine must **consume** these definitions. It must not duplicate graph metadata reading logic.

`@decaf-ts/for-angular/graph` already provides Angular graph rendering and workflow UI support. Its role remains rendering workflow graph, nodes/ports, workflow inputs, UI state, listening to execution events, and displaying node/edge/loop progress. It must not own execution semantics.

`decaf-ts/as-zod` should be used to convert Decaf model/schema metadata into Zod schemas where possible. The graph engine must prefer Decaf's model-to-Zod bridge instead of manually rebuilding schema semantics from scratch.

## 2. Goals
*   [ ] Workflow execution from `GraphWorkflowDefinition`.
*   [ ] Directed node execution.
*   [ ] Workflow input and output binding.
*   [ ] Node input and output routing.
*   [ ] Fan-in.
*   [ ] Fan-out.
*   [ ] Async node executors.
*   [ ] Parallel execution of independent nodes.
*   [ ] Structured loop nodes: `foreach`, `while`, `until`.
*   [ ] Observable execution events.
*   [ ] Configurable value storage.
*   [ ] Pinnable/cacheable nodes.
*   [ ] Recursive dependency pinning.
*   [ ] Validation through Decaf metadata and `as-zod`.
*   [ ] Snapshot-compatible execution-state patches.
*   [ ] Angular/RxJS bridge in `for-angular`.
*   [ ] Working graph execution engine on the for-angular graph page (Run button, real-time node/edge state, workflow outputs).
*   [ ] RamAdapter-backed persistence for graph execution results and pinned values.
*   [ ] NestJS backend module hosting the graph engine (for-nest + integrations) as the supplier.
*   [ ] for-angular consuming graph execution via the for-http adapter (REST + SSE).
*   [ ] Full-stack e2e test validating the production communication pipeline.
*   [ ] Double-click on any graph node opens a modal with that node's input-schema CRUD rendering (update mode).
*   [ ] Graph-aware CRUD field component with a "use as port" checkbox that exposes the matching graph port for connection.
*   [ ] Output port splitting: a single output port can be connected to multiple input ports.
*   [ ] Future compatibility with a Mastra compiler/backend.
*   [x] Recognition of the full ALFRED-5 node kind taxonomy (§22.2): trigger nodes (manual/webhook/schedule/event/form/chat), flow-control nodes (if/switch/parallel/merge/map/delay/errorBoundary/humanApproval/return/code), and the already-implemented loop nodes (foreach/while/until). (TASK-228 — production node declarations in `integrations/src/graph/nodes/`.)
*   [x] Recognition of the ALFRED-5 ConditionExpression DSL (§22.3) as a `custom` condition payload for `GraphConditionEvaluator`. (TASK-228 — `ConditionExpressionEvaluator` + `op`-field dispatch in `GraphConditionEvaluator`.)
*   [ ] Recognition of the ALFRED-5 Code Node placeholder syntax (§22.4) for future `core.flow.code` executor integration.
*   [ ] Compatibility with ALFRED-7 module-prefixed node IDs (§22.7) — the executor registry treats kind strings as opaque, so `<module>.<kind>` IDs work without engine changes.
*   [ ] Compatibility with ALFRED-7 reference-based workflow serialization (§22.6) — the engine works with full `GraphWorkflowDefinition` objects; downstream DB-backed node resolution is a layer on top.
*   [ ] Compatibility with ALFRED-8 Angular node web-components (§22.9) — downstream per-kind components extend the base `GraphNodeTemplateComponent` (§21) without engine changes.
*   [x] `@connection()` port decorator (§21.6.1) for structural dependencies typed by `category` (model/memory/workspace), rendered on the bottom edge of nodes. (`PortDirection.CONNECTION` in `ui-decorators/graph`; `AgentNode` in `integrations/src/graph/nodes/agent.ts`.)
*   [x] Category-based colour/icon resolution (§21.8.2): `@node()` `color`/`icon` are optional overrides; when omitted, `effectiveColor`/`effectiveIcon` are resolved from the `GraphCategoryStyle` registry. (`registerGraphCategoryStyle` / `resolveEffectiveColor` / `resolveEffectiveIcon` in `ui-decorators/graph`; built-in categories in `integrations/src/graph/nodes/category-styles.ts`.)
*   [x] Agent node (`core.agent`) with `@connection` ports for model/memory/workspace, each coloured by category. (`AgentNode` in `integrations/src/graph/nodes/agent.ts`; rendered in for-angular `GraphNodeTemplateComponent`.)

## 3. Non-Goals For V1
Do not implement in v1:

```txt
distributed workers
durable execution engine
arbitrary graph cycles as loops
human-in-the-loop suspend/resume
retry/backoff engine
cron/scheduled workflow execution
streaming partial edge values
custom unsandboxed JavaScript condition evaluator
Mastra compiler
Angular-specific runtime logic inside core
RxJS dependency inside core
```

## 4. User Stories / Requirements
*   **US-1:** As a Decaf consumer, I want to execute a `@graph(...)` workflow through a reference engine so that I can validate graph behaviour without a project-specific backend.
*   **US-2:** As a Decaf consumer, I want node executors to receive a `GraphExecutionContext` (a Decaf `Context`) so that they can report progress and log through the same mechanism as task handlers.
*   **US-3:** As a Decaf consumer, I want structured `foreach`, `while`, and `until` loop nodes so that iteration is explicit, bounded, and observable.
*   **US-4:** As a Decaf consumer, I want to plug in a custom value store adapter so that cached/pinned values can live in memory, local storage, a database, Redis, or a remote service.
*   **US-5:** As a Decaf consumer, I want to pin an expensive completed node and have the engine pin its full upstream dependency subtree so that subsequent runs reuse cached values safely.
*   **US-6:** As a Decaf consumer, I want execution events to flow through Decaf's `Observable`/`Observer` pipeline so that UI adapters (Angular/RxJS) and other consumers can subscribe uniformly.
*   **US-7:** As an Angular consumer, I want an RxJS bridge and execution service so that graph rendering can display node/edge/loop/cache/pin state in real time.
*   **US-8:** As a project maintainer, I want the core engine to stay free of Angular, RxJS, and Mastra dependencies so that it remains a portable reference runtime.
*   **US-9:** As a Decaf consumer, I want the for-angular graph page to have a "Run" button that executes the displayed workflow through the real engine so that I can see live execution results, not just a static renderer.
*   **US-10:** As a Decaf consumer, I want graph execution results and pinned values to be persisted via RamAdapter so that execution state survives across page reloads within the same session.
*   **US-11:** As a Decaf maintainer, I want a NestJS module that hosts the graph execution engine server-side so that for-angular can consume graph execution as a real API (REST + SSE), not just an in-process call.
*   **US-12:** As a Decaf maintainer, I want a dedicated full-stack e2e test that boots the actual for-nest backend with the graph engine and validates that for-angular (via the for-http adapter) can trigger execution and receive events over the network.
*   **US-13:** As a Decaf consumer, I want to double-click any graph node to open a modal showing that node's input-schema CRUD form (in update mode) so that I can inspect and edit the node's configured input values without leaving the graph page.
*   **US-14:** As a Decaf consumer, I want each field in the node-edit modal to have a "use as port" checkbox on its left side (off by default) so that I can choose which inputs are wired from upstream outputs (checkbox on) versus set as literal values in the form (checkbox off).
*   **US-15:** As a Decaf consumer, I want output ports to be splittable so that a single node output can feed multiple downstream inputs, enabling fan-out directly from the node-edit modal.
*   **US-16:** As a Decaf consumer, I want all node-edit modal configuration — which inputs are port-wired vs literal, output port splits, and connection precedence — to be serialized into the graph snapshot so that loading a saved graph fully restores every connection and value binding without manual reconfiguration.
*   **Req-1:** `GraphExecutionContext` must extend or implement Decaf's `Context` abstraction from `@decaf-ts/core`, mirroring the `TaskEngine`/`TaskContext` pattern.
*   **Req-2:** The engine must not treat arbitrary cycles as executable loops. Each workflow graph (including loop-body workflows) must be acyclic. Loop behaviour is represented by loop nodes that execute nested workflow bodies repeatedly.
*   **Req-3:** The value store must be configurable via `GraphValueStoreAdapter`. The engine must not be hardcoded to an in-memory map.
*   **Req-4:** Only nodes explicitly marked pinnable (via `@pinnable()` metadata) may be pinned. Pinning a node must recursively pin all upstream dependencies (all-or-nothing in v1).
*   **Req-5:** Pinned values must only be reused when stable fingerprints match. Fingerprints must include workflow id, node id/kind, node definition version, executor version, relevant inputs, and dependency fingerprints.
*   **Req-6:** The engine must emit structured `GraphExecutionEvent`s through Decaf's `Observable` pipeline, with event types covering workflow, node, edge, loop, validation, and store lifecycle.
*   **Req-7:** The engine must prefer `decaf-ts/as-zod` for schema resolution and fall back to primitive type mapping when needed.
*   **Req-8:** The engine must produce a `GraphExecutionSnapshotPatch` consumable by `ui-decorators/graph` snapshots, rather than replacing the snapshot system.
*   **Req-9:** Core must have no Angular dependency, no RxJS dependency, and no Mastra dependency.
*   **Req-10:** The `@pinnable()` decorator and pinning metadata should live in `@decaf-ts/ui-decorators/graph` (preferred). If that is not desirable immediately, a temporary decorator may live in `@decaf-ts/integrations/graph`, but the long-term correct package is `ui-decorators/graph`.
*   **Req-11:** The for-angular graph page must wire a "Run" button to `GraphExecutionService.execute()`, feed workflow input form values as execution inputs, and display real-time node/edge/loop state via `GraphExecutionStateMapper`.
*   **Req-12:** Graph execution results and pinned values must be persisted via RamAdapter (the default adapter in the for-angular app). A `GraphExecutionResultRepository` (or equivalent) should store completed run results as Decaf models so they survive page reloads.
*   **Req-13:** A `GraphExecutionModule` for for-nest must host the `GraphExecutionEngine`, expose `POST /graph/execute` for triggering execution, and expose `GET /graph/events` (SSE) for streaming events. The module must use RamAdapter for server-side persistence.
*   **Req-14:** The full-stack e2e test must boot a real NestJS application (not mocked), use for-http's `ServerEventConnector` or `AxiosHttpAdapter` as the client, trigger execution via HTTP, and validate that all event types arrive via SSE in the correct order with correct payloads.
*   **Req-15:** The full-stack e2e test must validate that persisted execution results are retrievable from RamAdapter after execution completes.
*   **Req-16:** Double-clicking any graph node must open a modal containing a CRUD form built from that node's input schema (the decorated `Model` class), rendered in update mode with current values pre-populated.
*   **Req-17:** The node-edit modal must use a graph-aware CRUD field component that extends the standard for-angular CRUD field, adding a "use as port" checkbox on the left side of each field (off by default). When checked, the field's input is hidden and the matching graph port is exposed for connection on the canvas. When unchecked, the field accepts a literal value and no port is rendered.
*   **Req-18:** The "use as port" checkbox state, the literal field values, and any output-port split configuration must be stored as part of the graph snapshot — in the existing `GraphWorkflowSnapshot` / `GraphWorkflowDefinition` format — so that loading a saved graph restores all connections, precedences, and value bindings without loss.
*   **Req-19:** Output port splitting must be serialized as multiple `GraphWorkflowRelation` entries sharing the same `source`/`sourcePort` but targeting different `target`/`targetPort` pairs. The engine and planner must already support fan-out (multiple outgoing edges from one port) — this requirement ensures the UI produces those relations when the user splits an output from the node-edit modal.
*   **Req-20:** The graph snapshot's `nodeValues` (or equivalent per-node data section) must persist, per node: (a) the set of input fields marked "use as port", (b) the literal values for non-port fields, and (c) the output split metadata. On load, the renderer must reconstruct ports, values, and edges from this data.
*   **Req-21:** The existing `graphWorkflowSnapshotToJSON` / `graphWorkflowSnapshotFromJSON` round-trip must preserve this per-node configuration. A snapshot saved after configuring nodes via the modal must produce an identical graph (same ports, same edges, same literal values, same split outputs) when loaded.

## 5. Architecture & Design

### 5.1 Package Layout
Add a new graph area to `@decaf-ts/core` (re-exported via `@decaf-ts/integrations/graph`):

```txt
src/graph
├── constants.ts
├── types.ts
├── decorators.ts
├── index.ts
│
├── errors
│   ├── GraphCycleError.ts
│   ├── GraphExecutionError.ts
│   ├── GraphInputError.ts
│   ├── GraphLoopLimitError.ts
│   ├── GraphPinningError.ts
│   ├── GraphPortError.ts
│   ├── GraphStoreError.ts
│   ├── GraphTopologyError.ts
│   └── index.ts
│
├── events
│   ├── GraphExecutionEvent.ts
│   ├── GraphExecutionEventEmitter.ts
│   ├── GraphExecutionEventFactory.ts
│   ├── GraphExecutionObserver.ts
│   └── index.ts
│
├── execution
│   ├── GraphExecutionContext.ts
│   ├── GraphExecutionEngine.ts
│   ├── GraphExecutionFrame.ts
│   ├── GraphExecutionResult.ts
│   ├── GraphNodeExecutor.ts
│   └── index.ts
│
├── loops
│   ├── ForeachGraphNodeExecutor.ts
│   ├── UntilGraphNodeExecutor.ts
│   ├── WhileGraphNodeExecutor.ts
│   ├── GraphConditionEvaluator.ts
│   ├── GraphLoopExecutionContext.ts
│   └── index.ts
│
├── pinning
│   ├── GraphPinningService.ts
│   ├── GraphPinningPolicy.ts
│   ├── GraphPinningMetadata.ts
│   ├── GraphPinningDependencyResolver.ts
│   └── index.ts
│
├── planning
│   ├── GraphExecutionPlan.ts
│   ├── GraphExecutionPlanner.ts
│   ├── GraphExecutionPlanNode.ts
│   ├── GraphExecutionPlanEdge.ts
│   ├── GraphExecutionPlanLayer.ts
│   ├── GraphRelationResolver.ts
│   ├── GraphTopology.ts
│   └── index.ts
│
├── registry
│   ├── GraphNodeExecutorRegistry.ts
│   ├── GraphNodeExecutorResolver.ts
│   └── index.ts
│
├── store
│   ├── GraphValueStore.ts
│   ├── GraphValueStoreAdapter.ts
│   ├── InMemoryGraphValueStoreAdapter.ts
│   ├── GraphCachedValue.ts
│   ├── GraphValueKey.ts
│   └── index.ts
│
├── validation
│   ├── GraphDefinitionValidator.ts
│   ├── GraphPortSchemaResolver.ts
│   ├── GraphValueValidator.ts
│   └── index.ts
│
└── snapshots
    ├── GraphExecutionSnapshotMapper.ts
    └── index.ts
```

Follow Decaf repository conventions: one class per file, one interface per file unless purely local, types grouped in `types.ts`, constants/enums in `constants.ts`, decorators in `decorators.ts`, specific-file imports only (no folder/index imports internally except external package entrypoints).

### 5.2 GraphExecutionContext as a Decaf Context
`GraphExecutionContext` must extend or implement Decaf's existing `Context` abstraction from `@decaf-ts/core`. It must be used the same way `TaskEngine` uses `TaskContext`. The graph engine follows the same conceptual pattern:

```txt
TaskEngine creates TaskContext, passes it to the handler, handler reports progress through context.
GraphExecutionEngine creates GraphExecutionContext, passes it to the node executor, executor reports progress through context.
```

Every node executor must receive a `GraphExecutionContext`:

```ts
export interface GraphNodeExecutor<
  Input extends GraphExecutionValues = GraphExecutionValues,
  Output extends GraphExecutionValues = GraphExecutionValues,
> {
  execute(input: Input, context: GraphExecutionContext): Promise<Output> | Output;
}
```

If `Context` constructor requires parameters, use the same pattern used by `TaskContext`. If `TaskContext` has inherited methods for cancellation, metadata, progress, logger, or storage, mirror the same usage in `GraphExecutionContext`.

### 5.3 Events and Observers
`GraphExecutionObserver` extends Decaf's `Observer`. `GraphExecutionEventEmitter` implements Decaf's `Observable`. A `GraphExecutionEventFactory` produces event IDs, timestamps, and sequence numbers.

### 5.4 Errors
Structured errors extend a common `GraphExecutionError` base: `GraphCycleError`, `GraphInputError`, `GraphLoopLimitError`, `GraphPinningError`, `GraphPortError`, `GraphStoreError`, `GraphTopologyError`.

### 5.5 Configurable Value Store
The value store must be configurable via `GraphValueStoreAdapter`. Users may provide adapters for in-memory, local storage, database, Redis, file-backed, remote, encrypted, or replay/debug storage. The store supports workflow input values, node output values, workflow output values, pinned/cached values, run values, and temporary iteration values.

`GraphValueKey` includes `workflowId`, `nodeId`, `fingerprint`, optional `namespace` and `version`. The `fingerprint` must include workflow identity, node identity, node kind, node definition version, executor version, relevant inputs, dependency fingerprints, and optional user namespace.

`GraphCachedValue` includes `key`, `outputs`, `pinned`, `createdAt`, `updatedAt`, optional `expiresAt` and `metadata`.

`InMemoryGraphValueStoreAdapter` is provided as the default. `GraphValueStore` holds runtime values for the current execution and delegates persistent/cache/pinned values to the adapter.

### 5.6 Pinnable Nodes
Pinnability is node metadata exposed via `@pinnable()` (preferred home: `@decaf-ts/ui-decorators/graph`). The Angular renderer inspects this metadata to show pin actions. `GraphPinningPolicy` decides whether a node can be pinned and whether pinned values should be used. `GraphPinningDependencyResolver` resolves the upstream dependency subtree of a node. `GraphPinningService` computes cache keys, pins/unpins nodes, reads pinned values, and emits pinning events.

Pinning is all-or-nothing in v1: if any upstream dependency is not pinnable, the pin operation fails. Automatic pin strategy is metadata-supported but v1 default is manual. Unpinning only unpins the selected node by default.

Node fingerprints must change when meaningful inputs or dependencies change, using a stable JSON representation with recursively sorted keys and SHA-256 hashing (with stable JSON fallback for in-memory tests).

### 5.7 Execution Plan
The planner resolves workflow nodes and relations, validates IDs/endpoints/ports, builds incoming/outgoing maps, detects cycles among ordinary nodes, and produces topological execution layers using Kahn's algorithm. Workflow boundary edges do not count as executable-node dependencies. Loop nodes are treated as ordinary executable nodes at the containing workflow level. Arbitrary cycles are rejected.

### 5.8 Execution Engine
`GraphExecutionEngine` implements `Observable<[GraphExecutionObserver], [GraphExecutionEvent]>`. It validates the workflow definition, plans it, seeds workflow inputs, executes layers with a concurrency limit, validates inputs/outputs when enabled, routes values along edges, emits structured events, and returns a `GraphExecutionResult`.

Independent nodes in the same layer may execute in parallel via a small internal worker queue. No external concurrency dependency may be introduced.

### 5.9 Structured Loops
Loop metadata includes `body` (a `GraphWorkflowDefinition`), `maxIterations`, `timeoutMs`, `condition`, `concurrency`, and port mappings. Conditions are limited to safe built-in types (`truthy`, `falsy`, `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `exists`, `custom`). Arbitrary JavaScript expression evaluation is not implemented in core. The `custom` condition type MAY carry an ALFRED-5 `ConditionExpression` payload (§22.3) — the evaluator dispatches to a `ConditionExpression` evaluator when the condition object has an `op` field.

Loop node kinds: `core.loop.foreach`, `core.loop.while`, `core.loop.until`. Nested loop-body executions set `parentRunId` and `path = [...outerPath, loopNodeId, `iteration:${index}`]`.

These map to ALFRED-5's flow-control kinds (§22.2.2): `flow.foreach` → `core.loop.foreach`, `flow.while` → `core.loop.while`, `flow.doUntil` → `core.loop.until`. ALFRED-5 compiles these into Mastra composition APIs (`builder.foreach()`, `builder.dowhile()`, `builder.dountil()`); the engine's reference interpreter executes them directly via `ForeachGraphNodeExecutor`, `WhileGraphNodeExecutor`, and `UntilGraphNodeExecutor`. The remaining ALFRED-5 flow-control kinds (`flow.if`, `flow.switch`, `flow.parallel`, `flow.merge`, `flow.map`, `flow.delay`, `flow.errorBoundary`, `flow.humanApproval`, `flow.return`, `flow.code`) are recognized by the planner as ordinary executable nodes but have no built-in executor — downstream projects register custom executors or compile them away.

### 5.10 Validation
`GraphDefinitionValidator` validates workflow structure, node IDs, relations, ports, required port sources, cycles, loop metadata, loop body acyclicity, and connection rules. `GraphPortSchemaResolver` prefers `decaf-ts/as-zod` and falls back to primitive type mapping. `GraphValueValidator` validates workflow/node inputs and outputs, emitting `VALIDATION_FAILED` and throwing structured errors on failure.

### 5.11 Snapshot Integration
`GraphExecutionSnapshotMapper` maps `GraphExecutionResult` to `GraphExecutionSnapshotPatch` consumable by `ui-decorators/graph` snapshots. The engine does not replace the existing snapshot system.

### 5.12 Angular Integration
`for-angular` adds `src/graph/execution` with `GraphExecutionService` and `GraphExecutionEventSubjectObserver` (an RxJS bridge). Angular UI state types cover node/edge execution state, loop progress, cache/pin state. UI event handling maps graph events to renderer state. UI pin flow calls `GraphPinningService` through the Angular service.

### 5.13 Mastra Compatibility
The core engine must stay Mastra-independent. A future Mastra compiler may reuse `GraphExecutionPlanner`, `GraphRelationResolver`, `GraphDefinitionValidator`, `GraphPortSchemaResolver`, `GraphConditionEvaluator`, and `GraphPinningPolicy`. Mastra must not be imported into `@decaf-ts/core`.

## 6. Critical Runtime Rule: Explicit Loops Only
The engine must support loops, but must **not** treat arbitrary cycles as executable loops.

Invalid: `A -> B -> C -> A`
Valid: `A -> LoopNode -> D` where `LoopNode` is a special node kind with explicit loop metadata and a loop body workflow.

Reason: arbitrary cycles are ambiguous; loops need exit conditions, safety limits, UI-progress semantics, and Mastra-compatible compilation semantics. Each workflow graph, including loop-body workflows, must be acyclic.

## 7. Constants
Create `src/graph/constants.ts` with:

*   `GRAPH_WORKFLOW_BOUNDARY = "$workflow"`
*   `GRAPH_DEFAULT_CONCURRENCY = 4`
*   `GRAPH_DEFAULT_MAX_LOOP_ITERATIONS = 100`
*   `GRAPH_DEFAULT_MAX_FOREACH_ITERATIONS = 1000`
*   `GRAPH_PINNING_METADATA_KEY = "graph.pinnable"`
*   `GraphExecutionStatus` enum: `PENDING`, `PLANNING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `SKIPPED`, `CANCELLED`, `CACHED`.
*   `GraphExecutionEventType` enum covering `WORKFLOW_*`, `NODE_*` (including `NODE_CACHE_HIT`, `NODE_PINNED`, `NODE_UNPINNED`), `EDGE_VALUE_ROUTED`, `LOOP_*`, `VALIDATION_*`, and `STORE_*`.

## 8. Core Types
Create `src/graph/types.ts` with: `GraphRunId`, `GraphWorkflowId`, `GraphNodeId`, `GraphPortName`, `GraphExecutionValues`, `GraphExecutionOptions`, `GraphExecutionErrorPayload`, `GraphExecutionEvent`, `GraphNodeExecutionResult`, `GraphExecutionResult`, `GraphExecutionContextOptions`.

## 9. Engine API Additions For Pinning
`GraphExecutionEngine` should expose `pinNode(options)` and `unpinNode(options)`, delegating internally to `GraphPinningService`. Preferred architecture: engine owns execution, pinning service owns pin/unpin, Angular service composes both.

## 10. Example Usage
Executor:
```ts
export class AddNodeExecutor implements GraphNodeExecutor {
  execute(input, context) {
    context.progress({ message: "Adding values" });
    return { result: Number(input.a) + Number(input.b) };
  }
}
```

Registry and engine:
```ts
const registry = new GraphNodeExecutorRegistry();
const engine = new GraphExecutionEngine({
  registry,
  valueStoreAdapter: new InMemoryGraphValueStoreAdapter(),
});
registry
  .register("math.add", new AddNodeExecutor())
  .register("core.loop.foreach", new ForeachGraphNodeExecutor(engine))
  .register("core.loop.while", new WhileGraphNodeExecutor(engine))
  .register("core.loop.until", new UntilGraphNodeExecutor(engine));
```

Observe and execute:
```ts
engine.observe({ async refresh(event) { console.log(event.type, event.nodeId, event.payload); } });
const result = await engine.execute(graphWorkflowDefinitionOf(MyWorkflow), { a: 1, b: 2 });
```

Pin a node:
```ts
await pinningService.pinNode({ workflow, plan, result, nodeId: "expensiveCompletion", includeDependencies: true });
```

## 11. Required Tests
*   **Planner:** one-node workflow, multi-node workflow, fan-out, fan-in, unknown source/target node, unknown source/target port, reject non-loop cycle, deterministic topological layers, loop nodes treated as ordinary executable, loop body validated separately.
*   **Execution:** single node, workflow input to node input, node output to workflow output, node output to downstream input, independent nodes in same layer, async node, ordered events, missing executor, missing required input, full `GraphExecutionResult`, `GraphExecutionContext` as a Decaf `Context`, node executor can call `context.progress(...)`.
*   **Store:** in-memory default, custom adapter, write/read/delete cached, separate by workflow id, separate by fingerprint, run runtime values, store events.
*   **Pinning:** non-pinnable cannot be pinned, pinnable can be pinned after run, pin pins upstream dependencies, pin fails if upstream not pinnable, next run uses pinned values, cached executor not called, `NODE_CACHE_HIT`, `NODE_PINNED`, unpin removes cached value, fingerprint changes on input change, fingerprint changes on dependency output change, pinned value not reused on fingerprint mismatch.
*   **Loops:** foreach (per-item execution, ordered results, loop events, max iterations, empty array, reject non-array, child run path, serial stateful), while (condition true/false, condition events, max iterations, final state), until (at least once, stops when condition true, max iterations, final state).
*   **Observers:** observe registers, unregister function removes, `unObserve` removes, `updateObservers` awaits async, execution emits through observers, observer failure does not crash execution.
*   **Angular integration:** RxJS bridge receives events, `events$` emits, renderer marks node running on `NODE_STARTED`, edge active on `EDGE_VALUE_ROUTED`, node cached on `NODE_CACHE_HIT`, node pinned on `NODE_PINNED`, loop iteration state updates, workflow outputs on `WORKFLOW_COMPLETED`.

## 12. Acceptance Criteria
Implementation is complete when:
1.  `@decaf-ts/integrations/graph` exports the graph execution API.
2.  `GraphExecutionContext` is a Decaf `Context`.
3.  Node executors receive and use `GraphExecutionContext`.
4.  Engine executes a workflow from `GraphWorkflowDefinition`.
5.  Engine rejects invalid topology.
6.  Engine rejects unsupported arbitrary cycles.
7.  Engine supports explicit `foreach`, `while`, and `until` loop nodes.
8.  Engine emits structured events through Decaf `Observable`.
9.  Value store is configurable through adapters.
10. In-memory store adapter is provided.
11. Pinnable nodes are supported.
12. Only nodes with `@pinnable()` metadata can be pinned.
13. Pinning a node also pins all upstream dependency nodes.
14. Next run uses pinned cached values instead of re-executing pinned nodes.
15. Cache keys include stable fingerprints.
16. Angular can subscribe through an RxJS bridge.
17. Angular can display node, edge, loop, cache, and pin states.
18. Core has no Angular dependency.
19. Core has no RxJS dependency.
20. Core has no Mastra dependency.
21. Tests cover planner, execution, loops, store, pinning, observers, and Angular bridge.
22. Workdocs examples are added.

## 13. Implementation Order
Recommended implementation sequence:

1. Add constants and core types.
2. Add error classes.
3. Add `GraphExecutionContext` extending Decaf `Context`.
4. Add event observer/emitter/factory.
5. Add executor interface and registry.
6. Add configurable value store adapter API.
7. Add in-memory value store adapter.
8. Add execution plan types.
9. Add relation resolver.
10. Add planner with Kahn topological sorting.
11. Add value store runtime wrapper.
12. Add execution frame.
13. Add basic `GraphExecutionEngine`.
14. Add workflow input/output routing.
15. Add node input/output routing.
16. Add observer event emission.
17. Add definition/value validation stubs.
18. Add schema resolver using `as-zod`.
19. Add `foreach` loop executor.
20. Add condition evaluator.
21. Add `while` loop executor.
22. Add `until` loop executor.
23. Add `@pinnable` decorator in `ui-decorators/graph`.
24. Add pinning metadata reader support.
25. Add pinning policy.
26. Add dependency resolver for pinning.
27. Add pinning service.
28. Add cache-hit behavior to engine.
29. Add snapshot patch mapper.
30. Add Angular RxJS bridge.
31. Add Angular execution UI state.
32. Add Angular pin UI behavior.
33. Add tests.
34. Add workdocs.
35. Add NestJS `GraphExecutionModule` hosting the graph engine (for-nest + integrations + RamAdapter).
36. Add for-angular graph page "Run" button, real-time node/edge state, workflow outputs.
37. Add `GraphExecutionResultModel` and `GraphExecutionResultRepository` (RamAdapter persistence).
38. Add full-stack e2e test booting real NestJS backend with for-http client.
39. Add `GraphPortFieldComponent` extending CRUD field with "use as port" checkbox and output split control.
40. Add double-click handler on graph nodes to open CRUD modal in update mode using `GraphPortFieldComponent`.
41. Extend snapshot types to persist per-node port-binding mode (`'port' | 'value'`), literal values, and output splits.
42. Update snapshot round-trip (`toJSON`/`fromJSON` + renderer rebuild) to fully restore port modes, values, edges, and splits on load.

## 14. Workdocs To Add
*   `integrations/workdocs/graph/basic-workflow.md` — workflow input -> node -> workflow output.
*   `integrations/workdocs/graph/fan-in-fan-out.md` — A->C, B->C, C->D, C->E.
*   `integrations/workdocs/graph/foreach-loop.md` — items -> foreach(body workflow) -> results.
*   `integrations/workdocs/graph/while-loop.md` — stateful loop with `count < 10`.
*   `integrations/workdocs/graph/pinnable-nodes.md` — `@pinnable()`, pinning completed node, dependency pinning, cache hit on next run, custom value store adapter.
*   `for-angular/workdocs/graph/execution-events.md` — Angular event subscription and node-state mapping.
*   `for-angular/workdocs/graph/pinning-ui.md` — pin button, pinned badge, cache-hit state, dependency pinning.

## 15. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-210 | [Core graph scaffolding: constants, types, errors, GraphExecutionContext as Decaf Context](./tasks/TASK_210.md) | High | Completed | - |
| TASK-211 | [Event observer/emitter/factory and executor interface/registry](./tasks/TASK_211.md) | High | Completed | TASK-210 |
| TASK-212 | [Configurable value store adapter API + in-memory adapter + runtime wrapper](./tasks/TASK_212.md) | High | Completed | TASK-210 |
| TASK-213 | [Execution plan types, relation resolver, and Kahn topological planner](./tasks/TASK_213.md) | High | Completed | TASK-210 |
| TASK-214 | [Basic GraphExecutionEngine with workflow/node I/O routing and observer events](./tasks/TASK_214.md) | High | Completed | TASK-211, TASK-212, TASK-213 |
| TASK-215 | [Validation: definition validator, as-zod schema resolver, value validator](./tasks/TASK_215.md) | High | Completed | TASK-213 |
| TASK-216 | [Structured loops: condition evaluator + foreach/while/until executors](./tasks/TASK_216.md) | High | Completed | TASK-214 |
| TASK-217 | [@pinnable decorator in ui-decorators/graph + pinning metadata reader](./tasks/TASK_217.md) | High | Completed | TASK-210 |
| TASK-218 | [Pinning policy, dependency resolver, and pinning service with fingerprints](./tasks/TASK_218.md) | High | Completed | TASK-212, TASK-217 |
| TASK-219 | [Engine cache-hit behavior + pin/unpin API delegation + snapshot patch mapper](./tasks/TASK_219.md) | High | Completed | TASK-214, TASK-218 |
| TASK-220 | [Angular RxJS bridge, execution service, and execution UI state](./tasks/TASK_220.md) | High | Completed | TASK-214 |
| TASK-221 | [Angular pin UI behavior and event-to-renderer state mapping](./tasks/TASK_221.md) | High | Completed | TASK-219, TASK-220 |
| TASK-222 | [Comprehensive tests: planner, execution, loops, store, pinning, observers, Angular bridge](./tasks/TASK_222.md) | High | Completed | TASK-216, TASK-219, TASK-221 |
| TASK-223 | [Workdocs for basic workflow, fan-in/fan-out, loops, pinnable nodes, Angular events/pinning UI](./tasks/TASK_223.md) | Medium | Completed | TASK-222 |
| TASK-224 | [NestJS Graph Execution Backend: GraphExecutionModule for for-nest hosting the engine with RamAdapter persistence](./tasks/TASK_224.md) | High | Pending | TASK-222 |
| TASK-225 | [for-angular Graph Page Working Execution UI: Run button, real-time node/edge state, RamAdapter persistence](./tasks/TASK_225.md) | High | Pending | TASK-224 |
| TASK-226 | [Full-Stack E2E Test: boot real for-nest backend, for-http client consumer, validate production pipeline](./tasks/TASK_226.md) | High | Pending | TASK-224, TASK-225 |
| TASK-227 | [Node-Edit Modal: double-click opens CRUD modal with graph-aware port fields and output splitting](./tasks/TASK_227.md) | High | Pending | TASK-225 |
| TASK-228 | [Graph Snapshot Serialization: persist port-mode, literal values, and output splits so loading restores all connections](./tasks/TASK_228.md) | High | Pending | TASK-227 |

## 16. Open Questions / Risks
*   Should `@pinnable()` live in `@decaf-ts/ui-decorators/graph` from the start, or temporarily in `@decaf-ts/integrations/graph` until the `ui-decorators` types are extended?
*   Should `GraphNodeDefinition` gain a first-class `pinnable?: GraphPinningMetadata` field, or should pinning metadata be stored in `node.graph.metadata.pinnable` to avoid type changes?
*   Which hashing utility should be used for fingerprints (Node `crypto` vs a Decaf util), and what is the fallback shape for browser/test environments?
*   Risk: fingerprint stability across serializer versions could cause unintended cache misses; the fingerprint contract must be documented and tested.
*   Risk: parallel foreach with shared state is unsafe; v1 must default to serial foreach and only allow concurrency when no shared `statePort` exists.
*   Risk: observer failure could crash execution; the default behaviour must isolate observer errors from the execution path.

## 17. Results & Artifacts
*   `src/graph` area in core with constants, types, decorators, errors, events, execution, loops, pinning, planning, registry, store, validation, and snapshots subdirectories.
*   `GraphExecutionContext` extending Decaf `Context`.
*   `GraphExecutionEngine`, `GraphExecutionPlan`, `GraphExecutionResult`, and supporting classes.
*   `GraphValueStoreAdapter` interface and `InMemoryGraphValueStoreAdapter` default.
*   `GraphPinningService`, `GraphPinningPolicy`, `GraphPinningDependencyResolver`, and `@pinnable()` decorator.
*   `ForeachGraphNodeExecutor`, `WhileGraphNodeExecutor`, `UntilGraphNodeExecutor`, and `GraphConditionEvaluator`.
*   `GraphExecutionSnapshotMapper` producing `GraphExecutionSnapshotPatch`.
*   `for-angular/src/graph/execution` with RxJS bridge and Angular execution service.
*   Test suites covering planner, execution, loops, store, pinning, observers, and Angular bridge.
*   Workdocs for basic workflow, fan-in/fan-out, loops, pinnable nodes, and Angular event/pinning UI.

## 18. Phase 2 — Graph Page Working Engine (for-angular + RamAdapter)

### 18.1 Overview
The for-angular graph page (`src/app/pages/graph/graph.page.ts`) currently renders the workflow definition and input form but does not execute anything — `workflowOutputValue()` returns the static string `'pending run result'`. Phase 2 wires a real execution engine into the page so that users can run the displayed workflow and see live results.

### 18.2 Architecture

```txt
for-angular graph page
  ├── GraphRendererComponent (existing — canvas, input form, snapshot)
  ├── GraphExecutionService (existing — wraps engine, RxJS events)
  ├── GraphExecutionStateMapper (existing — event → UI state)
  │
  ├── NEW: Run button → GraphExecutionService.execute(workflow, inputs)
  ├── NEW: Real-time node/edge state overlays (status badges, edge values)
  ├── NEW: Workflow output display (actual results, not "pending run result")
  └── NEW: RamAdapter persistence (GraphExecutionResultRepository)
```

### 18.3 RamAdapter Persistence
*   Define a `GraphExecutionResultModel` (Decaf `Model`) that serializes a `GraphExecutionResult` for storage.
*   Create a `GraphExecutionResultRepository` (Decaf `Repository`) backed by RamAdapter.
*   After each successful execution, persist the result via the repository.
*   On page load, retrieve the most recent execution result for the current workflow and display it.
*   Pinned values are stored via `GraphValueStoreAdapter` backed by RamAdapter.

### 18.4 UI Changes
*   Add a "Run workflow" button to the graph page (next to or below the input form).
*   On click: collect workflow input form values, call `GraphExecutionService.execute()`.
*   Subscribe to `GraphExecutionService.events$` and feed events to `GraphExecutionStateMapper`.
*   Display node status badges on the canvas: `running` (spinner), `succeeded` (check), `failed` (error), `cached` (cache icon).
*   Display edge values (last routed value) as edge labels or tooltips.
*   Replace `workflowOutputValue()` with actual execution outputs from the persisted result.
*   Show execution errors (if any) in the outputs panel.

### 18.5 Constraints
*   No new Angular dependencies in `integrations/src/graph/` — all Angular code stays in `for-angular/`.
*   The graph page may use `GraphExecutionService` directly (local execution) or via HTTP (remote execution). The default for the demo page is local execution with RamAdapter persistence.
*   The `GraphExecutionEngineConfig` injection token controls which executors are registered.

## 19. Phase 2 — Full-Stack E2E Test (for-nest → for-http → for-angular)

### 19.1 Overview
A dedicated e2e test that boots an actual NestJS backend hosting the graph execution engine, uses for-http's HTTP/SSE client to trigger execution and receive events, and validates the complete production communication pipeline.

### 19.2 Architecture

```txt
NestJS Backend (for-nest + integrations)
  ├── GraphExecutionModule
  │   ├── POST /graph/execute → triggers GraphExecutionEngine.execute()
  │   ├── GET /graph/events (SSE) → streams GraphExecutionEvent via @Sse()
  │   ├── GET /graph/results/:runId → retrieves persisted result from RamAdapter
  │   └── GraphExecutionResultRepository (RamAdapter)
  │
  └── RamAdapter (server-side persistence)

Client (for-http adapter)
  ├── AxiosHttpAdapter / ServerEventConnector
  ├── POST /graph/execute via HTTP → triggers execution
  ├── GET /graph/events via SSE → receives events
  └── GET /graph/results/:runId → retrieves persisted result
```

### 19.3 Test Scenarios
1. **Execute via HTTP**: POST a workflow + inputs, receive the execution result JSON with correct outputs.
2. **SSE event sequence**: Subscribe to `/graph/events` before triggering execution; validate all event types arrive in order (`workflow.started` → `workflow.planned` → `node.started` → `node.completed` → `edge.valueRouted` → `workflow.completed`).
3. **runId propagation**: The `runId` from the HTTP response matches the `runId` in all SSE events.
4. **Sequence numbers**: SSE events arrive with monotonically incrementing sequence numbers.
5. **Payload preservation**: The `workflow.completed` event's payload contains the correct output values after JSON serialization through SSE.
6. **Persistence**: After execution, `GET /graph/results/:runId` returns the full execution result from RamAdapter.
7. **Error handling**: POST an invalid workflow (e.g., missing executor kind); validate `workflow.failed` event and error payload.
8. **Multiple runs**: Execute the same workflow twice with different inputs; validate separate runIds, separate persisted results, and correct outputs for each.

### 19.4 Test Location
*   `integrations/tests/e2e/graph/full-stack.e2e.test.ts` — boots the NestJS app, uses for-http's `ServerEventConnector` and `supertest` as the client.

### 19.5 Constraints
*   The test must boot a real NestJS application (using `@nestjs/testing` `Test.createTestingModule`), not mock the engine.
*   The test must use `ServerEventConnector` from `@decaf-ts/for-http` (the same class for-angular uses in production), not a custom SSE client.
*   RamAdapter must be used for server-side persistence (not a mock adapter).
*   The test must clean up the NestJS app and SSE connection after all tests complete.

## 20. Phase 2 — Node-Edit Modal & Graph-Aware CRUD Fields

### 20.1 Overview
Users need to configure individual graph nodes: set literal input values, choose which inputs are wired from upstream outputs (ports), and split outputs to multiple downstream consumers. This is done via a modal that opens on double-click and renders a graph-aware CRUD form built from the node's input schema. All configuration is serialized into the graph snapshot so that loading a saved graph restores every connection, precedence, and value binding.

### 20.2 Double-Click → Modal

```txt
User double-clicks a node on the canvas
  → GraphRendererComponent detects dblclick on a node article
  → Opens a modal (getNgxModalCrudComponent) with:
      model = new instance of the node's decorated Model class
      operation = UPDATE
      pre-populated with current node values from the snapshot
  → Modal renders graph-aware CRUD fields (see §20.3)
```

*   The modal must use the existing Decaf CRUD modal infrastructure (`getNgxModalCrudComponent`).
*   The operation is `UPDATE` (not `CREATE`) — the form represents an existing node's configuration.
*   The modal title is the node's display label.

### 20.3 Graph-Aware CRUD Field Component

A new Angular component — `GraphPortFieldComponent` — extends the standard for-angular CRUD field component and adds:

1.  **"Use as port" checkbox** — rendered on the left side of the field, off by default.
    *   **Off (default):** The field behaves as a normal CRUD input. The user enters a literal value. No graph port is exposed for this property.
    *   **On:** The field input is hidden/disabled. The property is exposed as a graph input port on the canvas, allowing the user to draw an edge from an upstream output port to this port. The literal value (if any) is kept as a fallback default but is not used when an edge is connected.

2.  **Output port split control** — for output fields (properties decorated with `@output`), the field shows a "split" affordance that allows the user to expose the same output port on multiple distinct handles, so that the single output can be connected to multiple downstream inputs. Each split creates a separate edge in the workflow relations.

```txt
┌─────────────────────────────────────────┐
│ ☐  Request brief    [textarea input ]   │  ← "use as port" off → literal
├─────────────────────────────────────────┤
│ ☑  Normalized brief  (port: brief)      │  ← "use as port" on → port exposed
│    [hidden — wired from upstream]        │
├─────────────────────────────────────────┤
│ Output: Execution plan  [⊕ split]       │  ← output field with split button
│   ├ handle 1 → Planning.Draft.plan       │
│   └ handle 2 → (available for drag)      │
└─────────────────────────────────────────┘
```

### 20.4 Serialization & Snapshot Round-Trip

All node-edit modal configuration must be serialized into the existing graph snapshot format so that loading a graph fully restores the state.

**Per-node persisted data:**

| Data | Storage location in snapshot | Format |
|:-----|:-----------------------------|:-------|
| Which input fields are "use as port" | `node.inputPorts[]` (or a `portBindings` map on the node) | `Record<property, { mode: 'port' \| 'value'; value?: unknown }>` |
| Literal values for non-port fields | `nodeValues[property]` in the snapshot | Same as current `graphWorkflowSnapshotInputValuesOf` |
| Output port splits | `relations[]` — multiple entries with same `source`/`sourcePort`, different `target`/`targetPort` | Standard `GraphWorkflowRelation` entries |
| Edge connections / precedence | `relations[]` | Standard `GraphWorkflowRelation` entries (unchanged) |

**Round-trip contract:**

1.  **Save:** When the user saves a snapshot (or the snapshot is auto-persisted), the modal configuration is written into `GraphWorkflowSnapshot`:
    *   Port-mode fields produce port definitions on the node (or are inferred from `@input`/`@output` decorators).
    *   Literal values are stored in the snapshot's input-values section.
    *   Output splits produce multiple `GraphWorkflowRelation` entries.
    *   Edges drawn on the canvas produce `GraphWorkflowRelation` entries (unchanged).
2.  **Load:** When a snapshot is loaded (`parseGraphRendererSnapshot` → `buildGraphRendererStateFromSnapshot`), the renderer must:
    *   Reconstruct which fields are in port mode vs literal mode from the node's port bindings.
    *   Restore literal values into the CRUD form.
    *   Reconstruct all edges (including output splits) from `relations[]`.
    *   Render the correct ports on each node based on port-mode fields.

3.  **JSON round-trip:** `graphWorkflowSnapshotToJSON` → `graphWorkflowSnapshotFromJSON` must preserve this data. A snapshot saved after modal configuration must produce an identical graph when loaded: same nodes, same ports, same edges, same literal values, same split outputs.

### 20.5 Constraints
*   The "use as port" checkbox must not alter the node's `@input`/`@output` decorator metadata — it only controls whether the port is *exposed for connection* on the canvas vs *filled with a literal value* in the form.
*   Output splitting must produce valid `GraphWorkflowRelation` entries that the planner and engine already support (fan-out is already handled — see §5.7, §11 fan-out tests).
*   The modal must not introduce a new persistence mechanism — it writes into the same `GraphWorkflowSnapshot` used by the existing save/load snapshot feature.
*   The graph-aware field component must be reusable and not hardcoded to the demo workflow nodes.
*   Loading a graph with no saved modal configuration (e.g., an older snapshot) must default all fields to literal mode (checkbox off), preserving backward compatibility.

### 20.6 Implementation Plan
*   Create `GraphPortFieldComponent` in `for-angular/src/graph/components/graph-port-field/` extending the standard CRUD field.
*   Update `GraphNodeTemplateComponent` to handle `dblclick` and open the CRUD modal with `GraphPortFieldComponent` as the field renderer.
*   Extend the snapshot types in `ui-decorators/graph` (if needed) to include per-node port-binding mode (`'port' | 'value'`) alongside existing port definitions.
*   Update `buildGraphRendererViewModel` and `buildGraphRendererStateFromSnapshot` to read/write port-binding mode and reconstruct the form + canvas accordingly.
*   Update the snapshot JSON round-trip (`graphWorkflowSnapshotToJSON` / `graphWorkflowSnapshotFromJSON`) to preserve port-binding mode.

## 21. Node Visual & Interaction Contract

### 21.1 Overview
This section formalizes the appearance, structure, and interaction behaviour of graph nodes rendered on the for-angular canvas. Nodes are intentionally minimal — compact rounded squares that show only an icon, a colour, an optional user-defined name, and the ports that are actively visible. Rich metadata (description, labels, category, all port labels) is deferred to the node-edit modal (§21.11) so the canvas stays uncluttered.

The canonical implementation lives in `for-angular/src/graph/components/graph-node-template/` (member nodes) and `for-angular/src/graph/components/boundary-node-template/` (workflow-input value nodes). Both are consumed by `GraphRendererComponent` through `ng-diagram`'s `nodeTemplateMap`.

### 21.2 Node Variants

| Variant | Component | Selector | CSS Root Class | Distinguishing Trait |
|:---|:---|:---|:---|:---|
| Member node | `GraphNodeTemplateComponent` | `app-graph-node-template` | `.graph-node` | Compact rounded-square card; represents a workflow member (`workflow`, `pipeline`, `node`, or `core.loop.*` kind). |
| Boundary value node | `GraphBoundaryNodeTemplateComponent` | `app-graph-boundary-node-template` | `.graph-boundary` | Compact rounded-square card, output-only; represents a duplicateable workflow input value (`value` kind). |

### 21.2.1 Control Flow Nodes (Required in Demo)

The engine supports three structured loop kinds (see `GRAPH_LOOP_KIND` in `integrations/src/graph/constants.ts`): `core.loop.foreach`, `core.loop.while`, and `core.loop.until`. The demo workflow on the graph page **must include at least one node of each loop kind** so the canvas demonstrates every control-flow primitive the engine supports.

| Loop kind | Demo node class | Icon | Colour | Semantic |
|:---|:---|:---|:---|:---|
| `core.loop.foreach` | `GraphForeachLoopNode` | `ti-repeat` | `#eab308` (yellow) | Iterates over an array input, executing the body once per item. |
| `core.loop.while` | `GraphWhileLoopNode` | `ti-arrows-loop` | `#0891b2` (cyan) | Repeats the body while a condition is true (pre-condition). |
| `core.loop.until` | `GraphUntilLoopNode` | `ti-player-stop` | `#db2777` (pink) | Repeats the body until a condition is true (post-condition, runs at least once). |

Each loop node:
*   Is declared with `@node('<tag>', { kind: 'core.loop.<type>', ... metadata: { loop: { body, condition?, maxIterations? } } })` so the engine's loop executors can read the `GraphLoopMetadata` from `context.node.graph.metadata.loop`.
*   Declares `@input` ports matching the loop executor's expected inputs (`items` for foreach; `state` for while/until) plus the default `value` port.
*   Declares `@output` ports matching the loop executor's outputs (`results`/`iterations` for foreach; `state`/`iterations` for while/until).
*   References a body sub-workflow definition (a `GraphWorkflowDefinition` object or a `@graph`-decorated class) via `metadata.loop.body`.
*   Is wired into the `GraphPublishingWorkflow` `@graph` `nodes` array and connected via `relations` so it participates in the demo diagram alongside the existing publishing-pipeline nodes.

The demo executors (`createDemoExecutorRegistry`) must register the `ForeachGraphNodeExecutor`, `WhileGraphNodeExecutor`, and `UntilGraphNodeExecutor` (from `integrations/src/graph/loops/`) for their respective kinds, constructed with the shared `GraphExecutionEngine` instance so loop bodies execute through the same engine.

### 21.3 Minimal Node Anatomy

Nodes default to a **square with rounded corners** — small enough that dozens can fit on the canvas without overlap. The only always-visible content is the node identity (icon + colour + optional name) and the action buttons. Ports appear contextually (see §21.6).

Agent nodes (`core.agent`, §22.2.4) are an exception: they use a **rectangular** shape (no border radius) to visually distinguish them as composite entities with structural dependencies. Agent nodes also render `@connection()` ports on their bottom edge (§21.6.1).

```txt
   ┌───────────────────────────┐
   │  [x] [⚙] [📌]   ← actions  │
   │                            │
   │     [icon]                 │
   │     Node Name              │
   │                            │
   │  ○─────────────○           │  ← ports (contextual, see §21.6)
   └───────────────────────────┘
```

### 21.4 Member Node Structural Elements

| Element | DOM class | Source | Behaviour |
|:---|:---|:---|:---|
| Root card | `.graph-node` | Static | Rounded-square. Dimensions driven by `--graph-node-size` (default `96px`). Background gradient tinted by `--graph-accent`. |
| Action buttons | `.graph-node__actions` | Static | Top-right floating zone containing all action buttons. Grouped in a single flex row so the entire zone can be reoriented for RTL languages (flip `left`/`right` positioning). Buttons appear on hover (opacity transition). `mousedown` stops propagation so diagram dragging does not intercept clicks. |
| Delete button | `.graph-node__btn--delete` (text `×`) | `deleteNode()` | Removes the node from the diagram via `NgDiagramModelService.deleteNodes([id])`. |
| Pin button | `.graph-node__btn--pin` (text `📌`) | `pinNode()` | Toggles pinned state. Gets `.graph-node__btn--pinned` when active. |
| Icon | `.graph-node__icon` | `node().data.icon` | Centered glyph (icon font class or emoji). Sized to be the dominant visual element. Coloured by `--graph-accent`. |
| Name | `.graph-node__name` | `node().data.title` | **Only rendered when user-defined** (i.e. when the node was renamed from its default generated name). Falls back to `node().data.kind` when no custom name is set. Small, truncated, centered below the icon. |
| Status badge | `.graph-node__status` | Conditional | Single pill overlaid on the card (bottom-left or bottom-center) when execution state is active. See §21.9. |
| Ports | `.graph-node__ports` | Contextual | Port handles render on the card edges only when visible per §21.6. No column headings, no label/type copy on the canvas — port labels appear only as hover tooltips or in the edit modal. |

### 21.5 Default Port

Every node has a **default port** that represents the complete input object (the entire model instance as a single typed value). This port is always visible and is the primary connection target for simple wiring.

| Property | Value |
|:---|:---|
| Port id | `value` |
| Direction | `input` (member nodes) / `output` (boundary value nodes) |
| Label | `value` (or the node's `kind`) |
| Type | The node's model class |
| Visibility | **Always visible** — exempt from the contextual visibility rules in §21.6. |

All other ports (declared via `@input(...)` / `@output(...)` with explicit handles) are **non-default ports** and follow the contextual visibility rules.

**Port ordering rule:** When multiple ports of the same direction are rendered on a node face, the default port (`value` or `default`) is always rendered **last** (bottom-most on vertical faces, right-most on horizontal faces). This ensures that case/branch outputs (e.g. Switch cases, If `then`/`else`) appear above the fallback/default output, matching the natural top-to-bottom reading order.

### 21.6 Port Visibility Behaviour

Non-default ports are hidden by default to keep the canvas minimal. They appear only in one of the following contexts, and animate with a fade-in/fade-out transition.

| Context | Trigger | CSS state |
|:---|:---|:---|
| **Node selected** | User clicks the node (diagram selection). | `.graph-node--selected` on the root card; ports container gets `.graph-node__ports--visible`. |
| **Active connection drag** | User starts dragging a connection from another node's port (the source node and any valid target node reveal their ports). | `.graph-node--connecting` on candidate target nodes; ports fade in. |
| **Has connection** | The port is the endpoint of an existing edge on the canvas. | Per-port class `.graph-node__port--connected` — that individual port stays visible even when the node is not selected. |

Rules:
*   There is **no checkbox or toggle** to show/hide individual ports. Port visibility is entirely driven by the three contexts above.
*   When none of the three contexts are active, non-default ports are fully hidden (`opacity: 0; pointer-events: none`).
*   The default port (§21.5) is always visible regardless of context.
*   When a port is both connected and the node is selected, it stays visible (no double-fade).
*   Ports fade in over `150ms` (`ease-out`) and fade out over `200ms` (`ease-in`).

```scss
// Transition contract
.graph-node__ports {
  transition: opacity 150ms ease-out;
}
.graph-node:not(.graph-node--selected):not(.graph-node--connecting) .graph-node__port:not(.graph-node__port--connected):not(.graph-node__port--default) {
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease-in;
}
```

#### 21.6.1 Connection Ports (`@connection()`)

In addition to `@input()` (left side) and `@output()` (right side), nodes may declare `@connection()` ports that render on the **bottom** edge of the node. Connection ports represent structural dependencies — typed by `category` — rather than data-flow edges. They do not carry workflow values; instead they signal that the node requires a particular kind of external resource (e.g. a model, a memory store, a workspace).

| Aspect | `@input()` | `@output()` | `@connection()` |
|:---|:---|:---|:---|
| Side | Left | Right | Bottom |
| Carries data | Yes | Yes | No (structural only) |
| Typed by | Schema | Schema | `category` string |
| Colour | Node accent | Node accent | Category colour (§21.8.3) |
| Visibility | §21.6 | §21.6 | §21.6 (same contextual rules) |

A node may have zero or more `@connection()` ports. The `AgentNode` (§22.2.4) is the canonical example: it declares three connection ports — `model`, `memory`, `workspace` — each coloured by its category.

```typescript
class AgentNode {
  @input() prompt: string;
  @output() response: string;
  @output() actions: string[];
  @connection({ category: "model" }) model: void;
  @connection({ category: "memory" }) memory: void;
  @connection({ category: "workspace" }) workspace: void;
}
```

### 21.7 Boundary Value Node

```txt
   ┌───────────────────────────┐
   │  [x] [⚙] [📌]   ← actions  │
   │     [icon]                 │
   │     Input Name             │
   │              ○ value       │  ← default output port (always visible)
   └───────────────────────────┘
```

*   Compact rounded-square, same shape as member nodes.
*   Lighter accent (`#0f766e` teal) to distinguish boundary nodes from member nodes.
*   Icon from `node().data.icon`.
*   Name from `node().data.title` (always shown for boundary nodes since they represent user-named workflow inputs).
*   Single default output port (`value`) — always visible.
*   Pin button is a no-op (`pinNode()` stops propagation without toggling).
*   Edit opens the standard CRUD modal to change the input value.
*   No contextual port behaviour — boundary nodes have only one port and it is always visible.

### 21.8 Accent Colour & Kind Mapping

Each node sets a `--graph-accent` CSS custom property from the node's **effective colour** — the explicit `color` on `@node()` if present, otherwise the **category colour** from the `GraphCategoryStyle` registry (§21.8.2), otherwise the default (`#64748b`). The accent drives the card background gradient, icon colour, border tint, and action-button active state.

The `color` and `icon` attributes on `@node()` are **optional overrides**. When omitted, the effective colour/icon is resolved from the node's `category` via the category style registry (§21.8.2). This means nodes only need to specify `color`/`icon` when they want to deviate from their category's default style.

#### 21.8.1 Kind → Colour Mapping (Legacy / Demo)

Canonical kind → colour mapping used by the demo nodes (defined in `example-nodes.ts`):

| Kind | Colour | Semantic |
|:---|:---|:---|
| `workflow` | `#f97316` (orange) / `#22c55e` (green) | Entry/exit workflows. |
| `pipeline` | `#0ea5e9` (sky) | Intermediate processing pipelines. |
| `node` | `#8b5cf6` (violet) / `#14b8a6` (teal) | Leaf transformation nodes. |
| `value` (boundary) | `#0f766e` (teal) | Workflow input value nodes. |

#### 21.8.2 Category Style Registry

The `GraphCategoryStyle` registry (`registerGraphCategoryStyle` / `graphCategoryStyleOf` in `ui-decorators/graph`) maps category names to a default `{ color, icon? }` style. The reader's `graphDefinitionOf()` computes `effectiveColor` and `effectiveIcon` by checking the node's explicit `color`/`icon` first, then falling back to the category style, then the default (`#64748b` / `ti-pointer`).

Built-in categories registered by `integrations/src/graph/nodes/category-styles.ts`:

| Category | Colour | Icon | Used by |
|:---|:---|:---|:---|
| `Trigger` | `#3b82f6` | `ti-bolt` | Trigger nodes (§22.2.1) |
| `Flow Control` | `#f59e0b` | `ti-arrows-split-2` | Flow-control nodes (§22.2.2) |
| `Utility` | `#0d9488` | `ti-tool` | Utility nodes (§22.2.3) |
| `Loop` | `#eab308` | `ti-repeat` | Loop nodes (§5.9) |
| `Workflow` | `#f97316` | `ti-sitemap` | Workflow nodes |
| `Pipeline` | `#0ea5e9` | `ti-git-merge` | Pipeline nodes |
| `Node` | `#8b5cf6` | `ti-point-filled` | Leaf processing nodes |
| `Agent` | `#7c3aed` | `ti-robot` | Agent nodes (§22.2.4) |
| `model` | `#3b82f6` | `ti-cpu` | `@connection({ category: "model" })` |
| `memory` | `#10b981` | `ti-database` | `@connection({ category: "memory" })` |
| `workspace` | `#f59e0b` | `ti-folder` | `@connection({ category: "workspace" })` |

Downstream projects MAY register additional categories via `registerGraphCategoryStyle()`.

#### 21.8.3 Connection Port Colours

`@connection()` ports are coloured by their `category` field, not by the node's accent colour. The renderer reads the category from `port.graph.category` and resolves the colour from the category style registry. This ensures that, e.g., all `model` connections across different node kinds share the same visual colour.

### 21.9 Execution State Visual Treatment

Member nodes reflect execution state through a single status badge overlaid on the card and a border/glow treatment. The state is read from `graphExecutionState.nodeStates()[nodeId]` via `statusLabel()`.

| State | CSS class | Badge class | Badge label | Border colour | Visual treatment |
|:---|:---|:---|:---|:---|:---|
| running | `.graph-node--running` | `.graph-node__status--running` | `running` | `#f59e0b` (amber) | Amber border + glow ring; badge pulses (opacity 1 ↔ 0.6 over 1.2s). |
| succeeded | `.graph-node--succeeded` | `.graph-node__status--succeeded` | `done` | `#22c55e` (green) | Green border + soft glow. |
| failed | `.graph-node--failed` | `.graph-node__status--failed` | `failed` | `#ef4444` (red) | Red border + glow. |
| cached | `.graph-node--cached` | `.graph-node__status--cached` | `cached` | `#6366f1` (indigo) | Indigo border + soft glow. Served from pinned cache. |
| (pinned) | `.graph-node--pinned` | `.graph-node__status--pinned` | `pinned` | `#a855f7` (purple, dashed) | Opacity 0.55, dashed border, purple glow, 40% grayscale, `pointer-events: none` on the card body (actions remain interactive). |

Rules:
*   Status badge is a single pill, uppercase, 0.6rem, 700 weight, overlaid at the bottom of the card.
*   Multiple badges may coexist (e.g. `succeeded` + `pinned`).
*   The badge renders only when at least one state is active.
*   Pinned state is applied via direct DOM manipulation in `pinNode()` (toggling classes on `article.graph-node`) because ng-diagram renders node templates outside Angular's change-detection tree — Angular signal updates do not propagate reliably.

### 21.10 Interaction Contract

| Gesture | Target | Action |
|:---|:---|:---|
| Click | Node card (not an action button) | Select the node — triggers port visibility (§21.6). |
| Click | Delete button | Remove node from diagram. |
| Click | Edit button | Open node-edit modal (UPDATE-style with port modes). |
| Click | Pin button | Toggle pinned state (member nodes only). |
| Double-click | Anywhere on `article.graph-node` | Open node-edit modal. |
| `mousedown` on port handle | Port | Begin connection drag — candidate target nodes reveal their ports (§21.6). |
| `mousedown` | Any action button | Stop propagation (prevents diagram drag-start). |
| Click empty canvas | — | Deselect — all contextually-visible ports fade out. |

### 21.11 Node-Edit Modal (Double-Click)

Triggered by double-click or the `⚙` button. Opens `GraphNodeEditModalComponent` via `ModalController.create()` with:
*   `nodeTitle` — `node().data.title`
*   `modelClass` — `node().data.modelClass`
*   `nodeId` — `node().id`
*   `initialValues` / `initialPortModes` — from `graphNodeConfig.getConfig(nodeId)` if previously edited

The modal is where the full node metadata (description, category, labels, all port labels/types, port-binding modes, literal values, output splits) is inspected and edited. The canvas node itself never displays this rich metadata — it stays minimal.

On `confirm`, the result is applied to the module-level `graphNodeConfig` store (see §20). The modal is an Ionic standalone component using `@Input()` decorators (not Angular signal inputs) because Ionic's `componentProps` binding does not reliably hydrate signal inputs.

### 21.12 CSS Class Contract

The following classes are part of the public rendering contract and must remain stable for downstream styling overrides:

```scss
// Root card
.graph-node                         // root card (minimal rounded square)
.graph-node--selected               // node is selected → ports visible
.graph-node--connecting             // connection drag in progress → ports visible
.graph-node--workflow               // kind modifier (workflow)
.graph-node--pipeline               // kind modifier (pipeline)
.graph-node--task                   // kind modifier (node kind)
.graph-node--pinned                 // pinned state
.graph-node--running                // execution state: running
.graph-node--succeeded              // execution state: succeeded
.graph-node--failed                 // execution state: failed
.graph-node--cached                 // execution state: cached

// Actions
.graph-node__actions                // action button zone (top-right)
.graph-node__btn                    // individual action button
.graph-node__btn--pinned            // pin button active

// Identity
.graph-node__icon                   // centered icon
.graph-node__name                   // user-defined name (or kind fallback)

// Status
.graph-node__status                 // status badge overlay
.graph-node__status--running        // running badge
.graph-node__status--succeeded      // succeeded badge
.graph-node__status--failed         // failed badge
.graph-node__status--cached         // cached badge
.graph-node__status--pinned         // pinned badge

// Ports
.graph-node__ports                  // ports container
.graph-node__ports--visible         // ports forced visible (selected/connecting)
.graph-node__port                   // individual port handle
.graph-node__port--default          // default port (always visible)
.graph-node__port--connected        // port has an edge (always visible)
.graph-node__port--input            // input port
.graph-node__port--output           // output port
```

Boundary value node classes (`.graph-boundary*`) follow the same BEM convention with `--graph-boundary-accent` instead of `--graph-accent`.

### 21.13 Removed / Replaced Behaviour
The following behaviours from the previous expanded-card design are **removed** in the minimal node design:

| Removed | Replaced by |
|:---|:---|
| Expand/collapse button (`▸`/`▾`) and `data.expanded` toggle. | Port expansion is no longer user-toggled. Ports are contextually visible (§21.6). Hierarchical port children are flattened when visible. |
| Two-column port layout with `Inputs`/`Outputs` headings. | Port handles sit on the card edges (inputs left, outputs right) without headings or label copy. |
| Always-visible port labels and type hints. | Port labels appear only as hover tooltips on the port handle or in the edit modal. |
| Kind badge and category badge on the card. | Replaced by the icon + colour. Kind and category are still in the edit modal. |
| Description text on the card. | Moved to the edit modal only. |
| Labels row on the card. | Moved to the edit modal only. |

### 21.14 Constraints
*   All node visual state is driven by CSS classes on the `article` root — no inline styles except `--graph-accent` (set via `[style.--graph-accent]`).
*   Nodes are compact: default size is a ~96px rounded square. The canvas should comfortably fit 20+ nodes without manual zoom.
*   Pinning uses direct DOM manipulation (`classList.toggle`) because ng-diagram renders templates outside Angular's injector/change-detection tree. This is intentional and documented in `GraphNodeConfigStore` / `GraphExecutionStateService`.
*   Status badges and pinned classes are applied both via Angular bindings (for initial render) and via direct DOM manipulation (for pin toggles that bypass change detection).
*   The node-edit modal must use `@Input()` decorators, not `input()` signal inputs, because Ionic `componentProps` does not hydrate signal inputs reliably.
*   `pointer-events: none` on `.graph-node--pinned` prevents accidental re-editing of cached nodes; action buttons re-enable `pointer-events: auto` so the node can still be unpinned or deleted.
*   Port visibility is purely CSS-driven (opacity + pointer-events). The port handles remain in the DOM at all times so that existing connections don't break when a port fades out.
*   There is no per-port show/hide checkbox anywhere in the UI. Port visibility is non-negotiable and driven only by the three contexts in §21.6.

## 22. Downstream Consumer Reference — the-alfred-ai Specs Integration

### 22.1 Purpose

This section documents the concepts the `the-alfred-ai` project contributes to the graph ecosystem and incorporates them into this specification so that DECAF-32 is the single source of truth for all Mastra-agnostic graph functionality. The ALFRED specs (ALFRED-4/5/6/7/8, UPSTREAM-1) reference this section instead of re-defining these concepts.

The ALFRED specs live at `the-alfred-ai/workdocs/ai/project/specifications/`.

### 22.2 Node Kind Taxonomy (from ALFRED-5)

The reference engine's executor registry (§5.8) is kind-keyed. The following node kinds are defined by ALFRED-5 and recognized by the engine. The Mastra-agnostic **definitions** (the `@node`-decorated classes, their `@input`/`@output` ports, and their metadata) are owned by this specification's declaration layer (§1.2); the Mastra-specific **compilation** of flow-control nodes into Mastra composition APIs is owned by ALFRED-5 §9.

#### 22.2.1 Trigger Nodes (ALFRED-5 §5)

Trigger nodes define how a workflow starts. They are entrypoints and should not compile into regular executable steps — they produce a trigger context that starts the workflow run.

| Kind (ALFRED-5) | Engine kind | Purpose |
|:---|:---|:---|
| `trigger.manual` | `core.trigger.manual` | User clicks Run; input form generated from `inputSchema`. |
| `trigger.webhook` | `core.trigger.webhook` | HTTP request received; path/method/auth/responseMode config. |
| `trigger.schedule` | `core.trigger.schedule` | Cron-like schedule; timezone + payload config. |
| `trigger.event` | `core.trigger.event` | Internal event bus topic subscriber. |
| `trigger.form` | `core.trigger.form` | Generated public/internal form; field definitions. |
| `trigger.chat` | `core.trigger.chat` | Chat message entrypoint; message/sessionId/userId schema. |

The engine itself (DECAF-32) does not implement trigger handlers — triggers are a compilation concept (ALFRED-5 §5 compile targets). The engine's execution model starts from workflow inputs (§5.8) and treats trigger nodes as metadata-only entrypoints. A future engine revision may add first-class trigger executors.

#### 22.2.2 Flow-Control Nodes (ALFRED-5 §6)

Flow-control nodes are graph-level macros. The engine executes them via registered executors (§5.8). ALFRED-5 compiles them into Mastra composition APIs; the engine's reference interpreter executes them directly.

| Kind (ALFRED-5) | Engine kind | Engine executor | ALFRED-5 compile target |
|:---|:---|:---|:---|
| `flow.if` | `core.flow.if` | (future — conditional branch executor) | `builder.branch([...])` |
| `flow.switch` | `core.flow.switch` | (future — multi-branch executor) | `builder.branch([...])` |
| `flow.foreach` | `core.loop.foreach` | `ForeachGraphNodeExecutor` (§5.9) | `builder.foreach(body, { concurrency })` |
| `flow.while` | `core.loop.while` | `WhileGraphNodeExecutor` (§5.9) | `builder.dowhile(body, condition)` |
| `flow.doUntil` | `core.loop.until` | `UntilGraphNodeExecutor` (§5.9) | `builder.dountil(body, condition)` |
| `flow.parallel` | `core.flow.parallel` | (future — parallel branch executor) | `builder.parallel(branches)` |
| `flow.merge` | `core.flow.merge` | (future — merge step executor) | `builder.then(step)` |
| `flow.map` | `core.flow.map` | (future — transform step executor) | `builder.map(mapper)` |
| `flow.delay` | `core.flow.delay` | (future — delay step executor) | `builder.then(step)` |
| `flow.errorBoundary` | `core.flow.errorBoundary` | (future — try/catch/finally executor) | `builder.then(wrappedStep)` |
| `flow.humanApproval` | `core.flow.humanApproval` | (future — suspend/resume executor) | `builder.then(step)` with `suspend()` |
| `flow.return` | `core.flow.return` | (future — output normalization executor) | `builder.map(mapper)` |
| `flow.code` | `core.flow.code` | (future — sandboxed code executor) | `builder.then(compileCodeNode(...))` |

**Currently implemented in the engine:** `core.loop.foreach`, `core.loop.while`, `core.loop.until` (§5.9). The remaining flow-control kinds are recognized by the planner (§5.7) as ordinary executable nodes but have no built-in executor — downstream projects (e.g. ALFRED) register custom executors or compile them away.

**Loop kind mapping:** ALFRED-5's `flow.foreach`/`flow.while`/`flow.doUntil` map to the engine's `core.loop.foreach`/`core.loop.while`/`core.loop.until` (§5.9). The `core.loop.*` prefix is the engine's canonical kind; ALFRED-7 §4.3 defines the module-prefixed ID convention that reconciles the two naming schemes.

#### 22.2.3 Utility Nodes (ALFRED-5 §6.7–6.12, §7)

Utility nodes compile into concrete steps. The engine treats them as ordinary executable nodes with registered executors.

| Kind (ALFRED-5) | Engine kind | Purpose |
|:---|:---|:---|
| `flow.merge` | `core.flow.merge` | Normalize branch/parallel outputs into single output. |
| `flow.map` | `core.flow.map` | Transform current input into a new output object. |
| `flow.delay` | `core.flow.delay` | Pause execution for a duration. |
| `flow.errorBoundary` | `core.flow.errorBoundary` | Try/catch/finally workflow behavior. |
| `flow.humanApproval` | `core.flow.humanApproval` | Suspend until human approves/rejects. |
| `flow.return` | `core.flow.return` | Define and normalize final workflow output. |
| `flow.code` | `core.flow.code` | Sandboxed JS/TS code execution (ALFRED-5 §7). |

#### 22.2.4 Agent Nodes

Agent nodes wrap an AI agent (LLM + tools + memory) as a single graph node. They differ from utility nodes in that they declare **connection ports** (§21.6.1) for their structural dependencies — `model`, `memory`, `workspace` — rather than receiving them as regular `@input()` values.

| Kind | Engine kind | Category | Purpose |
|:---|:---|:---|:---|
| Agent | `core.agent` | `Agent` | Execute an AI agent with instructions/context; produce response + actions. |

Production declaration: `integrations/src/graph/nodes/agent.ts` (`AgentNode`).

```typescript
@node({ kind: "core.agent", category: "Agent" })  // color/icon omitted → resolved from category
class AgentNode {
  @input() prompt: string;       // supports placeholder syntax (§22.4): {{ $input.foo }}
  @output() response: string;
  @output() actions: string[];
  @connection({ category: "model" }) model: void;
  @connection({ category: "memory" }) memory: void;
  @connection({ category: "workspace" }) workspace: void;
}
```

The `prompt` input is a single string field that accepts placeholder expressions (§22.4) such as `{{ $input.brief }}`, `{{ $node["Research"].output.summary }}`, or `{{ $vars.topic }}`. At execution time, the placeholder compiler resolves these references against the current workflow state before the agent executor receives the final prompt string.

The `Agent` category resolves to colour `#7c3aed` (violet) and icon `ti-robot` from the category style registry (§21.8.2). The three connection ports are coloured by their respective categories (`model` → `#3b82f6`, `memory` → `#10b981`, `workspace` → `#f59e0b`).

### 22.3 Condition Expression DSL (from ALFRED-5 §8)

ALFRED-5 §8 defines a declarative, serializable `ConditionExpression` type used by flow-control nodes (`if`, `switch`, `while`, `doUntil`) to evaluate branching and loop conditions without raw JavaScript:

```ts
export type ConditionExpression =
  | { op: 'eq'; left: ExprValue; right: ExprValue }
  | { op: 'neq'; left: ExprValue; right: ExprValue }
  | { op: 'gt'; left: ExprValue; right: ExprValue }
  | { op: 'gte'; left: ExprValue; right: ExprValue }
  | { op: 'lt'; left: ExprValue; right: ExprValue }
  | { op: 'lte'; left: ExprValue; right: ExprValue }
  | { op: 'and'; conditions: ConditionExpression[] }
  | { op: 'or'; conditions: ConditionExpression[] }
  | { op: 'not'; condition: ConditionExpression }
  | { op: 'exists'; value: ExprValue };

export type ExprValue =
  | { const: unknown }
  | { path: string }
  | { step: string; path: string };
```

The engine's `GraphConditionEvaluator` (§5.9) supports a limited set of safe built-in condition types (`truthy`, `falsy`, `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `exists`, `custom`). The `ConditionExpression` DSL from ALFRED-5 is a **superset** that the engine should recognize as a `custom` condition payload — the evaluator dispatches to a `ConditionExpression` evaluator when the condition object has an `op` field.

ALFRED-8's condition editor (ALFRED-8 §4.2 `ConditionEditorComponent`) produces `ConditionExpression` values in two modes: code-evaluation (VM-based, reusing the Code Node sandbox) and graphical rule selection (property → operator → value). The editor serializes to this DSL.

### 22.4 Code Node & Placeholder Syntax (from ALFRED-5 §7)

ALFRED-5 §7 defines a Code Node (`flow.code` / `core.flow.code`) that runs user-authored JS/TS in a restricted VM sandbox (`isolated-vm`). The sandbox is Mastra-agnostic — it is a pure data-transformation runtime with no system API access.

**Placeholder syntax** (ALFRED-5 §7.5–7.7) lets the user reference workflow data inside code:

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

The placeholder compiler (`compilePlaceholders`), path parser (`parsePath`), safe getter (`safeGet`), and static code validator (`validateSafeCode` using `acorn`) are Mastra-agnostic and live in the downstream project's `modules/core` (ALFRED-6). The `isolated-vm` sandbox runner (`runPureCode`) is also Mastra-agnostic but stays brain-resident to keep the `isolated-vm` dependency out of core.

The engine (DECAF-32) does not implement the Code Node sandbox directly. A future engine executor (`core.flow.code`) may wrap the sandbox contract (ALFRED-5 §7.17 `CodeSandbox` interface) as a pluggable executor.

### 22.5 Port-Toggle CRUD (from ALFRED-8 §4.2)

ALFRED-8 §4.2 defines a `PortToggleCrudComponent` — an Angular CRUD field extension that toggles an `@input` property between "manual" mode (literal value in a form field) and "connected" mode (graph port wired from an upstream output). This is the downstream implementation of the "use as port" checkbox defined in DECAF-32 §20.3 (`GraphPortFieldComponent`).

**Canonical home:** DECAF-32 §20 owns the concept and the `GraphPortFieldComponent` contract. ALFRED-8 §4.2 provides the downstream `PortToggleCrudComponent` as a concrete implementation for the Alfred module's node components. Both serialize the toggle state into the graph snapshot's per-node `data` section (DECAF-32 §20.4, ALFRED-8 §4.5).

**UPSTREAM-1** (released as `@decaf-ts/ui-decorators@0.17.4`) added the `GraphPortGroupMetadata` with `toggle: "single" | "all"` to the upstream graph metadata, enabling the one-vs-all port rendering choice. The per-instance manual-vs-connected toggle (this section) is a separate concern owned by DECAF-32 §20 / ALFRED-8 §4.2.

### 22.6 Reference-Based Workflow Serialization (from ALFRED-7 §4.6)

ALFRED-7 §4.6 defines reference-based workflow serialization: a `GraphNodeSnapshot` references the node by **id** (module-prefixed `NodeModel.kind`) and carries only per-instance config (`data`, `position`), not the full port definitions. Port definitions are resolved from the stored `NodeModel` by id at load time.

This aligns with DECAF-32 §5.11 (Snapshot Integration) — the engine produces `GraphExecutionSnapshotPatch` consumable by `ui-decorators/graph` snapshots. The reference-by-id model is an ALFRED-specific persistence concern (DB-backed `ai_nodes` table); the engine itself works with full `GraphWorkflowDefinition` objects (§5.8) and does not require DB-backed node resolution.

### 22.7 Module-Prefixed Node IDs (from ALFRED-7 §4.3)

ALFRED-7 §4.3 defines a module-prefixed ID convention: every node id is `<module>.<kind>` (e.g. `core.flow.if`, `core.trigger.manual`, `<other_module>.something`). The `@node` `tag` and `kind` both equal the module-prefixed id.

The engine (DECAF-32) uses `core.loop.*` for its built-in loop kinds (§5.9) and treats all other kinds as opaque strings for executor registry lookup (§5.8). The module-prefix convention is a downstream best practice for globally-unique node IDs across contributing modules; the engine does not enforce it but benefits from it.

### 22.8 DB-Backed Node Persistence (from ALFRED-7 §4.4)

ALFRED-7 §4.4 defines a DB-backed node persistence layer: `NodeModel` (`@table("ai_nodes")`) and `NodeCategoryModel` (`@table("ai_node_categories")`) stored via Decaf `Repository` pattern. The DB is the queryable source for the editor; the decorator-derived registry is the seed source.

This is an Alfred-specific persistence concern. The engine (DECAF-32) does not require DB-backed node definitions — it works with in-memory `GraphWorkflowDefinition` objects. Downstream projects MAY add DB-backed node persistence (as ALFRED does) as a layer on top of the engine.

### 22.9 Angular Node Web-Components (from ALFRED-8 §4.3)

ALFRED-8 §4.3 defines one Angular standalone component per built-in node kind in `modules/core/ui/src/lib/components/graph-nodes/`, each implementing `NgDiagramNodeTemplate` and registered in a `NODE_TEMPLATE_MAP` (kind → component). Each component extends/reuses the upstream `GraphNodeTemplateComponent` (from `@decaf-ts/for-angular/graph`, DECAF-32 §21) and customizes the edit modal.

**Canonical home:** DECAF-32 §21 owns the minimal node visual contract (`GraphNodeTemplateComponent`, `GraphBoundaryNodeTemplateComponent`). ALFRED-8 §4.3 provides downstream per-kind components that extend the base template and add CRUD forms with port-toggle fields and condition editors.

### 22.10 Condition Editor Component (from ALFRED-8 §4.2)

ALFRED-8 §4.2 defines a `ConditionEditorComponent` with two modes: code-evaluation (textarea + VM sandbox) and graphical rule selection (property → operator → value tree builder). It serializes to the `ConditionExpression` DSL (§22.3).

The condition editor is an Angular UI component that lives in `@decaf-ts/for-angular/graph` (upstream) per ALFRED-8 §4.2. The code-evaluation mode calls into the Code Node sandbox (`runPureCode`/`VmSandbox`) via an injected evaluator callback — `for-angular` provides the UI, the consumer supplies the evaluator.

### 22.11 ALFRED-6 — Core Package Extraction

ALFRED-6 defines the package boundary between `modules/core` (Mastra-agnostic shared primitives + workflow-node definitions) and `brain` (Mastra-specific compilation). This aligns with DECAF-32 §5.13 (Mastra Compatibility): the core engine stays Mastra-independent; downstream projects provide Mastra-backed adapters.

ALFRED-6's key architectural rule — "`modules/core` MUST NOT import any `@mastra/*` package" — is the downstream enforcement of DECAF-32 Req-9 ("Core must have no Mastra dependency").

### 22.12 ALFRED-4 — Brain Builder/Mastra Wrapper Compatibility

ALFRED-4 defines the `Managed*` wrapper/builder compatibility layer that bridges core's abstract primitives to Mastra runtime objects. This is entirely Mastra-specific and lives in `brain`. The engine (DECAF-32) does not define `Managed*` primitives — it defines `GraphNodeExecutor` (§5.8) as the executor contract. ALFRED-5 §4.8 bridges the two: `StepFactory.createStep()` produces a `ManagedStep` (ALFRED-4) from a `StepDefinition` (ALFRED-5 §4.7), and the engine's executor registry is the Mastra-agnostic analogue.

### 22.13 UPSTREAM-1 — Schema-Flattening & Port-Group Metadata

UPSTREAM-1 (released as `@decaf-ts/ui-decorators@0.17.4`) added schema-flattening to the graph reader: `@input`/`@output` on a Schema-typed (Decaf `Model`) property is recognized as a Schema port group, and the Schema's own `@input`/`@output` properties become the node's ports **flattened** (no `inputSchema.`/`outputSchema.` prefix). It also added `GraphPortGroupMetadata` with `toggle: "single" | "all"` for the one-vs-all rendering choice.

This is already part of the `@decaf-ts/ui-decorators/graph` foundation referenced in DECAF-32 §1.2. The `GraphPortGroupMetadata` type is listed in §1.2's existing metadata inventory.
