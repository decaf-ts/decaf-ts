# Research Brief 14 — Apps & Demos (`web-page`, `demo`)

Consolidated read-only research brief for the **Architecture handbook** and **design
specification**. Scope: the two top-of-stack application modules in the decaf-ts
monorepo — `web-page` (the decaf-ts marketing website) and `demo` (the reference demo
project with models, forms, `FakerRepository` and two Angular apps). All statements are
grounded in the actual source, tests, README/workdocs and build configuration as found in
`/workspaces/decaf-ts`. No tests or builds were run; nothing was modified.

---

### web-page (`@decaf-ts/ts-workspace` v3.9.7)

1. **Identity**
   - Dir: `/workspaces/decaf-ts/web-page`
   - Package name: `@decaf-ts/ts-workspace` (see `web-page/package.json:2`)
   - Version: `3.9.7`
   - Package description: `"template for ts projects"` (`web-page/package.json:4`)
   - Author: Tiago Venceslau; license MIT; `type: module`; engines node >=20, npm >=10.
   - Note: the directory is `web-page` and the app is the decaf-ts website, but the
     published package identity is still the `ts-workspace` template (see Inaccuracies).

2. **Purpose & role**
   - The official decaf-ts marketing website, built as an Angular 21 standalone app on
     Ionic 8 (`provideIonicAngular({ mode: 'md' })`). It is a static, content-driven site:
     six routed pages (index, modules, features, tutorials, examples, community) in four
     locales (`en_en`, `en_us`, `pt_br`, `pt_pt`).
   - It sits at the very top of the decaf layering: it consumes the framework
     (`@decaf-ts/core` RamAdapter, `@decaf-ts/for-angular` rendering engine,
     `@decaf-ts/ui-decorators`, `@decaf-ts/decorator-validation`, `@decaf-ts/decoration`)
     rather than providing framework capabilities. It doubles as the canonical consumer
     example of the for-angular model-rendering + RamAdapter stack.
   - Site content is modelled as decaf models and persisted per-locale in an in-memory
     `RamAdapter`, then rendered by the decaf `NgxRenderingEngine` through dynamic
     components — i.e. the site is itself a decaf "app" rather than hand-written HTML.

3. **Dependencies**
   - Decaf runtime deps (`web-page/package.json` `dependencies`): `@decaf-ts/core`,
     `@decaf-ts/db-decorators`, `@decaf-ts/decorator-validation`, `@decaf-ts/for-angular`,
     `@decaf-ts/injectable-decorators`, `@decaf-ts/logging`, `@decaf-ts/styles`,
     `@decaf-ts/ui-decorators`. Also uses `@decaf-ts/decoration` (imported in
     `src/app/structure/*.ts` and `src/app/models/*.ts` via `prop`).
   - Key external deps: Angular 21 (`@angular/*`), `@ionic/angular` ^8.7.4,
     `@ngx-translate/core` + `http-loader` ^17, `rxjs` ~7.8, `zone.js`, `reflect-metadata`,
     `@tabler/icons-webfont`, `ionicons`, `taffydb`, `better-docs`.
   - Decaf dev deps: `@decaf-ts/cli`, `@decaf-ts/utils`, `@decaf-ts/for-couchdb`,
     `@decaf-ts/for-nano`, `@decaf-ts/for-pouch`, `@decaf-ts/for-typeorm` (the latter four
     are declared but not actually imported by `src/` — see Inaccuracies).
   - Depended on by: nothing in the monorepo imports `web-page`; it is a leaf app. (Its
     `files` field publishes `lib`, `dist`, `workdocs/assets/slogans.json`.)

