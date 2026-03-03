# TASK-41: Enhanced Transition Tool with Comment Support

**Specification:** [SPECIFICATION-2](../SPECIFICATION_2.md)  
**Priority:** High  
**Status:** Completed — `issue-transition` now accepts comments and uses the updated transition schema plus the existing spec/transition test coverage.
**Estimated Time:** 2-3 hours

## Objective
Enhance the existing issue transition tool to support comments on transition.

## Current Implementation
The transition tool exists but likely lacks comment support. Need to enhance it.

## Update `src/modules/jira/tools/issue-transition.ts`

### Schema Update
```typescript
import { z } from 'zod';

export const issueTransitionInputSchema = z.object({
  issueId: z.string().min(1),
  transitionId: z.union([z.string(), z.number()]),
  fields: z.record(z.any()).optional(),
  update: z.record(z.array(z.object({
    set: z.any(),
    add: z.any(),
    remove: z.any(),
  }))).optional(),
  comment: z.string().optional(),
});

export type IssueTransitionInput = z.infer<typeof issueTransitionInputSchema>;
```

### Tool Implementation
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';
import { issueTransitionInputSchema } from '../schemas/issue-transition-input';

export const name = 'jira.issue-transition';

export const inputSchema = issueTransitionInputSchema;

export async function runTool(client: any, input: any) {
  try {
    const transitionPayload: any = {
      id: input.transitionId,
      fields: input.fields,
      update: input.update,
    };

    // Add comment if provided
    if (input.comment) {
      transitionPayload.comment = {
        body: input.comment,
      };
    }

    const response = await client.issues.transition({
      issueId: input.issueId,
      transition: transitionPayload,
    });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

## Tests Required
- [x] `tests/unit/jira/issue.transition.spec.ts` (covers transitions with/without comments and failure paths)
- [x] All tests pass via `npm run test:unit`

## Deliverables
- [x] Updated `src/modules/jira/tools/issue-transition.ts` with comment support
- [x] `src/modules/jira/schemas/issue-transition-input.ts`
- [x] Test coverage via `tests/unit/jira/issue.transition.spec.ts`
- [x] All tests pass
