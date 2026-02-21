# TASK-13: Analyze 'core' Module for Builder Overrides

**ID:** TASK-13
**Specification:** [DECAF-4: Builder for Decorator Validation Models](../../DECAF_4.md)
**Priority:** High
**Status:** Pending

## 1. Description
This task involves inspecting the `core` module root to identify decorator options applicable to Models and to plan for extending the core builder's capabilities through a module-specific override. This ensures that dynamically built models can leverage core persistence and relationship features.

## 2. Objectives
*   [ ] Inspect `core` module for relevant decorators.
*   [ ] Detail which decorators need to be included in the builder override.
*   [ ] Specify the placement of the override.

## 3. Implementation Plan
**Proposed Changes:**
*   Create a builder extension file (e.g., `core/src/overrides/ModelBuilderExtensions.ts`) to add fluent methods to `ModelBuilder` and `AttributeBuilder`.
*   **For `ModelBuilder` (Class Decorators):** Add a method for `table`. This will allow dynamically built models to specify their database table name.
*   **For `AttributeBuilder` (Property Decorators):** Add methods for `column`, `unique`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `oneToOne`, `oneToMany`, `manyToOne`, `manyToMany`, `noValidateOn`, `noValidateOnCreate`, `noValidateOnUpdate`, `noValidateOnCreateUpdate`. These will provide comprehensive control over model properties, including database mapping, uniqueness, audit fields, relationships, and validation skipping.
*   Ensure the extension file is properly exported/imported within the `core` module so the augmentation takes effect.

**Technical Details:**
*   **Decorators identified:**
    *   `table<OPTS = string>(opts?: OPTS)`: Class decorator, specifies the database table name for a model.
    *   `column<OPTS = string>(columnName?: OPTS)`: Property decorator, maps a model property to a specific column name.
    *   `unique()`: Property decorator, tags a property as unique.
    *   `createdBy()`: Property decorator, tracks the creator of a model instance.
    *   `updatedBy()`: Property decorator, tracks the last updater of a model instance.
    *   `createdAt()`: Property decorator, uses `timestamp` for creation time.
    *   `updatedAt()`: Property decorator, uses `timestamp` for update time.
    *   `oneToOne<M extends Model>(...)`: Property decorator, defines a one-to-one relationship.
    *   `oneToMany<M extends Model>(...)`: Property decorator, defines a one-to-many relationship.
    *   `manyToOne<M extends Model>(...)`: Property decorator, defines a many-to-one relationship.
    *   `manyToMany<M extends Model>(...)`: Property decorator, defines a many-to-many relationship.
    *   `noValidateOn(...ops: OperationKeys[])`: Property decorator, prevents validation on specific operations.
    *   `noValidateOnCreate()`: Property decorator, prevents validation on create.
    *   `noValidateOnUpdate()`: Property decorator, prevents validation on update.
    *   `noValidateOnCreateUpdate()`: Property decorator, prevents validation on create/update.
*   **Applicability to Models:** Confirmed via their direct relation to model structure, persistence, and relationships.
*   **Override Placement:** `core/src/overrides/ModelBuilderExtensions.ts`.

## 4. Verification Plan
**Automated Tests:**
*   Create new unit tests within `core/tests/unit/` to verify that the new builder methods correctly apply the decorators and that models/properties decorated via the builder function as expected with core persistence and relationship features.

**Manual Verification:**
*   N/A

## 5. Blockers & Clarifications
*   N/A

## 6. Execution Log
*   [Friday, February 20, 2026] - Analyzed `core` module and detailed decorators for builder extension.