4. **Architecture & structure**
   - `src/main.ts` — Angular bootstrap: `bootstrapApplication(AppComponent, { providers:
     [provideZoneChangeDetection({eventCoalescing:true}), ...AppConfig.providers] })`.
   - `src/app/app.component.ts` — root `AppComponent`, template is only
     `<router-outlet></router-outlet>`.
   - `src/app/app.config.ts` — `AppConfig` providers: `provideIonicAngular({mode:'md'})`,
     `provideDecafDbAdapter(RamAdapter, {user:'user'})` (with
     `DbAdapterFlavour = RamFlavour` from `@decaf-ts/core/ram`), `provideRouter(routes)`,
     `provideDecafPageTransition()`, singleton `SiteService`,
     `provideDecafI18nConfig({fallbackLang:'en_en', lang:'en_en'}, [{prefix:'./assets/i18n/', suffix:'.json'}])`,
     and `provideDecafDynamicComponents(SiteSectionComponent, WebAppPageComponent)`.
   - `src/app/app.routes.ts` — single host route `''` lazily loading
     `WebAppLayoutComponent`, with six lazy children (`''`, `modules`, `features`,
     `tutorials`, `examples`, `community`) all loading `SitePageComponent`; `**` redirects
     to `''`.
   - `src/app/structure/` — the site graph models: `WebApp` (root, `@pk id` = locale,
     `nav: Section[]`, `pages: WebAppPage[]`), `WebAppPage` (`header`/`sections`/`footer`
     `Section` lists), `Section` (layout block with `kind` discriminator and
     `items: SiteItem[]`). All `@uimodel`-decorated.
   - `src/app/models/` — content models: `SiteItem` (`@uilistmodel('app-site-item')`),
     `ModuleDoc` (`@uimodel('app-module-doc')`, `@pk name`), plus iterable content tables
     `ModuleFeature`, `HomeCard`, `Faq`, `Brand`, `Tutorial`, `Example`.
   - `src/app/seed/` — `i18n-data.ts` (auto-generated per-locale content: brands, cards,
     faq, tutorials, featureModules; exports `SITE_LOCALES`, `SiteLocale`, `SITE_SEED`,
     `SITE_EN_EN/EN_US/PT_BR/PT_PT`) and `site.seed.ts` (`buildSite(locale)` composing the
     `SeedSiteData` graph: nav, footer columns, social items, per-page sections).
   - `src/app/services/` — `site.service.ts` (`SiteService` + `ensureSiteReady`,
     `isSiteLocale`, `DEFAULT_LOCALE`) and `slogans.service.ts` (`SloganService`,
     Angular `@Injectable({providedIn:'root'})`).
   - `src/app/components/` — `web-app-layout` (chrome + locale switcher), `site-page`
     (resolves locale + page id, renders via `ngx-decaf-model-renderer`), `site-section`
     (`SiteSectionComponent` + `VisualPanelComponent`, the `@Dynamic()` render target for
     `Section`), `web-app-page` (`@Dynamic()` render target for `WebAppPage`),
     `site-nav`, and the list components `brands-list`, `home-cards-list`, `faq-list`,
     `modules-list`, `module-features-list`, `tutorials-list`, `examples-list` — all
     extending `list-base/module-list.base.ts` (`ModuleListBase extends ListComponent`
     from for-angular, with `filterByModule` input and `getFromModel()` override).
     Plus `safe-html.pipe.ts`.
   - `src/assets/` — logos/icons, `i18n/{en_en,en_us,pt_br,pt_pt}.json`, and build-time
     data `data/{modules.json, module-versions.json, slogans.json}`.
   - `www-mock/` — a static Tailwind-CDN mock site (HTML + per-locale JSON) used as the
     pixel-perfect visual reference for the Playwright visual-diff suite.
   - `scripts/collect-data.cjs` — build-time collector (see Lifecycle).
   - `tests/` — jest unit/integration suites + `tests/playwright/` e2e + visual-diff.
   - `docs/` — generated typedoc HTML (stale, see Inaccuracies). `www/` — committed built
     app output. `angular.json` — project `web-page`, builder
     `@angular-builders/custom-webpack:browser`, outputPath `www`, custom webpack config.

5. **Public API surface** (barrel `src/index.ts`)
   - Structure models: `WebApp`, `WebAppPage`, `Section` — the site graph.
   - Content models: `SiteItem`, `ModuleDoc` (note: `ModuleFeature`, `HomeCard`, `Faq`,
     `Brand`, `Tutorial`, `Example` are NOT re-exported from the barrel — see
     Inaccuracies).
   - Seed: `i18n-data` (`SITE_LOCALES`, `SiteLocale`, `SITE_SEED`, per-locale constants,
     seed item interfaces) and `site.seed` (`buildSite`, `SeedSiteData`, `SeedPage`,
     `SeedSection`, `SeedItem`).
   - Service: `site.service` (`SiteService`, `ensureSiteReady`, `isSiteLocale`,
     `DEFAULT_LOCALE`). `SloganService` is also not re-exported from the barrel.
   - `VERSION` constant (`"0.0.0"`, replaced at release build).
   - Purpose summary: the barrel exposes the site graph models, the per-locale seed
     builder, and the seeding service — enough to rebuild/read the site graph, but not the
     full set of content models or the slogan service.

6. **Key patterns & concepts**
   - **Model-driven static site**: pages/sections/items are decaf `Model`s decorated with
     `@model()`, `@pk()`, `@prop()`, `@list()`, `@uimodel()` / `@uilistmodel()`. The DOM is
     produced by the for-angular `NgxRenderingEngine` mapping `uimodel` tags to `@Dynamic()`
     components (`app-site-section`, `app-web-app-page`).
   - **RamAdapter as content store**: content is seeded into an in-memory adapter
     (`provideDecafDbAdapter(RamAdapter, {user:'user'})`) and read back through
     `Repository.forModel(...)`; there is no backend. `ModuleListBase` queries these
     tables (optionally filtered by `module`) for the list sections.
   - **Per-locale seeding with dedupe**: `ensureSiteReady(locale)` keeps a module-scoped
     `READY_LOCALES` promise map so concurrent components seed a locale exactly once.
     Seeding is idempotent (delete-then-create per record).
   - **i18n via ngx-translate**: visible strings are locale keys (`titleKey`,
     `subtitleKey`, `kickerKey`) resolved at render time; locale assets live in
     `src/assets/i18n/*.json` and are loaded by `provideDecafI18nConfig`.
   - **Locale resolution order** (`WebAppLayoutComponent.resolveLocale` /
     `SitePageComponent.resolveLocale`): `?lang=` URL param → `translateService.currentLang`
     → `localStorage['site-locale']` → `navigator.languages` prefix match → `DEFAULT_LOCALE`
     (`en_us`).
   - **Build-time data collection**: `scripts/collect-data.cjs` (run via `prebuild:app*`
     hooks) scans `node_modules/@decaf-ts/*` and emits `assets/data/slogans.json` (per-module
     slogan catalogs) and `assets/data/module-versions.json` (resolved versions), which the
     app `fetch()`es at runtime.
   - **Slogan bias**: `SloganService.slogan(module?)` picks a random slogan, with a
     `moduleBias = 0.7` probability of drawing from the named module's own catalog.

