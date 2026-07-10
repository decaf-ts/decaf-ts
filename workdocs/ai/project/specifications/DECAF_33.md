# DECAF-33: Decaf-TS Org-Based Authorization System

**Status:** Completed
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
This specification defines a domain-neutral org-based authorization system for Decaf-TS.
It covers base authorization, tenancy, org hierarchy, resource access, storage bindings, namespace-scoped roles, Keycloak auth integration, and `ModelService`-backed authorization services.

The design intentionally avoids product-specific concepts such as `tenantKind`, `userKind`, `requiresGuardianConsent`, or approval/request workflows. Instead, it models authorization with tenants, org units, users, principals, memberships, roles, permissions, grants, and effective permissions.

### 1.1 Version and Scope

* **Version:** `1.0`
* **Scope:** base authorization, tenancy, org hierarchy, resource access, storage bindings, namespace-scoped roles, Keycloak auth integration, and ModelServices

### 1.2 Verified technology assumptions

Use these APIs and conventions:

* Decaf core provides model persistence primitives such as `@table`, `@pk`, `@column`, `@unique`, relation decorators, `Repository`, and `ModelService`.
* Decaf decorator-validation provides runtime validation decorators such as `@model`, `@required`, `@option`, and `@type`.
* `@decaf-ts/for-typeorm` mirrors TypeORM metadata for table, column, primary key, timestamp, and relation decorators.
* TypeORM creates foreign keys for relation decorators such as `ManyToOne` and `OneToOne`.
* Keep Postgres RLS, recursive closure-table triggers, partial/composite indexes, JSONB indexes, and other advanced database controls in migrations outside Decaf model decorators.
* Namespace authorization can reuse the `@role()` contract through a dedicated `@namespace(...)` decorator, and the Keycloak auth handler must understand those namespace roles.
* UI visibility wrappers must be able to reuse `@hideOn`/`renderIf` patterns and namespace-aware `@hideFor`/`showFor` controls.
* for-nest must remain compatible with the new namespace auth metadata and the visibility wrapper flow.

## 2. Goals

* Define a domain-neutral base authorization model.
* Support tenant isolation and org-unit hierarchy.
* Support principals, memberships, roles, permissions, grants, and effective permissions.
* Support resource visibility and explicit resource grants.
* Support storage bindings for Postgres, Arango, Qdrant, and object storage.
* Support namespace-scoped authorization by reusing the existing `@role()` contract through a new `@namespace(...)` decorator.
* Support Keycloak auth handling that can recognize namespace-scoped roles and translate them into Decaf authorization data.
* Support authorization segregation by nested org depth and by individual user identity.
* Support UI visibility wrappers that can drive namespace-based show/hide logic using `@hideOn`/`renderIf` and `@hideFor`/`showFor`.
* Preserve for-nest compatibility so server-side route, model, and documentation flows can consume the new auth metadata.
* Define repository-backed service contracts for authorization workflows.
* Define external SQL enforcement points for constraints, RLS, and indexes.
* Define Arango and Qdrant authorization payload filters.

## 3. User Stories / Requirements

### 3.1 Core reasoning and invariants

#### Base model must be domain-neutral

Do not encode business-domain assumptions in base auth. The following are forbidden in the base auth model:

```text
Tenant.kind
User.kind
isFamily
isEnterprise
isChild
isEmployee
isGuest
requiresGuardianConsent
```

Instead:

```text
Tenant = isolation boundary
OrgUnit = recursive authorization scope/container
User = identity only
Principal = actor that can receive permissions
Membership = placement into tenant/org unit/group
RoleAssignment = authority at scope
InheritanceBlock = explicit boundary that blocks inherited categories
ProtectedResource = object being accessed
ResourceGrant = explicit exception/share
EffectivePermission = materialized result used by runtime checks
Profile = descriptive/template metadata only
```

#### Users are not physically owned by org units

A user is identity-only. A user can belong to many tenants and many org units through memberships. Roles define what the user means in that context.

Example:

```text
Same user:
  Tenant A: Legal reviewer
  Tenant B: Household guardian
  Tenant C: Guest contractor
```

Do not model this with `User.kind`. Model it with memberships and role assignments.

#### Parent visibility

A role assigned to an org unit may inherit to descendants when `inheritDown = true`. A descendant can block inherited permission categories through `InheritanceBlock`.

Administrative access and data visibility are separate permissions.

```text
Parent can manage children only if it has admin permissions.
Parent can read child content only if it has content-read permissions and no inheritance block applies.
```

#### Runtime access rule

A principal can perform action `P` on resource `R` only if:

```text
1. principal belongs to the same tenant as R
2. direct resource grant allows P, or effective permission allows P at the resource scope
3. resource visibility allows this mode of access
4. inherited permission is not blocked by InheritanceBlock
5. time windows and conditions pass
6. access is logged by the caller/audit layer
```

#### Segregation granularity

Authorization must be granular enough to separate access by:

* any nested org level, including direct child, descendant, subtree, and tenant-wide inheritance boundaries
* a single user identity, even when the surrounding org structure is shared

Namespace-scoped enforcement must therefore support both hierarchical inheritance and direct user-level exceptions without collapsing the tree into a single coarse tenant rule.

#### Namespace decorator contract

The existing `@role()` contract must be reusable for namespace enforcement through a new `@namespace(...)` decorator.

That decorator should apply the same enforcement logic as role-based checks while attaching namespace-aware metadata that downstream services and auth handlers can consume.

#### Keycloak auth translation

The existing `KeycloakAuthHandler` must recognize namespace-scoped roles in addition to the current role extraction flow.

It should translate those roles into the same Decaf auth data shape used by the namespace authorization services so route-level and model-level checks remain consistent.

#### UI visibility wrappers

Namespace authorization must also expose UI visibility wrappers that can be used to control rendering by namespace.

The wrappers should reuse the existing `@hideOn` / `renderIf` style behavior where applicable and provide namespace-aware `@hideFor` / `showFor` semantics for screens that need to hide or reveal fields and components based on namespace membership or scope.

#### for-nest compatibility

The namespace auth system must remain compatible with `for-nest` so server-side controllers, guards, and documentation flows can consume the new namespace metadata without bespoke adapter code.

That includes preserving the ability to resolve auth context from Keycloak payloads, project namespace-aware role metadata into route checks, and keep visibility semantics aligned between server rendering and model metadata.

#### Database split

Postgres:

* Source of truth for tenants, org units, users, principals, roles, permissions, memberships, grants, effective permissions, storage bindings, and metadata.
* Enforce simple relations via Decaf/TypeORM relations.
* Enforce RLS and advanced constraints via migrations.

Arango:

* Tenant graph database or tenant-scoped graph collections.
* Always filter traversals by `tenant_id`, allowed org unit IDs, visibility, sensitivity, and allowed resource IDs.

Qdrant:

* Shared collections by model or data class by default.
* Payload must include tenant/org/resource metadata.
* Search must always include authorization payload filters.

## 4. Architecture & Design

### 4.1 Package layout

