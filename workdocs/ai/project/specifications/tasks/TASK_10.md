# TASK-10: Analyze 'db-decorators' Module for Builder Overrides

**ID:** TASK-10
**Specification:** [DECAF-4: Builder for Decorator Validation Models](../DECAF_4.md)
**Priority:** High
**Status:** In Progress — interface augmentation created; actual implementation pending.

## 1. Description
This task involves inspecting the `db-decorators` module root to identify any decorator options applicable to Models and to plan for extending the core builder's capabilities through a module-specific override.

## 2. Objectives
*   [x] Inspect `db-decorators` module for relevant decorators.
*   [x] Detail which decorators need to be included in the builder override.
*   [ ] Specify the placement of the override and implement actual builder methods.

## 3. Implementation Plan
**Chosen Approach:**
*   Created `db-decorators/src/overrides/ModelBuilderExtensions.ts` to extend `ModelBuilder` interface with db-decorators decorators.
*   Implemented interface augmentation for: `generated()`, `hash()`, `composedFromKeys()`, `composed()`, `version()`, `transient()`.

**Technical Details:**
*   **Decorators for `ModelBuilder`:**
    *   `generated(type?: string)`: For marking a property as generated.
    *   `hash()`: For hashing a property value on create/update.
    *   `composedFromKeys(args, separator?, filterEmpty?, hash?, prefix?, suffix?, groupsort?)`: For composing a property value from other property keys.
    *   `composed(args, separator?, filterEmpty?, hash?, prefix?, suffix?, groupsort?)`: For composing a property value from other property values.
    *   `version()`: For managing versioning for a property.
    *   `transient()`: For marking a property as not to be persisted.
*   **Override Placement:** `db-decorators/src/overrides/ModelBuilderExtensions.ts`.

## 4. Current State
**What's Done:**
- Interface augmentation file created with method signatures
- Module builds successfully
- All tests pass (20 test suites, 113 tests)

**What's Pending:**
- Actual implementation of builder methods on ModelBuilder class
- Implementation requires modifying decorator-validation's ModelBuilder class directly
- Not just a db-decorators change - requires changes outside this module

## 5. Blockers & Clarifications
*   **Blocker:** ModelBuilder is from `@decaf-ts/decorator-validation`, not `@decaf-ts/db-decorators`
*   **Solution:** Implement these methods by modifying decorator-validation's ModelBuilder class prototype, OR export a separate extension module that consumers manually import

## 6. Execution Log
*   [Friday, February 20, 2026] - Analyzed `db-decorators` module and detailed decorators for builder extension.
*   [Saturday, February 21, 2026] - Reopened: implementation/tests outstanding.
*   [Thursday, February 26, 2026] - **IN PROGRESS:** Interface augmentation created; actual builder method implementation requires changes to decorator-validation module.
