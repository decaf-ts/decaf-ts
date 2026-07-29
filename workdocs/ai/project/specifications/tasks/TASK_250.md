# TASK-250: Extend integration docker-compose for dual Keycloak, Traefik, and protected-service broker testing

**ID:** TASK-250
**Specification:** [Link to Specification](../DECAF_43.md)
**Priority:** Critical
**Status:** Completed

## 1. Description

Extend the integration docker-compose setup so the tests can run a main Keycloak, an external Keycloak, Traefik, and a protected service in the same environment. The goal is to make the brokered auth matrix runnable with the existing repository tooling.

## 2. Objectives

* [x] Reuse the current integration compose files instead of inventing a new ad hoc harness.
* [x] Add a dual-Keycloak topology with stable hostnames and callback URLs.
* [x] Include Traefik and the protected service path used by the auth-flow tests.
* [x] Preserve the existing single-Keycloak compose path for non-broker suites.

## 3. Implementation Plan

**Proposed Changes:**
* Add or extend a broker-specific compose overlay under `integrations/docker/`.
* Parameterize ports, hostnames, and health checks for two Keycloak instances.
* Add startup/wait helpers for the new services.

**Technical Details:**
* Keep health checks deterministic so the auth tests do not race service startup.
* Make the stack compatible with the current `DockerComposeService` helpers.

## 4. Verification Plan

**Automated Tests:**
* [x] Integration Test: `integrations/tests/integration/keycloak-broker-compose.test.ts`
* [x] E2E Test: `integrations/tests/e2e/keycloak-broker.e2e.test.ts`

**Manual Verification:**
* Bring up the compose stack and verify both Keycloak instances and Traefik report healthy.

## 5. Blockers & Clarifications

* **Blocker 1:** The exact existing Traefik/auth-proxy compose variant to reuse if it is provided.
* **Clarification 1:** Whether the protected service should be the same app used by the current auth e2e suites or a dedicated broker target.

## 6. Execution Log

* 2026-07-29 - Added `docker/keycloak-broker-compose.yml` with Traefik, two Keycloak instances, oauth2-proxy, and a protected service.
