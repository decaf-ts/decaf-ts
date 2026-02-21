# TASK-10: Analyze 'db-decorators' Module for Builder Overrides

**ID:** TASK-10
**Specification:** [DECAF-4: Builder for Decorator Validation Models](../../DECAF_4.md)
**Priority:** High
**Status:** Pending

## 1. Description
This task involves inspecting the `db-decorators` module root to identify any decorator options applicable to Models and to plan for extending the core builder's capabilities through a module-specific override.

## 2. Objectives
*   [ ] Inspect `db-decorators` module for relevant decorators.
*   [ ] Detail which decorators need to be included in the builder override.
*   [ ] Specify the placement of the override.

## 3. Implementation Plan
**Proposed Changes:**
*   Create a builder extension file (e.g., `db-decorators/src/overrides/ModelBuilderExtensions.ts`) to add fluent methods to `AttributeBuilder` for the following decorators: `generated`, `hash`, `composedFromKeys`, `composed`, `version`, `transient`.
*   Ensure the extension file is properly exported/imported within the `db-decorators` module so the augmentation takes effect.

**Technical Details:**
*   **Decorators for `AttributeBuilder`:**
    *   `generated(type?: string)`: For marking a property as generated.
    *   `hash()`: For hashing a property value on create/update.
    *   `composedFromKeys(args: string[], separator?: string, filterEmpty?: boolean | string[], hash?: boolean, prefix?: string, suffix?: string, groupsort?: GroupSort)`: For composing a property value from other property keys.
    *   `composed(args: string[], separator?: string, filterEmpty?: boolean | string[], hash?: boolean, prefix?: string, suffix?: string, groupsort?: GroupSort)`: For composing a property value from other property values.
    *   `version()`: For managing versioning for a property.
    *   `transient()`: For marking a property as not to be persisted.
*   **Override Placement:** `db-decorators/src/overrides/ModelBuilderExtensions.ts`.

## 4. Verification Plan
**Automated Tests:**
*   Create new unit tests within `db-decorators/tests/unit/` to verify that the new builder methods correctly apply the decorators and that the decorators function as expected when applied via the builder.

**Manual Verification:**
*   N/A

## 5. Blockers & Clarifications
*   N/A

## 6. Execution Log
*   [Friday, February 20, 2026] - Analyzed `db-decorators` module and detailed decorators for builder extension.
