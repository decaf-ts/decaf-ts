# TASK-170: Finish the generic `ServerControllerBuilder`/`ServerMethodBuilder` pair

**ID:** TASK-170
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
`for-http/src/server/controllers/{ControllerBuilder.ts,RouteBuilder.ts}` already implement a generic, framework-agnostic builder pair (`ServerControllerBuilder`/`ServerMethodBuilder`), but they can only describe a route's *metadata* today — `ServerMethodBuilder.withImplementation()` is a no-op stub, `ServerRoute` (`models.ts`) has no field to hold an actual handler function, and `ServerControllerBuilder.build()` is `abstract` with no concrete subclass anywhere that turns accumulated `ServerRoute`s into a real class. Finish both so they can carry and materialize real behavior, while keeping them free of any persistence/model-specific logic (that belongs one layer up, in `ModelControllerBuilder`, TASK-171).

## 2. Objectives
*   [ ] Add a handler/implementation field to `ServerRoute` (`for-http/src/server/controllers/models.ts`).
*   [ ] Make `ServerMethodBuilder.withImplementation(fn)` actually store `fn` and have `build()` include it on the returned `ServerRoute`.
*   [ ] Provide a concrete way for `ServerControllerBuilder` (or a minimal concrete subclass) to materialize a real class from `this.methods: ServerRoute[]` — i.e. `build()` must do something, not just be `abstract`.
*   [ ] Confirm neither class imports anything persistence/model/CRUD-specific (no `Repo`, `ModelService`, `OperationKeys`, etc.) — keep them pure structural builders.

## 3. Implementation Plan
**Proposed Changes:**
*   Extend `ServerRoute` with a handler field (e.g. `implementation?: (...args: any[]) => any`, not validated/decorated as a `Model` property since it's a function, not serializable state — store it alongside the model instance or as a parallel map keyed by route).
*   Update `ServerMethodBuilder.withImplementation()` to store the handler and `build()` to attach it.
*   Decide and implement how `ServerControllerBuilder.build()` materializes a class: likely `Object.defineProperty`-based method definition on a dynamically created class, similar to the now-lost `DecafModelControllerBuilder`'s pattern (see DECAF-10 Overview's audit finding) and to `for-nest/src/decaf-model/utils.ts`'s existing `defineRouteMethod`.

**Technical Details:**
*   Look at `for-nest/src/decaf-model/utils.ts` (`defineRouteMethod` at lines 149-167, `applyApiDecorators` at lines 91-100) for the existing pattern of defining non-writable methods on a dynamically generated class — the generic builder's materialization should follow the same shape, just without any Nest-specific decorator application (that stays in `for-nest`).
*   `ServerControllerBuilder` is `abstract`; decide whether `build()` becomes concrete here (with subclasses only contributing framework-specific decoration) or whether a separate concrete base class is introduced. Either way, no model/persistence logic belongs in this file.
*   Confirmed exact current state (2026-06-19 review): `ServerControllerBuilder.build(): C` is `abstract` at `ControllerBuilder.ts:51`; `ServerMethodBuilder.withImplementation()` at `RouteBuilder.ts:79-81` takes **zero parameters** today (`withImplementation() { return this; }`) — it isn't just a no-op, the signature itself needs to change to `withImplementation(fn: (...args: any[]) => any)`. `ServerControllerBuilder.addMethod()` (`ControllerBuilder.ts:27-44`) already has a working `Proxy`-based trick that intercepts `methodBuilder.build()` and auto-pushes the result into `this.methods` — reuse this pattern rather than introducing a second way of registering routes.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit test: `addMethod()...withImplementation(fn).build()` round-trips `fn` onto the resulting `ServerRoute`.
*   [ ] Unit test: `ServerControllerBuilder.build()` (or its minimal concrete subclass) produces a class whose method actually invokes the stored implementation when called.

**Manual Verification:**
*   N/A — covered by automated tests.

## 5. Blockers & Clarifications
*   **Clarification:** Confirm whether `ServerControllerBuilder.build()` should become concrete in this base class, or remain abstract with `ModelControllerBuilder` (TASK-171) providing the first real materialization logic. Either is acceptable as long as the generic builder stays free of model-specific logic.

## 6. Execution Log
*   Completed the generic handler-carrying builder in `for-http/src/server/controllers/` by adding route implementation storage to `ServerRoute`, wiring `ServerMethodBuilder.withImplementation(fn)`, and materializing concrete controller classes from accumulated routes.
