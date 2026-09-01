# DECAF-50: Canonical Workflow Documents, Backend Node Catalogue, and Remote Graph Execution

**Status:** Planned
**Priority:** High
**Owner:** Graph / Platform (cross-cutting: `ui-decorators`, `integrations`, `for-angular`)

> **Approval provenance.** Product scope was approved by the Product Manager on 2026-08-31 (the verbatim user draft is the approved scope statement; 16 goals confirmed untrimmed; non-goals confirmed with two standing distinctions; enforced priority **High**, replacing the draft's `Critical` claim; the draft's 7 phases approved with per-phase acceptance gates; controlled-transition rules fixed). Technical governance / architecture was approved by the CTO on 2026-08-31 (canonical document ownership, catalogue/manifest ownership, async run envelope with named conditions, normative validation-gate ordering, parameter-schema system, deterministic adapter, verification bar, and a per-spec supersession record). The verbatim approved statements remain on their source issues; the approved deltas are summarized in the architecture sections below. Implementation is delegated by the domain-root owner under separate children, each carrying specification `DECAF-50`.

## 1. Overview

This specification defines the changes required to make the Decaf-TS graph editor, graph persistence layer, and graph execution engine operate from one canonical workflow document while preserving a strict frontend/backend boundary.

The current implementation has three partially independent representations of a workflow:

1. Decorated model classes and `GraphWorkflowDefinition`.
2. The mutable `ng-diagram` canvas model and `GraphNodeConfigStore`.
3. `GraphWorkflowSnapshot`, used for save, restore, history, and autosave.

Execution currently reconstructs a workflow from the original decorated workflow class — it does not reliably execute the nodes, edges, parameters, port modes, or dynamic metadata currently displayed on the canvas. The frontend also serializes full node definitions derived from constructors and submits those definitions to the backend, and the backend planner accepts those client-provided definitions and trusts their ports and `kind` values while planning execution.

The required architecture replaces these parallel sources of truth with:

- A canonical, serializable `GraphWorkflowDocument`.
- A backend-authoritative node catalogue.
- Serializable node manifests shared with the frontend.
- Backend-only executor implementations.
- A deterministic adapter between `GraphWorkflowDocument` and `ng-diagram`.
- An asynchronous, run-scoped execution API.
- Authorized and replayable execution events.
- A schema-driven node-parameter renderer.
- Strict validation of workflow structure and node configuration before execution.

After this work:

- The workflow visible in the editor is exactly the workflow saved and executed.
- The frontend never transmits node definitions, constructors, or functions for execution.
- The backend resolves node behavior from its own trusted catalogue.
- Installing or registering a node on the backend makes its serializable manifest available to compatible frontends.
- Node-specific editor behavior is primarily declarative.
- Backend-only execution code remains excluded from frontend bundles.

Affected packages: `@decaf-ts/ui-decorators`, `@decaf-ts/integrations`, `@decaf-ts/for-angular`.

**Product clarifications carried from the approved scope (all bounded, none scope-expanding):**

- Workflow-level ownership stays as-is. Runs record an owner from `DecafRequestContext` and enforce run-scoped authorization on status/events/result/cancel/inspection. Workflow load/save authorization is *not* re-modeled by this specification; workflow-level ACL/sharing is out of scope until separately requested.
- Expressions are constrained, not new scope: both `mode: "expression"` bindings and expression parameters must run in the engine's existing allowed-expression machinery (or fail validation); no new evaluator and no arbitrary remote code.
- The catalogue and dynamic-method endpoints require an authenticated `DecafRequestContext`, propagate it, and never return secrets.
- `POST /graph/execute` is deprecated at cutover, not deleted; removal is a separate decision taken after the run API is the sole primary Angular path.
- Legacy persisted workflows: conversion of previously saved legacy snapshots is lossless and read-path/compile-path based (no destructive migration job; no semantics added to the existing snapshot version fields). Any workflow the old UI saved before cutover must load, restore, and execute correctly after cutover with zero user-visible data loss.
- Resource-limit defaults (counts, depths, bytes, retention, rates) exist, are configurable, and are enforced backend-side; the specific numeric defaults are delegated to technical governance.

## 2. Goals

*   [ ] Define one canonical `GraphWorkflowDocument` for editing, persistence, validation, and execution.
*   [ ] Ensure the current canvas state is exactly the state sent for execution.
*   [ ] Replace embedded node definitions with node instances that reference a trusted backend catalogue by `kind`.
*   [ ] Define a serializable `GraphNodeManifest` for frontend rendering and backend validation.
*   [ ] Keep node executors backend-only.
*   [ ] Allow node authors to co-locate manifest and executor authoring without coupling their runtime artifacts.
*   [ ] Add a backend node catalogue and catalogue HTTP API.
*   [ ] Replace constructor-based Angular node discovery with catalogue-based discovery.
*   [ ] Add a complete discriminated parameter-schema system.
*   [ ] Make dynamic node options and resource lookup backend operations.
*   [ ] Validate workflows against trusted manifests before planning or execution.
*   [ ] Make workflow execution asynchronous.
*   [ ] Make graph-run events run-scoped, authorized, ordered, and replayable.
*   [ ] Preserve existing graph capabilities, including loops, Switch nodes, pinning, connection ports, snapshots, history, autosave, logs, and inspection.
*   [ ] Provide a controlled transition from existing decorated workflows and snapshots.
*   [ ] Retain the existing frontend/backend package boundary from DECAF-35.

All 16 goals were approved as written by the Product Manager (no trims, no additions): goals 1–5 are the correctness/security core, 6–10 authoring and editor capability, 11–13 execution trust, 14–16 preservation/transition obligations.

## 3. User Stories / Requirements

*   **US-1:** As an editor user, I want the canvas (nodes, edges, literals, port modes, dynamic Switch configuration) to be exactly what is saved and executed, so that displayed state and executed state can never silently diverge.
*   **US-2:** As a node author, I want to co-locate manifest and executor authoring in one place while the frontend only receives a serializable manifest, so that adding/installing a backend node does not require rebuilding the frontend and no executable code crosses the wire.
*   **US-3:** As a backend operator, I want the planner to resolve ports, kinds, credentials, and behavior only from my trusted catalogue, so that client input cannot mislead or inconsistently define execution.
*   **US-4:** As an API consumer, I want asynchronous run creation (`202`), ordered replayable events, status polling, and authorized cancellation, so that long runs are observable, reconnectable, and race-free.
*   **US-5:** As a workflow builder, I want typed, schema-driven parameter forms (numbers, booleans, options, nested objects, collections, resource locators, credential references, conditional visibility, expressions, notices, rich validation), so that node configuration is declarative rather than string-only.

Requirements distilled from the normative contracts:

*   **Req-1:** The system must define exactly one mutable workflow representation (`GraphWorkflowDocument`) that is the source for projecting the canvas, persisting, history/undo-redo, autosave, and execution; the diagram is a projection, never an independent source.
*   **Req-2:** The frontend may specify which registered node kind to instantiate, node instance ids, literal parameter values, input binding modes, connections, layout state, and allowed dynamic metadata. It must not be able to specify executor implementations, executable functions, trusted port definitions, credential values, backend callback implementations, server capabilities, security policy, or manifests for existing kinds.
*   **Req-3:** The backend must never execute a client document before structural validation, node-kind resolution, parameter validation, dynamic-port resolution, edge endpoint validation, connection-policy validation, topology validation, credential-reference authorization, and capability validation, in that order, accumulating structured `GraphValidationIssue`s described below.
*   **Req-4:** Execution must be asynchronous and run-scoped: `POST /graph/runs` → `202` with `eventsUrl`/`resultUrl` before completion; status, result, cancel, and event endpoints operating on the run resource.
*   **Req-5:** Run events must be run-scoped, authorized, ordered, replayable (`afterSequence`), server-side ownership-filtered, carry monotonic per-run sequences assigned atomically at append, include replayable terminal events (cancel emits one), and carry nested-run parent/path information.
*   **Req-6:** Every executable node kind must have a manifest/executor registration in the backend catalogue; the frontend palette renders `GraphNodeManifest[]` and never constructors.
*   **Req-7:** Workflow documents must store credential references only; credentials are resolved and authorized server-side and never appear in documents, manifests, method responses, logs, or error/inspection payloads.
*   **Req-8:** Nested loop bodies must be `GraphWorkflowDocument` and recurse the same validation/resolution pipeline as the root.
*   **Req-9:** Runtime state (running/failed/outputs/errors) must never be persisted as node configuration; it belongs to run results and state events.
*   **Req-10:** All shipped runtime code must throw Decaf error types only (constitution §1.1.3); the graph error hierarchy below is normative.

## 4. Architecture & Design

