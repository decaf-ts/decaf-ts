# DECAF-32 — Decaf Graph Execution Engine

**Status:** Completed
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
*   [ ] Future compatibility with a Mastra compiler/backend.

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
Loop metadata includes `body` (a `GraphWorkflowDefinition`), `maxIterations`, `timeoutMs`, `condition`, `concurrency`, and port mappings. Conditions are limited to safe built-in types (`truthy`, `falsy`, `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `exists`, `custom`). Arbitrary JavaScript expression evaluation is not implemented in core.

Loop node kinds: `core.loop.foreach`, `core.loop.while`, `core.loop.until`. Nested loop-body executions set `parentRunId` and `path = [...outerPath, loopNodeId, `iteration:${index}`]`.

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
| TASK-210 | [Core graph scaffolding: constants, types, errors, GraphExecutionContext as Decaf Context](./tasks/TASK_210.md) | High | Pending | - |
| TASK-211 | [Event observer/emitter/factory and executor interface/registry](./tasks/TASK_211.md) | High | Pending | TASK-210 |
| TASK-212 | [Configurable value store adapter API + in-memory adapter + runtime wrapper](./tasks/TASK_212.md) | High | Pending | TASK-210 |
| TASK-213 | [Execution plan types, relation resolver, and Kahn topological planner](./tasks/TASK_213.md) | High | Pending | TASK-210 |
| TASK-214 | [Basic GraphExecutionEngine with workflow/node I/O routing and observer events](./tasks/TASK_214.md) | High | Pending | TASK-211, TASK-212, TASK-213 |
| TASK-215 | [Validation: definition validator, as-zod schema resolver, value validator](./tasks/TASK_215.md) | High | Pending | TASK-213 |
| TASK-216 | [Structured loops: condition evaluator + foreach/while/until executors](./tasks/TASK_216.md) | High | Pending | TASK-214 |
| TASK-217 | [@pinnable decorator in ui-decorators/graph + pinning metadata reader](./tasks/TASK_217.md) | High | Pending | TASK-210 |
| TASK-218 | [Pinning policy, dependency resolver, and pinning service with fingerprints](./tasks/TASK_218.md) | High | Pending | TASK-212, TASK-217 |
| TASK-219 | [Engine cache-hit behavior + pin/unpin API delegation + snapshot patch mapper](./tasks/TASK_219.md) | High | Pending | TASK-214, TASK-218 |
| TASK-220 | [Angular RxJS bridge, execution service, and execution UI state](./tasks/TASK_220.md) | High | Pending | TASK-214 |
| TASK-221 | [Angular pin UI behavior and event-to-renderer state mapping](./tasks/TASK_221.md) | High | Pending | TASK-219, TASK-220 |
| TASK-222 | [Comprehensive tests: planner, execution, loops, store, pinning, observers, Angular bridge](./tasks/TASK_222.md) | High | Pending | TASK-216, TASK-219, TASK-221 |
| TASK-223 | [Workdocs for basic workflow, fan-in/fan-out, loops, pinnable nodes, Angular events/pinning UI](./tasks/TASK_223.md) | Medium | Pending | TASK-222 |

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
