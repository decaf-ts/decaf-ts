# Research Brief 11 — for-angular (Angular Rendering Engine)

Consolidated read-only research brief for the **Architecture handbook** and **design
specification**. Scope: `for-angular` — the Angular integration of decaf-ts
(`NgxRenderingEngine`, `DynamicModule`, CRUD/field/form/table/modal components,
directives, pipes, i18n, graph subsystem, demo app, Storybook). All statements are
grounded in the actual source, tests, README/workdocs and build configuration as found in
`/workspaces/decaf-ts/for-angular`. No tests or builds were run; nothing was modified.

---

### for-angular (`@decaf-ts/for-angular` v0.5.20)

1. **Identity**
   - Dir: `/workspaces/decaf-ts/for-angular`
   - Package name: `@decaf-ts/for-angular` (`package.json:2`)
   - Version: `0.5.20` (`package.json:3`)
   - Package description: **none** — `package.json` has no `description` field. The only
     description is the README's, which is wrong (see Inaccuracies #1).
   - Author: "Tiago Venceslau and Contributors"; license `MPL-2.0 OR AGPL-3.0`
     (`package.json:62-63`); repository `git+https://github.com/decaf-ts/for-angular.git`;
     engines node >=20, npm >=10.
   - The repo contains the library (`src/lib` + `src/graph`), a demo application
     (`src/app`), Playwright E2E tests (`tests/playwright`), Storybook stories
     (`src/stories`), and Angular schematics (`schematics/`).

2. **Purpose & role**
   - for-angular is the **Angular rendering engine** of the decaf framework: it converts
     decaf model decorator metadata (`@uimodel`/`@uilayout`/`@uielement` from
     `@decaf-ts/ui-decorators`) into dynamically created Angular/Ionic components, so a
     decorated model can be rendered as a full CRUD UI (form, fieldset, list, table,
     modal, stepped form) with no hand-written templates.
   - It sits in the "for-*" UI-adapter layer: `ui-decorators` defines the engine
     contracts (`RenderingEngine`, `DecafComponent`, `Renderable`, `FieldProperties`,
     `IDecafRouter/Spinner/Toast/Modal`), and for-angular provides the `angular` flavour
     of those contracts (`AngularEngineKeys.FLAVOUR = 'angular'`,
     `src/lib/engine/constants.ts:179`).
   - It also ships a second, large subsystem — `src/graph` — an ng-diagram-based visual
     workflow editor that is a **thin client** of the graph execution engine living in
     `@decaf-ts/integrations` (NestJS backend over HTTP + SSE).
   - The bundled demo app (`for-angular-app`) is the canonical consumer example and the
     E2E/Storybook fixture.

3. **Dependencies**
   - Decaf peer deps (all pinned to `"latest"`, `package.json:115-135`): `core`,
     `db-decorators`, `decoration`, `decorator-validation`, `for-http`,
     `injectable-decorators`, `integrations`, `logging`, `styles`,
     `transactional-decorators`, `ui-decorators`. Installed versions in this workspace:
     ui-decorators 0.17.11, integrations 0.7.0, core 0.29.0, for-http 0.19.0,
     decoration 0.18.3, decorator-validation 1.22.2, db-decorators 0.18.0, logging
     0.23.7, transactional-decorators 0.12.0, injectable-decorators 1.19.0, styles 0.7.3.
   - Decaf dev deps: `@decaf-ts/cli`, `@decaf-ts/ui-decorators`, `@decaf-ts/utils`
     (`package.json:95-97`).
   - Key external deps: Angular 21 (`@angular/*` ^21.2.17 peers), `@ionic/angular`
     ^8.7.4, `@ngx-translate/core`+`http-loader` ^17, `rxjs` ~7.8, `zone.js`,
     `reflect-metadata`, `ng-diagram` (peer + optional), `codemirror` +
     `@codemirror/*` (graph code editor), `cronstrue` ^3.24.0 (the **only** runtime
     `dependencies` entry, `package.json:92-94`; whitelisted via
     `allowedNonPeerDependencies` in `ng-package.json:18`), `@faker-js/faker` (optional
     peer), `@tabler/icons-webfont`, `ionicons`.
   - Decaf packages actually imported by `src/lib` (by occurrence count): ui-decorators
     (61), decorator-validation (44), db-decorators (30), core (18), decoration (16),
     logging (8), for-http (4, in `engine/overrides.ts` only), overrides (4, side-effect
     alias imports), transactional-decorators (1, `NgxSessionAdapter`),
     injectable-decorators (1, `utils/helpers.ts`). `src/graph` additionally imports
     `@decaf-ts/integrations` (16) — `src/lib` never does.
   - Depended on by (monorepo, all `"latest"`): `demo` (`demo/package.json:97`),
     `demo/angular/ew` (`:47`), `demo/angular/ionic` (`:50`), `web-page`
     (`web-page/package.json:128`), `bin/releases/dist-angular`.