```text
src/
  models/
    enums.ts
    relation-policies.ts
    tenant.model.ts
    tenant-profile.model.ts
    org-unit.model.ts
    org-unit-profile.model.ts
    org-unit-closure.model.ts
    user.model.ts
    group.model.ts
    principal.model.ts
    membership.model.ts
    group-membership.model.ts
    permission.model.ts
    role.model.ts
    role-permission.model.ts
    role-assignment.model.ts
    inheritance-block.model.ts
    protected-resource.model.ts
    resource-grant.model.ts
    effective-permission.model.ts
    storage-binding.model.ts
    index.ts
  services/
    types.ts
    base-model.service.ts
    tenant.service.ts
    org-unit.service.ts
    user-group-principal.service.ts
    role-permission.service.ts
    assignment-effective-permission.service.ts
    resource.service.ts
    authz.service.ts
    storage-binding.service.ts
    bootstrap.service.ts
    system-management.service.ts
    index.ts
  nest/
    keycloakAuthHandler.ts
  ui/
    namespace-visibility.ts
sql/
  001_constraints.sql
  002_rls.sql
  003_indexes.sql
```

### 4.2 Models

#### `src/models/enums.ts`

```ts
export enum IsolationTier {
  Pooled = "pooled",
  Bridge = "bridge",
  Silo = "silo",
}

export enum MembershipStatus {
  Invited = "invited",
  Active = "active",
  Suspended = "suspended",
  Removed = "removed",
}

export enum PrincipalKind {
  User = "user",
  Group = "group",
  ServiceAccount = "service_account",
  Agent = "agent",
  ApiKey = "api_key",
}

export enum ScopeKind {
  Tenant = "tenant",
  OrgUnit = "org_unit",
  Resource = "resource",
}

export enum PermissionCategory {
  Admin = "admin",
  ContentRead = "content_read",
  ContentWrite = "content_write",
  Memory = "memory",
  Graph = "graph",
  Vector = "vector",
  Export = "export",
  Billing = "billing",
  Audit = "audit",
  Security = "security",
  Data = "data",
  Automation = "automation",
}

export enum ResourceVisibility {
  Private = "private",
  ResourceAcl = "resource_acl",
  OrgUnit = "org_unit",
  OrgSubtree = "org_subtree",
  Tenant = "tenant",
}

export enum StorageKind {
  Postgres = "postgres",
  Arango = "arango",
  Qdrant = "qdrant",
  ObjectStorage = "object_storage",
}

export enum StorageBindingKind {
  Shared = "shared",
  Dedicated = "dedicated",
}

export const IsolationTierOptions = Object.values(IsolationTier);
export const MembershipStatusOptions = Object.values(MembershipStatus);
export const PrincipalKindOptions = Object.values(PrincipalKind);
export const ScopeKindOptions = Object.values(ScopeKind);
export const PermissionCategoryOptions = Object.values(PermissionCategory);
export const ResourceVisibilityOptions = Object.values(ResourceVisibility);
export const StorageKindOptions = Object.values(StorageKind);
export const StorageBindingKindOptions = Object.values(StorageBindingKind);
```

#### `src/models/relation-policies.ts`

```ts
export const REL_RESTRICT = {
  cascade: false,
  onDelete: "RESTRICT",
  nullable: false,
} as const;

export const REL_NULLIFY = {
  cascade: false,
  onDelete: "SET NULL",
  nullable: true,
} as const;

export const REL_CASCADE_DEPENDENT = {
  cascade: false,
  onDelete: "CASCADE",
  nullable: false,
} as const;

export const REL_CASCADE_INSERT_UPDATE = {
  cascade: ["insert", "update"],
  onDelete: "RESTRICT",
  nullable: false,
} as const;
```

#### Model code

```ts
// src/models/tenant.model.ts
import { table, pk, column, unique, createdAt, updatedAt, oneToMany } from "@decaf-ts/core";
import { model, required, type as typeOf, option } from "@decaf-ts/decorator-validation";
import { IsolationTier, IsolationTierOptions } from "./enums";
import { OrgUnit } from "./org-unit.model";
import { TenantMembership } from "./membership.model";
import { Principal } from "./principal.model";
import { StorageBinding } from "./storage-binding.model";
import { REL_RESTRICT } from "./relation-policies";

@table("tenants")
@model()
export class Tenant {
  @pk({ type: String }) id!: string;
  @unique() @required() @typeOf(String) @column() slug!: string;
  @required() @typeOf(String) @column() name!: string;
  @required() @typeOf(String) @option(IsolationTierOptions) @column() isolationTier!: IsolationTier;
  @oneToMany(() => OrgUnit, REL_RESTRICT, false) orgUnits?: OrgUnit[] | string[];
  @oneToMany(() => TenantMembership, REL_RESTRICT, false) memberships?: TenantMembership[] | string[];
  @oneToMany(() => Principal, REL_RESTRICT, false) principals?: Principal[] | string[];
  @oneToMany(() => StorageBinding, REL_RESTRICT, false) storageBindings?: StorageBinding[] | string[];
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/tenant-profile.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { REL_CASCADE_DEPENDENT } from "./relation-policies";

@table("tenant_profiles")
@model()
export class TenantProfile {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_tenant_profiles_tenant") @required() tenant!: Tenant | string;
  @required() @typeOf(String) @column() profileKey!: string;
  @typeOf(Object) @column() metadata?: Record<string, unknown>;
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/org-unit.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne, oneToMany } from "@decaf-ts/core";
import { model, required, type as typeOf } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { OrgUnitMembership } from "./membership.model";
import { OrgUnitClosure } from "./org-unit-closure.model";
import { ProtectedResource } from "./protected-resource.model";
import { InheritanceBlock } from "./inheritance-block.model";
import { REL_RESTRICT } from "./relation-policies";

@table("org_units")
@model()
export class OrgUnit {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_RESTRICT, false, undefined, "fk_org_units_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => OrgUnit, REL_RESTRICT, false, undefined, "fk_org_units_parent") parent?: OrgUnit | string;
  @oneToMany(() => OrgUnit, REL_RESTRICT, false) children?: OrgUnit[] | string[];
  @required() @typeOf(String) @column() name!: string;
  @required() @typeOf(String) @column() path!: string;
  @typeOf(Object) @column() metadata?: Record<string, unknown>;
  @oneToMany(() => OrgUnitMembership, REL_RESTRICT, false) memberships?: OrgUnitMembership[] | string[];
  @oneToMany(() => ProtectedResource, REL_RESTRICT, false) resources?: ProtectedResource[] | string[];
  @oneToMany(() => InheritanceBlock, REL_RESTRICT, false) inheritanceBlocks?: InheritanceBlock[] | string[];
  @oneToMany(() => OrgUnitClosure, REL_RESTRICT, false) ancestorLinks?: OrgUnitClosure[] | string[];
  @oneToMany(() => OrgUnitClosure, REL_RESTRICT, false) descendantLinks?: OrgUnitClosure[] | string[];
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/org-unit-profile.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf } from "@decaf-ts/decorator-validation";
import { OrgUnit } from "./org-unit.model";
import { REL_CASCADE_DEPENDENT } from "./relation-policies";

@table("org_unit_profiles")
@model()
export class OrgUnitProfile {
  @pk({ type: String }) id!: string;
  @manyToOne(() => OrgUnit, REL_CASCADE_DEPENDENT, false, undefined, "fk_org_unit_profiles_org_unit") @required() orgUnit!: OrgUnit | string;
  @required() @typeOf(String) @column() profileKey!: string;
  @typeOf(Object) @column() metadata?: Record<string, unknown>;
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/org-unit-closure.model.ts
import { table, pk, column, createdAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { OrgUnit } from "./org-unit.model";
import { REL_CASCADE_DEPENDENT } from "./relation-policies";

@table("org_unit_closure")
@model()
export class OrgUnitClosure {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_org_closure_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => OrgUnit, REL_CASCADE_DEPENDENT, false, undefined, "fk_org_closure_ancestor") @required() ancestor!: OrgUnit | string;
  @manyToOne(() => OrgUnit, REL_CASCADE_DEPENDENT, false, undefined, "fk_org_closure_descendant") @required() descendant!: OrgUnit | string;
  @required() @typeOf(Number) @column() depth!: number;
  @createdAt() createdAt!: Date;
}
```

