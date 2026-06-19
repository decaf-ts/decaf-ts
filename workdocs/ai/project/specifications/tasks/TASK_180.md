# TASK-180: Live Nest integration coverage for controller exposure, adapter split, HTTP routes, and SSE

**ID:** TASK-180
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Complete

## 1. Description
Add a production-grade live integration suite in `for-nest` that boots a real Nest application, exposes distinct model controllers via `@expose(...)`, overrides the exposure map through `DecafModuleOptions.controllerExposure`, and exercises the full HTTP surface through `AxiosHttpAdapter` against RAM and Nano-backed models. The suite must also verify SSE delivery through the events module on `/sse`.

## 2. Objectives
*   [x] Add live integration models with real Decaf metadata (`@table`, `@model`, `@uses`, `@pk`, `@column`, `@required`, `@defaultQueryAttr`, and `@composed` where needed) so the suite exercises production-style controller generation.
*   [x] Boot a live Nest server with at least two adapters (`ram` and `nano`) and split models between them through `@expose(...)`, plus a module-level `controllerExposure` override that takes precedence over the decorator metadata.
*   [x] Exercise the generated controllers over HTTP using `AxiosHttpAdapter` and cover CRUD, bulk, prepared-statement, grouping, and composed-key routes.
*   [x] Verify SSE delivery from the backend through `/sse` and the events module by receiving model operation events from the live server.

## 3. Implementation Plan
**Proposed Changes:**
*   Add or extend integration fixtures under `for-nest/tests/integration/`.
*   Introduce a small `@expose(...)` decorator in `for-nest/src/decaf-model/` and thread the module-level override through `DecafModuleOptions`.
*   Use live Nano test resources for the Nano-backed controller path and verify the record lands in the expected persistence backend.

**Technical Details:**
*   Keep the suite self-cleaning so it can run repeatedly in CI without manual database resets.
*   Use direct HTTP requests for route coverage and `EventSource` for SSE verification.

## 4. Verification Plan
**Automated Tests:**
*   [x] `for-nest/tests/integration/decaf-model-exposure.integration.test.ts`

**Manual Verification:**
*   Inspect the route coverage against the live app boot logs and confirm the expected models are exposed on each adapter.

## 5. Blockers & Clarifications
*   None beyond the existing live Nano environment requirement used by the other `for-nest` integration suites.

## 6. Execution Log
*   Implemented via `for-nest/tests/integration/decaf-model-exposure.integration.test.ts`.
