# UI Decorators Research Brief — `@decaf-ts/ui-decorators`

> Consolidated, code-grounded research brief covering the `ui-decorators`
> module of the `decaf-ts` monorepo (`/workspaces/decaf-ts/ui-decorators`).
> Existing doc versions were ignored and every statement below is grounded in
> the actual `src/`, `tests/`, `README.md`, `workdocs/`, generated `docs/`, and
> `jest.config.cjs`. No tests or builds were run; no source/test files were
> modified. This is raw technical material for an Architecture handbook /
> design specification.

This brief treats the whole `ui-decorators` package as one module (it is
published as a single package `@decaf-ts/ui-decorators` with three subpath
exports: `.`, `./graph`, `./user-requests`) and follows the requested
per-module structure. Within it, subsystems are documented in the layering
order in which they appear in the barrels: root `overrides` → `model` → `ui`
→ `graph` (subpath) → `user-requests` (subpath).

---

### ui-decorators (`@decaf-ts/ui-decorators` v0.19.1)

#### 1. Identity

- **Directory:** `/workspaces/decaf-ts/ui-decorators`
- **Package name:** `@decaf-ts/ui-decorators`
- **Version:** `0.19.1` (`package.json:3`)
- **Description:** `"Extension of decorator validation to ui elements to allow for web integration"` (`package.json:4`)
- **License:** MPL-2.0 OR AGPL-3.0; engines `node >=20.0.0`, `npm >=10.0.0`
- **Repository:** `git+https://github.com/decaf-ts/ui-decorators.git`
- **Author:** Tiago Venceslau and Contributors
- **Entry points (package `exports`):**
  - `.` → `lib/esm/index.js` (root barrel: `overrides` + `model` + `ui`)
  - `./graph` → `lib/esm/graph/index.js` (graph metadata layer)
  - `./user-requests` → `lib/esm/user-requests/index.js` (User Request Resolution Engine core)
- **Build artifacts:** `lib/` (cjs + esm + types), `dist/` (bundled `ui-decorators.js`/`.cjs`).
- **`sideEffects`** (`package.json:65-77`): declares the override entry points
  (`overrides/index`, `graph/overrides/*`, `model/overrides`, `user-requests/index`)
  as side-effectful so bundlers preserve the prototype-patching imports.
  Notably `ui/overrides` is **not** listed — see Inaccuracies.

#### 2. Purpose & role

`ui-decorators` is the framework-neutral, metadata-driven UI rendering layer of
decaf. It sits directly above `decorator-validation` (the `Model` base) and
`db-decorators` (CRUD `OperationKeys`, error hierarchy) and below the
framework-specific rendering adapters (`for-angular`, `for-react`,
`for-react-native`, `for-nextjs`). It does three things:

1. It adds a `render()` method to every `Model` (via prototype override) and a
   set of class/property decorators (`@uimodel`, `@uielement`, `@uiprop`,
   `@uichild`, `@uilayout`, `@uisteppedmodel`, `@hideOn`, `@hideFor`,
   `@showFor`, `@uiorder`, `@uilistprop`, `@uitablecol`, `@uipageprop`,
   `@uion*`) that attach UI metadata to model classes and properties.
2. It defines an abstract `RenderingEngine` that converts that metadata +
   validation metadata into a framework-neutral `FieldDefinition` tree, and a
   registry/flavour system so a concrete engine (React, Angular, HTML5, …)
   registers itself and is selected per model via `@renderedBy`.
3. It provides two opt-in subpath layers: a **graph metadata layer**
   (`./graph`) that extends the same model/decoration system to describe
   visual workflow nodes/ports/workflows and serialize their state into
   framework-neutral snapshots, and a **User Request Resolution Engine**
   (`./user-requests`) that lets a backend `Service` resolve a typed user
   request through a rendering-engine facade (modal/toast/spinner/router)
   without any Angular/DOM dependency.

It is consumed by `for-angular`, `for-react`, `for-react-native`, `for-nextjs`,
`for-fabric`, `integrations`, `demo` (angular/ionic, angular/ew), and
`web-page` (all depend on `@decaf-ts/ui-decorators: latest`).

#### 3. Dependencies

- **Runtime decaf deps** (`package.json:48-53`):
  - `@decaf-ts/core` — used only by `user-requests` (`Service`, `Context`,
    `ContextFlags`, `ContextualArgs`, `LoggerOf`, `MethodOrOperation`, etc.).
  - `@decaf-ts/db-decorators` — `OperationKeys`/`CrudOperations` for CRUD-aware
    visibility, and the error base classes (`InternalError`, `NotFoundError`,
    `ValidationError`).
  - `@decaf-ts/decoration` — `Metadata`, `metadata`, `propMetadata`, `apply`,
    `Decoration`, `DecorationKeys`, `Constructor` (the reflection backbone).
  - `@decaf-ts/decorator-validation` — `Model`, `ModelConstructor`,
    `ModelBuilder`, `Validator`, `ValidationKeys`, `ValidationMetadata`,
    `ReservedModels`, `Primitives`, validators (`EmailValidator`,
    `DateValidator`, …), and `formatDate`/`parseDate`.
- **Dev deps** (`package.json:45-47`): `@decaf-ts/logging`, `@decaf-ts/utils`,
  `@types/jest`. Note: `@decaf-ts/logging` is actually a **runtime** import
  (`LoggedClass` in `DecafComponent`, `DecafTranslateService`, and the test
  mocks) even though it is declared under `devDependencies` — see Inaccuracies.
- **Key external deps:** none beyond the decaf modules; no Angular/React/DOM
  imports in `src` (the package is framework-neutral by design).
- **Dependents (consume this package):** `for-angular`, `for-react`,
  `for-react-native`, `for-nextjs`, `for-fabric`, `integrations`, `demo/*`,
  `web-page`.

#### 4. Architecture & structure

`src/` is organized by subsystem, each with its own `index.ts` barrel, a
`decorators.ts`, a `constants.ts`, a `types.ts`, and (where needed) an
`overrides.ts` that monkey-patches foreign prototypes:

