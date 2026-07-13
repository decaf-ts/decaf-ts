# TASK-246: Extend the for-http SSE connector with subscribe/unsubscribe lifecycle handling

**ID:** TASK-246
**Specification:** [DECAF-42: Controlled SSE Subscriptions for for-http and for-nest](../DECAF_42.md)
**Priority:** High
**Status:** Completed

## 1. Description
Extend the `for-http` SSE connector so subscription mode performs an explicit subscribe step before listening and an explicit unsubscribe step during cleanup. The broadcast mode must continue to use the current `/events` behavior unchanged.

## 2. Objectives
*   [x] Add connector support for subscription registration on connection open.
*   [x] Add connector support for subscription removal on connection close.
*   [x] Preserve the existing broadcast-only behavior when subscription mode is disabled.

## 3. Implementation Notes
*   The connector should keep the same observable-facing API so existing frontend consumers do not need to change when broadcast mode is used.
*   Subscription-specific metadata should be passed through the connector configuration rather than hardcoded.

## 4. Verification Plan
*   [x] Unit coverage for connector lifecycle.
*   [x] Integration coverage for subscribe/unsubscribe call flow.

## 5. Blockers & Clarifications
*   Depends on TASK-245.

## 6. Execution Log
*   Completed with subscription-aware dispatcher/adapter lifecycle handling.
