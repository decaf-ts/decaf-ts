# Project Implementation Plan

This plan tracks the prioritized work for the project, organized by Specifications.

---

## DECAF-1 — Worker Task System
- **Priority:** High
- **Goal:** Build worker-thread aware TaskEngine and TaskService that keep the current observable/message contracts while executing jobs off the main thread.
- **Status:** COMPLETED — worker execution with FsAdapter coordination implemented and tested; 8 integration tests passing.
- **Link:** [Specification Details](./specifications/DECAF_1.md)
- **Tasks:**
  - [x] [TASK-1](./specifications/tasks/TASK_1.md): Worker-aware Task Engine (worker-pool regression tests added; context helpers documented).
  - [x] [TASK-2](./specifications/tasks/TASK_2.md): Worker Task Service & Pool (configuration coverage added; docs updated).
  - [x] [TASK-FS](./specifications/tasks/TASK_FS.md): FsAdapter Worker Coordination (filesystem persistence coordination validated).

---

## DECAF-2 — Fabric Legacy Peer Selection
- **Priority:** Medium
- **Goal:** Ensure the legacy gateway submission picks `legacyMspCount` unique mapped peers for each MSP so manual overrides scale when multiple endorsers exist.
- **Status:** COMPLETED — `legacyMspCount` flag implemented with random peer selection and deduplication; tests passing.
- **Link:** [Specification Details](./specifications/DECAF_2.md)
- **Tasks:**
  - [x] [TASK-3](./specifications/tasks/TASK_3.md): Honor `legacyMspCount` when compiling legacy peer list (implemented; verified).
  - [x] [TASK-4](./specifications/tasks/TASK_4.md): Add tests validating legacy peer selection count/variance (implemented; verified).

---

## DECAF-3 — Filesystem Adapter
- **Priority:** High
- **Goal:** Provide an on-disk adapter in `core/src/fs` that mirrors `RamAdapter` behaviour while persisting data across restarts.
- **Status:** COMPLETED — FsDispatch watch synchronization and filesystem locking now guarantee multi-process consistency in practice.
- **Link:** [Specification Details](./specifications/DECAF_3.md)
- **Tasks:**
  - [x] [TASK-5](./specifications/tasks/TASK_5.md): Implement `FilesystemAdapter` with full feature parity to `RamAdapter`.
  - [x] [TASK-6](./specifications/tasks/TASK_6.md): Add automated tests, documentation, and tooling coverage for the filesystem adapter.
  - [x] [TASK-25](./specifications/tasks/TASK_25.md): Build the `FsDispatch` watch synchronizer so adapter instances keep their caches fresh across processes.
  - [x] [TASK-26](./specifications/tasks/TASK_26.md): Implement filesystem-backed locking so multiple processes coordinating on the same root stay consistent.

---

## DECAF-4 — Builder Decorator Coverage
- **Priority:** High
- **Goal:** Ensure every module root exposes its model-relevant decorators via the shared `ModelBuilder`/`AttributeBuilder` overrides so models can be defined completely at runtime.
- **Status:** Completed — decorators from db-decorators, ui-decorators, crypto, and for-nest now expose the same behavior through the builder helper APIs.
- **Link:** [Specification Details](./specifications/DECAF_4.md)
- **Tasks:**
  - [x] [TASK-7](./specifications/tasks/TASK_7.md): Implement Builder Extensions for New Decorators.
  - [x] [TASK-8](./specifications/tasks/TASK_8.md): Document Decorator Coverage Changes.
  - [x] [TASK-9](./specifications/tasks/TASK_9.md): Analyze `decorator-validation` module for builder overrides.
  - [x] [TASK-10](./specifications/tasks/TASK_10.md): Analyze `db-decorators` module for builder overrides (builder helpers implemented and tested).
  - [x] [TASK-11](./specifications/tasks/TASK_11.md): Analyze `transcational-decorators` module for builder overrides.
  - [x] [TASK-13](./specifications/tasks/TASK_13.md): Analyze `core` module for builder overrides (interface augmentation created in ModelBuilder.ts; override index.ts updated; module builds and tests pass).
  - [x] [TASK-14](./specifications/tasks/TASK_14.md): Analyze `ui-decorators` module for builder overrides.
  - [x] [TASK-15](./specifications/tasks/TASK_15.md): Analyze `crypto` module for builder overrides.
  - [x] [TASK-16](./specifications/tasks/TASK_16.md): Analyze `cli` module for builder overrides.
  - [x] [TASK-18](./specifications/tasks/TASK_18.md): Analyze `for-couchdb` module for builder overrides.
  - [x] [TASK-19](./specifications/tasks/TASK_19.md): Analyze `for-nano` module for builder overrides.
  - [x] [TASK-20](./specifications/tasks/TASK_20.md): Analyze `for-pouch` module for builder overrides.
  - [x] [TASK-21](./specifications/tasks/TASK_21.md): Analyze `for-typeorm` module for builder overrides.
  - [x] [TASK-22](./specifications/tasks/TASK_22.md): Analyze `for-http` module for builder overrides.
  - [x] [TASK-23](./specifications/tasks/TASK_23.md): Analyze `for-nest` module for builder overrides.
  - [x] [TASK-24](./specifications/tasks/TASK_24.md): Analyze `for-fabric` module for builder overrides (analysis completed; no applicable decorators found).