```
src/
  index.ts                 # root barrel: import "./overrides"; re-export overrides + model + ui
  overrides/
    index.ts               # side-effect import of model/overrides; re-export ModelBuilderExtensions
    ModelBuilderExtensions.ts  # ModelBuilder fluent API for UI decorators
  model/
    index.ts               # import "./model"; re-export decorators + overrides + Renderable
    model.ts               # `declare module` augmentation: Model namespace (uiXxxOf helpers)
    Renderable.ts          # Renderable interface (render<R>(...args): R)
    decorators.ts          # @uimodel, @renderedBy, @uilistmodel, @uihandlers, @uilayout, @uisteppedmodel
    overrides.ts           # Model.prototype.render + Model.uiXxxOf static helpers (side-effect)
  ui/
    index.ts               # re-export constants, decorators, Rendering, types, utils, UIValidator,
                           #   DecafComponent, DecafEventHandler, DecafTranslateService, interfaces
                           #   (NOTE: `import "./validator"` and `export * from "./overrides"` are COMMENTED OUT)
    constants.ts           # UIKeys, UIMediaBreakPoints, ValidatableByType/Attribute, HTML5InputTypes,
                           #   ComponentEventNames, TransactionHooks, ElementSizes/Positions, ActionRoles, ...
    types.ts               # FieldDefinition, FieldProperties, UI*Metadata, CrudOperationKeys,
                           #   DecafToast/Modal/Spinner options, IPagedComponentProperties, UIEventName, ...
    decorators.ts          # @hideOn, @hideFor, @showFor, @renderIf, @uiorder, @hidden, @uielement,
                           #   @uiprop, @uichild, @uilistprop, @uilayoutprop, @uipageprop, @uion, @uionclick,
                           #   @uionrender, @uitablecol
    Rendering.ts           # abstract RenderingEngine<T,R>: cache/current, register, get, getOrBoot,
                           #   translate, toFieldDefinition, sortChildrenByOrder, isCustomValidator, ...
    DecafComponent.ts      # abstract DecafComponent<M extends Model> extends LoggedClass — base UI component
    DecafEventHandler.ts   # DecafEventHandler extends DecafComponent (handle/handleClick/handleAction)
    DecafTranslateService.ts  # minimal translate/instant logging stub
    UIValidator.ts         # abstract UIValidator extends Validator (translateService-aware getMessage)
    validator.ts           # `declare module` augmentation for BaseValidator.translateService (DEAD — not imported)
    overrides.ts           # Validator.getMessage static override (DEAD — not imported; also self-recursive bug)
    utils.ts               # getUIAttributeKey, formatByType, parseValueByType, parseToNumber,
                           #   escapeHtml/revertHtml, generateUIModelID, isClassConstructor
    errors.ts              # RenderingError extends InternalError
    interfaces/            # IDecafModal, IDecafRouter, IDecafSpinner, IDecafToast (framework-neutral contracts)
  graph/                   # SUBPATH export "./graph"
    index.ts               # side-effect import ../overrides + ./overrides; re-export constants/decorators/
                           #   registry/overrides/snapshot/reader/types (overrides exported twice — redundant)
    constants.ts           # GraphKeys, PortDirection, GraphNode/Port/Workflow metadata types,
                           #   GRAPH_VISUAL_STATE_STYLES, category-style registry + resolvers
    decorators.ts          # @node, @graph, @port, @input, @output, @connection, @pinnable
    registry.ts            # NODE_REGISTRY / WORKFLOW_REGISTRY Sets + registerNode/Workflow/graphNodes/Workflows
    reader.ts              # graphPortsOf, graphPortDefinitionOf, graphDefinitionOf, graphWorkflowDefinitionOf,
                           #   schema-group flattening, leaf-port helpers, portGroups resolution
    snapshot.ts            # GraphWorkflowSnapshot types + graphWorkflowSnapshotOf/Restore/ToJSON/FromJSON/
                           #   InputValuesOf/OutputValuesOf
    types.ts               # re-export PortDirection + Graph* types from constants + snapshot types
    overrides/
      index.ts             # import "./Rendering"; re-export ./overrides + ./Metadata
      Metadata.ts          # `declare module` augmentation: Metadata.nodes() / Metadata.workflows()
      Rendering.ts         # interface augmentation: RenderingEngine.renderAsNode
      overrides.ts         # attaches renderAsNode to RenderingEngine.prototype + Metadata.nodes/workflows
  user-requests/           # SUBPATH export "./user-requests"
    index.ts               # re-export constants/errors/types/UserRequestHandler/decorators
    constants.ts           # USER_REQUEST_KEY = "user-requests.handler"
    types.ts               # UserRequest<T>, RenderingFacade (Pick<RenderingEngine, 4 methods>),
                           #   UserRequestHandlerMetadata
    decorators.ts          # @userRequest(reference) class decorator (Decoration.for + Metadata.set + metadata)
    errors.ts              # CancelledError extends InternalError (HTTP 400)
    UserRequestHandler.ts  # abstract UserRequestHandler<T,C> extends Service<C>; getHandler/getMetadata/
                           #   static handle; getInput/awaitDismissal/cancel; logCtx override exposing
                           #   modal/toast/spinner/router getters
```

Key subsystems:

- **Model override layer** (`model/overrides.ts`): the side-effect that makes
  every `Model` renderable. It assigns `Model.prototype.render` and a family of
  `Model.uiXxxOf` static metadata readers, then declares the matching
  `declare module "@decaf-ts/decorator-validation"` namespace in `model/model.ts`.
- **Rendering engine** (`ui/Rendering.ts`): the heart of the package. A static
  flavour→engine cache + a `current` engine, an abstract `render`/`initialize`
  contract, and a large `toFieldDefinition` that walks UI + validation metadata
  to emit a `FieldDefinition` tree (tag, props, children, item, rendererId),
  applying CRUD visibility (`hideOn`), namespace visibility (`hideFor`/
  `showFor`/`renderIf`), ordering (`uiorder` first/number/last), validation
  attributes/types, and nested-model children (`uichild`).
- **Component base** (`ui/DecafComponent.ts` + `DecafEventHandler.ts`): an
  abstract, framework-neutral component with logging, translate, router,
  repository, CRUD context, dark-mode/locale state, and `parseHandlers`/
  `parseEvents` helpers used by the `@uion*` decorators.
- **Graph layer** (`graph/`): a parallel metadata system (`@node`, `@graph`,
  `@port`, `@input`, `@output`, `@connection`, `@pinnable`) on top of the same
  `Metadata`/`uimodel` backbone, with a reader that flattens Schema-typed
  `@input`/`@output` properties into unprefixed ports, resolves effective
  colors/icons from a category registry, and a snapshot module that
  serializes/restores workflow state (definition + state: inputs/outputs/nodes/
  edges/ui/metadata) with JSON round-trip.