### 4.1 Problem statement (current behavior)

```text
Decorated workflow class
        │
        ├── graphWorkflowDefinitionOf()
        │           │
        │           ├── initial diagram model
        │           └── execution request
        │
        └── GraphWorkflowSnapshot definition

Mutable ng-diagram model
        │
        ├── node positions
        ├── added/removed nodes
        ├── added/removed edges
        └── restored snapshot state

GraphNodeConfigStore
        │
        ├── literal values
        ├── port/value modes
        ├── output splits
        └── node metadata
```

These states are not consistently folded back into one executable definition. The Run action currently does:

```ts
const workflow = graphWorkflowDefinitionOf(this.workflowRoot as never);
await this.executionService.execute(workflow, inputs);
```

It does not build the executable workflow from the current diagram and node configuration state. As a consequence: a node added from the palette can appear on the canvas without being executed; a removed node can remain in the executed definition; drawn/deleted edges can differ from the edge set used by the engine; literal values edited in the node modal may not reach the executor; port/value mode selections may survive only in snapshots; dynamic Switch configuration can alter rendering without reliably altering the backend plan; undo/redo and restore may produce a canvas that does not match the next run.

**Client-provided node definitions:** the frontend converts constructors into full `GraphNodeDefinition` objects before sending a workflow to the backend; the planner accepts a raw object whenever it resembles a node definition (`isRawDefinition(nodeMeta.node)`), making client input authoritative for node kind, declared ports, metadata, dynamic loop-body definitions, connection planning metadata, and presentation/validation metadata that should be irrelevant to trusted execution dispatch. Registered executors still limit which code can run, but the design permits misleading or inconsistent execution definitions.

**Constructor-based frontend discovery:** the Angular palette invokes `graphDefinitionOf()` in the browser, so node constructors must be part of the frontend build, backend-installed nodes cannot appear without a rebuild, bundlers must preserve decorator/reflected-type metadata, browser bundles carry class code only needed for serializable metadata, discovery depends on import side effects, and discovery is compile-time rather than runtime.

**Limited parameter rendering:** `GraphPortFieldComponent` treats most values as strings with limited textarea/code special handling, and lacks numbers, booleans, static/dynamic options, nested objects, repeated collections, resource locators, credential references, conditional visibility, expressions, notices/read-only fields, rich validation, and node-specific dynamic field behavior.

**Execution event race:** the current backend waits for execution to finish before returning the response (`const result = await this.engine.execute(...); return { runId, status, outputs };`) and the frontend opens its SSE connection only after receiving that response without replay, so most or all execution events can be emitted before the frontend subscribes. Long executions are constrained by the request timeout, node-started/edge-routed events are not reliably observable, reconnects cannot recover missed events, a global event subject can expose events to unrelated subscribers before client-side filtering, and cancellation/run-state polling are not first-class.

### 4.2 Architectural principles

1. **One source of truth** — the `GraphWorkflowDocument` is projected into ng-diagram, persisted by `GraphWorkflowService`, stored in history, submitted for execution, and validated by the backend. The diagram model must not be an independent source of workflow semantics.
2. **Trusted catalogue, untrusted workflow instances** — see Req-2.
3. **Co-located authoring, separated runtime artifacts** — a node author defines manifest + executor coherently in one module/package; the shared `GraphNodeManifest` is frontend-safe and the `GraphNodeExecutor` is backend-only.
4. **Generic rendering first** — node-specific UI behavior is expressed through parameter schemas, conditional-visibility rules, dynamic-option and resource-locator method references, declarative port/dynamic-port rules, and shared field renderer types; custom frontend components are exceptional and explicitly registered.
5. **Backend validation before execution** — the peace-ordering in Req-3.
6. **Run-scoped transport** — execution creation, event consumption, result retrieval, and cancellation operate on a run resource.

### 4.3 Target architecture

```text
┌────────────────────────────────────────────────────────────────────┐
│ @decaf-ts/ui-decorators/graph                                     │
│                                                                    │
│ GraphWorkflowDocument     GraphNodeManifest                        │
│ GraphNodeInstance         GraphParameterDefinition                 │
│ GraphEdgeInstance         decorator → manifest compiler            │
│ Graph endpoint types      serializability helpers                  │
└────────────────────────────────┬───────────────────────────────────┘
                                 │ frontend-safe contracts
             ┌───────────────────┴────────────────────┐
             │                                        │
┌────────────▼────────────────────┐     ┌─────────────▼─────────────────┐
│ @decaf-ts/for-angular/graph     │     │ @decaf-ts/integrations/graph  │
│                                 │     │                               │
│ GraphNodeCatalogService         │     │ GraphNodeCatalogue            │
│ GraphWorkflowDocumentStore      │     │ GraphNodeRegistration         │
│ GraphDiagramAdapter             │     │ GraphWorkflowValidator        │
│ GraphParameterRendererRegistry  │     │ GraphExecutionPlanner         │
│ GraphExecutionClient            │     │ GraphExecutionEngine          │
│ GraphRunEventStore              │     │ backend-only executors        │
└────────────┬────────────────────┘     └─────────────┬─────────────────┘
             │ HTTP/SSE                               │
             └───────────────────┬────────────────────┘
                                 │
                   ┌─────────────▼───────────────────┐
                   │ integrations/src/nest/graph     │
                   │                                 │
                   │ catalogue endpoints             │
                   │ workflow endpoints              │
                   │ run lifecycle endpoints         │
                   │ authorized replayable SSE       │
                   └─────────────────────────────────┘
```

### 4.4 Canonical workflow document

**Package ownership (CTO-approved):** canonical document types live in `ui-decorators/src/graph/document/*`; manifest contracts live in `ui-decorators/src/graph/catalog/*`; built-in manifests live in `integrations/src/graph/shared/nodes/` and reach the frontend only through `@decaf-ts/integrations/graph/shared` (re-exports only — no divergent copies). These modules must not import Angular, NestJS, Node-only APIs, the engine, or executors; the `DECAF_35` ESLint `no-restricted-imports` wall extends to the new modules.

Canonical files:

```text
ui-decorators/src/graph/document/
  GraphWorkflowDocument.ts
  GraphNodeInstance.ts
  GraphEdgeInstance.ts
  GraphEndpoint.ts
  GraphNodeBinding.ts
  GraphWorkflowUiState.ts
  GraphWorkflowDocumentBuilder.ts
  GraphWorkflowDocumentReader.ts
  GraphWorkflowDocumentSerializer.ts
  index.ts
```

#### 4.4.1 `GraphWorkflowDocument` (normative shape)

```ts
export interface GraphWorkflowDocument {
  /** Stable workflow identifier. */
  id: string;
  /** Human-readable workflow name. */
  name: string;
  /** Workflow-level inputs exposed at the graph boundary. */
  inputs: GraphWorkflowPortInstance[];
  /** Workflow-level outputs exposed at the graph boundary. */
  outputs: GraphWorkflowPortInstance[];
  /** Executable node instances. */
  nodes: GraphNodeInstance[];
  /** Data and structural connections. */
  edges: GraphEdgeInstance[];
  /** Engine-neutral workflow settings. */
  settings?: GraphWorkflowSettings;
  /** Workflow-owned metadata permitted by the shared contract. */
  metadata?: Record<string, unknown>;
  /** Editor-only layout and presentation state. The engine ignores this. */
  ui?: GraphWorkflowUiState;
}
```

No class constructor, function, `GraphNodeDefinition`, `GraphWorkflowDefinition`, or Angular component reference may appear in this document.

#### 4.4.2 JSON-safe values

```ts
export type GraphJsonPrimitive = string | number | boolean | null;

export type GraphJsonValue =
  | GraphJsonPrimitive
  | GraphJsonValue[]
  | { [key: string]: GraphJsonValue };
```

Fields that cross the browser/backend boundary use `GraphJsonValue` (CTO ruling: not `unknown`) at every wire boundary. Dates are serialized as ISO strings; binary values are represented by references, never embedded runtime objects.

#### 4.4.3 Workflow boundary ports

```ts
export interface GraphWorkflowPortInstance {
  id: string;
  label?: string;
  schema?: GraphValueSchema;
  required?: boolean;
  defaultValue?: GraphJsonValue;
  metadata?: Record<string, GraphJsonValue>;
}
```

Workflow ports are workflow-owned. Node ports are catalogue-owned and must not be copied into the document as authoritative definitions.

#### 4.4.4 Node instances

