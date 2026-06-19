# TASK-176: Consolidate `for-nest` auth logic into its own module with `forRoot(...)`

**ID:** TASK-176
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Complete

## 1. Description
`for-nest`'s auth logic is currently split across `for-nest/src/decaf-model/decorators/decorators.ts` (the `Auth()` decorator), `for-nest/src/interceptors/AuthInterceptor.ts`, and `for-nest/src/request/DecafAuthHandler.ts`, with no single configuration entry point. Consolidate all of it into a new `for-nest/src/auth/` module exposing a Nest-style `forRoot(options)` dynamic module, configurable to control whether the interceptor is global or per-controller opt-in.

## 2. Objectives
*   [x] Create `for-nest/src/auth/` containing the relocated `AuthInterceptor`, `DecafAuthHandler`, `Auth()` decorator, and the `AUTH_META_KEY`/`AUTH_HANDLER` tokens (correction, 2026-06-19 review: both are actually defined only in `for-nest/src/constants.ts:12-13`; `for-nest/src/types.ts` merely *references* `AUTH_HANDLER` inside a JSDoc `@example` comment, it does not declare either token).
*   [x] Add `DecafAuthModule.forRoot(options)` returning a Nest `DynamicModule`.
*   [x] `options` must include at least `global: boolean` — `true` registers `AuthInterceptor` as an `APP_INTERCEPTOR` provider (every route protected by default); `false` preserves today's behavior (opt-in per controller via `@Auth()`).
*   [x] Add re-export shims at the old paths so existing consumers importing `Auth`/`AuthInterceptor`/`DecafAuthHandler` directly do not break.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-nest/src/auth/{AuthModule.ts,AuthInterceptor.ts,DecafAuthHandler.ts,decorators.ts,constants.ts,index.ts}`, moving the existing implementations with minimal changes.
*   Update `for-nest/src/index.ts` and any internal consumers (`for-nest/src/decaf-model/FromModelController.ts`'s `Auth` import, etc.) to the new module path.
*   Leave thin re-export shims at the old locations (`for-nest/src/interceptors/AuthInterceptor.ts`, `for-nest/src/request/DecafAuthHandler.ts`, the `Auth` export in `decaf-model/decorators/decorators.ts`).

**Technical Details:**
*   Follow the standard Nest dynamic-module convention (`@Module({})` class with a static `forRoot(options): DynamicModule` returning `{ module: DecafAuthModule, providers: [...], global: options.global }` when global registration is requested) — consistent with how other Nest libraries (e.g. `@nestjs/config`) expose configurable global behavior.
*   When `global: true`, register `AuthInterceptor` via the `APP_INTERCEPTOR` token from `@nestjs/core`, not just as a regular provider, so it actually runs for every route without each controller needing `@UseInterceptors`/`@Auth()`.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit/integration test: `DecafAuthModule.forRoot({ global: true })` results in every controller's routes going through `AuthInterceptor` without an explicit `@Auth()`.
*   [x] Unit/integration test: `DecafAuthModule.forRoot({ global: false })` (or omitted) preserves today's opt-in-only behavior.
*   [x] Existing `for-nest` auth-related tests continue to pass via the re-export shims.

**Manual Verification:**
*   Boot a minimal Nest app with `DecafAuthModule.forRoot({ global: true })` and confirm an unprotected controller's route still goes through the auth handler.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   Implemented in `for-nest/src/auth/` with compatibility shims retained at the original import locations.
