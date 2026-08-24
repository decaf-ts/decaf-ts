# Research Brief 12 — React/Next engines & styles

- **Scope:** `for-react`, `for-nextjs`, `styles` in `/workspaces/decaf-ts`
- **Issue:** SAA-168 (SAA-156 R12)
- **Method:** read-only review of `src/`, `tests/`, `package.json`, README/workdocs, build scripts, git history, and installed `node_modules` versions. No tests or builds were run. All claims cite file paths (line numbers where useful).
- **Repo context:** each module is its own git submodule inside the `decaf-ts` umbrella repo. for-react HEAD `08e61c1`, for-nextjs HEAD `d5d65eb`, styles HEAD `56a5976` (all on `master`, last commits "DECAF-809" infra/vuln batches).

**Headline:** `for-react` is a real but early (v0.0.1) React port of the decaf rendering engine with a working core (engine, form service, validators, registry) and 10 components, but with broken packaging (missing build output, missing declared dependency, components absent from the public barrel). `for-nextjs` is a bare `create-next-app` scaffold that declares decaf dependencies but contains zero decaf code and no library entry point. `styles` is a mature, self-contained SCSS design system (tokens, utilities, Ionic overrides, dark theme) with a small number of real CSS bugs (undefined `--dfc-*`/`--dcf-font-family` variables) and stale committed artifacts.

---

## for-react (`@decaf-ts/for-react` v0.0.1)

### 1. Identity
- **Dir:** `/workspaces/decaf-ts/for-react` (git submodule, branch `master`)
- **Package:** `@decaf-ts/for-react` **v0.0.1**
- **Description (package.json:4):** "decaf-ts react rendering engine"
- **Type:** `"type": "module"`, MIT license, author "Tiago Venceslau"
- **Entry declarations:** `exports.require → ./lib/index.cjs`, `exports.import → ./lib/esm/index.js`, `types → lib/index.d.ts` (package.json:6-10). **`lib/` does not exist in the repo** — only a CRA static output in `build/`.

### 2. Purpose & role
React implementation of the decaf rendering-engine layer, the React counterpart of `for-angular` (v0.5.20, the mature Angular engine). It extends the framework-agnostic `RenderingEngine` abstraction from `@decaf-ts/ui-decorators` with flavour `"react"`, converting decorated decaf models (`@uimodel`, `@uilayout`, etc.) into React element trees. It provides a tag-based component registry, a form-state service with nested forms, a validator factory bridging `@decaf-ts/decorator-validation`, i18n loading, and a set of `Rgx*` React components (card, crud field/form, layout, icon, empty state, pagination, searchbar, component/model renderer). It is clearly early-stage: v0.0.1, one unit-test file, and packaging that does not yet produce a consumable artifact.

### 3. Dependencies
**Declared runtime decaf deps (all pinned `"latest"`, package.json dependencies):** `@decaf-ts/core`, `db-decorators`, `decoration`, `decorator-validation`, `for-http`, `injectable-decorators`, `logging`, `reflection`, `styles`, `transactional-decorators`, `ui-decorators`.

**Actually imported by `src/`** (grep counts): `ui-decorators` (12), `decorator-validation` (11), `db-decorators` (5), `core` (3), `logging` (1), `injectable-decorators` (1). **Declared but never imported:** `styles`, `reflection`, `for-http`, `transactional-decorators`, `decoration` (template-inherited dependency list).

**Missing declaration:** `@faker-js/faker` is imported at `src/lib/utils/DecafFakerRepository.ts:1` but appears in neither `dependencies` nor `devDependencies`, and is not installed in `node_modules`.

**Key external dev deps:** `react` ^19.2.0, `react-dom` ^19.2.0 (both in **devDependencies**, package.json:89-90), `react-scripts` 5.0.1 (CRA), `@testing-library/react` ^16, `typescript` ^4.9.5, `web-vitals`.

**Modules depending on for-react:** none in the monorepo. (`for-react-native` is a separate Expo app and does not depend on it.)

### 4. Architecture & structure
```
src/
  lib/                      # the actual library
    index.ts                # re-exports ./public-apis
    public-apis.ts          # public barrel: engine, directives, services, utils, i18n, for-react-common
    for-react-common.ts     # DB adapter provider, model repository lookup, logger, i18n tokens
    engine/
      RgxRenderingEngine.tsx  # extends ui-decorators RenderingEngine, flavour "react"
      ComponentRegistry.ts    # static Map<tag, ReactComponent>
      RgxFormService.ts       # static form registry, dot-path values, nested child forms
      ValidatorFactory.ts     # field-props → decorator-validation validators
      RgxEventHandler.ts      # RgxEventEmitter (Set-based pub/sub)
      RgxComponentDirective.ts        # base class: uid, locale, model→repository, events
      RgxParentComponentDirective.ts  # layout metadata (rows/cols/gap/card)
      RgxFormDirective.ts           # CRUD form shared props + submit event
      RgxFormFieldDirective.ts      # field metadata (name/path/type/required/updateMode)
      RgxPageDirective.ts / RgxModelPageDirective.ts  # pagination/stepped-form metadata
      RgxRenderableComponentDirective.ts  # child-definition rendering wrapper
      constants.ts          # ReactEngineKeys, BaseComponentProps, event names, defaults
      decorators.ts         # no-op Dynamic() for API parity with Angular
      DynamicModule.ts      # placeholder for API parity
      interfaces.ts / types.ts
    components/             # 10 Rgx* React components + register-defaults.ts (NOT in public barrel)
      card/ component-renderer/ crud-field/ crud-form/ layout/ model-renderer/
      icon/ empty-state/ pagination/ searchbar/
    i18n/                   # I18nLoader, I18nFakeLoader, getLocaleContext*, data/en.json + pt.json
    services/               # RgxMediaService (resize/color-scheme/SVG), re-exports RgxFormService
    utils/                  # helpers.ts (window/date/mapper/string utils), DecafFakerRepository.ts
    directives/             # RgxSvgDirective (abstract SVG-injection helper)
  App.tsx, App.test.tsx, index.tsx, reportWebVitals.ts, logo.svg, *.css  # CRA boilerplate
  public/                   # CRA static assets
build/                      # committed CRA build output (stale, 2026-03-03)
tests/unit/engine.spec.ts   # the only spec
tests/integration/          # .gitlock only
```

