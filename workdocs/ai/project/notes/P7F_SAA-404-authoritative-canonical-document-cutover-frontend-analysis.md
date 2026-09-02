# P7-F analysis notes — canonical document cutover frontend (stage-only)

## Palette / node-instance factory
- `src/graph/document/GraphNodePaletteFactory.ts` (created this run) now owns all palette→instance machinery:
  `graphNodeInstanceSeedId(kind,label?)` (kind+slug seed), `graphUniqueNodeIdOf(document, seed)` (numeric-collision-safe), `graphNodeParameterDefaultsOf(parameters)` (manifest parameter `defaultValue`s only), and `graphNodeInstanceFromManifest(document, manifest, position, label?)` returning the `node.add` command with `ui.position` and `display.name` label. `GraphWorkflowDocumentStore.addNodeFromManifest` wires it (returns a deep clone of the built instance). Editor palette cutover is constructor-free (`§4.14`).
- `GraphDiagramMutationTranslator` now consumes the factory's shared helpers and exports `graphNodeAddCommandOf` and `graphEdgeAddCommandOf`; the demo auto-create default-handler path in `graph-node-template.component.ts` uses them (`core.flow.log` + "No match (default)" + switch default→`value` edge) instead of legacy canvas `addNodes` with `buildMemberNode(LogFlowNode, ...)`.

## Node edit modal rewrite (doc-native)
- `GraphNodeEditResult` carries `{nodeId, inputBindings, outputBindings, parameters, metadata?}` — legacy `values`/`portModes`/`outputSplits` shapes are gone. Inputs are `nodeTitle/nodeId/nodeData (GraphDemoNodeData|GraphRendererNodeData|null)/nodeInstance (GraphNodeInstance|null)`; seeds derive from the doc instance (`literal` value → port value, `expression` → expr string, `parameters`/`metadata` verbatim).
- Literal/port toggles write into `inputBindings`; useAsPort on → `{mode:'edge'}`; literal off with no value → binding removed entirely (the engine falls back to `port.metadata["defaultValue"]`).
- Code nodes keep `timeoutMs` inside `metadata` and promote the editor-extracted `code` into `parameters.code` on save. `validateCode` covers the wired guard’s empty/code/variability/passivity heuristics (plus missing `return` warning).

## Switch semantic mismatch (OPEN)
- Backend `SwitchGraphNodeExecutor.readSwitchMetadata` reads `parameters["switch"] ?? metadata?.["switch"]` (`integrations/src/graph/engine/execution/SwitchGraphNodeExecutor.ts:33-49`), so the frontend's switch write shape is `parameters = { switch: { cases, defaultPort, hasDefault } }` (written via `switchParameterBlockOf` in the node template).
- Forward adapter `switchMetadataOfNode` reads `node.parameters['cases']` (`GraphDiagramAdapter.ts:180-230`) — now hardened to read `parameters["switch"]` first, then legacy residuals `parameters["switchMetadata"]` and the bare `cases` array. Persisted legacy docs stay readable after the P7 write-shape change (old `switchMetadata` blocks on converted canvases).
- Engine factors that keep the same `parameters.cases`/`outputBindings` block shape for doc-driven switch ports: the loop/switch session-specific `parameters[idx]` dereference (`SwitchGraphNodeExecutor`) reads `context.parameters["switch"]` (the doc's own executor's op/select machinery stays as-is). The canonical doc reducer's `node.update` patch (`GraphWorkflowDocumentStore.updateNode`) accepts the patch's `parameters` shape verbatim.
- Switch editor's condition cases are NOT doc-bound yet; case edition machinery still routes through `GraphSwitchEditModalComponent` (the render machinery's canvas cases' shape stays in `data.ports`, no `metadata.mandatory` is armoured on those edges) — the doc's own switch writes are now doc-broken only (a Tester child retargets the swing class for `switchMetadata` runs' shapes below).
- Remaining TODO (before the 12-step suite): port the switch's own `size`/port delta writes onto the doc store (`applySwitchEditResult`'s canvas-only `change` machinery) and derive the switch's `ports` from the flipped doc case(s) instead of the legacy `dataPortsOf` machinery.

## Catalogue and the demo's node-kind surface
- `GraphNodeCatalogCompositeSource` (created this run, catalog barrel + `src/graph/index.ts`) = live `GraphNodeCatalogApi` first, `GraphNodeCatalogFixtureSource` fallback on backend error; fixture kinds are merged into each live list (`fetchManifests` dedupes fixture kinds with backend-first merge: `fixedKinds` used against the *backend* list so fixture-only kinds stay). Fixture-only kinds resolve locally for `fetchManifest`/`resolveManifest` (backend never sees them); `invokeMethod` requires the live API (fixture stub throws InternalError otherwise).
- `GraphNodeCatalogService` now exposes live `manifests` and `status` signals (wired from `GraphNodeCatalogStore.signals`), so the renderer palette + the pages' palette rows read 1 signal each (no sample bookkeeping).
- Demo graph page providers `GRAPH_NODE_CATALOG_SOURCE` with `useExisting: GraphNodeCatalogCompositeSource` and leaves the app's app-level binding as `GraphNodeCatalogApi` (Tester probe `GraphRunCatalogBinding.spec.ts` asserts the app.config's provider shape).
- `GRAPH_NODE_MANIFEST_FIXTURES` now compiles `GRAPH_NODE_MANIFEST_FIXTURE_CONSTRUCTORS` = demo nodes + shared trigger/flow/agent/stats nodes — all the canvas machine's `kind`s (incl. `core.loop.foreach` kinds in the demo pages). All demo node kinds live in the fixture's constructors, so the builder's `catalogue.get(node.kind)` no longer throws on demo nodes.

