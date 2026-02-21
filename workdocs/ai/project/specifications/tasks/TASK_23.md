# TASK-23: Analyze 'for-nest' Module for Builder Overrides

**ID:** TASK-23
**Specification:** [DECAF-4: Builder for Decorator Validation Models](../../DECAF_4.md)
**Priority:** High
**Status:** Pending

## 1. Description
This task involves inspecting the `for-nest` module root to identify decorator options applicable to Models and to plan for extending the core builder's capabilities through a module-specific override. This ensures that dynamically built models can integrate with NestJS authentication and authorization features.

## 2. Objectives
*   [ ] Inspect `for-nest` module for relevant decorators.
*   [ ] Detail which decorators need to be included in the builder override.
*   [ ] Specify the placement of the override.

## 3. Implementation Plan
**Proposed Changes:**
*   Create a builder extension file (e.g., `for-nest/src/overrides/ModelBuilderExtensions.ts`) to add fluent methods to `ModelBuilder`.
*   **For `ModelBuilder` (Class Decorators):** Add a method for `Auth`. This will allow dynamically built models to be marked for authentication and authorization within a NestJS context.
*   Ensure the extension file is properly exported/imported within the `for-nest` module so the augmentation takes effect.

**Technical Details:**
*   **Decorators identified:**
    *   `Auth(model: string | Constructor)`: Class/Method decorator, applies authentication and authorization metadata.
*   **Applicability to Models:** Confirmed via its direct relation to defining authentication/authorization for a Model resource.
*   **Override Placement:** `for-nest/src/overrides/ModelBuilderExtensions.ts`.

## 4. Verification Plan
**Automated Tests:**
*   Create new unit tests within `for-nest/tests/unit/` to verify that the new builder method correctly applies the `Auth` decorator and that models decorated via the builder function as expected within the NestJS authentication/authorization system.

**Manual Verification:**
*   N/A

## 5. Blockers & Clarifications
*   N/A

## 6. Execution Log
*   [Friday, February 20, 2026] - Analyzed `for-nest` module and detailed decorators for builder extension.