7. **Lifecycle / configuration / environment**
   - Boot: `main.ts` → `bootstrapApplication(AppComponent, AppConfig)`. `AppConfig` wires
     Ionic (md mode), the RamAdapter DB provider, router, page transitions, the singleton
     `SiteService`, i18n, and the two dynamic render components.
   - On first navigation, `WebAppLayoutComponent.ngOnInit` resolves the locale, calls
     `translateService.use(locale)`, then `ensureSiteReady(locale)` + `getSite(locale)`.
     Each `SitePageComponent` re-resolves the locale and calls `ensureSiteReady` +
     `getPage(locale, pageId)` (page id derived from the URL path, default `index`).
   - Flavour: `RamFlavour` (from `@decaf-ts/core/ram`) is the DB adapter flavour
     (`DbAdapterFlavour` alias in `app.config.ts`).
   - Env vars / defaults: no app-specific env vars in source; defaults are `DEFAULT_LOCALE
     = 'en_us'`, i18n `fallbackLang/lang = 'en_en'`, RamAdapter `user = 'user'`, slogan
     `moduleBias = 0.7`. Build config via `angular.json` (output `www`, custom webpack,
     production budgets 10mb/20mb initial).
   - Scripts: `start` (ng serve :8111 dev), `build:app`/`build:app:prod`, `serve:www`
     (build prod + http-server :8111), `build:gh:pages` (base-href `./` + 404 copy),
     `collect:data`, `test:app` (jest).

8. **Data & control flow**
   - **Seeding**: `SiteService.seed(locale)` → `seedSite` (build `WebApp` graph via
     `buildWebApp`/`buildSite`, delete-then-create in `Repository.forModel(WebApp)`) →
     `seedModules` (fetch `assets/data/modules.json`, build `ModuleDoc` per module with
     examples + per-locale tutorials, delete-then-create) → `seedContent` (fetch
     `modules.json` again for examples; write `Brand`, `HomeCard`, `Faq`, `Example`,
     `Tutorial`, `ModuleFeature` rows, each delete-then-create).
   - **Rendering a page**: route → `SitePageComponent` → `ensureSiteReady` +
     `getPage(locale, pageId)` → `WebAppPage` model → `<ngx-decaf-model-renderer
     [model]="page">` → engine renders `WebAppPageComponent` (header/sections/footer) →
     each `Section` renders `SiteSectionComponent` (branching on `kind`: hero,
     logo-cloud, features, cta, showcase, faq, modules, features-page, tutorials,
     examples, community, footer, footer-slim) → list sections instantiate the
     `*-list` components, which query the RamAdapter tables via `ModuleListBase`.
   - **Footer slogan**: when a `footer` section renders, `SiteSectionComponent.ngOnInit`
     calls `SloganService.slogan(queryModule())` to show a (module-biased) slogan.

9. **Testing**
   - Jest (node env, `jest.config.cjs`, `testRegex /tests/.*\.(test|spec)\.(ts|tsx)$`,
     ignores `/tests/playwright/`):
     - `tests/site.seed.test.ts` — `buildSite` per locale: identity, nav, page order
       (index/modules/features/tutorials/examples/community), index section kinds, slim
       footers on sub-pages, list-bearing body sections.
     - `tests/site.service.test.ts` — seed + read-back as model instances, per-locale
       isolation, empty module list.
     - `tests/iterable-tables.test.ts` — reads seeded `Brand`/`HomeCard`/`Faq`/`Tutorial`/
       `Example`/`ModuleFeature` rows back through `Repository.forModel`.
     - `tests/locale-structure.test.ts` — slogans excluded from seed, nav/page structure,
       hero/footer coupling, i18n-key discipline.
     - `tests/model-decoration.test.ts` — asserts `@uimodel`/`@uilistmodel` tags and
       `@list` clazz wiring via `Metadata`.
     - `tests/module-doc.test.ts` — `ModuleDoc` seeding for every module in
       `modules.json` (>=20), per-locale tutorials.
     - `tests/slogans.service.test.ts` — bias, fallbacks, null catalog.
     - `tests/unit/ts-workspace.test.ts` — barrel surface via `workspace-target.ts`
       (`TEST_TARGET` = src|lib|dist).
   - Playwright (`tests/playwright/`): `e2e.spec.ts` (six pages × four locales render with
     localized content, footer placement, no console/page errors) and
     `visual-diff.spec.ts` (pixel-matches the built app against `www-mock` goldens,
     two-phase via `VISUAL_TARGET=mock|app`, per page × locale × breakpoint).
   - Notable gaps: no tests for `WebAppLayoutComponent`/`SitePageComponent` locale
     resolution logic in isolation; the committed `tests/playwright/playwright-report/`
     and `test-results/` artifacts (see Inaccuracies).

