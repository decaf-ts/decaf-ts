# DECAF-37: Fabric Mirror Gating

**Status:** Completed
**Priority:** High
**Owner:** Fabric / Platform Engineering

## 1. Overview
Add a Fabric configuration flag, `allowMirroring`, that disables all behavioral effects of `@mirror()` while preserving its metadata. When the flag is `false`, mirror handlers, mirror write authorization, mirror collection routing, and client-side legacy submission promotion must all short-circuit. The existing `allowGatewayOverride` gate for legacy submission remains unchanged and continues to control when the client may opt into legacy gateway submission.

## 2. Goals
*   [x] Gate every mirror-specific contract handler and adapter path behind `allowMirroring`.
*   [x] Keep `@mirror()` metadata intact even when mirroring is disabled.
*   [x] Whitelist `allowMirroring` in client override propagation so callers can pass it through to contract execution.
*   [x] Preserve and verify the existing `allowGatewayOverride` gate for legacy submission.

## 3. User Stories / Requirements
*   **US-1:** As an operator, I want to disable mirroring without changing model metadata so the same models can run in non-mirrored mode.
*   **US-2:** As a client caller, I want to pass `allowMirroring` through request overrides so a single request can opt out of mirror behavior.
*   **Req-1:** The system must treat `@mirror()` as metadata-only when `allowMirroring` is `false`.
*   **Req-2:** The system must continue to require `allowGatewayOverride` before legacy gateway submission is used.

## 4. Architecture & Design
Mirror gating is implemented in the shared mirror decorators, the Fabric contract adapter/repository, and the Fabric client adapter/repository. The shared decorator helpers now return immediately when `allowMirroring` is disabled. The contract adapter checks the flag before mirror routing, mirror authorization, and mirror-mode record preparation. The client adapter and client repository skip promotion to legacy submission when mirroring is disabled. `FabricClientContext` exposes `allowMirroring` in its override whitelist so callers can forward the flag through request-scoped context.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| TASK-243 | Gate contract-side mirror handlers and adapter paths behind `allowMirroring` | High | Completed | - |
| TASK-244 | Whitelist `allowMirroring` on the client side and add unit coverage | High | Completed | TASK-243 |

## 6. Open Questions / Risks
*   None. The existing `allowGatewayOverride` path already covers legacy gateway selection and remains independently testable.

## 7. Results & Artifacts
*   `for-fabric/src/shared/types.ts`
*   `for-fabric/src/shared/decorators.ts`
*   `for-fabric/src/client/types.ts`
*   `for-fabric/src/client/constants.ts`
*   `for-fabric/src/client/FabricClientContext.ts`
*   `for-fabric/src/client/FabricClientAdapter.ts`
*   `for-fabric/src/client/FabricClientRepository.ts`
*   `for-fabric/src/contracts/ContractAdapter.ts`
*   `for-fabric/src/contracts/crud/crud-contract.ts`
*   `for-fabric/tests/unit/client-fabric-client-adapter.test.ts`
*   `for-fabric/tests/unit/client-fabric-client-context.test.ts`
*   `for-fabric/tests/unit/client-fabric-client-repository-mirroring.test.ts`
*   `for-fabric/tests/unit/contracts-fabric-mirror.test.ts`
