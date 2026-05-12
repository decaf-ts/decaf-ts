# TASK-119: Create WebhookSignatureMiddleware Class

**ID:** TASK-119
**Specification:** [DECAF-15](../DECAF_15.md)
**Priority:** Critical
**Status:** Completed

## 1. Description
Create the core `WebhookSignatureMiddleware` class that implements webhook signature verification for incoming HTTP requests. This middleware will be used by subscriber applications to verify the authenticity of webhook deliveries from the decaf-ts webhook system.

## 2. Objectives
*   [ ] Implement `WebhookSignatureMiddleware` class with verify method
*   [ ] Extract signature from `x-webhook-signature` header
*   [ ] Look up subscription secret from database
*   [ ] Implement timing-safe signature verification
*   [ ] Return appropriate HTTP responses (200 OK, 400 Bad Request, 401 Unauthorized)
*   [ ] Log verification failures with appropriate context

## 3. Implementation Plan
**Proposed Changes:**
*   Create `src/server/hooks/middleware.ts` with `WebhookSignatureMiddleware` class
*   Update `src/server/hooks/index.ts` to export `WebhookSignatureMiddleware`
*   Import `WebhookSignatureMiddleware` in `SubscriptionService` to enable dependency injection

**Technical Details:**
*   Class should accept optional configuration object for header names and logging
*   Use existing `verifyWebhookSignature()` from `utils.ts` for actual verification
*   Use `timingSafeEqual()` for constant-time comparison to prevent timing attacks
*   Query `webhook_subscriptions` table using the endpoint URL or event metadata
*   Support both `x-webhook-signature` (decaf standard) and `x-hub-signature` (GitHub compatibility) headers
*   Model classes must be decorated with `@model()` and `@table()` from `@decaf-ts/db-decorators`
*   All query fields must have `@index()` decorators to prevent CouchDB warnings
*   Integration tests must use `NanoAdapter` from `@decaf-ts/for-nano` with real CouchDB

**Class Structure:**
```typescript
export class WebhookSignatureMiddleware {
  constructor(config?: SignatureMiddlewareConfig);
  verify(req: Request, res: Response, next: NextFunction): Promise<void>;
  private lookupSubscription(endpoint: string): Promise<Subscription | null>;
  private formatError(code: string, message: string): ResponseBody;
}
```

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/webhook-signature-middleware.test.ts`
  *   Test valid signature passes
  *   Test invalid signature returns 401
  *   Test missing signature returns 400
  *   Test wrong secret returns 401
  *   Test timing-safe comparison (edge cases)
*   [ ] Integration Test: `tests/integration/webhook-signature-middleware.test.ts`
  *   Test middleware with real HTTP request
  *   Test integration with SubscriptionService
  *   Test middleware with multiple subscriptions

**Manual Verification:**
*   Step 1: Start a test server with the middleware applied
*   Step 2: Send a webhook request with valid signature
*   Step 3: Verify the request is accepted (200 OK)
*   Step 4: Send a webhook request with invalid signature
*   Step 5: Verify the request is rejected (401 Unauthorized)
*   Step 6: Check logs for verification failures

## 5. Blockers & Clarifications
*   **Clarification 1:** Should the middleware also verify the webhook payload format? (Answer: No, payload validation is separate concern)
*   **Clarification 2:** Should the middleware support skipping verification for certain endpoints? (Answer: Yes, via configuration option `bypassForLocalhost`)
*   **Clarification 3:** Should verification failures include the subscription ID in the error response? (Answer: No, to prevent information disclosure)

## 6. Execution Log
*   [Date] - Started task.
