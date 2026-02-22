# TASK-35: Implement Event Listener for Multi-Instance Support

**Specification:** [DECAF-6](../DECAF_6.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 4-6 hours

## Objective
Implement event listeners that receive database-level notifications and broadcast them to observers for multi-adapter instance coordination.

## Listener Implementation by Driver

### PostgreSQL (Priority: High)

```typescript
// TypeORMDispatch.ts

private async startPostgresListener(): Promise<void> {
  const log = this.log.for('startPostgresListener');
  const driver = TypeORMAdapter.getDriver(this.adapter.client.options);
  
  if (driver !== TypeORMDriver.POSTGRES) {
    throw new InternalError('startPostgresListener() called for non-PostgreSQL driver');
  }

  // Check if LISTEN is supported
  const dbVersion = await this.adapter.client.query('SHOW server_version');
  const version = parseFloat(dbVersion[0].server_version);
  
  if (version < 9) {
    throw new InternalError('PostgreSQL LISTEN/NOTIFY requires version 9.0+');
  }

  // LISTEN to the channel
  await this.adapter.client.query('LISTEN table_changes');
  log.info('PostgreSQL LISTEN table_changes started');

  // Register notification handler
  this.adapter.client.on('notification', (notification: any) => {
    this.handlePostgresNotification(notification);
  });

  this.eventListenerActive = true;
  log.info('PostgreSQL notification listener active');
}

private handlePostgresNotification(notification: any): void {
  try {
    const payload = JSON.parse(notification.payload);
    
    const table = payload.table;
    const operation = this.mapPostgresOperation(payload.action);
    const ids = this.extractIdsFromPayload(payload);
    
    this.log.verbose(
      `Received PostgreSQL notification: table=${table}, op=${operation}, ids=${ids.join(',')}`
    );
    
    this.notificationHandler(table, operation, ids);
  } catch (e) {
    this.log.error('Failed to parse PostgreSQL notification:', e);
  }
}

private mapPostgresOperation(action: string): OperationKeys {
  switch (action) {
    case 'INSERT':
      return OperationKeys.CREATE;
    case 'UPDATE':
      return OperationKeys.UPDATE;
    case 'DELETE':
      return OperationKeys.DELETE;
    default:
      this.log.warn(`Unknown PostgreSQL operation: ${action}`);
      return OperationKeys.UPDATE;
  }
}

private extractIdsFromPayload(payload: any): EventIds {
  // Extract IDs from payload
  const ids: EventIds = [];
  
  if (payload.data && payload.data.id !== undefined) {
    ids.push(payload.data.id);
  }
  
  if (payload.old_data && payload.old_data.id !== undefined) {
    const oldId = payload.old_data.id;
    if (!ids.includes(oldId)) {
      ids.push(oldId);
    }
  }
  
  return ids;
}
```

### MySQL / MariaDB (Priority: High)

```typescript
private async startMysqlPolling(): Promise<void> {
  const log = this.log.for('startMysqlPolling');
  const driver = TypeORMAdapter.getDriver(this.adapter.client.options);
  
  if (driver !== TypeORMDriver.MYSQL && driver !== TypeORMDriver.MARIADB) {
    throw new InternalError('startMysqlPolling() called for non-MySQL driver');
  }

  // Ensure changes table exists
  await this.createMysqlChangesTable(this.adapter.client);

  // Start polling loop
  this.mysqlPollingInterval = setInterval(async () => {
    try {
      await this.processMysqlChanges();
    } catch (e) {
      this.log.error('Error processing MySQL changes:', e);
    }
  }, this.pollingInterval);

  this.eventListenerActive = true;
  log.info(`MySQL polling started (interval: ${this.pollingInterval}ms)`);
}

private async processMysqlChanges(): Promise<void> {
  const log = this.log.for('processMysqlChanges');

  // Get unprocessed changes
  const changes = await this.adapter.client.query(`
    SELECT id, table_name, operation, record_id, payload
    FROM changes 
    WHERE processed = 0 
    ORDER BY created_at ASC
    LIMIT 100
  `);

  if (!changes.length) {
    return;
  }

  log.verbose(`Processing ${changes.length} MySQL changes`);

  // Process each change
  for (const change of changes) {
    try {
      const operation = this.mapMysqlOperation(change.operation);
      const ids: EventIds = change.record_id ? [change.record_id] : [];

      this.log.verbose(
        `MySQL change: table=${change.table_name}, op=${operation}, ids=${ids}`
      );

      this.notificationHandler(change.table_name, operation, ids);

      // Mark as processed
      await this.adapter.client.query(
        `UPDATE changes SET processed = 1 WHERE id = ?`,
        [change.id]
      );
    } catch (e) {
      this.log.error(`Failed to process MySQL change ${change.id}:`, e);
    }
  }

  if (changes.length) {
    log.info(`Processed ${changes.length} MySQL changes`);
  }
}

private mapMysqlOperation(operation: string): OperationKeys {
  switch (operation.toUpperCase()) {
    case 'INSERT':
      return OperationKeys.CREATE;
    case 'UPDATE':
      return OperationKeys.UPDATE;
    case 'DELETE':
      return OperationKeys.DELETE;
    default:
      this.log.warn(`Unknown MySQL operation: ${operation}`);
      return OperationKeys.UPDATE;
  }
}
```

### SQLite (Priority: Medium)

```typescript
private async startSqlitePolling(): Promise<void> {
  const log = this.log.for('startSqlitePolling');
  const driver = TypeORMAdapter.getDriver(this.adapter.client.options);
  
  const isSqlite = [
    TypeORMDriver.SQLITE,
    TypeORMDriver.BETTER_SQLITE3,
    TypeORMDriver.CAPSQLITE,
  ].includes(driver);

  if (!isSqlite) {
    throw new InternalError('startSqlitePolling() called for non-SQLite driver');
  }

  // Ensure changes table exists
  await this.createSqliteChangesTable(this.adapter.client);

  // For SQLite, determine which strategy to use
  const sqliteVersion = await this.adapter.client.query('SELECT sqlite_version()');
  const version = parseFloat(sqliteVersion[0]['sqlite_version()']);

  if (version >= 3.8) {
    // SQLite 3.8+ supports WAL mode and can be monitored
    await this.startSqliteWalMonitoring();
  } else {
    // Use polling for older SQLite versions
    this.sqlitePollingInterval = setInterval(async () => {
      try {
        await this.processSqliteChanges();
      } catch (e) {
        this.log.error('Error processing SQLite changes:', e);
      }
    }, this.pollingInterval);
  }

  this.eventListenerActive = true;
  log.info('SQLite polling/monitoring started');
}

private async startSqliteWalMonitoring(): Promise<void> {
  // Enable WAL mode for better concurrency
  await this.adapter.client.query('PRAGMA journal_mode = WAL');
  
  // For WAL mode, we still need to poll for changes
  // since SQLite doesn't have LISTEN/NOTIFY
  
  this.sqlitePollingInterval = setInterval(async () => {
    try {
      await this.processSqliteChanges();
    } catch (e) {
      this.log.error('Error processing SQLite WAL changes:', e);
    }
  }, this.pollingInterval);
}

private async processSqliteChanges(): Promise<void> {
  const log = this.log.for('processSqliteChanges');

  const changes = await this.adapter.client.query(`
    SELECT rowid, table_name, operation, record_id
    FROM changes 
    WHERE processed = 0 
    ORDER BY created_at ASC
    LIMIT 100
  `);

  if (!changes.length) {
    return;
  }

  for (const change of changes) {
    try {
      const operation = this.mapSqliteOperation(change.operation);
      const ids: EventIds = change.record_id ? [change.record_id] : [];

      this.notificationHandler(change.table_name, operation, ids);

      await this.adapter.client.query(
        `UPDATE changes SET processed = 1 WHERE rowid = ?`,
        [change.rowid]
      );
    } catch (e) {
      this.log.error(`Failed to process SQLite change ${change.rowid}:`, e);
    }
  }

  if (changes.length) {
    log.info(`Processed ${changes.length} SQLite changes`);
  }
}

private mapSqliteOperation(operation: string): OperationKeys {
  switch (operation.toUpperCase()) {
    case 'INSERT':
      return OperationKeys.CREATE;
    case 'UPDATE':
      return OperationKeys.UPDATE;
    case 'DELETE':
      return OperationKeys.DELETE;
    default:
      return OperationKeys.UPDATE;
  }
}
```

### SQL Server (Priority: Medium)

```typescript
private async startSqlServerPolling(): Promise<void> {
  const log = this.log.for('startSqlServerPolling');

  await this.createSqlServerChangesTable(this.adapter.client);

  this.sqlServerPollingInterval = setInterval(async () => {
    try {
      await this.processSqlServerChanges();
    } catch (e) {
      this.log.error('Error processing SQL Server changes:', e);
    }
  }, this.pollingInterval);

  this.eventListenerActive = true;
  log.info(`SQL Server polling started (interval: ${this.pollingInterval}ms)`);
}

private async processSqlServerChanges(): Promise<void> {
  const changes = await this.adapter.client.query(`
    SELECT id, table_name, operation, record_id
    FROM changes 
    WHERE processed = 0 
    ORDER BY created_at ASC
    TOP 100
  `);

  if (!changes.length) return;

  for (const change of changes) {
    const operation = this.mapSqlServerOperation(change.operation);
    const ids: EventIds = change.record_id ? [change.record_id] : [];
    
    this.notificationHandler(change.table_name, operation, ids);
    
    await this.adapter.client.query(
      `UPDATE changes SET processed = 1 WHERE id = @id`,
      { id: change.id }
    );
  }
}

private mapSqlServerOperation(operation: string): OperationKeys {
  switch (operation.toUpperCase()) {
    case 'INSERT':
      return OperationKeys.CREATE;
    case 'UPDATE':
      return OperationKeys.UPDATE;
    case 'DELETE':
      return OperationKeys.DELETE;
    default:
      return OperationKeys.UPDATE;
  }
}
```

### Oracle (Priority: Low)

```typescript
private async startOraclePolling(): Promise<void> {
  const log = this.log.for('startOraclePolling');

  await this.createOracleChangesTable(this.adapter.client);

  this.oraclePollingInterval = setInterval(async () => {
    try {
      await this.processOracleChanges();
    } catch (e) {
      this.log.error('Error processing Oracle changes:', e);
    }
  }, this.pollingInterval);

  this.eventListenerActive = true;
  log.info(`Oracle polling started (interval: ${this.pollingInterval}ms)`);
}

private async processOracleChanges(): Promise<void> {
  const changes = await this.adapter.client.query(`
    SELECT id, table_name, operation, record_id
    FROM changes 
    WHERE processed = 0 
    ORDER BY created_at ASC
    FETCH FIRST 100 ROWS ONLY
  `);

  if (!changes.length) return;

  for (const change of changes) {
    const operation = this.mapOracleOperation(change.operation);
    const ids: EventIds = change.record_id ? [change.record_id] : [];
    
    this.notificationHandler(change.table_name, operation, ids);
    
    await this.adapter.client.query(
      `UPDATE changes SET processed = 1 WHERE id = :id`,
      { id: change.id }
    );
  }
}
```

## Cleanup and Shutdown

```typescript
// TypeORMDispatch.ts

override async dispose(): Promise<void> {
  this.log.verbose('Disposing TypeORMDispatch...');
  
  // Stop pollers
  if (this.mysqlPollingInterval) {
    clearInterval(this.mysqlPollingInterval);
    this.mysqlPollingInterval = null;
  }
  
  if (this.sqlitePollingInterval) {
    clearInterval(this.sqlitePollingInterval);
    this.sqlitePollingInterval = null;
  }
  
  if (this.sqlServerPollingInterval) {
    clearInterval(this.sqlServerPollingInterval);
    this.sqlServerPollingInterval = null;
  }
  
  if (this.oraclePollingInterval) {
    clearInterval(this.oraclePollingInterval);
    this.oraclePollingInterval = null;
  }

  // Stop PostgreSQL listener
  if (this.eventListenerActive && this.adapter) {
    try {
      const driver = TypeORMAdapter.getDriver(this.adapter.client.options);
      if (driver === TypeORMDriver.POSTGRES) {
        this.adapter.client.off('notification', this.handlePostgresNotification.bind(this));
        // Note: Cannot UNLISTEN in TypeORM, must close connection
      }
    } catch (e) {
      this.log.error('Error during listener cleanup:', e);
    }
  }

  this.eventListenerActive = false;
  
  await super.dispose();
  this.log.info('TypeORMDispatch disposed');
}
```

## Event Processing Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Adapter Inst 1 │     │  Adapter Inst 2 │     │  Adapter Inst 3 │
│                 │     │                 │     │                 │
│  ┌──────────┐   │     │  ┌──────────┐   │     │  ┌──────────┐   │
│  │  CREATE  │───┼────▶│  │  READ  │   │     │  │  UPDATE  │   │
│  │ (trigger)│   │     │  │        │   │     │  │ (trigger)│   │
│  └────┬─────┘   │     │  └──────────┘   │     │  └────┬─────┘   │
│       │         │     │                 │     │       │         │
│       ▼         │     │                 │     │       ▼         │
│  ┌──────────┐   │     │                 │     │  ┌──────────┐   │
│  │ Database │←───┼─────┼─────────────────┼─────▶│ Database │   │
│  │  Triggers│   │     │                 │     │  │ Triggers │   │
│  └────┬─────┘   │     │                 │     │  └────┬─────┘   │
│       │         │     │                 │     │       │         │
│       ▼         │     │                 │     │       ▼         │
│  ┌──────────┐   │     │                 │     │  ┌──────────┐   │
│  │ Listener │   │     │                 │     │  │ Listener │   │
│  └────┬─────┘   │     │                 │     │  └────┬─────┘   │
│       │         │     │                 │     │       │         │
│       ▼         │     │                 │     │       ▼         │
│  ┌──────────┐   │     │                 │     │  ┌──────────┐   │
│  │ Dispatcher│  │     │                 │     │  │ Dispatcher│  │
│  └────┬─────┘   │     │                 │     │  └────┬─────┘   │
│       │         │     │                 │     │       │         │
│       ▼         │     │                 │     │       ▼         │
│  ┌──────────┐   │     │                 │     │  ┌──────────┐   │
│  │ Observer │   │     │                 │     │  │ Observer │   │
│  └──────────┘   │     │                 │     │  └──────────┘   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
          ▲                              ▲
          └───────────┐  ┌───────────────┘
                      │  │
                  ┌───▼──▼──┐
                  │ changes │
                  │ table   │
                  └─────────┘
```

## Deliverables
- [ ] PostgreSQL LISTEN/NOTIFY listener implementation
- [ ] MySQL polling implementation with changes table
- [ ] SQLite polling implementation (WAL mode + polling)
- [ ] SQL Server polling implementation
- [ ] Oracle polling implementation
- [ ] Cleanup/dispose logic for all pollers
- [ ] Error handling and logging
- [ ] Tests for each driver's event listener

## Notes
- All listeners should be idempotent (safe to call multiple times)
- Polling intervals should be configurable
- Consider adding a `maxChangesPerBatch` configuration option
- Handle race conditions in multi-instance scenarios
