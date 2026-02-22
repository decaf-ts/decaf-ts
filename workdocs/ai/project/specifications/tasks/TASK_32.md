# TASK-32: Refactor Static Methods for Multi-Driver Support

**Specification:** [DECAF-6](../DECAF_6.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 4-6 hours

## Objective
Refactor static methods (`createDatabase`, `createNotifyFunction`, `deleteDatabase`, `createUser`) to support multiple database drivers with driver-specific implementations.

## Current Methods to Refactor
- `createDatabase()` - PostgreSQL: `CREATE DATABASE`
- `createNotifyFunction()` - PostgreSQL: `CREATE OR REPLACE FUNCTION` with pg_notify
- `deleteDatabase()` - PostgreSQL: `DROP DATABASE`
- `createUser()` - PostgreSQL: `CREATE USER` and grants

## Driver-Specific Implementations

### PostgreSQL
- `CREATE DATABASE db_name`
- `CREATE OR REPLACE FUNCTION notify_table_changes() ...`
- `DROP DATABASE db_name`
- `CREATE USER user WITH PASSWORD 'pass'` + grants

### MySQL / MariaDB
- `CREATE DATABASE db_name CHARACTER SET utf8mb4`
- Database triggers instead of functions (separate implementation in TASK-34)
- `DROP DATABASE db_name`
- `CREATE USER 'user'@'%' IDENTIFIED BY 'pass'` + grants

### SQLite
- No `CREATE DATABASE` - file-based (create directory/file)
- No triggers for notifications in this context (handled in TASK-34)
- No users or permissions (file permissions only)

### SQL Server
- `CREATE DATABASE db_name`
- Database triggers instead of functions (separate implementation in TASK-34)
- `DROP DATABASE db_name`
- `CREATE LOGIN` + `CREATE USER` + grants

### Oracle
- `CREATE USER user IDENTIFIED BY pass`
- Database triggers (separate implementation in TASK-34)
- Drop users directly

## Implementation Strategy

```typescript
// TypeORMAdapter.ts

static async createDatabase(
  dataSource: DataSource,
  dbName: string
): Promise<void> {
  const driver = this.getDriver(dataSource.options);
  const log = Logging.for(this.createDatabase);
  log.verbose(`Creating database ${dbName} for ${driver}`);

  switch (driver) {
    case TypeORMDriver.POSTGRES:
      await dataSource.query(`CREATE DATABASE ${dbName}`);
      log.info(`Created PostgreSQL database ${dbName}`);
      break;

    case TypeORMDriver.MYSQL:
    case TypeORMDriver.MARIADB:
      await dataSource.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4`);
      log.info(`Created MySQL/MariaDB database ${dbName}`);
      break;

    case TypeORMDriver.SQLITE:
    case TypeORMDriver.BETTER_SQLITE3:
    case TypeORMDriver.CAPSQLITE:
      const fs = await import('fs');
      const path = await import('path');
      const dbPath = path.dirname(dbName);
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }
      // SQLite file creation happens on first connection
      log.info(`Created SQLite database file ${dbName}`);
      break;

    case TypeORMDriver.SQLSERVER:
      // SQL Server requires special handling for database creation
      // May need to connect to master database first
      await this.createSqlServerDatabase(dataSource, dbName);
      log.info(`Created SQL Server database ${dbName}`);
      break;

    case TypeORMDriver.ORACLE:
      // Oracle uses users/schemas instead of databases
      throw new UnsupportedError(
        'Oracle database creation not supported via createDatabase(). ' +
        'Use Oracle schemas/users instead.'
      );

    default:
      throw new UnsupportedError(
        `Database creation not supported for driver: ${driver}`
      );
  }
}

private static async createSqlServerDatabase(
  dataSource: DataSource,
  dbName: string
): Promise<void> {
  // Connect to master database to create new database
  const masterConfig = {
    ...dataSource.options,
    database: 'master',
  };
  const masterSource = new DataSource(masterConfig);
  await masterSource.initialize();
  try {
    await masterSource.query(`CREATE DATABASE [${dbName}]`);
  } finally {
    await masterSource.destroy();
  }
}

// Similar refactoring for deleteDatabase and createUser
```

## Additional Considerations

### createUser Requirements by Driver
- **PostgreSQL:** Full user creation with privileges
- **MySQL/MariaDB:** User creation with host specification
- **SQLite:** No users (skip or document)
- **SQL Server:** LOGIN + USER creation
- **Oracle:** User/Schema creation

### deleteDatabase Requirements
- **PostgreSQL:** May need to terminate connections first
- **MySQL/MariaDB:** Direct DROP
- **SQLite:** Delete file
- **SQL Server:** May need to switch database context
- **Oracle:** DROP USER CASCADE

## Deliverables
- [ ] Updated `TypeORMAdapter.createDatabase()` with driver switching
- [ ] Updated `TypeORMAdapter.deleteDatabase()` with driver switching
- [ ] Updated `TypeORMAdapter.createUser()` with driver switching (if applicable)
- [ ] Helper methods for driver-specific SQL generation
- [ ] Error handling for unsupported operations per driver

## Tests Required
- [ ] Test `createDatabase()` for each supported driver
- [ ] Test `deleteDatabase()` for each supported driver
- [ ] Test driver detection with various config formats
- [ ] Test error handling for unsupported drivers
