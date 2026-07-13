# DECAF-42: Controlled SSE Subscriptions for for-http and for-nest

**Status:** Completed
**Priority:** High
**Owner:** Platform / Backend

## 1. Overview
The current SSE observable flow in `for-nest` is broadcast-oriented: a connected client receives every event emitted by the backend, and `for-http` connects to `/events` and consumes that stream as-is. This specification adds an opt-in controlled/private mode for situations where the frontend should only receive the events it explicitly requested.

The default behavior must remain unchanged. Existing consumers continue to connect to `/events` and receive the full stream. When subscription mode is enabled through configuration, the backend must require explicit subscription registration and only deliver matching events to each observer.

## 2. Goals
*   [ ] Preserve the current broadcast SSE behavior as the default mode.
*   [ ] Add an opt-in subscription mode with explicit subscribe and unsubscribe lifecycle endpoints.
*   [ ] Filter event delivery per subscriber based on the subscriptions they registered.
*   [ ] Keep `for-http` and `for-nest` compatible with the existing observable API surface.
*   [ ] Add tests that cover both broadcast and private subscription behavior.
*   [ ] Verify fan-out correctness with 5+ consuming `HttpAdapter` observers in both modes.

## 3. User Stories / Requirements
*   **US-1:** As a frontend consumer, I want the existing broadcast stream to keep working so existing integrations do not break.
*   **US-2:** As a frontend consumer, I want to subscribe only to the event streams I need so I do not receive unrelated backend events.
*   **US-3:** As a backend maintainer, I want explicit subscription lifecycle hooks so I can track and clean up observers correctly.
*   **Req-1:** The default SSE mode must remain the current broadcast behavior.
*   **Req-2:** In subscription mode, `for-http` must register subscriptions through `/events/subscribe` and unregister through `/events/unsubscribe`.
*   **Req-3:** `for-nest` must keep per-subscriber subscription state and filter emitted events before delivering them to each observer.
*   **Req-4:** Subscription state may be ephemeral by default, but the design must allow a `RamAdapter`-backed registry if persistence is needed.
*   **Req-5:** Existing observable consumers must continue to work without code changes when subscription mode is disabled.
*   **Req-6:** In both broadcast and subscription mode, each registered observer must receive each matching event exactly once, even when 5+ `HttpAdapter` consumers are connected concurrently.
*   **Req-7:** In subscription mode, each observer must only receive events that match the subscriptions it registered.

## 4. Architecture & Design
The current SSE stack has two visible layers:

*   `for-nest/src/events-module/EventsController.ts` exposes the server-side SSE stream.
*   `for-http/src/event/ServerEventConnector.ts` maintains the client-side SSE connection and dispatches parsed events to listeners.

The new mode should introduce a subscription-aware path without removing the current broadcast path.

Proposed design:

*   Add a subscription registry service in `for-nest` to track observer identity, requested topics, and lifecycle state.
*   Extend the events module so it can operate in either broadcast mode or subscription mode.
*   Add explicit subscription endpoints in the server side flow:
    *   `POST /events/subscribe`
    *   `POST /events/unsubscribe`
*   Extend the `for-http` connector so opening a connector in subscription mode first registers the requested subscription and closing it unregisters it.
*   Filter outgoing events by subscriber interests before calling `observer.next(...)`.
*   Keep the existing `/events` broadcast stream unchanged for default mode and backwards compatibility.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:--|:--|:--|:--|:--|
| TASK-245 | [Define subscription mode and server-side registry contract](./tasks/TASK_245.md) | High | Completed | - |
| TASK-246 | [Extend the for-http SSE connector with subscribe/unsubscribe lifecycle handling](./tasks/TASK_246.md) | High | Completed | TASK-245 |
| TASK-247 | [Add live tests and documentation for broadcast default behavior, fan-out correctness, and private subscription mode](./tasks/TASK_247.md) | Medium | Completed | TASK-245, TASK-246 |

## 6. Open Questions / Risks
*   Should subscription state be purely in-memory by default, or should a `RamAdapter` registry be the default fallback?
*   What is the initial subscription identity model: per connector, per auth user, or both?
*   How should reconnects behave if a client loses the SSE connection while a subscription is active?
*   Do we need topic granularity at the model level only, or also operation / route / namespace filters?

## 7. Results & Artifacts
*   `workdocs/ai/project/specifications/DECAF_42.md`
*   `workdocs/ai/project/specifications/tasks/TASK_245.md`
*   `workdocs/ai/project/specifications/tasks/TASK_246.md`
*   `workdocs/ai/project/specifications/tasks/TASK_247.md`