```ts
// src/models/user.model.ts
import { table, pk, column, unique, createdAt, updatedAt, oneToMany } from "@decaf-ts/core";
import { model, required, type as typeOf } from "@decaf-ts/decorator-validation";
import { TenantMembership, OrgUnitMembership } from "./membership.model";
import { REL_RESTRICT } from "./relation-policies";

@table("users")
@model()
export class User {
  @pk({ type: String }) id!: string;
  @unique() @typeOf(String) @column() email?: string;
  @unique() @typeOf(String) @column() phone?: string;
  @required() @typeOf(String) @column() displayName!: string;
  @oneToMany(() => TenantMembership, REL_RESTRICT, false) tenantMemberships?: TenantMembership[] | string[];
  @oneToMany(() => OrgUnitMembership, REL_RESTRICT, false) orgUnitMemberships?: OrgUnitMembership[] | string[];
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/group.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne, oneToMany } from "@decaf-ts/core";
import { model, required, type as typeOf } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { OrgUnit } from "./org-unit.model";
import { GroupMembership } from "./group-membership.model";
import { REL_RESTRICT, REL_NULLIFY } from "./relation-policies";

@table("groups")
@model()
export class Group {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_RESTRICT, false, undefined, "fk_groups_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => OrgUnit, REL_NULLIFY, false, undefined, "fk_groups_org_unit") orgUnit?: OrgUnit | string;
  @required() @typeOf(String) @column() name!: string;
  @typeOf(Object) @column() metadata?: Record<string, unknown>;
  @oneToMany(() => GroupMembership, REL_RESTRICT, false) members?: GroupMembership[] | string[];
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/principal.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne, oneToMany } from "@decaf-ts/core";
import { model, required, type as typeOf, option } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { RoleAssignment } from "./role-assignment.model";
import { ResourceGrant } from "./resource-grant.model";
import { PrincipalKind, PrincipalKindOptions } from "./enums";
import { REL_RESTRICT } from "./relation-policies";

@table("principals")
@model()
export class Principal {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_RESTRICT, false, undefined, "fk_principals_tenant") @required() tenant!: Tenant | string;
  @required() @typeOf(String) @option(PrincipalKindOptions) @column() kind!: PrincipalKind;
  @required() @typeOf(String) @column() subjectId!: string;
  @oneToMany(() => RoleAssignment, REL_RESTRICT, false) roleAssignments?: RoleAssignment[] | string[];
  @oneToMany(() => ResourceGrant, REL_RESTRICT, false) resourceGrants?: ResourceGrant[] | string[];
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/membership.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf, option } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { OrgUnit } from "./org-unit.model";
import { User } from "./user.model";
import { MembershipStatus, MembershipStatusOptions } from "./enums";
import { REL_CASCADE_DEPENDENT, REL_RESTRICT } from "./relation-policies";

@table("tenant_memberships")
@model()
export class TenantMembership {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_tenant_memberships_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => User, REL_CASCADE_DEPENDENT, false, undefined, "fk_tenant_memberships_user") @required() user!: User | string;
  @required() @typeOf(String) @option(MembershipStatusOptions) @column() status!: MembershipStatus;
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}

@table("org_unit_memberships")
@model()
export class OrgUnitMembership {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_org_memberships_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => OrgUnit, REL_CASCADE_DEPENDENT, false, undefined, "fk_org_memberships_org_unit") @required() orgUnit!: OrgUnit | string;
  @manyToOne(() => User, REL_RESTRICT, false, undefined, "fk_org_memberships_user") @required() user!: User | string;
  @required() @typeOf(String) @option(MembershipStatusOptions) @column() status!: MembershipStatus;
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/group-membership.model.ts
import { table, pk, column, createdAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { Group } from "./group.model";
import { Principal } from "./principal.model";
import { REL_CASCADE_DEPENDENT } from "./relation-policies";

@table("group_memberships")
@model()
export class GroupMembership {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_group_memberships_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => Group, REL_CASCADE_DEPENDENT, false, undefined, "fk_group_memberships_group") @required() group!: Group | string;
  @manyToOne(() => Principal, REL_CASCADE_DEPENDENT, false, undefined, "fk_group_memberships_principal") @required() principal!: Principal | string;
  @typeOf(Object) @column() metadata?: Record<string, unknown>;
  @createdAt() createdAt!: Date;
}
```

```ts
// src/models/permission.model.ts
import { table, pk, column, unique, oneToMany } from "@decaf-ts/core";
import { model, required, type as typeOf, option } from "@decaf-ts/decorator-validation";
import { PermissionCategory, PermissionCategoryOptions } from "./enums";
import { RolePermission } from "./role-permission.model";
import { REL_RESTRICT } from "./relation-policies";

@table("permissions")
@model()
export class Permission {
  @pk({ type: String }) id!: string;
  @unique() @required() @typeOf(String) @column() key!: string;
  @required() @typeOf(String) @option(PermissionCategoryOptions) @column() category!: PermissionCategory;
  @typeOf(String) @column() description?: string;
  @oneToMany(() => RolePermission, REL_RESTRICT, false) rolePermissions?: RolePermission[] | string[];
}
```

```ts
// src/models/role.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne, oneToMany } from "@decaf-ts/core";
import { model, required, type as typeOf } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { RolePermission } from "./role-permission.model";
import { RoleAssignment } from "./role-assignment.model";
import { REL_NULLIFY, REL_RESTRICT } from "./relation-policies";

@table("roles")
@model()
export class Role {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_NULLIFY, false, undefined, "fk_roles_tenant") tenant?: Tenant | string;
  @required() @typeOf(String) @column() key!: string;
  @required() @typeOf(String) @column() name!: string;
  @typeOf(String) @column() description?: string;
  @typeOf(Object) @column() metadata?: Record<string, unknown>;
  @oneToMany(() => RolePermission, REL_RESTRICT, false) rolePermissions?: RolePermission[] | string[];
  @oneToMany(() => RoleAssignment, REL_RESTRICT, false) assignments?: RoleAssignment[] | string[];
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/role-permission.model.ts
import { table, pk, createdAt, manyToOne } from "@decaf-ts/core";
import { model, required } from "@decaf-ts/decorator-validation";
import { Role } from "./role.model";
import { Permission } from "./permission.model";
import { REL_CASCADE_DEPENDENT } from "./relation-policies";

@table("role_permissions")
@model()
export class RolePermission {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Role, REL_CASCADE_DEPENDENT, false, undefined, "fk_role_permissions_role") @required() role!: Role | string;
  @manyToOne(() => Permission, REL_CASCADE_DEPENDENT, false, undefined, "fk_role_permissions_permission") @required() permission!: Permission | string;
  @createdAt() createdAt!: Date;
}
```