4. **Architecture & structure**
   - `src/lib/` — the published library (single ng-packagr entry,
     `ng-package.json:5-7` → `src/lib/public-apis.ts`):
     - `engine/` — the core: `NgxRenderingEngine.ts` (643 ln, extends ui-decorators
       `RenderingEngine`), `DynamicModule.ts` (16 ln, abstract base marker class),
       `decorators.ts` (`@Dynamic()`, `injectService()`, `injectRepository()`), the
       `Ngx*Directive` base-class chain, `NgxSessionAdapter.ts` (localStorage-persisted
       in-memory adapter), `ValidatorFactory.ts` (decaf validation → Angular
       `ValidatorFn`), `overrides.ts` (`DecafAxiosHttpAdapter`), `constants.ts`
       (tokens + key enums), `interfaces.ts` (544 ln of contracts), `types.ts`,
       `helpers.ts` (`provideDecafDbAdapter`, `provideDecafDynamicComponents`,
       `provideDecafPageTransition`, `getModelAndRepository`, ...).
     - `components/` — 22 component folders (card, component-renderer, container,
       cron-selector, cron-selector-field, crud-field, crud-form, empty-state, fieldset,
       file-upload, filter, icon, layout, list, list-item, modal, model-builder,
       model-renderer, pagination, searchbar, stepped-form, table) +
       `for-angular-components.module.ts`.
     - `services/` — `NgxFormService` (1076 ln, static form registry), `NgxMediaService`
       (dark mode/resize/SVG), `NgxRouterService` (implements `IDecafRouter`),
       `NgxTranslateService`.
     - `i18n/` — `Loader.ts` (`I18nLoader`, `I18nParser`,
       `provideDecafI18nConfig`/`provideDecafI18nLoader`, `getLocaleContext`),
       `FakeLoader.ts` (test helper), `data/{en,pt}.json` (bundled library keys).
     - `pipes/` — `DecafTranslatePipe`, `DecafTruncatePipe`.
     - `directives/` — `NgxSvgDirective` (`[ngx-decaf-svg]`),
       `DecafTooltipDirective` (`[ngx-decaf-tooltip]`).
     - `utils/` — `helpers.ts` (603 ln of window/locale/date/mapper helpers),
       `NgxSpinner.ts`, `NgxToast.ts`, `DecafFakerRepository.ts` (not exported).
   - `src/graph/` — workflow editor subsystem (NOT in the published bundle, see
     Inaccuracies #2): `components/` (17 graph components incl. `GraphRendererComponent`,
     node/edge/ghost templates, toolbar, logs widget, I/O viewer, code editor),
     `execution/` (`GraphExecutionService` HTTP+SSE client, `GraphExecutionStateMapper`,
     signal stores: execution state, run log, inspection, node config, selection, ghost
     nodes), `services/` (history/undo-redo, save, auto-save, mutation detector,
     keyboard shortcuts), `nodes/boundary-nodes.ts`, `tokens/` (history limit, auto-save
     debounce), `utils.ts` (696 ln view-model/snapshot builders), `workflow-inputs.ts`
     (workflow input ports → reactive form + decaf validation model).
   - `src/app/` — demo application (`for-angular-app`): 17 lazy pages (login, dashboard,
     graph, cron-selector, medication-schedule, model-builder, fieldset, crud,
     list-model, model/:modelName, steps-form, user-request, plus an "EW" pharma vertical:
     products, batches, leaflets, audit, account), models, forms, handlers, and the
     `ew/fabric/` domain models.
   - `tests/playwright/` — 13 E2E specs (login, user-requests, 11 graph specs).
   - `src/stories/` — 31 Storybook stories for lib components/directives/pipes + pages.
   - `schematics/` — extends `@schematics/angular`; own `component` (alias `c`) and
     `page` generators plus a stub `schematics` command.
   - `docs/` — generated better-docs HTML output (build artifact, `npm run docs`).

