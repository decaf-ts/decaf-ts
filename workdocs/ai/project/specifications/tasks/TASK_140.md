# TASK-140: Add manager agent orchestration and confidence-gated JSON tool responses

**ID:** TASK-140
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Introduce a `manager` agent that acts as the user-facing orchestration entry point for agent mode. The manager must coordinate multiple concurrent agent calls, surface blockers and questions to the user as they occur, and pipe the user response back to the waiting agent so work can continue. All agent-facing tools must return structured JSON with a confidence score, a short summary, the final status, and any blockers or questions, and completion must be gated by a configurable confidence threshold.

## 2. Objectives
*   [ ] Add a manager agent that can coordinate planning and execution across the other agents.
*   [ ] Make agent tool responses return structured JSON with `confidence`, `summary`, `status`, `questions`, and `blockers`.
*   [ ] Enforce a configurable confidence threshold with 50 as the default gate.
*   [ ] Ensure agent tools can relay blockers and questions back to the manager for user follow-up.
*   [ ] Keep all new flows aligned with the repo-copied prompt/resource model and `TASK COMPLETE` sentinel contract.

## 3. Implementation Plan
**Proposed Changes:**
*   Add a manager prompt and tool entry point that delegates to `agent.do`.
*   Update the agent registry so the manager can fan out to orchestrator and other subordinate agents.
*   Standardize the JSON output envelope for all agent tools.
*   Add confidence evaluation before a tool can return success.

**Technical Details:**
*   The manager agent should be the only user-facing entry point for multi-agent fan-out and user feedback routing.
*   Low-confidence runs must be reported as blocked so the manager can re-query the user or fall back to another agent.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: manager agent registration and routing.
*   [ ] Unit Test: agent tool JSON output includes confidence and summary.
*   [ ] Unit Test: confidence gate blocks completion at or below the configured threshold.
*   [ ] Integration Test: manager can fan out work and return structured results for multiple agent calls.

**Manual Verification:**
*   [ ] Start agent mode and invoke the manager flow to confirm it reports blockers/questions before completion.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-22] - Added to DECAF-17 after expanding the agent contract to include manager orchestration and structured JSON responses.
