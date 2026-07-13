# TASK-247: Add live tests and documentation for broadcast default behavior and private subscription mode

**ID:** TASK-247
**Specification:** [DECAF-42: Controlled SSE Subscriptions for for-http and for-nest](../DECAF_42.md)
**Priority:** Medium
**Status:** Completed

## 1. Description
Add the live tests and documentation needed to prove the broadcast default is unchanged, fan-out remains single-delivery per observer with 5+ connected consumers, and subscription mode only delivers requested events to the requesting client.

## 2. Objectives
*   [x] Add live Nest e2e coverage for broadcast mode.
*   [x] Add live Nest e2e coverage with 5+ consuming `HttpAdapter` observers and verify each receives every matching event exactly once.
*   [x] Add live Nest/for-http coverage for subscription mode with explicit subscribe/unsubscribe.
*   [x] Add live Nest/for-http coverage that confirms each subscription-scoped consumer only receives the events it requested.
*   [x] Update the relevant usage docs so the two modes are clearly distinguished.

## 3. Implementation Notes
*   Tests should verify the default broadcast path still behaves exactly as it does today.
*   Tests should verify that multiple concurrent observers do not multiply-deliver the same event to any single observer.
*   Tests should also verify that a subscribed client does not receive unrelated events.

## 4. Verification Plan
*   [x] E2E tests for both modes, including a 5+ consumer fan-out scenario.
*   [x] Documentation review for `for-http` and `for-nest`.

## 5. Blockers & Clarifications
*   Depends on TASK-245 and TASK-246.

## 6. Execution Log
*   Completed with broadcast/private SSE regression coverage.
