# DECAF-2: Fabric Legacy Peer Selection

**Status:** COMPLETED — `legacyMspCount` flag implemented with random peer selection per MSP; tests validate multi-peer selection and deduplication.
**Priority:** Medium
**Owner:** decaf-dev

## 1. Overview
Improve the legacy submission path inside `for-fabric/src/client/FabricClientAdapter.ts` so the manually mapped peer selections respect a configurable `legacyMspCount` flag instead of always choosing exactly one candidate per MSP. This keeps the legacy flow deterministic as networks grow.

## 2. Goals
*   [x] Add `legacyMspCount` flag (default 1) that controls how many peers are randomly chosen from each `mspMap` entry when sending through the legacy gateway.
*   [x] Ensure the legacy peer map deduplication logic still applies so repeated peers are not duplicated even when `legacyMspCount > 1`.
*   [x] Keep existing observers/logging/testing/normal submission behavior untouched when legacy mode is disabled, while adding the newly requested mirror/allowGatewayOverride behaviours.

## 3. User Stories / Requirements
*   **US-1:** As an operator, I want legacy gateway submissions to spread requests across multiple peers when I have more than one mapped endpoint, so I can better balance load on older endorsers.
*   **US-2:** As a developer, want the number of peers chosen per MSP to be configurable via `legacyMspCount` so advanced deployments can tune legacy behavior without code changes.
*   **Req-1:** The new flag should default to `1` to keep current behavior unchanged for existing deployments.
*   **Req-2:** Peer selection must still throw if an MSP has no mapped peers.

## 4. Architecture & Design
- Update the `buildLegacyPeerConfigs` helper to collect up to `legacyMspCount` distinct peers per additional MSP instead of exactly one. When `legacyMspCount` is larger than the available candidates, fall back to using all of them once (with deduplication).
- Introduce the new flag into `FabricClientFlags`/`DefaultFabricClientFlags` so it can be passed through contexts and config.
- Keep the normalized peer list deterministic by deduplicating duplicates and ensuring `legacyMspCount` affects random selection, not final `peers` list length (the deduper should still add the primary peer at the end).

## 5. Tasks Breakdown
| ID     | Task Name                              | Priority | Status    | Dependencies |
|:-------|:---------------------------------------|:---------|:----------|:-------------|
| TASK-3 | Legacy `legacyMspCount` peer selection | Medium   | Completed | -            |
| TASK-4 | Legacy peer selection tests            | Medium   | Completed | TASK-3       |

## 6. Open Questions / Risks
*   How should randomness be handled in deterministic CI environments? Consider injecting a RNG helper or seeding to make tests predictable.
*   Are there lifecycle hooks or contexts that must be updated so `legacyMspCount` is accessible when submitting legacy transactions?

## 7. Results & Artifacts
*   ✅ `FabricClientAdapter.ts:1223-1300`: `resolveLegacyMspCount()`, `pickLegacyCandidates()`, `buildLegacyPeerConfigs()` implemented
*   ✅ Test coverage in `for-fabric/tests/unit/client-fabric-client-adapter.test.ts:354` validates multi-peer selection
*   ✅ `mspMap` field already exists in `PeerConfig` type (for-fabric/src/shared/types.ts:49)
*   ✅ `legacyMspCount` field already exists in `PeerConfig` type (for-fabric/src/shared/types.ts:50)

## 8. Implementation Details
### Key Methods
- `resolveLegacyMspCount()`: Reads `config.legacyMspCount` with default of 1
- `pickLegacyCandidates()`: Randomly selects up to `limit` candidates from array
- `buildLegacyPeerConfigs()`: Builds peer list respecting `legacyMspCount` per MSP
- `normalizeLegacyPeers()`: Deduplicates peers by endpoint/alias combo

### Peer Selection Strategy
1. Start with primary peer from `config`
2. For each extra MSP in `endorsingOrganizations`:
   - Look up candidates in `config.mspMap[msp]`
   - Randomly select up to `legacyMspCount` candidates
   - Add selected candidates to peer list
3. Deduplicate final peer list by endpoint+alias combination
4. Always include primary peer at end

### Code Locations
- Implementation: `for-fabric/src/client/FabricClientAdapter.ts:1223-1300`
- Test: `for-fabric/tests/unit/client-fabric-client-adapter.test.ts:354`
- Types: `for-fabric/src/shared/types.ts:50`, `for-fabric/src/client/types.ts:3`

## 9. Current Status Notes
✅ All requested behaviors implemented and tested. Legacy peer selection now supports:
- Configurable `legacyMspCount` per MSP
- Random peer selection within each MSP
- Deduplication to prevent duplicate endpoints
- Backward compatibility (default = 1 peer)
