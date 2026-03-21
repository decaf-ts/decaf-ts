# TASK-14: Analyze 'ui-decorators' Module for Builder Overrides

**ID:** TASK-14
**Specification:** [DECAF-4: Builder for Decorator Validation Models](../../DECAF_4.md)
**Priority:** High
**Status:** Completed — builder helpers now register UI metadata through the ModelBuilder override.

## 1. Description
This task involves inspecting the `ui-decorators` module root to identify decorator options applicable to Models and to plan for extending the core builder's capabilities through a module-specific override. This ensures that dynamically built models can leverage UI-specific rendering and layout features.

## 2. Objectives
*   [x] Inspect `ui-decorators` module for relevant decorators.
*   [x] Detail which decorators need to be included in the builder override.
*   [x] Specify the placement of the override.

## 3. Implementation Plan
**Proposed Changes:**
*   Added `ui-decorators/src/overrides/ModelBuilderExtensions.ts`, imported from the module entrypoint, so ModuleBuilder is patched as the package loads.
*   Each helper now calls `this.decorateClass(...)` with the existing decorator (`uimodel`, `renderedBy`, `uilistmodel`, `uihandlers`, `uilayout`, `uisteppedmodel`) so the builder stores the same metadata that the decorator syntax would.
*   Exported the override from `ui-decorators/src/overrides/index.ts` and imported `./overrides` from `src/index.ts` to guarantee the prototype patch runs during module initialization.

**Technical Details:**
*   The override file casts `ModelBuilder.prototype` so the new helper signatures can be attached without reimplementing builder internals.
*   Each helper simply forwards its arguments to the decorator factory and returns `this.decorateClass(...)`, leveraging the new `decorateClass()` hook inside `ModelBuilder`.
*   Added `ui-decorators/tests/unit/model-builder.extensions.test.ts` to build a model via the helpers and assert that `UIKeys.REFLECT` metadata for `UIMODEL`, `RENDERED_BY`, `UILISTMODEL`, `HANDLERS`, and `UILAYOUT` is present.

## 4. Verification Plan
**Automated Tests:**
*   `ui-decorators/tests/unit/model-builder.extensions.test.ts` now exercises each helper and validates the same `UIKeys` metadata that the decorator syntax attaches.

**Manual Verification:**
*   N/A

## 5. Blockers & Clarifications
*   N/A

## 6. Execution Log
*   [Friday, February 20, 2026] - Analyzed `ui-decorators` module and detailed decorators for builder extension.
*   [Thursday, March 05, 2026] - Added UI builder override, exported it through the overrides index, and added a regression test that asserts UI metadata is preserved.
