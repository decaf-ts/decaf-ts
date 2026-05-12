# TASK-120: Implement Signature Extraction and Lookup Logic

**ID:** TASK-120
**Specification:** [DECAF-15](../DECAF_15.md)
**Priority:** Critical
**Status:** In Progress
**Dependencies:** TASK-119

## 1. Description
Implement the signature extraction and subscription lookup logic for the `WebhookSignatureMiddleware`. This includes parsing the signature header, extracting the webhook payload from the request, and looking up the subscription secret from the database.

## 2. Objectives
*   [ ] Extract signature from request headers (support multiple header formats)
*   [ ] Extract webhook payload from request body
*   [ ] Look up subscription by endpoint URL from request
*   [ ] Handle cases where subscription is not found
*   [ ] Validate signature format before verification

## 3. Implementation Plan
**Proposed Changes:**
*   Implement `lookupSubscription()` method in `WebhookSignatureMiddleware`
*   Add header parsing logic to extract signature in multiple formats
*   Add logic to extract raw body from request (buffer/raw body)
*   Implement error handling for missing subscription

**Technical Details:**
*   Support header formats: `x-webhook-signature`, `x-hub-signature`
*   Signature format: `hmac-sha256=<hex-hash>` or raw hex
*   Extract raw body from `req.rawBody` or reconstruct from buffer/stream
*   Query `webhook_subscriptions` where `url = endpoint` or use pattern matching
*   Return subscription object with `id`, `url`, `secret`, `active` fields
*   Model classes must be decorated with `@model()` and `@table()` from `@decaf-ts/db-decorators`
*   `WebhookSubscription` must have `@index()` on `url`, `topic`, `active` for efficient lookup
*   If using NanoAdapter, these indexes are required to prevent CouchDB "missing index" warnings

**Signature Header Parsing:**
```typescript
interface SignatureHeader {
  algorithm: string;  // 'sha256', 'sha1', etc.
  hash: string;       // hex-encoded hash
  fullValue: string;  // original header value
}
```

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/webhook-signature-middleware-lookup.test.ts`
  *   Test valid signature extraction
  *   Test different header formats
  *   Test subscription lookup by URL
  *   Test subscription not found handling
  *   Test invalid signature format rejection

**Manual Verification:**
*   Step 1: Create test subscription in database
*   Step 2: Send request with signature header
*   Step 3: Verify subscription is looked up correctly
*   Step 4: Verify missing subscription returns proper error

## 5. Blockers & Clarifications
*   **Clarification 1:** Should wildcard subscription patterns be supported? (Answer: No, exact URL match only)
*   **Clarification 2:** Should the lookup support query parameters in the URL? (Answer: No, path-only matching)

## 6. Execution Log
*   [Date] - Started task.
