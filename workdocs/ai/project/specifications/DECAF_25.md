# DECAF-25 — Webpage Refactor to Full Decaf Convention

**Status:** Planned
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
Refactor the `for-angular` webpage to use the full Decaf convention and the systems already present in `for-angular`.

The goal is to remove any page-level patterns that diverge from the framework's established structure and to align the webpage with the same decorator-first, metadata-driven, and reusable-module approach used elsewhere in the project.

This specification focuses on the Angular application shell, routing, page composition, shared services, and any page-specific logic that should instead flow through the existing Decaf systems already available in `for-angular`.

## 2. Goals
*   [ ] Align the webpage structure with the decaf-ts convention used by the rest of the repository.
*   [ ] Reuse the existing `for-angular` systems, patterns, and abstractions instead of adding bespoke page logic.
*   [ ] Normalize page composition, routing, and shared state so the webpage follows the same model-driven structure as the rest of the framework.
*   [ ] Add regression coverage and documentation for the refactor.

## 3. User Stories / Requirements
*   **US-1:** As a developer, I want the `for-angular` webpage to follow the same Decaf conventions as the rest of the codebase so that it is easier to maintain and extend.
*   **US-2:** As a developer, I want the webpage to reuse existing `for-angular` systems so that functionality stays centralized and consistent.
*   **US-3:** As a developer, I want the refactor to preserve current behaviour while improving alignment with the framework architecture.
*   **Req-1:** Page-level code must prefer existing Decaf abstractions, metadata, and reusable module patterns over ad hoc Angular-specific wiring.
*   **Req-2:** The refactor must keep the webpage compatible with the current `for-angular` runtime and any existing demo or feature pages.
*   **Req-3:** Documentation and tests must be updated to reflect the refactor.

## 4. Architecture & Design
The webpage refactor should align with the conventions already established in `for-angular`, including:

*   Decaf-style model and metadata usage where relevant.
*   Shared services and reusable page/system composition instead of page-local duplication.
*   Existing routing, demo, and graph-related patterns already present in the Angular module.
*   Clear separation between framework conventions, page composition, and feature-specific view logic.

The implementation should identify any current page logic that bypasses the framework conventions and migrate it toward the module-level abstractions already available in `for-angular`.

Planned refactor sequence:

1. Audit the app shell, route map, and representative feature pages to identify page-local behavior that should move into shared Decaf abstractions.
2. Refactor the shell and navigation surface first, since `AppComponent`, `app.routes.ts`, and the menu/header/container stack currently define most of the cross-page behavior.
3. Normalize page composition for the highest-traffic routes, then backfill lower-traffic demo and EW routes if they share the same anti-patterns.
4. Consolidate shared state, data seeding, and page helpers into reusable services or framework-aligned abstractions.
5. Add tests and documentation only after the refactor shape is stable, so the coverage matches the final structure rather than a transitional one.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID            | Task Name                                                | Priority | Status  | Dependencies |
|:--------------|:---------------------------------------------------------|:---------|:--------|:-------------|
| DECAF-25-1    | Audit the app shell, routes, and representative pages for convention gaps | High     | Pending | -            |
| DECAF-25-2    | Refactor the shell/menu/routing layer to reuse existing `for-angular` systems | High     | Pending | DECAF-25-1   |
| DECAF-25-3    | Normalize page composition and shared services across the refactored routes | High     | Pending | DECAF-25-2   |
| DECAF-25-4    | Add regression coverage and documentation for the webpage refactor | Medium   | Pending | DECAF-25-2   |

## 6. Open Questions / Risks
*   Which routes are in the first wave: `login`, `dashboard`, `graph`, the generic model pages, the EW pages, or all of them?
*   Should the refactor keep the current Ionic split-pane/menu layout, or is a different shell pattern acceptable as long as it uses Decaf conventions?
*   Are there any current page behaviours that must remain byte-for-byte compatible, especially around login, menu generation, route parameters, and modal flows?
*   Should legacy/demo pages under `src/app/ew` be refactored together with the main pages or treated as a separate phase?
*   Do we want to preserve the current `NgxPageDirective`/`NgxComponentDirective` flow and adapt around it, or replace it where the Decaf system already provides a better abstraction?
*   Risk: if the refactor is applied unevenly, the webpage may end up with mixed conventions that are harder to maintain than the current state.
*   Risk: moving too aggressively to shared abstractions could introduce regressions if page-specific edge cases are not documented first.

## 7. Results & Artifacts
*   New specification entry for the `for-angular` webpage refactor.
*   Plan entry linking the refactor work to DECAF-25.
