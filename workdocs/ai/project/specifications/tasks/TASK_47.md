# TASK-47: Update Zod Schemas for All Operations

**Specification:** [SPECIFICATION-2](../SPECIFICATION_2.md)  
**Priority:** High  
**Status:** Completed — all Jira schema exports are centralized and up-to-date.
**Estimated Time:** 2-3 hours

## Objective
Create and standardize Zod schemas for all Jira operations.

## Schemas to Create

### 1. Issue Schemas
```typescript
// src/modules/jira/schemas/types/index.ts
export * from './create-issue-input';
export * from './update-issue-input';
export * from './issue-transition-input';
```

### 2. Comment Schemas
```typescript
// src/modules/jira/schemas/types/index.ts
export * from './add-comment-input';
export * from './list-comments-input';
```

### 3. Assignment Schemas
```typescript
// src/modules/jira/schemas/types/index.ts
export * from './assign-issue-input';
```

### 4. Link Schemas
```typescript
// src/modules/jira/schemas/types/index.ts
export * from './create-link-input';
```

### 5. Attachment Schemas
```typescript
// src/modules/jira/schemas/types/index.ts
export * from './attach-issue-input';
```

### 6. Worklog Schemas
```typescript
// src/modules/jira/schemas/types/index.ts
export * from './add-worklog-input';
```

## Deliverables
- [x] All schema files created
- [x] Types exported via `src/modules/jira/schemas/types/index.ts`
- [x] Schema updates completed
- [x] All schemas validated (covered by unit tests)
