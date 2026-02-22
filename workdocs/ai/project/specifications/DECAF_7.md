# DECAF-7: Transaction Decorator Refactoring with Lock Context

**Status:** Draft  
**Priority:** High  
**Owner:** decaf-dev

## 1. Overview
Refactor the `@transactional` decorator in core to use the Decoration API for proper transaction management with adapter-provided lock instances. The lock must survive multiple calls to `logCtx` and properly manage transaction boundaries (begin/end) and lock acquisition/release through a reference counter.

**Enhanced Lock Requirements:**
- Lock MUST support hierarchical locking (none/adapter/table/record levels) via `acquire(level, tableName?, recordId?)`
- Lock MUST support configurable concurrent transactions via `maxConcurrent` option (null = unlimited)
- Lock MUST be extensible: base implementation has no real locking, adapters can override
- Lock MUST be passed via configuration to adapters, not created internally
- Type definition: `type LockLevel = "none" | "adapter" | "table" | "record"`

## 2. Goals
*   [ ] Refactor `@transactional` decorator to use Decoration API
*   [ ] Ensure Context always has a lock property (Lock instance from adapter)
*   [ ] Implement proxy for acquire/release methods with reference counting
*   [ ] Call adapter's beginTransaction on first acquire
*   [ ] Call adapter's endTransaction on last release
*   [ ] Call lock.acquire(level, tableName?, recordId?) on first acquire
*   [ ] Call lock.release(level, tableName?, recordId?) on last release
*   [ ] Define abstract adapter methods for transactions (no implementation)
*   [ ] Create enhanced Lock that supports hierarchical locking (none/table/record levels) with configurable maxConcurrent
*   [ ] Update Lock acquire() and release() methods to accept level, tableName, recordId parameters
*   [ ] Update TransactionLockProxy to pass level/tableName/recordId to lock methods
*   [ ] Add unit tests for transaction decorator behavior
*   [ ] Add integration tests with concrete adapters (RamAdapter, etc.)

## 3. User Stories / Requirements
*   **US-1:** As a developer using @transactional, I want the decorator to automatically manage lock acquisition and transaction boundaries
*   **US-2:** As a developer, I want the lock to persist across multiple logCtx calls within a single transaction
*   **US-3:** As a maintainer, I want different adapters (RamAdapter, TypeORM, etc.) to provide their own lock implementations
*   **US-4:** As a developer, I want nested @transactional calls to share the same lock instance
*   **US-5:** As a developer, I want to configure the maximum number of concurrent transactions (null = unlimited)
*   **US-6:** As a developer, I want locking at different levels: none, adapter, table, record
*   **US-7:** As a developer, I want to provide the lock instance via adapter configuration, not have it created internally
*   **Req-1:** @transactional MUST always inject a Lock instance into the Context
*   **Req-2:** Lock instance MUST come from the adapter configuration, not a singleton
*   **Req-3:** acquire/release proxy MUST increase counter on acquire, decrease on release
*   **Req-4:** First acquire MUST call adapter.beginTransaction() and lock.acquire(level, tableName?, recordId?)
*   **Req-5:** Last release MUST call lock.release(level, tableName?, recordId?) and adapter.endTransaction()
*   **Req-6:** Adapter base class MUST define abstract async methods: beginTransaction, endTransaction
*   **Req-7:** Lock must survive multiple logCtx() calls (store in Context, not local variable)
*   **Req-8:** Lock MUST support hierarchical levels: none, adapter, table, record via `acquire(level, tableName?, recordId?)`
*   **Req-9:** Lock MUST support configurable maxConcurrent transactions (null = unlimited)
*   **Req-10:** Lock MUST be passed via adapter config, NOT created internally by adapter

## 4. Architecture & Design

### Current State (Problem)
- `@transactional` decorator likely exists but doesn't use Decoration API
- Lock management is not properly integrated with Context
- Transaction boundaries may not be correctly managed
- Current MultiLock doesn't support hierarchical locking (none/table/record levels)
- No support for configurable concurrent transactions
- Locks were being created internally by adapters instead of being passed via config

### New Architecture