5. **Public API surface**
   Verified against the built bundle export statement
   (`dist/lib/fesm2022/decaf-ts-for-angular.mjs:17426`):
   - **Modules**: `ForAngularCommonModule` (+ `forRoot()`; imports/exports
     `CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, TranslatePipe` and
     boots the engine at module load), `ForAngularComponentsModule` (aggregates 18
     standalone components).
   - **Rendering engine**: `NgxRenderingEngine` (render/register/destroy/createComponent
     + static `get()` inherited from base), `DynamicModule` (abstract marker base),
     `Dynamic()` decorator, `injectService()` / `injectRepository()` property-initializer
     helpers.
   - **Base directive chain** (exported): `NgxComponentDirective`, `NgxPageDirective`,
     `NgxModelPageDirective`, `NgxParentComponentDirective`, `NgxFormDirective`,
     `NgxFormFieldDirective`, `NgxEventHandler`. **Not exported** (internal, though
     present in the bundle): `NgxRepositoryDirective`, `NgxRenderableComponentDirective`,
     `ValidatorFactory`; **absent from the bundle entirely**: `NgxSessionAdapter`
     (see Inaccuracies #24).
   - **Components (23 exported classes)**: `ModelRendererComponent`,
     `ComponentRendererComponent`, `CrudFieldComponent`, `CrudFormComponent`,
     `EmptyStateComponent`, `ListComponent`, `ListItemComponent`, `SearchbarComponent`,
     `PaginationComponent`, `FieldsetComponent`, `LayoutComponent`, `FilterComponent`,
     `SteppedFormComponent`, `IconComponent`, `CardComponent`, `FileUploadComponent`,
     `TableComponent`, `ModalComponent`, `ModalConfirmComponent`, `ModelBuilderComponent`,
     `ContainerComponent`, `CronSelectorComponent`, `CronSelectorFieldComponent`,
     `ModalConfirmComponent` helpers (`presentModalConfirm`, `presentModalAlert`) and
     modal factory functions (`getNgxModalComponent`, `getNgxModalCrudComponent`,
     `presentNgxLightBoxModal`, `presentNgxInlineModal`, `getNgxInlineModal`,
     `getNgxSelectOptionsModal`).
   - **Services**: `NgxFormService` (static form registry: `createForm`,
     `addControlFromProps`, `validateFields`, `getFormData`, `cloneFormControl`, ...),
     `NgxRouterService`, `NgxMediaService` (via engine barrel). `NgxTranslateService` is
     **not** in the public barrel.
   - **Pipes / directives**: `DecafTranslatePipe`, `DecafTruncatePipe`,
     `NgxSvgDirective`, `DecafTooltipDirective`.
   - **i18n**: `I18nLoader`, `I18nLoaderFactory`, `I18nParser`,
     `provideDecafI18nConfig`, `provideDecafI18nLoader`, `getLocaleContext`,
     `getLocaleContextByKey`.
   - **Utils**: `NgxSpinner`/`NgxToast` (+ `getNgxSpinner`/`getNgxToast` lazy factories)
     and ~25 helper functions (`isDevelopmentMode`, `getWindow`/`setOnWindow`/
     `getOnWindow`, `getLocaleFromClassName`, `generateRandomValue`, `isValidDate`,
     `formatDate`, `dateFromString`, `itemMapper`/`dataMapper`, `getByPath`,
     `stringToBoolean`, `isValidBase64`, `stripHTML`, `asLength`, `windowEventEmitter`,
     `removeFocusTrap`, `getMenuIcon`, `filterString`, `cleanSpaces`, `isDarkMode`, ...).
   - **Engine providers/helpers**: `provideDecafDbAdapter`, `provideDecafDynamicComponents`,
     `provideDecafPageTransition`, `provideDecafDarkMode`, `decafPageTransition`,
     `getModelAndRepository`, `getDbAdapterFlavour`, `getLogger`.
   - **Tokens & constants**: `DB_ADAPTER_FLAVOUR_TOKEN`, `DB_ADAPTER_PROVIDER_TOKEN`,
     `LOCALE_ROOT_TOKEN`, `I18N_CONFIG_TOKEN`, `CPTKN`, `AngularEngineKeys`,
     `BaseComponentProps`, `ComponentsTagNames`, `ListComponentsTypes`, `RouteDirections`,
     `ActionRoles`, `WindowColorSchemes`, `ListItemPositions`, `CssClasses`,
     `DefaultListEmptyOptions`, `DefaultModalOptions`, `DefaultFormButtonsOptions`,
     `SelectFieldInterfaces`, `ErrorCodesTranslationKeys`, `InputComponentErrors`,
     `HTTPMethods`, `patternValidators`.
   - **Types/interfaces**: `AngularDynamicOutput`, `IComponentProperties`,
     `IFormComponentProperties`, `ICrudFormEvent`, `IBaseCustomEvent`, `IFilterQuery`,
     `IListItemCustomEvent`, `IPaginationCustomEvent`, `IRenderedModel`, `I18nToken`,
     `I18nResourceConfig`, `ITooltipConfig`, `IWindowResizeEvent`, `IMenuItem`,
     `ICrudFormButtons`, `IListEmptyOptions`, `ILayoutModelContext`, `DecafRepository`,
     `DecafRepositoryAdapter`, `FormParent`, `KeyValue`, `AngularFieldDefinition`, ...
   - **Overrides**: `DecafAxiosHttpAdapter` (bookmark pagination + SSE observer wiring).
   - **Not exported** (test/demo helpers): `I18nFakeLoader`, `MockedEnTranslations`,
     `DecafFakerRepository`, `getFakerData`. The entire `src/graph` subsystem is
     unpublished (no secondary entry point).

6. **Key patterns & concepts**
   - **Model-driven rendering.** A model class decorated with ui-decorators metadata is
     turned into a `FieldDefinition` tree by the base `RenderingEngine.toFieldDefinition`
     (reads `Model.uiModelOf`/`uiListModelOf`/`uiHandlersFor`/`uiLayoutOf`), then
     `NgxRenderingEngine.fromFieldDefinition` maps each node's `tag` to a registered
     component and creates it (`src/lib/engine/NgxRenderingEngine.ts:215-303`). The
     `Renderable` interface (`ui-decorators/lib/types/model/Renderable.d.mts`) is what
     `ModelRendererComponent` calls: `model.render(globals, vcr, injector, inner,
     projectable)` (`src/lib/components/model-renderer/model-renderer.component.ts:74-75`).
   - **`@Dynamic()` component registry.** `Dynamic()` (`src/lib/engine/decorators.ts:33-45`)
     must sit **above** `@Component`; it reflects the component metadata and registers the
     class in the engine's static registry under its selector
     (`NgxRenderingEngine.registerComponent`, `NgxRenderingEngine.ts:562-568`). Duplicate
     registration throws `InternalError`. The registry is a plain static
     `Record<string, { constructor }>` (`NgxRenderingEngine.ts:97`).
   - **Engine flavour & singleton.** The constructor passes `AngularEngineKeys.FLAVOUR`
     (`'angular'`) to the base (`NgxRenderingEngine.ts:162-164`); the base class keeps a
     flavour cache and `RenderingEngine.get()` returns/boots the current engine
     (`ui-decorators/lib/esm/ui/Rendering.js:456-481`). Boot is idempotent via a window
     flag `engineLoaded` (`AngularEngineKeys.LOADED`) set at module-evaluation time in
     `for-angular-common.module.ts:22-28` and `NgxComponentDirective.ts:52-58`.
   - **Directive inheritance chain.** `DecafComponent` (ui-decorators) →
     `NgxRepositoryDirective` (repository access, query/paginate/observe, transaction
     hooks) → `NgxComponentDirective` (shared inputs: model, mapper, pk, props,
     operations, handlers/events, locale, dark mode; `handleEvent`, `parseProps`,
     `changeOperation`) → then branches: `NgxPageDirective` (page title/menu) →
     `NgxModelPageDirective` (CRUD read/submit over a repository) →
     `NgxRenderableComponentDirective` (dynamic render + event subscription); and
     `NgxParentComponentDirective` (children/pages/cols/rows) → `NgxFormDirective`
     (form group lifecycle, `submitEvent`) and `NgxFormFieldDirective` (ControlValueAccessor
     + decaf field validation surface).
   - **Static form registry.** `NgxFormService` is a pure static class: a
     `WeakMap<AbstractControl, FieldProperties>` for control metadata and a
     `Map<string, FormParent>` of forms keyed by id (`src/lib/services/NgxFormService.ts:72,82`).
     The engine creates a form per render (`render()`, `NgxRenderingEngine.ts:505-513`),
     registers each child control via `addControlFromProps`, validates with
     `validateFields`, and extracts typed values with `getFormData` (number/date parsing,
     HTML escaping).
   - **Handlers & events.** Components accept `handlers`/`events` props (functions or
     `NgxEventHandler` subclasses); `NgxComponentDirective.handleEvent`
     (`NgxComponentDirective.ts:999-1017`) dispatches to a handler or re-emits on the
     `listenEvent` output, bubbling through the component tree. `ComponentEventNames`
     (ui-decorators) names standard events (Render, Submit, BackButtonClick,
     ValidationError, ...).
   - **i18n.** `provideDecafI18nConfig` wires `@ngx-translate/core` with a custom
     `I18nParser` (interpolation via decaf `sf`) and `I18nLoader`, which HTTP-fetches
     `{prefix}{lang}{suffix}` per resource, recursively merges over the bundled
     `src/lib/i18n/data/en.json` keys, and caches per language
     (`src/lib/i18n/Loader.ts:110-199`).
   - **decaf DI bridge.** `injectService()` / `injectRepository()`
     (`src/lib/engine/decorators.ts:75-111`) resolve decaf `ModelService`/`Service`/
     `Repository` singletons from decaf's own registries (`ModelService.forModel`,
     `CoreService.get`, `CoreRepository.forModel`) inside Angular property initializers —
     no Angular provider registration needed.
   - **Graph subsystem.** Workflows are decorated model classes
     (`@graph`/`@node`/`@input`/`@output` from `@decaf-ts/ui-decorators/graph`).
     `GraphRendererComponent` (ng-diagram canvas) builds the diagram model from
     `graphWorkflowDefinitionOf` + `buildGraphRendererModel`
     (`src/graph/utils.ts:457-557`), with boundary input nodes, ghost nodes for
     foreach-loops, and runtime-state merging so drags/viewport survive re-renders.
     Execution is **remote**: `GraphExecutionService` POSTs the serialized workflow to
     `${GRAPH_BACKEND_URL}/graph/execute` and streams `GraphExecutionEvent`s over SSE
     (`/graph/events`) via `ServerEventConnector` (for-http)
     (`src/graph/execution/GraphExecutionService.ts:174-213,287-323`). Frontend state
     lives in module-level signal stores (`graphExecutionState`, `graphRunLog`,
     `graphInspection`, `graphNodeConfig`, `graphSelection`, `ghostNodeStore`);
     `GraphExecutionStateMapper.apply` folds events into node/edge UI states
     (`src/graph/execution/GraphExecutionStateMapper.ts:27-37`); `blocked` is derived
     frontend-side (`markAllBlocked`, `GraphExecutionStateService.ts:48-66`).

