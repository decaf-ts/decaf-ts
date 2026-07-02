# TASK-216: Structured Loops — Condition Evaluator + Foreach/While/Until Executors

**ID:** TASK-216
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Completed

## 1. Description
Implement the structured loop subsystem: `GraphConditionEvaluator` (safe built-in condition types only), `GraphLoopExecutionContext`, and the three loop executors (`ForeachGraphNodeExecutor`, `WhileGraphNodeExecutor`, `UntilGraphNodeExecutor`). Loop nodes execute nested workflow bodies repeatedly; each workflow graph (including loop bodies) must be acyclic. Nested executions set `parentRunId` and `path`.

## 2. Objectives
*   [x] Add `GraphConditionEvaluator` supporting `truthy`, `falsy`, `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `exists`, `custom` (no arbitrary JS evaluation in core).
*   [x] Add `GraphLoopExecutionContext`.
*   [x] Add `ForeachGraphNodeExecutor` (`core.loop.foreach`): serial by default, ordered results, max iteration enforcement, non-array rejection, empty array handling, child run path, optional concurrent only when no shared `statePort`.
*   [x] Add `WhileGraphNodeExecutor` (`core.loop.while`): condition-checked loop with max iterations and `GraphLoopLimitError`.
*   [x] Add `UntilGraphNodeExecutor` (`core.loop.until`): executes at least once, stops when condition true, max iterations enforced.
*   [x] Emit `LOOP_STARTED`, `LOOP_ITERATION_STARTED`, `LOOP_ITERATION_COMPLETED`, `LOOP_CONDITION_EVALUATED`, `LOOP_COMPLETED`, `LOOP_LIMIT_REACHED`.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `src/graph/loops/ForeachGraphNodeExecutor.ts`, `WhileGraphNodeExecutor.ts`, `UntilGraphNodeExecutor.ts`, `GraphConditionEvaluator.ts`, `GraphLoopExecutionContext.ts`, `index.ts`.
*   Update `src/graph/index.ts` exports.

**Technical Details:**
*   Loop executors receive a reference to the `GraphExecutionEngine` to execute the body workflow.
*   Nested path: `[...outerPath, loopNodeId, `iteration:${index}`]`; `parentRunId = outerRunId`.
*   Default max iterations: `GRAPH_DEFAULT_MAX_LOOP_ITERATIONS` / `GRAPH_DEFAULT_MAX_FOREACH_ITERATIONS`.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: `tests/unit/graph/GraphConditionEvaluator.test.ts`
*   [x] Unit Test: `tests/unit/graph/ForeachGraphNodeExecutor.test.ts`
*   [x] Unit Test: `tests/unit/graph/WhileGraphNodeExecutor.test.ts`
*   [x] Unit Test: `tests/unit/graph/UntilGraphNodeExecutor.test.ts`

**Manual Verification:**
*   Confirm loop events, max-iteration enforcement, and child run path.

## 5. Blockers & Clarifications
*   Depends on TASK-214 (engine) for body workflow execution.

## 6. Execution Log
*   [completed] - Implemented during DECAF-32.
