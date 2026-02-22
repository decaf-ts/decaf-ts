# DECAF-5: FabricClientAdapter Object Instantiation

**Status:** Draft  
**Priority:** High  
**Owner:** decaf-dev

## 1. Overview
Ensure that the FabricClientAdapter's repository layer consistently returns properly instantiated model objects (class instances) rather than plain JSON objects across all query operations, including `list`, `find`, `paginate`, and statement execution. Currently, some operations return raw JSON objects while others create instances, leading to inconsistent behavior and lost class methods/symbolic properties.

## 2. Goals
*   [ ] Audit all repository query methods (list, find, page, statement, aggregate methods) in FabricClientRepository to identify where plain objects are returned instead of class instances
*   [ ] Verify FabricClientAdapter's `statement()` method and all query routes instantiate models correctly
*   [ ] Add comprehensive tests covering all query operations to validate proper instantiation
*   [ ] Document the expected behavior: all queries return class instances when a model class is associated

## 3. User Stories / Requirements
*   **US-1:** As a developer using FabricClientRepository, I want all query operations (list, find, page, etc.) to return properly instantiated model objects so I can call instance methods and rely on constructor-injected behavior.
*   **US-2:** As a maintainer, I want consistent return types across all repository methods so I don't need to check whether I received an instance or plain object.
*   **Req-1:** Every repository method that returns `M[]` or `M` must instantiate models using `new this.class(record)` when the adapter returns raw JSON.
*   **Req-2:** Aggregation methods (countOf, maxOf, minOf, avgOf, sumOf, distinctOf, groupOf) that return non-model data should continue to return primitives or structured aggregates, not model instances.
*   **Req-3:** Paginated results must wrap each item in the `data` array with `new this.class(d)` before returning the page.

## 4. Architecture & Design

### Current Behavior
FabricClientRepository's `statement()` method (lines 206-244) contains instantiation logic:
- Array results: maps each item through a conditional that checks for `CouchDBKeys.TABLE` and creates instances only if the table matches
- Single results: creates instance only if `CouchDBKeys.TABLE` matches
- Pages: wraps `data` array items with `new this.class(d)`

**Problem:** The `CouchDBKeys.TABLE` check assumes theFabric fabric chaincode returns the table key, but this may not always be present or correctly set, causing some results to fall through as plain objects.

### Fix Strategy
1. Remove or soften the `CouchDBKeys.TABLE` check and instead instantiate for all non-aggregate queries when a model class is configured
2. For aggregate methods, explicitly skip instantiation
3. Add helper method to verify/convert results

### Implementation Steps
- Add `shouldInstantiate(modelClass: Constructor<M>, record: any): boolean` helper
- Update `statement()` to unconditionally instantiate when class is set (unless explicitly disabled)
- Update aggregate methods (countOf, maxOf, minOf, avgOf, sumOf, distinctOf, groupOf) to document they return primitives
- Add test suite covering all query paths

## 5. Tasks Breakdown
| ID           | Task Name                                  | Priority | Status  | Dependencies |
|:-------------|:-------------------------------------------|:---------|:--------|:-------------|
| TASK-27      | Audit FabricClientRepository query methods | High     | Pending | -            |
| TASK-28      | Fix statement() instantiation logic        | High     | Pending | TASK-27      |
| TASK-29      | Add instantiation tests for all queries    | High     | Pending | TASK-28      |
| TASK-30      | Document object instantiation behavior     | Medium   | Pending | TASK-29      |

## 6. Open Questions / Risks
*   Should we support a configuration flag to disable automatic instantiation for performance reasons when working with large result sets?
*   How should we handle cases where the fabric chaincode returns data without the expected table metadata? Should we:
  * Always instantiate when a model class is set?
  * Provide a fallback that tries to detect model shape?
  * Require the chaincode to include table metadata?
*   Are there existing consumers relying on the current behavior of receiving plain objects? Would this be a breaking change?

## 7. Results & Artifacts
*   Updated `FabricClientRepository.ts:statement()` method with consistent instantiation logic
*   New unit tests in `for-fabric/tests/unit/client-fabric-client-repository.test.ts` covering:
  * `listBy()` returns instances
  * `findBy()` returns instances
  * `page()` returns page with instance-wrapped data
  * `statement()` returns instances for arrays and objects
  * `countOf()`, `maxOf()`, etc. return primitives (no instantiation)
*   Updated API documentation in repository methods noting instantiation guarantees
*   Updated spec/plan to reflect DECAF-5 completion

## 8. Current Status Notes
*   Initial audit needed to map all query flows through `FabricClientRepository`
*   Tests currently cover only basic CRUD via adapter, not query methods
*   The `statement()` method has partial instantiation logic but relies on table metadata being present
