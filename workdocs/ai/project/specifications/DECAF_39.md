# DECAF-39: Feature Flags, Feature Scoping, and UI/Endpoint Visibility

**Status:** Draft
**Priority:** High
**Owner:** AI Agent

## 1. Overview

This specification defines a feature-flag system for Decaf-TS that is exposed from `@decaf-ts/integrations` through a named `feature-flags` export surface.

The goal is to let application developers control exactly which features are available at runtime and at render time. The system must support persisted feature configuration, feature-aware model decoration, feature-aware endpoint exposure, and feature-aware UI visibility controls.

The design should reuse the existing Decaf patterns for model decoration, repository-backed persistence, and service orchestration so feature flags behave like a first-class Decaf capability rather than an ad hoc application concern.

## 2. Goals

*   Define a persisted feature-configuration model and the repositories/services needed to manage it.
*   Expose a named `feature-flags` export from `@decaf-ts/integrations`.
*   Provide feature-scoped model decorators analogous to `@roles` and `@namespace`.
*   Provide feature-scoped endpoint decorators analogous to `@auth()` and `@blockOperations`.
*   Provide feature-scoped UI decorators analogous to `@renderIf` and `@hideOn`.
*   Make feature availability checks consistent across models, repositories, services, routes, and UI rendering.
*   Keep the system flexible enough to support application-specific feature sets without coupling the core package to one product domain.

## 3. User Stories / Requirements

*   **US-1:** As an application developer, I want to define which features exist and whether they are enabled so that I can ship incomplete or staged functionality safely.
*   **US-2:** As a backend developer, I want to attach features to models and endpoints so that unavailable features cannot be exercised accidentally.
*   **US-3:** As a frontend developer, I want UI elements to render only when their feature is enabled so that the user interface matches server-side availability.
*   **US-4:** As a platform maintainer, I want feature configuration persisted in Decaf models and accessed through repositories/services so that feature state is queryable, testable, and reusable.
*   **Req-1:** `@decaf-ts/integrations` must expose a named `feature-flags` export surface for consumers.
*   **Req-2:** Feature configuration must be persisted through Decaf model-backed storage rather than only in process memory.
*   **Req-3:** Feature-scoped model decoration must support assigning specific models to specific features.
*   **Req-4:** Feature-scoped endpoint decoration must support exposing or hiding operations in a way analogous to `@auth()` and `@blockOperations`.
*   **Req-5:** Feature-scoped UI decoration must support rendering or hiding elements in a way analogous to `@renderIf` and `@hideOn`.
*   **Req-6:** Feature checks must be available to repositories and services so availability can be enforced before business logic runs.

## 4. Architecture & Design

### 4.1 Package export surface

Add a dedicated `feature-flags` subpath or named export surface under `@decaf-ts/integrations` that provides the public API for feature flag management.

The exported surface should make the following concepts discoverable:

*   feature configuration models
*   feature repositories
*   feature services
*   feature-aware decorators
*   feature evaluation helpers

The root package should not require consumers to import internal implementation paths to use feature-flag behavior.

### 4.2 Persistence model

Feature flags should be represented by Decaf models that can be persisted and queried consistently with the rest of the platform.

The model layer should support at least:

*   a feature definition or feature key
*   an enabled/disabled state
*   optional metadata describing rollout intent
*   optional scoping information for tenant, namespace, or environment use cases
*   optional assignment rules for models, routes, or UI targets

The exact schema can be refined during implementation, but the spec requires a persistent source of truth for feature state.

### 4.3 Repository and service layer

Feature state should be managed through repositories and services instead of being read directly from decorators or UI code.

The repository/service layer should support:

*   creating and updating feature definitions
*   enabling and disabling features
*   querying feature state by key or scope
*   resolving whether a feature is active for a given execution context
*   applying feature checks in backend workflows before actions proceed

This layer should be the single place where feature resolution policy lives.

### 4.4 Model decoration

Add feature-aware model decorators that mirror the intent of `@roles` and `@namespace`.

These decorators should let a model declare that it belongs to, requires, or is controlled by one or more features.

The model decoration contract should support:

*   attaching feature metadata to models and/or model members
*   expressing positive feature requirements
*   expressing negative feature restrictions when needed
*   allowing downstream loaders and services to resolve feature applicability consistently

### 4.5 Endpoint decoration

Add endpoint decorators that mirror the intent of `@auth()` and `@blockOperations`.

These decorators should allow route handlers or controller methods to declare:

*   which features must be enabled for the endpoint to be exposed
*   which features must be disabled before the endpoint is exposed
*   which operations should be blocked when a feature is unavailable

The resulting metadata should be usable by backend integration layers so routes can be suppressed, rejected, or excluded from generated surface area when a feature is not active.

### 4.6 UI decoration

Add UI decorators that mirror the intent of `@renderIf` and `@hideOn`.

These decorators should allow UI elements to declare:

*   when they should render only if a feature is enabled
*   when they should hide if a feature is enabled
*   when a component, field, or action should be omitted entirely from a feature-disabled build or runtime

The UI contract should stay compatible with the existing Decaf decorator model so component metadata can be consumed in Angular and other frontend contexts.

### 4.7 Enforcement flow

Feature evaluation should follow the same general pattern across layers:

1.   Load persisted feature configuration.
2.   Resolve the active execution context.
3.   Check model, endpoint, or UI metadata against the feature state.
4.   Allow or suppress the target object accordingly.

This flow should be reusable so the same feature definition can drive backend routing, model availability, and UI visibility without duplicating policy logic.

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| DECAF-39-1 | Define the feature-flag package surface and `feature-flags` export in `@decaf-ts/integrations` | High | Pending | - |
| DECAF-39-2 | Design and implement persisted feature configuration models and repositories | High | Pending | DECAF-39-1 |
| DECAF-39-3 | Implement feature resolution services for runtime, model, route, and UI checks | High | Pending | DECAF-39-2 |
| DECAF-39-4 | Add model decorators for feature assignment and feature requirements | High | Pending | DECAF-39-3 |
| DECAF-39-5 | Add endpoint decorators for feature-based exposure and operation blocking | High | Pending | DECAF-39-3 |
| DECAF-39-6 | Add UI decorators for feature-based render/hide behavior | High | Pending | DECAF-39-3 |
| DECAF-39-7 | Document integration points and verification coverage for feature-aware loading and enforcement | Medium | Pending | DECAF-39-4, DECAF-39-5, DECAF-39-6 |

## 6. Open Questions / Risks

*   Should feature state be global only, or should it support tenant, namespace, environment, and user-scoped overrides from day one?
*   Should feature decorators only annotate metadata, or should they also enforce behavior at runtime when the feature is disabled?
*   Should endpoint decorators suppress route registration entirely, or should they register the route and return an access-denied response?
*   Should UI decorators omit the element from the metadata tree entirely, or keep it present but hidden for introspection and tooling?
*   Do feature assignments need priority and conflict resolution when multiple scopes apply to the same model or route?

## 7. Results & Artifacts

*   A new DECAF specification for feature flags and feature-aware visibility controls.
*   A planned `@decaf-ts/integrations` `feature-flags` export surface.
*   A persisted feature configuration model and repository/service layer.
*   Feature-aware decorators for models, endpoints, and UI elements.
*   A clear enforcement path for feature visibility across backend and frontend consumers.
