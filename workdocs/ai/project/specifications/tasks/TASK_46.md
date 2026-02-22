# TASK-46: Worklog Management Tool

**Specification:** [SPECIFICATION-2](../SPECIFICATION_2.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 2-3 hours

## Objective
Implement Jira worklog management tool for logging time on issues.

## Files to Create

### 1. Schema: `src/modules/jira/schemas/add-worklog-input.ts`
```typescript
import { z } from 'zod';

export const addWorklogInputSchema = z.object({
  issueId: z.string().min(1),
  timeSpent: z.string(),  // e.g., '2h 30m', '3d', '4h'
  comment: z.string().optional(),
  author: z.object({
    accountId: z.string(),
  }).optional(),
  startingOn: z.string().optional(),  // ISO 8601 date
  artifact: z.string().optional(),  // e.g., commit hash
});

export type AddWorklogInput = z.infer<typeof addWorklogInputSchema>;
```

### 2. Tool: `src/modules/jira/tools/worklog-add.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';
import { addWorklogInputSchema } from '../schemas/add-worklog-input';

export const name = 'jira.worklog-add';

export const inputSchema = addWorklogInputSchema;

export async function runTool(client: any, input: any) {
  try {
    const worklog: any = {
      comment: input.comment,
      timeSpent: input.timeSpent,
    };

    if (input.author) {
      worklog.author = input.author;
    }

    if (input.startingOn) {
      worklog.started = input.startingOn;
    }

    if (input.artifact) {
      worklog.artifact = input.artifact;
    }

    const response = await client.issues.addWorklog({
      issueId: input.issueId,
      ...worklog,
    });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 3. Tool: `src/modules/jira/worklog-list.ts` (Optional)
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.worklog-list';

export const inputSchema = z.object({
  issueId: z.string().min(1),
  start: z.number().optional().default(0),
  maxResults: z.number().optional().default(50),
});

export async function runTool(client: any, input: any) {
  try {
    const response = await client.issues.getWorklogs({
      issueId: input.issueId,
      start: input.start,
      maxResults: input.maxResults,
    });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 4. Tool: `src/modules/jira/worklog-delete.ts` (Optional)
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.worklog-delete';

export const inputSchema = z.object({
  issueId: z.string().min(1),
  worklogId: z.string().min(1),
});

export async function runTool(client: any, input: any) {
  try {
    await client.issues.deleteWorklog({
      issueId: input.issueId,
      worklogId: input.worklogId,
    });

    return {
      success: true,
      message: `Worklog ${input.worklogId} deleted successfully`,
    };
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

## Tests Required
- [ ] `tests/unit/jira/worklog.add.spec.ts`
  - Test adding worklog with timeSpent
  - Test adding worklog with comment
  - Test adding worklog with author
  - Test adding worklog with startingOn date
  - Test adding worklog with artifact
  - Test various timeSpent formats (e.g., '2h', '30m', '1d 2h 30m')
- [ ] `tests/unit/jira/worklog.list.spec.ts` (optional)
- [ ] `tests/unit/jira/worklog.delete.spec.ts` (optional)
- [ ] All tests pass

## Deliverables
- [ ] `src/modules/jira/schemas/add-worklog-input.ts`
- [ ] `src/modules/jira/tools/worklog-add.ts`
- [ ] Optional: worklog-list and worklog-delete tools
- [ ] Test files for all tools
- [ ] All tests pass
