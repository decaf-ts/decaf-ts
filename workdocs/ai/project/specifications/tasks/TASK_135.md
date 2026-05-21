# TASK-135: Add main-agent orchestration and concurrency-safe git-tree execution

**ID:** TASK-135
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add the main agent responsible for spawning one orchestrator agent per spec and coordinating multiple orchestrations concurrently. The implementation must run orchestrators asynchronously as child processes, isolate each run in a git tree, and ensure all agents can still read the shared plan/spec/task artifacts without colliding on writes.

## 2. Objectives
*   [ ] Implement the main agent that spawns and tracks one orchestrator per spec.
*   [ ] Run orchestrator agents asynchronously as child processes.
*   [ ] Isolate concurrent work with git trees so multiple orchestrations can run safely at once.
*   [ ] Ensure agents can access the shared plan/spec/task files while writes remain concurrency-safe.

## 3. Implementation Plan
**Proposed Changes:**
*   Add a main-agent entry that accepts a queue of specs and fans out orchestrator runs.
*   Create git-tree helpers so each orchestration gets a safe working copy.
*   Wire state tracking so progress from each orchestrator can be aggregated back to the main agent.

**Technical Details:**
*   Concurrency boundaries must prevent one orchestration from mutating another orchestration’s workspace.
*   The main agent should not own implementation logic; it should coordinate and aggregate.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: the main agent spawns one orchestrator per spec.
*   [ ] Unit Test: multiple orchestrations can run concurrently without write collisions.
*   [ ] Unit Test: git-tree isolation is used for each orchestration run.

**Manual Verification:**
*   Start two spec executions and confirm each run uses its own git tree and reports independently.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Started task.
