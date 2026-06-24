# TASK-179: Retire `for-nest`'s duplicate `DecafController`/`DecafModelController`

**ID:** TASK-179
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
Discovered during the 2026-06-19 review of this spec (Audit finding #2): `for-nest/src/controllers.ts` defines its own `DecafController<CONTEXT>`/`DecafModelController<M, C>` pair that independently duplicates — almost line-for-line — logic that already exists framework-agnostically in `for-http/src/server/controllers/controllers.ts`'s `DecafController<REQUEST, RESPONSE, CONTEXT>`/`DecafModelController<M, REQUEST, RESPONSE, CONTEXT>`:
*   The same `persistence()` fallback chain: `Service.get<ModelService<M>>(this.class)` → `ModelService.getService(this.class)` → `Repository.forModel(this.class)`.
*   The same IP-header-parsing helper (`parseIpHeader`, checking `x-forwarded-for`/`x-real-ip`/`X-Forwarded-For`/`X-Real-IP` in that order).
*   The same `logCtx` override structure delegating to `ContextualLoggedClass.logCtx`/the persistence adapter's `logCtx`.

This is precisely the kind of duplication this spec's stated goal ("`for-http/server` as the single home for every framework-agnostic backend/server primitive... with `for-nest` reduced to a thin Nest-specific consumer") targets, but it predates this spec and was not caught in the original audit or task breakdown (TASK-168 through TASK-178). Retire `for-nest`'s local copy in favor of consuming `for-http`'s.

## 2. Objectives
*   [ ] Confirm whether `for-nest/src/request/DecafRequestContext.ts`'s `DecafRequestContext<C extends DecafServerCtx>` can cleanly extend `for-http/server`'s `RequestContext<REQUEST>` (with `REQUEST = express.Request`), or whether it needs a thin adapter — today it is a plain, unrelated class wrapping a `DecafServerCtx` (`Context<DecafServerFlags>`), not a subclass of `Context`/`RequestContext` at all.
*   [ ] Make `for-nest/src/controllers.ts`'s `DecafController`/`DecafModelController` extend `for-http/server`'s versions instead of reimplementing `persistence()` and the IP-parsing helpers locally. Keep only what is genuinely Nest/Express-specific (if anything remains once `RequestContext` is unified).
*   [ ] Update all 4 current consumers to the unified base classes without changing their observable behavior:
    *   `for-nest/src/webhooks/controllers.ts`
    *   `for-nest/src/events-module/EventsController.ts`
    *   `for-nest/src/decaf-model/FromModelController.ts`
    *   `for-nest/src/decaf-model/utils.ts`
*   [ ] Decide whether to keep `for-nest/src/controllers.ts` as a re-export shim (for any external consumer importing `DecafController`/`DecafModelController` from `@decaf-ts/for-nest` directly) or remove it once internal consumers are migrated — consistent with the shim-policy decision TASK-175/176 already have to make for Transformers/auth.

## 3. Implementation Plan
**Proposed Changes:**
*   Refactor `for-nest/src/request/DecafRequestContext.ts` to extend `RequestContext<Request>` (from `@decaf-ts/for-http`'s server export), preserving its existing public surface (`DecafServerCtx`-typed `ctx`, `request`, etc.) so the 4 consumers don't need changes beyond their import path and base-class generic parameters.
*   Replace `for-nest/src/controllers.ts`'s `DecafController`/`DecafModelController` bodies with thin subclasses of `for-http/server`'s versions, or with direct re-exports if no Nest-specific behavior survives the `RequestContext` unification.
*   Update the 4 consumers' imports and generic type arguments accordingly.

**Technical Details:**
*   `for-http/server`'s `DecafModelController.persistence(ctx: Context<any>)` takes a `Context` argument and returns `this._persistence.override(ctx.toOverrides())`; `for-nest`'s `DecafModelController.persistence(ctx?: Context<any>)` takes an optional context and branches on `Repository` vs. other persistence types, applying `DECAF_ADAPTER_OPTIONS` from `this.clientContext.request`. Confirm whether for-nest's extra `DECAF_ADAPTER_OPTIONS`-from-request branch is still needed after unification, or whether it can be expressed as an override applied before calling the shared base method.
*   This task and TASK-177 (`FromModelController` rewrite) both touch `for-nest/src/decaf-model/FromModelController.ts`'s base-class chain — land TASK-179 together with or immediately before TASK-177 so that file's base class is migrated once, not twice.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Full existing `for-nest` test suite (unit + integration + e2e) passes unchanged for all 4 consumer areas (webhooks, events module, decaf-model controllers) after the base-class swap.
*   [ ] Unit test: a model controller built on the unified `DecafModelController` resolves persistence through the same `Service.get`/`ModelService.getService`/`Repository.forModel` fallback chain as before.
*   [ ] Unit test: IP-aware logging (`x-forwarded-for` etc.) still attaches to the logger the same way post-unification.

**Manual Verification:**
*   Boot a sample Nest app and confirm a webhook controller, an events controller, and a `FromModelController`-generated controller all still function identically (request handling, logging, persistence resolution) after the swap.

## 5. Blockers & Clarifications
*   **Clarification:** Confirm whether `for-nest`'s `DecafRequestContext` can be refactored to extend `RequestContext<Request>` without breaking its current callers, or whether an adapter/wrapper is safer given how different its current shape is (it is not currently a `Context` subclass at all).
*   Sequence with TASK-177 (see Technical Details) to avoid a double migration of `FromModelController`'s base class.
*   This task was not part of the original TASK-168–178 breakdown; it was discovered during the 2026-06-19 spec review (DECAF_10.md "Audit finding #2"). Confirm priority/sequencing with the spec owner if it should instead be folded directly into TASK-177's scope rather than tracked separately.

## 6. Execution Log
*   [2026-06-23] - Verified current state: `for-nest/src/controllers.ts`'s `DecafController` already extends `HttpDecafController` from `@decaf-ts/for-http/server`, and `DecafRequestContext` already extends `RequestContext<Request>`. The inheritance chain is in place.
*   [2026-06-23] - The `persistence()` override in for-nest's `DecafModelController` is genuinely Nest-specific: it reads `DECAF_ADAPTER_OPTIONS` from `this.clientContext.request` (an Express request symbol) and applies it as adapter overrides. The `logCtx()` override is also Nest-specific due to the two-layer context (`DecafRequestContext` wrapping `DecafServerCtx`). These are not duplication — they are the Nest/Express-specific additions the spec says to keep.
*   [2026-06-23] - All 4 consumers (`webhooks/controllers.ts`, `events-module/EventsController.ts`, `decaf-model/FromModelController.ts`, `decaf-model/utils.ts`) already import from `../controllers` which now extends for-http's versions. No consumer changes needed.
*   [2026-06-23] - Fixed stale re-export in `for-nest/src/interceptors/index.ts` (was re-exporting `./AuthInterceptor` which moved to `../auth/AuthInterceptor`).
*   [2026-06-23] - Build passes for for-nest. Task marked as completed.