- **User Request Engine** (`user-requests/`): a `Service`-based handler base
  driven by `@userRequest(reference)` metadata, dispatched statically, with a
  `RenderingFacade` (the four real `RenderingEngine` methods) and a `logCtx`
  override that exposes `modal`/`toast`/`spinner`/`router` getters to handler
  code. Pure-Node safe (no Angular/DOM).

#### 5. Public API surface

Root barrel (`@decaf-ts/ui-decorators`):

- **Constants/enums:** `UIKeys`, `UIMediaBreakPoints`, `ValidatableByType`,
  `ValidatableByAttribute`, `HTML5InputTypes`, `HTML5CheckTypes`,
  `HTML5DateFormat`, `ComponentEventNames`, `TransactionHooks`,
  `ElementSizes`, `ElementPositions`, `LayoutGridGaps`, `ActionRoles`,
  `WindowColorSchemes`.
- **Types:** `FieldDefinition`, `FieldProperties`, `UIElementMetadata`,
  `UIModelMetadata`, `UIPropMetadata`, `CrudOperationKeys`, `UIListPropMetadata`,
  `UIListModelMetadata`, `UIListItemElementMetadata`, `UILayoutMetadata`,
  `UIClassMetadata`, `UILayoutCol`, `UIListItemPosition`, `UIFunctionLike`,
  `UIEventHandler`, `UIEventName`, `UIEventProperty`, `UIHandlerMetadata`,
  `UILayoutPropMetadata`, `DecafToastRole`, `UIMediaBreakPointsType`,
  `DecafSpinnerOptions`, `DecafModalOptions`, `DecafToastOptions`,
  `CrudFormField`, `IPagedComponentProperties`.
- **Model class decorators** (`model/decorators.ts`): `uimodel(tag?, props?)`,
  `renderedBy(engine)`, `uilistmodel(name?, props?)`, `uihandlers(props?)`,
  `uilayout(tag, colsMode?, rows?, props?)`,
  `uisteppedmodel(tag, pages?, paginated?, props?)`.
- **UI property decorators** (`ui/decorators.ts`): `hideOn(...ops)`,
  `hideFor(...namespaces)`, `showFor(...namespaces)`, `renderIf(...namespaces)`
  (alias of `showFor`), `uiorder(order?)`, `hidden()`,
  `uielement(tag|props, props?, serialize?)`, `uiprop(propName?, stringify?)`,
  `uichild(clazz, tag, props?, isArray?, serialize?)`,
  `uilistprop(propName?, props?)`, `uilayoutprop(col?, row?)`,
  `uipageprop(page?)`, `uion(event|map, handler?)`, `uionclick(handler)`,
  `uionrender(handler)`, `uitablecol(sequence?, valueParserFn?)`.
- **Rendering engine:** `RenderingEngine<T,R>` (abstract) with static
  `register`, `get`, `render`; instance `translate`, `toFieldDefinition`
  (protected), `isCustomValidator`, `isValidatableByType/Attribute`,
  `toAttributeValue`, `sortChildrenByOrder`; abstract `initialize`, `render`,
  `getModal`, `getToast`, `getSpinner`, `router`.
- **Component layer:** `DecafComponent<M>` (abstract), `DecafEventHandler`,
  `DecafTranslateService`, `UIValidator` (abstract), `Renderable`.
- **Errors:** `RenderingError`.
- **Utils:** `getUIAttributeKey`, `formatByType`, `parseValueByType`,
  `parseToNumber`, `escapeHtml`, `revertHtml`, `generateUIModelID`,
  `isClassConstructor`.
- **Interfaces:** `IDecafModal`, `IDecafRouter`, `IDecafSpinner`, `IDecafToast`.
- **Version consts:** `VERSION`, `COMMIT`, `FULL_VERSION`, `PACKAGE_NAME`
  (build-time placeholders `##VERSION##` etc.).
- **ModelBuilder extensions** (via `overrides`): `ModelBuilder#uimodel`,
  `#renderedBy`, `#uilistmodel`, `#uihandlers`, `#uilayout`, `#uisteppedmodel`,
  `#decorateClass`.

Subpath `./graph` adds: `GraphKeys`, `PortDirection`, `GraphNodeKind`,
`GraphConnectionRule`, `GraphNodeMetadata`, `GraphWorkflowNodeMetadata`,
`GraphNodeIoViewMode`, `GraphNodeIoMetadata`, `GraphVisualStyle`,
`GRAPH_VISUAL_STATE_STYLES`, `graphVisualStyleOf`, `GraphWorkflowRelationMetadata`,
`GraphWorkflowMetadata`, `GraphPortMetadata`, `GraphPortGroupMetadata`,
`GraphPortDefinition`, `GraphNodeDefinition`, `GraphWorkflowDefinition`,
`GraphCategoryStyle`, `GRAPH_DEFAULT_CATEGORY_STYLE`,
`registerGraphCategoryStyle`, `graphCategoryStyleOf`, `resolveEffectiveColor`,
`resolveEffectiveIcon`; decorators `node`, `graph`, `port`, `input`, `output`,
`connection`, `pinnable`, plus `GraphPinnableOptions`, `GraphPinningMetadata`;
registry `registerNode`, `registerWorkflow`, `graphNodes`, `graphWorkflows`,
`resetGraphRegistries`; reader `graphNodeMetadataOf`, `graphWorkflowMetadataOf`,
`graphPortMetadataOf`, `graphPortDefinitionOf`, `graphPortsOf`,
`graphLeafPortsOf`, `graphWorkflowInputLeafPortsOf`,
`graphWorkflowOutputLeafPortsOf`, `graphDefinitionOf`,
`graphWorkflowDefinitionOf`; snapshot `GRAPH_WORKFLOW_SNAPSHOT_VERSION`,
`GraphWorkflowSnapshot*` types, `graphWorkflowSnapshotDefinitionOf`,
`graphWorkflowSnapshotOf`, `graphWorkflowSnapshotRestore`,
`graphWorkflowSnapshotToJSON`, `graphWorkflowSnapshotFromJSON`,
`graphWorkflowSnapshotInputValuesOf`, `graphWorkflowSnapshotOutputValuesOf`;
augmentations `Metadata.nodes()`, `Metadata.workflows()`,
`RenderingEngine#renderAsNode`.

Subpath `./user-requests` adds: `USER_REQUEST_KEY`, `CancelledError`,
`UserRequest<T>`, `RenderingFacade`, `UserRequestHandlerMetadata`,
`UserRequestHandler<T,C>` (abstract; static `getHandler`, `getMetadata`,
`handle`; instance `getInput`, `cancel`, `handle`, `logCtx` override,
`UserRequestLogContext`), `userRequest(reference)`.

