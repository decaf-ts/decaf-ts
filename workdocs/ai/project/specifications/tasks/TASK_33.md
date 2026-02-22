# TASK-33: Add TypeORMEventMode Enum and Dispatch Modes

**Specification:** [DECAF-6](../DECAF_6.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 2-3 hours

## Objective
Add support for two event dispatch modes:
1. **SUBSCRIBER** - Current: TypeORM entity subscribers (in-process only)
2. **TRIGGER** - New: Database-level triggers + event listening (multi-instance support)

## Implementation Steps

### 1. Add Event Mode Enum and Type
```typescript
// src/types.ts

export enum TypeORMEventMode {
  SUBSCRIBER = 'subscriber',  // TypeORM EntitySubscriber (current)
  TRIGGER = 'trigger',        // Database triggers +监听
}

export interface TypeORMDispatchOptions {
  /**
   * Event dispatch mode
   * - 'subscriber': Use TypeORM EntitySubscriber (single process only)
   * - 'trigger': Use database triggers for multi-instance coordination
   * @default 'subscriber'
   */
  eventMode?: TypeORMEventMode;
  
  /**
   * Polling interval in milliseconds for trigger mode (SQLite/MySQL)
   * @default 5000 (5 seconds)
   */
  pollingInterval?: number;
}
```

### 2. Update TypeORMDispatch Constructor
```typescript
// TypeORMDispatch.ts

export class TypeORMDispatch extends Dispatch<...> {
  private eventMode: TypeORMEventMode;
  private pollingInterval: number;
  private eventListenerActive: boolean = false;

  constructor(options: TypeORMDispatchOptions = {}) {
    super();
    this.eventMode = options.eventMode ?? TypeORMEventMode.SUBSCRIBER;
    this.pollingInterval = options.pollingInterval ?? 5000;
  }

  protected override async initialize(...args): Promise<void> {
    const { log } = (await this.logCtx(args, PersistenceKeys.INITIALIZATION, true)).for(this.initialize);

    try {
      switch (this.eventMode) {
        case TypeORMEventMode.SUBSCRIBER:
          await this.subscribeToTypeORM();
          log.info('Subscribed to TypeORM notifications (subscriber mode)');
          break;

        case TypeORMEventMode.TRIGGER:
          await this.setupDatabaseTriggers();
          await this.startEventListener();
          log.info('Database triggers + event listener initialized (trigger mode)');
          break;
      }
    } catch (e: unknown) {
      throw new InternalError(`Failed to initialize dispatch: ${e}`);
    }
  }
}
```

### 3. Implement Trigger Mode Setup
```typescript
// TypeORMDispatch.ts (continued)

private async setupDatabaseTriggers(): Promise<void> {
  if (!this.adapter) {
    throw new InternalError('No adapter configured for dispatch');
  }

  const driver = TypeORMAdapter.getDriver(this.adapter.client.options);
  const log = this.log.for(this.setupDatabaseTriggers);

  log.verbose(`Setting up database triggers for ${driver}...`);

  // Create trigger functions based on driver
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
      // SQLite doesn't support triggers for pg_notify, use polling
      log.info('SQLite detected: will use polling instead of triggers');
      break;
    default:
      log.warn(`Driver ${driver} does not support trigger-based events`);
  }
}

private async setupPostgresTriggers(): Promise<void> {
  const log = this.log.for('setupPostgresTriggers');
  
  // Check if notify function exists, create if not
  const functionExist = await this.adapter.client.query(`
    SELECT 1 FROM pg_proc WHERE proname = 'notify_table_changes'
  `);
  
  if (!functionExist.length) {
    await this.adapter.client.query(`
      CREATE OR REPLACE FUNCTION notify_table_changes()
      RETURNS trigger AS $$
      DECLARE
        data json;
        notification json;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          data = row_to_json(NEW);
        ELSIF TG_OP = 'UPDATE' THEN
          data = row_to_json(NEW);
        ELSIF TG_OP = 'DELETE' THEN
          data = row_to_json(OLD);
        END IF;
        
        notification = json_build_object(
          'table', TG_TABLE_NAME,
          'action', TG_OP,
          'data', data
        );
        
        PERFORM pg_notify('table_changes', notification::text);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    log.info('Created PostgreSQL notify_table_changes() function');
  }

  // Create triggers for each entity
  const metadataArgsStorage = getMetadataArgsStorage();
  const entities = metadataArgsStorage.storage.tables || [];
  
  for (const entity of entities) {
    const tableName = entity.target.name;
    const triggerName = `notify_${tableName}`;
    
    const triggerCheck = await this.adapter.client.query(`
      SELECT 1 FROM pg_triggers WHERE tgname = '${triggerName}'
    `);
    
    if (!triggerCheck.length) {
      await this.adapter.client.query(`
        CREATE TRIGGER ${triggerName}
        AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
        EXECUTE FUNCTION notify_table_changes();
      `);
      log.info(`Created trigger ${triggerName} on ${tableName}`);
    }
  }
}