### 5. Public API surface (from `src/lib/index.ts` → `public-apis.ts`)
- **Engine:** `RgxRenderingEngine` (render model → React node), `RgxComponentRegistry` (register/get/clear tag→component), `RgxFormService` (get/remove/mountFormIdPath; controls, values, submit/reset/setValue/getValues/getParsedData), `ValidatorFactory` (spawn/supportedKeys/validatorsFromProps), `RgxEventEmitter`, directive base classes (`RgxComponentDirective`, `RgxParentComponentDirective`, `RgxFormDirective`, `RgxFormFieldDirective`, `RgxPageDirective`, `RgxModelPageDirective`, `RgxRenderableComponentDirective`), `Dynamic()` (no-op), `DynamicModule` (placeholder).
- **Constants:** `ReactEngineKeys` (FLAVOUR="react", CHILDREN, `__rgxChildren`, DARK_PALETTE_CLASS, …), `BaseComponentProps` enum, `CssClasses`, `FormConstants`, `ComponentEventNames`, `RouteDirections`, `ListComponentsTypes`, `DefaultFormReactiveOptions`, `DefaultListEmptyOptions`, `ActionRoles`, `WindowColorSchemes`, `ElementSizes`, `ElementPositions`, `LayoutGridGaps`, `ListItemPositions`.
- **Types/interfaces:** `KeyValue`, `ControlFieldProps`, `RgxCrudFieldProps`, `Option`, `FieldUpdateMode`, `DecafRepository`, `IBaseCustomEvent`, `ICrudFormOptions`, `IListEmptyOptions`, `IComponentProperties`, `IFilterQuery`, `IPaginationCustomEvent`, `I18nResourceConfig`, etc.
- **Directives:** `RgxSvgDirective` (abstract; `injectSvg` via media service).
- **Services:** `RgxMediaService` (onResize/onColorSchemeChange/isDarkMode/toggleDarkPalette/loadSvg/dispose), `RgxFormService` (re-export).
- **Utils:** `getWindow`, `getWindowDocument`, `getOnWindow`, `setOnWindow`, `getWindowWidth`, `getOnWindowDocument`, `isDevelopmentMode`, `windowEventEmitter`, `getInjectablesRegistry`, `isNotUndefined`, `getLocaleFromClassName`, `getLocaleLanguage`, `generateRandomValue`, `stringToBoolean`, `isValidDate`, `formatDate`, `parseToValidDate`, `itemMapper`, `dataMapper`, `removeFocusTrap`, `cleanSpaces`, `isDarkMode`, `filterString`.
- **i18n:** `I18nLoader` (getTranslation merging built-in `en.json` with fetched resources), `I18nFakeLoader`, `getLocaleContext`, `getLocaleContextByKey`, `provideI18nLoader`.
- **for-react-common:** `DB_ADAPTER_PROVIDER`, `LOCALE_ROOT_TOKEN`, `I18N_CONFIG_TOKEN` (symbols), `provideDynamicComponents`, `getLogger`, `getModelRepository`, `provideDbAdapter`.
- **Not exported from the barrel:** the entire `components/` group — `RgxCard`, `RgxComponentRenderer`, `RgxCrudField`, `RgxCrudForm`, `RgxLayout`, `RgxModelRenderer`, `RgxIcon`, `RgxEmptyState`, `RgxPagination`, `RgxSearchbar`, and `registerDefaultComponents` (see Inaccuracies #6).

### 6. Key patterns & concepts
- **Rendering-engine flavour:** `RgxRenderingEngine` extends `RenderingEngine<ReactNode, FieldDefinition>` from ui-decorators with flavour `"react"`; the base constructor self-registers the instance in a static cache and logs "decaf's react rendering engine loaded". `render(model, globalProps)` delegates model→`FieldDefinition` conversion to the base class (`toFieldDefinition`, driven by model UI metadata), then maps the definition tree to React elements.
- **Tag-based component registry:** `RgxComponentRegistry` is a static `Map<string, ReactComponent>`. Components are looked up at render time by `def.tag`; `registerDefaultComponents()` (idempotent via a module flag) registers the 10 built-ins under Angular-style tags `ngx-decaf-card`, `ngx-decaf-crud-field`, `ngx-decaf-crud-form`, `ngx-decaf-layout`, `ngx-decaf-icon`, `ngx-decaf-searchbar`, `ngx-decaf-empty-state`, `ngx-decaf-pagination`, `ngx-decaf-component-renderer`, `ngx-decaf-model-renderer`.
- **Form service (static, per renderer):** `RgxFormService.get(id)` lazily creates forms keyed by renderer id (default `"root"`). Controls are keyed by the last dot-path token; `childOf` delegates control creation to child form services (`addChild`); `getControl` supports the `$parent` token. `getParsedData()` recurses into child forms and type-converts values (number → `parseToNumber`, date/datetime-local → `Date`, other strings → `escapeHtml`).
- **Validator factory:** reads validation keys present on field props (`ValidatorFactory.supportedKeys()` = `Validation.keys()` from decorator-validation), spawns per-key validators (with default patterns for `password`/`email`/`url`), and composes them first-error-wins; the composed `validateFn` is attached to the control by `RgxFormService.addFormControl`.
- **DB adapter bridging via window:** `provideDbAdapter(AdapterClass, options, flavour?)` instantiates an adapter and stores its flavour on `window[DB_ADAPTER_PROVIDER]`; `getModelRepository(model)` resolves the model constructor via `Model.get`, applies `uses(flavour)` when a flavour is present, and returns `Repository.forModel(constructor)`.
- **i18n:** locale keys are derived from component class names (`getLocaleFromClassName`: camelCase → dot-separated, reversed when <3 parts); `I18nLoader.getTranslation(lang)` merges the built-in `en.json` defaults with fetched JSON resources (`prefix + lang + suffix`, optional date-based version query string).
- **Event emitter:** minimal `RgxEventEmitter` (Set of listeners, `subscribe` returns unsubscribe) used for component events and form submit events — the React replacement for Angular's `EventEmitter`.
- **Directive base classes:** the Angular `Ngx*` directive hierarchy is ported as plain TypeScript abstract base classes (`RgxComponentDirective` → `RgxParentComponentDirective` → `RgxFormDirective`/`RgxPageDirective` → `RgxModelPageDirective`; plus `RgxFormFieldDirective`, `RgxRenderableComponentDirective`) carrying shared state (uid, locale, model, operations, layout metadata) with no Angular dependency.

### 7. Lifecycle / configuration / environment
- **Boot:** importing the package has a side effect — `RgxModelRenderer.tsx` creates a module-level `defaultEngine = new RgxRenderingEngine()` and calls `initialize()` at import time. Host apps are expected to call `registerDefaultComponents()` (or register custom tags) and, when persisting, `provideDbAdapter(...)`.
- **Flavours:** rendering flavour `ReactEngineKeys.FLAVOUR = "react"`; DB adapter flavour via `window[DB_ADAPTER_PROVIDER]`.
- **Env vars:** none consumed. Configuration is window-global based (`DB_ADAPTER_PROVIDER`); `isDevelopmentMode` checks `process.env.NODE_ENV` plus `window.env.CONTEXT`/hostname.
- **Defaults:** `DefaultFormReactiveOptions` (Submit/Clear buttons), `DefaultListEmptyOptions`, `pk = "id"`, locale from `navigator.language` (fallback `"en"`), searchbar debounce 500 ms, `translatable = true`, `enableDarkMode = true`.

### 8. Data & control flow
- **Model rendering:** `<RgxModelRenderer model={X} globals={...}/>` → if `model` is a string, `Model.build({}, model)` → `engine.render(instance, globals)` → base `toFieldDefinition` (metadata-driven) → `fromFieldDefinition`: resolve `rendererId` (or random), fetch/create `RgxFormService`, merge `def.props`, extract children definitions (keys `__rgxChildren` / `children`), call `form.addFormControl` when the control has `path`/`name` (attaching validators), look up the component in the registry by `def.tag` (warn + `null` if missing), render children recursively, and return `<Component key={rendererId.path}>`.
- **CRUD form flow:** `RgxCrudForm` (operation CREATE/UPDATE/DELETE/READ; READ/DELETE render a non-form section) renders children plus a button grid (Delete for DELETE, Submit for CREATE/UPDATE, Clear when configured). Fields (`RgxCrudField`) write through `formProvider.setValue(path, value)`; submit → `formProvider.getParsedData()` (typed) → `onSubmit(data)` and `submitEvent.emit`; reset → `formProvider.reset()` + `onCancel()`.
- **Media/theme:** `RgxIcon`/`RgxMediaService` subscribe to `window` resize and `matchMedia("(prefers-color-scheme: dark)")`; `toggleDarkPalette` toggles the `dcf-palette-dark` class consumed by the `styles` package.

### 9. Testing
- **Structure:** `tests/unit/engine.spec.ts` (the only spec, 97 lines); `tests/integration/` contains only `.gitlock`; `tests/workspace-target.ts` is a helper. `jest.config.cjs`: ts-jest transform, `testEnvironment: "node"`, `testRegex: /tests/.*\.(test|spec)\.(ts|tsx)$`.
- **Covered:** `RgxEventEmitter` emit/subscribe/unsubscribe; `RgxComponentRegistry` register/get; `RgxRenderingEngine.fromFieldDefinition` (invoked via `(engine as any)`, asserts a valid React element); `RgxFormService` value storage + number parsing, nested child forms via `childOf`, `validateFn` attachment (email + required); `ValidatorFactory.spawn` required-field behavior.
- **Notable gaps:** no tests for any of the 10 components, `RgxMediaService`, i18n loaders, `DecafFakerRepository`, or the utils; no integration tests; `src/App.test.tsx` is CRA boilerplate outside the jest `testRegex`.

### 10. Usage example (derived from `tests/unit/engine.spec.ts`)
```tsx
// Render a field definition through the engine + registry (engine.spec.ts:33-49)
const Tag = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="rendered">{children}</div>
);
RgxComponentRegistry.register("demo", Tag);
const engine = new RgxRenderingEngine();
engine.initialize();
const node = (engine as any).fromFieldDefinition({
  tag: "demo",
  props: { name: "demoField" },
  children: [],
});
// node is a valid React element
```
```ts
// Form state with typed parsing (engine.spec.ts:51-64)
const form = RgxFormService.get("test");
form.addFormControl({ name: "age", type: HTML5InputTypes.NUMBER, defaultValue: "42" });
form.setValue("age", "10");
form.getParsedData(); // { age: 10 }  (string "10" parsed to number)
```

### 11. Relationships
- **Extends** `RenderingEngine` from `@decaf-ts/ui-decorators` — the same abstraction implemented by `for-angular`'s engine; flavour `"react"` distinguishes the two.
- **Uses** `@decaf-ts/decorator-validation` (`Model`, `Validation`, `Primitives`, `VALIDATION_PARENT_KEY`), `@decaf-ts/db-decorators` (`CrudOperations`, `OperationKeys`, `InternalError`), `@decaf-ts/core` (`Repository`, `uses`), `@decaf-ts/logging` (`Logging`), `@decaf-ts/injectable-decorators` (`InjectableRegistryImp`).
- **Sibling:** `for-angular` — for-react mirrors its directive naming (`Ngx*` → `Rgx*`) and keeps the same `ngx-decaf-*` component tags.
- **Styles:** declared as a dependency but never imported in `src/`; the `dcf-*` CSS classes used by components (e.g. `dcf-card`, `dcf-grid`, `dcf-palette-dark`) come from the `styles` package at the app level.
- **Depended on by:** nothing in the monorepo.

### 12. Consumer notes
- **Pre-release (v0.0.1):** treat as experimental; API is not stable.
- **React is a devDependency**, not a dependency/peer — a host that installs the package without its own React 19 will not get React from it.
- **Packaging is broken as committed:** `exports`/`types` point at `lib/` which only exists after `build:prod` (shared `build-scripts` tooling), and the `files` whitelist excludes all source (see Inaccuracies #2, #3).
- **Version drift:** installed published deps are far older than the workspace sources — e.g. `ui-decorators` 0.5.32 installed vs 0.19.1 in the workspace, `core` 0.5.45 vs 0.29.0, `styles` 0.0.21 vs 0.7.3. Against the workspace `ui-decorators`, `RgxRenderingEngine` would not compile (missing abstract `getModal`/`getToast`/`getSpinner`/`router`).
- **Angular carry-over:** `ngx-decaf-*` tags, "React equivalent of the Angular …" comments, and a no-op `Dynamic()`/`DynamicModule` for API parity.
- **CRA boilerplate mixed into the library** (`src/App.tsx`, `src/index.tsx`, `reportWebVitals.ts`, `public/`, committed `build/` output); `start`/`build` scripts are `react-scripts`, while `build:prod` is the library build.

### 13. Inaccuracies found
1. **[for-react]** README/workdocs — README and workdocs describe a generic "Typescript Template", not a React rendering engine; no module-specific documentation exists. | Evidence: `README.md:2-4` ("## Typescript Template … enterprise template for any standard Typescript project"); `workdocs/4-Description.md` identical. | Suggested fix: replace with a real README for `@decaf-ts/for-react` (install, boot, engine usage, component list).
2. **[for-react]** package entry points — `exports`/`types` reference `./lib/index.cjs`, `./lib/esm/index.js`, `lib/index.d.ts`, but no `lib/` directory exists in the repo (only CRA `build/` output); the package is unimportable until `build:prod` runs. | Evidence: `package.json:6-10`; `ls lib` → "No such file or directory". | Suggested fix: commit or generate `lib/` in CI before publish, or point exports at committed output.
3. **[for-react]** npm `files` whitelist — `files` lists only `workdocs/assets/slogans.json`, which does not exist in the repo, so `npm pack` would publish a package containing no source at all. | Evidence: `package.json:126-128`; `ls workdocs/assets/slogans.json` → "No such file or directory". | Suggested fix: include `lib` (and/or `dist`) in `files`; add or drop the slogans entry.
4. **[for-react]** missing dependency — `@faker-js/faker` is imported but declared nowhere and not installed; `DecafFakerRepository` cannot resolve at build/runtime. | Evidence: `src/lib/utils/DecafFakerRepository.ts:1` (`import { faker } from '@faker-js/faker'`); no `faker` in `package.json`; no `@faker-js` in `node_modules`. | Suggested fix: add `@faker-js/faker` to dependencies (or remove the faker repository).
5. **[for-react]** react/react-dom classification — a runtime rendering engine lists `react`/`react-dom` only in devDependencies. | Evidence: `package.json:89-90` (devDependencies); `src/lib/engine/RgxRenderingEngine.tsx:1` (`import React from "react"`). | Suggested fix: move to `peerDependencies` (with dev range for local tests).
6. **[for-react]** public barrel — `public-apis.ts` does not export `./components`, so all 10 `Rgx*` components and `registerDefaultComponents` are unreachable from the package entry (deep imports only). | Evidence: `src/lib/public-apis.ts:8-12` (exports engine/directives/services/utils/i18n/for-react-common only) vs `src/lib/components/index.ts:1-10`. | Suggested fix: add `export * from "./components";` or document deep-import paths.
7. **[for-react]** stale JSDoc — helper docs are copied from for-angular and repeatedly claim `@memberOf module:for-angular`. | Evidence: `src/lib/utils/helpers.ts:31,50,76,105,122,139,157,173` (and more). | Suggested fix: regenerate/fix module tags to `module:for-react`.
8. **[for-react]** dependency version drift — package resolves published `@decaf-ts/ui-decorators@0.5.32` while the workspace source is 0.19.1, whose `RenderingEngine` adds abstract `getModal`/`getToast`/`getSpinner`/`router` that `RgxRenderingEngine` does not implement (compile break against workspace source). | Evidence: `for-react/node_modules/@decaf-ts/ui-decorators/package.json:3` (0.5.32); `ui-decorators/src/ui/Rendering.ts:91-100` (abstract members); `for-react/src/lib/engine/RgxRenderingEngine.tsx` (implements only `initialize`/`render`). | Suggested fix: align dep resolution with the workspace (or implement the new abstract members).
9. **[for-react]** dead comparison in form service — `addFormControl` tests `childOf !== this.getFormIdPath().path`, but `getFormIdPath()` returns `{ formId }`, so `.path` is always `undefined` and the guard reduces to `childOf` truthiness. | Evidence: `src/lib/engine/RgxFormService.ts:43-45` vs `:71`. | Suggested fix: compare against `this.formId` (or remove the comparison).
10. **[for-react]** CRA boilerplate in library source — demo app files and committed build output ship inside the library package tree. | Evidence: `src/App.tsx:1-30` (CRA "Edit src/App.tsx" demo), `src/index.tsx` (ReactDOM.createRoot), `build/` (CRA output, dated 2026-03-03), `package.json:21-22` (`start`/`build` = react-scripts). | Suggested fix: move the demo app out of `src/` (e.g. `examples/`) and gitignore `build/`.
11. **[for-react]** test coverage — only the engine core is tested; components, i18n, media service, faker repository, and utils have zero tests; integration dir is empty. | Evidence: `tests/` tree (single `tests/unit/engine.spec.ts`; `tests/integration/.gitlock`). | Suggested fix: add component/service/i18n specs (delegate to Tester).
12. **[for-react]** tutorial vs scripts — the developer tutorial says `build` runs `npx build-scripts --dev` producing `lib`+`dist`, but this package's `build` script is `react-scripts build` (CRA). | Evidence: `workdocs/tutorials/For Developers.md` ("build – runs `npx build-scripts --dev`…") vs `package.json:22` (`"build": "react-scripts build"`); only `build:prod` uses build-scripts. | Suggested fix: update the tutorial or the script to match.
13. **[for-react]** unused declared dependencies — `styles`, `reflection`, `for-http`, `transactional-decorators`, `decoration` are declared but never imported in `src/`. | Evidence: dependency list in `package.json` vs import grep (only ui-decorators, decorator-validation, db-decorators, core, logging, injectable-decorators appear). | Suggested fix: prune the dependency list to what the code imports.

---

## for-nextjs (`@decaf-ts/for-nextjs` v3.9.7)

### 1. Identity
- **Dir:** `/workspaces/decaf-ts/for-nextjs` (git submodule, branch `master`, HEAD `d5d65eb`)
- **Package:** `@decaf-ts/for-nextjs` **v3.9.7**
- **Description (package.json:4):** "decaf-ts rendering engine for next-js"
- **Type:** no `type` field, MIT license, author "Tiago Venceslau"
- **Entry declarations:** **none** — no `main`, `exports`, `types`, or `module` fields.

### 2. Purpose & role
Intended as the Next.js rendering-engine counterpart of `for-angular`/`for-react`, but the package currently contains **no decaf engine code at all**: `src/` is a stock `create-next-app` scaffold (Next.js 16 App Router, React 19.2, Tailwind CSS v4, React Compiler enabled) whose only page is the default "Create Next App" landing page. It functions today as a placeholder/starter app, not as a library.

### 3. Dependencies
**Declared runtime decaf deps (all `"latest"`):** `@decaf-ts/core`, `db-decorators`, `decoration`, `decorator-validation`, `for-http`, `injectable-decorators`, `logging`, `reflection`, `styles`, `transactional-decorators`, `ui-decorators` — identical list to for-react (template inheritance). **None of them are imported anywhere in `src/`.**

**Key external deps:** `next` 16.0.3, `react` 19.2.0, `react-dom` 19.2.0 (dependencies); devDeps: `@decaf-ts/utils`, `tailwindcss` ^4 + `@tailwindcss/postcss`, `eslint` ^9 + `eslint-config-next` 16.0.3, `babel-plugin-react-compiler` 1.0.0, `typescript` ^5.

**Modules depending on for-nextjs:** none.

### 4. Architecture & structure
```
src/
  app/
    layout.tsx    # RootLayout: Geist + Geist_Mono via next/font/google, metadata "Create Next App"
    page.tsx      # default create-next-app landing page (links to Vercel/Next docs)
    globals.css   # Tailwind v4 (@import "tailwindcss"), @theme inline vars, dark scheme
    favicon.ico
  assets/
    icons/        # PWA-style webp icons (48..512)
    images/       # decaf logos (black/white/contrast), apple-touch-icon, favicon
public/           # create-next-app svgs (next.svg, vercel.svg, globe.svg, …)
tests/integration/.gitlock   # the only file under tests/
```
No `src/lib`, no engine, no components, no services.

### 5. Public API surface
**None.** With no `main`/`exports`/`types` fields, `@decaf-ts/for-nextjs` is not importable as a library; consumers can only run it as a Next.js application (`next dev`/`next build`/`next start`).

### 6. Key patterns & concepts
- Standard **Next.js App Router** patterns: root layout with `next/font/google` (Geist variable fonts), server-component home page, `Metadata` export.
- **Tailwind CSS v4** CSS-first configuration: `@import "tailwindcss"` + `@theme inline` mapping `--color-background`/`--font-sans` etc. (globals.css).
- **React Compiler enabled:** `next.config.ts` sets `reactCompiler: true` (paired with `babel-plugin-react-compiler` 1.0.0 in devDeps).
- No decaf patterns (no flavours, registries, decorators, or services) are present.

### 7. Lifecycle / configuration / environment
- **Boot:** `npm run dev` / `build` / `start` (Next.js). No decaf initialization, no flavours, no env vars beyond Next.js defaults; page metadata is hard-coded ("Create Next App").
- **Build config:** `next.config.ts` (reactCompiler only); `postcss.config.mjs` (Tailwind v4 plugin); `tsconfig.json` (strict, bundler resolution, `@/*` → `./src/*`, experimental decorators + emitDecoratorMetadata enabled though unused).

### 8. Data & control flow
Static landing page only: no data fetching, no API routes, no server actions, no decaf model flow. The request path is the default Next.js App Router render of `page.tsx`.

### 9. Testing
- **Structure:** `tests/` contains only `tests/integration/.gitlock` — **zero tests**.
- `jest.config.cjs` exists (ts-jest, node env, `testRegex: /tests/`) and `package.json` carries template test scripts (`test:unit`, `test:integration`, `test:all`, `test:dist` with `TEST_TARGET=lib|dist`, `coverage`, `test:circular`), all of which are inert or broken for this package (no tests; no `lib`/`dist`; `test:circular` targets a non-existent `./src/index.ts`).

### 10. Usage example
None — there is no library API to use. The only runnable artifact is the scaffold app itself:
```bash
npm run dev   # serves the default create-next-app page at http://localhost:3000
```

### 11. Relationships
- **Intended sibling** of `for-angular`/`for-react` in the rendering-engine layer (third framework target), but with no code relationship today.
- Declared decaf dependencies mirror for-react's list verbatim (template inheritance); none are used.
- Not consumed by any other module.

### 12. Consumer notes
- **Not consumable as a library** (no entry point); the `3.9.7` version is anomalous versus 0.x siblings (for-react 0.0.1, for-angular 0.5.20, styles 0.7.3).
- **Dockerfile is a broken template copy** (see Inaccuracies #8).
- **Two conflicting ESLint flat configs** ship in the repo.
- `next-env.d.ts` references `.next/types/routes.d.ts`, so typechecking requires a prior `next build`/`next dev`.
- Installed decaf deps are old published versions (core 0.6.0 vs workspace 0.29.0, ui-decorators 0.5.32 vs 0.19.1, styles 0.0.21 vs 0.7.3).

### 13. Inaccuracies found
1. **[for-nextjs]** package description vs reality — description claims "decaf-ts rendering engine for next-js", but no engine code exists; `src/` is the unmodified create-next-app shell. | Evidence: `package.json:4`; `src/app/layout.tsx:16-17` (metadata "Create Next App" / "Generated by create next app"); `src/app/page.tsx:8-10` ("To get started, edit the page.tsx file."). | Suggested fix: either implement the engine or change the description to "Next.js starter/scaffold".
2. **[for-nextjs]** README/workdocs — generic "Typescript Template" text identical to the ts-workspace template; says nothing about Next.js or decaf. | Evidence: `README.md:2-4`; `workdocs/4-Description.md`. | Suggested fix: write a module-specific README stating the current scaffold status.
3. **[for-nextjs]** unused declared dependencies — 11 `@decaf-ts/*` runtime dependencies are declared but imported nowhere in `src/`. | Evidence: `package.json` dependencies block; grep of `src/` for `@decaf-ts` returns nothing. | Suggested fix: remove unused deps or implement the engine that needs them.
4. **[for-nextjs]** no library entry point — no `main`/`exports`/`types` fields, yet the package is published under the `@decaf-ts` scope. | Evidence: `package.json` (fields absent). | Suggested fix: add entry points when/iff library code exists; otherwise mark the package as an app.
5. **[for-nextjs]** version anomaly — v3.9.7 while all sibling engine packages are 0.x. | Evidence: `package.json:3` vs `for-react/package.json:3` (0.0.1), `for-angular/package.json:3` (0.5.20). | Suggested fix: re-version to the 0.x line.
6. **[for-nextjs]** npm `files` whitelist — lists only `workdocs/assets/slogans.json`, which does not exist; a publish would ship no source. | Evidence: `package.json:80-82`; `ls workdocs/assets/slogans.json` → "No such file or directory". | Suggested fix: fix `files` (or drop it for an app package).
7. **[for-nextjs]** zero tests — `tests/` holds only `.gitlock`, while package scripts assume a full jest suite and `lib`/`dist` targets. | Evidence: `tests/integration/.gitlock` (only file); `package.json` `test:dist` (`TEST_TARGET=lib`/`dist`), `coverage`. | Suggested fix: add tests or trim the template scripts.
8. **[for-nextjs]** broken Dockerfile — template Dockerfile copies a non-existent `./.mpmrc` and sets `ENTRYPOINT ["node", "lib/cli.cjs"]`, but no `lib/` exists (a Next.js app should run `next start`). | Evidence: `Dockerfile:14` (`COPY ./.mpmrc`), `Dockerfile:42`; no `.mpmrc` in repo; no `lib/` dir. | Suggested fix: replace with a Next.js Dockerfile (multi-stage `next build` + `next start`).
9. **[for-nextjs]** duplicate ESLint configs — both a template flat config (`eslint.config.js`) and the create-next-app one (`eslint.config.mjs`) exist; ESLint 9 loads one, making the other dead and the lint behavior ambiguous. | Evidence: `eslint.config.js:1-30` (template flat config) and `eslint.config.mjs:1-15` (`eslint-config-next`) both present. | Suggested fix: keep one config (the Next.js one) and delete the template copy.
10. **[for-nextjs]** `test:circular` target missing — script runs `dpdm` against `./src/index.ts`, which does not exist. | Evidence: `package.json:24`; `src/` contains only `app/` and `assets/`. | Suggested fix: remove the script or point it at a real entry.
11. **[for-nextjs]** typecheck depends on build output — `next-env.d.ts` imports `./.next/types/routes.d.ts`, a generated artifact, so `tsc` fails on a clean checkout without a prior Next build. | Evidence: `next-env.d.ts:3`. | Suggested fix: standard create-next-app behavior, but document it; ensure CI builds before typecheck.
12. **[for-nextjs]** dependency version drift — installed decaf deps are old published versions unrelated to workspace source (core 0.6.0 vs 0.29.0, ui-decorators 0.5.32 vs 0.19.1, styles 0.0.21 vs 0.7.3). | Evidence: `for-nextjs/node_modules/@decaf-ts/*/package.json` versions vs workspace `package.json` versions. | Suggested fix: align resolution (workspace links or matching versions) once real code lands.

---

## styles (`@decaf-ts/styles` v0.7.3)

### 1. Identity
- **Dir:** `/workspaces/decaf-ts/styles` (git submodule, branch `master`, HEAD `56a5976`)
- **Package:** `@decaf-ts/styles` **v0.7.3**
- **Description (package.json:4):** "template for ts projects" (stale template text — see Inaccuracies #1)
- **Type:** `"type": "module"`, MIT, author "Tiago Venceslau and Contributors"
- **Entry declarations:** `main`/`style` → `./dist/main.min.css`, `sass` → `./src/main.scss`; `exports["./dist/*"]` maps `style → ./dist/*`, `sass → ./src/*`; `files` = `src`, `dist`, `workdocs/assets/slogans.json`.

### 2. Purpose & role
The SCSS design-system/theme package for decaf UIs: it defines the `dcf-*` design tokens (colors, spacing, radii, shadows, breakpoints) as CSS custom properties, a UIKit-inspired utility class set (grid, flex, width, spacement, visibility, animations), Ionic component overrides for the decaf look, and the dark theme (`.dcf-palette-dark`). It sits at the bottom of the front-end layering — pure framework-agnostic presentation consumed by the rendering engines' host apps (primarily `for-angular`/Ionic). It is the most mature and self-contained of the three modules in this brief.

### 3. Dependencies
- **Runtime:** none (pure SCSS/CSS).
- **Dev deps:** `sass` ^1.92.1, `postcss` ^8.5.6, `postcss-cli` ^11, `autoprefixer` ^10.4.21, `cssnano` ^7.1.1, `chokidar` ^4.0.3, `@decaf-ts/utils` (latest), `@types/jest` ^30.
- **Modules depending on styles:** `for-angular` (v0.5.20, forwards `@decaf-ts/styles/dist/main.css` in `src/assets/main.scss:24`), `demo/angular/ew`, `demo/angular/ionic`, `web-page` (all declare `@decaf-ts/styles: latest`). `for-react`/`for-nextjs` declare it but never import it.

### 4. Architecture & structure
```
src/
  main.scss                 # entry: @use variables/decaf.scss; @forward core, width, grid, flex,
                            #   spacement, visibility, animations, variables/ionic; ionic-app fixes
  core.scss                 # :root dcf-* custom properties (palette, spacing, radius, shadows,
                            #   widths), remote Inter font import, Ionic ::part overrides,
                            #   .dcf-palette-dark tweaks, input error/tooltip/disabled styles
  components/
    base.scss               # text-size helpers (.dcf-text-lead, .dcf-text-meta)
    width.scss              # .dcf-child-width-1-2…1-6, .dcf-width-*
    grid.scss               # .dcf-grid, .dcf-grid-col, gap classes
    flex.scss               # .dcf-flex*, alignment/spacing utilities
    spacement.scss          # .dcf-margin-*, .dcf-padding-* (note: filename typo)
    visibility.scss         # breakpoint show/hide utilities (hiddenOn/visibleOn mixins)
    animations.scss         # .dcf-animation-* (fade, scale, slide) + keyframes
    variables/
      decaf.scss            # SCSS token variables ($dcf-spacement*, $dcf-width-*, radii, shadows)
      decaf-dark.scss       # dark palette (iOS dark steps, .dcf-palette-dark overrides)
      ionic.scss            # --ion-color-* → --dcf-color-* mapping
bin/
  build.js                  # compiles every src/**/*.scss → dist/*.css; --prod adds
                            #   postcss (autoprefixer + cssnano) → *.min.css; copies
                            #   package.json + dist + src into lib/ (for npm link)
  watch.js + chokidar.config.js   # watch mode (rebuilds on src change)
  tag-release.sh, sync-codex.sh
dist/                       # committed DEV build: main.css (2726 lines), core.css (450),
                            #   components/*.css + maps — NO .min.css files
lib/                        # committed stale copy (package.json says v0.7.0; src differs)
tests/system/build.test.ts  # the only test (shells out to npm run build / build:prod)
workdocs/                   # template workdocs + generated reports (CHANGELOG, DEPENDENCIES,
                            #   RELEASE_NOTES, coverage)
```

### 5. Public API surface
Not a JS API — the surface is CSS:
- **Entries:** `main.css` (dev) / `main.min.css` (prod, generated), `core.css`, per-component CSS under `dist/components/`.
- **Subpath exports:** `@decaf-ts/styles/dist/*` with `style`/`sass` conditions (e.g. `@forward "@decaf-ts/styles/dist/main.css"` as used by for-angular).
- **CSS custom properties (tokens):** `--dcf-color-*` (primary/secondary/tertiary/success/warning/danger/light/medium/dark + gray-0…10, each with -rgb/-contrast/-shade/-tint), `--dcf-spacement*`/`--dcf-margin*`/`--dcf-padding*`, `--dcf-border-radius*`, `--dcf-box-shadow*`, `--dcf-width-*`, `--dcf-default-dynamic-font`, `--dcf-input-fill-background`, `--dcf-card-background`, `--dcf-content-background`, `--dcf-text-color`.
- **Utility classes:** `.dcf-grid*`, `.dcf-flex*`, `.dcf-width-*`/`.dcf-child-width-*`, `.dcf-margin-*`/`.dcf-padding-*`, `.dcf-animation-*`, visibility utilities, `.dcf-hidden`, `.dcf-invisible`, `.dcf-disabled`, `.dcf-tooltip*`, `.dcf-input-error`/`.dcf-input-helper`.
- **Theme hooks:** `.dcf-palette-dark` class (dark mode), `--ion-color-*` bridge variables.

### 6. Key patterns & concepts
- **Token-based theming:** SCSS variables (`$dcf-*` in `variables/decaf.scss`) are compiled into `:root` CSS custom properties in `core.scss`, so consumers can override at runtime without recompiling.
- **Ionic bridge:** `variables/ionic.scss` maps `--ion-color-*` to `--dcf-color-*`; `core.scss` styles Ionic parts (`ion-select`, `ion-textarea`, `ion-popover`, `ion-button`, `ion-searchbar`) to the decaf look, including validation-state colors.
- **Dark theme:** toggled by adding `.dcf-palette-dark` to an element (the engines' media services do this — e.g. for-react `RgxMediaService.toggleDarkPalette`); `decaf-dark.scss` additionally defines iOS dark step colors. Note `decaf-dark.scss` is **not** forwarded by `main.scss` — it is a separate opt-in file.
- **UIKit-inspired utilities:** `main.scss` header comments state the base is derived from uikit 3.22.1 (grid/flex/width/spacing utilities).
- **Build pipeline:** custom Node script (`bin/build.js`) — dev: `sass` per file; prod: `sass` + `postcss --use autoprefixer --use cssnano` → `.min.css`; then mirrors `package.json`/`dist`/`src` into `lib/` for the `npm link` workflow (`link`/`unlink` scripts).

### 7. Lifecycle / configuration / environment
- **Build:** `npm run build` (dev), `npm run build:prod` (minified), `npm run watch` (chokidar on `src/`, rebuild via `node bin/build.js`).
- **No env vars, no runtime configuration** — theming is class/variable based at CSS level.
- **Consumption:** host apps import the built CSS (for-angular: `@forward "@decaf-ts/styles/dist/main.css"` in global styles); the `sass` field/exports allow SCSS-level consumption of `src/`.

### 8. Data & control flow
- **Build:** `src/**/*.scss` → (sass) → `dist/**/*.css` (+ maps; + `.min.css` in prod) → mirrored to `lib/`.
- **Runtime:** browser loads `main.css`; `:root` tokens cascade; Ionic components pick up `--ion-color-*`/part overrides; dark mode swaps token values when `.dcf-palette-dark` is present; utilities apply per-element classes.

### 9. Testing
- **Structure:** single test file `tests/system/build.test.ts` (2 tests) that shells out via `execSync` to `npm run build` / `npm run build:prod` and asserts `dist/main.css` / `dist/main.min.css` exist. `jest.config.cjs` (ts-jest, node env).
- **Coverage:** SCSS is not instrumented — `workdocs/reports/RELEASE_NOTES.md` shows 0.00% lines/statements/functions/branches.
- **Notable gaps:** no tests of the CSS content itself (token values, utility correctness, dark-theme completeness); the only "test" is a build smoke test.

### 10. Usage example (derived from real consumers)
```scss
// Global styles of for-angular (for-angular/src/assets/main.scss:24)
@forward "@decaf-ts/styles/dist/main.css";
```
```ts
// Dark palette toggle as used by the for-react engine (for-react/src/lib/services/RgxMediaService.ts)
element.classList.toggle("dcf-palette-dark", shouldEnable);
```

### 11. Relationships
- **Consumed by:** `for-angular` (primary consumer, global stylesheet), `demo/angular/ew`, `demo/angular/ionic`, `web-page`.
- **Declared (unused) by:** `for-react`, `for-nextjs`.
- **Layering:** bottom of the front-end stack — presentation tokens/utilities with no JS; the rendering engines (for-angular/for-react) reference its class names (`dcf-card`, `dcf-grid`, `dcf-palette-dark`, …) but do not import the package in code.

### 12. Consumer notes
- **Root entry points are prod-only:** `main`/`style` → `dist/main.min.css`, but the committed `dist/` is a dev build with **no** `.min.css` files; consumers must run `build:prod` (or use the `dist/main.css` subpath, as for-angular does).
- **Dark theme is opt-in:** `decaf-dark.scss` is not part of `main.scss`; apps needing the iOS dark step palette must import it separately (undocumented).
- **Remote font:** `core.scss` `@import`s Inter from fonts.googleapis.com — a runtime network dependency for a "design system" package (offline/air-gapped apps will fall back).
- **Stale `lib/`:** committed `lib/` is from an older build (package.json v0.7.0; `lib/src/main.scss` differs from `src/main.scss`) — `npm link` serves stale code until `npm run build` re-mirrors.
- **Filename typo:** `spacement.scss` (for "spacing") — internally consistent but misleading.
- **Known CSS bugs:** undefined `--dfc-*` variables and undefined `--dcf-font-family` (see Inaccuracies #3, #4) — some utility rules silently fall back.

### 13. Inaccuracies found
1. **[styles]** package description — "template for ts projects" is leftover ts-workspace template text; the package is an SCSS design system. | Evidence: `package.json:4`. | Suggested fix: "decaf-ts SCSS design system and themes".
2. **[styles]** entry points vs committed dist — `main`/`style` point to `./dist/main.min.css`, but the committed `dist/` contains only the dev build (no `.min.css` anywhere), so the declared entry file is missing until `build:prod` runs. | Evidence: `package.json:5-6`; `find dist -name "*.min.css"` → empty. | Suggested fix: commit a prod build, or point `main`/`style` at `dist/main.css`.
3. **[styles]** undefined CSS variables (typo) — `base.scss` uses `--dfc-color-dark-tint`, `--dfc-color-medium`, `--dfc-color-medium-shade` (prefix `dfc`), which are defined nowhere; the design system defines `--dcf-*`. `.dcf-text-lead`/`.dcf-text-meta` colors therefore resolve invalid. | Evidence: `src/components/base.scss:14,19,22,25`; no `--dfc-` definitions in `src/`. | Suggested fix: rename to `--dcf-color-dark-tint` / `--dcf-color-medium(-shade)`.
4. **[styles]** undefined `--dcf-font-family` — `base.scss` sets `font-family: var(--dcf-font-family)` on `html, body, *`, but no rule in the package defines `--dcf-font-family` (core.scss defines `--dcf-default-dynamic-font`/`--dcf-dynamic-font` instead). | Evidence: `src/components/base.scss:6`; grep for `--dcf-font-family` finds only usages, no definition. | Suggested fix: define `--dcf-font-family` in `core.scss` or reference the existing variable.
5. **[styles]** README links — "How to Use" links to `./tutorials/For Developers.md#…`, but no `tutorials/` dir exists at the package root (the file lives at `./workdocs/tutorials/For Developers.md`). | Evidence: `README.md:42-52`; `ls tutorials` → no such directory. | Suggested fix: fix link prefixes to `./workdocs/tutorials/…`.
6. **[styles]** stale committed `lib/` — `lib/package.json` says v0.7.0 (package is 0.7.3) and `lib/src/main.scss` differs from `src/main.scss`; the `npm link` flow would serve stale assets. | Evidence: `lib/package.json:3`; `diff lib/src/main.scss src/main.scss` → differ. | Suggested fix: regenerate `lib/` via `npm run build` before release (or gitignore it).
7. **[styles]** filename typo — `components/spacement.scss` (for "spacing") is referenced consistently but misleading. | Evidence: `src/components/spacement.scss`; `src/main.scss:7` (`@forward "components/spacement.scss"`). | Suggested fix: rename to `spacing.scss` (update the forward).
8. **[styles]** stale generated reports — `DEPENDENCIES.md` lists `@decaf-ts/styles@0.1.4` and `RELEASE_NOTES.md` says "Last tag: v0.1.0 / No DECAF tickets matched", both far behind v0.7.3. | Evidence: `workdocs/reports/DEPENDENCIES.md:7`; `workdocs/reports/RELEASE_NOTES.md:3,7`. | Suggested fix: regenerate reports at release time.
9. **[styles]** dark theme not in main entry — `decaf-dark.scss` is built standalone but never forwarded by `main.scss`, and nothing documents that consumers must import it separately for the iOS dark step palette. | Evidence: `src/main.scss:3-10` (forwards list omits decaf-dark); `dist/components/variables/decaf-dark.css` exists as a separate file. | Suggested fix: forward it from `main.scss` or document the separate import.
10. **[styles]** test scope — the only test is a build smoke test that shells out to `npm run build`/`build:prod`; there is no verification of CSS content (tokens, utilities, dark theme). | Evidence: `tests/system/build.test.ts:1-22`. | Suggested fix: add snapshot/content assertions on built CSS (delegate to Tester).
11. **[styles]** remote font dependency — `core.scss` pulls Inter from Google Fonts via `@import url(...)`, making the "design system" depend on network availability at page load. | Evidence: `src/core.scss:3`. | Suggested fix: self-host the font or make it an opt-in partial.

---

## Cross-module summary

| Module | Maturity | Consumable today? | Biggest risks |
| --- | --- | --- | --- |
| for-react (0.0.1) | Early port, working core | No (broken `files`, missing `lib/`, missing faker dep) | Packaging, version drift vs workspace ui-decorators, untested components |
| for-nextjs (3.9.7) | Scaffold only | No (no entry point, no decaf code) | Misleading description, broken Dockerfile, dead deps/scripts |
| styles (0.7.3) | Mature, in active use by for-angular | Yes (via `dist/main.css` subpath) | Prod-only root entry, undefined CSS vars, stale `lib/` |

**Total inaccuracies found: 36** (for-react: 13, for-nextjs: 12, styles: 11).