#### 6. Key patterns & concepts

- **Metadata-driven decoration.** All UI knowledge is stored as reflection
  metadata via `@decaf-ts/decoration`'s `metadata`/`propMetadata` under
  `UIKeys.REFLECT` ("ui") for class-level decorators and
  `Metadata.key(UIKeys.REFLECT, DecorationKeys.PROPERTIES, prop, key)` for
  property decorators (helper `getUIAttributeKey`). Graph uses its own
  `GraphKeys` namespace (`graph`, `graph.node`, `graph.edge`, `graph.port`).
- **Prototype overrides / module augmentation.** The package patches foreign
  classes (`Model.prototype.render`, `Model.uiXxxOf`, `ModelBuilder#uiXxx`,
  `Metadata.nodes/workflows`, `RenderingEngine#renderAsNode`) at import time
  and uses `declare module` to add the typed surface. The `sideEffects` array
  in `package.json` keeps these imports alive for bundlers.
- **Flavour registry.** `RenderingEngine` keeps a static `cache: flavour →
  engine|constructor` and a `current` engine. A concrete engine registers
  itself in its `protected constructor(flavour)` via `RenderingEngine.register`.
  `Model.renderedBy(constructor)` reads the `@renderedBy(engine)` metadata and
  `RenderingEngine.get(flavour)` resolves the engine (booting it if a
  constructor was cached).
- **FieldDefinition tree.** `toFieldDefinition` is the single conversion
  pipeline: class decorators (`@uimodel`/`@uilistmodel`/`@uihandlers`/
  `@uilayout`) → walk `Model.uiPropertiesOf` → per property resolve
  `@uiprop`/`@uichild`/`@uielement` (exactly one allowed, else
  `RenderingError`) → fold in validation decorators
  (`ValidatableByAttribute` → HTML attrs; `ValidatableByType` → input type +
  date format; custom validators → `subType` + `validationMessage`) → recurse
  into nested models for `@uichild` → sort by `@uiorder` → filter by
  `hidden`/`hideFor`/`showFor` against `globalProps.operation`/`namespaces`.
- **CRUD- and namespace-aware visibility.** `@hideOn(...OperationKeys)` and
  `@hidden()` (all four ops) hide fields per `globalProps.operation`;
  `@hideFor`/`@showFor`/`@renderIf` filter against `globalProps.namespace` or
  `globalProps.namespaces`.
- **Graph Schema flattening.** `@input`/`@output` set `graph.schema = true` on
  a port; the reader splices the nested `Model`'s matching-direction ports
  **unprefixed** into the parent (the carrier property is not a port), with a
  cycle guard. `@port` on a Schema-typed property keeps the legacy composite
  (prefixed children) behaviour. `portGroups` carries the one-vs-all rendering
  toggle (default `"all"`).
- **Category style registry.** `registerGraphCategoryStyle(category, style)`
  feeds `resolveEffectiveColor/Icon` used by `graphDefinitionOf` and
  `graphWorkflowDefinitionOf`; explicit node `color`/`icon` override the
  category, which overrides `GRAPH_DEFAULT_CATEGORY_STYLE`.
- **Snapshot serialization.** `graphWorkflowSnapshotOf(model, input?)`
  normalizes a definition + state (inputs/outputs by path, nodes by id/ref,
  edges by relation), with deep cloning and idempotent merge of supplied
  overrides; `graphWorkflowSnapshotRestore` re-derives against the current
  definition; JSON round-trip helpers exist.
- **Service-based user request handlers.** `UserRequestHandler<T,C>` extends
  core `Service<C>`, takes a `RenderingFacade` in its protected constructor,
  and exposes `logCtx(..., true)` returning `UserRequestLogContext` with
  `log`/`ctx`/`ctxArgs` plus `modal`/`toast`/`spinner`/`router` getters bound
  to the engine. Dispatch is static and metadata-based
  (`Metadata.get(USER_REQUEST_KEY, reference)`), so no process-wide registry.
- **Decoration.for(...).define(...).apply().** The graph and user-requests
  decorators register themselves with the `Decoration` DSL so they are
  discoverable/introspectable, while still writing raw `Metadata` for runtime
  lookup.

#### 7. Lifecycle / configuration / environment

- **Boot / init.** Importing the root barrel runs `src/index.ts`, which
  side-effect-imports `./overrides` (→ `model/overrides`, which patches
  `Model.prototype.render` and the `Model.uiXxxOf` statics) and calls
  `Metadata.registerLibrary(PACKAGE_NAME, VERSION)`. Importing `./graph`
  additionally side-effect-imports `../overrides` and `./overrides` (attaching
  `Metadata.nodes/workflows` and `RenderingEngine#renderAsNode`). Importing
  `./user-requests` only re-exports; it does not patch anything.
- **Engine boot.** A concrete engine calls `super(flavour)` in its constructor,
  which calls `RenderingEngine.register(this)` (throws `InternalError` on
  duplicate flavour) and sets it as `current`. `RenderingEngine.get(flavour?)`
  returns the cached instance or, if a constructor was cached, instantiates it
  and **fire-and-forgets** `engine.initialize()` (see Inaccuracies). The
  `initialized` flag is the intended gate but is not awaited.
- **Flavours.** Flavours are free-form strings (`'react'`, `'angular'`,
  `'html5'`, `'graph'`, `'mock-user-requests-N'`, …). `@renderedBy(engine)`
  stores the flavour on the model; `RenderingEngine.render(model)` reads it via
  `Model.renderedBy(constructor)` and dispatches to `RenderingEngine.get(flavour).render(...)`.
- **Env vars / defaults.** No environment variables are read by this package.
  Notable defaults: `HTML5DateFormat = "yyyy-MM-dd"`; `uilayout` breakpoint
  defaults to `UIMediaBreakPoints.LARGE` (see Inaccuracies — JSDoc says `'m'`);
  `uiorder` defaults to `UIKeys.FIRST`; `uitablecol` sequence defaults to
  `UIKeys.LAST`; `uipageprop` page defaults to `1`; `uilayoutprop` col/row
  default to `1`; `pinnable` defaults to `enabled: true`, `strategy: "manual"`,
  `includeDependencies: true`; `CancelledError` defaults to HTTP `400` and
  message `"User request cancelled"`; `GRAPH_WORKFLOW_SNAPSHOT_VERSION = 1`.
