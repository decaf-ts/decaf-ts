# TASK-135: Implement deterministic GOAP routing and compiled-dist integration tests

**ID:** TASK-135
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Implement the deterministic `--goap` path so the agent system can orchestrate behavior without LLM-driven decisions. The GOAP path must use serialized GOAP or `mistreevous` decision trees to select the next agent, and the compiled dist artifact must be covered by inspector-based integration tests, including a full mock task that exercises orchestrator, architect, implementation, reviewer, and documentation agents.

## 2. Objectives
*   [ ] Make `--goap` fully deterministic and free of LLM reasoning for orchestration decisions.
*   [ ] Use serialized GOAP or `mistreevous` trees to choose the next agent.
*   [ ] Add inspector-based integration coverage against the compiled dist artifact.
*   [ ] Add a full mock task integration test across the orchestrator, architect, implementation, reviewer, and documentation agents.

## 3. Implementation Plan
**Proposed Changes:**
*   Keep the deterministic branch structure alongside the non-GOAP path.
*   Add inspector tests that build with `npm run build:dist` before execution.
*   Validate the full agent chain with a mock SPEC/TASK flow.

**Technical Details:**
*   GOAP mode must not invoke an LLM provider for orchestration decisions.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `--goap` selects the deterministic tree path.
*   [ ] Unit Test: no provider CLI is invoked for orchestration decisions in GOAP mode.
*   [ ] Integration Test: compiled dist is built with `npm run build:dist` and exercised through the inspector transport.
*   [ ] Integration Test: a mock task runs through orchestrator -> architect -> implementation -> reviewer -> documentation end to end.

**Manual Verification:**
*   [ ] Boot the compiled dist artifact in GOAP mode and confirm the next agent selection is deterministic.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-22] - Spec rewritten to the deterministic GOAP model and full dist integration coverage.
