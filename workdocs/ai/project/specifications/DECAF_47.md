# DECAF-47: for-fabric Mirror Allow Predicate

**Status:** In Progress
**Priority:** High
**Owner:** Fabric / Platform Engineering

## 1. Overview
Extend `@mirror()` in `for-fabric` with an optional `allow` predicate that receives the current `Context` and returns a boolean. When `allow` is present and returns `false`, the mirror feature must behave as though it is not active for that execution path: no mirror collection reads, no mirror writes, no mirror-specific params added to the context, and no mirror handlers or gates executed.

This spec keeps the existing mirror metadata model intact. If `allow` is omitted or returns `true`, the current mirror behavior remains unchanged. The new predicate complements the existing global `allowMirroring` control by allowing per-decorator or request-scoped suppression of mirror behavior.

## 2. Goals
*   [ ] Allow `@mirror()` to accept an optional `allow(context): boolean` callback.
*   [ ] Bypass every mirror-related code path when `allow` returns `false`.
*   [ ] Preserve current mirror behavior when `allow` is omitted or returns `true`.
*   [ ] Add regression coverage for the blocked and allowed mirror paths.

## 3. User Stories / Requirements
*   **US-1:** As a Fabric model author, I want to conditionally disable mirroring from the decorator itself so that mirroring can be skipped for specific contexts.
*   **US-2:** As a runtime caller, I want a mirror definition to be able to short-circuit itself before any mirror work happens so that no mirror side effects are produced.
*   **Req-1:** The system must pass the current `Context` into the `allow` callback when it is present.
*   **Req-2:** When `allow(context)` returns `false`, the system must not read from mirror collections, must not write mirror records, and must not add mirror-specific params to the context.
*   **Req-3:** When `allow(context)` returns `false`, the system must bypass all mirror handlers and gates, including any logic that would otherwise run because the model is mirrored.
*   **Req-4:** When `allow` is missing or returns `true`, the system must preserve the existing mirror behavior.

## 4. Architecture & Design
The optional predicate belongs on the shared `@mirror()` decorator contract in `for-fabric/src/shared/decorators.ts`, alongside the existing collection and MSP metadata. Mirror-aware execution points must evaluate the predicate before any other mirror-specific work begins.

The early-bypass check should be applied in the shared decorator helpers and in the contract/client execution paths that currently:
*   route to mirror collections,
*   prepare mirror write payloads,
*   enforce mirror authorization, or
*   enrich the `Context` with mirror-specific params.

The intended behavior is a hard stop. Once `allow(context)` returns `false`, downstream mirror handlers and gates must not observe the execution as mirrored at all. That means the predicate must short-circuit before `allowMirroring` checks, collection reads, writes, or context mutation.

Expected verification points:
*   Decorator typing accepts the optional predicate.
*   Contract-side mirror routing and write paths short-circuit before mirror reads or writes.
*   Client-side mirror promotion and repository paths short-circuit before mirror-specific context changes.
*   Existing mirror behavior remains unchanged when the predicate is absent or truthy.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| [TASK-260](./tasks/TASK_260.md) | Extend `@mirror()` metadata and typing with `allow(context)` | High | Completed | - |
| [TASK-261](./tasks/TASK_261.md) | Short-circuit all mirror paths when `allow` returns `false` | High | Completed | TASK-260 |
| [TASK-262](./tasks/TASK_262.md) | Add regression coverage for blocked and allowed mirror execution paths | High | In Progress | TASK-261 |

## 6. Open Questions / Risks
*   The predicate is defined as synchronous. If an asynchronous guard is needed later, it will require a broader contract change.
*   Any helper that inspects mirror metadata without executing mirror logic should be explicit about whether it evaluates `allow`.
*   This feature overlaps with the existing global `allowMirroring` gate, so the bypass order must remain deterministic and documented.

## 7. Results & Artifacts
*   `workdocs/ai/project/specifications/DECAF_47.md`
*   `workdocs/ai/project/specifications/tasks/TASK_260.md`
*   `workdocs/ai/project/specifications/tasks/TASK_261.md`
*   `workdocs/ai/project/specifications/tasks/TASK_262.md`
*   `workdocs/ai/project/plan.md`
