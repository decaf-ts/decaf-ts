# DECAF-24 — Graph Metadata Layer and Angular Graph Adapter

**Status:** Completed
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
Introduce a framework-neutral graph metadata layer in `ui-decorators` and a concrete Angular adapter in `for-angular`.

The `ui-decorators` graph layer is the canonical Decaf graph contract. It must stay free of concrete graph-editor dependencies and only expose primitives, metadata keys, composition helpers, and metadata readers that derive graph definitions from existing Decaf metadata.

The Angular side lives in a new `for-angular/src/graph` folder and consumes that canonical graph contract to render nodes and ports using `ngDiagram` when present. `ngDiagram` must remain optional for now so the module can compile and operate without graph rendering enabled.

The goal is to make graph-editing support declarative and model-driven without coupling the core metadata layer to a specific UI graph library.

## 2. Goals
*   [x] Define a canonical graph metadata contract in `ui-decorators`.
*   [x] Make `@node(...)` compose `@uimodel(...)` plus graph node metadata in a single decorator.
*   [x] Make `@port(...)` enrich existing field metadata instead of duplicating UI/validation data.
*   [x] Add an Angular graph adapter in `for-angular` that consumes the canonical metadata and renders with `ngDiagram` when available.
*   [x] Keep `ui-decorators` framework-neutral and free of concrete graph library dependencies.
*   [x] Introduce `@graph(...)` as the workflow-level contract in `ui-decorators`.
*   [x] Add a graph renderer component in `for-angular/src/graph` that can render a complete `@graph(...)` definition, including reusable value nodes and all connections.
*   [x] Add serialization and restore support so a workflow can be saved and reloaded with node positions, links, and UI state intact.

## 3. User Stories / Requirements
*   **US-1:** As a Decaf consumer, I want to mark a model as graph-enabled with a single class decorator so that the node metadata and UI metadata stay aligned.
*   **US-2:** As a Decaf consumer, I want property-level ports to be derived from existing field metadata so that I do not repeat labels, types, and validation hints.
*   **US-3:** As an Angular consumer, I want to render the same graph metadata through `for-angular` without changing the model decorators.
*   **US-4:** As a workflow author, I want a `@graph(...)` class decorator to represent the entire pipeline so the workflow class is the source of truth for inputs, outputs, nodes, and relations.
*   **US-5:** As an Angular consumer, I want workflow inputs to render as reusable canvas nodes so that values can be duplicated and connected anywhere in the graph without introducing extra semantic nodes.
*   **Req-1:** `ui-decorators` graph code must export only primitives and metadata helpers, not a concrete graph renderer.
*   **Req-2:** `@node(...)` must be implemented as a composition over `@uimodel(...)` and graph metadata keys.
*   **Req-3:** `@port(...)` must read existing Decaf metadata from the decorated property and only add graph-specific data such as direction, handle visibility, or connection rules.
*   **Req-4:** The Angular adapter must live under a dedicated `src/graph` area and treat `ngDiagram` as optional.
*   **Req-5:** The canonical graph reader must produce a framework-neutral `GraphNodeDefinition`/`GraphPortDefinition` shape that downstream adapters can map to their own runtime types.
*   **Req-6:** `@graph(...)` must decorate a model class that owns the entire workflow graph, including workflow inputs, outputs, nodes, and relations.
*   **Req-7:** `@graph(...)` must stay generic enough to model other workflow or pipeline engines in the future, with no assumptions about `ngDiagram` or Angular.
*   **Req-8:** The Angular graph renderer must display workflow inputs in a left-side column and also materialize each input as a duplicateable value node on the canvas with output-only semantics.
*   **Req-9:** Reusable value nodes must be ordinary decorated classes, and the renderer must connect workflow input value nodes to downstream inputs without enforcing connection limits.
*   **Req-10:** Existing workflow classes must be treated as the graph root, not as individual nodes in the rendered graph.
*   **Req-11:** The workflow graph must be serializable and reloadable, preserving workflow-root metadata, node positions, edges, port expansion state, and any UI state required to restore the canvas exactly.