```ts
// src/models/role-assignment.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf, option } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { Principal } from "./principal.model";
import { Role } from "./role.model";
import { ScopeKind, ScopeKindOptions } from "./enums";
import { REL_CASCADE_DEPENDENT, REL_RESTRICT } from "./relation-policies";

@table("role_assignments")
@model()
export class RoleAssignment {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_role_assignments_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => Principal, REL_CASCADE_DEPENDENT, false, undefined, "fk_role_assignments_principal") @required() principal!: Principal | string;
  @manyToOne(() => Role, REL_RESTRICT, false, undefined, "fk_role_assignments_role") @required() role!: Role | string;
  @required() @typeOf(String) @option(ScopeKindOptions) @column() scopeKind!: ScopeKind;
  @required() @typeOf(String) @column() scopeId!: string;
  @required() @typeOf(Boolean) @column() inheritDown!: boolean;
  @column() startsAt?: Date;
  @column() expiresAt?: Date;
  @typeOf(Object) @column() conditions?: Record<string, unknown>;
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/inheritance-block.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf, option } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { OrgUnit } from "./org-unit.model";
import { PermissionCategory, PermissionCategoryOptions } from "./enums";
import { REL_CASCADE_DEPENDENT, REL_NULLIFY } from "./relation-policies";

@table("inheritance_blocks")
@model()
export class InheritanceBlock {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_inheritance_blocks_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => OrgUnit, REL_CASCADE_DEPENDENT, false, undefined, "fk_inheritance_blocks_org_unit") @required() orgUnit!: OrgUnit | string;
  @manyToOne(() => OrgUnit, REL_NULLIFY, false, undefined, "fk_inheritance_blocks_blocked_ancestor") blockedFromAncestor?: OrgUnit | string;
  @required() @typeOf(String) @option(PermissionCategoryOptions) @column() permissionCategory!: PermissionCategory;
  @typeOf(String) @column() reason?: string;
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/protected-resource.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne, oneToMany } from "@decaf-ts/core";
import { model, required, type as typeOf, option } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { OrgUnit } from "./org-unit.model";
import { Principal } from "./principal.model";
import { ResourceGrant } from "./resource-grant.model";
import { ResourceVisibility, ResourceVisibilityOptions } from "./enums";
import { REL_RESTRICT, REL_NULLIFY } from "./relation-policies";

@table("protected_resources")
@model()
export class ProtectedResource {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_RESTRICT, false, undefined, "fk_protected_resources_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => OrgUnit, REL_RESTRICT, false, undefined, "fk_protected_resources_org_unit") @required() orgUnit!: OrgUnit | string;
  @required() @typeOf(String) @column() resourceType!: string;
  @required() @typeOf(String) @column() resourceId!: string;
  @required() @typeOf(String) @option(ResourceVisibilityOptions) @column() visibility!: ResourceVisibility;
  @manyToOne(() => Principal, REL_NULLIFY, false, undefined, "fk_protected_resources_owner") owner?: Principal | string;
  @typeOf(String) @column() sensitivity?: string;
  @typeOf(Object) @column() metadata?: Record<string, unknown>;
  @oneToMany(() => ResourceGrant, REL_RESTRICT, false) grants?: ResourceGrant[] | string[];
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/resource-grant.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { Principal } from "./principal.model";
import { ProtectedResource } from "./protected-resource.model";
import { REL_CASCADE_DEPENDENT, REL_RESTRICT } from "./relation-policies";

@table("resource_grants")
@model()
export class ResourceGrant {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_resource_grants_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => ProtectedResource, REL_CASCADE_DEPENDENT, false, undefined, "fk_resource_grants_resource") @required() resource!: ProtectedResource | string;
  @manyToOne(() => Principal, REL_CASCADE_DEPENDENT, false, undefined, "fk_resource_grants_principal") @required() principal!: Principal | string;
  @required() @typeOf(String) @column() permissionKey!: string;
  @column() startsAt?: Date;
  @column() expiresAt?: Date;
  @typeOf(Object) @column() conditions?: Record<string, unknown>;
  @manyToOne(() => Principal, REL_RESTRICT, false, undefined, "fk_resource_grants_created_by") createdBy?: Principal | string;
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/effective-permission.model.ts
import { table, pk, column, createdAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf, option } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { Principal } from "./principal.model";
import { ScopeKind, ScopeKindOptions } from "./enums";
import { REL_CASCADE_DEPENDENT } from "./relation-policies";

@table("effective_permissions")
@model()
export class EffectivePermission {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_effective_permissions_tenant") @required() tenant!: Tenant | string;
  @manyToOne(() => Principal, REL_CASCADE_DEPENDENT, false, undefined, "fk_effective_permissions_principal") @required() principal!: Principal | string;
  @required() @typeOf(String) @column() permissionKey!: string;
  @required() @typeOf(String) @option(ScopeKindOptions) @column() scopeKind!: ScopeKind;
  @required() @typeOf(String) @column() scopeId!: string;
  @required() @typeOf(String) @column() sourceKind!: string;
  @required() @typeOf(String) @column() sourceId!: string;
  @column() startsAt?: Date;
  @column() expiresAt?: Date;
  @createdAt() createdAt!: Date;
}
```

```ts
// src/models/storage-binding.model.ts
import { table, pk, column, createdAt, updatedAt, manyToOne } from "@decaf-ts/core";
import { model, required, type as typeOf, option } from "@decaf-ts/decorator-validation";
import { Tenant } from "./tenant.model";
import { StorageKind, StorageKindOptions, StorageBindingKind, StorageBindingKindOptions } from "./enums";
import { REL_CASCADE_DEPENDENT } from "./relation-policies";

@table("storage_bindings")
@model()
export class StorageBinding {
  @pk({ type: String }) id!: string;
  @manyToOne(() => Tenant, REL_CASCADE_DEPENDENT, false, undefined, "fk_storage_bindings_tenant") @required() tenant!: Tenant | string;
  @required() @typeOf(String) @option(StorageKindOptions) @column() storageKind!: StorageKind;
  @required() @typeOf(String) @option(StorageBindingKindOptions) @column() bindingKind!: StorageBindingKind;
  @required() @typeOf(String) @column() bindingKey!: string;
  @required() @typeOf(String) @column() region!: string;
  @typeOf(Object) @column() config?: Record<string, unknown>;
  @createdAt() createdAt!: Date;
  @updatedAt() updatedAt!: Date;
}
```

```ts
// src/models/index.ts
export * from "./enums";
export * from "./relation-policies";
export * from "./tenant.model";
export * from "./tenant-profile.model";
export * from "./org-unit.model";
export * from "./org-unit-profile.model";
export * from "./org-unit-closure.model";
export * from "./user.model";
export * from "./group.model";
export * from "./principal.model";
export * from "./membership.model";
export * from "./group-membership.model";
export * from "./permission.model";
export * from "./role.model";
export * from "./role-permission.model";
export * from "./role-assignment.model";
export * from "./inheritance-block.model";
export * from "./protected-resource.model";
export * from "./resource-grant.model";
export * from "./effective-permission.model";
export * from "./storage-binding.model";
```

### 4.3 Services

#### `src/services/types.ts`

