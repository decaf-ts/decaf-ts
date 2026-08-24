# Research Brief — `for-react-native` (`@decaf-ts/for-react-native`)

Reviewer: Mobile Developer (read-only). Scope: the single assigned module
`/workspaces/decaf-ts/for-react-native`. No tests or builds were run; every
statement is grounded in source/tests/config read during this review.

This brief follows the required per-module structure. Because only one module
is assigned, the entire document is the brief for that module.

---

### for-react-native (`@decaf-ts/for-react-native` v1.0.0)

#### 1. Identity

- **Directory:** `/workspaces/decaf-ts/for-react-native`
- **Package name:** `@decaf-ts/for-react-native`
- **Version:** `1.0.0` (`package.json:5`)
- **Description (declared):** "TypeScript utilities and compatibility layer for
  using @decaf-ts in React Native apps" (`package.json:3`)
- **License (declared):** `MPL-2.0 OR AGPL-3.0` (`package.json:70`)
- **Main entry:** `expo-router/entry` (`package.json:4`) — i.e. the package is
  wired as an Expo Router **application entry**, not a consumable library build.
- **Author:** Tiago Venceslau and Contributors (`package.json:162`)
- **Engines:** Node `>=20.0.0`, npm `>=10.0.0` (`package.json:58-61`)

#### 2. Purpose & role

`for-react-native` is the React Native (Expo) flavor of the Decaf UI layer. It
provides a model-driven rendering pipeline that turns Decaf `Model` instances
(decorated with `@decaf-ts/decorator-validation` and `@decaf-ts/ui-decorators`
metadata) into React Native forms using a `RenderingEngine` subclass
(`RnRenderingEngine`), a `react-hook-form`-backed form service (`RnFormService`),
a decorator-aware validator factory (`ValidatorFactory`), and a runtime
component registry (`ComponentRegistry`). The UI primitives themselves are
Gluestack UI v2 components wrapped with NativeWind/Tailwind styling, plus an
i18n layer (`i18next` + `TranslateService`). In the framework layering it sits
above `ui-decorators` / `decorator-validation` / `db-decorators` as the
platform-specific rendering target, analogous to how `for-angular` targets the
web/Angular platform.

#### 3. Dependencies

**Decaf modules declared in `package.json` (`dependencies`):**
`@decaf-ts/cli`, `@decaf-ts/core`, `@decaf-ts/db-decorators`,
`@decaf-ts/decoration`, `@decaf-ts/decorator-validation`,
`@decaf-ts/for-http`, `@decaf-ts/injectable-decorators`, `@decaf-ts/logging`,
`@decaf-ts/ui-decorators` — all pinned to `"latest"` (`package.json:76-84`).

**Decaf modules actually imported in `src/`** (only three):
- `@decaf-ts/ui-decorators` (8 import sites) — `RenderingEngine`,
  `FieldDefinition`, `FieldProperties`, `HTML5InputTypes`, `HTML5CheckTypes`,
  `parseValueByType`, `escapeHtml`, `parseToNumber`.
- `@decaf-ts/decorator-validation` (8 import sites) — `Model`, `model`,
  `Validation`, `ValidationKeys`, `ComparisonValidationKeys`, `DEFAULT_PATTERNS`,
  `PathProxy`, `PathProxyEngine`, `sf`, and all field decorators
  (`required`, `minlength`, `maxlength`, `min`, `email`, `password`, `pattern`,
  `date`, `eq`, `diff`).
- `@decaf-ts/db-decorators` (3 import sites) — `CrudOperations`,
  `OperationKeys`.

