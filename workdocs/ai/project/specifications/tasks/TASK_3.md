# TASK-3: legacyMspCount peer selection

**ID:** TASK-3
**Specification:** [Link to Specification](../DECAF_2.md)
**Priority:** Medium
**Status:** In Progress — implementation pending.

## 1. Description
Add the `legacyMspCount` configuration to `FabricClientFlags`/`DefaultFabricClientFlags` and adjust `buildLegacyPeerConfigs` so it randomly chooses up to `legacyMspCount` unique peers from each `mspMap` list before deduplicating them.

## 2. Objectives
*   [ ] Extend the config flag so it defaults to `1` and can be passed via contexts and command-line flags.
*   [ ] Ensure the selection logic throws if no peers exist for a requested MSP, even if `legacyMspCount > 1`.
*   [ ] Keep the final `peers` list deterministic by deduplicating duplicates and always including the primary peer.

## 3. Implementation Plan
**Proposed Changes:**
*   Update `FabricClientFlags`/`DefaultFabricClientFlags` with `legacyMspCount?: number` and ensure contexts log/respect it.
*   Modify `buildLegacyPeerConfigs` to sample `legacyMspCount` candidates (using random selection without replacement when possible) from `mspMap[msp]`.
*   Adjust logging to mention how many peers are used when `legacyMspCount` exceeds one.

**Technical Details:**
*   Use a helper that shuffles or picks random indices without replacement; when candidates are fewer than `legacyMspCount`, include all.
*   Ensure `legacyMspCount <= candidates.length` before deduping duplicates to avoid infinite loops.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit test of `buildLegacyPeerConfigs` verifying `legacyMspCount = 2` picks two distinct peers from a mock `mspMap`.
*   [ ] Unit test ensuring `legacyMspCount` defaults to 1 and replicates previous behavior.

**Manual Verification:**
*   1. Configure `legacyMspCount=2` and `mspMap` with two endpoints; run a legacy submission and confirm the log prints two peers.
*   2. Ensure there is no regression when legacy mode is off.

## 5. Blockers & Clarifications
*   **Clarification:** Should randomness be seeded or deterministic for testing? We'll inject a helper or allow tests to stub the RNG.

## 6. Execution Log
*   [Date] - Task created.
*   2026-02-21 - Reopened: implementation/tests outstanding.
