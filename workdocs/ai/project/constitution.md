# CONSTITUTION

This document outlines the structure, conventions, and architecture of the project to ensure a Large Language Model (LLM) can effectively assist in its development.

## 00. Modules (roots)

-   `./decoration` eg `@decaf-ts/decoration`: decoration library, allowing for overridable and extensible decorators and a Metadata store.
-   `./utils` eg `@decaf-ts/utils`: development/testing utils library.
-   `./logging` eg `@decaf-ts/logging`: logging wrappers library.
-   `./decorator-validation` eg `@decaf-ts/decorator-validation`: model management mechanisms, base decorators, validation, hashing, serialization
-   `./db-decorators` eg `@decaf-ts/db-decorators`: expands decorators-validation with a Repository implementation and decorators/handlers to attached to CRUD hooks on the repository.
-   `./transcational-decorators` eg `@decaf-ts/transactional-decorators`: exposes basic locking and transaction decorators.
-   `./injectable-decorators` eg `@decaf-ts/injectable-decorators`: dependency injection decorators.
-   `./core` eg `@decaf-ts/core`: core module of the framework. Exposes extensible Adapter implementation and expands Repository to allow for persistence layer agnostic CRUD/Bulk/query
-   `./ui-decorators` eg `@decaf-ts/ui-decorators`: exposes UI decorators and base Rendering Engine.
-   `./crypto` eg `@decaf-ts/crypto`: browser/node crypo wrappers and encryption decoration.
-   `./cli` eg `@decaf-ts/cli`: cli wrapper decaf global implementation.
-   `./as-zod` eg `@decaf-ts/as-zod`: zod format converter.
-   `./for-couchdb` eg `@decaf-ts/for-couchdb`: CouchDB abstract implementation of core.
-   `./for-nano` eg `@decaf-ts/for-nano`: nano based concrete implementation for CouchDB.
-   `./for-pouch` eg `@decaf-ts/for-pouch`: pouchdb concrete implementation for CouchDB.
-   `./for-typeorm` eg `@decaf-ts/for-typeorm`: TypeORM concrete implementation for SQL based persistence.
-   `./for-http` eg `@decaf-ts/for-http`: Client HTTP concrete implementation (REST client).
-   `./for-nest` eg `@decaf-ts/for-nest`: Server (NestJS) HTTP concrete implementation (REST server).
-   `./for-fabric` eg `@decaf-ts/for-fabric`: Hyperledger Fabric concrete implementation (Client and Server).
-   `./styles` eg `@decaf-ts/styles`: (S)CSS for the decaf framework.
-   `./for-angular` eg `@decaf-ts/for-angular`: concrete Angular implementation of the Rendering engine.
-   `./mcp-server` eg `@decaf-ts/mcp-server`: mcp-server for decaf coding.

## 00.5. Keys

-   **Specification Key:** `DECAF`
-   **Task Key:** `TASK`

## 0. Development Workflow - NON NEGOTIABLE

After every CODE (not documentation) change, you **must** run the following commands to ensure code quality and prevent regressions:

1.  **Lint:** `npm run lint`
2.  **Build:** `npm run build`
3.  **Test:** `npm run test` (Use targeted tests for specific changes).

(These must be run in the appropriate module root)

#### multi-module changes

1.  **link:** `npm run npm-link` if necessary, you can run this command to link all decaf modules (eg building the code in one, makes it immediatly available to all other that dependen on it);
2.  **unlink:** `npm run npm-unlink` reverts npm-link. this is a long running verbose command. be patient and forward output to dev/null. only exit code matters;

when link is on, if you do a change in a dependency, building that dependency makes it immedeatly available to all that depende on it

## 1. Core Philosophy

The project aims to unify Decaf as a decorator-first TypeScript platform where every layer—metadata, validation, repositories, adapters, and UI/infra helpers—speaks the same language. Models decorated via `decoration` and `decorator-validation` stay self-describing and validated; `db-decorators` and `core` orchestrate repository workflows (prepare→action→revert, observers, hooks) while adapters for CouchDB, Nano, Pouch, TypeORM, HTTP, and Fabric plug into real backends without breaking the surface contract. Auxiliary modules (logging, CLI, utils, transaction/DI decorators, crypto, as-zod, ui-decorators) provide the operational tooling, automation, and rendering layers so teams can build consistent CLI, backend, and UI experiences with minimal glue code.

### 1.1. CORE DESIGN INVARIANTS

These rules are **non-negotiable**.

1.  Every public API must preserve declarative metadata—decorators, models, repositories, and adapters share consistent metadata keys so adapters can operate without ad-hoc wiring.
2.  Persistence flows must follow the prepare→action→revert sequence with observable hooks so validation, logging, and error translation happen predictably across all adapters.

## 2. Core Decaf Architectural Patterns