```ts
export interface GraphNodeInstance {
  /** Unique inside one workflow document. */
  id: string;
  /** Trusted catalogue lookup key, e.g. "core.flow.switch". */
  kind: string;
  /** Optional user-facing instance label. */
  label?: string;
  /** Literal node configuration and operation choices. */
  parameters: Record<string, GraphJsonValue>;
  /** Input binding mode for each configurable input. */
  inputBindings?: Record<string, GraphInputBinding>;
  /** Output configuration such as enabled dynamic branches. */
  outputBindings?: Record<string, GraphOutputBinding>;
  /** Whether execution skips this node. */
  disabled?: boolean;
  /** Node-instance metadata allowed by the node manifest. */
  metadata?: Record<string, GraphJsonValue>;
  /** Editor placement. Ignored by the engine. */
  ui?: GraphNodeUiState;
}
```

The node instance must not include constructors, definitions, ports, executors, or Angular components.

#### 4.4.5 Input and output bindings

```ts
export type GraphInputBinding =
  | { mode: "edge" }
  | { mode: "literal"; value: GraphJsonValue }
  | { mode: "expression"; expression: string };

export interface GraphOutputBinding {
  enabled?: boolean;
  alias?: string;
  metadata?: Record<string, GraphJsonValue>;
}
```

Normative binding rules:

1. `mode: "edge"` requires an incoming edge unless the manifest marks the input optional.
2. `mode: "literal"` stores the value directly in the node instance.
3. `mode: "expression"` uses the engine's existing allowed-expression machinery (or fails validation; no new evaluator).
4. A port cannot simultaneously use an incoming edge and a literal unless explicitly allowed.
5. Literal values must not be redundantly stored in both `parameters` and `inputBindings`.
6. Non-port operation/configuration fields belong in `parameters`.
7. Data inputs switchable between connection and manual entry belong in `inputBindings`.

Input bindings replace the split between `GraphNodeConfigStore.values`, `GraphNodeConfigStore.portModes`, snapshot port state, and actual graph edges. Dynamic outputs primarily derive from node parameters; output bindings record instance-level enablement or aliases, not arbitrary output schema redefinition.

#### 4.4.6 Node UI state and edge endpoints

```ts
export interface GraphNodeUiState {
  position: { x: number; y: number };
  size?: { width?: number; height?: number };
  expanded?: boolean;
  selectedTab?: string;
}

export type GraphEndpoint =
  | { scope: "workflow"; port: string }
  | { scope: "node"; nodeId: string; port: string };
```

String sentinels such as `"$workflow"` are replaced by the explicit `GraphEndpoint` union. Layout/presentation (`ui.*`) is document-carried but engine-ignored, excluded from pinning fingerprints, and asserted absent from semantic equality.

#### 4.4.7 Edge instances

```ts
export interface GraphEdgeInstance {
  id: string;
  type: "data" | "connection";
  source: GraphEndpoint;
  target: GraphEndpoint;
  label?: string;
  metadata?: Record<string, GraphJsonValue>;
  ui?: GraphEdgeUiState;
}

export interface GraphEdgeUiState {
  points?: Array<{ x: number; y: number }>;
}
```

#### 4.4.8 Nested loop bodies

```ts
export interface GraphLoopConfiguration {
  body: GraphWorkflowDocument;
  maxIterations?: number;
  timeoutMs?: number;
  concurrency?: number;
  inputMappings?: Record<string, GraphValueReference>;
  outputMappings?: Record<string, GraphValueReference>;
}
```

Loop bodies are `GraphWorkflowDocument`, never embedded `GraphWorkflowDefinition`. Nested documents undergo the same catalogue resolution and validation as the root document.

#### 4.4.9 Builder and decorated-workflow compiler

```ts
export class GraphWorkflowDocumentBuilder {
  constructor(id: string, name?: string);
  addInput(input: GraphWorkflowPortInstance): this;
  addOutput(output: GraphWorkflowPortInstance): this;
  addNode(node: GraphNodeInstance): this;
  addEdge(edge: GraphEdgeInstance): this;
  setSettings(settings: GraphWorkflowSettings): this;
  setMetadata(metadata: Record<string, GraphJsonValue>): this;
  build(): GraphWorkflowDocument;
}
```

`build()` performs local structural validation and throws a Decaf `ValidationError` when invalid; it rejects uniques/non-JSON-unsafe values (approved P1 gate).

```ts
export class GraphDecoratedWorkflowCompiler {
  compile(
    workflow: Constructor<Model> | Model | GraphWorkflowDefinition,
    options?: GraphDecoratedWorkflowCompileOptions
  ): GraphWorkflowDocument;
}
```

Located at `ui-decorators/src/graph/document/GraphDecoratedWorkflowCompiler.ts`. The compiler converts member constructors to `{id, kind}`, relations to explicit endpoints, boundaries to workflow ports, defaults to parameters/bindings, layout to UI state, nested workflows recursively, removes functions and constructors, and verifies JSON serializability. It serves initialization and compatibility/restore; it must not run on every Run press.

**Legacy mapping ruling (CTO):** `GraphWorkflowDefinition` is demoted to authoring/compatibility input — compiled to a document by the decorated compiler at initialization/restore, never on Run. `GraphWorkflowSnapshot` becomes `{ document, editor, metadata }` with lossless converters during transition. `GraphNodeConfigStore` is replaced by `parameters` + `inputBindings`/`outputBindings`; a temporary facade is acceptable, final removal is a cutover acceptance criterion.

### 4.5 Node manifest contract

Generic manifest contracts and compilers belong in `ui-decorators/src/graph/catalog/`; built-in manifests in `integrations/src/graph/shared/nodes/`; runtime discovery comes from the backend catalogue API.

```ts
export interface GraphNodeManifest {
  kind: string;
  display: GraphNodeDisplayManifest;
  inputs: GraphPortManifest[];
  outputs: GraphPortManifest[];
  connections?: GraphPortManifest[];
  parameters: GraphParameterDefinition[];
  dynamicPorts?: GraphDynamicPortRule[];
  credentials?: GraphCredentialRequirement[];
  capabilities?: GraphNodeCapability[];
  methods?: GraphNodeMethodManifest[];
  policies?: GraphNodePolicyManifest;
  metadata?: Record<string, GraphJsonValue>;
}

export interface GraphNodeDisplayManifest {
  name: string;
  description?: string;
  category?: string;
  group?: string;
  labels?: string[];
  icon?: GraphIconReference;
  color?: string;
  width?: number;
  minWidth?: number;
  height?: number;
}

export type GraphIconReference =
  | { type: "catalogue"; name: string }
  | { type: "url"; url: string }
  | { type: "data"; mediaType: "image/svg+xml"; value: string };
```

Arbitrary filesystem paths must not be exposed.

```ts
export interface GraphPortManifest {
  id: string;
  label: string;
  direction: "input" | "output" | "connection";
  schema?: GraphValueSchema;
  required?: boolean;
  hidden?: boolean;
  category?: string;
  handle?: string;
  connectionPolicy?: GraphConnectionPolicy;
  configurable?: boolean;
  defaultMode?: "edge" | "literal" | "expression";
  metadata?: Record<string, GraphJsonValue>;
}
```

The existing distinction between data ports and structural `@connection()` ports remains.

```ts
export interface GraphConnectionPolicy {
  allowSelf?: boolean;
  allowMultiple?: boolean;
  allowedNodeKinds?: string[];
  blockedNodeKinds?: string[];
  allowedPortCategories?: string[];
  maxConnections?: number;
}
```

The backend enforces connection-policy rules; the frontend applies them optimistically only.

```ts
export type GraphValueSchema =
  | { type: "any" }
  | { type: "string"; format?: string }
  | { type: "number"; integer?: boolean; min?: number; max?: number }
  | { type: "boolean" }
  | { type: "array"; items: GraphValueSchema; minItems?: number; maxItems?: number }
  | {
      type: "object";
      properties: Record<string, GraphValueSchema>;
      required?: string[];
      additionalProperties?: boolean;
    }
  | { type: "enum"; values: GraphJsonPrimitive[] }
  | { type: "model"; name: string; properties?: Record<string, GraphValueSchema> };
```

Existing Decaf validation metadata should compile into this form where possible.

### 4.6 Parameter schema system