10. **Usage example** (derived from `tests/site.service.test.ts`)
    ```ts
    import { RamAdapter } from '@decaf-ts/core/ram';
    import { SiteService } from '../src/app/services/site.service';
    import { WebApp } from '../src/app/structure/WebApp';

    new RamAdapter({ user: 'site-service-test' });
    const service = new SiteService();
    await service.seed('en_us');

    const site = await service.getSite('en_us');   // WebApp, 6 pages
    const index = await service.getPage('en_us', 'index');
    // index.sections[0] is a Section; index.footer[0].kind === 'footer'
    ```
    And the seed-builder surface (`tests/site.seed.test.ts`):
    ```ts
    import { buildSite } from '../src/app/seed/site.seed';
    const site = buildSite('en_us');
    site.pages.map(p => p.id); // ['index','modules','features','tutorials','examples','community']
    ```

11. **Relationships**
   - Consumes `@decaf-ts/core` (`Repository`, `Context`, `Service`, `@pk`, `RamAdapter`/
     `RamFlavour` from `core/ram`), `@decaf-ts/for-angular` (`provideDecafDbAdapter`,
     `provideDecafI18nConfig`, `provideDecafDynamicComponents`, `provideDecafPageTransition`,
     `ModelRendererComponent`, `ListComponent`, `NgxComponentDirective`, `Dynamic`,
     `KeyValue`), `@decaf-ts/ui-decorators` (`@uimodel`, `@uilistmodel`),
     `@decaf-ts/decorator-validation` (`Model`, `@model`, `@list`), `@decaf-ts/decoration`
     (`@prop`), `@decaf-ts/logging` (`Logging`), `@decaf-ts/db-decorators`,
     `@decaf-ts/injectable-decorators`, `@decaf-ts/styles`.
   - Its content (`modules.json`, slogans, versions) is derived from the other decaf
     packages at build time, so it acts as a live catalog of the framework.
   - Nothing depends on it.

12. **Consumer notes**
   - The package is published under the name `@decaf-ts/ts-workspace` (the template
     identity), not `@decaf-ts/web-page`; treat the name/description as legacy.
   - Content is 100% client-side in a `RamAdapter`; nothing persists across reloads —
     every page view re-seeds (deduped per locale per process).
   - `modules.json`, `module-versions.json`, `slogans.json` are build-time assets; a stale
     `node_modules/@decaf-ts` set yields a stale site. `collect-data.cjs` no-ops if the
     `@decaf-ts` scope is missing.
   - The barrel does not export all content models or `SloganService`; import those from
     their files if you need them.
   - `www/` (built output) and Playwright report artifacts are checked in — do not treat
     `www/` as source of truth.
   - Maturity: this is the framework's own marketing site; it is the reference consumer
     for the for-angular + RamAdapter + ui-decorators stack, but it is not a library meant
     to be imported by other apps.

