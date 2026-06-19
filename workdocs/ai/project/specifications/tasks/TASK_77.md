# TASK_77: Document transaction decorator usage and lock lifecycle

**Task ID:** TASK_77  
**Priority:** Medium  
**Status:** Completed  
**Estimated Time:** 4 hours  
**Reference:** DECAF_7 (Section 4 Architecture & Design, Section 7 Results & Artifacts)

## Description
Document transaction decorator usage patterns, lock lifecycle, and integration with adapters, in each affected module's own "How to Use" guide (`workdocs/5-HowToUse.md`) rather than a standalone doc file - keeping it next to the rest of that module's usage documentation and subject to the same `npm run docs` generation pipeline.

## Requirements (from DECAF_7, as implemented - supersedes the original draft's hierarchical-locking/`maxConcurrent` scope, which was dropped per Section 2)
- Document `@transactional()` usage and the `@decaf-ts/core` vs `@decaf-ts/transactional-decorators` import trap
- Document lock lifecycle (begin/commit/rollback, who calls what and when)
- Document nested transaction behavior (depth, single begin/commit, single rollback regardless of nesting depth)
- Document the adapter integration/override point (`Adapter.transactionLock()`, `ContextLock` subclassing)
- Document a real native-transaction adapter end-to-end (`for-typeorm`'s `TypeORMContextLock`), including concurrent-transaction/isolation behavior

## Deliverables
- [x] `core/workdocs/5-HowToUse.md` — new "Transactions (`@transactional`)" section: usage example with nested calls, lifecycle/rollback semantics, and a "How adapters provide native transactions" subsection showing the `ContextLock` override point
- [x] `for-typeorm/workdocs/5-HowToUse.md` — new "Transactions (`@transactional` backed by real Postgres transactions)" section: worked example with nested `@transactional()` calls and real CRUD, an explanation of what happens under the hood (`QueryRunner`/`EntityManager` routing), a "Concurrent transactions and Postgres isolation" subsection (READ COMMITTED visibility, row-lock blocking), and a caution note about the positional-argument footgun found in TASK-164
- [x] Hierarchical locking levels (none/adapter/table/record) and `maxConcurrent` configuration — explicitly **not** documented; dropped from the design entirely (Section 2, last unchecked item) and never implemented

## Dependencies
- TASK_75 (@transactional decorator tests)
- TASK_76 (integration tests with RamAdapter)
- TASK-161/162/163/164 (TypeORM native lock implementation + tests - the worked examples in the `for-typeorm` doc are drawn directly from these)

## Blocked By
- None

## Notes
- Superseded the original plan of a dedicated `core/docs/TRANSACTIONS.md` file with diagrams - the project's existing convention keeps usage documentation in each module's `workdocs/5-HowToUse.md`, compiled into that module's README via `npm run docs`. No `core/docs/TRANSACTIONS.md` was created.
