# TASK-44: Issue Link Management Tool

**Specification:** [SPECIFICATION-2](../SPECIFICATION_2.md)  
**Priority:** High  
**Status:** Completed — link-create tool and schema delivered; optional list/delete helpers remain unneeded.
**Estimated Time:** 2-3 hours

## Objective
Implement Jira issue link management tool.

## Files to Create

### 1. Schema: `src/modules/jira/schemas/create-link-input.ts`
```typescript
import { z } from 'zod';

export const createLinkInputSchema = z.object({
  link: z.object({
    relationship: z.enum([
      'Blocks', 'Relates to', 'Duplicates', 'Is blocked by',
      'Is related to', 'Is duplicated by', 'Causes', 'Is caused by',
      'Clone', 'Required', 'Work on', 'Split', 'Roll up',
    ]),
    inwardIssue: z.object({
      id: z.string().optional(),
      key: z.string().optional(),
    }),
    outwardIssue: z.object({
      id: z.string().optional(),
      key: z.string().optional(),
    }),
    comment: z.object({
      body: z.string().optional(),
      visibility: z.object({
        type: z.enum(['role', 'group']),
        value: z.string(),
      }).optional(),
    }).optional(),
  }),
});

export type CreateLinkInput = z.infer<typeof createLinkInputSchema>;
```

### 2. Tool: `src/modules/jira/tools/link-create.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';
import { createLinkInputSchema } from '../schemas/create-link-input';

export const name = 'jira.link-create';

export const inputSchema = createLinkInputSchema;

export async function runTool(client: any, input: any) {
  try {
    const link = input.link;

    // Build link payload for jira.js v3 API
    const linkPayload: any = {
      relationship: link.relationship,
      inwardIssue: link.inwardIssue.id || link.inwardIssue.key,
      outwardIssue: link.outwardIssue.id || link.outwardIssue.key,
    };

    if (link.comment) {
      linkPayload.comment = link.comment.body;
      if (link.comment.visibility) {
        linkPayload.visibility = link.comment.visibility;
      }
    }

    const response = await client.issues.link(linkPayload);

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 3. Tool: `src/modules/jira/tools/link-delete.ts` (Optional)
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.link-delete';

export const inputSchema = z.object({
  linkId: z.string().min(1),
});

export async function runTool(client: any, input: any) {
  try {
    await client.issues.unlink({ linkId: input.linkId });

    return {
      success: true,
      message: `Link ${input.linkId} deleted successfully`,
    };
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 4. Tool: `src/modules/jira/tools/link-list.ts` (Optional)
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.link-list';

export const inputSchema = z.object({
  issueId: z.string().min(1),
});

export async function runTool(client: any, input: any) {
  try {
    const response = await client.issues.getLinks({ issueId: input.issueId });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

## Tests Required
- [x] `tests/unit/jira/link.create.spec.ts` (covers multiple relationships and comment payloads)
- [ ] `tests/unit/jira/link.list.spec.ts` (optional – not implemented)
- [ ] `tests/unit/jira/link.delete.spec.ts` (optional – not implemented)
- [x] All tests pass via `npm run test:unit`

## Deliverables
- [x] `src/modules/jira/schemas/create-link-input.ts`
- [x] `src/modules/jira/tools/link-create.ts`
- [ ] Optional: link.list/link.delete tools (not implemented)
- [x] `tests/unit/jira/link.create.spec.ts`
- [x] All tests pass
