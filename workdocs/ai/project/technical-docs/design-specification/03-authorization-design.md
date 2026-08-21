# 03 — Authorization & Identity Design

**Source specifications:** [DECAF-33](../specifications/DECAF_33.md), [DECAF-43](../specifications/DECAF_43.md); `@allowIf`/`@blockIf` and `DecafAuthModule` from [DECAF-10](../specifications/DECAF_10.md).

## 1. Overview

Two complementary layers compose (not compete): DECAF-43 provisions and brokers identity (local Keycloak is the sole trusted issuer); DECAF-33 decisions authorization against a domain-neutral org/tenant/principal/permission model. They meet at `KeycloakAuthHandler`.

## 2. Goals

- G1 — Domain-neutral org-based authorization (no product-specific concepts).
- G2 — Postgres source of truth with RLS; Arango/Qdrant payload filters; never bypass `AuthzService` contexts.
- G3 — Effective-permission materialization supporting org hierarchy with inheritance blocks and time windows.
- G4 — Identity brokering (OIDC + SAML) with a strict trust boundary: only local-issuer tokens accepted.

## 3. Requirements

- **Req-1 (DECAF-33):** Neutral models — `Tenant`, `OrgUnit` (+closure), `User`, `Group`, `Principal`, `TenantMembership`, `OrgUnitMembership`, `Permission`, `Role`, `RolePermission`, `RoleAssignment`, `InheritanceBlock`, `ProtectedResource`, `ResourceGrant`, `EffectivePermission`, `StorageBinding`. Product-specific concepts (`tenantKind`, `userKind`, `isFamily`, …) forbidden.
- **Req-2 (DECAF-33):** `AuthzService.canAccess(input)` visibility ladder: deny tenant mismatch → allow owner → allow explicit time-valid grant → visibility ladder (`private`/`resource_acl`/`org_unit`/`org_subtree`/`tenant`) → scope-direct `EffectivePermission.hasPermission`.
- **Req-3 (DECAF-33):** `EffectivePermissionService.rebuildForPrincipal(tenantId, principalId)` — 10-step algorithm (delete → direct assignments → group memberships → RolePermissions → tenant/resource/org-unit materialization → `inheritDown` expand via `org_unit_closure` → skip `InheritanceBlock`-blocked descendants → preserve time windows). Background rebuild support required after bulk changes.
- **Req-4 (DECAF-33):** Postgres RLS on protected tables reading `effective_permissions` with session settings `app.tenant_id`/`app.principal_id` set only in trusted transactions. Arango vertex/edge and Qdrant point payloads must include `tenant_id`/`org_unit_id`/`protected_resource_id`/`owner_principal_id`/`visibility`/`sensitivity`; Arango/Qdrant integrations always consume `AuthzService` contexts.
- **Req-5 (DECAF-33):** `@namespace(...)` (reuses `@role()` contract) + `@hideFor`/`@showFor` UI visibility; `KeycloakAuthHandler` recognizes namespace-scoped roles and translates to Decaf auth data shape.
- **Req-6 (DECAF-43):** `KeycloakIdentityProviderService` registers/manages external brokers; `KeycloakBrokerSetupConfig` separate from `KeycloakSetupConfig` (OIDC/SAML, client auth methods, callback URIs, claim/role/group/attribute mapping, first-broker-login/account-linking policy). Local Keycloak creates/links local user (stable identity = upstream issuer + subject, not email). Protected service accepts only local token; external tokens rejected. Live end-to-end HTTP flows (no token mocks).

## 4. Architecture & Design

See [Architecture Workbook §04](../architecture-workbook/04-authorization.md). Key decisions:

- **Complementary layers, not competing** — DECAF-43 owns identity provisioning/brokering; DECAF-33 owns authorization decisioning. The trust boundary is the local Keycloak issuer.
- **Effective permissions are materialized**, not computed on every check — `rebuildForPrincipal` produces the `effective_permissions` table that RLS and `AuthzService` read.
- **Stable identity from upstream issuer + subject** (not email), since email is only a profile attribute.

### Brokered login + authorization decision

```mermaid
sequenceDiagram
    participant U as User
    participant App as Protected app
    participant LK as Local Keycloak
    participant EK as External Keycloak
    participant S as Service
    participant KH as KeycloakAuthHandler
    participant Authz as AuthzService
    participant EP as EffectivePermission
    U->>App: hit protected route
    App->>LK: redirect -> EK -> authenticate -> broker callback
    LK->>U: issue LOCAL token (create/link user)
    U->>S: request with local token
    S->>KH: verify local token; extract namespace roles
    KH->>Authz: translate to Decaf auth data
    Authz->>EP: canAccess (visibility ladder + scope-direct)
    EP-->>Authz: allow/deny
    Authz-->>S: decision
```

## 5. Public Interfaces (selected)

- `AuthzService.canAccess(input: CanAccessInput): Promise<boolean>` / `requireAccess(...)` / `buildAccessContext(...)` / `buildArangoContext(...)` / `buildQdrantFilter(...)`.
- `EffectivePermissionService.rebuildForPrincipal(tenantId, principalId)` / `rebuildForTenant(...)` / `hasPermission(...)`.
- `BootstrapService.bootstrapTenantFromTemplate(template)`; `SystemManagementService.onboardUserToTenantAndOrgUnit(...)` / `changeUserOrgRole(...)` / `suspendUserInTenant(...)` / `reactivateUserInTenant(...)`.
- `@namespace(...)`; `@hideFor`/`@showFor`.
- `KeycloakBrokerSetupConfig`; `KeycloakIdentityProviderService`.

## 6. Open Questions / Risks

- Two `keycloakAuthHandler.ts` locations must reconcile (B9): DECAF-43 `integrations/src/nest/` vs DECAF-33 `src/nest/`.
- TypeORM column naming may differ from logical names in SQL examples — migrations must align with generated names.
- RLS depends on trusted-transaction session settings — must only be set in trusted code paths.
- Effective-permission rebuilds expensive for large org trees — background rebuild required.
- `@allowIf`/`@blockIf` vs `AuthzService` relationship unstated (B10).

Continue to [04 — Task Engine Design](./04-task-engine-design.md).