#### 1. Enhanced Lock Design
```typescript
// transactional-decorators/src/Lock.ts
export type LockLevel = "none" | "adapter" | "table" | "record";

export class Lock {
  protected maxConcurrent: number | null;

  constructor(config: { maxConcurrent?: number | null } = {}) {
    this.maxConcurrent = config.maxConcurrent ?? null;
  }

  async acquire(level: LockLevel, tableName?: string, recordId?: string): Promise<void> {
    // Base implementation: no real locking
    // Adapters can override this method for proper locking
  }

  async release(level: LockLevel, tableName?: string, recordId?: string): Promise<void> {
    // Base implementation: no real locking
    // Adapters can override this method for proper locking
  }
}

export class MultiLock extends Lock {
  constructor(config: { maxConcurrent?: number | null } = {}) {
    super(config);
  }

  override async acquire(level: LockLevel, tableName?: string, recordId?: string): Promise<void> {
    // MultiLock implementation with hierarchical support
  }

  override async release(level: LockLevel, tableName?: string, recordId?: string): Promise<void> {
    // MultiLock implementation with hierarchical support
  }
}

// Proxy for acquire/release with reference counting
class TransactionLockProxy {
  private realLock: Lock;
  private adapter: Adapter;
  private acquireCount: number = 0;

  constructor(lock: Lock, adapter: Adapter) {
    this.realLock = lock;
    this.adapter = adapter;
  }

  async acquire(level: LockLevel = "none", tableName?: string, recordId?: string): Promise<void> {
    this.acquireCount++;
    
    if (this.acquireCount === 1) {
      // First acquire - start transaction
      await this.adapter.beginTransaction();
      await this.realLock.acquire(level, tableName, recordId);

  constructor(lock: Lock, adapter: Adapter) {
    this.realLock = lock;
    this.adapter = adapter;
  }

  async acquire(level: LockLevel = "none", tableName?: string, recordId?: string): Promise<void> {
    this.acquireCount++;
    
    if (this.acquireCount === 1) {
      // First acquire - start transaction
      await this.adapter.beginTransaction();
      await this.realLock.acquire(level, tableName, recordId);
      
      // Inject lock into Context for persistence across logCtx calls
      const ctx = Context.current();
      if (ctx) {
        // Store the lock instance in context for logCtx to access
        // The lock survives because it's in Context, not a local variable
        ctx.accumulate({ transactionLock: this });
      }
    }
  }

  async release(level: LockLevel = "none", tableName?: string, recordId?: string): Promise<void> {
    this.acquireCount--;
    
    if (this.acquireCount === 0) {
      // Last release - end transaction
      await this.realLock.release(level, tableName, recordId);
      await this.adapter.endTransaction();
    }
  }

  // Get the real lock for direct access if needed
  get real(): Lock {
    return this.realLock;
  }
}
```

#### 2. Adapter Base Class (Abstract Methods)
```typescript
// core/src/persistence/Adapter.ts
export abstract class Adapter<CONFIG, QUERY, FLAGS, CONTEXT> {
  // ... existing code ...

  /**
   * @description Begin a transaction
   * @summary Called by the transaction decorator before the first acquire
   * @async
   */
  protected async beginTransaction(): Promise<void> {
    // Base implementation is a no-op
    // Adapters requiring transaction management can override this
  }

  /**
   * @description End a transaction
   * @summary Called by the transaction decorator after the last release
   * @async
   */
  protected async endTransaction(): Promise<void> {
    // Base implementation is a no-op
    // Adapters requiring transaction management can override this
  }
}
```

#### 3. RamAdapter Implementation
```typescript
// core/src/ram/RamAdapter.ts
export class RamAdapter extends Adapter<RamConfig, RamStorage, RawRamQuery, RamContext> {
  constructor(
    conf: RamConfig = { lock: new MultiLock({ maxConcurrent: null }) } as any,
    alias?: string
  ) {
    super(conf, RamFlavour, alias);
  }

  override async beginTransaction(): Promise<void> {
    // No-op for in-memory adapter - transaction management is handled by lock reference counting
  }

  override async endTransaction(): Promise<void> {
    // No-op for in-memory adapter - transaction management is handled by lock reference counting
  }
}
```

#### 4. Context Lock Management
```typescript
// core/src/persistence/Context.ts
export class Context<F extends ContextFlags<any> = AdapterFlags<any>> extends Ctx<F> {
  // ... existing code ...

  /**
   * @description Get the transaction lock from context
   * @summary Retrieves the Lock instance that was injected by @transactional decorator
   * @returns {Lock | undefined} The transaction lock, or undefined if not in transaction
   */
  getTransactionLock(): Lock | undefined {
    return this.getOrDefault("transactionLock");
  }
}
```

#### 5. Decorator Handler
```typescript
// transactional-decorators/src/handlers/transactional-handler.ts
import { Lock, LockLevel } from "@decaf-ts/transactional-decorators";
import { Adapter, Context } from "@decaf-ts/core";

export async function transactionalHandler(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
  adapter: Adapter<any, any, any, any>,
  level: LockLevel = "none",
  tableName?: string,
  recordId?: string
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    // Get or create transaction lock
    let ctx = Context.current();
    let lockProxy: TransactionLockProxy;

    if (!ctx) {
      // No context - create one
      ctx = new Context();
    }

    // Check if lock already exists in context (nested calls)
    lockProxy = ctx.getTransactionLock();
    
    if (!lockProxy) {
      // Create new lock proxy using lock from adapter config
      const lock = adapter.lock;
      if (!lock) {
        throw new Error("Adapter must provide a lock instance via config");
      }
      lockProxy = new TransactionLockProxy(lock, adapter);
    }

    // Execute method with lock acquired
    await lockProxy.acquire(level, tableName, recordId);
    
    try {
      const result = await originalMethod.apply(this, args);
      return result;
    } finally {
      // Release lock
      await lockProxy.release(level, tableName, recordId);
    }
  };

  return descriptor;
}
```

### MethodCall Sequence