```ts
export type GraphParameterDefinition =
  | GraphStringParameter
  | GraphNumberParameter
  | GraphBooleanParameter
  | GraphOptionsParameter
  | GraphCollectionParameter
  | GraphObjectParameter
  | GraphCodeParameter
  | GraphExpressionParameter
  | GraphResourceLocatorParameter
  | GraphCredentialParameter
  | GraphNoticeParameter
  | GraphHiddenParameter;

export interface GraphParameterBase {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: GraphJsonValue;
  placeholder?: string;
  visibility?: GraphVisibilityExpression;
  validation?: GraphParameterValidation[];
  metadata?: Record<string, GraphJsonValue>;
}

export interface GraphStringParameter extends GraphParameterBase {
  type: "string";
  multiline?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface GraphNumberParameter extends GraphParameterBase {
  type: "number";
  integer?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface GraphBooleanParameter extends GraphParameterBase {
  type: "boolean";
}

export interface GraphOptionsParameter extends GraphParameterBase {
  type: "options";
  options?: GraphParameterOption[];
  loadOptionsMethod?: string;
  multiple?: boolean;
}

export interface GraphCodeParameter extends GraphParameterBase {
  type: "code";
  language: "javascript" | "typescript" | "json" | "text";
  validateMethod?: string;
}

export interface GraphResourceLocatorParameter extends GraphParameterBase {
  type: "resourceLocator";
  modes: GraphResourceLocatorMode[];
}
```

The discriminated union (string, multiline string, number, boolean, static/dynamic options, nested object, repeated collection, code, expression, resource locator, credential reference, notice, hidden) sits over `GraphParameterBase`; forms retain JSON types end-to-end.

**Conditional visibility** is the serializable DSL only — no function-valued visibility ever crosses the wire:

```ts
export type GraphVisibilityExpression =
  | { op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte"; parameter: string; value: GraphJsonPrimitive }
  | { op: "in" | "notIn"; parameter: string; values: GraphJsonPrimitive[] }
  | { op: "exists"; parameter: string }
  | { op: "and" | "or"; expressions: GraphVisibilityExpression[] }
  | { op: "not"; expression: GraphVisibilityExpression };
```

Backend validation of security-sensitive fields is invariant under visibility state (visibility cannot suppress backend validation).

**Dynamic ports** are declarative rules; the frontend never executes arbitrary class methods such as `GraphNode.applyMetadata()`:

```ts
export type GraphDynamicPortRule =
  | {
      type: "repeatFromParameter";
      parameter: string;
      itemIdPath: string;
      itemLabelPath?: string;
      direction: "input" | "output" | "connection";
      portIdTemplate: string;
      defaultPort?: GraphPortManifest;
    }
  | {
      type: "togglePort";
      parameter: string;
      equals: GraphJsonPrimitive;
      port: GraphPortManifest;
    };
```

For cases that cannot be represented declaratively, the backend exposes `POST /graph/node-types/{kind}/resolve`. The backend remains authoritative; the frontend may cache resolved results. Conformance proof required: Switch's dynamic ports must resolve identically through declarative rules (CTO supersession condition on DECAF-34).

**Backend methods:**

```ts
export interface GraphNodeMethodManifest {
  name: string;
  type:
    | "loadOptions"
    | "listSearch"
    | "resourceLocator"
    | "resourceMapping"
    | "validateParameter"
    | "action";
  parameter?: string;
  dependencies?: string[];
}
```

Only registered methods may be invoked; the client never submits source code or module paths. Registration verifies both directions (every declared method implemented, every implementation declared).

**Credentials:**

```ts
export interface GraphCredentialRequirement {
  type: string;
  required?: boolean;
  displayName?: string;
  allowedOperations?: string[];
}

export interface GraphCredentialReference {
  credentialId: string;
  credentialType: string;
}
```

Workflow documents store credential references, never credential secrets.

### 4.7 Node authoring and registration

Backend catalogue files:

```text
integrations/src/graph/engine/catalog/
  GraphNodeCatalogue.ts
  GraphNodeRegistration.ts
  GraphNodeManifestResolver.ts
  GraphNodeMethodRegistry.ts
  GraphCatalogueErrors.ts
  index.ts
```

```ts
export interface GraphNodeRegistration {
  manifest: GraphNodeManifest;
  executor: GraphNodeExecutor;
  methods?: Record<string, GraphNodeMethod>;
  resolveManifest?: GraphResolvedManifestProvider;
}

export type GraphNodeMethod = (
  request: GraphNodeMethodRequest,
  context: GraphNodeMethodContext
) => Promise<GraphJsonValue>;

export class GraphNodeCatalogue {
  register(registration: GraphNodeRegistration): this;
  unregister(kind: string): this;
  has(kind: string): boolean;
  getManifest(kind: string): GraphNodeManifest;
  getExecutor(kind: string): GraphNodeExecutor;
  getMethod(kind: string, method: string): GraphNodeMethod;
  listManifests(context?: GraphCatalogueQueryContext): GraphNodeManifest[];
  resolveManifest(
    kind: string,
    instance: GraphNodeInstance,
    context?: GraphNodeResolutionContext
  ): Promise<GraphResolvedNodeManifest>;
}
```

`GraphNodeExecutorRegistry` becomes internal to (or delegates to) the catalogue — one kind→registration map; two independently maintained kind maps are forbidden, as they are the drift vector this specification's acceptance criteria target (CTO ruling).

**Registration validation (fail fast, Decaf errors) fails when:** `manifest.kind` is empty; the kind is already registered without an explicit replacement policy; the manifest is not JSON-serializable; a manifest contains functions or constructors; a declared backend method has no implementation; a method implementation is not declared by the manifest; duplicate parameter or static port IDs exist; a default binding mode is invalid; dynamic-port rules reference missing parameters; credential requirements are malformed; the executor is absent.

**Co-located authoring helper:**

```ts
export function defineGraphNode(
  registration: GraphNodeRegistration
): GraphNodeRegistration {
  return registration;
}
```

Node authors may co-locate manifest and executor registration; the shared manifest remains separately exportable and the registration containing the executor remains backend-only.

### 4.8 Backend workflow validation

Extend `integrations/src/graph/engine/validation/` with:

```text
GraphWorkflowDocumentValidator.ts
GraphNodeInstanceValidator.ts
GraphEdgeInstanceValidator.ts
GraphParameterValidator.ts
GraphConnectionPolicyValidator.ts
GraphCredentialReferenceValidator.ts
GraphResolvedWorkflow.ts
GraphValidationIssue.ts
```

```ts
export interface GraphValidationIssue {
  code: string;
  path: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  details?: Record<string, GraphJsonValue>;
}

export interface GraphWorkflowValidationResult {
  valid: boolean;
  issues: GraphValidationIssue[];
  resolved?: GraphResolvedWorkflow;
}

export interface GraphResolvedWorkflow {
  document: GraphWorkflowDocument;
  nodes: GraphResolvedNodeInstance[];
  edges: GraphResolvedEdgeInstance[];
  nodeById: Map<string, GraphResolvedNodeInstance>;
  incomingByNode: Map<string, GraphResolvedEdgeInstance[]>;
  outgoingByNode: Map<string, GraphResolvedEdgeInstance[]>;
}

export interface GraphResolvedNodeInstance {
  instance: GraphNodeInstance;
  manifest: GraphResolvedNodeManifest;
  executor: GraphNodeExecutor;
}
```

`GraphResolvedWorkflow` is backend-only. Validation runs the nine stages in the exact normative order 1→9: workflow structure → kind resolution → parameters → dynamic ports → edge endpoints → connection policy → topology → credential-reference authorization → capability validation. All server-side; structured issue accumulation rather than abrupt failure.

**Required validations:**

- *Document:* non-empty workflow ID; unique node, edge, workflow-input, and workflow-output IDs; JSON-safe values only; recursive nested-workflow validation; configurable document-size, depth, node-count, and edge-count limits.
- *Node:* every kind exists in the backend catalogue; parameters are declared unless explicitly allowed; required parameters present and correctly typed; visibility cannot bypass security-sensitive validation; binding IDs refer to effective ports; metadata contains only allowed keys; disabled behavior is valid.
- *Edge:* endpoints and referenced nodes/ports exist; source/target directions valid; data and structural edges use compatible ports; connection policies and counts enforced; conflicting duplicate edges rejected; self-connections rejected unless allowed.
- *Binding:* edge-bound required inputs have incoming edges; literal bindings contain schema-valid values; expression bindings contain valid expressions; conflicting literal and edge bindings rejected unless allowed.
- *Credential:* references exist and are authorized; credential type matches the manifest; plain credentials never appear in workflow documents.
- *Topology:* unsupported cycles rejected (`DECAF-32` acyclicity preserved, loop constructs excepted); loop-body graphs independently acyclic; boundary routing valid; required values satisfiable.

**Normative error hierarchy (constitution §1.1.3 hard rule only):**

```ts
export class GraphDocumentValidationError extends ValidationError {}
export class GraphNodeNotFoundError extends NotFoundError {}
export class GraphNodeRegistrationError extends InternalError {}
export class GraphNodeMethodNotFoundError extends NotFoundError {}
export class GraphConnectionValidationError extends ValidationError {}
export class GraphCredentialAuthorizationError extends AuthorizationError {}
export class GraphRunNotFoundError extends NotFoundError {}
export class GraphRunAuthorizationError extends AuthorizationError {}
export class GraphRunStateError extends InternalError {}
```