```ts
import { PermissionCategory, ResourceVisibility, ScopeKind, StorageBindingKind, StorageKind, IsolationTier, MembershipStatus, PrincipalKind } from "../models";

export type TxArgs = any[];

export interface CreateTenantInput { slug: string; name: string; isolationTier?: IsolationTier; profileKey?: string; profileMetadata?: Record<string, unknown>; }
export interface CreateUserInput { email?: string; phone?: string; displayName: string; }
export interface CreateOrgUnitInput { tenantId: string; parentOrgUnitId?: string; name: string; metadata?: Record<string, unknown>; profileKey?: string; profileMetadata?: Record<string, unknown>; }
export interface CreateRoleInput { tenantId?: string; key: string; name: string; description?: string; metadata?: Record<string, unknown>; }
export interface CreatePermissionInput { key: string; category: PermissionCategory; description?: string; }
export interface AssignRoleInput { tenantId: string; principalId: string; roleId: string; scopeKind: ScopeKind; scopeId: string; inheritDown?: boolean; startsAt?: Date; expiresAt?: Date; conditions?: Record<string, unknown>; }
export interface RegisterResourceInput { tenantId: string; orgUnitId: string; resourceType: string; resourceId: string; visibility: ResourceVisibility; ownerPrincipalId?: string; sensitivity?: string; metadata?: Record<string, unknown>; }
export interface GrantResourceInput { tenantId: string; resourceId: string; principalId: string; permissionKey: string; startsAt?: Date; expiresAt?: Date; conditions?: Record<string, unknown>; createdByPrincipalId?: string; }
export interface CanAccessInput { tenantId: string; principalId: string; permissionKey: string; resourceProtectedId?: string; scopeKind?: ScopeKind; scopeId?: string; at?: Date; }
export interface AccessContext { tenantId: string; principalId: string; permissionsByScope: Record<string, string[]>; allowedOrgUnitIdsByPermission: Record<string, string[]>; resourceGrants: Array<{ resourceId: string; permissionKey: string }>; }
export interface ArangoAuthContext { tenantId: string; principalId: string; permissionKey: string; allowedOrgUnitIds: string[]; allowedResourceIds: string[]; }
export interface QdrantAuthFilter { must: Array<Record<string, unknown>>; must_not?: Array<Record<string, unknown>>; }
export interface CreateStorageBindingInput { tenantId: string; storageKind: StorageKind; bindingKind: StorageBindingKind; bindingKey: string; region: string; config?: Record<string, unknown>; }
export interface BootstrapPermission { key: string; category: PermissionCategory; description?: string; }
export interface BootstrapRole { key: string; name: string; description?: string; permissionKeys: string[]; }
export interface BootstrapOrgUnit { name: string; profileKey?: string; metadata?: Record<string, unknown>; children?: BootstrapOrgUnit[]; }
export interface BootstrapTemplate { tenant: CreateTenantInput; rootOrgUnit: BootstrapOrgUnit; permissions: BootstrapPermission[]; roles: BootstrapRole[]; ownerUser: CreateUserInput; ownerRoleKey: string; }
```

#### `src/services/base-model.service.ts`

```ts
import { ModelService, Repository } from "@decaf-ts/core";

export abstract class BaseModelService<M extends { id: string }> extends ModelService<M, Repository<M, any>> {
  protected constructor(clazz: new () => M) { super(clazz); }
  protected newModel<T>(clazz: new () => T, data: Partial<T>): T { return Object.assign(new clazz(), data); }
  async createOne(data: Partial<M>, ...args: any[]): Promise<M> { return this.repository.create(Object.assign({} as M, data), ...args); }
  async getById(id: string, ...args: any[]): Promise<M> { return this.repository.read(id, ...args); }
  async updateOne(id: string, patch: Partial<M>, ...args: any[]): Promise<M> { const existing = await this.repository.read(id, ...args); return this.repository.update(Object.assign(existing, patch), ...args); }
  async deleteById(id: string, ...args: any[]): Promise<void> { await this.repository.delete(id, ...args); }
  async findOneBy<K extends keyof M & string>(key: K, value: M[K], ...args: any[]): Promise<M> { return this.repository.findOneBy(key, value, ...args); }
  async findManyBy<K extends keyof M & string>(key: K, value: M[K], ...args: any[]): Promise<M[]> { return this.repository.select().where({ [key]: value }).execute(...args); }
  async listAll(...args: any[]): Promise<M[]> { return this.repository.select().execute(...args); }
}

export function id(): string { return crypto.randomUUID(); }
export function relationId(value: string | { id: string }): string { return typeof value === "string" ? value : value.id; }
```

#### Service implementation requirements

The implementation LLM must create the following services and methods exactly. Prefer full implementations using Decaf repositories. Use `@transactional()` on multi-write methods and forward trailing `...args` into nested calls.

##### Tenant services

```ts
export class TenantProfileService extends BaseModelService<TenantProfile> {
  createProfile(tenantId: string, profileKey: string, metadata?: Record<string, unknown>, ...args: any[]): Promise<TenantProfile>;
  listForTenant(tenantId: string, ...args: any[]): Promise<TenantProfile[]>;
  deleteForTenant(tenantId: string, ...args: any[]): Promise<void>;
}

export class TenantService extends BaseModelService<Tenant> {
  createTenant(input: CreateTenantInput, ...args: any[]): Promise<Tenant>;
  getBySlug(slug: string, ...args: any[]): Promise<Tenant>;
  renameTenant(tenantId: string, name: string, ...args: any[]): Promise<Tenant>;
  changeSlug(tenantId: string, slug: string, ...args: any[]): Promise<Tenant>;
  setIsolationTier(tenantId: string, isolationTier: IsolationTier, ...args: any[]): Promise<Tenant>;
  deleteTenantControlled(tenantId: string, ...args: any[]): Promise<void>;
}
```

##### Org unit services

```ts
export class OrgUnitProfileService extends BaseModelService<OrgUnitProfile> {
  createProfile(orgUnitId: string, profileKey: string, metadata?: Record<string, unknown>, ...args: any[]): Promise<OrgUnitProfile>;
  listForOrgUnit(orgUnitId: string, ...args: any[]): Promise<OrgUnitProfile[]>;
}

export class OrgUnitClosureService extends BaseModelService<OrgUnitClosure> {
  listAncestors(tenantId: string, orgUnitId: string, ...args: any[]): Promise<OrgUnitClosure[]>;
  listDescendants(tenantId: string, orgUnitId: string, ...args: any[]): Promise<OrgUnitClosure[]>;
  isAncestorOf(tenantId: string, ancestorOrgUnitId: string, descendantOrgUnitId: string, ...args: any[]): Promise<boolean>;
  createSelfLink(tenantId: string, orgUnitId: string, ...args: any[]): Promise<OrgUnitClosure>;
  insertAncestorLinksForNewChild(tenantId: string, parentOrgUnitId: string, childOrgUnitId: string, ...args: any[]): Promise<void>;
  deleteLinksForSubtree(tenantId: string, orgUnitId: string, ...args: any[]): Promise<void>;
}

export class InheritanceBlockService extends BaseModelService<InheritanceBlock> {
  blockCategory(tenantId: string, orgUnitId: string, permissionCategory: PermissionCategory, blockedFromAncestorId?: string, reason?: string, ...args: any[]): Promise<InheritanceBlock>;
  unblockCategory(blockId: string, ...args: any[]): Promise<void>;
  listForOrgUnit(tenantId: string, orgUnitId: string, ...args: any[]): Promise<InheritanceBlock[]>;
  categoryBlockedForAncestor(tenantId: string, orgUnitId: string, ancestorOrgUnitId: string, category: PermissionCategory, ...args: any[]): Promise<boolean>;
}

export class OrgUnitService extends BaseModelService<OrgUnit> {
  createRoot(tenantId: string, name: string, metadata?: Record<string, unknown>, profileKey?: string, profileMetadata?: Record<string, unknown>, ...args: any[]): Promise<OrgUnit>;
  createChild(input: CreateOrgUnitInput, ...args: any[]): Promise<OrgUnit>;
  listChildren(parentOrgUnitId: string, ...args: any[]): Promise<OrgUnit[]>;
  listTenantOrgUnits(tenantId: string, ...args: any[]): Promise<OrgUnit[]>;
  listDescendantOrgUnits(tenantId: string, orgUnitId: string, includeSelf?: boolean, ...args: any[]): Promise<OrgUnit[]>;
  listAncestorOrgUnits(tenantId: string, orgUnitId: string, includeSelf?: boolean, ...args: any[]): Promise<OrgUnit[]>;
  renameOrgUnit(orgUnitId: string, name: string, ...args: any[]): Promise<OrgUnit>;
  moveOrgUnit(tenantId: string, orgUnitId: string, newParentOrgUnitId: string, ...args: any[]): Promise<OrgUnit>;
  rebuildTenantClosure(tenantId: string, ...args: any[]): Promise<void>;
  deleteOrgUnitTree(tenantId: string, orgUnitId: string, ...args: any[]): Promise<void>;
}
```