- **Build-time placeholders.** `VERSION`/`COMMIT`/`FULL_VERSION`/`PACKAGE_NAME`
  are `##VERSION##`/`##COMMIT##`/`##FULL_VERSION##`/`##PACKAGE##` placeholders
  replaced at publish time.

#### 8. Data & control flow

Rendering a model (`user.render()`):

1. `Model.prototype.render` (installed by `model/overrides.ts:34`) calls
   `RenderingEngine.render(this, ...args)`.
2. `RenderingEngine.render` (`Rendering.ts:768`) resolves the constructor via
   `Model.get(name) || Model.fromObject(model)` (throws `InternalError` if
   none), reads `Model.renderedBy(constructor)` for the flavour, and calls
   `RenderingEngine.get(flavour).render(model, ...args)`.
3. `RenderingEngine.get` (`Rendering.ts:740`) returns the cached instance (or
   boots a cached constructor) for that flavour.
4. The concrete engine's `render` (e.g. the test `TestEngine`) calls the
   protected `toFieldDefinition(model, globalProps)` (`Rendering.ts:305`).
5. `toFieldDefinition` gathers class decorators
   (`getClassDecoratorsMetadata`), throws `RenderingError` if none
   (`@uimodel` missing), merges `inheritProps` (for nested children), then
   iterates `Model.uiPropertiesOf`:
   - for each property, `Model.uiDecorationOf` returns all UI decorator
     entries, sorted so `ELEMENT`/`CHILD` process first;
   - `Model.uiTypeOf` enforces exactly one of `@uiprop`/`@uichild`/`@uielement`
     (else `RenderingError`); `hideOn` requires a `@uielement`;
   - `@uiprop` → stored in `childProps`; `@uichild` → recursive
     `toFieldDefinition` on the nested model (instantiating via
     `Model.get(clazzName)` if undefined) with `inheritProps`/`childOf` path
     propagation; `@uilistprop` → builds the `item` mapper + container props;
     `@uielement` (and `@uion`/`@uipageprop`/`@uilayoutprop`/`@hideFor`/
     `@showFor`) → builds a child `FieldDefinition`, folding in validation
     decorators (`ValidatableByAttribute` → HTML attr, `ValidatableByType` →
     type + date format, custom → `subType`), defaulting `type` from
     `Metadata.type(...)`, and formatting the value via `formatByType`.
6. Children are sorted (`sortChildrenByOrder`: `first` → numeric → `last`) and
   filtered by `hidden` (vs `globalProps.operation`) and `hideFor`/`showFor`
   (vs `globalProps.namespaces`/`namespace`).
7. The result `{ tag, item, props, children, rendererId? }` is returned;
   `rendererId` is added only at the top level via `generateUIModelID(model)`.

Graph definition flow: `@node`/`@graph` decorate a `Model` (composing
`@uimodel`) and register the constructor in the in-module `Set` registries.
`graphDefinitionOf(model)` reads `Model.uiModelOf` + `graphNodeMetadataOf`,
calls `graphPortsOf` (which, for `@input`/`@output` Schema ports, splices the
nested model's matching-direction ports unprefixed via `schemaGroupPorts`, with
a `visited` cycle guard; for `@port` Schema ports, expands into prefixed
composite children), resolves `portGroups` (declared + defaulted `"all"`), and
resolves `effectiveColor`/`effectiveIcon` from the category registry.
`graphWorkflowDefinitionOf` additionally splits ports into inputs/outputs/
connections and attaches `nodes`/`relations`. `graphWorkflowSnapshotOf`
normalizes that definition + caller-supplied state into a versioned snapshot.

User request flow: a caller invokes
`UserRequestHandler.handle(request, renderingEngine)` (`UserRequestHandler.ts:132`).
It resolves `request.type || request.id` → `getHandler` (metadata lookup) →
`new Handler(renderingEngine)` → `instance.context("user-request", {})` →
`instance.handle(request, ctx)`. A typical handler calls `getInput(request,
...args)`, which logs via `logCtx(..., true)`, calls
`renderingEngine.getModal({ props: { request } })`, stores the modal, and
returns `awaitDismissal` — a promise that patches `modal.confirm`/`modal.cancel`
so a confirm resolves with `event.data ?? event` and a cancel rejects with
`CancelledError`. `cancel()` rejects any pending promise and dismisses the
modal. `logCtx` (overridden) wraps the base `Service.logCtx` result with
`modal`/`toast`/`spinner`/`router` bound getters.

#### 9. Testing

- **Runner/config:** Jest (`jest.config.cjs`), `ts-jest` transform, node
  environment, `testRegex: /tests/.*\.(test|spec)\.(ts|tsx)$/`.
- **Coverage ignore** (`jest.config.cjs:11-17`):
  `DecafComponent.ts`, `DecafEventHandler.ts`, `ui/validator.ts`,
  `ui/overrides.ts`, `ui/UIValidator.ts` — i.e. the component base and the dead
  validator-override paths are deliberately excluded from coverage.
- **Test files** (`tests/unit/`):
  - `ui-decorators.test.ts` — basic decoration of a `TestClass` (class metadata,
    property `uiElementOf`, `uiIsHidden`, `render` is defined and throws when no
    engine is registered).
  - `models.ts` — shared fixtures: `TestClass`, `DemoModel`, `AddressModel`,
    `NeighborModel`, `ParentModel` exercising `@uisteppedmodel`, `@renderedBy`,
    `@uilistmodel`, `@uihandlers`, `@uilayout`, `@uichild`, `@hideOn`, etc.
  - `rendering-engine.test.ts` — `TestEngine` over `RenderingEngine<void>`;
    `Generates FieldDefinitions` (full props/children assertion for `DemoModel`
    create operation, type translation, validation attributes, ordering);
    `toFieldDefinition` submodel recursion (constructable and undefined nested
    models), `@uimodel`-missing and dual-decoration errors, `@uichild`-not-a-
    model error; `toAttributeValue` for required/regular/comparison/invalid
    keys; namespace hide/show filtering.
  - `ui.utils.test.ts` — `formatByType`, `parseValueByType` (number, timestamp,
    formatted date, HTML escape, parse failure), `parseToNumber`, `escapeHtml`,
    `revertHtml`, `generateUIModelID` (pk-based, timestamp fallback).
  - `model-builder.extensions.test.ts` — `ModelBuilder` fluent UI helpers record
    `UIMODEL`/`RENDERED_BY`/`UILISTMODEL`/`HANDLERS`/`UILAYOUT` metadata.
  - `graph.test.ts` — node/workflow metadata composition, port definition
    derivation, nested composite ports + leaf ports, framework-neutral
    `graphDefinitionOf`, workflow definition with derived inputs/outputs/nodes/
    relations, `renderAsNode`, snapshot serialization/restore/JSON round-trip,
    Schema-flattening `@input`/`@output` (unprefixed splicing, carrier
    undefined, `portGroups` one-vs-all, default `"all"`, `@port` legacy
    composite, primitive `@input` no-op), and `Metadata.nodes()`/
    `Metadata.workflows()` accessors.
  - `user-requests/` — `user-requests.test.ts` (FR-1..FR-5 + cancellation +
    erroring + `logCtx` surface) using `mocks/MockRenderingEngine.ts`
    (`MockRenderingEngine`/`MockModal`/`MockToast`/`MockSpinner`/`MockRouter`)
    and `fixtures/user-data-handler.ts` (a real `@userRequest("user-data")`
    handler that trims/lowercases input).
  - `tests/web/` — static `index.html` + icons (no automated web test; assets
    only).
