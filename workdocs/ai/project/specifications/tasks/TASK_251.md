# TASK-251: Add live OIDC broker E2E coverage for discovery/manual config and client-auth variants

**ID:** TASK-251
**Specification:** [Link to Specification](../DECAF_43.md)
**Priority:** Critical
**Status:** Completed

## 1. Description

Add end-to-end tests for the OpenID Connect broker matrix. The suite must use live redirect/callback flows against the running compose environment and must prove that the local Keycloak issues the final token that protected services accept.

## 2. Objectives

* [x] Cover discovery-based OIDC broker configuration.
* [x] Cover manual OIDC broker configuration.
* [x] Cover the supported OIDC client-auth variants in the matrix.
* [x] Cover first-login and account-linking outcomes.

## 3. Implementation Plan

**Proposed Changes:**
* Add OIDC broker e2e tests that drive the real login flow.
* Verify callback handling, local token issuance, and protected-service access.
* Add negative cases for mismatched callback URLs and rejected broker setup.

**Technical Details:**
* Prefer browser-grade or redirect-aware automation over token mocking.
* Assert on issuer, audience, and local claim normalization at the service boundary.

## 4. Verification Plan

**Automated Tests:**
* [x] E2E Test: `integrations/tests/e2e/keycloak-broker.e2e.test.ts`

**Manual Verification:**
* Run the OIDC broker matrix locally and confirm every variant completes a full login flow.

## 5. Blockers & Clarifications

* **Blocker 1:** Which OIDC client-auth variants are supported by the pinned Keycloak image.
* **Clarification 1:** Whether each auth variant should have its own test file or be parameterized in one matrix.

## 6. Execution Log

* 2026-07-29 - Added live discovery, manual, client-secret post/basic/JWT, and private-key JWT OIDC flows.