### 4.9 Planner and engine changes

```ts
export class GraphExecutionPlanner {
  plan(workflow: GraphResolvedWorkflow): GraphExecutionPlan;
}
```

`GraphExecutionPlanner` must stop accepting `GraphWorkflowDefinition`. The public engine accepts a canonical document and performs resolution internally:

```ts
export class GraphExecutionEngine {
  async execute(
    document: GraphWorkflowDocument,
    inputs: GraphExecutionValues,
    options?: GraphExecutionOptions
  ): Promise<GraphExecutionResult>;
}
```

The planner must not call `graphDefinitionOf()` and must not accept inline raw `GraphNodeDefinition` objects (P3 gate: a test proves `graphDefinitionOf()` absent and raw definition objects rejected).

```ts
export interface GraphExecutionPlanNode {
  id: string;
  kind: string;
  instance: GraphNodeInstance;
  manifest: GraphResolvedNodeManifest;
  executor: GraphNodeExecutor;
  inputPorts: string[];
  outputPorts: string[];
  connectionPorts: string[];
  metadata?: Record<string, GraphJsonValue>;
}

export interface GraphNodeExecutionRequest {
  nodeId: string;
  kind: string;
  inputs: GraphExecutionValues;
  parameters: Record<string, GraphJsonValue>;
  credentials: GraphResolvedCredentials;
  metadata?: Record<string, GraphJsonValue>;
}

export interface GraphNodeExecutor {
  execute(
    request: GraphNodeExecutionRequest,
    context: GraphExecutionContext
  ): Promise<GraphExecutionValues> | GraphExecutionValues;
}
```

Inputs are built from routed edges, literal bindings, allowed expressions, manifest defaults, and node parameters; configuration and input data are separated. A temporary compatibility adapter may wrap existing input-only executors (removal at cutover). Executor outputs are validated against the effective output manifest — unknown outputs rejected by default, missing required outputs fail the node. Disabled-node semantics are the explicit enum `GraphDisabledNodeBehavior = "skip" | "passThroughFirstInput" | "emitDefaults"`. Loop executors receive nested `GraphWorkflowDocument` objects and invoke the same validation, resolution, planning, and execution pipeline. Pinning fingerprints derive from node kind, parameters, bindings, effective inputs, relevant metadata, and configured dependency fingerprints; presentation-only UI state must not affect pinning.

### 4.10 Workflow persistence

```ts
@table("graph_workflow")
@model()
export class GraphWorkflowModel extends BaseModel {
  @pk({ type: String, generated: false })
  workflowId!: string;

  @column()
  name!: string;

  @column()
  document!: GraphWorkflowDocument;

  constructor(arg?: Partial<GraphWorkflowModel>) {
    super(arg);
  }
}
```

The existing `snapshot` property may remain temporarily but must not remain the long-term executable source of truth.

```ts
@service(GraphWorkflowModel)
export class GraphWorkflowService
  extends ModelService<GraphWorkflowModel> {
  async saveDocument(
    workflowId: string,
    document: GraphWorkflowDocument,
    ...args: MaybeContextArgs
  ): Promise<GraphWorkflowModel>;

  async getDocument(
    workflowId: string,
    ...args: MaybeContextArgs
  ): Promise<GraphWorkflowDocument>;

  async validateDocument(
    document: GraphWorkflowDocument,
    ...args: MaybeContextArgs
  ): Promise<GraphWorkflowValidationResult>;
}
```

The service validates before persistence, propagates context, enforces ownership, matches path/document IDs, rejects functions/definitions, and preserves UI state. Endpoints:

```http
PUT  /graph/workflows/{workflowId}
GET  /graph/workflows/{workflowId}
POST /graph/workflows/validate
```

Validation returns structured issues with code, path, node/edge IDs, message, and safe details.

### 4.11 Snapshot, history, and autosave integration

`GraphWorkflowSnapshot` may remain a history/transport wrapper but must contain or derive from the canonical document:

```ts
export interface GraphWorkflowSnapshot {
  document: GraphWorkflowDocument;
  editor?: GraphSnapshotEditorState;
  metadata?: Record<string, GraphJsonValue>;
}
```

If the existing structure remains temporarily, add lossless document/snapshot converters. `GraphHistoryService` must store canonical documents or snapshots containing them; undo/redo restores nodes, edges, parameters, bindings, dynamic metadata, positions, viewport, and boundaries without constructor references. `GraphMutationDetectorService` and autosave must read from `GraphWorkflowDocumentStore`, never rebuild from the decorated root. Positions are committed on drag-end, not per mouse-move (the `DECAF_36` mitigation).

### 4.12 Angular frontend changes

Required modules:

```text
for-angular/src/graph/catalog/
  GraphNodeCatalogService.ts
  GraphNodeCatalogStore.ts
  GraphNodeCatalogApi.ts

for-angular/src/graph/document/
  GraphWorkflowDocumentStore.ts
  GraphDiagramAdapter.ts
  GraphDocumentMutation.ts
  GraphDocumentSelectors.ts
  GraphDocumentCommands.ts

for-angular/src/graph/parameters/
  GraphParameterRendererRegistry.ts
  GraphParameterFormBuilder.ts
  GraphParameterVisibilityEvaluator.ts
  GraphParameterValidationMapper.ts
  components/

for-angular/src/graph/runs/
  GraphRunClient.ts
  GraphRunEventClient.ts
  GraphRunStateStore.ts
```

```ts
@service()
@Injectable({ providedIn: "root" })
export class GraphNodeCatalogService {
  async load(): Promise<void>;
  async refresh(): Promise<void>;
  all(): GraphNodeManifest[];
  get(kind: string): GraphNodeManifest | undefined;
  async resolve(instance: GraphNodeInstance): Promise<GraphResolvedNodeManifest>;
  async invokeMethod(
    kind: string,
    method: string,
    request: GraphNodeMethodRequest
  ): Promise<GraphJsonValue>;
}
```

The palette consumes manifests, not constructors; adding a node creates a `GraphNodeInstance` and dispatches `node.add` to the document store.

```ts
@service()
@Injectable({ providedIn: "root" })
export class GraphWorkflowDocumentStore {
  initialize(document: GraphWorkflowDocument): void;
  snapshot(): GraphWorkflowDocument;
  addNode(node: GraphNodeInstance): void;
  removeNode(nodeId: string): void;
  updateNode(nodeId: string, patch: GraphNodeInstancePatch): void;
  addEdge(edge: GraphEdgeInstance): void;
  removeEdge(edgeId: string): void;
  moveNode(nodeId: string, position: GraphPosition): void;
  setViewport(viewport: GraphViewport): void;
  replace(document: GraphWorkflowDocument): void;
  reset(): void;
}
```

Every semantic mutation goes through the store; components never directly mutate the diagram and infer semantic changes later.

**Diagram adapter:**

```ts
export class GraphDiagramAdapter {
  toDiagram(
    document: GraphWorkflowDocument,
    catalogue: GraphNodeManifestReader,
    injector?: Injector
  ): ModelAdapter;

  applyDiagramMutation(
    document: GraphWorkflowDocument,
    mutation: NgDiagramMutation,
    catalogue: GraphNodeManifestReader
  ): GraphWorkflowDocument;

  reconcile(
    document: GraphWorkflowDocument,
    previousDiagram: ModelAdapter | null,
    catalogue: GraphNodeManifestReader,
    injector?: Injector
  ): ModelAdapter;
}
```

Projection is a pure function of (document, manifest reader). Every canvas mutation becomes a document command dispatched to `GraphWorkflowDocumentStore`; the diagram is re-projected from the store, never the reverse. The adapter resolves presentation and ports, maps explicit endpoints, preserves layout, converts drag/edge operations into document commands, rejects invalid optimistic connections, never stores constructors, and keeps stable document/engine edge IDs. Optimistic connection validation is client-side convenience only, never trusted as the backend gate. Divergence controls: command-only mutation policy, development-mode assertions comparing diagram vs document, semantic round-trip tests per built-in kind, and restore-invariance on semantic hash even when UI deltas differ.

**Node edit modal:** results update the document store; `GraphNodeEditContext` carries `node` + `manifest`; `GraphNodeEditResult` carries `nodeId`, `parameters`, `inputBindings`, optional `outputBindings`/`metadata`. `GraphNodeConfigStore` is removed after transition or reduced to a temporary facade over the document store.

**Parameter renderer registry:**

```ts
export class GraphParameterRendererRegistry {
  register(
    type: GraphParameterDefinition["type"],
    component: Type<GraphParameterRendererContract>
  ): this;
  resolve(
    parameter: GraphParameterDefinition
  ): Type<GraphParameterRendererContract>;
}
```

