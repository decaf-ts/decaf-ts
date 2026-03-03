# TASK-42: Issue Assignment Tool

**Specification:** [SPECIFICATION-2](../SPECIFICATION_2.md)  
**Priority:** High  
**Status:** Completed — assignment/unassignment tools plus schema exist and share the same normalization layer.
**Estimated Time:** 2-3 hours

## Objective
Implement Jira issue assignment/unassignment tool.

## Files to Create

### 1. Schema: `src/modules/jira/schemas/assign-issue-input.ts`
```typescript
import { z } from 'zod';

export const assignIssueInputSchema = z.object({
  issueId: z.string().min(1),
  assignee: z.union([
    z.string(),  // username or accountId
    z.object({ accountId: z.string() }),
    z.object({ accountType: z.string() }),
  ]),
});

export type AssignIssueInput = z.infer<typeof assignIssueInputSchema>;
```

### 2. Tool: `src/modules/jira/tools/assign.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';
import { assignIssueInputSchema } from '../schemas/assign-issue-input';

export const name = 'jira.assign-issue';

export const inputSchema = assignIssueInputSchema;

export async function runTool(client: any, input: any) {
  try {
    let assignee: any;
    
    if (typeof input.assignee === 'string') {
      assignee = { accountId: input.assignee };
    } else {
      assignee = input.assignee;
    }

    const response = await client.issues.assign({
      issueId: input.issueId,
      assignee: assignee,
    });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 3. Tool: `src/modules/jira/tools/unassign.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.unassign-issue';

export const inputSchema = z.object({
  issueId: z.string().min(1),
});

export async function runTool(client: any, input: any) {
  try {
    // To unassign, set assignee to -1 (unassigned)
    const response = await client.issues.assign({
      issueId: input.issueId,
      assignee: { accountId: '-1' },
    });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

## Tests Required
- [x] `tests/unit/jira/assign.spec.ts` (covers accountId/username/accountType assignment plus unassignment and permission failures)
- [x] All tests pass via `npm run test:unit`

## Deliverables
- [x] `src/modules/jira/schemas/assign-issue-input.ts`
- [x] `src/modules/jira/tools/assign.ts`
- [x] `src/modules/jira/tools/unassign.ts`
- [x] `tests/unit/jira/assign.spec.ts` exercising both tools
- [x] All tests pass