- **Coverage gaps / notable:** `DecafComponent`, `DecafEventHandler`,
  `UIValidator`, `ui/validator`, `ui/overrides` are excluded from coverage and
  effectively untested. `DecafTranslateService` has no direct test. The
  `IDecafModal`/`IDecafRouter`/`IDecafSpinner`/`IDecafToast` contracts are only
  exercised through the test mocks. `parseValueByType`'s `Array` branch and the
  `revertHtml` round-trip with `&amp;` ordering are lightly covered. Graph
  `@pinnable`, `@connection`, the category-style registry resolvers, and the
  visual-state style map are not directly asserted. No integration/e2e tests.

#### 10. Usage example

Minimal renderable model + engine (derived from `tests/unit/rendering-engine.test.ts`
and `tests/unit/models.ts`):

```typescript
import { Model, model, required, minlength } from "@decaf-ts/decorator-validation";
import { RenderingEngine, FieldDefinition, uimodel, uielement, uiorder, hideOn } from "@decaf-ts/ui-decorators";
import { OperationKeys, id } from "@decaf-ts/db-decorators";

// Concrete (test) engine: toFieldDefinition does the metadata → FieldDefinition work.
class TestEngine extends RenderingEngine<void> {
  constructor(flavour: string) { super(flavour); }
  async initialize(..._a: any[]): Promise<void> { this.initialized = true; }
  render<M extends Model>(m: M, globalProps: Record<string, unknown>): FieldDefinition<void> {
    return this.toFieldDefinition(m, globalProps);
  }
}

@uimodel("decaf-crud-form", { test: "1" })
@model()
class DemoModel extends Model {
  @id()
  @uielement("decaf-crud-field", { label: "translation.demo.id.label" })
  @uiorder(0)
  id!: number;

  @required()
  @minlength(5)
  @uielement("decaf-crud-field", { label: "translation.demo.name.label" })
  @hideOn(OperationKeys.UPDATE)
  name!: string;
}

const engine = new TestEngine("test");
const def = engine.render(new DemoModel({ id: 1, name: "name" }), { operation: "create" });
// def.tag === "decaf-crud-form"; def.children[0].props.order === 0; etc.
```

Graph node + workflow definition (derived from `tests/unit/graph.test.ts`):

```typescript
import { Model, model, required } from "@decaf-ts/decorator-validation";
import { uielement } from "@decaf-ts/ui-decorators";
import { node, graph, port, input, output, graphDefinitionOf, graphWorkflowDefinitionOf,
         PortDirection } from "@decaf-ts/ui-decorators/graph";

@node("graph-tool", { kind: "tool", category: "AI", icon: "tool", color: "#2196f3" })
@model()
class GraphToolModel extends Model {
  @required()
  @uielement("input", { label: "Prompt" })
  @port(PortDirection.INPUT, { handle: "prompt" })
  prompt!: string;

  @uielement("textarea", { label: "Result" })
  @port(PortDirection.OUTPUT)
  result!: string;
}

const def = graphDefinitionOf(GraphToolModel);
// def.tag === "graph-tool"; def.ports = [{ property: "prompt", direction: INPUT }, { property: "result", direction: OUTPUT }]
```

User request handler (derived from `tests/unit/user-requests/user-requests.test.ts`):

```typescript
import { UserRequestHandler, userRequest } from "@decaf-ts/ui-decorators/user-requests";
import type { UserRequest } from "@decaf-ts/ui-decorators/user-requests";

@userRequest("echo")
class EchoUserRequestHandler extends UserRequestHandler<string> {
  async handle(request: UserRequest<string>): Promise<string> {
    return `echo:${request.payload as string}`;
  }
}

// Dispatch with any RenderingFacade (the four RenderingEngine methods):
const result = await UserRequestHandler.handle(
  { id: "req-1", type: "echo", payload: "pong" },
  renderingEngine
);
// result === "echo:pong"
```

#### 11. Relationships

- **decorator-validation** — provides `Model` (the renderable base, patched
  here), `ModelBuilder` (extended here), the validator hierarchy
  (`ValidatableByType`/`ValidatableByAttribute` reference `EmailValidator`,
  `DateValidator`, …), `ValidationKeys`, `ReservedModels`, `Primitives`,
  `formatDate`/`parseDate`, and `Metadata.type`/`Metadata.properties`.
- **decoration** — the reflection backbone: `Metadata` (get/set/key/type/
  properties/constr/registerLibrary), `metadata`/`propMetadata` decorators,
  `apply`/`Decoration.for(...).define(...).apply()` DSL, `DecorationKeys`,
  `Constructor`. Graph augments `Metadata` with `nodes()`/`workflows()`.
- **db-decorators** — `OperationKeys`/`CrudOperations` (CRUD visibility,
  `ActionRoles`), and the error hierarchy (`InternalError` → `RenderingError`,
  `CancelledError`; `NotFoundError`; `ValidationError`).
- **core** — only `user-requests` depends on it (`Service`, `Context`,
  `ContextFlags`, `ContextualArgs`, `ContextualizedArgs`, `LoggerOf`,
  `MaybeContextualArg`, `MethodOrOperation`, `FlagsOf`).
- **logging** — `LoggedClass` base for `DecafComponent`,
  `DecafTranslateService`, and the test mocks; `Logging.for(this)` in
  `MockRenderingEngine`.
