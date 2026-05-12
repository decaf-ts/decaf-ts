# TASK-123: Create Integration Tests

**ID:** TASK-123
**Specification:** [DECAF-15](../DECAF_15.md)
**Priority:** High
**Status:** Completed
**Dependencies:** TASK-122

## 1. Description
Create integration tests that verify the middleware works correctly in a real HTTP environment with actual database lookups and full request/response cycles.

## 2. Objectives
*   [ ] Test middleware with real HTTP server
*   [ ] Test database subscription lookup
*   [ ] Test full request/response flow
*   [ ] Test error handling in real environment
*   [ ] Test with multiple subscriptions

## 3. Implementation Plan
**Proposed Changes:**
*   Create `tests/integration/webhook-signature-middleware.test.ts`
*   Use fastify/express for test server
*   Use `NanoAdapter` from `@decaf-ts/for-nano` with real CouchDB for subscription storage
*   All model classes must be decorated with `@model()`, `@table()`, and `@index()` decorators
*   Test actual HTTP requests with signature header

**Test Scenarios:**
```typescript
describe('WebhookSignatureMiddleware Integration', () => {
  describe('Full Flow', () => {
    it('should verify signature with live database lookup', async () => {
      // Setup: Create subscription in test database
      // Setup: Start test server with middleware
      // Act: POST webhook with valid signature
      // Assert: Response status 200
    });

    it('should reject when subscription does not exist', async () => {
      // Setup: Start test server without subscription
      // Act: POST webhook with valid signature format
      // Assert: Response status 401 (subscription not found)
    });

    it('should handle multiple subscriptions correctly', async () => {
      // Setup: Create multiple subscriptions for different endpoints
      // Act: POST to endpoint 1 with correct signature
      // Assert: Response 200
      // Act: POST to endpoint 2 with endpoint 1's signature
      // Assert: Response 401 (signature doesn't match endpoint 2)
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format for missing signature', async () => {
      // Act: POST without signature header
      // Assert: Response 400 with error object
      // Assert: Error object has code, message, timestamp
    });

    it('should return proper error format for invalid signature', async () => {
      // Act: POST with invalid signature
      // Assert: Response 401 with error object
      // Assert: Error object doesn't leak subscription info
    });
  });
});
```

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration tests running with Jest
*   [ ] Database cleanup between tests
*   [ ] All tests passing

**Manual Verification:**
*   Step 1: Run `npm run test:integration`
*   Step 2: Verify all integration tests pass
*   Step 3: Check test database state after runs

## 5. Blockers & Clarifications
*   **Clarification 1:** Should integration tests use a real database or in-memory? (Answer: Real NanoAdapter with CouchDB required for production compatibility)
*   **Clarification 2:** What database indexes are required? (Answer: All webhook models must use `@index()` to declare required indexes for `WebhookSubscription`, `WebhookEventRecord`, and `WebhookDelivery`)
*   **Clarification 3:** Which adapter for integration tests? (Answer: NanoAdapter from `@decaf-ts/for-nano` with real CouchDB instance)

## 6. Execution Log
*   [Date] - Started task.
