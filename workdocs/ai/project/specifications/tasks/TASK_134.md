# TASK-134: Implement agent execute flow, stage progression, and progress reporting

**ID:** TASK-134
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Implement the `agent execute SPEC-XXX` workflow so the orchestrator can run the automated development pipeline for a specific spec. The flow must reuse the same orchestrator pipeline that the `plan` request uses: call the architect agent first, then the implementation agent, then the reviewer agent, and finally the documentation agent. It must stop on blockers or clarifications, update the spec/task files before advancing, and report progress back in a standardized `SPEC/TASK` format.

## 2. Objectives
*   [ ] Add the `agent execute` command path for a specific spec identifier.
*   [ ] Ensure the `plan` request routes into the same architect-led orchestration pipeline.
*   [ ] Implement the staged orchestration sequence: architect -> implementation -> reviewer -> documentation.
*   [ ] Pause on blockers, questions, or unclear requirements instead of guessing.
*   [ ] Emit standardized progress reports back to the orchestrator and then to the user.
*   [ ] Update the relevant spec/task files and Jira ticket state before each stage advances.

## 3. Implementation Plan
**Proposed Changes:**
*   Add a dedicated orchestration tool entry point for `execute`.
*   Wire the command to resolve the target spec, load its tasks, and invoke the stage pipeline.
*   Ensure each stage writes progress markers before the next stage is allowed to continue.

**Technical Details:**
*   The workflow should be deterministic and interruptible.
*   The reporting format should be stable so downstream orchestration can parse it reliably.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `agent execute` resolves the requested spec and loads its task chain.
*   [ ] Unit Test: `plan` invokes the architect-led pipeline before implementation begins.
*   [ ] Unit Test: the stage pipeline halts when a blocker or clarification is returned.
*   [ ] Unit Test: standardized `SPEC/TASK` progress messages are emitted for each stage.

**Manual Verification:**
*   Run `decaf-mcp agent execute SPEC-XXX` and confirm it pauses on missing inputs instead of guessing.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Started task.