- **for-angular / for-react / for-react-native / for-nextjs** — provide
  concrete `RenderingEngine` implementations and the Angular/UI bindings for
  the contracts here (`IDecafModal`, `IDecafRouter`, `IDecafSpinner`,
  `IDecafToast`, `DecafComponent`).
- **integrations / for-fabric / demo / web-page** — consumers that build graph
  nodes/workflows and UI forms on top of this package.

#### 12. Consumer notes

- **Subpath imports matter.** `Metadata.nodes()`/`Metadata.workflows()` and
  `RenderingEngine#renderAsNode` are only attached when `@decaf-ts/ui-decorators/graph`
  is imported; the root barrel does **not** pull graph. Likewise the
  `user-requests` surface is only available via the `./user-requests` subpath.
- **Engine registration is global and flavour-unique.** Constructing a concrete
  engine registers it and sets it as `current`; a duplicate flavour throws
  `InternalError`. The test mocks avoid collisions by using a monotonic
  `mock-user-requests-N` flavour.
- **`initialize()` is fire-and-forget on boot.** `RenderingEngine.get` does not
  await `initialize()`; consumers that need async init should await
  `engine.initialize()` themselves before rendering (the tests do:
  `await engine.initialize()`), or rely on the `initialized` flag.
- **Exactly one of `@uiprop`/`@uichild`/`@uielement` per property.** `toFieldDefinition`
  throws `RenderingError` otherwise. `@hideOn`/`@hidden` require a `@uielement`
  on the same property.
- **`@renderedBy` is required for dispatch** only if more than one engine is
  registered; with a single engine it can be omitted (`RenderingEngine.get()`
  falls back to `current`).
- **Namespace visibility** is driven by `globalProps.namespace` (single) or
  `globalProps.namespaces` (array); pass the active tenant(s) when rendering.
- **`DecafToastOptions.duration` is typed as the literal `3000`** (see
  Inaccuracies) — consumers cannot set any other duration without casting.
- **Dead validator-override paths.** `UIValidator`, `ui/validator.ts`, and
  `ui/overrides.ts` are exported/declared but never wired (the side-effect
  imports are commented out in `ui/index.ts` and excluded from coverage and
  `sideEffects`). Do not rely on `Validator.getMessage` being patched by this
  package; set `UIValidator.translateService` yourself if you use `UIValidator`.
- **Build placeholders.** `VERSION`/`COMMIT`/`FULL_VERSION`/`PACKAGE_NAME` are
  `##...##` placeholders until publish; do not read them at dev time.
- **Maturity / versioning.** v0.19.1 (pre-1.0); the graph and user-requests
  layers are newer (comments reference DECAF-24/DECAF-32/DECAF-48 and a
  2026-06-19 date on the router/spinner/toast interfaces). The package is
  consumed by all UI framework adapters, so the rendering/metadata contract is
  effectively stable even while the version is <1.0.

#### 13. Inaccuracies found

1. **[ui-decorators] Model namespace vs implementation name mismatch (`uiHiddenOn` vs `uiIsHiddenOn`)** — `src/model/model.ts:65-78` declares `Model.uiHiddenOn` (three overloads) but `src/model/overrides.ts:107` implements `Model.uiIsHiddenOn` (with the `Is` infix). The declared `uiHiddenOn` is never implemented and the implemented `uiIsHiddenOn` is never declared in the augmentation, so typed consumers cannot reach the implemented method through the declared surface and vice-versa. | Evidence: `src/model/model.ts:65` `function uiHiddenOn` vs `src/model/overrides.ts:107` `(Model as any).uiIsHiddenOn = function ...`. | Suggested fix: align the names (rename the implementation to `uiHiddenOn` or change the declaration to `uiIsHiddenOn`) and add the missing declaration for the implemented name.

2. **[ui-decorators] `Model.uiListItems` is implemented but not declared** — `src/model/overrides.ts:154` attaches `Model.uiListItems` but `src/model/model.ts` does not declare it in the `Model` namespace augmentation, so it is untyped. | Evidence: `src/model/overrides.ts:154` `(Model as any).uiListItems = function ...` with no matching `function uiListItems` in `src/model/model.ts:28-79`. | Suggested fix: add `function uiListItems<M extends Model>(model: Constructor<M>): string[] | undefined;` to the `Model` namespace declaration.

3. **[ui-decorators] Dead validator-override paths are exported but never wired** — `src/ui/index.ts:1-2` has `// import "./validator";` and `// export * from "./overrides";` commented out, so `src/ui/overrides.ts` (the `Validator.getMessage` static override) and `src/ui/validator.ts` (the `BaseValidator.translateService` module augmentation) never execute. `package.json` `sideEffects` does not list `ui/overrides`, and `jest.config.cjs:13-14` excludes both from coverage. `UIValidator` (exported from `ui/index.ts:10`) therefore never has its `translateService` wired by the package. | Evidence: `src/ui/index.ts:1-2`; `src/ui/overrides.ts:4-8`; `package.json:65-77` (no `ui/overrides`); `jest.config.cjs:11-17`. | Suggested fix: either remove `UIValidator`/`ui/validator.ts`/`ui/overrides.ts` or restore the side-effect imports and add `ui/overrides` to `sideEffects`.

4. **[ui-decorators] `ui/overrides.ts` `Validator.getMessage` override is self-recursive** — `src/ui/overrides.ts:4-8` assigns `Validator.getMessage = function(message, ...args) { ...; return this.getMessage(message, ...args); }`; when called as `Validator.getMessage(...)`, `this` is `Validator`, so `this.getMessage` is the same just-assigned function → infinite recursion whenever `translateService` is unset. | Evidence: `src/ui/overrides.ts:4-8`. | Suggested fix: capture the original `getMessage` before overriding (e.g. `const original = Validator.getMessage; ... return original.call(this, message, ...args);`) or call `super.getMessage`-equivalent. (Moot while the file is dead, but must be fixed if re-enabled.)

5. **[ui-decorators] `RenderingEngine.getOrBoot` does not await `initialize()`** — `src/ui/Rendering.ts:720-727` calls `engine.initialize(); // make the booting async. use the initialized flag to control it` without `await`, so `RenderingEngine.get()` returns an engine whose async initialization may still be pending. The comment acknowledges this, but the public `get`/`render` path has no synchronization, so a concrete engine that requires async init can be rendered before it is ready. | Evidence: `src/ui/Rendering.ts:725` `engine.initialize(); // make the booting async...`. | Suggested fix: make `get` async (or have `getOrBoot` await `initialize()` and cache a post-init Promise/engine) and update `RenderingEngine.render` to await it.