Required renderers: string, multiline, number, boolean, static options, dynamic options, collection, object, code, expression, resource locator, credential selector, notice, and hidden value. Forms retain JSON types, apply manifest validators, evaluate visibility, preserve hidden values unless directed otherwise, and reload dynamic options when dependencies change. Custom frontend components are explicitly registered at build time and fall back to generic rendering when absent; arbitrary JavaScript is never downloaded from backend-installed nodes, and custom UI cannot override backend validation.

### 4.13 Node catalogue API

Add `integrations/src/nest/graph/GraphNodeCatalogueController.ts`:

```http
GET  /graph/node-types
GET  /graph/node-types/{kind}
POST /graph/node-types/{kind}/resolve
POST /graph/node-types/{kind}/methods/{method}
GET  /graph/node-types/{kind}/icon
```

API rules (normative): the API returns frontend-safe manifests only — no functions, module paths, or secrets; `listManifests` output is deterministically ordered (kind-sorted) so digest/`ETag` caching stays stable; `/resolve` accepts the node-instance subset it needs and returns resolved manifests — client input is never definition material; method endpoints verify the declared method and type, authorize credentials server-side, sanitize parameters, propagate the request context, and rate-limit expensive operations. The frontend may cache manifests using ordinary HTTP caching such as `ETag` or a catalogue digest; catalogue versioning semantics remain outside scope.

### 4.14 Asynchronous execution API

```ts
export interface GraphRun {
  runId: string;
  workflowId: string;
  ownerUser: string | null;
  status:
    | "queued"
    | "validating"
    | "running"
    | "succeeded"
    | "failed"
    | "cancelled";
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: GraphExecutionResult;
  error?: GraphExecutionErrorPayload;
}
```

```http
POST /graph/runs
```

The request may contain either an unsaved canonical document plus inputs, or a saved `workflowId` plus inputs — supplying both is rejected as ambiguous. Response `HTTP/1.1 202 Accepted`:

```json
{
  "runId": "run-123",
  "workflowId": "workflow-1",
  "status": "queued",
  "eventsUrl": "/graph/runs/run-123/events",
  "resultUrl": "/graph/runs/run-123"
}
```

The endpoint authenticates, checks size, allocates and owns the run, records initial state, returns immediately, and then begins validation and execution asynchronously — `202` with `eventsUrl`/`resultUrl` must be returned **before** completion (approved phase gate).

```http
GET    /graph/runs/{runId}
DELETE /graph/runs/{runId}
```

Cancellation is authorized, idempotent for terminal runs, signals the engine abort controller, and emits a replayable terminal event. The existing `POST /graph/execute` may temporarily delegate to the run service; it is deprecated, not removed within this specification, and is not the primary Angular path.

### 4.15 Run event transport

```http
GET /graph/runs/{runId}/events?afterSequence={n}
```

```ts
export interface GraphRunEventEnvelope {
  runId: string;
  workflowId: string;
  sequence: number;
  type: GraphExecutionEventType;
  timestamp: string;
  nodeId?: string;
  edgeId?: string;
  payload?: GraphJsonValue;
  error?: GraphExecutionErrorPayload;
}
```

Requirements: monotonically increasing per-run sequence numbers assigned **atomically at append** by a single writer per run (emit-time numbering risks gaps/reordering under concurrency); retention sufficient for initial subscription and reconnect; replay through `afterSequence` and from offset 0; duplicates excluded after acknowledged sequences; server-side ownership enforcement (client-side filtering is not a security control); replayable terminal events; configurable backpressure and retention bounds; nested-run parent/path information carried in envelopes.

No global unfiltered subject for run events. Ownership/authorization is keyed by run + owner user from `DecafRequestContext` (null/system tolerated for standalone module runs, following the `DECAF_48` pattern), enforced server-side on status, events, cancellation, result, inspection, and logs.

Run event store (`integrations/src/graph/engine/runs/` — run service, run store, event store, publisher, executor, types, in-memory reference implementation):

```ts
export interface GraphRunEventStore {
  append(event: GraphRunEventEnvelope): Promise<void>;
  listAfter(runId: string, sequence: number): Promise<GraphRunEventEnvelope[]>;
  subscribe(
    runId: string,
    listener: (event: GraphRunEventEnvelope) => void
  ): () => void;
}
```

**Transport provenance ruling (CTO):** `DECAF_42` subscription mode is the foundation and remains untouched (broadcast default unchanged); `DECAF_48`'s `{ runId, ownerUser }` ownership tuple and `graph.run.*` topics are the run-scoped precedent extended. The run-scoped endpoint (`/graph/runs/{runId}/events`) is the **canonical** transport for run events; the `DECAF_42`/`DECAF_48` path via `/graph/events` remains the transition mechanism and is deprecated at cutover, with no new features routed through global streams. `DECAF_48` I/O inspection payloads ride run state/results rather than a parallel channel.

The Angular event client connects after `202`, requests from sequence zero, updates the execution mapper, reconnects from the last sequence, stops after terminal events, and falls back to run-status polling when SSE is unavailable.

### 4.16 Security and trust boundary

- **Client input:** the backend rejects fields resembling `node`, `definition`, `executor`, `execute`, authoritative `ports`, or frontend `component` definitions; only canonical document fields are accepted.
- **Prototype pollution:** document parsing rejects dangerous keys including `__proto__`, `prototype`, and `constructor`; safe object-property helpers are required for dynamic keys.
- **Credentials:** documents contain credential IDs only; catalogue APIs return no secrets; dynamic methods resolve credentials server-side after authorization; logs, errors, and inspection payloads redact secrets.
- **Code nodes:** code remains backend-only and uses the isolated evaluator; frontend syntax validation is advisory; backend syntax/policy validation is mandatory; code values are parameters, never manifest methods; time and memory limits are backend-enforced.
- **Run ownership:** every run records an owner from `DecafRequestContext`; ownership is checked for status, events, cancellation, result, inspection, logs, and pinning; server-side filter only.
- **Resource limits:** configurable limits cover request bytes, node/edge counts, nesting depth, object depth, collection sizes, dynamic-port counts, event payloads/retention, concurrent runs, dynamic method rates, and execution duration (defaults delegated to technical governance; required to exist, be configurable, and be enforced backend-side).

Runs record the executed document's content fingerprint plus the workflow reference for audit/reproducibility. Run persistence follows `DECAF_36` Req-B1–B7 verbatim: adapter-agnostic module, flavour-agnostic models, ModelService-only persistence, constructor DI, automatic context propagation, no repository injection tokens, `@Optional()` request context.

### 4.17 Current-to-target behavior matrix

| Concern | Current behavior | Required behavior |
|---|---|---|
| Workflow source | Decorated class, diagram, and config store coexist | One `GraphWorkflowDocument` |
| Run action | Rebuilds decorated definition | Runs current document-store snapshot |
| Added node | Added to diagram only | Added to canonical document, diagram projects it |
| Removed node | Removed from diagram | Removed from document with connected edges |
| Edge creation | Diagram mutation | Document command followed by diagram reconciliation |
| Node values | `GraphNodeConfigStore` and snapshot UI | `GraphNodeInstance.parameters/inputBindings` |
| Port mode | Separate config store | Canonical `GraphInputBinding` |
| Palette | Constructor array | `GraphNodeManifest[]` from catalogue |
| Node rendering | `graphDefinitionOf(ctor)` | Manifest-driven |
| Node execution | Client uploads definitions | Backend resolves kind in trusted catalogue |
| Planner input | `GraphWorkflowDefinition` | `GraphResolvedWorkflow` |
| Dynamic ports | Frontend class method/hardcoded cases | Declarative rules or backend resolution |
| Node options | Mostly static/generic strings | Typed schemas and authorized backend methods |
| Save | Snapshot with mixed definition/state | Canonical document plus editor state |
| Run endpoint | Synchronous | `202` asynchronous run creation |
| Events | Subscribe after completion; global subject | Run-scoped, authorized, ordered replay |
| Credentials | Not fully integrated | Authorized credential references |
| Validation | Partial planner/port validation | Full document/catalogue validation |
| Nested loops | Embedded workflow definition | Nested canonical document |
| Constructor use | Required in browser | Compatibility compiler only |
| Backend trust | Trusts raw definition shape | Trusts catalogue only |

### 4.18 Compatibility and transition

During transition, a public compatibility layer may accept a `GraphWorkflowDocument`, legacy snapshot, legacy definition, or decorated constructor, but immediately compiles everything into `GraphWorkflowDocument`; the engine and planner operate only on canonical/resolved types. Legacy conversion must move nodes/edges, config-store values, port modes, dynamic metadata, boundaries, and layout into the new document while removing constructors and `modelClass`/`sourceClass` references. A temporary `GRAPH_CANONICAL_DOCUMENT_ENABLED` feature flag supports staged delivery; feature-flag mechanics per technical governance (C7 cutover removes it).