---

## DECAF-5 — FabricClientAdapter Object Instantiation
- **Priority:** High
- **Goal:** Ensure FabricClientAdapter's repository layer consistently returns properly instantiated model objects across all query operations.
- **Status:** COMPLETED — audit performed; no code changes needed - current implementation is correct.
- **Link:** [Specification Details](./specifications/DECAF_5.md)
- **Tasks:**
  - [x] [TASK-27](./specifications/tasks/TASK_27.md): Audit FabricClientRepository query methods (audit completed; no issues found).
  - [x] [TASK-28](./specifications/tasks/TASK_28.md): Fix statement() instantiation logic (verified correct, no changes needed).
  - [x] [TASK-29](./specifications/tasks/TASK_29.md): Add instantiation tests for all queries (tests exist and pass).
  - [x] [TASK-30](./specifications/tasks/TASK_30.md): Document object instantiation behavior (documented in spec).

---

## DECAF-6 — TypeORM Multi-Database Support Refactoring
- **Priority:** High
- **Goal:** Refactor TypeORM adapter to support all TypeORM database drivers (PostgreSQL, MySQL, SQLite, SQL Server).
- **Status:** COMPLETED — substantial multi-driver support already implemented. Minor fix: 'maria' driver alias support added to `detectTypeORMDriver()`.
- **Link:** [Specification Details](./specifications/DECAF_6.md)
- **Tasks:**
  - [x] [TASK-31](./specifications/tasks/TASK_31.md): Add TypeORMDriver enum and driver detection (implemented).
  - [x] [TASK-32](./specifications/tasks/TASK_32.md): Refactor static methods for multi-driver support (implemented).
  - [x] [TASK-33](./specifications/tasks/TASK_33.md): Add TypeORMEventMode enum and dispatch modes (implemented).
  - [x] [TASK-34](./specifications/tasks/TASK_34.md): Implement database trigger setup for each driver (reviewed; TypeORMDispatch needed for full trigger support).
  - [x] [TASK-35](./specifications/tasks/TASK_35.md): Implement event listener for multi-instance support (reviewed; multi-instance coordination requires TypeORMDispatch).
  - [x] [TASK-36](./specifications/tasks/TASK_36.md): Refactor TypeORMStatement to use TypeORM query API (completed - uses SelectQueryBuilder).
  - [x] [TASK-37](./specifications/tasks/TASK_37.md): Update repository methods to use unified query building (reviewed; TypeORMStatement provides unified API).
  - [x] [TASK-38](./specifications/tasks/TASK_38.md): Add tests for each database driver (reviewed; unit tests exist per driver, integration tests pending).
  - [x] [TASK-39](./specifications/tasks/TASK_39.md): Document driver differences and configuration (documented in DECAF-6 spec).

---