6. **[ui-decorators] `@uion` JSDoc misstates the event type** — `src/ui/decorators.ts:594-596` says the `event` argument "Must be one of the keys in `Pick<DecafComponent, 'render' | 'initialize'>`", but `UIEventName` (`src/ui/types.ts:211-214`) is `keyof Pick<DecafEventHandler, "render" | "initialize" | "handleClick" | "refresh">` — a different class (`DecafEventHandler`, not `DecafComponent`) and four keys, not two. | Evidence: `src/ui/decorators.ts:595` vs `src/ui/types.ts:211-214`. | Suggested fix: update the JSDoc to reference `DecafEventHandler` and list all four event names.

7. **[ui-decorators] `@uilayout` JSDoc param list and default disagree with the implementation** — `src/model/decorators.ts:240-244` documents params `(tag, colsMode=1, rows=1, breakpoint='m')`, but the actual signature (`:291-296`) is `(tag, colsMode=1, rows=1, props={})` and the breakpoint defaults to `UIMediaBreakPoints.LARGE` (`"large"`, not `"medium"`/`'m'`) via `Object.assign({ breakpoint: UIMediaBreakPoints.LARGE }, props)` (`:308`). There is no `breakpoint` parameter; it is folded into `props`. | Evidence: `src/model/decorators.ts:243` `@param {UIMediaBreakPoints} [breakpoint='m']` vs `:291-309`. | Suggested fix: correct the JSDoc param list to `(tag, colsMode, rows, props)` and state the breakpoint default is `LARGE`, overridable via `props.breakpoint`.

8. **[ui-decorators] `DecafToastOptions.duration` typed as the literal `3000`** — `src/ui/types.ts:263-269` declares `duration: 3000;` (a literal type, not `number`), so any value other than `3000` fails type-checking and consumers must cast. This is almost certainly unintended for an options object. | Evidence: `src/ui/types.ts:265` `duration: 3000;`. | Suggested fix: change to `duration: number;` (optionally with a default in consuming engines).

9. **[ui-decorators] `@decaf-ts/logging` is a runtime dependency but declared under `devDependencies`** — `src/ui/DecafComponent.ts:1`, `src/ui/DecafTranslateService.ts:1` (and the test mocks) import `LoggedClass`/`Logging` from `@decaf-ts/logging`, but `package.json:45-47` lists it under `devDependencies` only. Consumers who do not install it themselves (or via another dep) could break at runtime when importing `DecafComponent`. | Evidence: `package.json:45` `"@decaf-ts/logging": "latest"` under `devDependencies` vs `src/ui/DecafComponent.ts:1` `import { LoggedClass } from "@decaf-ts/logging";`. | Suggested fix: move `@decaf-ts/logging` to `dependencies`.

10. **[ui-decorators] README decorator catalogue is incomplete** — `README.md:47-60` ("Class Decorators"/"Property Decorators") omits `@uilayout`, `@uisteppedmodel`, `@uihandlers` (class) and `@uichild`, `@uilayoutprop`, `@uipageprop`, `@uiorder`, `@uitablecol`, `@uion`/`@uionclick`/`@uionrender`, `@hideFor`, `@showFor`, `@renderIf` (property), all of which exist in `src/model/decorators.ts` and `src/ui/decorators.ts`. | Evidence: `README.md:47-60` vs `src/model/decorators.ts:55-413` and `src/ui/decorators.ts:52-702`. | Suggested fix: extend the README decorator lists to cover all exported decorators.

11. **[ui-decorators] `graph/index.ts` re-exports `./overrides` twice** — `src/graph/index.ts:7` and `:11` both `export * from "./overrides";`. Harmless (idempotent re-export) but redundant and misleading. | Evidence: `src/graph/index.ts:7` and `:11`. | Suggested fix: remove the duplicate `export * from "./overrides";` line.

12. **[ui-decorators] `workdocs/documentation-status.md` references non-existent source files** — the status table lists `src/ui/DecafToast.ts` and `src/ui/DecafSpinner.ts` as "✅ Done" on 2026-06-19, but those files do not exist in `src/ui/` (the actual contracts are `src/ui/interfaces/IDecafToast.ts` and `src/ui/interfaces/IDecafSpinner.ts`). | Evidence: `workdocs/documentation-status.md` ("Files" table) vs `src/ui/` directory listing (no `DecafToast.ts`/`DecafSpinner.ts`). | Suggested fix: correct the file paths to `src/ui/interfaces/IDecafToast.ts` and `src/ui/interfaces/IDecafSpinner.ts`.

13. **[ui-decorators] `graph.test.ts` "re-decorating the same class does not duplicate" test does not re-decorate** — `tests/unit/graph.test.ts:708-726` declares a single `@node`-decorated `DupNode` class and asserts `after === before + 1` and that there is exactly one `DupNode` entry; the test name implies re-applying `@node` to the same class, but the decorator is only applied once, so the idempotency claim is not actually exercised (the underlying `Set` makes it idempotent, but the test does not prove it). | Evidence: `tests/unit/graph.test.ts:708-726`. | Suggested fix: actually re-apply `@node` to the same class (or call `registerNode(DupNode)` again) and assert the count is unchanged.

14. **[ui-decorators] `graph.test.ts` comment names classes that do not match the declarations** — `tests/unit/graph.test.ts:686` comment says "IfFlowModel, CodeModel" but the declared classes are `IfNode` (`:155`) and `CodeNode` (`:167`), and the later assertions reference `IfNode`/`CodeNode` (`:695`, `:638`, `:646`). | Evidence: `tests/unit/graph.test.ts:686` comment vs `:155`/`:167` declarations. | Suggested fix: update the comment to `IfNode` and `CodeNode`.

15. **[ui-decorators] `RenderingEngine` constructor logs via `console.log` instead of the decaf logger** — `src/ui/Rendering.ts:88` uses `console.log(\`decaf's ${flavour} rendering engine loaded\`)` rather than `Logging`/`LoggedClass`, inconsistent with the rest of the package which routes through the decaf logger. | Evidence: `src/ui/Rendering.ts:88` `console.log(...)`; contrast `src/ui/DecafComponent.ts:293-295` `this.log.for(this.render).info(...)`. | Suggested fix: route the load message through `Logging.for(RenderingEngine)` (or drop it).
