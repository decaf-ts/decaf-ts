# TASK-148: Implement ChannelManager service, exports, and coverage

**ID:** TASK-148
**Specification:** [Link to Specification](../DECAF_21.md)
**Priority:** High
**Status:** Pending

## 1. Description
Implement the `ChannelManager` service in `for-fabric`, export it through the existing client service barrel, and add coverage that proves the service keeps peer-level and organization-level operations granular.

## 2. Objectives
*   [ ] Add the new service class under `for-fabric/src/client/services/`.
*   [ ] Export the service through `for-fabric/src/client/services/index.ts` and any required higher-level barrel.
*   [ ] Add tests that validate the primitive membership operations and their result granularity.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `ChannelManager` as a `Service` subclass with Fabric channel membership methods.
*   Wire the implementation to the same channel concepts used elsewhere in `for-fabric`.
*   Add unit coverage for single-peer and single-organization operations and any thin batch composition helpers.

**Technical Details:**
*   Keep the implementation compatible with the existing `for-fabric` logging and context conventions.
*   Avoid coupling the service to PTP infra-specific helpers, fixtures, or orchestration classes.
*   Ensure exports are available from the existing client-facing module surface.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-fabric/tests/unit/client-services-channel-manager.test.ts`
*   [ ] Integration Test: `for-fabric/tests/integration/channel-manager.test.ts`

**Manual Verification:**
*   Confirm the service can be imported from the `for-fabric` client entry points.
*   Confirm each primitive membership method operates on exactly one target at a time.

## 5. Blockers & Clarifications
*   **Blocker 1:** The exact transport for channel membership operations may depend on the chosen `fabric-weaver` or Fabric SDK integration path.

## 6. Execution Log
*   [2026-06-05] - Task created.