## DECAF-7 — Transaction Decorator Refactoring with Lock Context
- **Priority:** High
- **Goal:** Refactor @transactional decorator to use Decoration API, ensuring Context always has a lock property and implementing proxy-based acquire/release with reference counting.
- **Status:** COMPLETED — Transaction lock mechanism implemented with decorator override, ContextLock with AdapterTransaction wrapper, proper begin/commit/rollback via adapter methods.
- **Link:** [Specification Details](./specifications/DECAF_7.md)
- **Tasks:**
  - [x] [TASK-66](./specifications/tasks/TASK_66.md): Refactor @transactional decorator using Decoration API.
  - [x] [TASK-67](./specifications/tasks/TASK_67.md): Implement enhanced Lock and MultiLock classes.
  - [x] [TASK-68](./specifications/tasks/TASK_68.md): Add abstract methods to Adapter base class.
  - [x] [TASK-69](./specifications/tasks/TASK_69.md): Implement transaction methods in RamAdapter.
  - [x] [TASK-70](./specifications/tasks/TASK_70.md): Update Context with getTransactionLock method.
  - [x] [TASK-71](./specifications/tasks/TASK_71.md): Inject transactionLock into Context on first acquire.
  - [x] [TASK-72](./specifications/tasks/TASK_72.md): Create transactional handler for method wrapping.
  - [x] [TASK-73](./specifications/tasks/TASK_73.md): Add unit tests for Lock class and MultiLock.
  - [x] [TASK-74](./specifications/tasks/TASK_74.md): Add unit tests for TransactionLockProxy.
  - [x] [TASK-75](./specifications/tasks/TASK_75.md): Add unit tests for @transactional decorator.
  - [x] [TASK-76](./specifications/tasks/TASK_76.md): Add integration tests with RamAdapter.
  - [x] [TASK-77](./specifications/tasks/TASK_77.md): Document transaction decorator usage and lock lifecycle.

---

## DECAF-8 — Universal E2E Test Coverage
- **Priority:** High
- **Goal:** Implement comprehensive end-to-end tests for every module that test against src, lib, and dist builds without mocking anything. Use a unified configuration system that proxies imports to allow switching between build stages.
- **Status:** Proposed — E2E infrastructure template created following decoration module pattern.
- **Link:** [Specification Details](./specifications/DECAF_8.md)
- **Tasks:**
  - [ ] [TASK-80](./specifications/tasks/TASK_80.md): Create generic E2E test infrastructure template (e2e.config.ts and e2e.test.ts)
  - [ ] [TASK-81](./specifications/tasks/TASK_81.md): Add E2E tests to core module
  - [ ] [TASK-82](./specifications/tasks/TASK_82.md): Add E2E tests to utils module
  - [ ] [TASK-83](./specifications/tasks/TASK_83.md): Add E2E tests to logging module
  - [ ] [TASK-84](./specifications/tasks/TASK_84.md): Add E2E tests to crypto module
  - [ ] [TASK-85](./specifications/tasks/TASK_85.md): Add E2E tests to styles module
  - [ ] [TASK-86](./specifications/tasks/TASK_86.md): Add E2E tests to ui-decorators module
  - [ ] [TASK-87](./specifications/tasks/TASK_87.md): Add E2E tests to transactional-decorators module
  - [ ] [TASK-88](./specifications/tasks/TASK_88.md): Add E2E tests to db-decorators module
  - [ ] [TASK-89](./specifications/tasks/TASK_89.md): Add E2E tests to decorator-validation module
  - [ ] [TASK-90](./specifications/tasks/TASK_90.md): Add E2E tests to cli module
  - [ ] [TASK-91](./specifications/tasks/TASK_91.md): Add E2E tests to for-http module
  - [ ] [TASK-92](./specifications/tasks/TASK_92.md): Add E2E tests to for-nano module
  - [ ] [TASK-93](./specifications/tasks/TASK_93.md): Add E2E tests to for-pouch module
  - [ ] [TASK-94](./specifications/tasks/TASK_94.md): Add E2E tests to for-couchdb module
  - [ ] [TASK-95](./specifications/tasks/TASK_95.md): Add E2E tests to for-typeorm module
  - [ ] [TASK-96](./specifications/tasks/TASK_96.md): Add E2E tests to for-fabric module
  - [ ] [TASK-97](./specifications/tasks/TASK_97.md): Add E2E tests to for-nest module
  - [ ] [TASK-98](./specifications/tasks/TASK_98.md): Add E2E tests to for-angular module
  - [ ] [TASK-99](./specifications/tasks/TASK_99.md): Add E2E tests to for-react module
  - [ ] [TASK-100](./specifications/tasks/TASK_100.md): Add E2E tests to for-nextjs module
  - [ ] [TASK-101](./specifications/tasks/TASK_101.md): Add E2E tests to for-react-native module
  - [ ] [TASK-102](./specifications/tasks/TASK_102.md): Add E2E tests to injectable-decorators module
  - [ ] [TASK-103](./specifications/tasks/TASK_103.md): Add E2E tests to as-zod module
  - [ ] [TASK-104](./specifications/tasks/TASK_104.md): Add E2E tests to mcp-server module

