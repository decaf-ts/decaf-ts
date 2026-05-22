# TASK-142: Implement Deterministic GOAP/Workflow Reporting to Manager

**ID:** TASK-142
**Specification:** [Link to Specification](../DECAF_19.md)
**Priority:** High
**Status:** Pending

## 1. Description
Define how GOAP/workflow runs execute in code, report their results back to the manager agent, and avoid direct user-facing interaction outside the manager layer.

## 2. Objectives
*   [ ] Specify the programmatic steps used by GOAP/workflow solvers.
*   [ ] Define the structured result contract returned to the manager.
*   [ ] Specify which tasks may still invoke LLMs and which must remain purely programmatic.
*   [ ] Describe failure propagation so the manager can report issues to the user.

## 3. Implementation Plan
**Proposed Changes:**
*   Describe the solver execution lifecycle in deterministic steps.
*   Define the manager handoff after solver completion.
*   Document how task-level subcalls may request LLMs only when required by the task itself.
*   Specify the minimum structured result envelope returned to the manager.

**Technical Details:**
*   Preserve the separation between execution engines and manager interaction.
*   Require a structured return payload for success, failure, and follow-up actions.
*   Avoid any prompt-based decision making for orchestration when a non-default mode is selected.
*   Keep LLM calls scoped only to substeps that explicitly need model reasoning and never for mode selection.

Planned result envelope:
* selected mode
* success or failure status
* ordered actions or executed steps
* manager summary
* follow-up actions
* failure metadata or diagnostic details

## 4. Verification Plan
**Automated Tests:**
*   [ ] N/A - documentation-only change.

**Manual Verification:**
*   Confirm the solver path always reports to the manager.
*   Confirm the spec makes the manager the only user-facing reporter.
*   Confirm the spec allows LLM calls only for explicitly necessary substeps.
*   Confirm failure propagation is described in a way the manager can surface to the user without additional routing logic.

## 5. Blockers & Clarifications
*   **Blocker 1:** The exact solver API and return schema are not yet defined.
*   **Clarification 1:** The implementation may need additional spec coverage for agent-level state management if the reporting contract is broader than expected.

## 6. Execution Log
*   [2026-05-22] - Started task.
*   [2026-05-22] - Planned the deterministic reporting contract and structured return envelope for manager handoff.
*   [2026-05-22] - Implementation is blocked in this environment because the executable source tree is outside the writable roots; only the docs workspace is editable here.