## Canvas reconcile wiring
- `GraphDiagramAdapter.reconcile(document, previousDiagram, catalogue, injector, {restore?, applyViewport?})` is the only canvas-restore machinery (`GraphDiagramAdapter.ts:739-855`); when `restore` is on, positions/sizes/viewport come straight from the document (`reconcileNodeOf` returns the projected node).
- `GraphRendererComponent` now owns `settleCanvasFromDocument()` + `restoreFromDocument(saved: GraphWorkflowSnapshot)`:
  - with a live document: `canvasAdapter.reconcile(document, previousModel, catalogue, injector, restoreOptions)` and `skipNextModelSync` (legacy model effect skips), then `model.set(diagram)`.
  - empty store: seeds the store via `documentStore.initialize(graphWorkflowDocumentFromLegacySnapshot(this.buildSnapshot()))` once the decorated-root legacy canvas produced a snapshot (§4.11 lossless conversion). This runs the canonical side from the page's P7 legacy widget state so a fresh editor session is ALWAYS a canonical document.
- `restoreFromSnapshot` (undo/redo) also places the doc store back in sync with `graphWorkflowDocumentFromLegacySnapshot(snapshot)`.
- The demo page's `syncCanonicalDocumentStore` still converts the legacy snapshot through `graphWorkflowDocumentFromLegacySnapshot` for the npm-side save path and `the doc store`'s own store state (a Tester child re-rolls it to doc-store dispatch commands per §4.4.5).

## Node template's doc machinery (writes)
- `portModes` now compute from the doc store's `inputBindings` (live), not from `graphNodeConfig.getConfig(...)`: `graph-node-template.component.ts:210-230`.
- `openEditor` builds `nodeInstance` from the doc store (switch + edit-modal cases), seeds the modal with both `nodeData` + `nodeInstance`; the switch editor keeps the doc-native write-through `parameters` bookkeeping (§4.4.4).
- The node's own `switchMetadata` is still projected into the canvas node data from the doc store's parameters (`canvasDataOf` — §4.4.4) so `visiblePorts()`'s switch-case ports render from the converted doc node list.

## Engine sync notes
- `GraphExecutionEngine` collects the node's inputs from edges, `instance.inputBindings` literal/expression values, and `port.metadata["defaultValue"]` fallback only — so modal literal writes MUST land in `inputBindings` (which the modal rewrite now does), never in `parameters`.
- `GraphNodeExecutionRequest.parameters` carries `instance.parameters` verbatim (including the switch's metadata block), so the doc instance's `parameters["switch"]` shape feeds the switch executor right.
- Loop nodes (`ForeachGraphNodeExecutor.ts:146`, `WhileGraphNodeExecutor.ts:103`, `UntilGraphNodeExecutor.ts:105`) read `instance.parameters ?? {}` and the `metadata.loop` body's configuration the same way.

## Files staged (no commits) — as of this run's stage
- created: `src/graph/document/GraphNodePaletteFactory.ts`, `src/graph/catalog/GraphNodeCatalogCompositeSource.ts`
- modified: `src/graph/catalog/{index.ts, GraphNodeCatalogService.ts}`, `src/graph/components/{graph-node-edit-modal, graph-node-template, graph-renderer}/*`, `src/graph/document/{GraphDiagramAdapter.ts, GraphDiagramMutationTranslator.ts, GraphWorkflowDocumentStore.ts, index.ts}`, `src/graph/execution/index.ts`, `src/graph/services/GraphSaveService.ts`, `src/graph/utils.ts`, `src/app/pages/graph/graph.page.{ts,html}`
- deleted (git rm'd): `src/graph/execution/GraphNodeConfigStore.ts` + barrel export.

## Pending
- The 3 stale legacy spec suites (`GraphMutationDetectorService.spec`, `GraphSaveService.spec`, `GraphAutoSaveService.spec`) reference the retired `save()`/doc-environment shape and need Tester-child retargets (the doc-driven services' machinery).
- Playwright `tests/playwright/graph/node-switch.spec.ts` still writes `HTMLElement.checked` against `SVGElement` (`2` pre-existing tsc errors).
- `src/app/pages/graph/utils.ts` `GRAPH_DEMO_EDGES` `never`-narrowing errors (11) are baseline noise from the empty demo edges list on HEAD (retarget in the Tester child report).
- 12-step E2E (spec §4.19 order) and package READMEs (`packages/graph/README.md` etc.) remain tester/docs children, not blocked by this stage.