## 4. Architecture & Design
- **Canonical layer in `ui-decorators`:** Add or formalize `src/graph` as the graph metadata layer equivalent to `@decaf-ts/graph`, including graph keys, node/port decorators, and a reader that merges graph metadata with existing UI metadata.
- **Decorator composition:** Implement `@node(...)` by extending or composing `@uimodel(...)` so the class keeps its UI identity while gaining graph-specific metadata. The graph layer must not duplicate responsibilities already covered by UI decorators.
- **Property derivation:** Implement `@port(...)` as a property decorator that inspects the existing Decaf metadata on the property and enriches it with graph semantics. The graph layer should derive label, type, and validation hints from the underlying metadata rather than requiring a second source of truth.
- **Framework-neutral output:** Introduce a canonical graph definition model that adapters can consume. It should describe nodes, ports, categories, icons, sizes, colors, grouping, and connection rules without mentioning a particular UI toolkit.
- **Workflow-level contract:** Add `@graph(...)` as the graph root decorator for workflow classes. The decorator should express the workflow inputs/outputs, node membership, and relations between nodes while remaining agnostic to the execution engine that will eventually power the workflow.
- **Angular adapter:** Add `for-angular/src/graph` as the concrete adapter layer. It should translate canonical graph definitions into the shape expected by `ngDiagram` and expose Angular services/components/directives only when graph rendering is enabled.
- **Graph renderer component:** Add a renderer component under `for-angular/src/graph` that accepts a `@graph(...)`-decorated class, renders workflow inputs in a left column, instantiates reusable value nodes for each input, and wires the full canvas graph including all connections.
- **Optional dependency strategy:** Treat `ngDiagram` as optional for the adapter package so the module can build without the graph runtime installed. The adapter should fail gracefully or remain inert when graph rendering is not requested.
- **Serialization contract:** Define a workflow snapshot shape that can be produced from a `@graph(...)` root, including node positions, port states, edge links, and workflow input/output values. The serializer should be framework-neutral so future adapters can load/save the same snapshot format.

## 5. Tasks Breakdown
| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| [TASK-154](./tasks/TASK_154.md) | Define the canonical graph metadata contract and merge rules | High | Completed | - |
| [TASK-155](./tasks/TASK_155.md) | Implement graph primitives and exports in `ui-decorators` | High | Completed | TASK-154 |
| [TASK-156](./tasks/TASK_156.md) | Implement the Angular graph adapter in `for-angular` | High | Completed | TASK-155 |
| [TASK-157](./tasks/TASK_157.md) | Add tests, documentation, and package wiring for graph support | Medium | Completed | TASK-155, TASK-156 |
| [TASK-158](./tasks/TASK_158.md) | Add `@graph(...)` workflow-root metadata in `ui-decorators` | High | Completed | TASK-155 |
| [TASK-159](./tasks/TASK_159.md) | Build the Angular graph renderer and reusable value-node classes | High | Completed | TASK-156, TASK-158 |
| [TASK-160](./tasks/TASK_160.md) | Add workflow serialization and restore support for graph state | High | Completed | TASK-158, TASK-159 |

## 6. Open Questions / Risks
*   Which concrete `ngDiagram` package name and integration surface should the Angular adapter target?
*   Should `ui-decorators` expose the graph reader directly from its package root or only through a `./graph` subpath?
*   Risk: if graph metadata duplicates existing UI metadata, consumers may end up with two competing sources of truth. The spec must keep the canonical merge rules strict.
*   Risk: making the Angular adapter optional means the runtime must handle a missing graph package cleanly in build and test environments.

## 7. Results & Artifacts
*   `ui-decorators/src/graph` now provides the canonical graph metadata layer, including graph keys, node/port decorators, graph-definition readers, and the `renderAsNode` base implementation.
*   `ui-decorators/src/index.ts` and `ui-decorators/package.json` now export the graph subpath and root graph primitives.
*   `for-angular/src/graph` now provides the Angular adapter, decorated example nodes, reusable boundary node classes, the `@graph(...)` workflow root example, and the `ngDiagram` mapping layer.
*   `for-angular/src/app/pages/graph` now exposes a dedicated graph demo page with a workflow-root renderer.
*   `for-angular/src/graph/graph-renderer.component.ts` now renders a complete `@graph(...)` definition, including duplicated workflow input value nodes and all workflow relations.
*   The workflow-root contract, Angular renderer phase, and workflow serialization/restoration phase are now complete for DECAF-24.
*   `ui-decorators` now provides the canonical workflow snapshot contract and restore helpers for graph state.
*   `for-angular` now provides snapshot save/load wiring for workflow serialization/restoration, including node positions, edges, port expansion state, and UI state.
*   Regression coverage added in `ui-decorators/tests/unit/graph.test.ts` and `for-angular/src/graph/adapter.spec.ts`.
