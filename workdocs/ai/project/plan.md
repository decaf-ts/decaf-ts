# Project Implementation Plan

This plan tracks the prioritized work for the project, organized by Specifications.

---

## DECAF-1 — Worker Task System
- **Priority:** High
- **Goal:** Build worker-thread aware TaskEngine and TaskService that keep the current observable/message contracts while executing jobs off the main thread.
- **Status:** Planned
- **Link:** [Specification Details](./specifications/DECAF_1.md)
- **Tasks:**
  - [ ] [TASK-1](./tasks/TASK_1.md): Worker-aware Task Engine - Pending
  - [ ] [TASK-2](./tasks/TASK_2.md): Worker Task Service & Pool - Pending

---

## DECAF-2 — Fabric Legacy Peer Selection
- **Priority:** Medium
- **Goal:** Ensure the legacy gateway submission picks `legacyMspCount` unique mapped peers for each MSP so manual overrides scale when multiple endorsers exist.
- **Status:** Completed
- **Link:** [Specification Details](./specifications/DECAF_2.md)
- **Tasks:**
  - [x] [TASK-3](./tasks/TASK_3.md): Honor `legacyMspCount` when compiling legacy peer list - Completed
  - [x] [TASK-4](./tasks/TASK_4.md): Add tests validating legacy peer selection count/variance - Completed

---

_Each section above must be updated immediately after the associated implementation finishes._
