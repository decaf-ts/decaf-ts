# DECAF-43: Keycloak Realm Brokering and End-to-End Auth Flow Matrix

**Status:** Completed
**Priority:** Critical
**Owner:** Integrations / Platform

## 1. Overview

This specification extends `@decaf-ts/integrations/keycloak` and the surrounding integration test harness so one Keycloak instance can broker authentication to another Keycloak instance, while preserving the current Decaf trust boundary:

* applications and protected services continue to trust only the main, local Keycloak issuer;
* the main Keycloak instance delegates authentication to an external Keycloak instance through identity brokering;
* the external Keycloak instance authenticates the user and returns identity information to the main realm;
* the main Keycloak instance creates or links a local user representation and then issues the final token that Decaf services consume.

The goal is not to add a second trusted issuer to the application layer. The goal is to make the existing Keycloak provisioning helpers capable of configuring and testing real brokered login flows, end-to-end, with no mocked auth shortcuts.

The implementation must reuse and extend the current integration assets in `integrations/`, including:

* `integrations/src/keycloak/` for provisioning helpers and broker setup
* `integrations/src/nest/` for local token verification and request-context extraction
* `integrations/tests/` for live integration and e2e coverage
* `integrations/docker/keycloak-compose.yml`
* `integrations/docker/compose.integration.yml`

The repository also has a separate, external reference topology in
`/home/tvenceslau/local-workspace/pharmaledger/PTP-Workspace/docker/auth/docker-compose.yml`.
That compose file is not part of this repo and must not be edited here, but it
is the intended reference for the Traefik + Keycloak + oauth2proxy layout that
the new broker harness should align with when adding the local test overlay.

If a more complete Traefik + Keycloak + auth-proxy compose stack already exists and is supplied later, this specification should be implemented against that stack rather than replacing it.

### Broker scope

"Broker realm" in this spec means a Keycloak realm configured with one or more external identity providers so that users authenticate against the external Keycloak and then return to the local Keycloak through the broker callback.

The broker matrix must cover all broker auth schemes supported by the Keycloak version used in this repository's integration environment. At minimum, that means:

* OpenID Connect identity brokering
* SAML identity brokering
* OIDC client-auth variants supported by Keycloak 24.0.0 and exercised by the suite: client-secret post/basic, client-secret JWT, and private-key JWT
* broker login and account-linking variants exposed by Keycloak's First Broker Login / post-login flows

The tests must prove that the local Keycloak remains the only issuer trusted by Decaf services. External tokens must never be accepted directly by the protected service.

## 2. Goals

* [x] Extend the Keycloak provisioning services so a realm can register and manage external broker identity providers.
* [x] Support distinct OIDC and SAML broker configuration variants without changing the legacy provider contract.
* [x] Preserve the existing provisioning APIs for direct realm, user, role, client, and identity-provider management.
* [x] Add support for broker-aware user linking and local identity normalization.
* [x] Extend the integration docker-compose setup so the test harness can run a main Keycloak, an external Keycloak, Traefik, and a protected service in the same environment.
* [x] Add real end-to-end tests that drive the complete redirect/login/callback/token flow.
* [x] Verify every supported broker variant with live HTTP exchanges, not token mocks.
* [x] Preserve the current non-broker Keycloak tests so the existing provisioning surface remains covered.
* [x] Document the broker trust boundary, supported broker variants, and how to run the new test matrix.

## 3. User Stories / Requirements

* **US-1:** As a platform engineer, I want the local Keycloak to broker login to an external Keycloak realm so that external users can authenticate without sharing the external realm's private data.
* **US-2:** As a backend maintainer, I want the integration package to configure broker identity providers programmatically so that brokered environments can be provisioned in tests and local stacks.
* **US-3:** As a security reviewer, I want protected services to trust only the local Keycloak issuer so that external broker tokens are never accepted directly.
* **US-4:** As a test author, I want a reusable multi-service docker-compose harness so that I can validate the full auth path through Traefik, Keycloak, the external Keycloak, and the protected service.
* **US-5:** As a platform engineer, I want the broker matrix to include every supported broker auth scheme so that the integration coverage matches the supported Keycloak feature set, not just a single happy path.
* **US-6:** As a maintainer, I want account linking and first-login behavior covered so that new users, existing users, and explicitly linked users all follow the expected local-account rules.

