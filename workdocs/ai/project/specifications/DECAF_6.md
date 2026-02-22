# DECAF-6: TypeORM Multi-Database Support Refactoring

**Status:** Draft  
**Priority:** High  
**Owner:** decaf-dev

## 1. Overview
Refactor the TypeORM adapter to support all TypeORM database drivers (PostgreSQL, MySQL, MariaDB, SQLite, SQL Server, MongoDB, etc.) instead of being PostgreSQL-specific. This includes:
1. Generic database/table creation methods that work across all drivers
2. Database-driven event listening via triggers/events (not just TypeORM's onAdapter)
3. Query builder refactor to use TypeORM's standard query syntax instead of direct SQL generation

## 2. Goals
*   [ ] Refactor static methods (`createDatabase`, `createNotifyFunction`) to support multiple database drivers with driver-specific implementations
*   [ ] Implement TypeORMDispatch to support database-level event listening (triggers/webhooks) for multi-adapter coordination
*   [ ] Refactor TypeORMStatement to use TypeORM's query builder API consistently with listBy/findBy/findBy methods
*   [ ] Add database driver detection and routing from adapter configuration
*   [ ] Maintain backward compatibility for existing PostgreSQL implementations

## 3. User Stories / Requirements
*   **US-1:** As a developer, I want to use TypeORM adapter with MySQL, SQLite, or SQL Server without modifying the codebase, just changing the configuration.
*   **US-2:** As a developer with multiple adapter instances connecting to the same database, I want all instances to receive change events regardless of which instance made the change.
*   **US-3:** As a maintainer, I want query building to use TypeORM's standardized API so it's consistent with listBy, findBy, and other repository methods.
*   **Req-1:** The adapter must detect the database driver from the TypeORM configuration and apply driver-specific logic for database operations.
*   **Req-2:** Database creation, schema migration, and notify functions must work with at least PostgreSQL, MySQL, and SQLite.
*   **Req-3:** Event dispatching must support both TypeORM subscriber mode (current) and database trigger mode (new).
*   **Req-4:** All query operations (statement, listBy, findBy, page) must use the same underlying query building mechanism.

## 4. Architecture & Design

### Current State
- **Database Creation:** PostgreSQL-specific SQL (`CREATE DATABASE`, `CREATE OR REPLACE FUNCTION`)
- **Event System:** TypeORMEventSubscriber only (in-memory, single-instance only)
- **Query Building (TypeORMStatement):** Uses SelectQueryBuilder with custom SQL string generation via `translateOperators()` and manual WHERE clause string building

**Example of Current Problem:**
```typescript
// TypeORMStatement.parseCondition() - Currently uses PostgreSQL-specific SQL:
protected parseCondition(condition, tableName, qb): TypeORMQuery<M> {
  const sqlOperator = translateOperators(operator); // Maps to PostgreSQL operators
  const queryStr = `${tableName}.${attr1} ${sqlOperator} :${attrRef}`; // SQL string
  return { query: qb.where(queryStr, values) as any };
}
```

**Repository Methods Pattern (What We Want):**
```typescript
// TypeORMRepository.listBy() - Uses TypeORM's FindOperator API:
const transformedQuery: FindManyOptions<M> = {
  where: { [key]: Like(`%${value}%`) },  // TypeORM operator
  order: { [key]: 'ASC' },
};
return this.adapter.client.findBy(transformedQuery);
```

### New Architecture

#### A. Driver-Aware Static Methods
```typescript
// TypeORMAdapter.ts
enum TypeORMDriver {
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
  MARIADB = 'mariadb',
  SQLITE = 'sqlite',
  SQLSERVER = 'mssql',
  BETTER_SQLITE3 = 'better-sqlite3',
  CAPSQLITE = 'cap-sqlite',
  ORACLE = 'oracle',
  CLOUD_SQL_POSTGRES = 'cockroachdb',
}

static getDriver(config: DataSourceOptions): TypeORMDriver {
  if (config.type) return config.type;
  if (config.url?.includes('postgres')) return TypeORMDriver.POSTGRES;
  if (config.url?.includes('mysql')) return TypeORMDriver.MYSQL;
  // ... detection logic
}

static async createDatabase(
  dataSource: DataSource,
  dbName: string
): Promise<void> {
  const driver = this.getDriver(dataSource.options);
  
  switch (driver) {
    case TypeORMDriver.POSTGRES:
      await dataSource.query(`CREATE DATABASE ${dbName}`);
      break;
    case TypeORMDriver.MYSQL:
    case TypeORMDriver.MARIADB:
      await dataSource.query(`CREATE DATABASE ${dbName}`);
      break;
    case TypeORMDriver.SQLITE:
    case TypeORMDriver.BETTER_SQLITE3:
    case TypeORMDriver.CAPSQLITE:
      // SQLite uses file-based database, create directory/file if needed
      const fs = await import('fs');
      if (!fs.existsSync(dbName)) {
        fs.writeFileSync(dbName, '');
      }
      break;
    // ... other drivers
  }
}
```

#### B. Event Dispatch Modes
```typescript
// TypeORMDispatch.ts
enum TypeORMEventMode {
  SUBSCRIBER = 'subscriber',    // Current: TypeORM entity subscriber
  TRIGGER = 'trigger',          // New: Database triggers + polling/listening
}

class TypeORMDispatch extends Dispatch<...> {
  private eventMode: TypeORMEventMode;
  
  constructor(eventMode: TypeORMEventMode = TypeORMEventMode.SUBSCRIBER) {
    super();
    this.eventMode = eventMode;
  }

  protected override async initialize(...args): Promise<void> {
    switch (this.eventMode) {
      case TypeORMEventMode.SUBSCRIBER:
        await this.subscribeToTypeORM();
        break;
      case TypeORMEventMode.TRIGGER:
        await this.setupDatabaseTriggers();
        await this.startEventListener();
        break;
    }
  }

  private async setupDatabaseTriggers() {
    // Create database triggers for INSERT/UPDATE/DELETE
    const driver = TypeORMAdapter.getDriver(this.adapter.client.options);
    
    switch (driver) {
      case TypeORMDriver.POSTGRES:
        // CREATE OR REPLACE TRIGGER ... EXECUTE FUNCTION notify_table_changes()
        break;
      case TypeORMDriver.MYSQL:
        // CREATE TRIGGER ... AFTER INSERT/UPDATE/DELETE
        break;
      case TypeORMDriver.SQLITE:
        // Use VACUUM or WAL mode + polling
        break;
    }
  }

  private async startEventListener() {
    // Listen for database events (PostgreSQL LISTEN/NOTIFY, MySQL event polling, etc.)
    // Broadcast to all adapter instances via database
  }
}
```

#### C. Unified Query Builder
```typescript
// TypeORMStatement.ts
protected build(): TypeORMQuery<M> {
  const repository = this.adapter.client.getRepository(Metadata.constr(this.fromSelector));
  
  // Use TypeORM's built-in query generation via repository methods instead of SQL strings
  const baseQuery = repository.createQueryBuilder(this.alias || Model.tableName(this.fromSelector));

  // Build conditions using TypeORM's FindOperator (not direct SQL)
  if (this.whereCondition) {
    const whereOp = this.translateConditionToTypeORM(this.whereCondition);
    baseQuery.where(whereOp);
  }

  // Handle aggregates
  if (this.countSelector) {
    const selectField = this.countSelector === null ? '*' : this.countSelector;
    baseQuery.select(`COUNT(${selectField})`, 'count');
  } else if (this.sumSelector) {
    baseQuery.select(`SUM(${this.sumSelector})`, 'sum');
  }
  // ... other aggregates

  // Order, limit, offset using TypeORM methods
  if (this.orderBySelectors) {
    for (const [field, dir] of this.orderBySelectors) {
      baseQuery.addOrderBy(`${this.alias}.${field}`, dir);
    }
  }

  if (this.limitSelector) baseQuery.limit(this.limitSelector);
  if (this.offsetSelector) baseQuery.offset(this.offsetSelector);

  return { query: baseQuery };
}

// Reuse this pattern in listBy, findBy, find, page, etc.
override async listBy(key, order, ...args) {
  // Use the same build() method instead of custom SQL
  const query = this.statement(this.listBy.name, key, order).build();
  return this.raw<List<M>>(query);
}
```

## 5. Tasks Breakdown
| ID           | Task Name                                      | Priority | Status  | Dependencies |
|:-------------|:-----------------------------------------------|:---------|:--------|:-------------|
| TASK-31      | Add TypeORMDriver enum and driver detection    | High     | Pending | -            |
| TASK-32      | Refactor static methods for multi-driver support | High     | Pending | TASK-31      |
| TASK-33      | Add TypeORMEventMode enum and dispatch modes   | High     | Pending | -            |
| TASK-34      | Implement database trigger setup for each driver | High     | Pending | TASK-31,TASK-33 |
| TASK-35      | Implement event listener for multi-instance support | High     | Pending | TASK-34      |
| TASK-36      | Refactor TypeORMStatement to use TypeORM query API | High     | Pending | TASK-31      |
| TASK-37      | Update repository methods to use unified query building | High     | Pending | TASK-36      |
| TASK-38      | Add tests for each database driver             | High     | Pending | TASK-32,TASK-34,TASK-36 |
| TASK-39      | Document driver differences and configuration  | Medium   | Pending | TASK-38      |

## 6. Open Questions / Risks
*   **SQLite limitations:** SQLite doesn't support CREATE DATABASE or triggers in the same way. How should we handle file-based databases? Should we treat each file as a separate "database" or use a different pattern?
*   **Event system consistency:** For database triggers to work, all adapter instances must share the same database connection. How do we handle separate connection pools?
*   **Performance:** Database triggers may have different performance characteristics than TypeORM subscribers. Should we provide a performance comparison or configuration recommendation?
*   **Backward compatibility:** Existing PostgreSQL-only users expect the current behavior. Should we:
  * Detect driver automatically and use appropriate implementation?
  * Force users to specify `eventMode: 'subscriber' | 'trigger'` explicitly?
  * Keep both modes and auto-select based on driver capabilities?

## 7. Results & Artifacts
*   Updated `TypeORMAdapter.ts` with static methods supporting PostgreSQL, MySQL, MariaDB, and SQLite
*   Updated `TypeORMDispatch.ts` with eventMode support for both subscriber and trigger modes
*   Updated `TypeORMStatement.ts` to use TypeORM's SelectQueryBuilder consistently
*   Updated `TypeORMRepository.ts` to use unified query building
*   New driver-specific test suites in `for-typeorm/tests/integration`:
  - `integration/postgres.test.ts`
  - `integration/mysql.test.ts`
  - `integration/sqlite.test.ts`
*   Documentation in `for-typeorm/docs/DRIVERS.md` covering driver differences and configuration

## 8. Current Status Notes
*   Current implementation is PostgreSQL-specific with hardcoded SQL queries
*   createDatabase(), createNotifyFunction() use PostgreSQL-specific syntax
*   TypeORMEventSubscriber only works within a single process (not multi-adapter coordination)
*   TypeORMStatement uses raw SQL string building instead of TypeORM's repository/queryBuilder API
*  (listBy, findBy, find, page) use custom query logic in repository that duplicates Statement building
