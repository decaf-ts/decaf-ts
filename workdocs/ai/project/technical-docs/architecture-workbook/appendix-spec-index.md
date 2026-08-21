# Appendix A — Specification Index

Mapping of every in-scope DECAF specification to the workbook section that covers it, with the spec's self-reported status and primary package.

| Spec | Title | Status | Primary package(s) | Workbook section |
|:-----|:------|:-------|:-------------------|:-----------------|
| [DECAF-1](../specifications/DECAF_1.md) | Worker Task System | In Progress | `core` | [05](./05-task-engine.md) |
| [DECAF-2](../specifications/DECAF_2.md) | Fabric Legacy Peer Selection | Completed | `for-fabric` | [07](./07-fabric.md) |
| [DECAF-3](../specifications/DECAF_3.md) | Filesystem Adapter | Completed | `core` | [02](./02-core-persistence.md) |
| [DECAF-4](../specifications/DECAF_4.md) | Builder for Decorator Validation Models | Completed* | `decorator-validation` + all | [08](./08-platform-services.md) |
| [DECAF-5](../specifications/DECAF_5.md) | FabricClientAdapter Object Instantiation | Completed | `for-fabric` | [07](./07-fabric.md) |
| [DECAF-6](../specifications/DECAF_6.md) | TypeORM Multi-Database Support | Completed* | `for-typeorm` | [02](./02-core-persistence.md) |
| [DECAF-7](../specifications/DECAF_7.md) | Transaction Decorator + Lock Context | Completed | `core`, `for-typeorm` | [02](./02-core-persistence.md) |
| [DECAF-8](../specifications/DECAF_8.md) | Universal E2E Test Coverage | — | (cross-cutting) | (process/test; not detailed) |
| [DECAF-9](../specifications/DECAF_9.md) | MiniLogger LogParameter Engine | Completed | `logging` | [08](./08-platform-services.md) |
| [DECAF-10](../specifications/DECAF_10.md) | Backend Server Primitives & Model Controller Builder/Factory | In Progress | `for-http`, `for-nest`, `core` | [03](./03-http-server-nest.md) |
| [DECAF-11](../specifications/DECAF_11.md) | Property-Scoped Persistent Sequences | Completed | `core` + adapters | [02](./02-core-persistence.md), [07](./07-fabric.md) |
| [DECAF-12](../specifications/DECAF_12.md) | TaskEngine Dynamic Steps, Dependencies, Locks, Handler Catch | Completed | `core` | [05](./05-task-engine.md) |
| [DECAF-13](../specifications/DECAF_13.md) | HttpAdapter Simple REST Methods & Typed Request Options | Completed | `for-http` | [03](./03-http-server-nest.md) |
| [DECAF-14](../specifications/DECAF_14.md) | Cross-Adapter Migration Engine Hardening | Completed | `core`, adapters, `for-nest`, `cli` | [02](./02-core-persistence.md) |
| [DECAF-15](../specifications/DECAF_15.md) | Webhook Engine - Complete Integration Testing | Completed | `for-http`, `for-nest`, `for-nano` | [10](./10-integrations-extras.md) |
| [DECAF-16](../specifications/DECAF_16.md) | Jira Ticket Template Resources & Guided Creation | (excluded — mcp-server) | — | — |
| [DECAF-17](../specifications/DECAF_17.md) | Agent-Namespace Orchestration, GOAP, Progress Relay | In Progress | agent layer | [09](./09-agent-orchestration.md) |
| [DECAF-18](../specifications/DECAF_18.md) | Context Transition Semantics for ContextualLoggedClass | Planned | `core` | [08](./08-platform-services.md) |
| [DECAF-19](../specifications/DECAF_19.md) | Configurable Agent Execution Mode | Planned | agent layer | [09](./09-agent-orchestration.md) |
| [DECAF-20](../specifications/DECAF_20.md) | Agent Tool Progress Notifications (merged into DECAF-17) | Merged | agent layer | [09](./09-agent-orchestration.md) |
| [DECAF-21](../specifications/DECAF_21.md) | Fabric Channel Manager Service | Rejected/deferred | `for-fabric` | [07](./07-fabric.md) |
| [DECAF-22](../specifications/DECAF_22.md) | TaskEngine Step Insertion, Per-Step Retry, Concurrent Composite Steps | Completed | `core`, `for-nano` | [05](./05-task-engine.md) |
| [DECAF-23](../specifications/DECAF_23.md) | @throttle() Decorator Formalization | Completed | `core` | [08](./08-platform-services.md) |
| [DECAF-24](../specifications/DECAF_24.md) | Graph Metadata Layer and Angular Graph Adapter | Completed | `ui-decorators`, `for-angular` | [06](./06-graph.md) |
| [DECAF-25](../specifications/DECAF_25.md) | Webpage Refactor to Full Decaf Convention | In Progress | `for-angular` | [10](./10-integrations-extras.md) |
| [DECAF-26](../specifications/DECAF_26.md) | SecretService API and Provider Implementations | Completed | `integrations`, `crypto` | [08](./08-platform-services.md) |
| [DECAF-27](../specifications/DECAF_27.md) | Reusable GitHub Actions Repository | In Progress | `reusable-actions` | [10](./10-integrations-extras.md) |
| [DECAF-29](../specifications/DECAF_29.md) | GitHub Actions Inventory, Normalization, and Rule Replication | Planned | `reusable-actions` | [10](./10-integrations-extras.md) |
| [DECAF-30](../specifications/DECAF_30.md) | BlobStoreService API and Provider Implementations | Completed | `integrations` | [08](./08-platform-services.md) |
| [DECAF-31](../specifications/DECAF_31.md) | mcp-server CLI Packaging, ADOS Setup, Dist Inspector | (excluded — mcp-server) | — | — |
| [DECAF-32](../specifications/DECAF_32.md) | Decaf Graph Execution Engine | In Progress | `integrations/graph`, `for-angular`, `for-nest` | [06](./06-graph.md) |
| [DECAF-33](../specifications/DECAF_33.md) | Decaf-TS Org-Based Authorization System | Completed | `core`, `for-typeorm`, `for-nest` | [04](./04-authorization.md) |
| [DECAF-34](../specifications/DECAF_34.md) | Graph Node Type Catalogue | In Progress | `integrations/graph` | [06](./06-graph.md) |
| [DECAF-35](../specifications/DECAF_35.md) | Graph Metadata/Engine Split for Frontend/Backend Boundary | In Progress | `integrations/graph`, `ui-decorators` | [06](./06-graph.md) |
| [DECAF-36](../specifications/DECAF_36.md) | Graph Canvas Save/Auto-Save & Undo/Redo | In Progress | `for-angular`, `for-nest` | [06](./06-graph.md) |
| [DECAF-37](../specifications/DECAF_37.md) | Fabric Mirror Gating | Completed | `for-fabric` | [07](./07-fabric.md) |
| [DECAF-38](../specifications/DECAF_38.md) | Integrations Object Loader Framework | Draft | `integrations` | [08](./08-platform-services.md) |
| [DECAF-39](../specifications/DECAF_39.md) | Feature Flags, Feature Scoping, and UI/Endpoint Visibility | Draft | `integrations` | [08](./08-platform-services.md) |
| [DECAF-40](../specifications/DECAF_40.md) | BI Dashboard Embed Plugins (Kibana & Superset) | In Progress | `integrations`, `for-angular` | [10](./10-integrations-extras.md) |
| [DECAF-41](../specifications/DECAF_41.md) | Kibana Index Pattern Builder | Completed | `integrations`, `logging` | [10](./10-integrations-extras.md) |
| [DECAF-42](../specifications/DECAF_42.md) | Controlled SSE Subscriptions for for-http and for-nest | Completed | `for-http`, `for-nest` | [03](./03-http-server-nest.md) |
| [DECAF-43](../specifications/DECAF_43.md) | Keycloak Realm Brokering and End-to-End Auth Flow Matrix | Completed | `integrations` | [04](./04-authorization.md) |
| [DECAF-44](../specifications/DECAF_44.md) | for-angular Cron Selector Web Component | Completed | `for-angular` | [10](./10-integrations-extras.md) |
| [DECAF-45](../specifications/DECAF_45.md) | User Request Handling Engine | In Progress | `ui-decorators`, `integrations`, `for-angular` | [09](./09-agent-orchestration.md) |
| [DECAF-46](../specifications/DECAF_46.md) | Jest Xray Teardown Utility Port | Completed | `utils` | [10](./10-integrations-extras.md) |
| [DECAF-47](../specifications/DECAF_47.md) | for-fabric Mirror Allow Predicate | In Progress | `for-fabric` | [07](./07-fabric.md) |
| [DECAF-48](../specifications/DECAF_48.md) | Graph Engine Logging Display & Visual Run Feedback | In Progress | `for-angular`, `integrations`, `for-nest` | [06](./06-graph.md) |

`*` Status with known inconsistencies — see [11 — Overlaps & Contradictions](./11-overlaps-contradictions.md) (B5, B6, B22).

**Excluded from scope** (mcp-server): DECAF-16, DECAF-31, and the mcp-server CLI boot parts of DECAF-17.

Back to [README](./README.md).