* **Req-1:** The main Keycloak must remain the only issuer trusted by Decaf services and request handlers.
* **Req-2:** The external Keycloak must be treated as an upstream identity provider, not as a directly trusted application issuer.
* **Req-3:** The provisioning layer must support at least OpenID Connect and SAML brokering.
* **Req-4:** The provisioning layer must support the broker client-auth modes and callback configurations required by the matrix for the Keycloak version used in the repo.
* **Req-5:** Brokered authentication must create or link a local user representation in the main Keycloak before the final Decaf token is issued.
* **Req-6:** The local identity mapping must use stable external identity keys, not email alone.
* **Req-7:** The auth flow tests must exercise live redirect and callback behavior against running containers.
* **Req-8:** The test suite must cover positive and negative cases, including missing callback registration, rejected broker config, direct external-token rejection, and logout/refresh behavior where applicable.
* **Req-9:** The docker-compose changes must be compatible with the current integration test flow and must not break the existing non-broker Keycloak suites.
* **Req-10:** The new test matrix must be repeatable in CI and locally with the same compose-driven workflow.

## 4. Architecture & Design

### 4.1 Package impact

The likely implementation surface is:

* `integrations/src/keycloak/services/KeycloakService.ts`
* `integrations/src/keycloak/services/KeycloakIdentityProviderService.ts`
* `integrations/src/keycloak/services/KeycloakRealmService.ts`
* `integrations/src/keycloak/services/KeycloakRoleService.ts`
* `integrations/src/keycloak/services/KeycloakAuthService.ts`
* `integrations/src/keycloak/types.ts`
* `integrations/src/nest/keycloakAuthHandler.ts`
* `integrations/src/nest/utils.ts`

The exact split may vary, but the design must keep provisioning logic in the Keycloak integration package and token validation in the Nest integration layer.

### 4.2 Broker model

The integration package should expose broker-oriented configuration data for:

* provider alias and display name
* upstream Keycloak base URL / discovery URL
* upstream realm name
* OIDC or SAML provider type
* client authentication method
* callback / redirect URI handling
* scopes and claim mapping
* first-broker-login policy
* account-linking policy
* role / group / attribute mapping
* logout / refresh / session expectations

The configuration shape should allow the tests to describe multiple broker profiles without rewriting the provisioning logic for each profile.

### 4.3 Trust boundary and identity mapping

The protected service and the Decaf auth stack must validate only the local Keycloak issuer. The brokered login flow must therefore end with a local Keycloak-issued token, not an external token.

Stable identity should be derived from the upstream issuer and subject pair, not from email alone. Email remains a profile attribute, not the identity key.

The broker flow should explicitly cover:

* first login creates a new local user
* existing local account requires controlled linking
* brokered user attributes are mapped into the local account
* local token claims are normalized for downstream Decaf services

### 4.4 Supported broker variants

The test matrix should be defined in terms of concrete broker profiles. The exact list may be narrowed only if a Keycloak version or docker-image limitation makes a specific variant unavailable, but the spec target is:

* OIDC discovery-based broker
* OIDC manual-configuration broker
* OIDC client secret authentication
* OIDC client secret basic/post variants
* OIDC client-secret JWT client authentication
* OIDC private-key JWT client authentication
* SAML broker flow, including the binding / signing variants supported by the installed Keycloak image and the integration harness

The suite must prove that the provisioning helpers can express each supported variant and that the brokered login actually works against a live upstream Keycloak.

### 4.5 Compose and runtime topology

The current integration environment is single-instance Keycloak-focused. This spec requires a broker test topology that includes:

* `traefik`
* the main Keycloak instance that issues Decaf-trusted tokens
* a protected service behind the local auth boundary
* an external Keycloak instance that serves as the upstream broker
* the oauth2proxy/auth-to-proxy pattern already used in the external reference compose file

The harness should be built by extending the current integration compose files under `integrations/docker/` rather than creating one-off test-only scripts.

Expected runtime behavior:

1. the user hits the protected app through Traefik
2. the app redirects to the local Keycloak
3. the local Keycloak redirects to the external Keycloak identity provider
4. the user authenticates at the external Keycloak
5. the external Keycloak returns to the local Keycloak broker callback
6. the local Keycloak creates or links the local user
7. the local Keycloak issues the final token
8. the protected service accepts only the local token

