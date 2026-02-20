# TASK-4: Legacy peer selection tests

**ID:** TASK-4
**Specification:** [Link to Specification](../DECAF_2.md)
**Priority:** Medium
**Status:** Completed

## 1. Description
Add tests covering the new `legacyMspCount` flag, ensuring the legacy peer selection path honors the requested count and still deduplicates the final peer list.

## 2. Objectives
*   [ ] Create a deterministic test for `buildLegacyPeerConfigs` that stubs the configuration and inspects the output list length and endpoints.
*   [ ] Verify the final connection profile includes the deduplicated peers even when multiple candidates come from the same endpoint.

## 3. Implementation Plan
**Proposed Changes:**
*   Add tests (unit or integration) under `for-fabric/tests/unit` that call `buildLegacyPeerConfigs` with a fake context and `legacyMspCount = 2`.
*   Confirm that when two candidates map to the same endpoint, deduplication prevents duplicates while still satisfying the desired count when other endpoints exist.

**Technical Details:**
*   Mock `this.config.mspMap` to return known endpoints and use a seeded RNG by temporarily overriding `Math.random` if necessary.
*   Use encrypted or mocked `Context` to supply the extra MSP list (e.g., using `getEndorsingOrganizations`).

## 4. Verification Plan
**Automated Tests:**
*   [ ] Assert `buildLegacyPeerConfigs` returns `legacyMspCount` peers when enough unique endpoints are provided.
*   [ ] Assert deduplication reduces duplicates to one even if duplicate endpoints exist.

**Manual Verification:**
*   1. Run the `for-fabric` test suite after enabling the flag to verify no regressions occur.

## 5. Blockers & Clarifications
*   **Blocker:** `buildLegacyPeerConfigs` is private; tests might need to import the class or use proxies. Create friend helpers if needed.

## 6. Execution Log
*   [Date] - Task created.
*   2026-02-20 - Added deterministic tests validating legacy peer selection honors legacyMspCount and dedup logic.
