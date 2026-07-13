# TASK-245: Define subscription mode and server-side registry contract

**ID:** TASK-245
**Specification:** [DECAF-42: Controlled SSE Subscriptions for for-http and for-nest](../DECAF_42.md)
**Priority:** High
**Status:** Completed

## 1. Description
Define the configuration shape, registry contract, and lifecycle semantics for subscription mode on the server side. Keep the current broadcast behavior intact as the default, and document how the backend should track subscriber identity and event filters when private mode is enabled.

## 2. Objectives
*   [x] Define the configuration flag(s) that enable subscription mode without changing the broadcast default.
*   [x] Specify the server-side subscription registry contract and what subscriber metadata it stores.
*   [x] Clarify event filtering semantics for subscribed observers.

## 3. Implementation Notes
*   The registry should be able to operate in-memory first, with optional persistence support if a `RamAdapter`-backed store is later required.
*   The subscription model should be explicit enough to support cleanup on disconnect and resubscription on reconnect.

## 4. Verification Plan
*   [x] Documentation review against the `for-http` and `for-nest` SSE APIs.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   Completed with DECAF-42 registry and subscription-mode contract updates.