### 4.6 Test strategy

Tests must be real auth-flow tests:

* no stubbed identity-provider exchange for the main assertions
* no direct acceptance of external Keycloak tokens by protected services
* real redirects, callbacks, cookie/session handling, and final token validation
* explicit assertions on the local realm user representation and on claim normalization

The existing single-Keycloak tests should remain and continue to prove the base provisioning/auth behavior. The new broker suites should add coverage, not replace the old one.

### 4.7 Suggested file layout

```text
integrations/
  docker/
    compose.integration.yml
    keycloak-compose.yml
    (brokered compose variant or overlay)
  src/
    keycloak/
      services/
        KeycloakIdentityProviderService.ts
        KeycloakService.ts
      types.ts
    nest/
      keycloakAuthHandler.ts
  tests/
    e2e/
      keycloak-broker-oidc.e2e.test.ts
      keycloak-broker-saml.e2e.test.ts
      keycloak-broker-auth-boundary.e2e.test.ts
    integration/
      keycloak-broker.test.ts
```

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:--|:--|:--|:--|:--|
| [TASK-248](./tasks/TASK_248.md) | Extend Keycloak provisioning contracts for broker identity providers and upstream auth variants | High | Completed | - |
| [TASK-249](./tasks/TASK_249.md) | Implement broker login normalization, account-linking coverage, and local-token trust assertions | High | Completed | TASK-248 |
| [TASK-250](./tasks/TASK_250.md) | Extend integration docker-compose for dual Keycloak, Traefik, and protected-service broker testing | Critical | Completed | TASK-248 |
| [TASK-251](./tasks/TASK_251.md) | Add live OIDC broker E2E coverage for discovery/manual config and client-auth variants | Critical | Completed | TASK-248, TASK-249, TASK-250 |
| [TASK-252](./tasks/TASK_252.md) | Add live SAML broker E2E coverage, negative-path assertions, and docs for the full matrix | High | Completed | TASK-248, TASK-249, TASK-250 |

## 6. Open Questions / Risks

* Resolved: the pinned Keycloak `24.0.0` image supports the OIDC and SAML variants covered by the live matrix.
* What existing Traefik + Keycloak + auth-proxy compose files should be reused if they are provided later?
* Should the broker harness use browser automation, a headless HTTP cookie-jar flow, or both for the login redirects?
* Do we need separate broker tests for account linking, forced reauthentication, and logout propagation, or should those be grouped under one matrix per protocol?
* Are SAML broker tests expected to run in the same CI job as OIDC broker tests, or should they be split because they are slower and more fragile?
* Should the local realm support multiple upstream brokers at once in the same test matrix, or is one external Keycloak enough for the initial implementation?

## 7. Results & Artifacts

* `workdocs/ai/project/specifications/DECAF_43.md`
* `workdocs/ai/project/specifications/tasks/TASK_248.md`
* `workdocs/ai/project/specifications/tasks/TASK_249.md`
* `workdocs/ai/project/specifications/tasks/TASK_250.md`
* `workdocs/ai/project/specifications/tasks/TASK_251.md`
* `workdocs/ai/project/specifications/tasks/TASK_252.md`

## 8. Completed Implementation

The broker contract is intentionally separate from `KeycloakSetupConfig` and is exposed through `KeycloakBrokerSetupConfig`. The live harness is `integrations/docker/keycloak-broker-compose.yml`; it uses file-provider Traefik configuration and does not modify the external reference compose file.

Run the live matrix from `integrations/`:

```bash
npm run test:e2e -- --runTestsByPath tests/e2e/keycloak-broker.e2e.test.ts
```

The suite owns the complete Docker lifecycle through `DockerComposeService`: it starts the Traefik, main Keycloak, external Keycloak, oauth2-proxy, and protected-service stack, waits for both Keycloak instances, and shuts everything down with volumes after the tests. It covers direct login to the base local realm, a Playwright UI login started from the protected page with preservation of the original request, oauth2-proxy access to the protected service, first-login local-user creation, direct external-token rejection, OIDC discovery/client-secret post, manual OIDC client-secret basic, client-secret JWT, private-key JWT, and SAML. Each successful broker flow asserts a token issued by the local Keycloak realm.