Recommended rollout:

1. Contracts and converters.
2. Catalogue with legacy rendering retained.
3. Canonical store and dual-write assertions.
4. Save/history cutover.
5. Run cutover.
6. Inline-definition rejection.
7. Constructor-palette removal.
8. `GraphNodeConfigStore` removal.
9. Planner raw-definition fallback removal.
10. Feature flag removal.

Dual-write must be temporary and verified through semantic round-trip tests.

**Controlled transition (PM-approved):**

*Must keep working* (regression-gated through every phase): decorated workflow authoring via the compatibility compiler; loading and executing legacy persisted snapshots (lossless conversion; zero data loss); save/load, undo/redo, autosave, pinning, loops, Switch, connection ports; `DECAF_48` logs/state/inspection behavior, event types, topics, and ownership keys; the `shared`/`engine` package split and one-way imports from `DECAF_35`; existing REST endpoints coexisting with the new run API until cutover.

*Allowed to break* (by design): backend trust in client-provided `GraphNodeDefinition`; constructor-based palette discovery; `GraphNodeConfigStore` as an independent authoritative store; the raw-definition planner fallback; frontend execution requests carrying class/constructor objects. External consumers of legacy `GraphWorkflowDefinition` payloads move to the document API or the compatibility compiler.

### 4.19 Testing requirements

- **`ui-decorators`:** builder, uniqueness, endpoint serialization, JSON safety, decorated compilation, nested loops, manifest compilation/serialization, function-leakage rejection, schema derivation, visibility, dynamic ports, snapshot conversion, semantic round trips.
- **Catalogue and backend validation:** registration pairs, duplicate kinds, missing/undeclared methods, serializability, dynamic resolution, unknown kinds, duplicate IDs, endpoint/port errors, direction/schema/policy errors, parameter/binding conflicts, credentials, cycles, nested loops, limits, prototype pollution, rejection of embedded definitions.
- **Planner and engine:** the planner no longer calls `graphDefinitionOf`, accepts only resolved workflows, resolves executors through the catalogue, separates parameters/inputs, applies bindings, validates outputs, handles disabled nodes and nested loops, and excludes UI position from pin fingerprints.
- **Nest integration:** catalogue endpoints, dynamic methods, save/load/validate, `202` run creation, live events, replay/reconnect/terminal replay, result lookup, cancellation, ownership, credentials, five-plus concurrent subscribers, no cross-run delivery.
- **Angular:** catalogue caching, manifest palette, constructor-free node creation, document/diagram projection, all mutations, parameter types/visibility/options/collections/resources, bindings, modal saves, history/autosave, run lifecycle, replay, generic fallback rendering.

**Verification bar (CTO-mandated, backend-enforced):**

1. Bundle/boundary regression tests per affected module proving no executor, catalogue runtime, validator, or run-store code reaches the `for-angular` production bundle (extends the `DECAF_35` TASK-233 bundle scan to the new modules).
2. Catalogue/manifest conformance tests: per-kind serializability, uniqueness, function-leakage rejection, method-declaration↔implementation pairing, dynamic-rule parameter references, category/display conformance to the `DECAF_32` §21 visual contract.
3. SSE suites: ownership (cross-user denial), replay from 0 and mid-run offset, terminal replay, 5+ concurrent subscribers, no cross-run delivery (`DECAF_42`/`DECAF_48` fan-out standard).
4. Security tests: prototype-pollution key rejection (`__proto__`/`prototype`/`constructor`), client-manifest/inline-definition rejection, credential redaction in logs/errors/results.
5. Per-module lint/build/test in the affected packages (constitution §0 workflow) plus the multi-module `npm run npm-link` flow.
6. The 12-step canvas→run E2E below is the primary acceptance proof; it must demonstrate added node + edited literal + removed/new edge re-routing + save/reload + live events before terminal event + output reflecting the edited canvas.

**Mandatory E2E regression (12 steps):**

1. Open a workflow with two nodes.
2. Add a third node.
3. Edit a literal input.
4. Remove an edge.
5. Draw a new edge through the added node.
6. Save and reload.
7. Confirm all state restores.
8. Run the workflow.
9. Confirm the added node executes with its literal.
10. Confirm the removed edge is unused and the new edge routes data.
11. Confirm live node/edge events arrive before the terminal event.
12. Confirm final output reflects the edited canvas.

Primary acceptance proof that editor, persistence, and engine share one source of truth. Definition-of-done demonstration: this E2E plus a backend assertion that the document persisted by the *server* at save time equals the document the run consumed (semantic compare, not just canvas diff) — as approved by the Product Manager.

### 4.20 Acceptance criteria

**Canonical state:**

- [ ] Exactly one `GraphWorkflowDocument` represents current workflow semantics.
- [ ] Canvas mutations, Save, autosave, history, undo/redo, and Run use it.
- [ ] The diagram is a projection of it.

**Node catalogue:**

- [ ] Every executable kind has a manifest/executor registration.
- [ ] Frontend receives serializable manifests without constructors.
- [ ] Backend resolves trusted behavior from its catalogue.
- [ ] Client definitions are rejected.
- [ ] Manifest/executor drift cannot occur silently.

**Parameter system:**

- [ ] All required parameter control types are supported.
- [ ] JSON types are retained end-to-end.
- [ ] Visibility is declarative.
- [ ] Dynamic options use authorized backend methods.
- [ ] Binding modes are canonical instance state.
- [ ] Dynamic ports resolve consistently.

**Execution:**

- [ ] Planner operates on trusted resolved workflows.
- [ ] Added/removed nodes and edges affect execution correctly.
- [ ] Edited literals reach executors.
- [ ] Nested loops use canonical documents.
- [ ] Outputs are validated.

**Persistence and transport:**

- [ ] Saved workflows restore executable and UI state without functions.
- [ ] Run creation returns before completion (`202` + `eventsUrl`/`resultUrl`).
- [ ] Events are live, ordered, replayable, reconnectable, and ownership-filtered server-side.
- [ ] Cancellation emits a terminal event.

**Boundary and verification:**

- [ ] `for-angular` imports frontend-safe contracts only.
- [ ] Production browser bundles contain no engine/executor code.
- [ ] Generic rendering works without node-specific Angular code.
- [ ] All relevant lint, build, unit, integration, E2E, bundle, and security checks pass.

**Phase-level gates (PM-approved; each verified by named tests):**

- **P1 Shared contracts:** `@decaf-ts/ui-decorators/graph` exports the document/instance/binding/manifest/parameter/visibility/schema types plus builder, serializer, decorated compiler; lint/bundle test proves no Angular, NestJS, Node-only, or engine imports in the new modules; builder rejects uniques/JSON-unsafe values with Decaf `ValidationError`; decorated-compile round-trip is lossless on fixtures covering all built-in kinds incl. nested loops and Switch.
- **P2 Backend catalogue:** registration validation enforced (duplicate kinds, functions/constructors in manifests, undeclared methods, duplicate IDs, missing executors); all built-in kinds registered as manifest+executor pairs; catalogue HTTP API returns JSON-safe manifests only, context-propagated, rate-limited on expensive `resolve`/`methods` calls.
- **P3 Engine resolution:** planner accepts only `GraphResolvedWorkflow`; test proves `graphDefinitionOf()` absent and raw `GraphNodeDefinition` objects rejected; parameters/inputs separation; output validation against effective manifests; disabled-node semantics; loop bodies validated recursively; pinning fingerprints exclude UI position.
- **P4 Angular canonical store:** document store + `GraphDiagramAdapter` live with semantic invariants proven by document⇄diagram round-trip tests; palette renders `GraphNodeManifest[]` and node creation yields a document instance, no constructor in the browser path; edit modal writes parameters/bindings through the store; visibility DSL, dynamic options, collections, resource locators, credential pickers render generically with explicit registered-UI fallback.
- **P5 Persistence:** `PUT/GET /graph/workflows/{id}` + `POST /graph/workflows/validate`; structured issues surface code/path/nodeId/edgeId; legacy persisted snapshots load via lossless conversion; function/definition-bearing documents rejected at the boundary.
- **P6 Run lifecycle:** `POST /graph/runs` → `202` with `eventsUrl`/`resultUrl` before completion; status/result/cancel endpoints; monotonic per-run sequencing, `afterSequence` replay, reconnect mid-run without gaps/duplicates, server-side ownership filter (client filtering is not a control), replayable terminal events, cancellation emits a terminal event, 5+ concurrent subscribers isolated; `DECAF_48` event/state/log contract preserved for the Angular side.
- **P7 Cutover:** the 12-step E2E fully green; inline definitions rejected by the backend; constructor-based palette discovery removed from the editor; `GraphNodeConfigStore` no longer an independent source; feature flag removed per technical governance; cross-package docs/READMEs updated; bundle check proves no engine/executor code in production browser output.

