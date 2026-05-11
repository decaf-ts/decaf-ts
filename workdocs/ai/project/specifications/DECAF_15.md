# DECAF-15: Webhook Signature Verification Middleware

**Status:** Draft
**Priority:** Critical (Security)
**Owner:** HTTP Module Team

## 1. Overview
Implement a robust webhook signature verification middleware for the decaf-ts HTTP module that validates HMAC-SHA256 signatures on incoming webhook requests. This middleware will ensure that all webhook deliveries to subscriber endpoints are authenticated and protect against unauthorized or malicious webhook deliveries.

## 2. Goals
*   [ ] Create a signature verification middleware class that validates HMAC-SHA256 signatures
*   [ ] Verify `x-webhook-signature` header against expected signature computed from payload and subscription secret
*   [ ] Reject requests with invalid signatures (401 Unauthorized)
*   [ ] Log verification failures for security monitoring
*   [ ] Support both direct middleware usage and service-based verification
*   [ ] Provide comprehensive tests covering valid, invalid, and edge cases

## 3. User Stories / Requirements
*   **US-1:** As a webhook subscriber, I want to verify that incoming webhook requests are authentic so I can trust the event data
*   **US-2:** As a developer, I want the middleware to automatically reject invalid signatures so I don't have to manually verify each request
*   **US-3:** As an operator, I want verification failures logged so I can monitor for potential security issues
*   **Req-1:** The middleware must use the existing `verifyWebhookSignature()` utility function from `utils.ts`
*   **Req-2:** The middleware must extract the subscription secret from the database using the `subscriptionId` or endpoint URL
*   **Req-3:** Invalid signatures must return HTTP 401 with appropriate error message
*   **Req-4:** Missing signature header must return HTTP 400 with error message
*   **Req-5:** Verification must use timing-safe comparison to prevent timing attacks
*   **Req-6:** The middleware must integrate with the existing decaf-ts middleware system
*   **Req-7:** All middleware components must have unit tests with >80% coverage

## 4. Architecture & Design
**Primary Modules:**
*   `for-http/src/server/hooks/` - New middleware class and integration
*   `for-http/src/server/hooks/utils.ts` - Existing signature verification utilities
*   `for-http/src/server/hooks/types.ts` - TypeScript type definitions
*   `for-http/src/server/hooks/constants.ts` - Configuration and constants

**Design Patterns:**
*   **Middleware Pattern:** NestJS/Express-style middleware with request/response context
*   **Service Pattern:** Signature verification as a service with injectable dependencies
*   **Error Handling:** Centralized error response formatting

**Component Design:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Webhook Signature Middleware                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  Request         │    │  Subscription    │               │
│  │  Headers:        │    │  Service         │               │
│  │  x-webhook-      │    │  (Database)      │               │
│  │  signature       │    │                  │               │
│  └────────┬─────────┘    └────────┬─────────┘               │
│           │                       │                          │
│           │                       ▼                          │
│           │                  ┌──────────────┐               │
│           │                  │ Extract      │               │
│           │                  │ secret from  │               │
│           │                  │ database     │               │
│           │                  └──────────────┘               │
│           ▼                       │                          │
│  ┌──────────────────┐           ▼                          │
│  │  Verify          │    ┌──────────────────┐               │
│  │  HMAC-SHA256     │    │  Timing-safe     │               │
│  │  Payload +       │    │  Comparison      │               │
│  │  Secret          │    │  Result          │               │
│  └────────┬─────────┘    └──────────────────┘               │
│           │                                                 │
│  ┌────────┴─────────┐                                       │
│  │  Response        │                                       │
│  │  200 OK          │                                       │
│  │  or 401Unauthorized│                                     │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Approach:**
1. Create `WebhookSignatureMiddleware` class in `utils.ts` or new `middleware.ts`
2. Implement middleware method: `verify(req, res, next)` 
3. Extract signature from `x-webhook-signature` header (or `x-hub-signature` for compatibility)
4. Parse signature format: `hmac-sha256=<hash>` or raw hex
5. Look up subscription secret from database using event metadata or URL-based lookup
6. Compute expected signature using existing `signWebhookPayload()` utility
7. Use `timingSafeEqual()` for constant-time comparison
8. Call `next()` on success or return 401 on failure
9. Log verification failures with metadata (endpoint, timestamp, error type)

**Data Flow:**
```
Subscriber receives webhook POST
    ↓
Middleware intercepts request
    ↓
Extract: x-webhook-signature header
    ↓
Extract: x-webhook-id and x-webhook-topic headers (optional, for subscription lookup)
    ↓
Query: webhook_subscriptions table where urlmatches target endpoint
    ↓
Compute: HMAC-SHA256(payload, subscription.secret)
    ↓
Compare: Timing-safe comparison with received signature
    ↓
Result: Accept (200) or Reject (401)
```

**Configuration Options:**
```typescript
export type SignatureMiddlewareConfig = {
  logging?: {
    enabled?: boolean;
    level?: 'debug' | 'info' | 'error';
    includePayloadHash?: boolean;
  };
  headerNames?: {
    signature?: string;
    webhookId?: string;
    topic?: string;
  };
  fallbackToPublicKey?: boolean;
};
```

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID           | Task Name                            | Priority | Status  | Dependencies |
|:-------------|:-------------------------------------|:---------|:--------|:-------------|
| TASK-119 | [Create WebhookSignatureMiddleware class](./tasks/TASK_119.md) | Critical     | Pending | -            |
| TASK-120 | [Implement signature extraction and lookup logic](./tasks/TASK_120.md) | Critical   | Pending | TASK-119 |
| TASK-121 | [Add timing-safe comparison with logging](./tasks/TASK_121.md) | Critical   | Pending | TASK-120 |
| TASK-122 | [Create unit tests for middleware](./tasks/TASK_122.md) | Critical   | Pending | TASK-121 |
| TASK-123 | [Create integration tests](./tasks/TASK_123.md) | High     | Pending | TASK-122 |
| TASK-124 | [Add to index.ts exports and documentation](./tasks/TASK_124.md) | Medium   | Pending | TASK-123 |
| TASK-125 | [Update webhook spec with middleware section](./tasks/TASK_125.md) | Medium   | Pending | TASK-124 |

