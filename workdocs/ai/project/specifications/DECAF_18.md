# DECAF-18 — Context Transition Semantics for `ContextualLoggedClass`

**Status:** Planned
**Priority:** High
**Owner:** Codex

## 1. Overview
Define and document the core context-transition contract used by `core/src/utils/ContextualLoggedClass.ts` and `core/src/persistence/Context.ts` so every contextual operation can safely reuse, derive, or replace execution state without losing traceability.

This specification formalizes how `logCtx` decides whether the incoming arguments already contain a context, how `.context()` creates a new context when required, and how `.flags()` seeds the initial state for a context instance. It also defines how context inheritance must behave when the incoming context differs by instance type, `flavour`, or `operation`, and how the parent-child graph must be maintained across nested calls.

The goal is to make contextual operations predictable for all services, repositories, adapters, task engines, and other `ContextualLoggedClass` descendants that currently rely on `MaybeContextualArg` and `ContextualArgs` to carry operation state.

## 2. Goals
*   [ ] Formalize the transition rules that determine when `logCtx` reuses an incoming context versus creating a derived child context.
*   [ ] Extend `ContextFlags` with the minimum shape needed to represent context flavour and any required metadata overrides.
*   [ ] Ensure child contexts inherit the active logger, after any `.for(...)` customization, when a new context is created from an existing one.
*   [ ] Preserve parent-child relationships so contexts can read from themselves, from ancestors, and from descendants.
*   [ ] Clarify the responsibilities of `.flags()`, `.context()`, and `.logCtx()` for context creation, override enforcement, and operation scoping.
*   [ ] Document the expected usage of `MaybeContextualArg<T>` and `ContextualArgs<T>` for both optional and guaranteed context-bearing call sites.

## 3. User Stories / Requirements
*   **US-1:** As a maintainer, I want every contextual method call to keep the correct operation state so nested service/repository calls do not accidentally share stale metadata.
*   **US-2:** As a maintainer, I want context transitions to be automatic when the incoming context is from a different instance, flavour, or operation so the runtime always uses the correct derived context shape.
*   **US-3:** As a developer, I want child contexts to inherit the logger configuration of the parent context so log formatting and scoping remain consistent across nested operations.
*   **Req-1:** If a contextual method receives an argument list that already includes a `Context`, `logCtx` must inspect the context and decide whether to reuse it or create a new derived context.
*   **Req-2:** A new context must be created when the incoming context instance differs from the current contextual class' expected context type.
*   **Req-3:** A new context must be created when the incoming context `flavour` differs from the target flavour, defaulting to `DecafFlavour` from `@decaf-ts/decoration` when no explicit flavour is provided.
*   **Req-4:** A new context must be created when the `operation` changes, even if the incoming context is otherwise compatible.
*   **Req-5:** When a new context is created from an existing one, the parent-child relationship must be preserved so downstream APIs can read from the current context, its parents, and its children.
*   **Req-6:** Existing logger state must be preserved across derived contexts, using the same logger instance after `.for(...)` customization has been applied.
*   **Req-7:** `ContextualLoggedClass` must remain the component responsible for deciding and enforcing context transitions, while concrete contextual classes remain responsible for their own context shapes and mandatory overrides.

## 4. Architecture & Design
The implementation and documentation should align with the following context model:

*   `core/src/persistence/Context.ts` remains the core context container for operation-scoped data and metadata.
*   `core/src/utils/ContextualLoggedClass.ts` remains the transition coordinator for contextual methods that may or may not receive an existing context.
*   `ContextFlags` should carry the base shape for context state, including a `flavour` field that defaults to `DecafFlavour` when not overridden.
*   `Context` must expose both `toOverrides()` and `toConfig()`:
    *   `toOverrides()` returns the state the context wants to forward as overrides, for consumption by `.override(...)`.
    *   `toConfig()` returns the state the context wants to forward as configuration, for consumption by `.for(...)`.
    *   The two outputs must remain separable so service/repository layers can interpret them independently instead of conflating override data with config data.
*   `ContextualLoggedClass.logCtx(...)` must support both call forms:
    *   `await this.logCtx(args, "string", true)` when the incoming args may or may not already contain a context, and
    *   `this.logCtx(args, this.method)` when the args are already context-bearing.
*   The transition chain must be enforced through the `.logCtx -> .context -> .flags` sequence:
    *   `logCtx` inspects the provided args and determines whether a context exists and whether it can be reused.
    *   `.context()` creates a new derived context when a transition is required.
    *   `.flags()` sets the initial state for the context and applies required overrides.
*   Transition conditions must force derivation from the existing context when any of the following changes:
    *   the concrete context class/instance type,
    *   the context `flavour`,
    *   the `operation`.
*   Derived contexts must retain the active logger, including any adjustments made through the logger `.for(...)` API, so nested operations continue to emit coherent scoped logs.
*   `Context` should expose APIs that allow reading state from the current node, from the current node plus parents, and from the current node plus children.
*   `Context` must also expose a clear data/export split:
    *   `toOverrides()` for values a child context wants to forward into another contextual instance’s `.override(...)` path,
    *   `toConfig()` for values a child context wants to forward into `.for(...)`,
    *   and callers should not need to guess which method to use when moving state between services, repositories, and adapters.
*   The contextual contract should support the common nesting pattern where an outer method opens an operation, passes `ctxArgs` to inner calls, and each inner call re-evaluates whether it can reuse or must derive a new context.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:-------|:-------------|
| TASK-136 | [Define context flag shape and flavour metadata contract](./tasks/TASK_136.md) | High | Pending | - |
| TASK-137 | [Implement context transition rules in `ContextualLoggedClass.logCtx`](./tasks/TASK_137.md) | High | Pending | TASK-136 |
| TASK-138 | [Preserve parent-child linkage and logger propagation across derived contexts](./tasks/TASK_138.md) | High | Pending | TASK-137 |
| TASK-139 | [Document and verify nested contextual call patterns](./tasks/TASK_139.md) | Medium | Pending | TASK-137, TASK-138 |

## 6. Open Questions / Risks
*   Should `ContextFlags` stay as the single canonical state shape, or should specialized contextual classes be allowed to compose additional flag layers over the base shape?
*   How should child-context enumeration behave when multiple derivations branch from the same parent during a long-lived operation chain?
*   The current code already performs a lightweight context-like check without relying on `instanceof`; the spec should confirm whether that heuristic remains the long-term compatibility strategy for mixed build outputs.
*   The logger inheritance rule must stay deterministic even when `.for(...)` is called multiple times across nested operations.

## 7. Results & Artifacts
*   A documented context-transition contract for `ContextualLoggedClass` and `Context`.
*   A `ContextFlags` shape that explicitly includes flavour metadata and supports derived overrides.
*   Distinct `toOverrides()` and `toConfig()` context export methods for clean separation of forwardable override data versus configuration data.
*   Clear rules for when contextual methods reuse an incoming context versus creating a new one.
*   Parent-child context linkage semantics for nested operation chains.
*   Documentation and verification guidance for `MaybeContextualArg<T>` and `ContextualArgs<T>` usage patterns.
