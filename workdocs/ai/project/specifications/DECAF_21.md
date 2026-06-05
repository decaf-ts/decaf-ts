# DECAF-21 — Fabric Channel Manager Service

**Status:** Planned
**Priority:** High
**Owner:** Codex

## 1. Overview
This specification introduces a `ChannelManager` service in `for-fabric` that encapsulates channel membership operations for Hyperledger Fabric. The goal is to provide a reusable service layer that infra consumers can import, extend, and compose when they need to add or remove organizations and peers from a channel.

The design should mirror the channel-management flow already exercised in `@decaf-ts/fabric-weaver` and in the `Join Peers to the channel` step from the PTP infra bootstrap tests, but it must remain more granular than the infra test workflow. The service should expose small, reusable operations for a single peer or organization at a time so downstream consumers can build broader workflows without inheriting infra-specific assumptions or service dependencies they do not have access to.

The resulting API should live in `for-fabric` and remain independent from the PTP infra repository. Infra should be able to import or extend the service later, but the service itself must only depend on `decaf-ts` and `for-fabric` boundaries.

## 2. Goals
*   [ ] Add a `ChannelManager` service that extends `Service` from `@decaf-ts/core`.
*   [ ] Provide granular operations for adding and removing a single peer or organization from a channel.
*   [ ] Keep the implementation reusable for infra consumers without coupling it to infra-only services or bootstrap logic.
*   [ ] Align the service contract with the channel-management patterns already used by `@decaf-ts/fabric-weaver` and the infra channel-join test flow.
*   [ ] Export the service through the existing `for-fabric` client service surface.

## 3. User Stories / Requirements
*   **US-1:** As an infra maintainer, I want to import a reusable channel-management service so I can manage channel membership without duplicating low-level join/leave logic.
*   **US-2:** As a module consumer, I want peer and organization membership operations to be granular so I can compose my own broader channel workflows.
*   **US-3:** As a `for-fabric` maintainer, I want the service to stay independent from PTP infra-only services so the module can be reused in other projects.
*   **Req-1:** The service must extend `Service` and follow the repo's service/decorator conventions.
*   **Req-2:** The service must expose separate primitive operations for peer-level and organization-level channel membership changes.
*   **Req-3:** Any multi-target membership workflow must be composed from the primitive operations and must preserve per-target visibility in the result model.
*   **Req-4:** The service must not depend on infra-specific code, fixtures, or services that are unavailable in `for-fabric`.
*   **Req-5:** The design must remain compatible with the channel-management patterns demonstrated by `@decaf-ts/fabric-weaver` and the infra "Join Peers to the channel" step.

## 4. Architecture & Design
The service should live under `for-fabric/src/client/services/` and be exported through the existing client service barrel.

Recommended shape:
* `ChannelManager` extends `Service` from `@decaf-ts/core`.
* `ChannelManager` should be decorated with `@service()` or an equivalent service registration used elsewhere in the repo.
* The API should favor small methods such as:
  * add a single peer to a channel
  * remove a single peer from a channel
  * add a single organization to a channel
  * remove a single organization from a channel
* Batch-style behavior, if present, must be a thin composition layer over the primitive methods and must return structured per-target results.

The implementation should reuse the same Fabric channel concepts already present in the repo and in `@decaf-ts/fabric-weaver`, but it should not copy the infra bootstrap orchestration as-is. In particular, the PTP bootstrap flow joins several peers in one step; this service should expose one-peer/one-organization operations so other callers can decide how to batch them.

The service should be designed so that later consumers, including PTP infra, can extend or wrap it to:
* map organization metadata into channel updates,
* join or remove peers independently,
* orchestrate retries or sequencing outside the service,
* and compose multi-step channel workflows without changing the service contract.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:-------|:-------------|
| TASK-147 | [Define the ChannelManager contract and map the Fabric channel-management flows](./tasks/TASK_147.md) | High | Pending | - |
| TASK-148 | [Implement ChannelManager service, exports, and coverage](./tasks/TASK_148.md) | High | Pending | TASK-147 |

## 6. Open Questions / Risks
*   The exact low-level mechanism for channel membership changes may need to stay abstract until the preferred `fabric-weaver` integration path is confirmed.
*   Organization membership updates in Fabric can require more than a simple join/leave call, so the service contract may need separate primitives for peer-level and organization-level operations.
*   The infra bootstrap flow currently joins multiple peers in one step, but the reusable service must remain more granular to avoid baking in that broader orchestration.
*   Some membership operations may need ordering-service or channel-config update support that is broader than the minimal peer join example.

## 7. Results & Artifacts
*   `workdocs/ai/project/specifications/DECAF_21.md`
*   `workdocs/ai/project/specifications/tasks/TASK_147.md`
*   `workdocs/ai/project/specifications/tasks/TASK_148.md`
*   `workdocs/ai/project/plan.md`
