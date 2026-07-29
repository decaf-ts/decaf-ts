# TASK-252: Add live SAML broker E2E coverage, negative-path assertions, and docs for the full matrix

**ID:** TASK-252
**Specification:** [Link to Specification](../DECAF_43.md)
**Priority:** High
**Status:** Completed

## 1. Description

Add end-to-end coverage for SAML brokering and finish the documentation for the full broker matrix. The suite must verify that the SAML broker path also ends with a local Keycloak token and that protected services reject anything else.

## 2. Objectives

* [x] Cover the SAML broker flow with a live upstream Keycloak.
* [x] Add negative-path coverage for broken broker config and direct external-token use.
* [x] Prove that direct login to a base local realm and brokered login from a protected page both work, including forwarding back to the original protected request.
* [x] Document the full broker matrix and the compose/test run instructions.
* [ ] Capture logout or refresh behavior if the current Keycloak setup exposes a stable path for it.

## 3. Implementation Plan

**Proposed Changes:**
* Add SAML broker e2e tests and any supporting fixtures.
* Update integration docs for the broker harness and matrix.
* Record any limitations discovered in the pinned Keycloak version.

**Technical Details:**
* Keep the SAML tests aligned with the same trust-boundary assertions used by the OIDC suite.
* Document any protocol-specific limitations rather than hiding them behind a single generic test.

## 4. Verification Plan

**Automated Tests:**
* [x] E2E Test: `integrations/tests/e2e/keycloak-broker.e2e.test.ts`
* [x] Integration Test: `integrations/tests/integration/keycloak-broker-compose.test.ts`

**Manual Verification:**
* Run the SAML broker flow end to end and confirm the local Keycloak is still the only accepted issuer.

## 5. Blockers & Clarifications

* **Blocker 1:** Whether the current Keycloak image exposes the required SAML bindings without upgrading the version.
* **Clarification:** Logout propagation and refresh-token semantics have not been tested. They remain an open objective until the harness exposes a stable endpoint and explicit assertions are added.

## 6. Execution Log

* 2026-07-29 - Added live SAML flow, protected-boundary negative assertion, and broker harness documentation.
* 2026-07-29 - Recorded direct base-realm login and protected-page broker login with original-request forwarding. Logout/refresh coverage remains open.
