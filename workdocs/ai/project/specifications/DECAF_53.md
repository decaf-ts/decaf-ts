# DECAF-53: Editable Dashboard Component (for-angular)

**Status:** Approved — CTO technical review **approve-with-changes** 2026-09-07 on [SAA-913](/SAA/issues/SAA-913); all required changes and both PM decisions folded into this record 2026-09-07 (completion milestone [SAA-921](/SAA/issues/SAA-921))
**Priority:** Medium
**Owner:** Product Manager (product intent and scope) / CTO (technical review approved)

> **Provenance.** Board directive (verbatim, from [SAA-908](/SAA/issues/SAA-908)): "put this on hold for now; this requires a specification;". The original board request is preserved verbatim in §1. Product problem statement, goals, non-goals, user stories, and acceptance criteria are Product Manager–approved content for the initial record (milestone [SAA-912](/SAA/issues/SAA-912), 2026-09-06). The **formal CTO technical review of architecture, feasibility, security, and operational implications completed 2026-09-07 on [SAA-913](/SAA/issues/SAA-913): APPROVE-WITH-CHANGES** (confidence 0.9; reviewed against the context-manifest pinned at `160f18317344faf16828b785882207a1e7c0cacc`) — the five former §6 open questions are now decided (§6), the CTO's required changes are folded into §3/§4/§6, and the two product-side calls were decided by the Product Manager on 2026-09-07 (§6 decisions 4 and 6). The verbatim CTO verdict remains on [SAA-913](/SAA/issues/SAA-913); none of its decisions may be re-decided or weakened. No implementation children exist yet; decomposition is dispatched separately by the CEO after this specification completes, and implementation of [SAA-908](/SAA/issues/SAA-908) remains on hold by board directive until then.

## 1. Overview

for-angular consumers can build static screens with decaf's rendering engine, but an application user cannot compose a screen at runtime: pick components, arrange them on a grid, and save that layout as a consumable dashboard.

This specification introduces a reusable Dynamic Layout/Dashboard component in for-angular's `lib` (working name `DashboardComponent`, selector `ngx-decaf-dashboard`) plus a demo page in the for-angular `app`. The dashboard layout is a data-driven input expressed in columns/rows (lines); placed components carry grid position and size. The component uses decaf's `@uilayout`/`@uilayoutprop` metadata and `ModelBuilder` to dynamically generate renderable decaf UI model classes at runtime. The dashboard itself extends the Crud component pattern (create/update/read/delete), and every dashboard-selectable internal component is itself a Crud component marked by a dedicated decorator.

The demo page is a **distinct page/route** (working name `dashboard-builder`): the existing static demo already owns `app-dashboard` (`for-angular/src/app/pages/dashboard/`). The lib selector `ngx-decaf-dashboard` has no collision (CTO review §6 change 3).

It is distinct from [DECAF-40](./DECAF_40.md) (BI Dashboard Embed Plugins — embedding external Kibana/Superset BI dashboards) and [DECAF-41](./DECAF_41.md) (Kibana index-pattern builder): those integrate external BI tooling; this specification builds an in-app, runtime-composable dashboard of decaf components. Scope and outcomes do not overlap, so this is a new specification, not an amendment.

**Verbatim board request (2026-09-06, preserved without correction):**

