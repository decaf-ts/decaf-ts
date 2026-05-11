# TASK-121: Add Timing-Safe Comparison with Logging

**ID:** TASK-121
**Specification:** [DECAF-15](../DECAF_15.md)
**Priority:** Critical
**Status:** Pending
**Dependencies:** TASK-120

## 1. Description
Implement timing-safe signature comparison using `crypto.timingSafeEqual()` and add comprehensive logging for verification failures. This is critical for security to prevent timing attacks.

## 2. Objectives
*   [ ] Use `crypto.timingSafeEqual()` for constant-time signature comparison
*   [ ] Add debug logging for successful verifications
*   [ ] Add error logging for failed verifications
*   [ ] Include relevant metadata in log entries
*   [ ] Protect against information disclosure in error responses

## 3. Implementation Plan
**Proposed Changes:**
*   Implement `verifySignature()` method using `timingSafeEqual()`
*   Add logging helper with configurable level
*   Add metadata to error responses (request ID, timestamp) without secrets

**Technical Details:**
*   Use `Buffer.from()` for both expected and received signatures
*   Check lengths match before `timingSafeEqual()`
*   Log at error level for failures, debug for success
*   Include: timestamp, endpoint, requestId, signature algorithm
*   Never log: raw payload, secret, or sensitive data

**Logging Format:**
```typescript
// Success (debug level)
{
  level: 'debug',
  message: 'Webhook signature verified successfully',
  endpoint: 'https://api.example.com/webhooks',
  timestamp: '2026-05-11T12:00:00Z',
  requestId: 'req_123'
}

// Failure (error level)
{
  level: 'error',
  message: 'Webhook signature verification failed',
  endpoint: 'https://api.example.com/webhooks',
  reason: 'signature_mismatch' | 'header_missing' | 'subscription_not_found',
  timestamp: '2026-05-11T12:00:00Z',
  requestId: 'req_123'
}
```

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/webhook-signature-middleware-verification.test.ts`
  *   Test timing-safe comparison with matching signatures
  *   Test timing-safe comparison with different signatures
  *   Test different length signatures
  *   Test logging of successful verification
  *   Test logging of failed verification
  *   Test error response format

**Manual Verification:**
*   Step 1: Enable debug logging
*   Step 2: Send valid webhook request
*   Step 3: Verify debug log entry
*   Step 4: Send invalid webhook request
*   Step 5: Verify error log entry

## 5. Blockers & Clarifications
*   **Clarification 1:** Should failed verifications include a retry-after header? (Answer: No, not applicable for signature verification)
*   **Clarification 2:** Should the middleware support rate limiting failed attempts? (Answer: No, separate feature for DECAF-16)

## 6. Execution Log
*   [Date] - Started task.
