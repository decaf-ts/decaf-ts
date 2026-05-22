# TASK-134: Implement child-process orchestration, progress reporting, and `agent.do` dispatch

**ID:** TASK-134
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Implement the child-process orchestration layer that powers `agent.do` and the agent-prefixed commands. Each invocation must spawn a new process, run the MCP server in agent mode, report progress succinctly in `SPEC/TASK` format, and return only after the child stream ends with `TASK COMPLETE`.

## 2. Objectives
*   [ ] Make `agent.do` spawn a new agent-mode process for the selected agent.
*   [ ] Add succinct `SPEC/TASK` progress reporting for every stage.
*   [ ] Detect the `TASK COMPLETE` sentinel and use it as the completion signal.
*   [ ] Keep the orchestrator able to chain into the next agent after completion.

## 3. Implementation Plan
**Proposed Changes:**
*   Add the process-spawning wrapper used by all agent tools.
*   Pipe progress output back to the orchestrator without bloating the transcript.
*   Standardize completion handling on the `TASK COMPLETE` sentinel.

**Technical Details:**
*   The orchestration layer must be concurrency-safe and testable through the compiled dist artifact.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `agent.do` spawns a child process for the selected agent.
*   [ ] Unit Test: `SPEC/TASK` progress lines are emitted in order.
*   [ ] Unit Test: completion is detected from `TASK COMPLETE`.
*   [ ] Integration Test: compiled dist inspector validates the full agent chain through a mock task run.

**Manual Verification:**
*   [ ] Run a sample agent command and confirm the child process terminates only after `TASK COMPLETE`.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-22] - Spec rewritten to the child-process orchestration model.