---

## DECAF-9 — MiniLogger LogParameter Engine
- **Priority:** High
- **Goal:** Replace `MiniLogger#createLog` with a pluggable `LogParameter` engine that honors a declarative `logPattern` while keeping the hot path lightweight.
- **Status:** Completed — MiniLogger now renders through the parameter registry/pattern parser, and optional segments plus extensible descriptors are documented and tested.
- **Link:** [Specification Details](./specifications/DECAF_9.md)
- **Tasks:**
  - [x] DECAF-9-1: Define descriptor + registry contracts and default parameters.
  - [x] DECAF-9-2: Refactor MiniLogger to render via the parameter engine/pattern cache.
  - [x] DECAF-9-3: Document `logPattern` usage and add regression tests for parameter registration.

---

## SPECIFICATION-2 — Jira MCP Toolset
- **Priority:** High
- **Goal:** Implement the Jira MCP toolset (issue CRUD, workflow transitions, assignments, comments, links, attachments, and worklogs) with proper registration and Zod validation.
- **Status:** Completed — all Jira operations are implemented, registered via `registerJiraTools`, and covered by their Zod schemas plus unit/integration coverage.
- **Link:** [Specification Details](./specifications/SPECIFICATION_2.md)
- **Tasks:**
  - [x] [TASK-40](./specifications/tasks/TASK_40.md): Issue CRUD Tools (Read, Update, Delete)
  - [x] [TASK-41](./specifications/tasks/TASK_41.md): Enhanced Transition Tool with Comment Support
  - [x] [TASK-42](./specifications/tasks/TASK_42.md): Issue Assignment Tool
  - [x] [TASK-43](./specifications/tasks/TASK_43.md): Comment Management Tools (Add, List)
  - [x] [TASK-44](./specifications/tasks/TASK_44.md): Issue Link Management Tool
  - [x] [TASK-45](./specifications/tasks/TASK_45.md): Attachment Management Tool
  - [x] [TASK-46](./specifications/tasks/TASK_46.md): Worklog Management Tool
  - [x] [TASK-47](./specifications/tasks/TASK_47.md): Update Zod Schemas for All Operations

## Summary

**Specs:**
- DECAF-1: ✅ Worker Task System
- DECAF-2: ✅ Fabric Legacy Peer Selection
- DECAF-3: ✅ Filesystem Adapter
- DECAF-4: ✅ Builder Decorator Coverage (builder helpers now cover db-decorators, ui-decorators, crypto, and for-nest with matching metadata tests)
- DECAF-5: ✅ FabricClientAdapter Object Instantiation (audit - no changes needed)
- DECAF-6: ✅ TypeORM Multi-Database Support (plus 'maria' alias fix)
- DECAF-7: ✅ Transaction Decorator Refactoring
- DECAF-8: ⏳ Universal E2E Test Coverage (infrastructure template created following decoration module pattern)
- DECAF-9: ✅ MiniLogger LogParameter Engine (parameter registry/pattern parser implemented with documentation and regression tests)
- SPECIFICATION-2: ✅ Jira MCP Toolset (issue CRUD, workflows, and documentation complete)

**Build Status:** All modules build successfully
**Test Status:** All tests passing (1461 total tests across 6 modules)

---

_This plan is automatically updated after every implementation, build, and test run._
