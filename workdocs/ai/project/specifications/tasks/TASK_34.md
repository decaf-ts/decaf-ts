# TASK-34: Implement Database Triggers for Each Driver

**Specification:** [DECAF-6](../DECAF_6.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 6-8 hours

## Objective
Implement trigger creation and management for each database driver to support event dispatching in trigger mode (TASK-33).

## Driver-Specific Implementations

### PostgreSQL (Priority: High)

#### Function Creation
```typescript
private async createPostgresNotifyFunction(dataSource: DataSource): Promise<void> {
  const log = this.log.for('createPostgresNotifyFunction');
  
  // Check if function exists
  const result = await dataSource.query(`
    SELECT 1 FROM pg_proc 
    WHERE proname = 'notify_table_changes' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  `);
  
  if (result.length) {
    log.verbose('PostgreSQL notify_table_changes() already exists');
    return;
  }
  
  const functionSql = `
    CREATE OR REPLACE FUNCTION notify_table_changes()
    RETURNS trigger AS $$
    DECLARE
      data json;
      old_data json;
      notification json;
    BEGIN
      IF TG_OP = 'INSERT' THEN
        data = row_to_json(NEW);
        old_data = NULL;
      ELSIF TG_OP = 'UPDATE' THEN
        data = row_to_json(NEW);
        old_data = row_to_json(OLD);
      ELSIF TG_OP = 'DELETE' THEN
        data = NULL;
        old_data = row_to_json(OLD);
      END IF;
      
      notification = json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'data', data,
        'old_data', old_data
      );
      
      PERFORM pg_notify('table_changes', notification::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    ALTER FUNCTION notify_table_changes() OWNER TO current_user;
    GRANT EXECUTE ON FUNCTION notify_table_changes() TO public;
  `;
  
  await dataSource.query(functionSql);
  log.info('Created PostgreSQL notify_table_changes() function');
}
```

#### Trigger Creation
```typescript
private async createPostgresTrigger(
  dataSource: DataSource, 
  tableName: string
): Promise<void> {
  const triggerName = `notify_${tableName}`;
  
  // Check if trigger exists
  const result = await dataSource.query(`
    SELECT 1 FROM pg_triggers 
    WHERE tgname = '${triggerName}'
  `);
  
  if (result.length) {
    return;
  }
  
  await dataSource.query(`
    CREATE TRIGGER ${triggerName}
    AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
    FOR EACH ROW
    EXECUTE FUNCTION notify_table_changes();
  `);
  
  this.log.info(`Created PostgreSQL trigger ${triggerName} on ${tableName}`);
}
```

### MySQL / MariaDB (Priority: High)

#### Trigger Creation
```typescript
private async createMysqlTrigger(
  dataSource: DataSource, 
  tableName: string
): Promise<void> {
  const log = this.log.for('createMysqlTrigger');
  const triggerName = `trg_notify_${tableName}`;
  
  // Check if trigger exists
  const result = await dataSource.query(`
    SELECT TRIGGER_NAME 
    FROM information_schema.triggers 
    WHERE TRIGGER_NAME = '${triggerName}'
  `);
  
  if (result.length) {
    log.verbose(`MySQL trigger ${triggerName} already exists`);
    return;
  }
  
  const delimiter = '||';
  
  const triggerSql = `
    DROP TRIGGER IF EXISTS ${triggerName}${delimiter}
    
    CREATE TRIGGER ${triggerName}
    AFTER INSERT ON ${tableName}
    FOR EACH ROW
    BEGIN
      INSERT INTO changes (table_name, operation, record_id, created_at) 
      VALUES ('${tableName}', 'INSERT', NEW.id, NOW());
    END${delimiter}
    
    CREATE TRIGGER ${triggerName}_update
    AFTER UPDATE ON ${tableName}
    FOR FOR EACH ROW
    BEGIN
      INSERT INTO changes (table_name, operation, record_id, created_at) 
      VALUES ('${tableName}', 'UPDATE', NEW.id, NOW());
    END${delimiter}
    
    CREATE TRIGGER ${triggerName}_delete
    AFTER DELETE ON ${tableName}
    FOR EACH ROW
    BEGIN
      INSERT INTO changes (table_name, operation, record_id, created_at) 
      VALUES ('${tableName}', 'DELETE', OLD.id, NOW());
    END
  `;
  
  // MySQL requires delimiter changes for multi-statement triggers
  await dataSource.query(`SET @@delimiter://${delimiter}`);
  await dataSource.query(triggerSql);
  await dataSource.query(`SET @@delimiter;//`);
  
  log.info(`Created MySQL triggers for ${tableName}`);
}
```

#### Changes Table (for polling)
```typescript
private async createMysqlChangesTable(dataSource: DataSource): Promise<void> {
  const log = this.log.for('createMysqlChangesTable');
  
  const tableSql = `
    CREATE TABLE IF NOT EXISTS changes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      table_name VARCHAR(255) NOT NULL,
      operation VARCHAR(10) NOT NULL,
      record_id VARCHAR(255) NOT NULL,
      payload JSON,
      processed TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_processed (processed),
      INDEX idx_table (table_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  await dataSource.query(tableSql);
  log.info('Created MySQL changes table');
}
```

### SQLite (Priority: Medium)

SQLite doesn't support pg_notify equivalent, so use polling with timestamp columns or a changes table.

#### Changes Table
```typescript
private async createSqliteChangesTable(dataSource: DataSource): Promise<void> {
  const log = this.log.for('createSqliteChangesTable');
  
  const tableSql = `
    CREATE TABLE IF NOT EXISTS changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      record_id TEXT NOT NULL,
      payload TEXT,
      processed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX idx_sqlite_changes_processed ON changes(processed);
    CREATE INDEX idx_sqlite_changes_table ON changes(table_name);
  `;
  
  await dataSource.query(tableSql);
  log.info('Created SQLite changes table');
}
```

#### Trigger Creation (if supported)
```typescript
private async createSqliteTrigger(
  dataSource: DataSource, 
  tableName: string
): Promise<void> {
  // SQLite supports triggers but not notifications
  // We'll still create triggers to populate the changes table
  
  const triggerName = `trg_sqlite_${tableName}`;
  
  const triggerSql = `
    CREATE TRIGGER IF NOT EXISTS ${triggerName}_insert
    AFTER INSERT ON ${tableName}
    BEGIN
      INSERT INTO changes (table_name, operation, record_id) 
      VALUES ('${tableName}', 'INSERT', NEW.id);
    END;
    
    CREATE TRIGGER IF NOT EXISTS ${triggerName}_update
    AFTER UPDATE ON ${tableName}
    BEGIN
      INSERT INTO changes (table_name, operation, record_id) 
      VALUES ('${tableName}', 'UPDATE', NEW.id);
    END;
    
    CREATE TRIGGER IF NOT EXISTS ${triggerName}_delete
    AFTER DELETE ON ${tableName}
    BEGIN
      INSERT INTO changes (table_name, operation, record_id) 
      VALUES ('${tableName}', 'DELETE', OLD.id);
    END;
  `;
  
  await dataSource.query(triggerSql);
}
```

### SQL Server (Priority: Medium)

```typescript
private async createSqlServerTrigger(
  dataSource: DataSource, 
  tableName: string
): Promise<void> {
  const log = this.log.for('createSqlServerTrigger');
  const triggerName = `trg_notify_${tableName}`;
  
  const triggerSql = `
    IF OBJECT_ID('${triggerName}', 'TR') IS NOT NULL
      DROP TRIGGER ${triggerName};
    GO
    
    CREATE TRIGGER ${triggerName}
    ON ${tableName}
    AFTER INSERT, UPDATE, DELETE
    AS
    BEGIN
      SET NOCOUNT ON;
      
      DECLARE @operation VARCHAR(10);
      DECLARE @id VARCHAR(255);
      
      IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
        SET @operation = 'UPDATE';
      ELSE IF EXISTS (SELECT 1 FROM inserted)
        SET @operation = 'INSERT';
      ELSE
        SET @operation = 'DELETE';
      
      IF @operation IN ('INSERT', 'UPDATE')
        SELECT @id = CAST(id AS VARCHAR(255)) FROM inserted;
      ELSE
        SELECT @id = CAST(id AS VARCHAR(255)) FROM deleted;
      
      INSERT INTO changes (table_name, operation, record_id, created_at)
      VALUES ('${tableName}', @operation, @id, GETDATE());
    END;
  `;
  
  await dataSource.query(triggerSql);
  log.info(`Created SQL Server trigger ${triggerName} on ${tableName}`);
}
```

### Oracle (Priority: Low)

```typescript
private async createOracleTrigger(
  dataSource: DataSource, 
  tableName: string
): Promise<void> {
  const log = this.log.for('createOracleTrigger');
  const triggerName = `trg_notify_${tableName.toUpperCase()}`;
  
  const triggerSql = `
    CREATE OR REPLACE TRIGGER ${triggerName}
    AFTER INSERT OR UPDATE OR DELETE ON "${tableName}"
    FOR EACH ROW
    BEGIN
      INSERT INTO changes (table_name, operation, record_id, created_at)
      VALUES ('${tableName}', 
        CASE 
          WHEN INSERTING THEN 'INSERT'
          WHEN UPDATING THEN 'UPDATE'
          WHEN DELETING THEN 'DELETE'
        END,
        CASE 
          WHEN INSERTING THEN :NEW.id
          ELSE :OLD.id
        END,
        SYSDATE
      );
    END;
  `;
  
  try {
    await dataSource.query(triggerSql);
    log.info(`Created Oracle trigger ${triggerName} on ${tableName}`);
  } catch (e) {
    if ((e as any).code === 'ORA-00955') {
      log.verbose(`Oracle trigger ${triggerName} already exists`);
    } else {
      throw e;
    }
  }
}
```

## Common Implementation Pattern

```typescript
// TypeORMDispatch.ts

private async setupTriggersForDriver(driver: TypeORMDriver): Promise<void> {
  switch (driver) {
    case TypeORMDriver.POSTGRES:
      await this.setupPostgresTriggers();
      break;
    case TypeORMDriver.MYSQL:
    case TypeORMDriver.MARIADB:
      await this.setupMysqlTriggers();
      break;
    case TypeORMDriver.SQLITE:
    case TypeORMDriver.BETTER_SQLITE3:
    case TypeORMDriver.CAPSQLITE:
      await this.setupSqliteTriggers();
      break;
    case TypeORMDriver.SQLSERVER:
      await this.setupSqlServerTriggers();
      break;
    case TypeORMDriver.ORACLE:
      await this.setupOracleTriggers();
      break;
    default:
      this.log.warn(`No trigger support for driver: ${driver}`);
  }
}

private async setupPostgresTriggers(): Promise<void> {
  await this.createPostgresNotifyFunction(this.adapter.client);
  
  const entities = this.getEntityMetadata();
  for (const entity of entities) {
    const tableName = Model.tableName(entity);
    await this.createPostgresTrigger(this.adapter.client, tableName);
  }
}

private async setupMysqlTriggers(): Promise<void> {
  await this.createMysqlChangesTable(this.adapter.client);
  
  const entities = this.getEntityMetadata();
  for (const entity of entities) {
    const tableName = Model.tableName(entity);
    await this.createMysqlTrigger(this.adapter.client, tableName);
  }
}

private getEntityMetadata(): Constructor<Model>[] {
  // Use TypeORM's metadata args storage
  const storage = getMetadataArgsStorage();
  const entities: Constructor<Model>[] = [];
  
  for (const table of storage.tables) {
    entities.push(table.target as Constructor<Model>);
  }
  
  return entities;
}
```

## Deliverables
- [ ] PostgreSQL trigger + function creation
- [ ] MySQL/MariaDB trigger + changes table
- [ ] SQLite trigger + changes table (polling-ready)
- [ ] SQL Server trigger + changes table
- [ ] Oracle trigger + changes table
- [ ] Error handling for missing permissions
- [ ] Idempotent setup (check if trigger exists before creating)
- [ ] Tests for each driver in `for-typeorm/tests/integration/`

## Notes
- All trigger creation should be idempotent (check existence first)
- Consider adding a `setupTriggers()` static method to TypeORMAdapter
- MySQL may need special delimiter handling for multi-statement triggers
- Oracle uses double quotes for identifiers and has case-sensitivity
