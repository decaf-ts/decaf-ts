# DECAF-2: Fabric Legacy Peer Selection

**Status:** In Progress — gateway override/mirror flows remain unimplemented and the peer-selection changes have not been validated.
**Priority:** Medium
**Owner:** decaf-dev

## 1. Overview
Improve the legacy submission path inside `for-fabric/src/client/FabricClientAdapter.ts` so the manually mapped peer selections respect a configurable `legacyMspCount` flag instead of always choosing exactly one candidate per MSP. This keeps the legacy flow deterministic as networks grow.

## 2. Goals
*   [ ] Add `legacyMspCount` flag (default 1) that controls how many peers are randomly chosen from each `mspMap` entry when sending through the legacy gateway (adapter updates pending).
*   [ ] Ensure the legacy peer map deduplication logic still applies so repeated peers are not duplicated even when `legacyMspCount > 1`.
*   [ ] Keep existing observers/logging/testing/normal submission behavior untouched when legacy mode is disabled, while adding the newly requested mirror/allowGatewayOverride behaviours.

## 3. User Stories / Requirements
*   **US-1:** As an operator, I want legacy gateway submissions to spread requests across multiple peers when I have more than one mapped endpoint, so I can better balance load on older endorsers.
*   **US-2:** As a developer, I want the number of peers chosen per MSP to be configurable via `legacyMspCount` so advanced deployments can tune legacy behavior without code changes.
*   **Req-1:** The new flag should default to `1` to keep current behavior unchanged for existing deployments.
*   **Req-2:** Peer selection must still throw if an MSP has no mapped peers.

## 4. Architecture & Design
- Update the `buildLegacyPeerConfigs` helper to collect up to `legacyMspCount` distinct peers per additional MSP instead of exactly one. When `legacyMspCount` is larger than the available candidates, fall back to using all of them once (with deduplication).
- Introduce the new flag into `FabricClientFlags`/`DefaultFabricClientFlags` so it can be passed through contexts and config.
- Keep the normalized peer list deterministic by deduplicating duplicates and ensuring `legacyMspCount` affects random selection, not final `peers` list length (the deduper should still add the primary peer at the end).

## 5. Tasks Breakdown
| ID     | Task Name                              | Priority | Status    | Dependencies |
|:-------|:---------------------------------------|:---------|:----------|:-------------|
| TASK-3 | Legacy `legacyMspCount` peer selection | Medium   | In Progress | -            |
| TASK-4 | Legacy peer selection tests            | Medium   | In Progress | TASK-3       |

## 6. Open Questions / Risks
*   How should randomness be handled in deterministic CI environments? Consider injecting a RNG helper or seeding to make tests predictable.
*   Are there lifecycle hooks or contexts that must be updated so `legacyMspCount` is accessible when submitting legacy transactions?

## 7. Results & Artifacts
*   Pending: refreshed FabricClientAdapter implementation that handles `legacyMspCount`, mirror MSP routing, and `allowGatewayOverride`.
*   Pending: unit/integration coverage under `for-fabric/tests` validating multi-peer submission, mirror-only reads, and manual submission without the gateway.

## 8. Current Status Notes
*   Key behaviours requested in the conversation (mirror MSP enforcement, legacy submission to multiple peers, peer TLS discovery via `mspMap`) are not yet reflected in code or tests.
*   Documentation (README/plan/spec/tasks) must be updated again once the Fabric work lands to satisfy the constitution requirement.
