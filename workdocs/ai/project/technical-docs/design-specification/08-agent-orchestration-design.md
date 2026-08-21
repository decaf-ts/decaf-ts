# 08 — Agent Orchestration Design

**Source specifications:** [DECAF-17](../specifications/DECAF_17.md), [DECAF-19](../specifications/DECAF_19.md), [DECAF-20](../specifications/DECAF_20.md) (merged), [DECAF-45](../specifications/DECAF_45.md).

> **Scope:** mcp-server CLI boot artifacts are excluded; the agent orchestration model, GOAP, progress relay, and user-request handling are in scope.

## 1. Overview

Agent mode is reworked into a tool-driven, `agent.do`-dispatched, confidence-gated system with a `manager`/`orchestrator` split and an optional deterministic GOAP/mistreevous path. A symmetric backend/frontend User Request Resolution Engine provides the user-interaction primitive.

## 2. Goals

- G1 — Tool-driven orchestration with a single canonical dispatcher (`agent.do`).
- G2 — Confidence-gated completion with structured JSON tool contracts.
- G3 — Optional deterministic (non-LLM) execution via GOAP/mistreevous.
- G4 — Manager as sole user-facing coordinator; solvers return structured results to the manager.
- G5 — Symmetric backend/frontend user-request resolution (mockable in Node Jest, UI via stepped forms).

## 3. Requirements

- **Req-1 (DECAF-17):** `AgentBuilder` registers each agent instance in a runtime registry **and** registers tool metadata. `agent.do(operation, params)` is the canonical dispatcher; thin wrappers (`agent.plan`/`review`/`create-specs`/`implement`/`execute`/`manage`) forward to it. Concrete agents: `manager`, `orchestrator`, `architect`, `implementation`, `reviewer`, `documentation` (deferred). Structured JSON tool contract `{ confidence: 1..100, summary, status, questions?, blockers? }`; `TASK COMPLETE` sentinel; confidence threshold default 50 (configurable); `confidence <= threshold` ⇒ blocked, routed back. `agent.notify` progress helper (prompt mode); DECAF-20 merged in. `JIRA_ENABLED=true` ⇒ SPEC/TASK mirrored to Jira before stage transitions.
- **Req-2 (DECAF-19):** Configurable execution-mode flag (default/GOAP/workflow) read early from canonical runtime config (not a second source of truth). Non-default modes dispatch to the selected solver which resolves steps programmatically (LLM only for explicitly-required subtasks) and returns a structured result to the manager: `{ executionMode, terminalStatus, orderedActions/steps, managerFacingSummary, followUp/remediationHints, failureDetails? }`. Solvers never respond directly to the user. Verification must prove branching happens before any prompt-based decision.
- **Req-3 (DECAF-45):** Canonical source `@decaf-ts/ui-decorators` (exports `user-requests` and `user-requests/shared`); `@decaf-ts/integrations` re-exports as backward-compatible shims. `UserRequest<T>` model; `UserRequestHandler`/`BaseUserRequestHandler` (Promise-first); `UserRequestRegistry` (lookup + dispatch, multi-handler chaining); `@userRequest('id')` decorator (built on `@decaf-ts/decoration`). `MockUserRequestResolver` (backend, no DOM); `SteppedFormUserRequestResolver` (frontend, `for-angular`, wraps `SteppedFormComponent` in a Promise). Same handler code path in backend (mocked) and frontend (UI) tests. `for-angular` cannot depend on backend-only `integrations` (forbidden edge) ⇒ canonical source is `ui-decorators`.

## 4. Architecture & Design

See [Architecture Workbook §09](../architecture-workbook/09-agent-orchestration.md). Key decisions:

- **Single registry as source of truth** for `agent.do` selection (built by `AgentBuilder`).
- **Deterministic path disables LLM branching/sequencing/tool-selection** — only explicitly-required subtasks use an LLM.
- **User-requests canonical source moved to `ui-decorators`** to respect the `for-angular` ⇸ `integrations` forbidden dependency edge.

### agent.do dispatch

```mermaid
sequenceDiagram
    participant U as User
    participant Mgr as manager
    participant Orch as orchestrator
    participant Do as agent.do
    participant Reg as registry
    participant A as target agent
    U->>Mgr: "implement SPEC-XXX"
    Mgr->>Orch: decide next agent
    Orch->>Do: agent.do("implement", params)
    Do->>Reg: select by operation -> spawn child
    A-->>Orch: progress (agent.notify) + structured JSON
    alt confidence > threshold: Orch->>Mgr: aggregate; next step
    else confidence <= threshold: Orch->>Mgr: blocked; Mgr<->U: surface blockers/questions
    end
    A-->>Orch: "TASK COMPLETE"
```

## 5. Public Interfaces (selected)

- `agent.do(operation, params)`; `agent.notify(progress)`; thin wrappers `agent.plan/review/create-specs/implement/execute/manage`.
- Structured JSON contract `{ confidence, summary, status, questions?, blockers? }`; `TASK COMPLETE` sentinel.
- Execution-mode flag (default/GOAP/workflow); structured result shape (DECAF-19).
- `@userRequest('id')`; `UserRequestRegistry.handleAsync(request)`; `MockUserRequestResolver`; `SteppedFormUserRequestResolver`.
- Subpaths: `@decaf-ts/ui-decorators/user-requests` / `/user-requests/shared` (canonical); `@decaf-ts/integrations/user-requests[/shared]` (shims).

## 6. Open Questions / Risks

- Dispatch ownership: DECAF-17 (orchestrator owns per-task) vs DECAF-19 (manager is sole user-facing; solvers return to manager) — reconcile (B23).
- Config source: CLI flag (DECAF-17) vs canonical config (DECAF-19) (B23).
- Result contracts not unified — DECAF-17 has `confidence`; DECAF-19's structured result does not (B24).
- User-interaction ownership implicit/duplicated — DECAF-17 manager surface vs DECAF-45 `UserRequestRegistry` (not cross-referenced) (B25).
- `TASK COMPLETE` sentinel detection without truncating progress; agent-mode MCP client handshake under compiled `dist` still being validated; Jira sync churn must stay minimal.
- `SteppedForm` test harness needs Ionic/Translate/i18n FakeLoader.

Continue to [09 — Integrations, UI, CI & Testing Design](./09-integrations-design.md).