##### User, group, and principal services

```ts
export class UserService extends BaseModelService<User> {
  createUser(input: CreateUserInput, ...args: any[]): Promise<User>;
  getByEmail(email: string, ...args: any[]): Promise<User>;
  updateDisplayName(userId: string, displayName: string, ...args: any[]): Promise<User>;
  updateEmail(userId: string, email: string | undefined, ...args: any[]): Promise<User>;
  updatePhone(userId: string, phone: string | undefined, ...args: any[]): Promise<User>;
}

export class PrincipalService extends BaseModelService<Principal> {
  createPrincipal(tenantId: string, kind: PrincipalKind, subjectId: string, ...args: any[]): Promise<Principal>;
  getForSubject(tenantId: string, kind: PrincipalKind, subjectId: string, ...args: any[]): Promise<Principal | undefined>;
  getOrCreateForSubject(tenantId: string, kind: PrincipalKind, subjectId: string, ...args: any[]): Promise<Principal>;
  getUserPrincipal(tenantId: string, userId: string, ...args: any[]): Promise<Principal>;
  getGroupPrincipal(tenantId: string, groupId: string, ...args: any[]): Promise<Principal>;
}

export class TenantMembershipService extends BaseModelService<TenantMembership> {
  addUserToTenant(tenantId: string, userId: string, status?: MembershipStatus, ...args: any[]): Promise<TenantMembership>;
  setStatus(membershipId: string, status: MembershipStatus, ...args: any[]): Promise<TenantMembership>;
  listUserTenants(userId: string, ...args: any[]): Promise<TenantMembership[]>;
  listTenantUsers(tenantId: string, ...args: any[]): Promise<TenantMembership[]>;
  removeUserFromTenant(membershipId: string, ...args: any[]): Promise<void>;
}

export class OrgUnitMembershipService extends BaseModelService<OrgUnitMembership> {
  addUserToOrgUnit(tenantId: string, orgUnitId: string, userId: string, status?: MembershipStatus, ...args: any[]): Promise<OrgUnitMembership>;
  setStatus(membershipId: string, status: MembershipStatus, ...args: any[]): Promise<OrgUnitMembership>;
  listUserOrgUnits(userId: string, ...args: any[]): Promise<OrgUnitMembership[]>;
  listOrgUnitUsers(orgUnitId: string, ...args: any[]): Promise<OrgUnitMembership[]>;
  removeUserFromOrgUnit(membershipId: string, ...args: any[]): Promise<void>;
}

export class GroupService extends BaseModelService<Group> {
  createGroup(tenantId: string, name: string, orgUnitId?: string, metadata?: Record<string, unknown>, ...args: any[]): Promise<Group>;
  renameGroup(groupId: string, name: string, ...args: any[]): Promise<Group>;
  moveGroupToOrgUnit(groupId: string, orgUnitId: string | undefined, ...args: any[]): Promise<Group>;
  listTenantGroups(tenantId: string, ...args: any[]): Promise<Group[]>;
}

export class GroupMembershipService extends BaseModelService<GroupMembership> {
  addPrincipalToGroup(tenantId: string, groupId: string, principalId: string, metadata?: Record<string, unknown>, ...args: any[]): Promise<GroupMembership>;
  listGroupMembers(groupId: string, ...args: any[]): Promise<GroupMembership[]>;
  listPrincipalGroups(principalId: string, ...args: any[]): Promise<GroupMembership[]>;
  removePrincipalFromGroup(membershipId: string, ...args: any[]): Promise<void>;
  resolveGroupPrincipalIdsForPrincipal(principalId: string, ...args: any[]): Promise<string[]>;
}
```

##### Role and permission services

```ts
export class PermissionService extends BaseModelService<Permission> {
  createPermission(input: CreatePermissionInput, ...args: any[]): Promise<Permission>;
  getByKey(key: string, ...args: any[]): Promise<Permission>;
  listByCategory(category: PermissionCategory, ...args: any[]): Promise<Permission[]>;
  updateDescription(permissionId: string, description: string | undefined, ...args: any[]): Promise<Permission>;
}

export class RoleService extends BaseModelService<Role> {
  createRole(input: CreateRoleInput, ...args: any[]): Promise<Role>;
  getSystemRoleByKey(key: string, ...args: any[]): Promise<Role>;
  getTenantRoleByKey(tenantId: string, key: string, ...args: any[]): Promise<Role>;
  renameRole(roleId: string, name: string, ...args: any[]): Promise<Role>;
  updateRoleMetadata(roleId: string, metadata: Record<string, unknown> | undefined, ...args: any[]): Promise<Role>;
  listTenantRoles(tenantId: string, includeSystem?: boolean, ...args: any[]): Promise<Role[]>;
}

export class RolePermissionService extends BaseModelService<RolePermission> {
  addPermissionToRole(roleId: string, permissionId: string, ...args: any[]): Promise<RolePermission>;
  addPermissionKeyToRole(roleId: string, permissionKey: string, ...args: any[]): Promise<RolePermission>;
  removePermissionFromRole(rolePermissionId: string, ...args: any[]): Promise<void>;
  listRolePermissions(roleId: string, ...args: any[]): Promise<RolePermission[]>;
  listPermissionRoles(permissionId: string, ...args: any[]): Promise<RolePermission[]>;
  replaceRolePermissions(roleId: string, permissionIds: string[], ...args: any[]): Promise<RolePermission[]>;
  createRoleWithPermissions(input: CreateRoleInput, permissionKeys: string[], ...args: any[]): Promise<Role>;
}
```

##### Assignment and effective permission services