```
┌─────────────┐
│ @transactional decorated method called with level, tableName, recordId
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Check if lock in Context
└──────┬──────────┘
       │
       ├─ No lock → Create TransactionLockProxy
       │           └─ Lock from adapter.config.lock (NOT created internally)
       │           └─ Proxy wraps real lock + adapter
       │
       ├─ Lock exists (nested) → Reuse existing proxy
       │
       ▼
┌─────────────────┐
│ lockProxy.acquire(level, tableName?, recordId?)
└──────┬──────────┘
       │
       ├─ First acquire (count=1):
       │  └─ adapter.beginTransaction() [async] (optional, no-op by default)
       │  └─ realLock.acquire(level, tableName?, recordId?) [async]
       │  └─ Store proxy in Context
       │
       └─ Subsequent acquire (count>1):
          └─ Just increment counter
       ▼
┌─────────────────┐
│ Original method executes
│ Context has lock accessible via logCtx
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ lockProxy.release(level, tableName?, recordId?)
└──────┬──────────┘
       │
       ├─ Last release (count=0):
       │  └─ realLock.release(level, tableName?, recordId?) [async]
       │  └─ adapter.endTransaction() [async] (optional, no-op by default)
       │
       └─ Not last (count>0):
          └─ Just decrement counter
       ▼
┌─────────────────┐
│ Transaction complete
└─────────────────┘
```

### logCtx Survival

The lock survives `logCtx` calls because:

1. **`@transactional` Decorator:**
   - Creates `TransactionLockProxy` with reference counter
   - Calls `ctx.accumulate({ transactionLock: lockProxy })` to store in Context

2. **Context Class:**
   - Uses `accumulate()` which creates new Context but preserves parent data
   - Lock instance is stored in the Context's internal map

3. **logCtx Method:**
   - `const { ctx } = this.logCtx(args, operation)`
   - Uses the Context that contains `transactionLock`
   - Lock remains accessible via `ctx.getTransactionLock()`

## 5. Tasks Breakdown
| ID           | Task Name                                      | Priority | Status  | Dependencies |
|:-------------|:-----------------------------------------------|:---------|:--------|:-------------|
| TASK-66      | Refactor @transactional decorator using Decoration API | High | Pending | - |
| TASK-67      | Implement TransactionLockProxy with reference counting and level parameters | High | Pending | TASK-66 |
| TASK-68      | Add abstract methods to Adapter base class (beginTransaction, endTransaction) | High | Pending | - |
| TASK-69      | Update RamAdapter to use lock from config (no internal creation) | High | Pending | - |
| TASK-70      | Update Context with getTransactionLock method | High | Pending | - |
| TASK-71      | Add transactionLock property to Context on first acquire | High | Pending | TASK-67,TASK-70 |
| TASK-72      | Create transactionalHandler for decoratee method wrapping | High | Pending | TASK-66,TASK-67 |
| TASK-73      | Add unit tests for Lock class and MultiLock | High | Pending | - |
| TASK-74      | Add unit tests for TransactionLockProxy | High | Pending | TASK-67 |
| TASK-75      | Add unit tests for @transactional decorator | High | Pending | TASK-71,TASK-72 |
| TASK-76      | Add integration tests with RamAdapter | High | Pending | TASK-71,TASK-72 |
| TASK-77      | Document transaction decorator usage and lock lifecycle | Medium | Pending | TASK-71,TASK-72 |

## 6. Open Questions / Risks
*   **Nested Transactions:** Should nested @transactional calls create nested transactions or share the same transaction?
*   **Lock Timeout:** Should there be a timeout for lock acquisition? What happens if it expires?
*   **Transaction Isolation:** How to handle transaction isolation levels? Should this be configurable per adapter?
*   **Error Recovery:** What happens if beginTransaction succeeds but endTransaction fails? Should we rollback?
*   **Performance:** Does the reference counting and proxy add significant overhead for non-transactional methods?
*   **LogCtx Timing:** What if logCtx is called before the first acquire? Should lock be injected earlier?

## 7. Results & Artifacts
*   Updated `@decaf-ts/transactional-decorators` package with refactored `@transactional` using Decoration API
*   Updated `core/src/persistence/Adapter.ts` with abstract `beginTransaction()` and `endTransaction()` methods
*   Updated `core/src/ram/RamAdapter.ts` with transaction implementation
*   Updated `core/src/persistence/Context.ts` with `getTransactionLock()` method
*   TransactionLockProxy implementation in `@decaf-ts/transactional-decorators`
*   Unit tests in `core/tests/unit/transaction-decorator.test.ts`
*   Integration tests in `core/tests/e2e/transaction.e2e.test.ts`
*   Documentation in `core/docs/TRANSACTIONS.md`

## 8. Current Status Notes
*   `@transactional` decorator likely exists in `@decaf-ts/transactional-decorators` package
*   `@decaf-ts/transactional-decorators` is a dependency of core
*   `RamAdapter` uses `lock: new MultiLock({ maxConcurrent: null })` passed via config
*   Lock is passed via adapter configuration, not created internally
*   `beginTransaction`/`endTransaction` are no-ops for in-memory adapter
*   Lock instance needs to survive multiple `logCtx()` calls for nested decorator scenarios
