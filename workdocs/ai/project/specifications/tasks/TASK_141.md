# TASK-141: Define the Execution Mode Configuration and Routing Contract

**ID:** TASK-141
**Specification:** [Link to Specification](../DECAF_19.md)
**Priority:** High
**Status:** Pending

## 1. Description
Define how the agent runtime selects between the default prompt-based mode and the non-default GOAP/workflow modes, and document the routing contract that the manager uses to branch into the correct execution path.

## 2. Objectives
*   [ ] Define the model-type flag and where it is sourced from.
*   [ ] Specify the default behavior that preserves the current prompt-based agent flow.
*   [ ] Specify how the manager decides between prompt, GOAP, and workflow execution paths.
*   [ ] Capture the reporting contract between the solver path and the manager agent.

## 3. Implementation Plan
**Proposed Changes:**
*   Document the configuration surface for the mode flag and identify the canonical runtime source of truth.
*   Define the programmatic branching rules for the manager orchestration layer.
*   Define the structured result shape that non-default runs must return.
*   Preserve the default prompt-based path as the compatibility baseline.

**Technical Details:**
*   Keep the contract explicit about when LLM calls are allowed and when they are forbidden.
*   Treat GOAP and workflow modes as deterministic execution strategies, not prompt-generation strategies.
*   Ensure the manager remains the sole user-facing aggregation point.
*   Record the exact configuration lookup order in the implementation notes once the runtime config layer is confirmed.

## 4. Verification Plan
**Automated Tests:**
*   [ ] N/A - documentation-only change.

**Manual Verification:**
*   Confirm the spec defines the configuration source and default mode.
*   Confirm the spec clearly forbids LLM-based orchestration in non-default modes.
*   Confirm the spec describes the manager reporting boundary.
*   Confirm the routing contract can be read without code context and still explains the fallback path.

## 5. Blockers & Clarifications
*   **Blocker 1:** None for the document skeleton itself.
*   **Clarification 1:** The final config location may need to be aligned with the repository's runtime configuration conventions.

## 6. Execution Log
*   [2026-05-22] - Started task.
*   [2026-05-22] - Planned the configuration and routing contract, with the canonical config source left for implementation alignment.
*   [2026-05-22] - Implementation could not proceed in this sandbox because the editable workspace is limited to `workdocs/ai` while the runtime source files live outside the writable roots.
