# Project Implementation Plan

This plan tracks the prioritized work for the project, organized by Specifications.

---

## DECAF-1 — Worker Task System
- **Priority:** High
- **Goal:** Build worker-thread aware TaskEngine and TaskService that keep the current observable/message contracts while executing jobs off the main thread.
- **Status:** In Progress — worker execution exists but lacks dedicated automated coverage, documentation refresh, and configuration validation.
- **Link:** [Specification Details](./specifications/DECAF_1.md)
- **Tasks:**
  - [ ] [TASK-1](./tasks/TASK_1.md): Worker-aware Task Engine (re-opened: add worker-pool regression tests, ensure context helpers are documented).
  - [ ] [TASK-2](./tasks/TASK_2.md): Worker Task Service & Pool (re-opened: add configuration coverage + docs reflecting current behaviour).

---

## DECAF-2 — Fabric Legacy Peer Selection
- **Priority:** Medium
- **Goal:** Ensure the legacy gateway submission picks `legacyMspCount` unique mapped peers for each MSP so manual overrides scale when multiple endorsers exist.
- **Status:** In Progress — gateway override/mirror behaviour remains unimplemented; specifications must be brought up to date with current code.
- **Link:** [Specification Details](./specifications/DECAF_2.md)
- **Tasks:**
  - [ ] [TASK-3](./tasks/TASK_3.md): Honor `legacyMspCount` when compiling legacy peer list (pending full adapter changes + verification).
  - [ ] [TASK-4](./tasks/TASK_4.md): Add tests validating legacy peer selection count/variance (needs refreshed coverage once implementation lands).

---

## DECAF-3 — Filesystem Adapter
- **Priority:** High
- **Goal:** Provide an on-disk adapter in `core/src/fs` that mirrors `RamAdapter` behaviour while persisting data across restarts.
- **Status:** In Progress — basic adapter/tests shipped, but FsDispatch synchronization and filesystem-wide locking are still pending.
- **Link:** [Specification Details](./specifications/DECAF_3.md)
- **Tasks:**
  - [x] [TASK-5](./specifications/tasks/TASK_5.md): Implement `FilesystemAdapter` with full feature parity to `RamAdapter`.
  - [x] [TASK-6](./specifications/tasks/TASK_6.md): Add automated tests, documentation, and tooling coverage for the filesystem adapter.
  - [ ] [TASK-25](./specifications/tasks/TASK_25.md): Build the `FsDispatch` watch synchronizer so adapter instances keep their caches fresh across processes.
  - [ ] [TASK-26](./specifications/tasks/TASK_26.md): Implement filesystem-backed locking so multiple processes coordinating on the same root stay consistent.

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

_Each section above must be updated immediately after the associated implementation finishes._
