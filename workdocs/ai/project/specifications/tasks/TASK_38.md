# TASK-38: Add Tests for Each Database Driver

**Specification:** [DECAF_6](../DECAF_6.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 4-6 hours

## Objective
Add comprehensive tests for TypeORM adapter multi-driver support (PostgreSQL, MySQL, SQLite, SQL Server).

## Test Files to Create
- `for-typeorm/tests/integration/postgres.test.ts` - PostgreSQL integration tests
- `for-typeorm/tests/integration/mysql.test.ts` - MySQL integration tests  
- `for-typeorm/tests/integration/sqlite.test.ts` - SQLite integration tests
- `for-typeorm/tests/integration/sqlserver.test.ts` - SQL Server integration tests (optional)

## Test Coverage
- Database creation/deletion per driver
- Driver detection from config
- Driver-specific SQL syntax
- TypeORM driver enum and detection logic

## Deliverables
- [ ] Integration test suite for PostgreSQL
- [ ] Integration test suite for MySQL
- [ ] Integration test suite for SQLite
- [ ] All tests pass with driver detection
