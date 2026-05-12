# TASK-124: Add to Index Exports and Documentation

**ID:** TASK-124
**Specification:** [DECAF-15](../DECAF_15.md)
**Priority:** Medium
**Status:** Completed
**Dependencies:** TASK-123

## 1. Description
Export the new middleware from the package's public API and update documentation to include usage examples and API reference.

## 2. Objectives
*   [ ] Export `WebhookSignatureMiddleware` from `index.ts`
*   [ ] Add usage example to README.md
*   [ ] Add API documentation to WEBHOOK_SPEC.md
*   [ ] Update WEBHOOK_TASKS.md to mark task complete

## 3. Implementation Plan
**Proposed Changes:**
*   Add to `src/server/hooks/index.ts`: `export * from './middleware'`
*   Add example to `src/server/hooks/README.md`
*   Add section to `src/server/hooks/WEBHOOK_SPEC.md`
*   Update status in `src/server/hooks/WEBHOOK_TASKS.md`

**Export Structure:**
```typescript
export * from './middleware';
export * from './models';
export * from './constants';
export * from './decorators';
export * from './DeliveryService';
export * from './observers';
export * from './PublisherService';
export * from './SubscriptionService';
export * from './types';
export * from './utils';
export * from './WebhookWorkerService';
```

## 4. Verification Plan
**Automated Tests:**
*   [ ] Module builds without errors
*   [ ] Export is accessible from package
*   [ ] Types are properly exported

**Manual Verification:**
*   Step 1: Run `npm run build`
*   Step 2: Verify no build errors
*   Step 3: Check Types are exported correctly

## 5. Blockers & Clarifications
*   **Clarification 1:** Should the middleware be exported from a subpath? (Answer: No, directly from main export)

## 6. Execution Log
*   [Date] - Started task.