```ts
export class RoleAssignmentService extends BaseModelService<RoleAssignment> {
  assignRole(input: AssignRoleInput, ...args: any[]): Promise<RoleAssignment>;
  revokeAssignment(assignmentId: string, ...args: any[]): Promise<void>;
  listPrincipalAssignments(tenantId: string, principalId: string, ...args: any[]): Promise<RoleAssignment[]>;
  listRoleAssignments(roleId: string, ...args: any[]): Promise<RoleAssignment[]>;
  listTenantAssignments(tenantId: string, ...args: any[]): Promise<RoleAssignment[]>;
  updateAssignmentWindow(assignmentId: string, startsAt: Date | undefined, expiresAt: Date | undefined, ...args: any[]): Promise<RoleAssignment>;
}

export class EffectivePermissionService extends BaseModelService<EffectivePermission> {
  listForPrincipal(tenantId: string, principalId: string, ...args: any[]): Promise<EffectivePermission[]>;
  listForScope(tenantId: string, scopeKind: ScopeKind, scopeId: string, ...args: any[]): Promise<EffectivePermission[]>;
  hasPermission(tenantId: string, principalId: string, permissionKey: string, scopeKind: ScopeKind, scopeId: string, at?: Date, ...args: any[]): Promise<boolean>;
  deleteForPrincipal(tenantId: string, principalId: string, ...args: any[]): Promise<void>;
  deleteForTenant(tenantId: string, ...args: any[]): Promise<void>;
  rebuildForPrincipal(tenantId: string, principalId: string, ...args: any[]): Promise<EffectivePermission[]>;
  rebuildForTenant(tenantId: string, ...args: any[]): Promise<void>;
}
```

`EffectivePermissionService.rebuildForPrincipal` must:

```text
1. delete current effective permissions for tenant+principal
2. load direct role assignments
3. load group memberships for principal and include group role assignments
4. for every role assignment, load role permissions
5. if assignment scope is tenant, materialize tenant scope
6. if assignment scope is resource, materialize resource scope
7. if assignment scope is org unit and inheritDown=false, materialize only that org unit
8. if assignment scope is org unit and inheritDown=true, expand through org_unit_closure descendants
9. skip descendant org units where inheritance_blocks block that permission category from the assigning ancestor
10. preserve startsAt/expiresAt windows
```

##### Resource services

```ts
export class ProtectedResourceService extends BaseModelService<ProtectedResource> {
  registerResource(input: RegisterResourceInput, ...args: any[]): Promise<ProtectedResource>;
  getByDomainResource(tenantId: string, resourceType: string, resourceId: string, ...args: any[]): Promise<ProtectedResource | undefined>;
  moveResourceToOrgUnit(protectedResourceId: string, orgUnitId: string, ...args: any[]): Promise<ProtectedResource>;
  setVisibility(protectedResourceId: string, visibility: ResourceVisibility, ...args: any[]): Promise<ProtectedResource>;
  transferOwnership(protectedResourceId: string, ownerPrincipalId: string | undefined, ...args: any[]): Promise<ProtectedResource>;
  listOrgUnitResources(orgUnitId: string, ...args: any[]): Promise<ProtectedResource[]>;
  listTenantResources(tenantId: string, ...args: any[]): Promise<ProtectedResource[]>;
}

export class ResourceGrantService extends BaseModelService<ResourceGrant> {
  grantResource(input: GrantResourceInput, ...args: any[]): Promise<ResourceGrant>;
  revokeGrant(grantId: string, ...args: any[]): Promise<void>;
  listResourceGrants(protectedResourceId: string, ...args: any[]): Promise<ResourceGrant[]>;
  listPrincipalGrants(tenantId: string, principalId: string, ...args: any[]): Promise<ResourceGrant[]>;
  hasGrant(tenantId: string, principalId: string, protectedResourceId: string, permissionKey: string, at?: Date, ...args: any[]): Promise<boolean>;
  deleteAllForResource(protectedResourceId: string, ...args: any[]): Promise<void>;
}

export class ResourceLifecycleService {
  unregisterResource(protectedResourceId: string, ...args: any[]): Promise<void>;
  resolveResourceScope(protectedResourceId: string, ...args: any[]): Promise<{ tenantId: string; orgUnitId: string; visibility: ResourceVisibility; ownerPrincipalId?: string }>;
}
```

##### Authorization service

```ts
export class AuthzService {
  canAccess(input: CanAccessInput, ...args: any[]): Promise<boolean>;
  requireAccess(input: CanAccessInput, ...args: any[]): Promise<void>;
  buildAccessContext(tenantId: string, principalId: string, ...args: any[]): Promise<AccessContext>;
  buildArangoContext(tenantId: string, principalId: string, permissionKey: string, ...args: any[]): Promise<ArangoAuthContext>;
  buildQdrantFilter(tenantId: string, principalId: string, permissionKey: string, ...args: any[]): Promise<QdrantAuthFilter>;
}
```

`AuthzService.canAccess` must:

```text
1. If checking a resource, load ProtectedResource.
2. Deny tenant mismatch.
3. Allow owner if ownerPrincipalId equals actor principal.
4. Allow explicit grant if ResourceGrant exists and is time-valid.
5. Otherwise use visibility:
   - private: deny unless owner/direct grant
   - resource_acl: deny unless direct grant
   - org_unit: require EffectivePermission at resource.orgUnit
   - org_subtree: require EffectivePermission at resource.orgUnit; effective permissions already expanded
   - tenant: require EffectivePermission at tenant scope
6. If checking scope directly, use EffectivePermission.hasPermission.
```

`AuthzService.buildArangoContext` must output:

```ts
{
  tenantId,
  principalId,
  permissionKey,
  allowedOrgUnitIds,
  allowedResourceIds
}
```

`AuthzService.buildQdrantFilter` must output a payload filter requiring `tenant_id` and one of:

```text
org_unit_id in allowedOrgUnitIds
protected_resource_id in allowedResourceIds
owner_principal_id == principalId
```

##### Storage binding service

```ts
export class StorageBindingService extends BaseModelService<StorageBinding> {
  createBinding(input: CreateStorageBindingInput, ...args: any[]): Promise<StorageBinding>;
  listTenantBindings(tenantId: string, ...args: any[]): Promise<StorageBinding[]>;
  getBinding(tenantId: string, storageKind: StorageKind, ...args: any[]): Promise<StorageBinding | undefined>;
  setBindingConfig(bindingId: string, config: Record<string, unknown> | undefined, ...args: any[]): Promise<StorageBinding>;
  promoteToDedicated(bindingId: string, bindingKey: string, region: string, config?: Record<string, unknown>, ...args: any[]): Promise<StorageBinding>;
  setShared(bindingId: string, bindingKey: string, region: string, config?: Record<string, unknown>, ...args: any[]): Promise<StorageBinding>;
}
```

##### Bootstrap service

```ts
export class BootstrapService {
  bootstrapTenantFromTemplate(template: BootstrapTemplate, ...args: any[]): Promise<{ tenantId: string; rootOrgUnitId: string; ownerUserId: string; ownerPrincipalId: string }>;
}
```

Bootstrap flow:

```text
1. create Tenant
2. create root OrgUnit tree recursively
3. create owner User
4. add owner to TenantMembership
5. create or get owner Principal
6. create template Permissions
7. create template Roles
8. attach RolePermissions
9. assign owner role at root org unit with inheritDown=true
10. rebuild effective permissions for owner principal
```

##### System management service