## 6. Open Questions / Risks
*   Should the middleware support multiple signature formats (e.g., `sha1=`, `sha256=`, raw hex)?
*   Should verification failures be logged at error level or info level with security context?
*   Should there be a configuration option to allow signature verification to be skipped (e.g., for localhost testing)?
*   Should the middleware support a "staging mode" that logs failures but doesn't reject requests?
*   How should the middleware handle cases where the subscription cannot be found (401 vs 404)?

## 7. Results & Artifacts
*   New `WebhookSignatureMiddleware` class in `for-http/src/server/hooks/middleware.ts`
*   Export in `for-http/src/server/hooks/index.ts`
*   Unit tests in `for-http/tests/unit/webhook-signature-middleware.test.ts`
*   Integration tests in `for-http/tests/integration/webhook-signature-middleware.test.ts`
*   Integration test MUST use `NanoAdapter` from `@decaf-ts/for-nano` with real CouchDB
*   All webhook models decorated with `@model()`, `@table()`, and `@index()` to prevent CouchDB warnings
*   Updated documentation in `README.md` and specification documents
*   Updated `WEBHOOK_TASKS.md` to mark signature verification as complete

## 8. Implementation Details
**Key Methods:**
*   `WebhookSignatureMiddleware.verifySignature(request, subscriptionSecret): boolean`
*   `WebhookSignatureMiddleware.extractSignature(headers): string | null`
*   `WebhookSignatureMiddleware.lookupSubscription(endpointUrl): Promise<Subscription>`
*   `WebhookSignatureMiddleware.formatError(message, code):Error`

**Error Response Format:**
```typescript
{
  error: {
    code: 'WEBHOOK_SIGNATURE_INVALID' | 'WEBHOOK_SIGNATURE_MISSING',
    message: 'Invalid webhook signature' | 'Webhook signature header is required',
    timestamp: string,
    requestId?: string
  }
}
```

**Request Example with Valid Signature:**
```http
POST /webhook-endpoint HTTP/1.1
Host: example.com
Content-Type: application/json
X-Webhook-Id: evt_1234567890abcdef
X-Webhook-Topic: user.created
X-Webhook-Signature: hmac-sha256=abc123def456...

{
  "id": "evt_1234567890abcdef",
  "topic": "user.created",
  "entity": "user",
  "action": "created",
  "payload": { ... }
}
```

**Verification Flow:**
1. Extract signature from headers
2. Query `webhook_subscriptions` for matching `url`
3. Compute `HMAC-SHA256(rawBody, secret)`
4. Compare with extracted signature using `timingSafeEqual`
5. If match: call `next()`, if not: return 401

## 9. Current State Notes
The webhook delivery system currently implements signature generation on outgoing deliveries but lacks signature verification on incoming webhook requests. Subscriber applications need this middleware to verify webhook authenticity and protect against Unauthorized webhook deliveries.

**Existing Code to Leverage:**
*   `utils.ts:verifyWebhookSignature()` - Timing-safe signature verification
*   `utils.ts:signWebhookPayload()` - Signature generation (for understanding format)
*   `SubscriptionService` - Query subscriptions by URL
*   `Subscription` model - Get webhook subscription secrets

**Security Considerations:**
*   Must use timing-safe comparison to prevent timing attacks
*   Should log verification failures for security monitoring
*   Should not leak which subscription was lookup failure vs signature mismatch
*   Should validate header format before processing

**Persistence Requirements:**
*   **NanoAdapter Integration:** At least one integration test MUST use `NanoAdapter` from `@decaf-ts/for-nano` as the persistence backend for webhook subscriptions
*   **Index Declarations:** All webhook-related model classes (`WebhookSubscription`, `WebhookEventRecord`, `WebhookDelivery`) MUST be decorated with `@index(...)` to properly declare required indexes
*   **Index Coverage:** Indexes must cover:
  *   `webhook_subscriptions`: `url`, `topic`, `active` fields for subscription lookup
  *   `webhook_events`: `topic`, `status`, `nextAttemptAt` for event polling
  *   `webhook_deliveries`: `eventId`, `subscriptionId`, `status`, `nextAttemptAt` for delivery tracking
*   **No CouchDB Warnings:** Index declarations must prevent any CouchDB "missing index" warnings during development/integration testing
*   **Composite Indexes:** Consider composite indexes for common query patterns (e.g., `{status: 1, nextAttemptAt: 1}` for pending deliveries)

**Integration Test Requirements:**
*   Integration test MUST use `NanoAdapter` from `@decaf-ts/for-nano` 
*   Test database must use real CouchDB (not RamAdapter)
*   Model classes must be decorated with `@model()` and `@table()` from `@decaf-ts/db-decorators`
*   All required query fields must have corresponding `@index()` decorators
*   Index names should follow the pattern: `{tableName}_{fieldName}_idx`