The remaining declared Decaf deps (`cli`, `core`, `decoration`, `for-http`,
`injectable-decorators`, `logging`) are **not imported anywhere in `src/`** (see
Inaccuracies #5).

**Key external dependencies** (`package.json:85-149`):
- App/platform: `expo` ~52.0.25, `expo-router` ~4.0.16, `react` 18.3.1,
  `react-native` 0.76.9, `react-native-web`, `react-native-screens`,
  `react-native-safe-area-context`, `react-native-gesture-handler`,
  `react-native-reanimated`, `react-native-svg`, `react-native-webview`.
- UI/styling: the full `@gluestack-ui/*` v2 component set (accordion,
  actionsheet, alert, alert-dialog, avatar, button, checkbox, divider, fab,
  form-control, icon, image, input, link, menu, modal, overlay, popover,
  pressable, progress, radio, select, slider, spinner, switch, textarea, toast,
  tooltip), `nativewind` ^4.1.23, `tailwindcss` ^3.4.17,
  `react-native-css-interop`, `@legendapp/motion`.
- Forms: `react-hook-form` ^7.62.0.
- i18n: `i18next` ^25.5.2, `react-i18next` ^15.7.3.
- Navigation: `@react-navigation/native` ^7.0.14,
  `@react-navigation/bottom-tabs` ^7.2.0.
- Misc: `reflect-metadata`, `typed-object-accumulator`,
  `babel-plugin-module-resolver`.

**Modules that depend on it:** None found within the monorepo. A
`grep -rl "for-react-native" --include=package.json` across
`/workspaces/decaf-ts` (excluding `node_modules` and the module's own
`package.json`) returned no results. It is a leaf/app-style module.

#### 4. Architecture & structure

`src/` layout:

```
src/
  index.ts                  -> only `import "expo-router/entry"` (app entry side-effect)
  app/                      -> Expo Router file-based routes
    _layout.tsx             -> root layout: fonts, splash, GluestackUIProvider, ThemeProvider
    index.tsx               -> splash/home screen
    modal.tsx, +html.tsx, +not-found.tsx
    tabs/_layout.tsx        -> Stack wrapper
    tabs/(tabs)/_layout.tsx -> bottom Tabs (Dashboard / Crud / Lists)
    tabs/(tabs)/index.tsx   -> **engine demo**: renders UserProfileModel via RnRenderingEngine
    tabs/(tabs)/tab1.tsx, tab2.tsx
  components/
    index.ts                -> re-exports decaf/* + legacy helpers
    decaf/                  -> Decaf-aware RN components
      RnDecafCrudForm.tsx, RnDecafCrudField.tsx, RnFieldset.tsx, index.ts
    ui/                     -> 53 Gluestack UI v2 wrappers (one folder each),
                               incl. `.web.tsx` variants for box/card/center/grid/
                               heading/hstack/skeleton/table/text/vstack, and
                               gluestack-ui-provider/ with config.ts (NativeWind vars,
                               light+dark palettes), script.ts, types.ts
    EditScreenInfo.tsx, ExternalLink.tsx, StyledText.tsx, Themed.tsx,
    LanguageSelector.tsx, useClientOnlyValue(.web).ts, useColorScheme(.web).ts
  constants/                -> theme.ts (legacy light/dark color constants)
  core/
    index.ts                -> re-exports i18n + services
    i18n/i18n.ts            -> i18next init (en, pt) from @/assets/i18n/*.json
    services/TranslateService.ts -> ILocaleService impl + useTranslate hook
  engine/                   -> the model-driven rendering core
    index.ts, ComponentRegistry.ts, RnRenderingEngine.tsx, RnFormService.ts,
    RnCrudFormField.ts, ValidationFactory.ts, utils.ts,
    types/RnCrudFieldProps.ts, types/index.ts
  hooks/                    -> useColorScheme.ts (+.web), useThemeColor.ts
  models/                   -> example domain models
    AddressModel.ts, ProfessionalInfoModel.ts, UserProfileModel.ts, index.ts
```

Key subsystems:

- **Rendering engine** (`engine/RnRenderingEngine.tsx`) — extends
  `RenderingEngine` from `ui-decorators` with flavour `"react-native"`;
  converts a `Model` into a `FieldDefinition` tree (inherited
  `toFieldDefinition`) and then walks it, resolving each `tag` through
  `ComponentRegistry` and registering controls/children with `RnFormService`,
  finally wrapping output in a `react-hook-form` `FormProvider`.
- **Form service** (`engine/RnFormService.ts`) — wraps `useForm` from
  `react-hook-form`, maintains a per-instance `controls` Map of
  `ControlFieldProps | RnFormService`, and a static `formRegistry` Map for
  id-based lookup; supports nested child forms via dot paths and a `../`
  parent token.
- **Validation factory** (`engine/ValidationFactory.ts`) — builds
  `react-hook-form`-compatible validator functions from model field props by
  matching property keys against `Validation.keys()` and delegating to
  `Validation.get(key)`; handles comparison validators through a `PathProxy`
  bound to the form service.
- **Component registry** (`engine/ComponentRegistry.ts`) — static `Map<string,
  React.ComponentType>` keyed by tag (the `tag` written by `@uielement` /
  `@uichild` decorators, e.g. `ngx-decaf-crud-field`).
- **i18n** (`core/`) — singleton `TranslateService` over a pre-init'd `i18next`
  instance plus a `useTranslate` React hook.
- **Theme** — two coexisting systems: legacy `constants/theme.ts` color
  constants (unused by the engine demo) and the Gluestack/NativeWind token
  system in `components/ui/gluestack-ui-provider/config.ts`.

#### 5. Public API surface

There is **no library barrel** re-exporting the engine/core/models. `src/index.ts`
contains only `import "expo-router/entry"`; the package `main` is
`expo-router/entry`. The engine/core/models/components are consumed via path
aliases (`@/src/engine`, `@engine`, `@/src/core`, `@/src/models`, `@components`)
— see §7. The effectively public symbols, grouped by subsystem:

**`@/src/engine` (`engine/index.ts`)**
- `ComponentRegistry` — static tag→component registry (`register`, `get`).
- `RnRenderingEngine` — `RenderingEngine` subclass; `render(model, globalProps)`
  returns a React element wrapping the rendered form in `FormProvider`.
- `RnFormService` — form state manager; instance API `getControl`,
  `submit`, `reset`, `getValues`, `getParsedData`, `getMethods`, `addChild`,
  `addFormControl`, `getFormIdPath`; static API `get/has/addRegistry/
  removeRegistry/validateFields/mountFormIdPath/getFormIdPath`.
- `ValidatorFactory` — `validatorsFromProps(props)`, `combineValidators(validators)`.
- `RnCrudFormField` — implements `FieldProperties`; a field state holder
  (writeValue/registerOnChange/registerOnTouched/getValue/isValid/...).
- types: `RnDecafCrudFieldProps`, `ControlFieldProps`, `Option`,
  `PossibleInputTypes`, `Validator`, `ValidatorKeyProps`.
- `utils`: `PARENT_TOKEN` (`"../"`), `tokenizePath(path)`.

**`@/src/core` (`core/index.ts`)**
- `TranslateService` (singleton instance) — `get`, `setContext`, `changeLanguage`,
  `getCurrentLanguage`, `getAvailableLanguages`, `setFallbackLanguage`,
  `getTranslations`, `setCurrentLocaleKey`, `subscribe`, `unsubscribe`.
- `useTranslate(key, fallback?)` hook.
- `ILocaleService`, `SupportedLocales`, `LocaleValue`, `LocaleDictionary`.
- default `i18n` instance (re-exported from `core/i18n`).

**`@/src/models`** — example models: `UserProfileModel`, `AddressModel`,
`ProfessionalInfoModel`.

**`@/src/components`** — `RnDecafCrudForm`, `RnDecafCrudField`, `RnFieldset`,
plus legacy `EditScreenInfo`, `ExternalLink`, `StyledText`, `Themed` helpers.

**`@components/ui/*`** — ~53 Gluestack UI v2 wrapper components (Button/Text/
Icon/Group, Input, Textarea, Checkbox, Radio, Select, Slider, FormControl,
Modal, Toast, etc.) and `GluestackUIProvider` with `config` (light/dark
NativeWind vars). Several are thin re-exports (e.g.
`flat-list/index.tsx` → `export { FlatList } from 'react-native'`).

**`@/src/constants`** — `Theme` (legacy light/dark color object).

#### 6. Key patterns & concepts

- **Model-driven rendering.** Domain models are decorated with
  `@model()` / `@uimodel("ngx-decaf-crud-form")` and per-field
  `@uielement("ngx-decaf-crud-field", {...})` / `@uichild(ModelName,
  "ngx-decaf-fieldset")`. The engine's inherited `toFieldDefinition` reads that
  metadata to produce a `FieldDefinition` tree whose `tag`s are resolved by
  `ComponentRegistry` at render time.
- **Tag registration by string.** Consumers must register the concrete RN
  components against the decorator tags before rendering (see the demo in
  `tabs/(tabs)/index.tsx:59-61`): `ComponentRegistry.register("ngx-decaf-crud-form",
  RnDecafCrudForm)`, etc. The `component(tag)` decorator helper is defined but
  commented out (`ComponentRegistry.ts:63-67`).
- **react-hook-form integration.** `RnFormService` holds the `UseFormReturn`
  (shared with nested children via the parent's methods). `RnRenderingEngine.render`
  wraps the tree in `<FormProvider {...methods}>`. `RnDecafCrudField` uses
  `<Controller>` with a `rules.validate` that runs the `ValidatorFactory`-built
  validator and maps the returned `{key,message}` to a translated error via
  `TranslateService.setContext("errors").get(key)`.
- **Nested forms via dot paths + `../`.** `addChild(path)` creates/retrieves
  child `RnFormService` instances keyed by dotted ids; `getControl` supports a
  `../` parent token (`PARENT_TOKEN`) for cross-form comparison validators
  (e.g. `@diff("../specialization")` in `ProfessionalInfoModel`).
- **Validator bridging.** `ValidatorFactory.spawn` resolves each supported key
  through `Validation.get(key)`, parses values with
  `parseValueByType`/`parseToNumber`, and for comparison keys
  (`eq`,`diff`,`lessThan`,...) wraps the form service in a `PathProxy`
  (`PathProxyEngine.create`) so validators can read sibling field values and
  the parent service. `email`/`password`/`url` are remapped to `pattern`
  validators with `DEFAULT_PATTERNS`.
- **i18n.** `i18next` is initialized synchronously in `core/i18n/i18n.ts` with
  bundled `en`/`pt` JSON. `TranslateService` is a singleton wrapper exposing
  subscribe/unsubscribe on `languageChanged`; `useTranslate` re-renders on
  language change.
- **Theming.** `GluestackUIProvider` sets NativeWind `colorScheme` from a `mode`
  prop and applies a `config[colorScheme]` vars object (CSS-variable-style color
  scales for primary/secondary/tertiary/error/success/warning/info/typography/
  outline/background/indicator). The legacy `constants/theme.ts` `Theme` object
  is independent and unused by the engine demo.
- **Path aliases.** `@`, `@app`, `@components`, `@constants`, `@hooks`,
  `@engine`, `tailwind.config` are configured in `tsconfig.json` paths,
  `babel.config.js` module-resolver, and `metro.config.js` (with omissions — see
  §13 #14). The babel config also dynamically aliases `@decaf-ts/*` to
  `node_modules/@decaf-ts/<pkg>/lib/esm` or per-subpackage `lib/index.cjs`.

#### 7. Lifecycle / configuration / environment

- **Boot.** App boots via Expo Router: `src/app/_layout.tsx` loads fonts
  (SpaceMono + FontAwesome), prevents the splash screen, wraps the `Slot` in
  `GluestackUIProvider` (mode from `useColorScheme`) and React Navigation's
  `ThemeProvider` (Dark/Default theme). `src/app/index.tsx` imports
  `reflect-metadata` (needed for the decorator metadata used by the engine) and
  re-imports `expo-router/entry`.
- **Engine initialization.** `RnRenderingEngine` extends `RenderingEngine`; its
  `initialize(...)` sets `this.initialized = true` and is idempotent. The demo
  constructs a module-level singleton `const renderingEngine = new
  RnRenderingEngine()` (`tabs/(tabs)/index.tsx:15`) and registers components at
  module load.
- **i18n init.** Side-effectful at first import of `core/i18n/i18n.ts`
  (`i18n.use(initReactI18next).init({...})`), default `lng: "en"`,
  `fallbackLng: "en"`.
- **Flavours.** The rendering flavour is the literal `"react-native"` passed to
  `super("react-native")` in `RnRenderingEngine`'s constructor.
- **Env vars.** `DARK_MODE=media` is set by the `start` script
  (`package.json:8`). No other engine env vars. CI/release tokens
  (`.npmtoken`, `.token`, etc.) are referenced only by helper scripts.
- **Defaults.** `RnDecafCrudField` defaults: `operation = OperationKeys.CREATE`,
  `inputType = "text"`, `size = "md"`, `space = "sm"`, `variant = "underlined"`,
  `required = false`, `readonly = false`. Read-only mode is forced for `READ`/
  `DELETE` operations.
- **Scripts.** `start`/`start:android|ios|web` (expo), `build`/`build:prod`
  (custom `bin/build-scripts.cjs` — a bundled rollup/cli script, not reviewed in
  detail), `lint` (`expo lint`), `test`/`test:unit|integration|all` (jest with
  `jest-expo` preset), `test:circular` (dpdm on `./src/index.ts`), `coverage`,
  `docs`, `release`, plus repo/codex helpers.

#### 8. Data & control flow

Rendering a model (e.g. `UserProfileModel`) end-to-end:

1. A consumer registers components: `ComponentRegistry.register(tag, Comp)` for
   `ngx-decaf-crud-form`, `ngx-decaf-crud-field`, `ngx-decaf-fieldset`
   (`tabs/(tabs)/index.tsx:59-61`).
2. `renderingEngine.render(model)` is called inside JSX.
3. `RnRenderingEngine.render` calls inherited `toFieldDefinition(model,
   globalProps)` to build a `FieldDefinition<RnDecafCrudFieldProps>` tree. The
   root `tag` is the `@uimodel` value (`ngx-decaf-crud-form`); each field's
   `tag` is its `@uielement` value; each `@uichild` becomes a child
   `FieldDefinition` with `tag = ngx-decaf-fieldset` and a nested subtree. A
   `rendererId` is assigned (or generated from `Math.random()`).
4. `render` returns `<RenderingForm />`, which calls `fromFieldDefinition(def)`:
   - resolves/creates the root `RnFormService` via `RnFormService.get(rendererId)`
     (static registry; creates parents as needed);
   - for fields with a `path`, calls `form.addFormControl(def.props)` which
     builds validators via `ValidatorFactory.validatorsFromProps` and stores a
     `ControlFieldProps` in the form's `controls` Map;
   - resolves `ComponentRegistry.get(tag)` (`ngx-decaf-crud-form` →
     `RnDecafCrudForm`);
   - recurses for children, calling `form.addChild(childOf)` for nested
     fieldsets and mounting their `rendererId`s.
5. `RenderingForm` pulls `form.getMethods()` and wraps the element in
   `<FormProvider {...methods}><VStack>{component}</VStack></FormProvider>`.
6. `RnDecafCrudField` (rendered for each `ngx-decaf-crud-field`) uses
   `<Controller control name={path} rules={{ validate }}>`; on each change
   react-hook-form calls the validator, which runs the combined
   `ValidatorFactory` validators; on failure the field's `validate` returns the
   translated error string (looked up in the `errors` i18n namespace by
   `validationResult.key`), and `FormControlError` displays it.
7. Submit/Cancel come from `RnDecafCrudForm`'s footer buttons, which call
   `formProvider.submit()` / `reset()`. `submit()` invokes
   `formMethods.handleSubmit` and logs `getParsedData()` (which traverses
   controls, parses numbers/dates, and HTML-escapes strings).

#### 9. Testing

Testing is effectively **absent**.

- `tests/unit/ts-workspace.test.ts` (82 lines) is the only test file. Its
  `describe` is `describe.skip(...)` and every `it` body is fully commented out;
  it contains only dead helper code (`addReportMessage`, `addReportAttachment`,
  `awaitTimeout`) copied from the `ts-workspace` template. The first line is a
  commented-out import `// import { ChildClass, Class, ... } from "@../../src";`.
- `tests/integration/` contains only an empty `.gitlock` placeholder.
- No tests exist for any of the engine subsystems (`ComponentRegistry`,
  `RnFormService`, `ValidatorFactory`, `RnRenderingEngine`, `RnCrudFormField`),
  the i18n `TranslateService`/`useTranslate`, the `RnDecafCrudField`/`Form`/
  `Fieldset` components, or the example models.
- The README displays coverage badges (`workdocs/reports/coverage/badge-*.svg`)
  but there is no corresponding test source that could produce meaningful
  coverage.

**Notable gaps:** the entire model-driven rendering pipeline, nested-form path
resolution (`tokenizePath`, `../` parent token), comparison-validator proxy
wiring, value parsing/sanitization, and the Gluestack field rendering switch are
untested. `npm run test:unit|integration|all` all use `--passWithNoTests`, so CI
will pass with zero assertions.

#### 10. Usage example

The only real, runnable usage is the demo screen
`src/app/tabs/(tabs)/index.tsx`. Minimalized (derived from that file, not
invented):

```tsx
import "reflect-metadata";
import { ComponentRegistry, RnRenderingEngine } from "@/src/engine";
import { RnDecafCrudField, RnDecafCrudForm, RnFieldset } from "@/src/components";
import { UserProfileModel, ProfessionalInfoModel } from "@/src/models";

// 1. Register concrete RN components against the decorator tags
ComponentRegistry.register("ngx-decaf-crud-form", RnDecafCrudForm);
ComponentRegistry.register("ngx-decaf-crud-field", RnDecafCrudField);
ComponentRegistry.register("ngx-decaf-fieldset", RnFieldset);

// 2. Build a model (decorators declare fields + validation + UI metadata)
const model = new UserProfileModel({
  fullName: "John Smith",
  age: 18,
  birthDate: "1985-05-15",
  email: "john.smith@example.com",
  password: "P@ssw0rd01",
  phone: "(11) 98765-4321",
  gender: "male",
  address: { street: "Main Street", complement: "Apt 101", zipCode: "12345-000", city: "New York" },
  professionalInfo: new ProfessionalInfoModel({ position: 3, company: "Tech Solutions Inc." }),
  acceptTerms: true,
});

// 3. Render
const renderingEngine = new RnRenderingEngine();
export default function Home() {
  return <ScrollView><Center>{renderingEngine.render(model)}</Center></ScrollView>;
}
```

i18n usage (derived from `TranslateService.ts` / `LanguageSelector.tsx`):

```ts
import { TranslateService, useTranslate } from "@/src/core";

await TranslateService.changeLanguage("pt");
const msg = TranslateService.get("user.fullName.label");
// in a component:
const label = useTranslate("user.email.label", "Email");
```

#### 11. Relationships

- **`@decaf-ts/ui-decorators`** — base layer. `RnRenderingEngine extends
  RenderingEngine`; `toFieldDefinition`, `FieldDefinition`, `FieldProperties`,
  and the HTML5 type helpers (`HTML5InputTypes`, `HTML5CheckTypes`,
  `parseValueByType`, `parseToNumber`, `escapeHtml`) all come from here. The
  `@uimodel`/`@uielement`/`@uichild` decorators used by the models are provided
  here too.
- **`@decaf-ts/decorator-validation`** — `Model` base class, `@model()` and all
  field validators (`required`, `minlength`, `maxlength`, `min`, `max`,
  `email`, `password`, `pattern`, `date`, `eq`, `diff`), plus `Validation`
  (key registry + `get`), `ValidationKeys`, `ComparisonValidationKeys`,
  `DEFAULT_PATTERNS`, `PathProxy`/`PathProxyEngine`, and `sf` for message
  formatting. `ValidatorFactory` is the bridge from these validators to
  react-hook-form.
- **`@decaf-ts/db-decorators`** — `CrudOperations` / `OperationKeys`, used to
  drive read-only vs. editable field rendering in `RnDecafCrudField` (and typed
  on `RnDecafCrudFieldProps.operation`).
- **`for-angular` / `for-react`** — conceptual siblings (other platform
  rendering flavors of the same ui-decorators model-driven approach). The
  `ngx-` tag prefixes on the RN components (`ngx-decaf-crud-form`, etc.) are
  inherited from the Angular lineage of the decorators.
- **No reverse dependencies** within the monorepo (see §3).

#### 12. Consumer notes

- **App, not a library.** The package `main` is `expo-router/entry` and
  `src/index.ts` only side-effect-imports that entry; there is no exported
  barrel for `engine`/`core`/`models`/`components`. Consumers must import via
  the configured path aliases (`@/src/...`, `@engine`, `@components`, `@/src/core`).
  Treating this as an installable `@decaf-ts/for-react-native` library would not
  work without the alias setup.
- **Manual component registration required.** The decorator tags (`ngx-*`) are
  inert until you call `ComponentRegistry.register(tag, Comp)`; nothing is
  auto-registered. The `component()` decorator that would automate this is
  commented out.
- **Path aliases must be configured in three places** (`tsconfig.json`,
  `babel.config.js`, `metro.config.js`) and they are **not identical** across
  them (see #14) — easy to hit resolution errors, especially for `@/src/...`
  imports under Metro.
- **Decorator metadata requires `reflect-metadata`** and the legacy/loose Babel
  decorator plugins configured in `babel.config.js`
  (`@babel/plugin-proposal-decorators` legacy, class-properties loose,
  `transform-typescript-metadata`); `tsconfig.json` sets
  `experimentalDecorators`/`emitDecoratorMetadata`. The demo screen imports
  `reflect-metadata` at the top.
- **Maturity.** This reads as an early-stage / scaffold module: a single demo
  screen, no real tests, template-inherited docs, and several declared
  dependencies that are unused. Several field input types are incomplete (date
  renders `null`; see #10).
- **Static registries.** `ComponentRegistry` and `RnFormService.formRegistry`
  are module-level singletons with no teardown/clear API beyond
  `RnFormService.removeRegistry(id)`. Long-lived app sessions or tests that
  re-render models with generated ids will accumulate entries; duplicate form
  ids throw (`RnFormService.addRegistry`).
- **i18n keys must exist** for labels/options/errors or you get the raw key
  string; the bundled `en.json`/`pt.json` are parity (94 flat keys each) and
  include an `errors.*` namespace consumed by `RnDecafCrudField` validation.

#### 13. Inaccuracies found

1. **[for-react-native] README Description** — Wrong module description.
   README "Description" says *"A very versatile persistence layer. from smart
   contracts, Digital wallets or just regular database access"*
   (`README.md:33-35`), which is a copy-paste from a persistence module and has
   nothing to do with a React Native UI/rendering module. | Evidence:
   `README.md:33-35` vs `package.json:3` ("TypeScript utilities and
   compatibility layer..."). | Suggested fix: Replace with an accurate
   description matching `package.json` (model-driven RN form rendering over
   Gluestack UI).

2. **[for-react-native] README License** — License mismatch. README states
   *"This project is released under the [MIT License]"* (`README.md:82-83`) but
   `package.json:70` declares `"license": "MPL-2.0 OR AGPL-3.0"` and the repo
   ships `LICENSE.md` accordingly. | Evidence: `README.md:83` vs
   `package.json:70`. | Suggested fix: Update README license section to
   MPL-2.0 OR AGPL-3.0.

3. **[for-react-native] workdocs/4-Description.md** — Description is
   `ts-workspace` template boilerplate, not this module's description: *"No one
   needs the hassle of setting up new repos every time. Now you can create new
   repositories from this template..."* (`workdocs/4-Description.md:1-6`).
   | Evidence: `workdocs/4-Description.md`. | Suggested fix: Write a real
   module description.

4. **[for-react-native] workdocs/6-Related.md** — "Related" links only to the
   `ts-workspace` template repo (`workdocs/6-Related.md:1-3`), not to the actual
   related Decaf modules. The README itself lists `decaf-ts`, `ui-decorators`,
   `styles`, `decorator-validation`, `db-decorators`
   (`README.md:44-48`). | Evidence: `workdocs/6-Related.md` vs `README.md:44-48`.
   | Suggested fix: Replace the template card with the actual related Decaf
   modules.

5. **[for-react-native] package.json dependencies** — Six declared Decaf
   runtime dependencies are never imported in `src/`: `@decaf-ts/cli`,
   `@decaf-ts/core`, `@decaf-ts/decoration`, `@decaf-ts/for-http`,
   `@decaf-ts/injectable-decorators`, `@decaf-ts/logging`
   (`package.json:76-84`). A `grep` of `src/**/*.{ts,tsx}` shows only
   `ui-decorators`, `decorator-validation`, and `db-decorators` are used.
   | Evidence: `package.json:76,77,79,81,82,83` vs absence of those imports
   in `src/`. | Suggested fix: Remove unused Decaf deps (or mark them as
   needed only by build/scripts with justification).

6. **[for-react-native] package entry / barrel** — `package.json:4` sets
   `"main": "expo-router/entry"` and `src/index.ts` is just
   `import "expo-router/entry"`. There is no public barrel re-exporting
   `engine`/`core`/`models`/`components`; the `description` claims a
   "compatibility layer for using @decaf-ts in React Native apps" implying a
   consumable library, but the package is structured as an Expo app entry.
   | Evidence: `package.json:4`, `src/index.ts:1`. | Suggested fix: Either
   document explicitly that this is an app scaffold (not an installable
   library) or add a library barrel/build output.

7. **[for-react-native] RnDecafCrudField min/maxLength casing** — The component
   destructures camelCase `minLength` and `maxLength`
   (`RnDecafCrudField.tsx:44-45`) and passes them to `InputField`/`TextareaInput`
   `maxLength`. However, the model decorators emit **lowercase** `minlength`/
   `maxlength` (confirmed: `Validation.keys()` returns `...maxlength,max,
   minlength,min...`; models use `@minlength(5)`/`@maxlength(36)` in
   `UserProfileModel.ts:24-25`). `RnCrudFormField` itself declares the lowercase
   `maxlength`/`minlength` fields (`RnCrudFormField.ts:24-25`). Because
   `RnDecafCrudField` reads camelCase, `maxLength`/`minLength` will always be
   `undefined` for fields driven by the model metadata. | Evidence:
   `RnDecafCrudField.tsx:44-45` vs `RnCrudFormField.ts:24-25` and
   `UserProfileModel.ts:24-25`. | Suggested fix: Use lowercase `minlength`/
   `maxlength` (or map both) when destructuring.

8. **[for-react-native] RnDecafCrudField Rules-of-Hooks violations** —
   `useTranslate` is a React hook (it calls `useState`/`useEffect`), but it is
   called inside the `renderLabel()` closure (conditionally, only when `label`
   is truthy — `RnDecafCrudField.tsx:65-70`) and inside `.map()` option loops
   (checkbox `RnDecafCrudField.tsx:141`, radio `:162`, select `:176,190,191`).
   Calling hooks in loops/conditionals violates the Rules of Hooks: the number
   of hook invocations per render depends on whether a label exists and on the
   number of options, which can change between renders. | Evidence:
   `RnDecafCrudField.tsx:68,121,141,162,176,190,191` (each `useTranslate(...)`
   call). | Suggested fix: Resolve translated strings via
   `TranslateService.get(key)` (non-hook) inside callbacks/maps, or restructure
   so hooks are called unconditionally at the top of the component.

9. **[for-react-native] RnDecafCrudForm renders invalid `<form>` element** —
   `RnDecafCrudForm.tsx:22` renders `<form>{children}</form>`. There is no
   `form` primitive in React Native; on native this is not a valid host
   component (only `react-native-web` would tolerate an unknown tag, and even
   then it is not a real form). | Evidence: `RnDecafCrudForm.tsx:22`.
   | Suggested fix: Replace `<form>` with a `View`/`VStack` (the outer `VStack`
   already wraps it) or use `react-hook-form`'s `handleSubmit` on a `Pressable`
   submit button instead of an HTML form.

10. **[for-react-native] RnDecafCrudField `date` input renders nothing** — The
    `case "date":` branch returns `component = null`
    (`RnDecafCrudField.tsx:244-246`), so model fields typed as `date` (e.g.
    `UserProfileModel.birthDate` with `@date("yyyy-MM-dd")`) render no input at
    all. | Evidence: `RnDecafCrudField.tsx:244-246` vs `UserProfileModel.ts:41-45`.
    | Suggested fix: Implement a date picker (e.g. a `DateTimePicker`/select)
    or fall back to a text input with the configured format.

11. **[for-react-native] RnFormService.validateFields is misnamed/misleading** —
    `validateFields(formId)` only checks whether a form is present in the
    registry (`if (!formMethods) return false; return true;`,
    `RnFormService.ts:281-285`) and never runs validation. Its JSDoc says
    *"Validates fields of a form"* / *"Checks if a form with the given ID
    exists...returning true if it is valid"*, conflating existence with
    validity. | Evidence: `RnFormService.ts:276-285`. | Suggested fix: Rename
    to `has`/`exists` or actually invoke validation; fix the JSDoc.

12. **[for-react-native] engine/index.ts duplicate export** — `RnRenderingEngine`
    is re-exported twice (`engine/index.ts:3` and `:6`). Harmless but sloppy.
    | Evidence: `engine/index.ts:3,6`. | Suggested fix: Remove the duplicate
    line 6.

13. **[for-react-native] ComponentRegistry has no isolation/unregister** —
    `ComponentRegistry` is a static module-level `Map` with only `register`/
    `get` (`ComponentRegistry.ts:49-60`); there is no `clear`/`unregister`, and
    `get` logs a `console.warn` for every miss. Because it is global, multiple
    apps/tests/engines share one registry and cannot reset it. | Evidence:
    `ComponentRegistry.ts:48-61`. | Suggested fix: Add `unregister`/`clear`
    (and/or instance-based registry) and make the missing-tag warning
    opt-in.

14. **[for-react-native] Inconsistent path-alias config across tooling** —
    `tsconfig.json` and `babel.config.js` define aliases for `@`, `@app`,
    `@components`, `@constants`, `@hooks`, `@engine`, and `tailwind.config`
    (`tsconfig.json:25-47`, `babel.config.js:42-54`). `metro.config.js` defines
    only `@app`, `@components`, `@constants`, `@hooks`, `@engine` and omits `@`
    and `tailwind.config` (`metro.config.js:6-12`). Yet `@/src/...` imports are
    used throughout (e.g. `RnDecafCrudField.tsx:32`,
    `LanguageSelector.tsx:3`, `RnFieldset.tsx:6`, `tabs/(tabs)/index.tsx:5-9`).
    Under Metro these `@/...` imports rely solely on the Babel resolver
    running, which is fragile/inconsistent. | Evidence: `metro.config.js:6-12`
    vs `babel.config.js:42-54` and `tsconfig.json:25-47`. | Suggested fix: Align
    the alias set across all three configs (add `@` and `tailwind.config` to
    Metro, or standardize on one resolver).

15. **[for-react-native] Duplicate useColorScheme** — `src/hooks/useColorScheme.ts`
    and `src/components/useColorScheme.ts` are byte-identical
    (`export { useColorScheme } from "react-native"`), with `.web.ts`
    companions in both locations. The root layout imports the `components/`
    copy (`app/_layout.tsx:8`). | Evidence: `hooks/useColorScheme.ts:1` vs
    `components/useColorScheme.ts:1`; `app/_layout.tsx:8`. | Suggested fix:
    Keep one canonical location (e.g. `hooks/`) and re-export or remove the
    duplicate.

16. **[for-react-native] AddressModel.state label is a copy-paste of
    `address.street.label`** — The `state` select field is decorated with
    `label: "address.street.label"` (`AddressModel.ts:39`), duplicating the
    street field's label instead of a `address.state.label` key. | Evidence:
    `AddressModel.ts:39` vs `AddressModel.ts:9` (street uses the same key).
    | Suggested fix: Use a distinct `address.state.label` key (and add it to
    the i18n resources).

17. **[for-react-native] Option.value typed `string` but models use numeric
    option values** — `Option.value` is typed `string`
    (`RnCrudFieldProps.ts:9-11`), but `ProfessionalInfoModel.position` select
    options use numeric values `{ value: 1, text: ... }` … `{ value: 0, ... }`
    (`ProfessionalInfoModel.ts:13-17`), and `position` is typed `number`
    (`:19`). This type mismatch is unguarded (`noImplicitAny:false` etc.) and
    breaks the `option.value === value` comparison in `RnDecafCrudField`'s
    select branch (`RnDecafCrudField.tsx:172`). | Evidence:
    `RnCrudFieldProps.ts:9-11` vs `ProfessionalInfoModel.ts:13-19` and
    `RnDecafCrudField.tsx:172`. | Suggested fix: Widen `Option.value` to
    `string | number` and ensure comparison is type-coherent.

18. **[for-react-native] RnDecafCrudField select uses translated text as
    `selectedValue`** — In the select branch, `selectedValue={useTranslate(
    selectedOption?.text || "")}` (`RnDecafCrudField.tsx:176`) sets the
    selected value to the **translated label text** rather than the option's
    `value`. `SelectItem value={option.value}` (`:191`) uses the raw value, so
    the displayed selection will not match the option values (broken
    selection display). | Evidence: `RnDecafCrudField.tsx:176` vs `:191`.
    | Suggested fix: `selectedValue` should be the option `value` (translated
    text belongs only on the item `label`).

19. **[for-react-native] RnCrudFormField.getErrors / getProps are stubs with
    misleading JSDoc** — `getErrors(parent: HTMLElement): string | void {}`
    has an empty body yet its JSDoc says *"Retrieves all errors...returns An
    array of error objects"* (`RnCrudFormField.ts:98-102`); `getProps()`
    returns nothing with a commented-out body (`:116-118`). | Evidence:
    `RnCrudFormField.tsx:98-102,116-118`. | Suggested fix: Implement or remove,
    and correct the JSDoc return-type descriptions.

20. **[for-react-native] Inconsistent model constructor patterns** —
    `UserProfileModel` uses `super(arg)` with `ModelArg<UserProfileModel>`
    (`UserProfileModel.ts:109-111`), while `AddressModel` and
    `ProfessionalInfoModel` call `super()` then `Model.fromObject(this, args)`
    with `args: Partial<...>` (`AddressModel.ts:49-52`,
    `ProfessionalInfoModel.ts:60-63`). The demo passes `address` as a plain
    object but `professionalInfo` as a `new ProfessionalInfoModel(...)`
    (`tabs/(tabs)/index.tsx:25-47`). | Evidence: `UserProfileModel.ts:109-111`
    vs `AddressModel.ts:49-52` / `ProfessionalInfoModel.ts:60-63`. | Suggested
    fix: Standardize on one construction pattern across the example models.

---

*End of brief. Total inaccuracies found: 20.*
