# TASK-147: Define the ChannelManager contract and map the Fabric channel-management flows

**ID:** TASK-147
**Specification:** [Link to Specification](../DECAF_21.md)
**Priority:** High
**Status:** Pending

## 1. Description
Define the reusable `ChannelManager` service contract for `for-fabric`, using the existing `@decaf-ts/fabric-weaver` channel-management patterns and the infra "Join Peers to the channel" bootstrap step as the reference points. The output of this task should make the intended granularity explicit so the service remains reusable outside the PTP infra repository.

## 2. Objectives
*   [ ] Identify the minimal peer-level and organization-level channel operations the service must expose.
*   [ ] Document how the service should stay granular while still supporting broader caller-driven batch workflows.
*   [ ] Confirm which parts of the infra join flow are reusable and which parts must remain outside the service.

## 3. Implementation Plan
**Proposed Changes:**
*   Draft the `ChannelManager` API surface and expected result shapes.
*   Map the infra "Join Peers to the channel" step to reusable primitive operations.
*   Capture the integration boundary between `for-fabric` and external consumers such as PTP infra.

**Technical Details:**
*   Keep the service independent from infra-only helpers or services.
*   Prefer one-channel/one-target methods as the reusable primitive layer.
*   Document any batch behavior as caller composition over the primitive operations.

## 4. Verification Plan
**Automated Tests:**
*   [ ] N/A - design/specification task.

**Manual Verification:**
*   Compare the proposed service contract against the existing infra channel-join flow.
*   Confirm the API is granular enough for single peer or single organization membership changes.

## 5. Blockers & Clarifications
*   **Blocker 1:** The preferred low-level implementation path for organization membership changes is not yet confirmed.

## 6. Execution Log
*   [2026-06-05] - Task created.