7. **Lifecycle / configuration / environment**
   - **Boot.** Importing `ForAngularCommonModule` (or any engine module) evaluates the
     window-flag guard and instantiates the `NgxRenderingEngine` singleton
     (`for-angular-common.module.ts:22-28`). `initialize()` is a no-op flag setter
     (`NgxRenderingEngine.ts:530-532`). `destroy(formId?)` clears the instance, parent
     props, and optionally the form registry (`NgxRenderingEngine.ts:458-462`).
   - **App-level providers** (canonical set, `src/app/app.config.ts:29-65`):
     `provideIonicAngular({ mode: 'md' })`, `provideDecafDbAdapter(RamAdapter, { user,
     dbName })` (sets the DB flavour on window via `DB_ADAPTER_FLAVOUR_TOKEN`),
     `provideRouter(routes, withComponentInputBinding())`, `provideDecafPageTransition()`,
     `provideDecafDynamicComponents(...)` (registers app components with the engine),
     `provideDecafI18nConfig({ fallbackLang, lang }, [{ prefix, suffix }])`.
   - **DB adapter flavour** is read from `window` (`getDbAdapterFlavour`,
     `src/lib/engine/helpers.ts:14`); the demo uses `RamFlavour`
     (`src/app/app.config.ts:24,33`).
   - **Graph config tokens**: `GRAPH_BACKEND_URL` default `http://localhost:3000`
     (`src/graph/execution/GraphExecutionService.ts:26-29`); `GRAPH_HISTORY_LIMIT`
     default 10 and `GRAPH_AUTOSAVE_DEBOUNCE_MS` default 500
     (`src/graph/tokens/graph-configuration.tokens.ts:3-11`).
   - **Ports** (package.json scripts): dev server **8110** (`start`, `:6`), PDM dev
     **8130** (`start:pdm`, `:11`), PTP dev **8131** (`start:ptp`, `:10`), PWA preview
     **8110** (`pwa`, `:60`), Storybook **6006** (`angular.json:50,225`), graph backend
     **3000** (default token above; `start:backend` runs
     `node ../integrations/lib/cjs/nest/graph/main.cjs`, `:7`).
   - **Environments**: `src/environments/environment.ts` reads runtime config from
     `window.ENV` (`getOnWindow('ENV')`) and builds a `LoggedEnvironment` — but the file
     is dead code (see Inaccuracies #16).
   - **Engines**: node >=20, npm >=10 (`package.json:68-71`).

8. **Data & control flow**
   - **Model render** (typical operation): page template
     `<ngx-decaf-model-renderer [model]="model" [globals]="globals">` →
     `ModelRendererComponent` calls `model.render(...)` (`model-renderer.component.ts:70-95`)
     → `NgxRenderingEngine.render()` stores the model, generates a form id,
     `toFieldDefinition(model, globalProps)` reads decorator metadata, captures the
     current `operation`, creates a `FormGroup`/`FormArray` via `NgxFormService.createForm`
     → `fromFieldDefinition` recursively: registry lookup by tag →
     `reflectComponentType` → input mapping (adds `model`/`children` when the component
     declares those inputs) → `vcr.clear()` + `createComponent` → `setInputs` (only
     inputs present in the component mirror; `props` is deep-applied) → children are
     registered as form controls unless the operation is read-only
     (`NgxRenderingEngine.ts:494-519, 215-303`) → result carries the component instance,
     inputs, injector, and children; `destroy(formId)` then clears the registry.
   - **CRUD submit**: `CrudFormComponent`/`SteppedFormComponent`/`FieldsetComponent`
     submit → `NgxFormDirective.submit` → `NgxFormService.validateFields` (recursive
     touch/dirty/validate; invalid → re-enable controls, return false) →
     `getFormData` (typed extraction) → `submitEventEmit` emits `ICrudFormEvent`
     (`src/lib/engine/NgxFormDirective.ts:295-331`) → page-level
     `NgxModelPageDirective.handleEvent` → `submit()` performs
     `create/createAll/update/delete/deleteAll` on the resolved repository, translates
     `operations.{op}.success|error`, maps HTTP error codes via
     `ErrorCodesTranslationKeys`, and re-emits `listenEvent`
     (`src/lib/engine/NgxModelPageDirective.ts:356+`).
   - **List flow**: `ListComponent` (infinite or paginated) queries the repository
     (`paginate`/infinite scroll with bookmark support), renders `ListItemComponent`
     rows, and navigates to `/model/{Model}/{operation}/{id}` via
     `NgxComponentDirective.changeOperation` (`NgxComponentDirective.ts:1087-1092`).
   - **Graph execution**: `GraphPage.runWorkflow()` resets stores, seeds all nodes/edges
     as `blocked` (`markAllBlocked`), then `GraphExecutionService.execute(workflow,
     inputs)` → `POST /graph/execute` (10 s timeout; failure →
     `GraphBackendUnavailableError`) → `streamEvents(runId)` opens SSE on
     `/graph/events`, filters by run id → each event goes through
     `GraphExecutionStateMapper.apply` into the signal stores; `graph.run.log` payloads
     append to `graphRunLog`; on `workflow.completed|failed` the page fetches
     `GET /graph/results/:runId` into `graphInspection` (double-click on a ran node opens
     the I/O inspection panel). Node/edge templates read the stores reactively
     (`src/app/pages/graph/graph.page.ts:63-96,135-180`).

9. **Testing**
   - **Jest (active unit runner)** — `jest.config.ts`: `jest-preset-angular` preset,
     jsdom, ESM transform via `tsconfig.spec.json`; Playwright dir ignored; `src/app`
     excluded from module resolution; `lodash-es`→`lodash` and
     `@decaf-ts/overrides/ui-decorators`→`ui-decorators/lib/esm/model/overrides.js`
     mapped. 37 spec files: 2 engine (`decorators.spec.ts` — its only test is **skipped**
     via `xit`, `:53`; `overrides.spec.ts` — bookmark-pagination URL parsing), 17
     components (list incl. bookmark/normal pagination + modal-selection regression,
     pagination, list-item, crud-form, model-renderer, table, component-renderer
     prop-merge regression, fieldset, cron selector/builder/field, searchbar,
     empty-state, crud-field validation), 9 graph (execution state mapper, state
     service, run log store, inspection store, mutation detector, history, auto-save,
     save service, utils), 10 app smoke specs.
   - **Playwright (E2E)** — `tests/playwright/`, 13 specs: login (hardcoded credentials
     `decaf`/`Passd123-` against `http://localhost:8110/login`,
     `tests/playwright/login.spec.ts:4,7-9`), user-request modal, and 11 graph specs
     (nodes, edges, full SSE run simulation, boundary inputs, foreach/log/pipeline/
     split-code/switch/until/while nodes). Chromium-only; `webServer` block commented
     out — assumes the dev server already runs on :8110 (`playwright.config.ts:97-102`).
   - **Karma — configured but broken**: `angular.json` test target points at
     `"main": "src/test.ts"` which does not exist (only `src/karma-test.ts` exists);
     `karma.conf.js` is a stale leftover. Jest is the real runner.
   - **Coverage**: thresholds statements 25 / branches 5 / functions 15 / lines 25
     (`workdocs/reports/jest.coverage.config.ts`); last published report: lines 30.74%,
     statements 30.85%, functions 19.00%, branches 11.35%
     (`workdocs/reports/RELEASE_NOTES.md:19-24`).
   - **Notable gaps**: no specs for `NgxRenderingEngine` itself, `DynamicModule`, any
     engine directive, all four services, both pipes, utils, or the i18n `Loader` (only
     exercised via `I18nFakeLoader`); components without specs: card, container,
     file-upload, filter, icon, layout, modal/modal-confirm, model-builder,
     stepped-form; graph without specs: `GraphExecutionService`, keyboard shortcuts,
     ghost/selection/node-config stores, and all graph components.
   - **Notable quality**: several specs are explicit regression tests (list
     modal-selection, component-renderer prop merging, bookmark pagination,
     overrides bookmark recovery).

10. **Usage example**
    - Render a model in a page (real, from the demo app —
      `src/app/pages/crud/crud.page.html:7-11`):
      ```html
      <ngx-decaf-model-renderer
        [model]="model"
        (listenEvent)="handleSubmit($event)"
        [globals]="globals"
      ></ngx-decaf-model-renderer>
      ```
    - Register a custom dynamic component (real, from
      `src/lib/engine/decorators.spec.ts:21-49`, abridged):
      ```typescript
      @Dynamic()
      @Component({
        selector: 'ngx-decaf-decorator-test-form-field-component',
        standalone: true,
        imports: [ForAngularCommonModule, IonInput, /* ... */],
      })
      class DecoratorTestFormFieldComponent extends CrudFieldComponent {}
      ```
    - Application bootstrap (real, `src/app/app.config.ts:30-65`, abridged):
      ```typescript
      provideIonicAngular({ mode: 'md' }),
      provideDecafDbAdapter(RamAdapter, { user: 'user', dbName: 'for-angular' }),
      provideRouter(routes, withComponentInputBinding()),
      provideDecafPageTransition(),
      provideDecafDynamicComponents(AppExpiryDateFieldComponent, AppSwitcherComponent,
        AppSelectFieldComponent, CronSelectorFieldComponent),
      provideDecafI18nConfig({ fallbackLang: 'en', lang: 'en' },
        [{ prefix: './assets/i18n/', suffix: '.json' }]),
      ```
    - i18n in a test (real, `src/lib/components/list/list.component.spec.ts:16-25`):
      ```typescript
      const imports = [
        ForAngularCommonModule,
        ListComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: I18nFakeLoader },
        }),
      ];
      ```

11. **Relationships**
    - `@decaf-ts/ui-decorators` — the contract provider: `RenderingEngine`,
      `DecafComponent`, `DecafEventHandler`, `DecafTranslateService`, `Renderable`,
      `FieldProperties`, `IDecafRouter/Spinner/Toast/Modal`, `UIModelMetadata`,
      `ComponentEventNames`, `UIKeys`, plus the `ui-decorators/graph` subpath
      (`@graph`/`@node`/`@input`/`@output` decorators, `graphDefinitionOf`,
      `graphWorkflowDefinitionOf`, snapshot functions).
    - `@decaf-ts/decorator-validation` — `Model`, `Validation`, `Primitives`,
      `ModelKeys`, `DEFAULT_PATTERNS`; drives field types and validators.
    - `@decaf-ts/db-decorators` — `OperationKeys`, `CrudOperations`, `InternalError`.
    - `@decaf-ts/core` — `Repository`, `ModelService`, `Service`, `Adapter`,
      `Condition`, `Paginator`; `core/ram` provides `RamAdapter`/`RamFlavour` used by the
      demo and by `NgxSessionAdapter`'s type surface.
    - `@decaf-ts/integrations` — graph only: `integrations/graph/shared` types
      (`GraphExecutionEvent`, `GraphVisualState`, `GraphNodeInspectionPayload`,
      `GraphRunLogEntry`, `SwitchNodeMetadata`, node classes like `LogFlowNode`,
      `GRAPH_TRIGGER_NODES`/`GRAPH_FLOW_CONTROL_NODES`/`GRAPH_AGENT_NODES`) and the
      NestJS graph backend that `npm run start:backend` runs.
    - `@decaf-ts/for-http` — `AxiosHttpAdapter`/`AxiosFlavour` (base of
      `DecafAxiosHttpAdapter`) and `ServerEventConnector` (SSE).
    - `@decaf-ts/decoration` — `Metadata`, `apply`, `Constructor`, `uses`.
    - `@decaf-ts/logging` — `LoggedClass`, `Logger`, `sf`, `LoggedEnvironment`.
    - `@decaf-ts/transactional-decorators` — `Lock`/`MultiLock` in `NgxSessionAdapter`.
    - `@decaf-ts/injectable-decorators` — `InjectablesRegistry` (`utils/helpers.ts:34`).
    - Upstream consumers: `demo`, `demo/angular/ew`, `demo/angular/ionic`, `web-page`
      (the decaf-ts website is itself a for-angular app), `bin/releases/dist-angular`.

12. **Consumer notes**
    - **Version drift**: package is `0.5.20` while release docs reference `v0.0.47`
      (`workdocs/reports/RELEASE_NOTES.md:3`) and `0.0.80`
      (`workdocs/reports/DEPENDENCIES.md:7`) — the reports predate the current version
      scheme; treat doc-stated versions as unreliable.
    - **Unpinned decaf peers**: every decaf peer dependency is `"latest"`
      (`package.json:115-135`); consumers get whatever is current on the registry.
    - **Angular 21 + Ionic 8 + standalone components**, but the library still exposes
      NgModules (`ForAngularCommonModule`, `ForAngularComponentsModule`) — import the
      common module in the root for forms/translation + engine boot.
    - **`@decaf-ts/overrides/ui-decorators`**: bare side-effect import present in the
      published FESM (`dist/lib/fesm2022/decaf-ts-for-angular.mjs:11`) but
      `@decaf-ts/overrides` is **not an npm package** (registry 404); it resolves only
      via the monorepo's tsconfig `paths` alias to
      `@decaf-ts/ui-decorators/lib/esm/model/overrides.js`
      (`tsconfig.json:34-35`). External consumers must replicate that alias or the
      import fails.
    - **Graph is not published**: no secondary entry point (`ng-package.json` has a
      single entry; `package.json` exports only `./assets/*`); the FESM contains zero
      graph code. Graph consumers must work from the monorepo (demo app imports via the
      `src/graph` path alias).
    - **Security**: `DecafAxiosHttpAdapter.token` is a hardcoded, now-expired Keycloak
      JWT shipped in source and dist (`src/lib/engine/overrides.ts:32-33`) — do not
      reuse this adapter pattern; rotate the credential.
    - **i18n default prefix** `./app/assets/i18n/` (`src/lib/i18n/Loader.ts:77`) does not
      match the demo app's `./assets/i18n/` — omitting the resource config in a stock
      app layout will 404.
    - **`package.json` has no `description`**; the README's description is wrong
      (Inaccuracies #1).
    - **Schematics** are minimal: a stub `schematics` command, a `component` generator
      (alias `c`), and a `page` generator that also edits `app.routes.ts`; everything
      else is inherited from `@schematics/angular`
      (`schematics/collection.json`).
    - **Demo app doubles as the E2E fixture** (Playwright drives `:8110`) and as the
      Storybook data source (stories import app models/components). The PWA `www/`
      output dir is currently empty.
    - **Coverage is low** (~30% lines, ~11% branches per the last report) and the
      thresholds are correspondingly low; the core engine has no direct unit test.

13. **Inaccuracies found**
    1. **[for-angular]** README/package description — "A very versatile persistence
       layer. from smart contracts, Digital wallets or just regular database access"
       describes a persistence package, not an Angular UI library. | Evidence:
       `workdocs/4-Description.md:3` (compiled into `README.md:41`); `package.json` has
       no `description` field. | Suggested fix: replace with an accurate one-liner about
       the Angular rendering engine + graph editor.
    2. **[for-angular]** workdocs/graph import path — docs show `import ... from
       "@decaf-ts/for-angular/graph"`, but no such entry point exists: `ng-package.json`
       has a single entry (`src/lib/public-apis.ts`), `public-apis.ts` does not export
       graph, and the FESM bundle contains no graph code. | Evidence:
       `workdocs/graph/execution-events.md:10,35,79`; `ng-package.json:5-7`;
       `dist/lib/fesm2022/decaf-ts-for-angular.mjs` (0 matches for
       `GraphExecutionService`). | Suggested fix: document that graph is in-repo only
       (imported via `src/graph` in the demo) or add a secondary entry point.
    3. **[for-angular]** workdocs/graph pinning API — `pinning-ui.md` documents
       `GraphExecutionService.pinNode()`/`unpinNode()` and a `GraphPinningError`; none
       exist. The only `pinNode` is a local CSS-class toggle on the node template. |
       Evidence: `workdocs/graph/pinning-ui.md:7,26-34,85`;
       `src/graph/components/graph-node-template/graph-node-template.component.ts:407`. |
       Suggested fix: rewrite around the real mechanism (`node.pinned`/`node.unpinned`
       events → `graphExecutionState`), or implement the documented API.
    4. **[for-angular]** workdocs/graph engine-config token — `execution-events.md`
       documents a `GRAPH_EXECUTION_ENGINE_CONFIG` token and
       `GraphNodeExecutorRegistry` for custom engine configuration; neither exists
       anywhere in `src/`. | Evidence: `workdocs/graph/execution-events.md:76-89`; grep
       over `src/` returns no matches. | Suggested fix: remove, or document the actual
       `GRAPH_BACKEND_URL` token (`src/graph/execution/GraphExecutionService.ts:26-29`).
    5. **[for-angular]** workdocs/graph "wraps the engine" — "The GraphExecutionService
       is an Angular @Injectable() that wraps the engine" is misleading: it is an
       HTTP+SSE client to a remote NestJS backend; no engine code runs in the browser. |
       Evidence: `workdocs/graph/execution-events.md:7` vs
       `src/graph/execution/GraphExecutionService.ts:4-8` ("No execution engine code runs
       in the browser"). | Suggested fix: reword as a remote-execution client.
    6. **[for-angular]** For Developers tutorial — build system — claims `build`/
       `build:prod` run "via gulp `gulpfile.js`" and lists `gulpfile.js` in the repo
       structure; no gulpfile exists; the build is `ng build` + ng-packagr. | Evidence:
       `workdocs/tutorials/For Developers.md:53-54,213`; `package.json:21-22`. |
       Suggested fix: update to ng-packagr/`ng build`.
    7. **[for-angular]** For Developers tutorial — test scripts — claims `test` defaults
       to `test:unit` and that `test:unit`/`test:integration`/`test:circular` exist; the
       actual scripts are `test` → `test:all` (Jest), plus `test:components`,
       `test:services`, `test:single`. | Evidence: `workdocs/tutorials/For
       Developers.md:55-59,92-96`; `package.json:27-30,59`. | Suggested fix: list the
       real scripts.
    8. **[for-angular]** For Developers tutorial — release script name — documents
       `./bin/tag_release.sh`; the actual script is `./bin/tag-release.sh`. | Evidence:
       `workdocs/tutorials/For Developers.md:66`; `package.json:36`. | Suggested fix:
       correct the filename.
    9. **[for-angular]** For Developers tutorial — `do-install` env var — claims
       `do-install` "sets a `TOKEN` environment variable to the contents of `.token`";
       the script actually sets `NPM_TOKEN` from `.npmtoken`. | Evidence:
       `workdocs/tutorials/For Developers.md:45`; `package.json:13`. | Suggested fix:
       correct env var and file name.
    10. **[for-angular]** For Developers tutorial — repo structure — lists
        `bin/tag_release.cjs`, `bin/template-setup.cjs`, a `.run` folder, and
        `tests/unit|integration|bundling`; none of these exist (actual `bin/` =
        `build-schematics.js`, `build-scripts.cjs`, `tag-release.cjs`,
        `tag-release.sh`, `update-scripts.cjs`; `tests/` = Playwright only). | Evidence:
        `workdocs/tutorials/For Developers.md:224-249`. | Suggested fix: regenerate the
        structure listing from the repo.
    11. **[for-angular]** Contributing tutorial — "We don't have any useful tests yet,
        contributions are welcome!" contradicts the 37 Jest spec files and 13 Playwright
        specs in the repo. | Evidence: `workdocs/tutorials/Contributing.md:33`. |
        Suggested fix: remove or update the note.
    12. **[for-angular]** DECORATORS_USAGE.md import — `import { Service, Repository }
        from '@decaf-ts/for-angular'` — neither `Service` nor `Repository` is exported by
        the for-angular barrel; they come from `@decaf-ts/core` (imported aliased, not
        re-exported). | Evidence: `DECORATORS_USAGE.md:8`;
        `src/lib/engine/decorators.ts:2`; dist export list (no `Service`/`Repository`). |
        Suggested fix: import them from `@decaf-ts/core`.
    13. **[for-angular]** version drift in release docs — "Last tag: v0.0.47" and
        `@decaf-ts/for-angular@0.0.80` vs the actual `0.5.20`. | Evidence:
        `workdocs/reports/RELEASE_NOTES.md:3`; `workdocs/reports/DEPENDENCIES.md:7`;
        `package.json:3`. | Suggested fix: regenerate the release reports.
    14. **[for-angular]** README package-size placeholder — `##PACKAGE_SIZE##` is never
        substituted; the compiled README shows "Minimal size: unknown kb gzipped". |
        Evidence: `workdocs/2-Badges.md:30`; `README.md:36`. | Suggested fix: fill in the
        real size or drop the line.
    15. **[for-angular]** stale Karma test wiring — the `angular.json` test target points
        at `"main": "src/test.ts"`, a file that does not exist (only
        `src/karma-test.ts` exists); `karma.conf.js` is a leftover while Jest is the
        active runner. | Evidence: `angular.json:185`; `jest.config.ts:1-6`. | Suggested
        fix: remove the Karma target/config or fix the main file.
    16. **[for-angular]** dead/broken environments file — `src/environments/environment.ts`
        is imported nowhere; its header claims `ng build` replaces it with
        `environment.prod.ts`, which does not exist (and `angular.json` has no
        `fileReplacements`); additionally `env.api.host + '/v1' || 'localhost:3000'` is a
        dead fallback that would throw when `window.ENV` is unset. | Evidence:
        `src/environments/environment.ts:1-12` (no importers found by grep). | Suggested
        fix: wire it into the app or delete it.
    17. **[for-angular]** graph module JSDoc copy-paste —
        `for-angular-graph-components.module.ts` JSDoc describes lib components
        ("re-exports components like `ListComponent`, `PaginationComponent`,
        `SearchbarComponent`") that it does not contain. | Evidence:
        `src/graph/components/for-angular-graph-components.module.ts:2-9`. | Suggested
        fix: rewrite the doc comment for the graph module.
    18. **[for-angular]** selector collision — both `GraphRendererComponent` and
        `GraphRenderer2Component` declare `selector: 'app-graph-renderer'`. | Evidence:
        `src/graph/components/graph-renderer/graph-renderer.component.ts:57`;
        `src/graph/components/renderer/renderer.component.ts:21`. | Suggested fix: rename
        one selector.
    19. **[for-angular]** duplicate module entry — `ForAngularComponentsModule` lists
        `CrudFormComponent` twice in its component array. | Evidence:
        `src/lib/components/for-angular-components.module.ts:35,44`. | Suggested fix:
        remove the duplicate.
    20. **[for-angular]** hardcoded JWT in published code — `DecafAxiosHttpAdapter.token`
        contains a hardcoded Keycloak bearer token (expired ~2026-07-12) shipped in
        source and the dist bundle. | Evidence: `src/lib/engine/overrides.ts:32-33`. |
        Suggested fix: move the credential to runtime config and rotate it.
    21. **[for-angular]** unresolvable bare import in the published bundle — the FESM
        contains `import '@decaf-ts/overrides/ui-decorators'`, but `@decaf-ts/overrides`
        is not an npm package (registry 404); it resolves only via the monorepo's
        tsconfig `paths` alias. | Evidence:
        `dist/lib/fesm2022/decaf-ts-for-angular.mjs:11`; `tsconfig.json:34-35`;
        `npm view @decaf-ts/overrides` → 404. | Suggested fix: publish the overrides
        package or resolve/inline the alias at build time.
    22. **[for-angular]** skipped decorator spec — the only test in
        `decorators.spec.ts` is `xit`, so the `@Dynamic()` decorator has no active test. |
        Evidence: `src/lib/engine/decorators.spec.ts:53`. | Suggested fix: enable/fix the
        test.
    23. **[for-angular]** i18n default resource prefix — `I18nLoaderFactory` falls back
        to `./app/assets/i18n/`, which does not match the demo app layout
        (`./assets/i18n/`); consumers who omit the resource config will 404. | Evidence:
        `src/lib/i18n/Loader.ts:77`; `src/app/app.config.ts:53-65`. | Suggested fix:
        align the default with the documented layout or document it explicitly.
    24. **[for-angular]** `NgxSessionAdapter` not in the public API — a full
        localStorage-persisted adapter implementation that is exported from no barrel and
        is tree-shaken out of the dist bundle (unreachable from the entry point). |
        Evidence: `src/lib/engine/index.ts` (no export);
        `dist/lib/fesm2022/decaf-ts-for-angular.mjs` (no `class NgxSessionAdapter`). |
        Suggested fix: export it if intended as public API, or move it to the demo app.
