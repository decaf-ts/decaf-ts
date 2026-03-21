# TASK-15: Analyze 'crypto' Module for Builder Overrides

**ID:** TASK-15
**Specification:** [DECAF-4: Builder for Decorator Validation Models](../../DECAF_4.md)
**Priority:** High
**Status:** Completed — `encrypt` helper exposed on ModelBuilder and tested.

## 1. Description
This task involves inspecting the `crypto` module root to identify decorator options applicable to Models and to plan for extending the core builder's capabilities through a module-specific override. This ensures that dynamically built models can leverage cryptographic features like property encryption.

## 2. Objectives
*   [x] Inspect `crypto` module for relevant decorators.
*   [x] Detail which decorators need to be included in the builder override.
*   [x] Specify the placement of the override.

## 3. Implementation Plan
**Proposed Changes:**
*   Implemented `crypto/src/overrides/ModelBuilderExtensions.ts` so the builder exposes `encrypt()` and decorated properties with the same crypto metadata as the decorator path.
*   Hooked the override into the module via `overrides/index.ts` and `src/index.ts` so the prototype patch runs when the package is imported.
*   Created a unit test under `crypto/tests/unit/model-builder.extensions.test.ts` that builds a model, calls `encrypt`, and asserts the `CryptoKeys.ENCRYPTED` metadata is present.

**Technical Details:**
*   The override uses `this.attribute()` and the private `attributes` map to avoid re-declaring property types before decorating.
*   Each invocation of `builder.encrypt()` simply calls `encrypt(secret, algorithm)` and forwards the resulting decorator to `this.decorateClass`, letting `ModelBuilder` apply it when `build()` runs.
*   The test asserts that `Metadata.key(CryptoKeys.ENCRYPTED, \"ssn\")` is defined on the generated constructor, matching the decorator contract.

## 4. Verification Plan
**Automated Tests:**
*   `crypto/tests/unit/model-builder.extensions.test.ts` now builds a model via the `encrypt` helper and asserts the `CryptoKeys.ENCRYPTED` metadata key is defined on the generated class.

**Manual Verification:**
*   N/A

## 5. Blockers & Clarifications
*   N/A

## 6. Execution Log
*   [Friday, February 20, 2026] - Analyzed `crypto` module and detailed decorators for builder extension.
*   [Thursday, March 05, 2026] - Added the `encrypt` builder extension, wired it through the overrides entry, and asserted the crypto metadata via a new unit test.
