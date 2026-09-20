# DECAF-50: Canonical Workflow Documents, Backend Node Catalogue, and Remote Graph Execution

**Status:** Planned
**Priority:** High
**Owner:** Graph / Platform (cross-cutting: `ui-decorators`, `integrations`, `for-angular`)

> **Approval provenance.** Product scope was approved by the Product Manager on 2026-08-31 (the verbatim user draft is the approved scope statement; 16 goals confirmed untrimmed; non-goals confirmed with two standing distinctions; enforced priority **High**, replacing the draft's `Critical` claim; the draft's 7 phases approved with per-phase acceptance gates; controlled-transition rules fixed). Technical governance / architecture was approved by the CTO on 2026-08-31 (canonical document ownership, catalogue/manifest ownership, async run envelope with named conditions, normative validation-gate ordering, parameter-schema system, deterministic adapter, verification bar, and a per-spec supersession record). The verbatim approved statements remain on their source issues; the approved deltas are summarized in the architecture sections below. Implementation is delegated by the domain-root owner under separate children, each carrying specification `DECAF-50`.
>
> **§4.24 addendum (2026-09-17).** The board rejected the gate-4 commit gate (SAA-1364, confirmation card `4f6b574e`, 2026-09-17) because the graph demo crashes on `npm run start:dev` (lazy-chunk module-eval failure of `src/environments/environment.ts` with no `window.ENV` bootstrap) and directed that e2e tests must run against live dev/production targets. This addendum adds one P0 boot-crash clause to the gate-2 test contract (§4.24, test #8); no other section is restructured.
>
> **§4.22 addendum (2026-09-17, post-gate-4 rejection).** The re-requested gate-4 commit gate (SAA-1364, confirmation card `3cfe2f66`) was rejected 2026-09-17T01:32Z with six concrete requirements on the graph demo (user's words: "visually much better, but: …"). The rejection reason — recorded verbatim on the card and the SAA-1364 thread — is the board ruling and is encoded normatively as addendum rulings **G4-R1..R6** in §4.22 (each carrying the verbatim-faithful card text, affected existing rulings/findings, fix surfaces, and provenance). G4-R3 explicitly refines D2 (refinement marker, not a contradiction); G4-R5 supersedes the G3-29/PR-H add-node decision (marker added in §4.23); §4.24 gains test rows 9–14; §4.25 gains the PR-I follow-up line. D1–D7 remain untouched.
>
> **Gate-3 specification revision (2026-09-16, board-authorized).** The board reopened the delivered graph UI with a strongly negative review and ruled on seven surfaces (rulings D1–D7, recorded verbatim-faithful on the root issue, comment `58812d2a`). Gates 1–3 (SAA-1350 doc re-evaluation; SAA-1351 test-suite review; SAA-1352 read-only demo audit @ `bd0a187`) were each confirmed by the board, culminating in confirmation card `70cbd0f8` (accepted 2026-09-16T13:32Z), which authorized exactly two sequenced gates: **(1) this specification update, (2) gate-4 implementation.** This revision bakes the D1–D7 rulings in as the authoritative rendering contract / demo-behavior section (§4.22), records the 38-finding gate-3 inventory (§4.23), adds the gate-2 test contract (§4.24), records the gate-4 implementation roadmap (§4.25), and supersedes the stale visual rows in their own records: DECAF-32 §21.3, §21.4, §21.6, §21.8.2, §21.10, §21.11 and DECAF-34 §4.1. No implementation starts before this updated record is accepted. Commit authorization for this revision is requested at a later board confirmation; record edits remain uncommitted until then.

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
- Legacy persisted workflows: conversion of previously saved legacy snapshots is lossless and read-path/compile-path based (no destructive migration job; no semantics added to the existing snapshot version fields). Any workflow the old UI saved before cutover must load, restore, and execute correctly after cutover with zero user-visible data loss. *(Superseded 2026-09-20, round-2: legacy-snapshot retro-compat is removed — see §4.26 R2-2.)*
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

**Round-2 marker (2026-09-20):** manifests are authored in/derived from the **backend** node classes and serialized to the frontend as JSON metadata only; the frontend never imports node classes (§4.26 R2-1). Parts of this section (and §4.6) that describe manifest compilation from node classes shared with the frontend are superseded by §4.26.

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

**Geometry & face precedence (D1/D7 rulings — normative, gate-3 revision):** manifest `display` metadata is the single source of node geometry and face presentation. `width`, `height`, `minWidth`, plus `shape`/corner-radius (added to the display fields by this revision) are manifest-authoritative: template CSS must never pin node dimensions (the `--node-size: 96px` template authority is removed), and an instance's `ui.size` applies **only** as an explicit user resize override — a carried default or template CSS never wins over the manifest (G3-02). Content-driven height growth (e.g. Switch case count) is expressed as manifest-declared, value-driven display rules evaluated from node parameters — never as hardcoded per-node formulas or direct DOM style writes (G3-03). Nodes are not rotatable: projection pins `rotatable: false` on every node factory alongside `resizable: false` (G3-04). Category base colours are authoritative for all nodes of a category; an explicit per-node `color`/`icon` is an override applied at one precedence point, and competing style authorities for the same kind are removed — one manifest display source per kind (G3-22/G3-23). Icons render per reference type (`catalogue` → Tabler sprite `<svg><use>`; `url`; `data:` SVG); a readable category letter silhouette is the fallback when no icon is provided (D7, §4.22).

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

**Round-2 marker (2026-09-20):** parameter definitions, visibility DSL, and method references are serialized metadata; any part of this section presupposing frontend access to node classes (e.g. class-authored methods/validators reaching the browser) is superseded by §4.26 R2-1. `loadOptionsMethod`/`validateMethod`-style references remain backend method manifests resolved server-side.

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

**Superseded (2026-09-20, round-2):** the co-located authoring helper (`defineGraphNode`) and the shared-manifest/executor split are **superseded by §4.26 R2-1** — the class defining a node, including its execute function, is backend-only; the handler mechanism that forced a node's function into two scopes is removed (simple nodes carry their own execute method), and the frontend never imports node classes.

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

**Superseded (2026-09-20, round-2):** §4.18 is **superseded by §4.26 R2-2** — the engine ships as its first version with no backward compatibility; all engine/schema versioning and retro-compat code (versioned snapshots, migration/legacy-compat paths, versioned transition rollout) is removed. Retained below for history.

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
- **DECAF-32** ([./DECAF_32.md](./DECAF_32.md)) — planner input becomes `GraphResolvedWorkflow`; synchronous `/graph/execute` deprecated in favor of the run lifecycle; the `GRAPH_WORKFLOW_BOUNDARY` sentinel is retired for documents (legacy converter handles it); event-type enums, kind taxonomy (`core.*`), store/pinning model, and the §21 visual contract are preserved and extended by manifests. **Gate-3 addition (2026-09-16):** DECAF-32 §21.3, §21.4, §21.6, §21.8.2, §21.10, and §21.11 are **superseded** by §4.22 (board reopen rulings D1–D7) — the pre-manifest visual rows that reproduce the rejected look are marked superseded in DECAF-32 itself; a gate-4 implementer must not follow them.
- **DECAF-34** ([./DECAF_34.md](./DECAF_34.md)) — kind taxonomy and referenced-spec status remain; constructor-based discovery and any client-side `applyMetadata()` requirement are superseded by catalogue manifests + declarative dynamic-port rules + backend `/resolve`; `Metadata.nodes()`/`workflows()` accessors remain valid for backend registration and compat flows but do not drive the palette; conformance proof required that Switch's dynamic ports resolve identically through declarative rules. **Gate-3 addition (2026-09-16):** DECAF-34 §4.1 (Rendering Contract, mirroring DECAF-32 §21) is **superseded** by §4.22; marked superseded in DECAF-34 itself.
- **DECAF-35** ([./DECAF_35.md](./DECAF_35.md)) — the shared/engine boundary is preserved and enforced, extended to the new catalogue/parameters/run modules; built-in manifests re-export via `graph/shared`; engine code stays out of browser bundles.
- **DECAF-36** ([./DECAF_36.md](./DECAF_36.md)) — Req-B1–B7 backend invariants carry over unchanged; history/autosave/mutation services remain and operate on documents/document-store; the `DECAF_36` NFR-4 snapshot-format reuse is superseded by canonical document round-trips (snapshot becomes `{ document, editor }`).
- **DECAF-42** ([./DECAF_42.md](./DECAF_42.md)) — subscription mode untouched; broadcast default unchanged; run events move to the run-scoped endpoint at cutover.
- **DECAF-48** ([./DECAF_48.md](./DECAF_48.md)) — the `{ runId, ownerUser }` ownership and `graph.run.*` topics precedent are extended; run-scoped transport becomes canonical; I/O inspection payloads ride run state/results rather than a parallel channel.

### 4.22 Authoritative rendering contract and demo behavior — board reopen rulings D1–D7

**Provenance (board-accepted, normative).** The board ruled on seven surfaces (rulings recorded verbatim-faithful on the root issue, comment `58812d2a`, 2026-09-16). Gate 3 (read-only demo audit @ `bd0a187`, SAA-1352 comments `4925f2e7` part 1 / `17f124f4` part 2, context-manifest rev 2) verified **every ruling violated at HEAD**, with file:line root causes and fix surfaces (findings G3-01..G3-25 in part 1; G3-26..G3-38 in part 2). This section is the **authoritative rendering contract / demo-behavior section** of this specification. It supersedes the stale visual rows in their own records: **DECAF-32 §21.3, §21.4, §21.6, §21.8.2, §21.10, §21.11 and DECAF-34 §4.1** (supersession markers added there). Gate-4 PRs implement against this section (roadmap §4.25); the visual target is the n8n node/port/connection appearance researched in gate 1 (header icon+name, always-visible input ports left / output ports right, port→port connections, node-side hover controls incl. pin, notes rendered as subtitle, "Add node" node-side connector).

#### D1 — Geometry: manifest-authoritative

**Ruling (normative).** Per-kind node geometry and shape live in the manifest `display` metadata as the single source: `width`, `height`, and shape/corner radius as manifest display fields. **Manifest metadata wins over template CSS and over `ui.size`**; an instance `ui.size` applies only as an explicit user resize. Height grows with content only through manifest-declared, value-driven rules (e.g. Switch case growth) — never hardcoded formulas or direct DOM style writes. Nodes are **not rotatable**.

Root causes at HEAD (all violated) and fix surfaces:

- **G3-01** — Template CSS overrides manifest width for every node: `graph-node-template.component.scss:31` pins `--node-size: 96px` and `width: var(--node-size)`; the html binds `[style.--node-size.px]="nodeWidthPx()"` which returns a width **only for Switch, `null` otherwise** (`graph-node-template.component.ts:274`) — every non-Switch node renders 96px wide regardless of manifest geometry (e.g. `foreach` 120×140, `code` 96×96, `ui-decorators/src/graph/nodes/loops/foreach.ts:23`). *Fix surface:* `for-angular/src/graph/components/graph-node-template/` (scss+html) — remove the fixed width; size from the projected node element/manifest.
- **G3-02** — `ui.size` precedence inverted: `nodeUiSizeOf` resolves `node.ui?.size ?? display.width ?? 96` (`GraphDiagramAdapter.ts:667`) — instance `ui.size` beats the manifest, opposite of D1, and no flag distinguishes a *user* resize from a carried default. *Fix surface:* `for-angular/src/graph/document/GraphDiagramAdapter.ts` + the §4.5 precedence text.
- **G3-03** — Switch height is a triple-hardcoded formula `140 + cases*24` in the node class (`flow-control/switch.ts:109`), the adapter (`projectedNodeHeightOf`, `GraphDiagramAdapter.ts:673`), and the template (`computeSwitchMetadataChange`, `graph-node-template.component.ts:97`), plus a direct DOM write `article.style.setProperty('height', …)` (`graph-node-template.component.ts:498`) — the per-node CSS hack the board explicitly banned; value-driven growth is authorized by no doc. *Fix surface:* all three files + §4.5 (growth becomes manifest-declared value-driven display rules).
- **G3-04** — Rotate handle renders: projection sets `resizable: false` on every node factory but never `rotatable: false` (`GraphDiagramAdapter.ts:557/578/599`); no doc mentions rotation. *Fix surface:* adapter node factories + this clause.
- Compliant carry-over: border-radius/shape is currently fixed in CSS (18px) — fold it into the D1 geometry metadata work (shape as a manifest display field).

#### D2 — Port visibility: default + connected + required

**Ruling (normative).** Port handles are **visible by default** on the node edges — inputs left, outputs right, connections bind port→port, multi-output nodes distribute ports vertically (n8n reference). The explicit visibility rule: **default ports + connected ports + required input ports are visible** (required inputs stay visible even when unconnected). This **inverts** DECAF-32 §21.6's hidden-by-default mandate. **Value-bound (literal/expression) input ports must not vanish**: they render with a value indication so the user can see and revert where the value comes from. Port labels on visible ports must be readable — the `opacity: 0` hover-only label treatment is superseded for visible ports; the precise persistent-vs-hover affordance is a PR-B implementation decision under the n8n reference (open sub-point, §6).

Root causes and fix surfaces:

- **G3-05** — Hidden-by-default persists: `visiblePorts()` (`graph-node-template.component.ts:558`) hides unconnected, non-default ports — the exact §21.6 behavior the board inverted; only `value`/`default` ports, connected ports, and selection/connecting states render. *Fix surface:* principled `visiblePorts()` rewrite.
- **G3-06** — Required-input exception not implemented: `port.required` is carried through the adapter (`GraphDiagramAdapter.ts:170`) but never consulted in `visiblePorts()`. *Fix surface:* adapter port projection + visibility rule.
- **G3-07** — Value-bound ports vanish entirely: `mode === 'value' → return false` (`graph-node-template.component.ts:571`) — a node with a literal/expression binding shows no input port at all. *Fix surface:* visibility rule + value badge rendering.
- **G3-08** — Switch case ports are exempt from the visibility model (`isSwitchCasePort → always visible`, `graph-node-template.component.ts:565`) — a special case highlighting that no principled rule exists. *Fix surface:* one principled visibility rule covering case ports.
- **G3-09** — Workflow-boundary rendering still uses synthesized 72×32 badge nodes with a single `value` handle (`GraphDiagramAdapter.ts:65-79, 534`), and workflow-output edges are explicitly dropped (`GraphDiagramAdapter.ts:614`) — not n8n trigger/result semantics; no port labels on badges. Sub-item: port labels are `opacity: 0`, hover/connected-only (`scss:289-329`). *Fix surface:* workflow-boundary re-rendering decision (badge nodes → real ports, or a ruled badge exception) owned by PR-B; visible labels under the D2 rule.

#### D3 — Double-click / hasRan: split view, CRUD never removed

**Ruling (normative).** The `hasRan` state is kept, but it **must never remove CRUD**: double-click **always** opens the CRUD form. After a node has run, the view splits into three panes — **run inputs LEFT, CRUD form CENTER, run outputs RIGHT — all populated**. The inspection panel must have an empty/failed state so a panel can never render nothing ("right now NOTHING APPEARS" — hard deliverable). Run inputs shown in the split view come from the **editable workflow-input form**, not hardcoded values. Boundary (workflow-input) nodes get double-click CRUD.

Root causes and fix surfaces:

- **G3-10** — `hasRan` takeover persists; CRUD unreachable after the first run: `openEditor()` short-circuits on `hasRan()` into `graphInspection.toggle()` (`graph-node-template.component.ts:339-342`); inspection state survives until the next run's `graphInspection.reset()` (`graph.page.ts:211`). DECAF-48 §4.6 and DECAF-32 §21.11 still authorize the takeover and are superseded here. *Fix surface:* `openEditor` split-view logic.
- **G3-11** — No split view exists, and the panes are inverted vs the ruling: the inspection panel is a 2-pane overlay — outputs pane LEFT, inputs pane RIGHT (`graph-node-inspection.component.html` body order; store doc-comment "right = inputs, left = outputs"); there is no CRUD center pane anywhere. *Fix surface:* `graph-node-inspection` three-pane rebuild.
- **G3-12** — "NOTHING APPEARS" root cause pinned in code: the panel renders `@if (payload(); as inspection)` with **no empty state** (`graph-node-inspection.component.html:1-3`); `hasRan()` returns true from run status alone (`succeeded/failed/cached`, `graph-node-template.component.ts:221-227`) while the payload exists only if `fetchRunResult` succeeded inside the bounded 5×80ms retry (`graph.page.ts:351-358`) and the run stored nodeResults — any miss toggles a panel that renders nothing (the board's exact complaint, reproduced). *Fix surface:* empty/failed state + payload lifecycle.
- **G3-13** — Run inputs are hardcoded; the editable workflow-input form is decorative: `runWorkflow()` submits `inputs = { count: 1, text: 'Hello World Foo Bar Baz' }` (`graph.page.ts:234-237`) and never reads the left-pane workflow-input form the renderer builds and validates. *Fix surface:* run-input plumbing from the workflow-input form.
- Related: boundary badge nodes have **no double-click handler at all** (gate-1 C8, persists at `boundary-node-template.component.html`) — input-value CRUD unreachable. *Fix surface:* boundary-node double-click CRUD (per §21.7's own historical promise).

#### D4 — Pin: data pinning (n8n semantics)

**Ruling (normative).** The pin button drives **data pinning**: pinning freezes the node's parameter values so downstream runs reuse them. Pin state **writes the canonical document** (a new document-carried node-instance field; survives save/load round-trips) and the button renders **only when the node/manifest is pinnable**. It is **not** engine cache pinning: `GraphPinning` (fingerprints, pin set, value store) remains an engine-internal feature; UI data pinning must not be built on it (gate-2 T8). Pin-state field shape is finalized by PR-D under the round-trip test contract (§4.24).

Root causes and fix surfaces:

- **G3-14** — Pin button is still cosmetic: `pinNode()` toggles a local `_pinned` boolean + CSS class (`graph-node-template.component.ts:551-556, 279-284`); it never writes the document, never persists, and renders unconditionally (not gated on pinnable capability/manifest). *Fix surface:* document store write + conditional render.
- **G3-15** — No data-pinning semantics exist in the UI: the only pinning machinery is engine cache-pinning (`integrations` `GraphPinning`), not wired to the button; nothing freezes parameter values for downstream runs; gate-1 D10/D11 conflation persists. *Fix surface:* `for-angular` document store + template; do **not** build on `GraphPinning`.

#### D5 — Validity: editor-projected, Run-gated

**Ruling (normative).** The editor must **project validity visibly** — canvas/document invalid state with structured issue surfacing — and **Run is blocked on an invalid graph**. The backend `POST /graph/workflows/validate` endpoint (§4.10) is the authority; the client consumes it and surfaces structured `GraphValidationIssue`s. An invalid graph must never be submittable from the toolbar.

Root causes and fix surfaces:

- **G3-16** — No editor-side validity projection at all: no `POST /graph/workflows/validate` client anywhere in `for-angular/src/graph`; no canvas invalid state; no structured issue surfacing (gate-1 H20 persists). *Fix surface:* validate client + validity store.
- **G3-17** — Run is gated on backend availability only: `[disabled]="!canRun() || isRunning()"` with `canRun = backendAvailable() !== false` (`graph.page.html`, `graph-toolbar.component.html:49`); an invalid graph submits, the backend nine-stage gate rejects it as a failed run, and the user sees only a raw `runError` string. *Fix surface:* toolbar gating on projected validity.
- **G3-18** — The only "Valid/Invalid" indicator validates the wrong thing: the right pane "Model validation" reflects the workflow-input **form** validity (`graph-renderer.component.ts:275`), not graph connectivity — actively misleading under D5. *Fix surface:* validity projection over the document/graph.

#### D6 — Log panel: on-demand bottom drawer, not entries-gated

**Ruling (normative).** The run log is a **docked bottom drawer the user can open on demand** — not an always-visible dock and **not entries-gated**: it must be openable even with zero entries, with an empty state and **run-lifecycle lines** (run created / validated / validation issues). Auto-open at run start remains an enhancement.

Root causes and fix surfaces:

- **G3-19** — Entries-gated rendering persists: the widget renders `@if (store.open() && store.entries().length)` (`graph-logs-widget.component.html:1`); a run with no `GRAPH_RUN_LOG` entries (e.g. validation-failed) shows no panel and no affordance to open it. *Fix surface:* open affordance regardless of entries.
- **G3-20** — Form factor is a floating card, not a bottom drawer: `position: absolute; left: 50%; bottom: 1rem; width: min(900px, …)` (`scss:6-10`) — a centered overlay that can cover the canvas. *Fix surface:* docked bottom drawer.
- **G3-21** — No run-lifecycle lines: the panel carries only `GRAPH_RUN_LOG` entries; created/validated/issues lines are absent, so even the auto-open (`graphRunLog.setOpen(true)` at run start, `graph.page.ts:213`) shows an empty/absent panel precisely when the user most needs feedback. *Fix surface:* run-lifecycle lines into the log store feed.

#### D7 — Node face: category colours, letter silhouettes, title-not-description, icons-from-metadata

**Ruling (normative).** The node face renders: **category-based base colours** (all nodes of a category share one base colour; an explicit per-node `color` is an override applied at one precedence point), a **readable category letter silhouette** when no icon is available (e.g. "FE" for for-each — not the title's first character), **replaceable by an icon when metadata provides one** (per reference type: `catalogue` → Tabler sprite via `<svg><use>`; `url`; `data:` SVG), and the **title** — not the description. One manifest display source per kind; competing style registries are removed.

Root causes and fix surfaces:

- **G3-22** — Category colors are not authoritative; same-category nodes differ: the template uses per-node `data.color` = manifest `display.color`, and `resolveEffectiveColor` lets explicit color override the category registry (`ui-decorators/src/graph/constants.ts:333`); Flow Control renders **five** colors (switch `#f97316`, if `#f59e0b`, parallel `#06b6d4`, error-boundary `#ef4444`, human-approval `#d946ef`), Loop three (`#eab308/#0891b2/#db2777`). *Fix surface:* category base color wins; per-node color becomes an explicit override.
- **G3-23** — Two competing manifest sources for the same kinds: hand-authored `ui-decorators/src/graph/nodes/manifests.ts` declares Foreach/While/Until as "Flow Control" `#8b5cf6` + `ti-repeat`, while the decorated classes the fixtures actually compile from (`loops/foreach.ts` etc.) declare category "Loop" with different colors — a stale second authority. *Fix surface:* single manifest display authority per kind; remove the stale source.
- **G3-24** — Letter badge is title-initial, not a category silhouette: `iconFallback = title.charAt(0)` (`graph-node-template.component.ts:269-272`) — "Split text" → "S", not the ruled silhouette ("FE"). *Fix surface:* category letter silhouette.
- **G3-25** — Icon rendering path broken for every reference type: `legacyIconNameOf` returns the catalogue icon **name** (`GraphDiagramAdapter.ts:104-108`) and the template applies it as a CSS class (`[class]="node().data.icon"`) — but `ti-*` names are Tabler **sprite symbol ids** (rendered via `<svg><use>` elsewhere), so icons render as nothing on canvas; `url`/`data:` types are dropped entirely. *Fix surface:* per-reference-type icon rendering.
- Compliant: the node title is rendered and the description is not — matches D7's title-not-description.

**Gate-4 rejection addendum (2026-09-17) — rulings G4-R1..R6 (normative).**

**Provenance.** The re-requested gate-4 commit gate — SAA-1364 confirmation card `3cfe2f66` ("Commit gate (re-request): approve the DECAF-50 gate-4 commit set") — was **rejected by the board/user on 2026-09-17T01:32Z** with six concrete requirements on the graph demo, introduced by the user's words: "visually much better, but: …". The rejection reason is recorded verbatim in the card result and on the SAA-1364 thread; it is the board ruling and is encoded below normatively with provisional ids **G4-R1..R6**. Each ruling carries the verbatim-faithful card text, the existing rulings/findings it affects, and its fix surfaces. D1–D7 are untouched by this addendum except the explicit **D2-refinement marker in G4-R3** (a refinement, not a contradiction). G4-R5 **supersedes** the G3-29/PR-H add-node decision (supersession marker added in §4.23).

#### G4-R1 — Code node: prefilled split code, no code input port, array-split output

**Card text (verbatim-faithful).** "code node: it should come prefilled with the code to perform the split as instructed (eg there should ne [no] code inport port visible because the property is already filled out - the resulting output of that code node MUST be an [i.e. be] the 'text' input from the data input port, split into an array where each element contain x = 'count' input lines of the 'text'". (Bracketed glosses added; all other spelling/grammar preserved from the card.)

**Ruling (normative).** The code node ships **prefilled with the split code** as part of the backend-serialized workflow. Because the `code` property is already filled, its own **code input port is not rendered/connectable** (the G4-R3 rule applies). The code node's **output is the `text` input received on its data input port, split into an array in which each element contains `x = count` lines of `text`** — the split semantics are fixed by the prefilled code, not authored on the canvas.

**Affected existing rulings/findings.** D2 value-bound-port treatment via G4-R3 (G3-07 fix surface); the demo default workflow's canned inputs (G3-13/G3-32 fix surface — the default workflow must carry the prefilled code through the serialized document, §4.4/§4.10); PR-C run-data plumbing.

**Fix surfaces.** Backend-serialized default workflow (prefilled `code` property); code-node manifest/parameter prefill; port projection under the G4-R3 rule; split-code semantics in the demo default workflow.

#### G4-R2 — foreach addNode: insert into the existing single connection loop; default workflow starts with a Log node inside the loop

**Card text (verbatim-faithful).** "for-each: - the 'addNode', shoul add a node, behind it, in the same 'connection loop' for each already has. there can be no multiple loops on a single foreach. it's also meant, for this default workflow, to start with a log node inside its loog [loop] (so it logs every element of the array resulting from the code node;". (Bracketed gloss added.)

**Ruling (normative).** The foreach's `addNode` action inserts the new node **behind the current node, inside the foreach's existing single connection loop**. A foreach can never have **multiple loops** — loop creation is not an addNode outcome. For the **default workflow**, the loop **starts with a Log node inside it**, so every element of the array produced by the code node is logged.

**Affected existing rulings/findings.** The demo default workflow (G3-13/G3-32); the node-interaction surfaces in §4.22 (addNode is the same interaction family G4-R5 re-ruled); PR-B/PR-H canvas interaction work. **Partially superseded (2026-09-20, round-2):** the insertion/visibility mechanics are re-ruled by §4.26 R2-3(3) — the for-each 'add node' ghost is the insertion anchor (insert between for-each and the ghost; ghost hover-visible only when the loop already holds a real node). The single-loop rule and the default Log node inside the loop stand.

**Fix surfaces.** foreach `addNode` handler (insert-into-existing-loop semantics; forbid loop duplication); demo default workflow seed (Log node inside the foreach loop, wired to the code node's array output).

#### G4-R3 — Fundamental node/port/ui-input rule: unchecked input = user-provided value, port not rendered; checked checkbox reveals the port — **refines D2**

**Card text (verbatim-faithful).** "- when double clicking i notice that the inputs, are not checked (meaning they expect the user to provide a value) when that is the case the portrs ar not meant to be rendered (or connectable) (the check box they contain, when chcked, disabled when user's direct intriduction of data, reveals the input port and expects a connection to be made there to provide it's value. this is a fundamental node/port/ui-input rule. All of this must come pre-filled, from the abckend (it's part of the serialized workflow);". (Spelling/grammar preserved from the card.)

**Ruling (normative).** A **fundamental node/port/ui-input rule**:

1. An input whose checkbox is **unchecked** expects a **directly user-provided value**; its **input port must NOT render and must not be connectable**.
2. The input's **checkbox**, when **checked** (and disabled once the user introduces data directly), **reveals the input port**, which then **expects a connection** to provide the value.
3. All of this state is **prefilled from the backend** — it is part of the serialized workflow (§4.4/§4.10 round-trip).

**Refines D2 — refinement marker, not a contradiction.** D2's default + connected + required visibility rule and its requirement that value-bound input ports never vanish *silently* (they carry a value indication, G3-07 fix) remain in force. G4-R3 adds the **checkbox/port coupling** that decides between the two D2 value surfaces: a directly user-provided value shows the value indication with **no connectable port**; a checked input shows the **port** and expects a connection. The "vanish" prohibition in D2 is satisfied by the visible checkbox/value indication, not by a port handle. The PR-B `visiblePorts()` rewrite (G3-05..G3-09) and the stale-assertion rewrites T1/T7 implement this refined rule.

**Fix surfaces.** `visiblePorts()` rewrite (G3-05/G3-06/G3-07 fix surfaces) extended with the checkbox coupling; node-face checkbox rendering (checked, disabled on direct data introduction); backend serialization of the checked/value state (part of the serialized workflow, save/load round-trip).

#### G4-R4 — Results output node: draggable like any other node, keeps its input connection

**Card text (verbatim-faithful).** "- the results output node doesnt seem to be moveable, and loses the connection to it's input port (should be draggable like any other node);". (Spelling preserved from the card.)

**Ruling (normative).** The results output node is **draggable like any other node**, and dragging it **keeps its input connection** — the connection must survive the move.

**Affected existing rulings/findings.** The workflow-boundary re-rendering decision (G3-09, PR-B) — the results node is the boundary node class this ruling constrains; D2 port/connection semantics.

**Fix surfaces.** Workflow-boundary/results node rendering and drag behavior (G3-09 fix surface); connection retention across node moves.

#### G4-R5 — Add-node interaction: drag-from-output-to-empty-canvas opens the add-node popup with pre-connected insertion — **supersedes the G3-29/PR-H decision**

**Card text (verbatim-faithful).** "- the + button you added to nodes on highligh is wrong, remove it. what is expected is that when you start a connection from an ouput and mouse up over empty canvas, you get the same popp as add node, and by selecting a node it must appear already connected (the connection the user moused up on empty canvas into the first available input port that node has.". (Spelling preserved from the card.)

**Ruling (normative).** The **"+" button added to nodes on highlight is wrong and is removed**. The expected interaction: when the user **starts a connection from an output port and releases the mouse over empty canvas**, the **same popup as add node** opens; selecting a node there inserts it **already connected** — into the **first available input port** of the selected node, via the connection the user was dragging. **This ruling supersedes the G3-29/PR-H add-node decision** (§4.23, supersession marker added there): the node-highlight "+" connector is not the deliverable.

**Affected existing rulings/findings.** Supersedes **G3-29** and its PR-H "add-node connector decision" scope; interacts with G3-38 (node-bounds hover action zone — the "+" is removed from it); D2 port semantics (first available input port).

**Fix surfaces.** Remove the highlight "+" button; connection-drag → empty-canvas release → add-node popup; pre-connected insertion into the first available input port; palette/popup reuse (G4-R6 search field lives in the same list).

#### G4-R6 — Node add list gains a search field

**Card text (verbatim-faithful).** "- the node add list must have a search file [field] i can type and filter the nodes accordingly". (Bracketed gloss added.)

**Ruling (normative).** The node add list (the add-node popup/palette list) gains a **search field**: typing filters the nodes accordingly.

**Affected existing rulings/findings.** G3-26..G3-28 (palette & catalogue surfaces, PR-H) — the same list surface.

**Fix surfaces.** Add-node popup / palette list: search input filtering node entries (case-insensitive over title/kind, per the catalogue §4.13).

### 4.23 Gate-3 finding inventory (G3-01..G3-38)

The gate-3 demo audit produced 38 findings (SAA-1352 part 1 = G3-01..G3-25, folded into §4.22's per-ruling root-cause/fix-surface tables; part 2 = G3-26..G3-38, beyond D1–D7, tabled below). The beyond-D1–D7 findings are board-accepted (`70cbd0f8`) and are in scope for gate-4.

**Gate-1 → gate-3 finding cross-reference** (gate-1 doc-level root causes, SAA-1350 comment `e539e0e1`): A1–A3 geometry → G3-01..G3-03 (I21 rotate → G3-04); B4–B6 ports/boundaries → G3-05..G3-09; C7–C9 double-click/hasRan/boundary CRUD → G3-10..G3-13; D10–D11 pin conflation/cosmetic pin → G3-14..G3-15; E12–E14 icons/labels/style sources → G3-22..G3-25; F15 (palette failure surface) → G3-26..G3-28; G17–G19 run results/log panel → G3-33, G3-21, G3-19; H20 (editor validity) → G3-16..G3-18; I21 → G3-04; J22 (boot script) → G3-30..G3-31; K23–K25 (events/package placement) → K23 is tested (global-stream 404 + run-scoped SSE covered); K24 (ownership resolution vs the for-nest events/auth rework) is a **gate-4 re-verification item** (§4.25); K25 (stale package placement in design-spec/handbook/DECAF-34 §4) is a gate-4 documentation item; L26 (§21 pre-manifest rows) → the supersession list above.

**Beyond D1–D7 (G3-26..G3-38):**

| ID | Area | Finding | Root cause (file:line) | Fix surface | PR |
|:---|:---|:---|:---|:---|:---|
| G3-26 | Palette & catalogue | Catalogue failure surface invisible: palette silently empty on fixture-compile or `refresh()` failure; no empty-state, error, or status line | `GraphNodeCatalogStore.ts:81-115` tracks a status signal no UI renders; `graph-renderer.component.html:37-60` lists `paletteEntries()` with no states (gate-1 F15 persists) | Render catalogue status/errors/empty-state | PR-H |
| G3-27 | Palette & catalogue | Composite source swallows backend errors indiscriminately: "backend down" vs "backend up but malformed response" indistinguishable to user and status signal | `GraphNodeCatalogCompositeSource.fetchManifests()` catches any live-source error, falls back to fixtures-only (`GraphNodeCatalogCompositeSource.ts:29-37`) | Distinguish failure classes in status + UI | PR-H |
| G3-28 | Palette & catalogue | Backend-down degrades CRUD forms silently: dynamic parameter options silently vanish from the edit modal | `invokeMethod` backend-only; modal takes `parameterDefs` from `catalog.get(kind)` (`graph-node-template.component.ts:385`) | Degraded-mode feedback in the modal | PR-H |
| G3-29 | Palette & catalogue | "+ Add node" is a corner popup, not the n8n node-side edge connector | Palette interaction model deviation (quality bar) | **Superseded by G4-R5 (§4.22 addendum, 2026-09-17).** The PR-H "add-node connector decision" is replaced: the node-highlight "+" button is removed; drag-from-output-to-empty-canvas opens the add-node popup with pre-connected insertion | PR-I |
| G3-30 | Demo/package boundary | Boot script is cross-package AND the dependency is undeclared: a standalone install cannot boot the backend at all | `start:backend: node ../integrations/lib/cjs/nest/graph/main.cjs` (`for-angular/package.json:7`); `@decaf-ts/integrations` in neither dependencies nor peerDependencies | Boot from for-angular's own node_modules; declare the dependency | PR-G |
| G3-31 | Demo/package boundary | Playwright `webServer` still commented out — E2E has no managed server (gate-2 infra risk, confirmed); the G3-30 fix **must** be paired or E2E breaks | `playwright.config.ts:98-104` | Managed server fixture or re-enabled `webServer` | PR-G (paired) |
| G3-32 | Demo/package boundary | Demo run inputs fixed in code: "template workflow usable out of the box" holds only for the canned inputs | Same root as G3-13 (`graph.page.ts:234-237`) | Workflow-input form as run-input source | PR-C |
| G3-33 | Run results & observation | "Pending run result" forever: output cards render "pending run result" indefinitely on fetch miss; no retry affordance; no structured validation-issues display (gate-1 G18 persists) | `fetchRunResult` retried 5×80ms after terminal event (`graph.page.ts:351-358`); `lastResult` stays null (`graph-renderer.component.ts:583`) | Result-fetch hardening + retry + structured issue surfacing | PR-C |
| G3-34 | Run results & observation | No cancel affordance and no stuck-run timeout: nothing in the UI can cancel a run; Start shows "…" indefinitely if the terminal event never arrives | Toolbar has undo/redo/autosave/save/start only; `isRunning` cleared only by a terminal fold; `workflow.cancelled` handled reactively (`graph.page.ts:340`) | Run-cancel affordance (+ stuck-run timeout policy) | PR-H |
| G3-35 | Run results & observation | Document round-trip drift surfaces as a raw hash string — developer-grade error text in the demo UI | `graph.page.ts:363-369` | Human-readable drift message | PR-H |
| G3-36 | Quality bar | Developer snapshot textarea (Save/Load raw JSON) exposed in the demo right pane — not n8n-like | `graph-renderer.component.html` | Behind a dev flag | PR-H |
| G3-37 | Quality bar | "Duplicate value node" button under every input field — legacy affordance with no n8n analogue | Renderer form | Remove/replace | PR-H |
| G3-38 | Quality bar | Negative-margin hover action buttons overflow the node bounds — with the fixed 96px face, delete/pin can sit outside the rendered node and off the ng-diagram hit area | `top/right: -0.4rem` (`scss:171-175`) | Action-zone placement within the node face | PR-H |

### 4.24 Gate-2 test contract (definition-of-done)

**Provenance.** Gate 2 (test-suite review, SAA-1351 comment `11323391`) mapped current coverage against D1–D7: the suites are strong on the data/document/execution spine and weak-to-absent on exactly the ruled surfaces; several Playwright suites **assert the stale DECAF-32 §21 contracts as features**; no test anywhere asserts node dimensions, so the board's #1 complaint (everything renders 96px) was CI-invisible.

**P0 tests-to-add — each ships with the PR that fulfills its ruling (definition-of-done):**

| # | Ruling | P0 test contract | Ships with |
|:---|:---|:---|:---|
| 1 | D1 | Unit tests for `nodeUiSizeOf`/`projectedNodeHeightOf` manifest-authoritative precedence (manifest display wins; `ui.size` explicit override only); E2E asserting **rendered** node dimensions match manifest metadata — computed dimensions, not CSS variables (a CSS-variable assertion passes while the 96px template override persists); value-driven height growth | PR-A |
| 2 | D2 | Default + connected ports always visible; required-input ports visible even when unconnected; multi-output vertical distribution; port→port connection binding; workflow-boundary rendering decision applied | PR-B |
| 3 | D3 | Double-click always opens CRUD (even after a run — regression pin for the takeover); ran node shows run inputs left / CRUD center / run outputs right, **all three populated** — the "NOTHING APPEARS" regression pin, the single most important new E2E; boundary double-click CRUD | PR-C |
| 4 | D4 | Pin writes the document; survives save/load; freezes parameter values for downstream runs (a pinned node's downstream run uses frozen values); pin affordance only when pinnable | PR-D |
| 5 | D5 | Editor-side validity projection; `POST /graph/workflows/validate` client contract; canvas invalid state; Run button disabled/blocked on invalid graph with issues surfaced | PR-E |
| 6 | D6 | Bottom drawer opens on demand regardless of entries; empty state + run-lifecycle lines (created/validated/issues) asserted; the implicit `entries().length` coupling removed from template and tests | PR-F |
| 7 | D7 | Category base color from manifest; letter badge ("FE") when no icon; title rendered; description **not** rendered; icon rendering per reference type (catalogue/url/data) | PR-A |
| 8 | — (boot-crash regression; 2026-09-17 addendum, SAA-1364 commit-gate rejection) | A Playwright e2e test must boot the UI the way `npm run start:dev` does — real dev server, **no** `window.ENV` bootstrap — navigate to the graph route, and assert no uncaught boot errors and that the graph surface renders. Purpose: make the lazy-chunk boot-crash class (module-eval failures under missing runtime env, e.g. `src/environments/environment.ts`) CI-visible against live dev targets. Dev-chrome gating derivation (corrected): `GRAPH_DEV_MODE` derives from Angular's `isDevMode()`; the graph route does not import `src/environments/environment` for it | PR-G |
| 9 | G4-R1 (2026-09-17 rejection addendum, card `3cfe2f66`) | Prefilled code node: ships with the split code from the serialized workflow; its `code` input port is **not** rendered/connectable because the property is prefilled; output = the `text` input split into an array with `count` lines per element — asserted on the demo default workflow | PR-I |
| 10 | G4-R2 (2026-09-17 rejection addendum, card `3cfe2f66`) | foreach `addNode` inserts into the foreach's **existing single connection loop** (no multiple loops per foreach); the default workflow starts with a **Log node inside the loop** logging every array element from the code node | PR-I |
| 11 | G4-R3 (2026-09-17 rejection addendum, card `3cfe2f66`) | Port-checked rule: unchecked input → user-provided value, port not rendered/connectable; checked checkbox (disabled when data introduced directly) → port revealed and connectable; the checked/value state is backend-prefilled and survives a **save/load round-trip** | PR-I |
| 12 | G4-R4 (2026-09-17 rejection addendum, card `3cfe2f66`) | Results output node is **draggable like any other node** and **keeps its input connection** across the drag | PR-I |
| 13 | G4-R5 (2026-09-17 rejection addendum, card `3cfe2f66`) | Drag-from-output-to-empty-canvas opens the add-node popup; the selected node is inserted **already connected** into its first available input port; the node-highlight **"+" button is absent** (regression pin) | PR-I |
| 14 | G4-R6 (2026-09-17 rejection addendum, card `3cfe2f66`) | Node add list **search field** filters nodes as the user types | PR-I |

**Stale assertion groups to change in the same change-set that flips behavior (T1–T8, never in a follow-up):**

| # | Test(s) | Stale contract encoded | Change under |
|:---|:---|:---|:---|
| T1 | `node-{split-code,foreach,log,until,while}.spec.ts` — 7× "output port is hidden" | DECAF-32 §21.6 hidden-by-default | D2 / PR-B: invert to visible-port assertions + required-exception cases |
| T2 | `graph-run.spec.ts` "opens the node I/O inspection panel for a completed node" | §21.11 / DECAF-48 §4.6 hasRan takeover | D3 / PR-C: rewrite to split view + the "NOTHING APPEARS" population pin |
| T3 | `node-*.spec.ts` "double-click opens the node edit modal" (member nodes only) | boundary double-click CRUD untested (gate-1 C8) | D3 / PR-C: keep member assertions; add boundary-node CRUD (born red is correct) |
| T4 | `base-node.spec.ts` "pinning a node toggles the pinned class" | cosmetic `_pinned` + CSS (gate-1 D10) | D4 / PR-D: rewrite to document-write, save/load survival, value freeze; CSS class becomes incidental |
| T5 | `node-*.spec.ts` per-category hex assertions; `GraphBuiltInRegistrations.test.ts` "§21.8.2 registry conformance" | style authority = §21.8 registry (gate-1 E14) | D7+D1 / PR-A: re-anchor to manifest display as source (category base colors still required — the requirement survives, the authority moves); add letter badge, title shown, description not shown, icon-from-metadata |
| T6 | `edges.spec.ts` "exactly 6 edges are rendered (3 workflow-output edges are dropped)" | workflow-boundary endpoints as synthesized badge nodes (gate-1 B6) | D2 / PR-B: expectations re-derived after the boundary re-rendering decision, not patched |
| T7 | `base-node.spec.ts` port-id / connected-class assertions | visibility model implicit | D2 / PR-B: keep ids/connected-class checks; add default-visibility and required-visibility assertions |
| T8 | `GraphPinning.test.ts` (integrations) | engine **cache** pinning | D4 / PR-D: suite remains valid for the engine feature, labeled engine-cache-scoped; **not** the UI pin-button contract; new data-pinning suite required |

**Infra pairing (mandatory):** the boot-script fix (G3-30) **must ship with a managed server fixture or Playwright `webServer`** — the `webServer` block is currently commented out (`playwright.config.ts:98-104`) and E2E boots the backend cross-boundary via the undeclared `../integrations` path; PR-G must land with or before any E2E-relevant PR above. Additional infra requirements from gate 2: geometry assertions check **computed** dimensions; `GraphInspectionStore` run-state reset between D3 scenarios (avoids order-dependent flakes); palette tests assert catalogue status first (fixture compile errors silently empty the palette); component-level tests for node template/IO viewer/switch modal need Angular jest harness setup in `for-angular` (budget for harness work); `bundle-wall.spec.ts` is an active tripwire — new split-view components must not import backend/engine symbols.

**Acceptance spine:** keep the 12-step `canvas-run.spec.ts` E2E (§4.19) as the acceptance spine and extend it with pin (step 3.5), validity projection (pre-run gate), and split-view inspection (post-run) assertions.

### 4.25 Gate-4 implementation roadmap (PR-A..PR-H)

**Provenance.** The recommended order of work is from the gate-3 audit (SAA-1352 part 2), board-accepted via confirmation card `70cbd0f8` (2026-09-16T13:32Z). Each PR ships its gate-2 P0 tests (§4.24) and supersedes its stale DECAF-32 §21 rows in the same change-set; stale test assertions T1–T7 change in the same change-set that flips behavior. Priorities reflect board pain × blast radius.

| PR | Scope | Fixes | Ships P0 tests | Supersedes (same change-set) |
|:---|:---|:---|:---|:---|
| PR-A | Rendering contract: geometry + node face (D1, D7). Single restyle: remove template CSS geometry authority; manifest display authoritative with `ui.size` as explicit user override only; kill the Switch triple-hardcode + DOM style write; add `rotatable:false`; category-color resolution; category letter silhouettes; working icon rendering per reference type | G3-01..04, G3-22..25 | #1, #7 | DECAF-32 §21.3, §21.4 (geometry/face rows) |
| PR-B | Port visibility & boundary (D2). Principled visibility rule; value-bound ports render with a value badge; visible port labels; workflow-boundary re-rendering decision applied | G3-05..09 | #2 | DECAF-32 §21.6 |
| PR-C | D3 split view + run-data plumbing. Double-click always opens CRUD; three-pane split (inputs LEFT / CRUD CENTER / outputs RIGHT); inspection empty-state eliminated; run inputs from the workflow-input form; result-fetch hardening with retry + structured issue surfacing | G3-10..13, G3-33 | #3 | DECAF-32 §21.10 (double-click row), §21.11 |
| PR-D | D4 data pinning. Pin writes the document, persists through save/load, freezes parameter values for downstream runs, renders only when pinnable; not built on engine `GraphPinning` | G3-14..15 | #4 | — |
| PR-E | D5 validity. Validate client (`POST /graph/workflows/validate`), canvas/document validity projection, Run gating + structured issues surfaced | G3-16..18 | #5 | — |
| PR-F | D6 log drawer. Docked bottom drawer, user-openable regardless of entries, run-lifecycle lines; auto-open on run kept as enhancement | G3-19..21 | #6 | — |
| PR-G | Demo/package boundary. Boot the backend from for-angular's own node_modules (declare `@decaf-ts/integrations`), paired with a managed Playwright `webServer` fixture | G3-30..31 | infra pairing (§4.24) | — |
| PR-H | Palette failure surface + polish. Render catalogue status/errors; distinguish backend-down vs malformed; add-node connector decision (G3-29) under the n8n-look ruling; G3-34..38 cleanups | G3-26..29, G3-34..38 | P1 #8 (composite source tests) | — |

**Dependency notes (from the audit):** PR-A/PR-B are the visual foundation and precede the E2E assertion rewrites; PR-C depends on PR-B's boundary decisions only where run inputs render; **PR-G must precede any Playwright run in CI** and land with or before any E2E-relevant PR. Backend work is limited to catalogue/validate endpoints already specified (§4.10, §4.13); the heavy lift is `for-angular` frontend.

**Post-gate-4 rejection feedback (2026-09-17).** The re-requested commit gate (SAA-1364, confirmation card `3cfe2f66`) was rejected 2026-09-17T01:32Z with six concrete demo requirements, encoded normatively as **G4-R1..R6** (§4.22 addendum). A follow-up **PR-I — post-gate-4 rejection feedback** owns their implementation and ships §4.24 test rows 9–14: prefilled code node with array-split output (G4-R1); foreach single-loop insertion + default Log node inside the loop (G4-R2); the port/checkbox rule incl. save/load round-trip (G4-R3, refining D2); results-node drag retention (G4-R4); drag-to-canvas pre-connected insertion replacing the node-highlight "+" button (G4-R5, superseding the G3-29/PR-H decision); and palette search (G4-R6). **Ordering is free** relative to PR-A..PR-H: PR-I may land after PR-H or be absorbed into whichever remaining gate-4 PR touches the same surfaces (PR-B for port/checkbox projection, PR-H for palette/popup work).

**Gate-4 verification items carried from gate 1:** K24 — re-verify ownership resolution (`graphWorkflowOwnerOf`, `assertGraphResourceOwnership`, standalone `auth:"optional"` + `allowAnonymousAccess` profile) against the current for-nest events/auth rework (DECAF-809 `EventsSubscriptionController`/`ObserverSubscriptionRegistry`, `request/contextualize.ts`, `DecafErrorFilter` auth-action logging), since §4.16 predates it. K25 — re-check stale package placement in `workdocs/ai/project/technical-docs/design-specification/08-graph-design.md` §3/§8 (references the no-longer-existing `@decaf-ts/integrations/graph/shared` module), architecture-handbook 08 §3.10, DECAF-34 §4, and the bundle-wall forbidden-specifier list, updating them in the same change-sets. Gate-4 starts only after the board confirms this specification update lands and is accepted.

### 4.26 Round-2 close-out addendum — backend-only node classes, versioning removal, UX/functional fixes

**Provenance (board-accepted, normative).** After gate-4 (G4-R1..R6, §4.22) was accepted, the board issued the round-2 close-out change list (context manifest rev 1 `57a249ba` on SAA-1628, 2026-09-20; dispatched for record update via SAA-1629). Every point below is normative — an acceptance criterion, with no reinterpretation or softening. This addendum supersedes exactly the sections listed in the supersession table at the end; everything it does not touch — especially the graphical rendering contract (D1–D7, §4.22) — stays as ruled. The DECAF-35 frontend/backend package boundary (`for-angular` never depends on `integrations`) is preserved throughout.

#### R2-1 — Backend-only node classes; metadata-only frontend contract (supersedes parts of §4.5–§4.7)

**Ruling (normative).** The class defining a node — **including its execute function** — is defined **only in the backend** and is **never available to the frontend**. There is exactly **one authoritative backend class per node kind**; the handler mechanism that forced a node's function to be authored in two scopes (frontend class + backend executor/handler) is **removed**. Simple nodes carry their own `execute` method directly — **no handlers**. Inheritance between node classes becomes cleaner and is backend-internal only.

**Metadata-only frontend contract (normative).** The frontend receives **only workflow metadata** — all nodes' graphical metadata plus property values — and MUST be able to render nodes, ports, and connections without any knowledge of the defining class:

- Node catalogue (`GET /graph/node-types`, `GET /graph/node-types/{kind}`, `POST /graph/node-types/{kind}/resolve` — §4.13) SHALL return serializable manifests covering **all** node kinds: display/geometry/face metadata (§4.5), ports and connection policies, parameter definitions and the visibility DSL (§4.6), dynamic-port rules, credential requirements, and capability flags (incl. pinnable). No classes, constructors, functions, module paths, or execute code SHALL cross the wire.
- Workflow load (§4.10) SHALL return the `GraphWorkflowDocument` carrying, for every node instance: kind; parameters and input/output bindings (property values); port checked/value state (G4-R3); pin state (D4); and UI position/size. This is the complete render/interact surface; it is metadata only.
- The UI SHALL create nodes as `GraphNodeInstance`s from manifest metadata and generic templates; it MUST NOT import, extend, or instantiate node classes. Adding a node is metadata in, document mutation out (§4.12).
- Metadata contract *types* (manifest/parameter/document interfaces) remain shared in `ui-decorators` per DECAF-35; node *classes* live in the backend engine only.

**Supersessions.** The co-located-authoring compromise in §4.7 (`defineGraphNode`; "the shared manifest remains separately exportable") is **superseded**: manifests are authored in/derived from the backend node classes and serialized; nothing node-class-shaped is exported to the frontend. Conflicting parts of §4.5 (manifest compilation from classes shared with the frontend) and §4.6 (parameter/method machinery presupposing frontend access to node classes) are superseded to the same effect; `loadOptionsMethod`/`validateMethod`-style references remain as backend method manifests resolved server-side (§4.6), never as frontend-reachable class members.

#### R2-2 — Engine versioning removed; first version, no retro-compat (supersedes §4.18)

**Ruling (normative).** All `GraphEngine`/schema versioning and retro-compat code is **removed**: the engine ships as its **first version** with **no backward compatibility**. There SHALL be no engine/schema version fields, no snapshot-version constants (`GRAPH_WORKFLOW_SNAPSHOT_VERSION`), and no version-driven migration or legacy-snapshot compat paths in `ui-decorators`, `integrations`, or their `for-angular` consumers. §4.18 (Compatibility and transition) — including its legacy-snapshot lossless-conversion mandate and versioned transition rollout — is superseded.

- The canonical document is the only persisted/executed form; documents carrying definitions/functions remain rejected at the boundary (§4.8/§4.10).
- The decorated-class authoring compiler (§4.4) remains an **authoring input** convenience — it is not engine retro-compat and not version-dependent.
- **Not engine/schema versioning (remains):** pure UI document-mutation counters such as `GraphWorkflowDocumentStore.versionSignal` are document-store change signals for undo/autosave bookkeeping, not engine or schema versioning, and stay.

#### R2-3 — UX/functional fix list (board items 3–8)

**Ruling (normative).** Each item is an acceptance criterion:

1. **Node top-right panel placement** — the x + pin action panel moves up and right so the **center of the 'X' sits at the node's notional un-rounded corner** (the corner the node would have if it were not rounded).
2. **Agent node geometry** — agent nodes SHALL be **wider than high** (manifest display geometry under D1 precedence).
3. **For-each 'add node' ghost insertion** — clicking the ghost and selecting a node SHALL insert the new node **between the for-each and the ghost** (`for-each → <added> → 'add node' → back to for-each`), never as a parallel loop. When the loop already holds a real node (other than the ghost), the ghost is visible **only while hovering** the for-each loop. **Partially supersedes G4-R2** (§4.22): the single-loop rule and the default Log node inside the loop stand; the ghost is the insertion anchor and governs visibility/insertion semantics.
4. **IDE-like code input fields** — code parameters (e.g. the code node) render as IDE-like fields: **multiline, resizable, syntax highlighting, error highlighting** — not a simple single-line input.
5. **Add-node popup dismissal** — clicking **outside** the add-node popup closes it.
6. **`logResults` correctness** — the `logResults` node SHALL log the **correct output of the workflow given its position** (what is actually produced at its position in the graph), not a stale or hardcoded payload.
7. **Workflow-outputs column** — the 'Workflow outputs' column SHALL show the **post-run outcome** of the workflow after a run.
8. **Loose-node validation** — a loose node (connected to nothing) plus start SHALL **fail workflow validation**; the same loose-node rule SHALL fail on **save**. Failures surface per D5 (structured issues; Run blocked).
9. **Way back to edit mode** — after start (fading), there SHALL be a way back to the **edit (unfaded) mode**.
10. **Faded = executed, not disabled** — faded means executed: double-clicking a faded node shows its **inputs (left) and outputs (right)** (D3 split view), and the **x/pin buttons remain usable** in faded mode.
11. **Everything else — especially graphical — stays the same** as ruled in §4.22 (D1–D7, G4-R1..R6) and the rest of this specification.

#### R2-4 — Effect on D1–D7 and G4-R1..R6

**Ruling (normative).** D1–D7 (card `b142356b`) and G4-R1..R6 remain in force except as superseded here:

- **G4-R2** — partially superseded by R2-3(3) (ghost insertion/visibility semantics; single-loop rule and default Log node preserved).
- **D1** — stands; value-driven display rules are manifest-declared metadata evaluated from node parameters, so D1 requires no frontend node-class knowledge. Where a D1/G3 fix surface referenced node classes under `ui-decorators/src/graph/nodes/**`, the referenced classes now live backend-only under R2-1.
- **D3** — stands; R2-3(9)/(10) add the unfaded-mode return path and confirm the faded double-click split view with usable x/pin.
- **D4** — stands; pin state stays a document-carried field (metadata only, R2-1-compatible).
- No other D-ruling presupposes frontend node-class knowledge; fix surfaces that did are re-pointed to backend classes + serialized metadata under R2-1.

**Supersession table (round-2).**

| Old section | Status | New ruling |
|:---|:---|:---|
| §4.7 (co-located authoring helper; shared manifest separately exportable) | **Superseded** | R2-1: backend-only node classes; manifests serialized from the backend |
| §4.5 / §4.6 (parts referencing node classes shared with, or reachable from, the frontend) | **Partially superseded** | R2-1 metadata-only contract; §4.13 API rules unchanged |
| §4.18 (Compatibility and transition) | **Superseded** | R2-2: first engine version, no retro-compat; no versioned snapshot/migration/legacy-compat paths |
| §4.20 P5/P7 gate text (legacy persisted-snapshot conversion; feature-flag transition mechanics) | **Superseded** | R2-2 |
| §4.22 G4-R2 | **Partially superseded** | R2-3(3): ghost insertion between for-each and ghost; hover-only ghost; single-loop rule + default Log node stand |
| D1–D7, G4-R1, G4-R3..R6 | **In force** | R2-4 (fix surfaces re-pointed only) |

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

**Gate-4 execution note (2026-09-16):** the board-authorized gate-4 implementation (delegated to the CTO after this record update is accepted) executes via the PR-A..PR-H roadmap in §4.25 within the P1–P7 phase structure above; each PR carries specification `DECAF-50` and ships its gate-2 P0 tests (§4.24) plus its DECAF-32 §21 supersession rows in the same change-set.

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
13. **Gate-3 open sub-points (not contradictions; decision owners named):** (a) port-label affordance for visible ports — persistent vs hover under the n8n reference (D2 sub-point from gate-1 B5) — decided by PR-B; (b) workflow-boundary rendering — real ports vs a ruled badge exception — decided by PR-B; (c) add-node interaction model — corner popup vs n8n node-side connector (G3-29) — decided by PR-H; (d) pin-state document field shape (D4) — finalized by PR-D under the §4.24 round-trip contract; (e) K24 ownership re-verification vs the for-nest events/auth rework — gate-4 verification item (§4.25).

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

Gate-3 revision artifacts (2026-09-16, board-authorized spec update; edits left uncommitted pending the later board commit authorization):

*   This record: §4.22 (D1–D7 authoritative rendering contract / demo behavior), §4.23 (38-finding inventory G3-01..G3-38 + gate-1 cross-reference), §4.24 (gate-2 test contract / definition-of-done), §4.25 (gate-4 PR-A..PR-H roadmap); §4.5 geometry/face precedence; §4.21 supersession additions; provenance and open-points updates.
*   `workdocs/ai/project/specifications/DECAF_32.md` — supersession markers on §21.3, §21.4, §21.6, §21.8.2, §21.10, §21.11 (superseded-by-DECAF-50 §4.22).
*   `workdocs/ai/project/specifications/DECAF_34.md` — supersession marker on §4.1 (superseded-by-DECAF-50 §4.22).

§4.24 addendum artifacts (2026-09-17, rides the same uncommitted SAA-1364 change-set):

*   This record: §4.24 gate-2 test contract gains P0 test #8 — a Playwright e2e boot-crash clause running against the live dev server (`npm run start:dev`, no `window.ENV` bootstrap), asserting no uncaught boot errors and that the graph surface renders, paired with PR-G's managed webServer fixture; records the corrected `GRAPH_DEV_MODE` derivation (Angular `isDevMode()`, no `src/environments/environment` import from the graph route). Origin: the board's gate-4 commit-gate rejection on SAA-1364 (confirmation card `4f6b574e`, 2026-09-17) after the graph demo crashed on `npm run start:dev`. No §4.22 or §4.25 wording referenced the dev-chrome gating derivation (the only prior reference, G3-36 "Behind a dev flag", is derivation-agnostic), so no alignment edit was needed elsewhere; DECAF_32.md/DECAF_34.md supersession banners are untouched.

Round-2 close-out artifacts (2026-09-20, board change list; rides the uncommitted user-approved change-set, no commits/staging):

*   This record: new §4.26 (round-2 close-out addendum — R2-1 backend-only node classes + metadata-only frontend contract, R2-2 engine-versioning removal, R2-3 UX/functional fix list, R2-4 D1–D7/G4 effect ruling + supersession table); inline round-2 supersession markers on §1 (legacy persisted workflows bullet), §4.5, §4.6, §4.7 (co-located authoring), §4.18, and §4.22 G4-R2. Origin: the board's round-2 close-out change list (context manifest rev 1 `57a249ba` on SAA-1628; dispatched via SAA-1629). DECAF_32.md/DECAF_34.md untouched this round — no cross-record supersession was required beyond what this record expresses.