### Service and Repository Pattern
*   **Services:** All business logic MUST be encapsulated in services. Every service class MUST be decorated with `@service()` from `@decaf-ts/core`.
*   **Persistence Services:** For every major data model, create a corresponding `<ModelName>Service` (e.g., `AccountService`). These services should extend a base `ModelService` which provides generic CRUD operations. All logic wrapping the repository's api should be handle dby these services.
*   **Repositories:** Data access is handled by repositories. A repository for a model can be injected into a service using the `@repository(<ModelName>)` decorator. Custom repository classes are only needed for complex, model-specific queries.  they can have their settings overriden via proxing (to change dbs, users, etc) via .override();
*   **Adapter:** adapters are abstractions over specific persistence layers providing a stable api for all. they can have their settings overriden via proxing (to change dbs, users, etc) via .for();
*   **Context:** for full traceability, scalability, all services/repositories for every method receive a Context via `...args: MaybeContextArgs<any>): ...` or `...args: ContextualArgs<any>): ...`  (these types come from `@decaf-ts/core`).

### Model Pattern
*   **Model:** Base class for all classes that need to be persisted or simply validated via decoration; classes that need to be persisted/serialized must be @model() decorated as well as have @table() @column(), relationship decorators and others from '@decaf-ts/core' decoration (as well as any specific adapter decoration)
*   **Validator:** custom decoration for models for specific purposes can be created using the existing patterns in @decaf-ts/decorator-validation, @decaf-ts/db-decorators and @decaf-ts/core' Validators MUST be decorated with @validator()

### Cross-Relationship Guardrail
When two models reference each other (e.g., `Character` → `Account` and `Account` → `Character`), break the implicit circular dependency by keeping exactly one side marked as `populate: true`/default and the opposite side as the weak reference with `populate: false` and the property type ` <pk_type> | <Class>`. Always document which side lives without `populate`, and never attempt to resolve both sides simultaneously during class initialization. This prevents the decaf decorator pipeline from recursing and aligns with the existing practice of treating the weak side as the non-owning relationship.

### Builder Pattern
*   When requested, for classes with many attributes relevant to the business logic, a **Builder** class MUST be provided to facilitate instantiation and complex variations. This is especially critical developer experience and expansibility.
*   **Builder Naming:** The builder for a class `MyClass` should be named `MyClassBuilder`.
*   **Core Structure:**
    *   Builders MUST extend `Model` but are **NOT** decorated with `@model()`. They are transient and not persisted.
    *   The constructor MUST call `Model.fromModel(this, arg)`. The `arg` is of type `ModelArg<BuilderName>`.
    *   All properties of the builder that correspond to the target class's properties MUST be decorated with `@decaf-ts/decorator-validation` decorators (e.g., `@string()`, `@number()`, `@prop()`). No `@relation()` or other generated decorators are allowed.
    *   It MUST have fluent `set<PropertyName>(value)` methods for each property, which return `this`.
    *   It MUST have a `build(...args: MaybeContextualArgs)` method.
*   **Build Method Logic:**
    1.  The `build` method MUST first check for validation errors by calling `this.hasErrors()`.
    2.  If errors exist, it MUST throw a `ValidationError` containing the list of errors.
    3.  If validation passes, it instantiates and returns the target class, populating it with the builder's properties.
*   **NO HARDCODED VALUES:** Builders should not contain hardcoded values (e.g., real data) in their default state unless defined by the user or required for the business logic (eg a default).

## 3. Testing Philosophy
*   **Unit Tests:** All functionality MUST have corresponding unit tests. Avoid mocking unless file or network IO.
*   **Integration Tests:** Scenarios involving external dependencies MUST be covered.
*   **Test Coverage:** New features or bug fixes must be accompanied by tests.

### Testing Guidelines
Jest is configured via `jest.config.js` with `ts-jest` transforms. Place tests in `tests/**` using `*.test.ts` (or `.setup.ts` for scaffolding). Maintain fast unit coverage before adding integration cases. Run `npm run coverage` before merges to validate reported output, and update fixtures under `tests/` instead of mocking shared contract changes.
Even in unit tests, avoid mocking whenever possible.

## 3. Testing Philosophy
*   **Unit Tests:** All functionality MUST have corresponding unit tests.
*   **Integration Tests:** Scenarios involving external dependencies MUST be covered.
*   **Test Coverage:** New features or bug fixes must be accompanied by tests.

## 4. Git Workflow

This section defines the Git workflow for the agent.

*   **Mode:** `commit`
    *   **Description:** Defines the git strategy.
    *   **Options:**
        *   `commit`: All changes are committed directly to the main branch after a task is successfully completed.
        *   `branch`: Create a new branch for each task, and create a Pull Request when the task is complete.
*   **Main Branch:** `master`
    *   **Description:** The primary branch for commits and for opening pull requests against.
*   **Commit Keys:**
    *   **Task:** `TASK`
    *   **Specification:** `SPECIFICATION`

## 5. How to Fulfill a Request: A Checklist

1.  **Identify Goal & Service:** Determine the responsible service/class.
2.  **Create/Modify Object:** Ensure it's properly decorated (if applicable).
3.  **Implement Method:** Use descriptive names and pass `context`.
4.  **Write Tests:** Unit and Integration tests are mandatory.
5.  **Follow Git Workflow:** Adhere to the configured git `Mode` for branching and committing.
