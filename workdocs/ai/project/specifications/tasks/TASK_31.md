# TASK-31: Add TypeORMDriver Enum and Driver Detection

**Specification:** [DECAF-6](../DECAF_6.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 1-2 hours

## Objective
Add driver detection and enumeration to enable multi-database support in TypeORM adapter.

## Implementation Steps

### 1. Create `src/types.ts` additions
```typescript
export enum TypeORMDriver {
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
  MARIADB = 'mariadb',
  SQLITE = 'sqlite',
  BETTER_SQLITE3 = 'better-sqlite3',
  CAPSQLITE = 'cap-sqlite',
  SQLSERVER = 'mssql',
  ORACLE = 'oracle',
  COCKROACHDB = 'cockroachdb',
}

export function detectTypeORMDriver(config: DataSourceOptions): TypeORMDriver {
  if (config.type) return config.type as TypeORMDriver;
  
  // Fallback to URL detection
  if (config.url) {
    if (config.url.includes('postgres') || config.url.includes('cockroachdb')) {
      return TypeORMDriver.POSTGRES;
    }
    if (config.url.includes('mysql') || config.url.includes('mariadb')) {
      return TypeORMDriver.MYSQL;
    }
    if (config.url.includes('sqlite')) {
      // Could be sqlite, better-sqlite3, or cap-sqlite
      return TypeORMDriver.SQLITE;
    }
    if (config.url.includes('mssql')) {
      return TypeORMDriver.SQLSERVER;
    }
    if (config.url.includes('oracle')) {
      return TypeORMDriver.ORACLE;
    }
  }
  
  // Default for backward compatibility
  return TypeORMDriver.POSTGRES;
}
```

### 2. Add helper methods to TypeORMAdapter
```typescript
export class TypeORMAdapter extends Adapter<...> {
  protected driver: TypeORMDriver;
  
  constructor(config, flavour = TypeORMFlavour, alias?) {
    super(config, flavour, alias);
    this.driver = detectTypeORMDriver(config);
  }

  protected getDriver(): TypeORMDriver {
    return this.driver;
  }

  static getDriver(config: DataSourceOptions): TypeORMDriver {
    return detectTypeORMDriver(config);
  }
}
```

## Deliverables
- [ ] `src/types.ts`: Add `TypeORMDriver` enum and `detectTypeORMDriver()` function
- [ ] `TypeORMAdapter.ts`: Add driver property and helper methods
- [ ] Unit test in `for-typeorm/tests/unit/driver-detection.test.ts`

## Notes
- The driver detection should handle both `config.type` and URL-based detection
- Be prepared to support additional TypeORM drivers in the future
