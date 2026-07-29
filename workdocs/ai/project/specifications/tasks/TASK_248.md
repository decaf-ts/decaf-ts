# TASK-248: Extend Keycloak provisioning contracts for broker identity providers and upstream auth variants

**ID:** TASK-248
**Specification:** [Link to Specification](../DECAF_43.md)
**Priority:** High
**Status:** Completed

## 1. Description

Extend the Keycloak provisioning surface so broker identity providers can be configured programmatically for both OpenID Connect and SAML upstream Keycloak instances. The configuration must express broker aliasing, discovery/manual endpoint configuration, callback URIs, scopes, client authentication mode, and the first-broker-login policy surface needed by the matrix.

## 2. Objectives

* [x] Add separate broker-oriented config types to `integrations/src/keycloak/types.ts`.
* [x] Extend the provisioning service(s) so broker identity providers can be created and updated.
* [x] Cover the OIDC and SAML provider shapes required by the spec.
* [x] Preserve existing realm/user/role/client provisioning behavior.

## 3. Implementation Plan

**Proposed Changes:**
* Update the identity-provider service to accept broker configs and render the appropriate Keycloak Admin REST payloads.
* Add helper methods for discovery-based and manual provider setup.
* Add client-auth configuration support for the broker matrix.

**Technical Details:**
* Keep the new broker config compatible with the current `KeycloakService` orchestration model.
* Keep service initialization and logging consistent with the existing integration package patterns.

## 4. Verification Plan

**Automated Tests:**
* [x] Unit Test: `integrations/tests/unit/keycloak-broker-config.test.ts`
* [x] Integration Test: `integrations/tests/integration/keycloak-broker-compose.test.ts`

**Manual Verification:**
* Provision a broker identity provider against a live Keycloak instance and confirm the expected admin API objects are created.

## 5. Blockers & Clarifications

* **Resolved:** Keycloak `24.0.0` live-tested client-secret post/basic/JWT and private-key JWT OIDC authentication plus SAML.
* **Clarification 1:** Whether to represent OIDC and SAML broker config in one union type or split types.

## 6. Execution Log

* 2026-07-29 - Added separate OIDC/SAML broker contracts, payload builders, and create/update orchestration.
