# TASK-23: Analyze 'for-nest' Module for Builder Overrides

**ID:** TASK-23
**Specification:** [DECAF-4: Builder for Decorator Validation Models](../../DECAF_4.md)
**Priority:** High
**Status:** Completed — Auth builder helper attached and tested.

## 1. Description
This task involves inspecting the `for-nest` module root to identify decorator options applicable to Models and to plan for extending the core builder's capabilities through a module-specific override. This ensures that dynamically built models can integrate with NestJS authentication and authorization features.

## 2. Objectives
*   [x] Inspect `for-nest` module for relevant decorators.
*   [x] Detail which decorators need to be included in the builder override.
*   [x] Specify the placement of the override.

## 3. Implementation Plan
**Proposed Changes:**
*   Added `for-nest/src/overrides/ModelBuilderExtensions.ts` and exported it through `overrides/index.ts` so the prototype patch is loaded when the module exports `./overrides`.
*   The helper simply calls `this.decorateClass(Auth(model))`, relying on the new `decorateClass()` hook to queue the decorator for execution during `build()`.
*   Created `for-nest/tests/unit/model-builder.extensions.test.ts` that builds a class via the helper and inspects the Nest metadata key written by `@Auth`.

**Technical Details:**
*   The override reuses the `Auth` decorator defined in `decaf-model/decorators/decorators.ts`; no extra metadata plumbing is required because `SetMetadata(AUTH_META_KEY, resource)` is executed when `build()` runs.
*   The helper returns `this` for chaining, keeping the builder fluent while merely storing the decorator for later application.
*   Because Nest stores metadata via `Reflect.defineMetadata`, the test uses `Reflect.getMetadata(AUTH_META_KEY, Dynamic)` to ensure the helper writes the expected string.

## 4. Verification Plan
**Automated Tests:**
*   `for-nest/tests/unit/model-builder.extensions.test.ts` now builds a class via `builder.Auth(...)` and asserts the `AUTH_META_KEY` metadata the decorator writes.

**Manual Verification:**
*   N/A

## 5. Blockers & Clarifications
*   N/A

## 6. Execution Log
*   [Friday, February 20, 2026] - Analyzed `for-nest` module and detailed decorators for builder extension.
*   [Thursday, March 05, 2026] - Added the `Auth` builder helper, exported it via the overrides entry, and validated the Nest metadata with a new unit test.
