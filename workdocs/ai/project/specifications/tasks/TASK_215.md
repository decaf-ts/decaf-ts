# TASK-215: Validation — Definition Validator, as-zod Schema Resolver, Value Validator

**ID:** TASK-215
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add `GraphDefinitionValidator` (workflow structure, unique node IDs, relation endpoints/ports, required port sources, cycles, loop metadata, loop body acyclicity, connection rules), `GraphPortSchemaResolver` (preferring `decaf-ts/as-zod` with primitive fallback), and `GraphValueValidator` (workflow/node input/output validation). Validation failures emit `VALIDATION_FAILED` and throw structured errors.

## 2. Objectives
*   [ ] Add `GraphDefinitionValidator` with the full validation list from spec §22.1.
*   [ ] Add `GraphPortSchemaResolver` converting workflow/node input/output ports to Zod schemas via `as-zod`, with primitive fallback (`string`, `number`, `boolean`, `Date`, `array`, `unknown`).
*   [ ] Add `GraphValueValidator` with `validateWorkflowInputs`, `validateNodeInputs`, `validateNodeOutputs`, `validateWorkflowOutputs`.
*   [ ] Emit `VALIDATION_STARTED`, `VALIDATION_COMPLETED`, `VALIDATION_FAILED` events; throw structured `GraphInputError`/`GraphPortError` on failure.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `src/graph/validation/GraphDefinitionValidator.ts`, `GraphPortSchemaResolver.ts`, `GraphValueValidator.ts`, `index.ts`.
*   Update `src/graph/index.ts` exports.
*   Wire validation into `GraphExecutionEngine` (definition validation before planning; value validation around node and workflow I/O when enabled).

**Technical Details:**
*   Prefer `@decaf-ts/as-zod` for model-to-Zod conversion; do not rebuild schema semantics manually.
*   Support flattened schema ports where applicable.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/graph/GraphDefinitionValidator.test.ts`
*   [ ] Unit Test: `tests/unit/graph/GraphPortSchemaResolver.test.ts`
*   [ ] Unit Test: `tests/unit/graph/GraphValueValidator.test.ts`

**Manual Verification:**
*   Confirm invalid topologies, missing ports, and invalid values are rejected with structured errors.

## 5. Blockers & Clarifications
*   Depends on TASK-213 (planner) for cycle detection reuse.

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
