# TASK-122: Create Unit Tests for Middleware

**ID:** TASK-122
**Specification:** [DECAF-15](../DECAF_15.md)
**Priority:** Critical
**Status:** Pending
**Dependencies:** TASK-121

## 1. Description
Create comprehensive unit tests for the `WebhookSignatureMiddleware` covering all verification scenarios, edge cases, and error conditions.

## 2. Objectives
*   [ ] Test valid signature acceptance
*   [ ] Test invalid signature rejection
*   [ ] Test missing signature header handling
*   [ ] Test different signature formats
*   [ ] Test edge cases and boundary conditions
*   [ ] Achieve >80% code coverage

## 3. Implementation Plan
**Proposed Changes:**
*   Create `tests/unit/webhook-signature-middleware.test.ts`
*   Mock `SubscriptionService` for subscription lookup
*   Mock logger to verify log calls
*   Test middleware in isolation without HTTP server

**Test Cases:**
```typescript
describe('WebhookSignatureMiddleware', () => {
  describe('verify()', () => {
    it('should accept request with valid signature', async () => {
      // Mock: subscription found with correct secret
      // Mock: signature matches
      // Expect: next() called, no error
    });

    it('should reject request with invalid signature', async () => {
      // Mock: subscription found with wrong secret
      // Mock: signature doesn't match
      // Expect: 401 response, error logged
    });

    it('should reject request without signature header', async () => {
      // Mock: no signature header in request
      // Expect: 400 response, error logged
    });

    it('should handle missing subscription gracefully', async () => {
      // Mock: subscription not found for endpoint
      // Expect: 401 response, error logged
    });

    it('should support x-hub-signature header for GitHub compatibility', async () => {
      // Mock: request with x-hub-signature instead of x-webhook-signature
      // Mock: valid signature
      // Expect: request accepted
    });

    it('should use timing-safe comparison', async () => {
      // Test: verify timingSafeEqual is called
      // Test: different length signatures handled correctly
    });
  });
});
```

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit tests running with Jest
*   [ ] Coverage report >80%
*   [ ] All tests passing

**Manual Verification:**
*   Step 1: Run `npm run test:unit`
*   Step 2: Verify all middleware tests pass
*   Step 3: Check coverage report

## 5. Blockers & Clarifications
*   **Clarification 1:** Should tests include payload parsing scenarios? (Answer: Yes, test both raw body and JSON body)

## 6. Execution Log
*   [Date] - Started task.
