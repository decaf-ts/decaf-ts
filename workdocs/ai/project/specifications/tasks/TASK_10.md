# TASK-10: Analyze 'db-decorators' Module for Builder Overrides

**ID:** TASK-10
**Specification:** [DECAF-4: Builder for Decorator Validation Models](../DECAF_4.md)
**Priority:** High
**Status:** Completed — builder helpers now call their decorators through the ModelBuilder prototype.

## 1. Description
This task involves inspecting the `db-decorators` module root to identify any decorator options applicable to Models and to plan for extending the core builder's capabilities through a module-specific override.

## 2. Objectives
*   [x] Inspect `db-decorators` module for relevant decorators.
*   [x] Detail which decorators need to be included in the builder override.
*   [x] Specify the placement of the override and implement actual builder methods.

## 3. Implementation Plan
**Chosen Approach:**
*   Extended `ModelBuilder` within `@decaf-ts/decorator-validation` so overrides can stash class decorators that execute after the dynamic class is decorated and before the description runs.
*   Implemented the db-decorators overrides to wrap each decorator (`generated`, `hash`, `composedFromKeys`, `composed`, `version`, `transient`), grab the private attribute builder, and call the decorator directly on the same property.
*   Added regression coverage that builds a dynamic class with every helper and asserts the corresponding `DBKeys` metadata exists.

**Technical Details:**
*   `ModelBuilder.decorateClass()` now appends decorators to `_classDecorators`, and `build()` applies them right after the `model()` decorator.
*   The override helper uses the internal `attributes` map along with `attribute()` to avoid re-declaring property types when adding decorators from outside modules.
*   `db-decorators/tests/unit/model-builder.extensions.test.ts` verifies each helper sets `DBKeys.GENERATED`, `DBKeys.HASH`, `DBKeys.COMPOSED`, `DBKeys.VERSION`, and `DBKeys.TRANSIENT` metadata on the generated constructor so runtime behavior matches the decorator syntax.

## 4. Current State
**What's Done:**
* `ModelBuilder` now records class decorators via `decorateClass()` and applies them inside `build()`, enabling module-specific overrides to register their own helpers.
* `db-decorators/src/overrides/ModelBuilderExtensions.ts` invokes every persistence decorator in-place and is pulled in via `overrides/index.ts`.
* Added `db-decorators/tests/unit/model-builder.extensions.test.ts` so every helper is validated against the same metadata keys produced by the decorators themselves.
* Module builds and tests pass with the new coverage in place.

**What's Pending:** Nothing.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [Friday, February 20, 2026] - Analyzed `db-decorators` module and detailed decorators for builder extension.
*   [Saturday, February 21, 2026] - Reopened: implementation/tests outstanding.
*   [Thursday, February 26, 2026] - **IN PROGRESS:** Interface augmentation created; actual builder method implementation requires changes to decorator-validation module.
*   [Thursday, March 05, 2026] - Added ModelBuilder class decorator tracking, implemented each db-decorators builder helper, and covered them with metadata tests.