Every phase ships behind the `GRAPH_CANONICAL_DOCUMENT_ENABLED` flag with dual-write/round-trip assertions until P7 cutover. No phase is optional; a phase is "done" only when its tests pass and the previous phase's invariants still hold.

### 4.21 Related specifications — supersessions carried forward

This work binds itself to and supersedes parts of the following local specifications, without rewriting their historical completion records misleadingly:

- **DECAF-24** ([./DECAF_24.md](./DECAF_24.md)) — the canonical layer remains in `ui-decorators`; the document types join it; `GraphWorkflowDefinition`/`GraphNodeDefinition` are authoring/compat only; the Angular palette no longer derives from constructors.
- **DECAF-32** ([./DECAF_32.md](./DECAF_32.md)) — planner input becomes `GraphResolvedWorkflow`; synchronous `/graph/execute` deprecated in favor of the run lifecycle; the `GRAPH_WORKFLOW_BOUNDARY` sentinel is retired for documents (legacy converter handles it); event-type enums, kind taxonomy (`core.*`), store/pinning model, and the §21 visual contract are preserved and extended by manifests.
- **DECAF-34** ([./DECAF_34.md](./DECAF_34.md)) — kind taxonomy and referenced-spec status remain; constructor-based discovery and any client-side `applyMetadata()` requirement are superseded by catalogue manifests + declarative dynamic-port rules + backend `/resolve`; `Metadata.nodes()`/`workflows()` accessors remain valid for backend registration and compat flows but do not drive the palette; conformance proof required that Switch's dynamic ports resolve identically through declarative rules.
- **DECAF-35** ([./DECAF_35.md](./DECAF_35.md)) — the shared/engine boundary is preserved and enforced, extended to the new catalogue/parameters/run modules; built-in manifests re-export via `graph/shared`; engine code stays out of browser bundles.
- **DECAF-36** ([./DECAF_36.md](./DECAF_36.md)) — Req-B1–B7 backend invariants carry over unchanged; history/autosave/mutation services remain and operate on documents/document-store; the `DECAF_36` NFR-4 snapshot-format reuse is superseded by canonical document round-trips (snapshot becomes `{ document, editor }`).
- **DECAF-42** ([./DECAF_42.md](./DECAF_42.md)) — subscription mode untouched; broadcast default unchanged; run events move to the run-scoped endpoint at cutover.
- **DECAF-48** ([./DECAF_48.md](./DECAF_48.md)) — the `{ runId, ownerUser }` ownership and `graph.run.*` topics precedent are extended; run-scoped transport becomes canonical; I/O inspection payloads ride run state/results rather than a parallel channel.

## 5. Tasks Breakdown

This specification is broken down into the following phases. Each phase should be small enough to be planned and executed separately; concrete `TASK_*` files are allocated when the domain-root owner decomposes the work after initialization (they do not exist yet, so links are intentionally omitted).

| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| DECAF-50/P1 | Phase 1 — Shared contracts (canonical documents, instances, endpoints, bindings, manifests, parameter definitions, schemas, dynamic rules, serializers, builders, compilers, tests) | High | Pending | - |
| DECAF-50/P2 | Phase 2 — Backend catalogue (catalogue, registrations, built-in registrations, validation, catalogue/dynamic-method APIs, tests) | High | Pending | DECAF-50/P1 |
| DECAF-50/P3 | Phase 3 — Engine resolution (document validation, resolved workflows, catalogue plan nodes, parameter/input separation, output validation, nested documents) | High | Pending | DECAF-50/P2 |
| DECAF-50/P4 | Phase 4 — Angular canonical store (document store, diagram adapter, manifest palette, commands, schema-driven forms, save/history/autosave integration) | High | Pending | DECAF-50/P1 |
| DECAF-50/P5 | Phase 5 — Persistence (canonical document persistence, save/load/validate endpoints, legacy conversion, ownership, tests) | High | Pending | DECAF-50/P2 |
| DECAF-50/P6 | Phase 6 — Run lifecycle (asynchronous runs, stores, authorized replayable SSE, status, results, cancellation, Angular clients) | High | Pending | DECAF-50/P3, DECAF-50/P5 |
| DECAF-50/P7 | Phase 7 — Cutover (run the exact editor document, disable inline definitions, remove constructor discovery and independent config state, remove raw-definition planning, deprecate synchronous execution, complete E2E, update docs) | High | Pending | DECAF-50/P4, DECAF-50/P6 |

Package checkpoints (PM-approved): `ui-decorators` document/manifest types (P1); `integrations` catalogue + validation + persistence + run API (P2, P3, P5, P6); `for-angular` canonical store + catalogue-driven palette + parameter renderer (P4, P6 clients).

## 6. Open Questions / Risks

1. **Cross-package refactor:** deliver in phases with compatibility compilers and the `GRAPH_CANONICAL_DOCUMENT_ENABLED` feature flag.
2. **Snapshot data loss:** use fixture-based round trips for every built-in kind.
3. **Diagram/document divergence:** route all mutations through commands and add development assertions.
4. **Dynamic-port mismatch:** prefer shared declarative rules and conformance-test backend resolution.
5. **Catalogue startup latency:** mitigate with manifest list caching + digest (`ETag`).
6. **Credential exposure:** authorize and resolve server-side; redact logs/errors/results.
7. **Replay memory:** bounded buffers, retention cleanup, pluggable event stores.
8. **Legacy executor shape:** temporary adapter while migrating executors; removed at cutover.
9. **Specification conflicts:** preserve history and add supersession notes (§4.21); existing completed specs receive supersession references during implementation without rewriting historical completion records.
10. **Unsupported third-party controls:** generic fallback rendering and explicit validation errors.
11. **Compatibility migration silently dropping config-store state:** fixture-based round trips covering port modes, literal values, and dynamic binding decisions (accentuated by technical governance).
12. **Transition-phase fixture coverage** is owned by the implementation and QA gates, per the CTO decision; any shortfall surfaces there, not in this record.

Resolved decisions that could otherwise look open: enforced priority is **High** (draft's `Critical` claim replaced; ordering-only change, board may re-raise); the expression evaluator/limiter stays within the engine's existing allowed-expression machinery; resource-limit numeric defaults are delegated to technical governance; `POST /graph/execute` is deprecated (not deleted); catalogue versioning semantics remain outside scope. None of these blocks phase work.

## 7. Results & Artifacts

Planned artifacts per the file-by-file change plan (status: Pending until delivered by the delegated implementation children under specification `DECAF-50`):

*   `@decaf-ts/ui-decorators` — new `src/graph/document/` and `src/graph/catalog/` modules; graph index/decorators/reader/snapshot/types/constants updated to export contracts, compile decorators/workflows, enforce serializability, convert snapshots/documents, and classify `GraphWorkflowDefinition` as authoring/compatibility input.
*   `@decaf-ts/integrations/graph/shared` — built-in node manifests, declarative dynamic-port rules, frontend constructor dependence removed, no engine implementation in shared exports.
*   `@decaf-ts/integrations/graph/engine` — new catalogue, validation, and run modules; engine, executor, context, planner, plan node, registry, loops, pinning, types, errors, and exports moved to canonical documents and trusted catalogue resolution.
*   `@decaf-ts/integrations/nest/graph` — catalogue/run controllers and run persistence/service support; execution module/controller, registry factory, workflow model/service, result service, and exports updated for canonical persistence, asynchronous runs, authorized SSE, context propagation, and rejection of inline definitions.
*   `@decaf-ts/for-angular/graph` — new catalogue, document, parameter, and run modules; renderer/workflow components, node templates/modals/port fields, execution service, config store, utilities, types, save/history/autosave/mutation services, and graph page all consuming the canonical document and manifests.
*   Documentation — package READMEs and HowToUse guides for `ui-decorators`, `integrations`, and `for-angular`, plus updated graph specifications covering canonical documents, manifests, registration, frontend/backend separation, generic fields, dynamic methods, catalogue APIs, persistence, run lifecycle, replay, security, compatibility, and a custom-node example; supersession references on the affected completed specifications.

Initial record artifacts:

*   `workdocs/ai/project/specifications/DECAF_50.md` (this record).
*   Paperclip `delivery-docs` mapping for the owning domain root (authored on the `initialize` milestone child, published mechanically by the parent owner).