private async setupMysqlTriggers(): Promise<void> {
  // MySQL/MariaDB trigger creation
  // Similar pattern but with different SQL syntax
}
```

### 4. Implement Event Listener
```typescript
// TypeORMDispatch.ts (continued)

private async startEventListener(): Promise<void> {
  const log = this.log.for(this.startEventListener);
  const driver = TypeORMAdapter.getDriver(this.adapter.client.options);
  
  switch (driver) {
    case TypeORMDriver.POSTGRES:
      this.startPostgresListener();
      break;
    case TypeORMDriver.MYSQL:
    case TypeORMDriver.MARIADB:
      this.startMysqlPolling();
      break;
    case TypeORMDriver.SQLITE:
      this.startSqlitePolling();
      break;
    default:
      log.warn(`Event listening not implemented for driver: ${driver}`);
  }
}

private async startPostgresListener(): Promise<void> {
  const log = this.log.for('startPostgresListener');
  
  // PostgreSQL LISTEN/NOTIFY
  this.adapter.client.query('LISTEN table_changes').then(() => {
    log.info('PostgreSQL LISTEN table_changes started');
  }).catch((err) => {
    log.error('Failed to LISTEN:', err);
  });

  // Handle notifications
  this.adapter.client.on('notification', (notification) => {
    this.handlePostgresNotification(notification);
  });
}

private handlePostgresNotification(notification: any): void {
  try {
    const payload = JSON.parse(notification.payload);
    const table = payload.table;
    const operation = payload.action;
    const ids = [payload.data.id]; // Extract from payload

    this.notificationHandler(table, operation, ids);
  } catch (e) {
    this.log.error('Failed to parse notification:', e);
  }
}

private startMysqlPolling(): void {
  // For MySQL, poll information_schema or a changes table
  setInterval(async () => {
    const changes = await this.adapter.client.query(`
      SELECT * FROM changes WHERE processed = 0 LIMIT 100
    `);
    
    for (const change of changes) {
      this.notificationHandler(change.table, change.operation, [change.id]);
      await this.adapter.client.query(
        `UPDATE changes SET processed = 1 WHERE id = ?`,
        [change.id]
      );
    }
  }, this.pollingInterval);
}

private startSqlitePolling(): void {
  // For SQLite, use polling or WAL mode monitoring
  setInterval(async () => {
    // Check for changes using timestamp columns or polling
  }, this.pollingInterval);
}
```

### 5. Documentation
Add to README or docs:
```markdown
## Event Dispatch Modes

### Subscriber Mode (Default)
Uses TypeORM's EntitySubscriber for change detection. Works within a single process.

```typescript
const dispatch = new TypeORMDispatch({
  eventMode: 'subscriber',
});
```

### Trigger Mode
Uses database triggers for multi-instance coordination. All adapter instances connected to the same database will receive events.

```typescript
const dispatch = new TypeORMDispatch({
  eventMode: 'trigger',
  pollingInterval: 5000, // Optional, default 5000ms
});
```

**Driver Support:**
- PostgreSQL: Full trigger + LISTEN/NOTIFY support
- MySQL/MariaDB: Triggers + polling fallback
- SQLite: Polling mode only (no pg_notify equivalent)
- SQL Server: Triggers + polling fallback
```

## Deliverables
- [ ] Update `src/types.ts` with `TypeORMEventMode` enum and `TypeORMDispatchOptions`
- [ ] Update `TypeORMDispatch.ts` constructor to accept options
- [ ] Implement `setupDatabaseTriggers()` with driver-specific logic
- [ ] Implement `startEventListener()` with driver-specific listeners
- [ ] Add tests in `for-typeorm/tests/unit/type-orm-dispatch-mode.test.ts`

## Notes
- Default mode should remain 'subscriber' to maintain backward compatibility
- Trigger mode requires appropriate database permissions
- Polling interval should be configurable for performance tuning
