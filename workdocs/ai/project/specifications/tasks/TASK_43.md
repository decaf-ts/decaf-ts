# TASK-43: Comment Management Tools (Add, List)

**Specification:** [SPECIFICATION-2](../SPECIFICATION_2.md)  
**Priority:** High  
**Status:** Completed — add/list comment tools plus schemas ship with comprehensive tests; optional update/delete tools are not required today.
**Estimated Time:** 3-4 hours

## Objective
Implement Jira comment management tools: add comments and list issue comments.

## Files to Create

### 1. Schema: `src/modules/jira/schemas/add-comment-input.ts`
```typescript
import { z } from 'zod';

export const addCommentInputSchema = z.object({
  issueId: z.string().min(1),
  body: z.string().min(1),
  visibility: z.object({
    type: z.enum(['role', 'group']),
    value: z.string(),
  }).optional(),
});

export type AddCommentInput = z.infer<typeof addCommentInputSchema>;
```

### 2. Schema: `src/modules/jira/schemas/list-comments-input.ts`
```typescript
import { z } from 'zod';

export const listCommentsInputSchema = z.object({
  issueId: z.string().min(1),
  start: z.number().optional().default(0),
  maxResults: z.number().optional().default(50),
  orderBy: z.string().optional(),
  expand: z.string().optional(),
});

export type ListCommentsInput = z.infer<typeof listCommentsInputSchema>;
```

### 3. Tool: `src/modules/jira/tools/comment-add.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';
import { addCommentInputSchema } from '../schemas/add-comment-input';

export const name = 'jira.comment-add';

export const inputSchema = addCommentInputSchema;

export async function runTool(client: any, input: any) {
  try {
    const comment: any = {
      body: input.body,
    };

    if (input.visibility) {
      comment.visibility = input.visibility;
    }

    const response = await client.issues.addComment({
      issueId: input.issueId,
      comment: comment,
    });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 4. Tool: `src/modules/jira/tools/comment-list.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';
import { listCommentsInputSchema } from '../schemas/list-comments-input';

export const name = 'jira.comment-list';

export const inputSchema = listCommentsInputSchema;

export async function runTool(client: any, input: any) {
  try {
    const response = await client.issues.getComments({
      issueId: input.issueId,
      start: input.start,
      maxResults: input.maxResults,
      orderBy: input.orderBy,
      expand: input.expand,
    });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 5. Tool: `src/modules/jira/tools/comment-update.ts` (Optional)
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.comment-update';

export const inputSchema = z.object({
  issueId: z.string().min(1),
  commentId: z.string().min(1),
  body: z.string().min(1),
  newVisibility: z.object({
    type: z.enum(['role', 'group']),
    value: z.string(),
  }).optional(),
});

export async function runTool(client: any, input: any) {
  try {
    const comment: any = {
      body: input.body,
    };

    if (input.newVisibility) {
      comment.visibility = input.newVisibility;
    }

    const response = await client.issues.updateComment({
      issueId: input.issueId,
      commentId: input.commentId,
      comment: comment,
    });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 6. Tool: `src/modules/jira/tools/comment-delete.ts` (Optional)
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.comment-delete';

export const inputSchema = z.object({
  issueId: z.string().min(1),
  commentId: z.string().min(1),
});

export async function runTool(client: any, input: any) {
  try {
    await client.issues.deleteComment({
      issueId: input.issueId,
      commentId: input.commentId,
    });

    return {
      success: true,
      message: `Comment ${input.commentId} deleted successfully`,
    };
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

## Tests Required
- [x] `tests/unit/jira/comment.add.spec.ts` (covers visibility variations and special characters)
- [x] `tests/unit/jira/comment.list.spec.ts` (covers pagination, ordering, expand)
- [ ] `tests/unit/jira/comment.update.spec.ts` (optional – not implemented)
- [ ] `tests/unit/jira/comment.delete.spec.ts` (optional – not implemented)
- [x] All tests pass via `npm run test:unit`

## Deliverables
- [x] `src/modules/jira/schemas/add-comment-input.ts`
- [x] `src/modules/jira/schemas/list-comments-input.ts`
- [x] `src/modules/jira/tools/comment-add.ts`
- [x] `src/modules/jira/tools/comment-list.ts`
- [ ] Optional: comment.update/comment.delete tools (left unimplemented by design)
- [x] `tests/unit/jira/comment.add.spec.ts` and `tests/unit/jira/comment.list.spec.ts`
- [x] All tests pass
- [ ] All tests pass
