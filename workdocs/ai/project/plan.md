# Project Implementation Plan

This plan tracks the prioritized work for the project, organized by Specifications.

---

## DECAF-1 — Worker Task System
- **Priority:** High
- **Goal:** Build worker-thread aware TaskEngine and TaskService that keep the current observable/message contracts while executing jobs off the main thread.
- **Status:** Completed — worker execution with FsAdapter coordination implemented and tested; 8 integration tests passing.
- **Link:** [Specification Details](./specifications/DECAF_1.md)
- **Tasks:**
  - [x] [TASK-1](./specifications/tasks/TASK_1.md): Worker-aware Task Engine (worker-pool regression tests added; context helpers documented).
  - [x] [TASK-2](./specifications/tasks/TASK_2.md): Worker Task Service & Pool (configuration coverage added; docs updated).
  - [x] [TASK-FS](./specifications/tasks/TASK_FS.md): FsAdapter Worker Coordination (filesystem persistence coordination validated).

---

## DECAF-2 — Fabric Legacy Peer Selection
- **Priority:** Medium
- **Goal:** Ensure the legacy gateway submission picks `legacyMspCount` unique mapped peers for each MSP so manual overrides scale when multiple endorsers exist.
- **Status:** In Progress — gateway override/mirror behaviour remains unimplemented; specifications must be brought up to date with current code.
- **Link:** [Specification Details](./specifications/DECAF_2.md)
- **Tasks:**
  - [ ] [TASK-3](./specifications/tasks/TASK_3.md): Honor `legacyMspCount` when compiling legacy peer list (pending full adapter changes + verification).
  - [ ] [TASK-4](./specifications/tasks/TASK_4.md): Add tests validating legacy peer selection count/variance (needs refreshed coverage once implementation lands).

---

## DECAF-3 — Filesystem Adapter
- **Priority:** High
- **Goal:** Provide an on-disk adapter in `core/src/fs` that mirrors `RamAdapter` behaviour while persisting data across restarts.
- **Status:** Completed — FsDispatch watch synchronization and filesystem locking now guarantee multi-process consistency in practice.
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
- **Status:** In Progress — overrides exist or are documented for many modules, but several analyses/implementations remain pending.
- **Link:** [Specification Details](./specifications/DECAF_4.md)
- **Tasks:**
  - [x] [TASK-7](./specifications/tasks/TASK_7.md): Implement Builder Extensions for New Decorators.
  - [x] [TASK-8](./specifications/tasks/TASK_8.md): Document Decorator Coverage Changes.
  - [x] [TASK-9](./specifications/tasks/TASK_9.md): Analyze `decorator-validation` module for builder overrides.
  - [ ] [TASK-10](./specifications/tasks/TASK_10.md): Analyze `db-decorators` module for builder overrides.
  - [x] [TASK-11](./specifications/tasks/TASK_11.md): Analyze `transcational-decorators` module for builder overrides.
  - [ ] [TASK-13](./specifications/tasks/TASK_13.md): Analyze `core` module for builder overrides.
  - [ ] [TASK-14](./specifications/tasks/TASK_14.md): Analyze `ui-decorators` module for builder overrides.
  - [ ] [TASK-15](./specifications/tasks/TASK_15.md): Analyze `crypto` module for builder overrides.
  - [x] [TASK-16](./specifications/tasks/TASK_16.md): Analyze `cli` module for builder overrides.
  - [x] [TASK-18](./specifications/tasks/TASK_18.md): Analyze `for-couchdb` module for builder overrides.
  - [x] [TASK-19](./specifications/tasks/TASK_19.md): Analyze `for-nano` module for builder overrides.
  - [x] [TASK-20](./specifications/tasks/TASK_20.md): Analyze `for-pouch` module for builder overrides.
  - [x] [TASK-21](./specifications/tasks/TASK_21.md): Analyze `for-typeorm` module for builder overrides.
  - [x] [TASK-22](./specifications/tasks/TASK_22.md): Analyze `for-http` module for builder overrides.
  - [ ] [TASK-23](./specifications/tasks/TASK_23.md): Analyze `for-nest` module for builder overrides.
  - [x] [TASK-24](./specifications/tasks/TASK_24.md): Analyze `for-fabric` module for builder overrides.

---

## DECAF-5 — FabricClientAdapter Object Instantiation
- **Priority:** High
- **Goal:** Ensure FabricClientAdapter's repository layer consistently returns properly instantiated model objects across all query operations, not just JSON objects.
- **Status:** Draft — audit and fix needed for statement() and query methods in FabricClientRepository.
- **Link:** [Specification Details](./specifications/DECAF_5.md)
- **Tasks:**
  - [ ] [TASK-27](./specifications/tasks/TASK_27.md): Audit FabricClientRepository query methods.
  - [ ] [TASK-28](./specifications/tasks/TASK_28.md): Fix statement() instantiation logic.
  - [ ] [TASK-29](./specifications/tasks/TASK_29.md): Add instantiation tests for all queries.
  - [ ] [TASK-30](./specifications/tasks/TASK_30.md): Document object instantiation behavior.

---

## DECAF-6 — TypeORM Multi-Database Support Refactoring
- **Priority:** High
- **Goal:** Refactor TypeORM adapter to support all TypeORM database drivers (PostgreSQL, MySQL, SQLite, SQL Server, etc.) instead of PostgreSQL-specific implementation.
- **Status:** Draft — multi-driver support and unified query building needed.
- **Link:** [Specification Details](./specifications/DECAF_6.md)
- **Tasks:**
  - [ ] [TASK-31](./specifications/tasks/TASK_31.md): Add TypeORMDriver enum and driver detection.
  - [ ] [TASK-32](./specifications/tasks/TASK_32.md): Refactor static methods for multi-driver support.
  - [ ] [TASK-33](./specifications/tasks/TASK_33.md): Add TypeORMEventMode enum and dispatch modes.
  - [ ] [TASK-34](./specifications/tasks/TASK_34.md): Implement database triggers for each driver.
  - [ ] [TASK-35](./specifications/tasks/TASK_35.md): Implement event listener for multi-instance support.
  - [ ] [TASK-36](./specifications/tasks/TASK_36.md): Refactor TypeORMStatement to use TypeORM query API.
  - [ ] [TASK-37](./specifications/tasks/TASK_37.md): Update repository methods to use unified query building.
  - [ ] [TASK-38](./specifications/tasks/TASK_38.md): Add tests for each database driver.
  - [ ] [TASK-39](./specifications/tasks/TASK_39.md): Document driver differences and configuration.

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

_Each section above must be updated immediately after the associated implementation finishes._