> implement a Dynamic Layout/Dashboard component in for-angular's lib 9and a demo page in app);
> it should use decaf's @uilayout and ModelBuilder to dymanicaly generate renderable decal ui model classes;
>
> it should allow defining columns/lines layout as input;
>
> it should itself extend Crud component (have a create/edit and a read versions - create: select compoents, configure them (internal create/update model - they should also be crudCompoennts) and configure their size (columns and lines) and organize/position/rezize/drag, etc. when scaling by selectin and dragging borders, they should snp to the available positions; when dragging, the curretly selected desination (while mouse hold) should appear as a dotted border (and repect the selected component selected size), , and assemble/configure the layout;
>
> it should pure decaf: All decorated classes and handlers whenever possible;
>
> internal components should have a specific decorator, noting they are available to be selected  for the dashboard compoennet;
>
> they shuld also extends Crud compoetn, same considerations for create/edit modes. read is the consumer screen idspalying the configured component;, delete is a deleton confirmation screen (triggered by clickingthe x button in the compoentns top right corner when in create/update mode;

## 2. Goals

*   [ ] Ship a reusable Dynamic Layout/Dashboard component in for-angular's `lib` (working name `DashboardComponent`, selector `ngx-decaf-dashboard`) plus a demo page in the for-angular `app`.
*   [ ] Data-driven composition: the dashboard layout is an input expressed in columns/rows (lines); placed components carry grid position and size; the component uses decaf's `@uilayout`/`@uilayoutprop` metadata and `ModelBuilder` to dynamically generate renderable decaf UI model classes at runtime.
*   [ ] Full Crud behavior: the dashboard itself extends the Crud component pattern — create (compose a new dashboard), update (edit an existing composition), read (consumer screen rendering the saved composition, no editing affordances), delete (deletion confirmation screen triggered from a component's top-right `x` button in create/update mode).
*   [ ] Interactive editing: select components from a palette; drag to position; resize by dragging borders; while the mouse is held during a drag, the destination appears as a dotted-border preview that respects the selected component's current size; both drag and border-resize snap to available grid positions.
*   [ ] Selectable internal components: a specific decorator marks a component as available in the dashboard's selection palette; decorated components are themselves Crud components — create/update configure them through their own internal create/update model; read is the consumer display.
*   [ ] Pure decaf: decorated classes and handlers wherever possible — no ad-hoc imperative wiring where a decorated decaf equivalent exists.
*   [ ] Serializable composition: create/update produce a persistable dashboard model; read consumes it.

**Non-goals (v1, Product Manager–approved):**

*   No new server-side APIs or persistence adapter changes — the dashboard model serializes through existing decaf model/repository machinery.
*   No undo/redo history.
*   No multi-user collaborative editing.
*   No mobile/Ionic-specific interaction design.
*   No nested dashboards.

## 3. User Stories / Requirements

*   **US-1:** As a **builder**, I select registered components from a palette and place them on the dashboard grid so that I can compose a new dashboard (create).
*   **US-2:** As a **builder**, I configure a placed component through its own create/update model so that the component is set up for consumers (the component is itself a Crud component).
*   **US-3:** As a **builder**, I size a component in columns/rows and drag it into position; the dotted drop preview appears while the mouse is held, respects the selected component's size, and placement snaps to available positions; border-drag resize snaps the same way.
*   **US-4:** As a **builder**, in create/update mode I click the component's top-right `x` and confirm deletion on a confirmation screen before the component is removed.
*   **US-5:** As a **consumer**, I open the dashboard in read mode; configured components render and function with no editing affordances.
*   **US-6:** As a **developer**, I mark any Crud-based component as dashboard-selectable with a single decorator; it appears in the palette automatically.
*   **US-7:** As a **developer**, I instantiate the dashboard with columns/rows input and a saved composition — no hand-written templates.

**Acceptance criteria (Product Manager–approved; AC-5/AC-8 sharpened and AC-10…AC-13 elevated to acceptance level by the CTO technical review 2026-09-07):**

*   **AC-1:** `DashboardComponent` exists in the for-angular lib, is `@Dynamic()`-decorated, and extends the Crud component pattern (create/read/update/delete operations; read/delete operate without an editable form group).
*   **AC-2:** A dedicated decorator marks internal components as dashboard-selectable; decorated components appear in the palette, undecorated ones do not.
*   **AC-3:** Internal components extend the Crud component pattern: create/update = configuration, read = consumer display, delete = deletion confirmation screen triggered by the top-right `x` in create/update mode.
*   **AC-4:** The dashboard accepts a columns/rows layout as input; composition and per-component size/position are expressed in grid units and materialize through `ModelBuilder`-generated, `@uilayout`/`@uilayoutprop`-decorated renderable model classes.
*   **AC-5:** Drag shows a dotted-border destination preview while the mouse is held; the preview respects the selected component's size; drop and border-resize snap to available grid positions. **Collision semantics (PM decision 2026-09-07): reject-overlap** — a drop/resize that would overlap an occupied cell renders the dotted preview in an invalid state and is rejected; no auto-reflow/push in v1.
*   **AC-6:** Create/update modes expose palette, drag, resize, and delete controls; read mode renders the saved composition through the standard rendering engine with no editing affordances.
*   **AC-7:** Pure decaf: decorated classes and decaf handlers wherever possible.
*   **AC-8:** A demo page in the for-angular app demonstrates create, read, update, and delete flows end to end, on a **distinct route** (e.g. `dashboard-builder`) that does not displace the existing static `app-dashboard` demo.
*   **AC-9:** The composed dashboard serializes to a persistable decaf model and read mode restores it.
*   **AC-10:** The palette is bounded by the `@Dynamic()` registry: every selectable component is statically imported and `@Dynamic()`-registered at build time; no runtime string→component creation (breaks Angular AOT).
*   **AC-11:** `ModelBuilder`-generated classes carry deterministic names (`setName()` — the builder requires a name, and persistence keys off class identity).
*   **AC-12:** Security of untrusted persisted compositions: component tags are whitelisted against the palette registry at load (unknown tags rejected, never resolved); config values are validated through the component's declared model validators before use; persisted documents never carry handler names or function references (handlers come only from build-time-registered component metadata); no `bypassSecurityTrust*` on any composition-derived content.
*   **AC-13:** All user-facing strings (palette labels, buttons, delete-confirmation screen) use translation keys through the existing ngx-translate integration — no hardcoded strings; the demo page carries the mandated Playwright i18n screenshot tests.

## 4. Architecture & Design

CTO-approved technical direction (formal CTO technical review completed 2026-09-07 on [SAA-913](/SAA/issues/SAA-913) — approve-with-changes; reviewed against the context-manifest pinned at `160f18317344faf16828b785882207a1e7c0cacc`; direction adopted as written plus the §6 decisions):

- **Runtime generation — build on the proven ModelBuilder machinery.** `ModelBuilder` (`decorator-validation/src/model/Builder.ts`) constructs `class DynamicBuiltClass extends Model` at runtime and applies `model()` plus arbitrary class decorators; `ui-decorators/src/overrides/ModelBuilderExtensions.ts` already adds `.uilayout(tag, colsMode, rows)`, `.uimodel()`, `.uihandlers()` to the builder; property decorators (`uielement`, `uichild`, `uilayoutprop(col, row)`) apply via `attr.decorate(...)`. The existing `ModelBuilderComponent` in for-angular already does exactly this today (`decorateClass(uilayout(...))` + `attr.decorate(uielement(...), uilayoutprop(...))`) and renders the result through the engine. The dashboard composes the same machinery: **one generated class per saved composition** — `@uilayout('ngx-decaf-layout', cols, rows)` plus one property per placed component carrying `uielement`/`uichild` and `uilayoutprop(col, row)`.
- **Angular AOT/JIT — no blocker, one hard rule.** AOT only matters for Angular components; generated classes are plain TS + `reflect-metadata`, never compiled by Angular. Rendering flows through `NgxRenderingEngine.fromFieldDefinition`, which resolves the metadata tag against components statically registered by `@Dynamic()` and instantiates them via `ViewContainerRef.createComponent`. **Hard rule (AC-10):** every selectable component must be statically imported and `@Dynamic()`-registered at build time; the palette is bounded by that registry; no runtime string→component creation (would require the JIT compiler and breaks AOT). **Deterministic `setName()` on generated classes is required (AC-11)** — ModelBuilder throws without a name, and persistence keys off class identity.
- **Crud base — extend `NgxFormDirective`.** "Extends the Crud component" binds concretely to the `CrudFormComponent` precedent: `CrudFormComponent extends NgxFormDirective`, is `@Dynamic()`-decorated, driven by an `operation` input, and read/delete already operate without an editable form group. `DashboardComponent` extends `NgxFormDirective` (operation semantics, handler wiring, submit-event machinery) with the composition model as its bound model; read mode renders the saved composition through `ngx-decaf-layout` with no editing affordances; delete flows through the confirmation path like `handleDelete`. Internal components follow the same pattern individually.
- **Selectable-component decorator — lives in `ui-decorators`, not the for-angular lib.** Mirror the graph editor precedent exactly: `@node()` + `GraphNodeManifest` + `registerNode()`/`graphNodes()` registry are flavor-neutral and live in `@decaf-ts/ui-decorators/graph`, with for-angular's `GraphNodeCatalogService` consuming them into a palette. The dashboard decorator (e.g. `@dashcomponent()`) likewise attaches metadata (palette label key, default size, configuration model reference) plus a registry function in `ui-decorators`, with the palette service in for-angular reading it. Putting it in for-angular would couple the concept to one flavor and break the `ui-decorators` metadata family precedent (`@uimodel`, `@uilayout`, `@uielement` all live there).
- **Interaction feasibility — drag/resize/snap with dotted preview, no `@angular/cdk`.** Do not add `@angular/cdk` (not a dependency today; its drag-drop module is dead weight for a grid). Implement pointer-event handling directly on a CSS-grid overlay: geometry is grid units (col/row/cols/rows); snap = quantize pointer position to cell indices, clamped to the columns/rows input. **Dotted preview:** an absolutely-positioned overlay with a dotted border, sized to the dragged component's configured footprint (cols×rows — this satisfies "respects the selected component's size"), updated on `pointermove` (rAF-throttled), removed on drop. **The editing layer is separate from rendering:** during create/update an interaction overlay sits above the composition; read mode is plain `ngx-decaf-layout` rendering of the generated model. The composition commits on gesture end (the same commit-on-drag-end policy the graph renderer uses). The graph editor's `ng-diagram` drag is a free-canvas interaction model — not reusable here. Resize via border handles quantizes the same way; drop and resize share one snap/collision routine.
- **Security.** No code-injection surface from generation itself: ModelBuilder builds classes through a fixed builder API — no `eval`, no `new Function`. The real surface is **untrusted persisted compositions** — read mode must treat saved data as hostile (AC-12): component tags whitelisted against the palette registry (unknown tags rejected at load, never resolved); config values validated through the component's declared model validators before use. `@uihandlers` binds event names to component-declared handlers — persisted documents never carry handler names or function references; handlers come only from build-time-registered component metadata. Config-derived strings (labels, titles) flow through Angular `@Input` bindings, which escape by default; `bypassSecurityTrust*` is forbidden on any composition-derived content. Persistence rides existing decaf repository machinery — no new API surface (consistent with the §2 non-goals).
- **Operational implications.** Zero new runtime dependencies. Bundle: every palette component must be statically registered, so app bundles grow with palette breadth — keep the demo palette small and lazy-load the demo route; respect the lib bundle wall (the lib must not import backend packages). Performance: drag previews must not trigger full re-render per `pointermove` — move only the overlay, run pointer handling outside the Angular zone (or signal-driven), commit on gesture end. i18n: palette labels, buttons, and the delete-confirmation screen use translation keys through the existing ngx-translate integration (AC-13) — note the current static `DashboardLayout` demo hardcodes PT strings; the new work requires keys, and the demo page carries the mandated Playwright i18n screenshot tests. Testing: component specs for the dashboard + internal-component CRUD flows; e2e coverage for the three riskiest behaviors — snap/collision, delete confirmation, and read-mode-without-affordances; test trees follow `test-layout.config.json` (for-angular = `ui`).

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID           | Task Name                            | Priority | Status  | Dependencies |
|:-------------|:-------------------------------------|:---------|:--------|:-------------|
| DECAF-53-*   | Pending decomposition — dispatched separately by the CEO after this specification completes, then broken down by the domain-root owner (Product Manager) into implementation children. The specification is approved (CTO review approve-with-changes 2026-09-07 on [SAA-913](/SAA/issues/SAA-913), folded under [SAA-921](/SAA/issues/SAA-921)); the CTO's delivery note recommends staged decomposition (§6) — core composition + CRUD + rendering first, then interaction polish. Implementation of [SAA-908](/SAA/issues/SAA-908) remains on hold by board directive | Medium | Pending | None (specification approved; §6 decisions recorded) |

## 6. Open Questions / Risks

The five former open questions were decided by the CTO technical review 2026-09-07 ([SAA-913](/SAA/issues/SAA-913), verdict: **APPROVE-WITH-CHANGES**; verbatim text remains there) plus the Product Manager's two product-side rulings the same day. Decisions are binding — none may be re-decided or weakened:

*   **Decision 1 — Crud base (CTO): `NgxFormDirective` per the `CrudFormComponent` precedent.** `DashboardComponent` extends `NgxFormDirective`, `@Dynamic()`-decorated, driven by an `operation` input; read/delete operate without an editable form group; internal components follow the same pattern individually (§4).
*   **Decision 2 — Decorator placement (CTO): `ui-decorators`.** `@dashcomponent()` attaches palette metadata (label key, default size, configuration model reference) plus a registry function in `ui-decorators`; the palette service in for-angular consumes it, mirroring the graph `@node()`/registry precedent (§4).
*   **Decision 3 — AOT/JIT (CTO): no blocker; one hard rule.** Generated classes are non-Angular TS and never compiled by Angular; components stay statically compiled and `@Dynamic()`-registered — the palette is bounded by that registry, no runtime string→component creation (AC-10), deterministic generated-class names (AC-11).
*   **Decision 4 — Grid collision semantics (PM decision, final, 2026-09-07): reject-overlap.** Overlaps are refused: the dotted preview renders an invalid state and the drop is rejected; no auto-reflow/push in v1. Matches the board's "snap to the available positions" wording (available = non-overlapping); predictable and cheapest to build and test (AC-5).
*   **Decision 5 — Serialization shape (CTO): persistable decaf model via existing repository machinery.** The composition is stored as model attributes; read regenerates renderable classes via ModelBuilder; no new server-side APIs (§2 non-goals).
*   **Decision 6 — Demo persistence adapter (PM decision, final, 2026-09-07): existing local/in-browser adapter** (RAM/localStorage class). In-browser persistence is acceptable for the demo — it demonstrates the composition lifecycle, not durability; consistent with the v1 non-goal of no new server-side APIs.
*   **Naming (CTO, §6 change 3):** the editable-dashboard demo is a distinct page/route (e.g. `dashboard-builder`); the existing static demo keeps `app-dashboard` (`for-angular/src/app/pages/dashboard/`); the lib selector `ngx-decaf-dashboard` has no collision (§1, AC-8).

**Delivery note (CTO, not a scope cut):** this is a large v1 (grid CRUD × per-component CRUD × drag/resize/snap × persistence × demo). Staged decomposition is recommended — core composition + CRUD + rendering first, then interaction polish — rather than one vertical slice. Decomposition itself happens after this specification completes, on implementation dispatch (separately dispatched by the CEO).

Risks:

*   **Risk (resolved): runtime class generation vs Angular AOT** — resolved by Decision 3: generated classes are non-Angular TS; the AOT constraint is carried as the AC-10 hard rule (static `@Dynamic()` registration, no runtime string→component creation).
*   **Risk (resolved): ambiguous grid collision semantics could stall implementation** — resolved by Decision 4 (reject-overlap, PM-final).
*   **Risk (CTO review): bundle growth with palette breadth.** Every palette component must be statically registered, so app bundles grow with the palette — mitigated by keeping the demo palette small, lazy-loading the demo route, and respecting the lib bundle wall.
*   **Risk (CTO review): full re-render per `pointermove` would make dragging janky.** Mitigated by the §4 performance rules: move only the overlay, pointer handling outside the Angular zone (or signal-driven), commit on gesture end.
*   **Risk (CTO review): untrusted persisted compositions are the real security surface.** Mitigated by the AC-12 acceptance-level rules: registry-whitelisted tags, validator-checked config, no persisted handlers, no `bypassSecurityTrust*`.
*   **Risk (CTO review): i18n drift — the current static dashboard demo hardcodes PT strings.** Mitigated by AC-13 (translation keys only) and the mandated Playwright i18n screenshot tests on the new demo route.
*   **Risk: large v1 scope.** Grid CRUD × per-component CRUD × drag/resize/snap × persistence × demo in one vertical slice would be hard to review and verify — mitigated by the staged-decomposition delivery note above.

## 7. Results & Artifacts

*   Specification record: initialized 2026-09-06 for domain root [SAA-909](/SAA/issues/SAA-909) (milestone [SAA-912](/SAA/issues/SAA-912)); **approved 2026-09-07** — CTO technical review on [SAA-913](/SAA/issues/SAA-913) returned **APPROVE-WITH-CHANGES** (context-manifest pinned at `160f18317344faf16828b785882207a1e7c0cacc`), and all required changes (naming, hard rules elevated to AC-10…AC-13, AC-5/AC-8 sharpening, delivery note) plus the two PM decisions (reject-overlap; existing local/in-browser demo persistence adapter) were folded into this record the same day by completion milestone [SAA-921](/SAA/issues/SAA-921). No implementation results yet — implementation of [SAA-908](/SAA/issues/SAA-908) remains on hold by board directive, and decomposition is dispatched separately by the CEO after completion. Target artifacts: `DashboardComponent` in the for-angular lib, the `@dashcomponent()` decorator + registry in `ui-decorators`, `ModelBuilder`-generated renderable model classes, the distinct `dashboard-builder` demo route in the for-angular app (with the mandated Playwright i18n screenshot tests), component specs + e2e for snap/collision, delete confirmation, and read-mode-without-affordances, and serialization round-trip evidence (AC-9).
