# TASK-249: Implement broker login normalization, account-linking coverage, and local-token trust assertions

**ID:** TASK-249
**Specification:** [Link to Specification](../DECAF_43.md)
**Priority:** High
**Status:** Completed

## 1. Description

Implement and test the broker-login behavior that turns an external Keycloak identity into a local Keycloak user session. This task covers identity normalization, account linking, and the assertion that Decaf services only trust the local Keycloak-issued token.

## 2. Objectives

* [x] Normalize upstream identity using issuer + subject rather than email alone.
* [x] Cover first-broker-login creation and linking flows.
* [x] Add assertions that the protected service rejects external Keycloak tokens.
* [x] Confirm local claims remain the only trust input for the Nest auth layer.

## 3. Implementation Plan

**Proposed Changes:**
* Add test helpers for extracting and asserting brokered identity state.
* Extend Nest-facing auth tests to verify the final token issuer and claim shape.
* Add negative-path checks for direct external-token use.

**Technical Details:**
* Keep the existing `KeycloakAuthHandler` behavior intact for non-broker routes.
* Reuse the local auth-context extraction flow where possible.

## 4. Verification Plan

**Automated Tests:**
* [x] Unit Test: `integrations/tests/unit/keycloak-broker-config.test.ts`
* [x] E2E Test: `integrations/tests/e2e/keycloak-broker.e2e.test.ts`

**Manual Verification:**
* Perform a real broker login and confirm the app accepts only the final local Keycloak token.

## 5. Blockers & Clarifications

* **Blocker 1:** The exact claim set returned by the local Keycloak after brokering.
* **Clarification 1:** Which account-linking behavior should be the default in tests.

## 6. Execution Log

* 2026-07-29 - Added issuer/subject identity hashing, account linking, local issuer assertions, and external-token rejection coverage.