```ts
export class SystemManagementService {
  onboardUserToTenantAndOrgUnit(tenantId: string, userId: string, orgUnitId: string, roleKey: string, ...args: any[]): Promise<{ principalId: string }>;
  changeUserOrgRole(tenantId: string, principalId: string, orgUnitId: string, roleKey: string, inheritDown: boolean, ...args: any[]): Promise<void>;
  suspendUserInTenant(tenantMembershipId: string, tenantId: string, principalId: string, ...args: any[]): Promise<void>;
  reactivateUserInTenant(tenantMembershipId: string, tenantId: string, principalId: string, ...args: any[]): Promise<void>;
}
```

### 4.4 SQL migrations outside Decaf

#### Composite uniqueness

```sql
CREATE UNIQUE INDEX uq_tenant_memberships_tenant_user ON tenant_memberships (tenant_id, user_id);
CREATE UNIQUE INDEX uq_org_unit_memberships_org_user ON org_unit_memberships (tenant_id, org_unit_id, user_id);
CREATE UNIQUE INDEX uq_principals_tenant_kind_subject ON principals (tenant_id, kind, subject_id);
CREATE UNIQUE INDEX uq_groups_tenant_org_name ON groups (tenant_id, org_unit_id, lower(name));
CREATE UNIQUE INDEX uq_roles_tenant_key ON roles (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'), key);
CREATE UNIQUE INDEX uq_role_permissions_role_permission ON role_permissions (role_id, permission_id);
CREATE UNIQUE INDEX uq_role_assignments_identity ON role_assignments (tenant_id, principal_id, role_id, scope_kind, scope_id);
CREATE UNIQUE INDEX uq_org_closure_pair ON org_unit_closure (tenant_id, ancestor_org_unit_id, descendant_org_unit_id);
CREATE UNIQUE INDEX uq_resource_domain ON protected_resources (tenant_id, resource_type, resource_id);
CREATE UNIQUE INDEX uq_resource_grant ON resource_grants (tenant_id, resource_id, principal_id, permission_key);
CREATE UNIQUE INDEX uq_storage_binding ON storage_bindings (tenant_id, storage_kind);
```

Adjust column names to match TypeORM output. If TypeORM emits relation columns as `tenantId` or `tenant_id`, align indexes accordingly.

#### RLS policies

RLS is not implemented in Decaf models. Add Postgres RLS for protected tables. Example:

```sql
ALTER TABLE protected_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected_resources FORCE ROW LEVEL SECURITY;

CREATE POLICY protected_resources_select_policy
ON protected_resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM effective_permissions ep
    WHERE ep.tenant_id = protected_resources.tenant_id
      AND ep.principal_id = current_setting('app.principal_id')::uuid
      AND ep.permission_key = 'resource.read'
      AND (
        (ep.scope_kind = 'tenant' AND ep.scope_id = protected_resources.tenant_id)
        OR (ep.scope_kind = 'org_unit' AND ep.scope_id = protected_resources.org_unit_id)
        OR (ep.scope_kind = 'resource' AND ep.scope_id = protected_resources.id)
      )
  )
);
```

The backend must set `app.tenant_id` and `app.principal_id` inside trusted transactions. Do not expose those settings to untrusted SQL users.

#### Advanced database controls

Keep recursive triggers, partial indexes, JSONB indexes, and related controls outside Decaf model decorators and in migrations.

### 4.5 Arango enforcement

Every vertex and edge must contain:

```json
{
  "tenant_id": "...",
  "org_unit_id": "...",
  "protected_resource_id": "...",
  "owner_principal_id": "...",
  "visibility": "org_unit",
  "sensitivity": "internal"
}
```

Traversal pattern:

```aql
FOR v, e, p IN 1..@depth OUTBOUND @start GRAPH @graph
  FILTER v.tenant_id == @tenantId
  FILTER e.tenant_id == @tenantId
  FILTER (
    v.org_unit_id IN @allowedOrgUnitIds
    OR v.protected_resource_id IN @allowedResourceIds
    OR v.owner_principal_id == @principalId
  )
  FILTER (
    e.org_unit_id IN @allowedOrgUnitIds
    OR e.protected_resource_id IN @allowedResourceIds
    OR e.owner_principal_id == @principalId
  )
  RETURN p
```

### 4.6 Qdrant enforcement

Each point payload must include:

```json
{
  "tenant_id": "...",
  "org_unit_id": "...",
  "protected_resource_id": "...",
  "owner_principal_id": "...",
  "resource_type": "memory",
  "resource_id": "...",
  "visibility": "org_unit",
  "sensitivity": "internal"
}
```

Search filter:

```json
{
  "must": [
    { "key": "tenant_id", "match": { "value": "tenant-id" } },
    {
      "should": [
        { "key": "org_unit_id", "match": { "any": ["org-1", "org-2"] } },
        { "key": "protected_resource_id", "match": { "any": ["res-1"] } },
        { "key": "owner_principal_id", "match": { "value": "principal-id" } }
      ]
    }
  ]
}
```

## 5. Tasks Breakdown

This specification is intentionally written as a handoff document for an implementation LLM. The implementation work should be broken down from the sections above into small task files under `workdocs/ai/project/specifications/tasks/`.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| DECAF-33-1 | Implement base models and enums | High | Completed | - |
| DECAF-33-2 | Implement tenant, org unit, and membership services | High | Completed | DECAF-33-1 |
| DECAF-33-3 | Implement roles, permissions, assignments, and effective permission materialization | High | Completed | DECAF-33-1 |
| DECAF-33-4 | Implement resource, grant, authz, and storage binding services | High | Completed | DECAF-33-1 |
| DECAF-33-5 | Add SQL migrations for constraints, RLS, and indexes | High | Completed | DECAF-33-1 |
| DECAF-33-6 | Add Arango and Qdrant authorization enforcement layers | Medium | Completed | DECAF-33-4 |
| DECAF-33-7 | Add bootstrap and system management flows | Medium | Completed | DECAF-33-2 |
| DECAF-33-8 | Add integration and service tests for authorization scenarios | High | Completed | DECAF-33-2 |
| DECAF-33-9 | Add namespace-scoped role decorator support via `@namespace(...)` | High | Completed | DECAF-33-1 |
| DECAF-33-10 | Extend `KeycloakAuthHandler` to recognize namespace roles | High | Completed | DECAF-33-9 |
| DECAF-33-11 | Add granular nested-org and single-user segregation coverage | High | Completed | DECAF-33-3, DECAF-33-9, DECAF-33-10 |
| DECAF-33-12 | Add UI visibility wrappers for namespace-aware `@hideOn`/`renderIf` and `@hideFor`/`showFor` | High | Completed | DECAF-33-9, DECAF-33-10, DECAF-33-11 |
| DECAF-33-13 | Preserve for-nest compatibility with namespace auth metadata and visibility wrappers | High | Completed | DECAF-33-9, DECAF-33-10, DECAF-33-12 |

## 6. Open Questions / Risks

* Exact TypeORM column naming may differ from the logical names shown in the SQL examples; migrations must align with the actual generated column names.
* RLS policies depend on trusted transaction scoping and session settings; the backend must set those values only inside trusted code paths.
* Effective permission rebuilds can become expensive for large org trees; background rebuild support is required after bulk changes.
* Arango and Qdrant integrations must always consume `AuthzService` contexts and must not bypass payload filters.

## 7. Results & Artifacts

* Created `workdocs/ai/project/specifications/DECAF_33.md`.
* Defined the org-based authorization domain model, service surface, and storage enforcement requirements.
* Captured the full model and service code blocks provided in the request.
* Added a task breakdown placeholder for downstream implementation work.