13. **Inaccuracies found**
   1. **[web-page]** package identity — `package.json` name is `@decaf-ts/ts-workspace` and
      description is `"template for ts projects"`, but the directory/app is the decaf-ts
      website (`web-page`). The published identity does not match the module. | Evidence:
      `web-page/package.json:2` (`"name": "@decaf-ts/ts-workspace"`),
      `web-page/package.json:4` (`"description": "template for ts projects"`). | Suggested
      fix: rename to `@decaf-ts/web-page` and set a website-app description.
   2. **[web-page]** README / workdocs describe the wrong thing — `README.md` and
      `workdocs/4-Description.md` are the `ts-workspace` template README ("Typescript
      Template … enterprise template for any standard Typescript project"), not the
      website app; they never mention the Angular site, its pages, locales, or the
      model-driven rendering. | Evidence: `web-page/README.md:2-4` ("## Typescript
      Template … enterprise template"); `web-page/workdocs/4-Description.md` ("No one needs
      the hassle of setting up new repos…"). | Suggested fix: rewrite README/workdocs for
      the website app.
   3. **[web-page]** seed generation script missing — the auto-generated header tells
      readers to "Re-run scripts/data-transform.cjs", but no such script exists (only
      `scripts/collect-data.cjs`). | Evidence: `web-page/src/app/seed/i18n-data.ts:2-3`
      ("AUTO-GENERATED from www-mock/locales … Re-run scripts/data-transform.cjs");
      `web-page/scripts/` contains only `collect-data.cjs`. | Suggested fix: add the
      transform script or correct the header to the real generator.
   4. **[web-page]** stale generated docs — `docs/` (typedoc HTML) references source files
      that no longer exist (e.g. `app_components_site-pages_*`, `marquee.directive`,
      `doc-block.component`, `faq-entry.component`, `app_models_Section.ts.html`,
      `SeedSloganItem`, `app_app.module_config`), so the published API docs do not match
      the current `src/` tree. | Evidence: `web-page/docs/` listing (e.g.
      `app_components_site-pages_modules-page.component.ts.html`,
      `app_components_marquee_marquee.directive.ts.html`) vs. `web-page/src/app/components/`
      (no `site-pages/`, no `marquee.directive.ts`). | Suggested fix: regenerate `docs/`
      from current source or remove the stale output.
   5. **[web-page]** barrel omits content models + slogan service — `src/index.ts` does not
      re-export `ModuleFeature`, `HomeCard`, `Faq`, `Brand`, `Tutorial`, `Example`, or
      `SloganService`, so the public API surface is smaller than the module's actual
      models/services. | Evidence: `web-page/src/index.ts` (exports only `SiteItem`,
      `Section`, `WebAppPage`, `WebApp`, `ModuleDoc`, `i18n-data`, `site.seed`,
      `site.service`, `VERSION`). | Suggested fix: export the content models and
      `SloganService` (or document per-file imports).
   6. **[web-page]** committed build/test artifacts — the built app output (`www/`) and
      Playwright report + test-results artifacts are checked into the repo, which can mask
      source changes and bloat the tree. | Evidence: `web-page/www/index.html` + hashed
      bundles; `web-page/tests/playwright/playwright-report/` and
      `web-page/tests/playwright/test-results/`. | Suggested fix: gitignore and remove
      `www/` and Playwright report/test-results output.
   7. **[web-page]** unused declared dev dependencies — `package.json` devDependencies
      include `@decaf-ts/for-couchdb`, `@decaf-ts/for-nano`, `@decaf-ts/for-pouch`,
      `@decaf-ts/for-typeorm`, but none are imported anywhere in `src/` and none are
      installed under `web-page/node_modules/@decaf-ts`. | Evidence:
      `web-page/package.json` devDependencies; `web-page/node_modules/@decaf-ts/` (no
      for-couchdb/for-nano/for-pouch/for-typeorm); no imports in `src/`. | Suggested fix:
      drop the unused dev deps.
   8. **[web-page]** Dockerfile is the template leftover — it sets `WORKDIR="ts-workspace"`,
      `ENTRYPOINT ["node","lib/cli.cjs"]` (this app has no CLI entrypoint) and
      `LABEL … "Template Dockerfile for typescript projects"`, none of which fit a static
      website app. | Evidence: `web-page/Dockerfile` (`ENV WORKDIR="ts-workspace"`,
      `ENTRYPOINT ["node", "lib/cli.cjs"]`, `LABEL … Template Dockerfile`). | Suggested
      fix: replace with a static-site serving Dockerfile (or remove).

---

### demo (`@decaf-ts/demo` v0.0.1)

1. **Identity**
   - Dir: `/workspaces/decaf-ts/demo`
   - Package name: `@decaf-ts/demo` (`demo/package.json:2`)
   - Version: `0.0.1`
   - Package description: `"Decaf demo project"` (`demo/package.json:4`)
   - Author: "Tiago Venceslau and Contributors"; license MIT; `type: module`; engines
     node >=20, npm >=10. Exports `lib` (cjs + esm) and `types: lib/index.d.ts`.

2. **Purpose & role**
   - A reference demo project showing how to define decaf models, forms and layouts with
     decorators, seed them with fake data (`FakerRepository` + `@faker-js/faker`), and
     render them in Angular apps via the for-angular rendering engine.
   - It sits at the top of the decaf layering as a consumer/sample, not a framework
     provider. It is the canonical "how to use" example for
     `@decaf-ts/decorator-validation`, `@decaf-ts/ui-decorators`, `@decaf-ts/db-decorators`,
     `@decaf-ts/core` and `@decaf-ts/for-angular`.
   - It ships two runnable Angular apps under `angular/`: `ew` (an Ionic CRUD/login
     dashboard) and `ionic` (an Ionic marketing-style site), both consuming the shared
     `src/` models via the `@shared/*` path alias.

3. **Dependencies**
   - Decaf runtime deps (`demo/package.json` `dependencies`): `@decaf-ts/cli`,
     `@decaf-ts/core`, `@decaf-ts/db-decorators`, `@decaf-ts/decorator-validation`,
     `@decaf-ts/for-angular`, `@decaf-ts/logging`, `@decaf-ts/ui-decorators`.
   - Key external deps: `@faker-js/faker` ^10 (dev), `@decaf-ts/utils` (dev),
     `@ionic/angular-toolkit` (dev). The Angular apps add their own deps (Angular 20,
     Ionic 8, ngx-translate, ionicons, etc.).
   - Depended on by: nothing in the monorepo imports `@decaf-ts/demo`; it is a leaf sample.

4. **Architecture & structure**
   - `src/index.ts` — barrel re-exporting `./utils`, `./models`, `./forms`, `./layouts`.
   - `src/models/` — `CategoryModel`, `EmployeeModel`, `DemoModel`, `UserModel` (all
     `@model()` + `@uimodel('ngx-decaf-crud-form')`; `DemoModel` composes `CategoryModel`
     and `UserModel` via `@uichild`).
   - `src/forms/` — `FieldsetForm.ts` (exports `User` + `FieldSetForm`), `LoginForm.ts`
     (`LoginForm` with `@uihandlers({login: LoginHandler})`), `SteppedForm.ts`
     (`SteppedForm`, `@uimodel('ngx-decaf-stepped-form', {pages:3, startPage:1})` — not
     exported from the barrel, see Inaccuracies).
   - `src/layouts/` — `Dashboard.ts` (`DashboardLayout`, `@uilayout('ngx-decaf-layout', 3,
     [...])` with `@uilayoutitem` grid placement and `@uichild`/`@uielement` cells).
   - `src/utils/` — `FakerRepository.ts` (`FakerRepository<T extends Model>` +
     `getFakerData`), `handlers.ts` (`LoginHandler extends EventHandler`),
     `constants.ts` (`SidebarMenu: IMenuItem[]`), `types.ts` (`IMenuItem`, `IRawQuery`).
   - `src/bin/cli.ts` — a template-leftover countdown CLI (see Inaccuracies).
   - `angular/ew/` — Ionic web app (`@decaf-ts/demo-angular-ew`, private): `app.component`
     (split-pane menu from `SidebarMenu`, seeds `FakerRepository` for `CategoryModel` +
     `EmployeeModel` in dev mode), `app.config` (`provideDbAdapter(RamAdapter, {user:'user'})`,
     i18n, router), pages `login` / `dashboard` / `model` (generic CRUD page driven by
     `modelName`/`operation`/`modelId` route params), components `header`, `container`,
     `back-button`, `logo`, `utils/NgxToastComponent`, `services/router.service`.
   - `angular/ionic/` — Ionic marketing app (`@decaf-ts/demo-angular-ionic`, private):
     pages `home` / `modules` / `examples` / `features` / `tutorials` built from static
     data in `src/app/utils/data.ts` and decaf layout models (`HomeLayout`, etc.), with
     `capacitor.config.json` for mobile.
   - `tests/` — `tests/unit/ts-workspace.test.ts` (stale, see Inaccuracies) and an empty
     `tests/integration/.gitlock`. `jest.config.cjs` (node env, ts-jest).
   - `workdocs/` — template workdocs (description/how-to-use are the ts-workspace text).
   - `Dockerfile` — template leftover (`WORKDIR="ts-workspace"`, `ENTRYPOINT node
     lib/cli.cjs`).

5. **Public API surface** (barrel `src/index.ts`)
   - `models`: `CategoryModel`, `EmployeeModel`, `DemoModel`, `UserModel` — example CRUD
     models with ui/validation decorators.
   - `forms`: `User`, `FieldSetForm` (from `FieldsetForm.ts`), `LoginForm` — example form
     models (`LoginForm` wires a `LoginHandler` via `@uihandlers`). `SteppedForm` is NOT
     exported.
   - `layouts`: `DashboardLayout` — example `@uilayout` grid.
   - `utils`: `FakerRepository`, `getFakerData`, `LoginHandler`, `SidebarMenu`, `IMenuItem`,
     `IRawQuery`.
   - Purpose summary: the barrel exposes the sample models/forms/layouts plus the fake-data
     repository and menu constants — the reusable building blocks the two Angular apps
     consume via `@shared/*`.

6. **Key patterns & concepts**
   - **Decorator-defined models**: `@model()` registers the class in the decaf model
     registry; `@pk({type:'Number'})` / `@id()` mark the primary key; validation decorators
     (`@required`, `@email`, `@password`, `@eq`, `@min`, `@max`, `@minlength`, `@date`,
     `@url`) attach rules; `@timestamp([OperationKeys.CREATE])` / `@hideOn(...)` attach
     db-decorator behaviour.
   - **UI binding decorators**: `@uimodel('ngx-decaf-crud-form')` maps a model to a CRUD
     form renderer; `@uielement('ngx-decaf-crud-field', {label, placeholder, type, options,
     page})` maps fields to inputs; `@uichild(ModelName, 'ngx-decaf-fieldset')` embeds child
     models; `@uilistitem` / `@uilistprop` / `@uilayout` / `@uilayoutitem` drive list and
     layout rendering.
   - **FakerRepository**: a thin wrapper that resolves a model constructor by name
     (`Model.get(...)`), obtains `Repository.forModel(constructor, flavour)`, and on
     `init()` seeds 100 fake rows (employees or categories) via `getFakerData` +
     `faker` when the table is empty.
   - **Event handlers**: `@uihandlers({login: LoginHandler})` binds named handlers to a
     form; `LoginHandler.handle(event)` validates presence of username + password and
     returns a boolean the page uses to navigate/toast.
   - **Generic model page**: `angular/ew` `ModelPage` takes `modelName`/`operation`/
     `modelId` as route inputs, resolves the model via `Model.get(modelName)`, and performs
     read/create/update/delete through `Repository.forModel`, rendering the model with
     `ngx-decaf-model-renderer`.
   - **Shared source across apps**: both Angular apps import the shared models/forms/utils
     via the `@shared/*` → `../../src/*` tsconfig path alias.

7. **Lifecycle / configuration / environment**
   - The `src/` library has no boot of its own; it is consumed by the Angular apps.
   - `angular/ew` boot: `main.ts` → `bootstrapApplication(AppComponent, appConfig)`;
     `appConfig` provides `provideDbAdapter(RamAdapter, {user:'user'})`,
     `provideIonicAngular()`, router (login → dashboard → model routes),
     `provideTranslateService` + `provideI18nLoader({prefix:'./assets/i18n/',
     suffix:'.json'})`. `AppComponent.ngOnInit` → `initializeApp()` seeds
     `FakerRepository` for `CategoryModel` + `EmployeeModel` when `isDevelopmentMode()`.
   - `angular/ionic` boot: `bootstrapApplication(AppComponent, appConfig)`; pages render
     static decaf layout models (no DB seeding).
   - Flavour: both apps use the `RamAdapter` (in-memory) flavour; `FakerRepository` passes
     the adapter's `flavour` to `Repository.forModel`.
   - Env vars / defaults: no app-specific env vars in source; defaults are RamAdapter
     `user = 'user'`, i18n `lang/fallbackLang = 'en'`, faker row count `100`. Scripts:
     `start`/`server` (ng serve :8120), `build`, `test` (ng test / karma), `lint`.

8. **Data & control flow**
   - **Seeding (ew app)**: `AppComponent.initializeApp()` → for each of
     `[new CategoryModel(), new EmployeeModel()]` → `new FakerRepository(adapter, model)` →
     `init()` → if empty, `getFakerData(100, ...)` builds rows → `repository.createAll(rows)`.
   - **Login flow**: `LoginPage` renders `LoginForm` via `ngx-decaf-model-renderer`; on
     submit, `handleEvent(CrudFormEvent)` instantiates `handlers['login']`
     (`LoginHandler`), `handle(event)` returns `!!username && !!password`; on success the
     page navigates to `/dashboard` and shows a toast.
   - **CRUD flow (ModelPage)**: route `model/:modelName/:operation[/:modelId]` →
     `Model.get(modelName)` → `Repository.forModel(constructor)` → `read`/`create`/
     `update`/`delete` based on `operation` → `refresh` + navigate back + toast.
   - **Rendering**: models/forms/layouts are rendered by the for-angular engine through
     `ngx-decaf-model-renderer` / `LayoutComponent`, driven entirely by the decorators.

9. **Testing**
   - Jest (`jest.config.cjs`, node env, ts-jest, `testRegex /tests/.*\.(test|spec)\.(ts|tsx)$`):
     the only test is `tests/unit/ts-workspace.test.ts`, which is a stale template test
     importing symbols that do not exist in this package (see Inaccuracies). There is no
     real coverage of the models, forms, `FakerRepository` or handlers.
   - Karma (`angular/ew/karma.conf.js`, `angular/ionic/karma.conf.js`): minimal
     "should create" specs (`login.page.spec.ts`, and ionic page/component specs).
   - `tests/integration/` is empty (only `.gitlock`).
   - Notable gaps: no tests for `FakerRepository` seeding, `LoginHandler`, model
     validation, or the generic `ModelPage` CRUD flow; the single jest unit test is broken.

10. **Usage example** (derived from `src/utils/FakerRepository.ts` + `angular/ew`
    `app.component.ts`)
    ```ts
    import { FakerRepository } from '@decaf-ts/demo';
    import { CategoryModel } from '@decaf-ts/demo';

    // adapter is the injected RamAdapter (DB_ADAPTER_PROVIDER_TOKEN)
    const repo = new FakerRepository<CategoryModel>(adapter, new CategoryModel());
    await repo.init(); // seeds 100 fake categories if the table is empty
    ```
    And a decorated model (`src/models/CategoryModel.ts`):
    ```ts
    @uilistitem('ngx-decaf-list-item', { icon: 'cafe-outline', className: 'testing' })
    @uimodel('ngx-decaf-crud-form')
    @model()
    export class CategoryModel extends Model {
      @pk({ type: 'Number' }) id!: number;
      @required()
      @uielement('ngx-decaf-crud-field', { label: 'category.name.label' })
      @uilistprop('title')
      name!: string;
      // ...
    }
    ```

11. **Relationships**
   - Consumes `@decaf-ts/core` (`Model`, `Repository`, `RamAdapter`, `@pk`, `@id`),
     `@decaf-ts/decorator-validation` (`Model`, `@model`, validation decorators,
     `ModelArg`, `Constructor`), `@decaf-ts/ui-decorators` (`@uimodel`, `@uielement`,
     `@uichild`, `@uilistitem`, `@uilistprop`, `@uilayout`, `@uilayoutitem`, `@uihandlers`,
     `@hideOn`, `EventHandler`), `@decaf-ts/db-decorators` (`OperationKeys`, `@timestamp`,
     `InternalError`, `IRepository`), `@decaf-ts/for-angular` (`DecafRepository`,
     `DecafRepositoryAdapter`, `formatDate`, `ModelRendererComponent`, `LayoutComponent`,
     `provideDbAdapter`, `DB_ADAPTER_PROVIDER_TOKEN`, `isDevelopmentMode`,
     `removeFocusTrap`, `getLogger`, `getLocaleContext`, `EventConstants`, `BaseCustomEvent`,
     `CrudFormEvent`, `KeyValue`), `@decaf-ts/logging` (`Logger`).
   - The `angular/ew` app additionally depends on `@decaf-ts/for-http`,
     `@decaf-ts/injectable-decorators`, `@decaf-ts/reflection`,
     `@decaf-ts/transactional-decorators`, `@decaf-ts/styles`; `angular/ionic` adds
     `@decaf-ts/decoration`, `@decaf-ts/for-http`, `@decaf-ts/transactional-decorators`,
     `@decaf-ts/styles`, `@bwip-js/browser`.
   - Nothing depends on `@decaf-ts/demo`.

12. **Consumer notes**
   - Version `0.0.1` — explicitly a sample, not a stable library; APIs may change.
   - `SteppedForm` exists in `src/forms/` but is not exported from the barrel, so it is not
     reachable via `@decaf-ts/demo` (import the file directly if needed).
   - The `ew` app's `app.config.ts` imports `provideDbAdapter` and `provideI18nLoader`
     from `@decaf-ts/for-angular`, but the current for-angular exports are
     `provideDecafDbAdapter` / `provideDecafI18nLoader` (renamed) — the ew app config is
     stale against the current for-angular (see Inaccuracies).
   - `angular/ew` has no `node_modules` installed in this workspace (only `angular/ionic`
     does), so the ew app is not buildable as-is here without installing its deps.
   - `FakerRepository` is generic over `Model` but its generator only special-cases
     `CategoryModel` (everything else is generated as employees); reuse for other models
     requires extending `getFakerData`.
   - The `SidebarMenu` in `src/utils/constants.ts` lists routes (`/fieldset`,
     `/steps-form`, `/crud/*`, `/list/*`, `/list-model/*`) that the `ew` app's route table
     does not define (see Inaccuracies).
   - `Dockerfile`, `src/bin/cli.ts`, `workdocs/` and `README.md` are `ts-workspace`
     template leftovers, not demo-specific.

13. **Inaccuracies found**
   1. **[demo]** README / workdocs describe the wrong thing — `README.md` and
      `workdocs/4-Description.md` are the `ts-workspace` template README ("Typescript
      Template … enterprise template for any standard Typescript project"), not the demo
      project; they never mention the models, forms, `FakerRepository` or the two Angular
      apps. | Evidence: `demo/README.md:2-4` ("## Typescript Template … enterprise
      template"); `demo/workdocs/4-Description.md` ("No one needs the hassle of setting up
      new repos…"). | Suggested fix: rewrite README/workdocs for the demo project.
   2. **[demo]** broken/stale unit test — `tests/unit/ts-workspace.test.ts` imports
      `{ ChildClass, Class, complexFunction, something }` from `../../src`, but none of
      those symbols exist anywhere in `demo/src` (the barrel only exposes utils/models/
      forms/layouts). The test is a template leftover that cannot pass. | Evidence:
      `demo/tests/unit/ts-workspace.test.ts:1` (`import {ChildClass, Class,
      complexFunction, something,} from "../../src";`); no such symbols in
      `demo/src/**` (grep). | Suggested fix: delete the stale test or replace it with real
      demo tests.
   3. **[demo]** stale for-angular imports in the ew app — `angular/ew/src/app/app.config.ts`
      imports `provideDbAdapter` and `provideI18nLoader` from `@decaf-ts/for-angular`, but
      the current for-angular exports are `provideDecafDbAdapter` and
      `provideDecafI18nLoader` (the old names appear only in JSDoc examples). The ew app
      config references a renamed/removed API. | Evidence:
      `demo/angular/ew/src/app/app.config.ts:10` (`import { provideI18nLoader,
      I18nLoaderFactory, provideDbAdapter } from '@decaf-ts/for-angular';`);
      `for-angular/src/lib/engine/helpers.ts:119` (`export function
      provideDecafDbAdapter…`); `for-angular/src/lib/i18n/Loader.ts:228` (`export function
      provideDecafI18nConfig…`); no `provideDbAdapter`/`provideI18nLoader` export in
      `for-angular/src`. | Suggested fix: update the ew app imports to the current
      `provideDecafDbAdapter` / `provideDecafI18nLoader` names.
   4. **[demo]** dead menu routes — `src/utils/constants.ts` `SidebarMenu` lists routes
      (`/fieldset`, `/steps-form`, `/crud/read`, `/crud/create`, `/crud/delete`,
      `/list/infinite`, `/list/paginated`, `/list-model/infinite`, `/list-model/paginated`)
      that the `ew` app's route table does not define (only `''`, `login`, `dashboard`,
      `model`, `model/:modelName/:operation`, `model/:modelName/:operation/:modelId`). |
      Evidence: `demo/src/utils/constants.ts:3-46` (SidebarMenu urls) vs.
      `demo/angular/ew/src/app/app.routes.ts` (defined routes). | Suggested fix: implement
      the missing pages or trim the menu to existing routes.
   5. **[demo]** barrel omits SteppedForm — `src/forms/SteppedForm.ts` defines and exports
      `SteppedForm`, but `src/forms/index.ts` does not re-export it (only `FieldsetForm`
      and `LoginForm`), so `SteppedForm` is unreachable from the `@decaf-ts/demo` barrel
      even though the menu references a steps-form page. | Evidence:
      `demo/src/forms/index.ts:1-2` (`export * from './FieldsetForm'; export * from
      './LoginForm';`); `demo/src/forms/SteppedForm.ts` (defines `SteppedForm`). |
      Suggested fix: `export * from './SteppedForm';` in `src/forms/index.ts`.
   6. **[demo]** template leftovers — `src/bin/cli.ts` is a 60-second countdown CLI
      ("This is a poor example of a cli") unrelated to the demo, and `Dockerfile` uses
      `WORKDIR="ts-workspace"` with `ENTRYPOINT ["node","lib/cli.cjs"]` (a template
      entrypoint). | Evidence: `demo/src/bin/cli.ts` (countdown `iterator()`);
      `demo/Dockerfile` (`ENV WORKDIR="ts-workspace"`, `ENTRYPOINT ["node", "lib/cli.cjs"]`).
      | Suggested fix: remove the template CLI/Dockerfile or replace them with
      demo-appropriate ones.
   7. **[demo]** ew app dependencies not installed in workspace — `angular/ew/package.json`
      declares deps (including `@decaf-ts/reflection`, which has no source in this
      monorepo) but `angular/ew/` has no `node_modules`, so the ew app cannot be built as-is
      in this workspace (only `angular/ionic/` has `node_modules`, where `reflection` is
      present). | Evidence: `demo/angular/ew/package.json` dependencies; `demo/angular/ew/`
      (no `node_modules`); `demo/angular/ionic/node_modules/@decaf-ts/` (includes
      `reflection`). | Suggested fix: install the ew app deps or document the install step.
