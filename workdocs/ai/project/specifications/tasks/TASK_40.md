# TASK-40: Issue CRUD Tools (Read, Update, Delete)

**Specification:** [SPECIFICATION-2](../SPECIFICATION_2.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 6-8 hours

## Objective
Implement Jira issue Read, Update, and Delete tools for the mcp-server.

## Files to Create/Modify

### 1. Schema: `src/modules/jira/schemas/update-issue-input.ts`
```typescript
import { z } from 'zod';

export const updateIssueInputSchema = z.object({
  issueId: z.string().min(1),
  fields: z.record(z.any()).optional(),
  update: z.record(z.array(z.object({
    set: z.any(),
    add: z.any(),
    remove: z.any(),
    edit: z.any(),
  }))).optional(),
  properties: z.array(z.any()).optional(),
  notifyUsers: z.boolean().optional().default(true),
  issueTemplateId: z.string().optional(),
  overrideScreenSecurity: z.boolean().optional().default(false),
  overrideEditableFlag: z.boolean().optional().default(false),
});

export type UpdateIssueInput = z.infer<typeof updateIssueInputSchema>;
```

### 2. Tool: `src/modules/jira/tools/issue-read.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.issue-read';

export const inputSchema = z.object({
  issueId: z.string().min(1),
  expand: z.string().optional(),
  fields: z.array(z.string()).optional(),
  properties: z.array(z.string()).optional(),
});

export async function runTool(client: any, input: any) {
  try {
    const response = await client.issues.get({
      issueId: input.issueId,
      expand: input.expand,
      fields: input.fields,
      properties: input.properties,
    });
    
    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 3. Tool: `src/modules/jira/tools/issue-update.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';
import { updateIssueInputSchema } from '../schemas/update-issue-input';

export const name = 'jira.issue-update';

export const inputSchema = updateIssueInputSchema;

export async function runTool(client: any, input: any) {
  try {
    const response = await client.issues.update({
      issueId: input.issueId,
      fields: input.fields,
      update: input.update,
      properties: input.properties,
      notifyUsers: input.notifyUsers,
      issueTemplateId: input.issueTemplateId,
      overrideScreenSecurity: input.overrideScreenSecurity,
      overrideEditableFlag: input.overrideEditableFlag,
    });
    
    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 4. Tool: `src/modules/jira/tools/issue-delete.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.issue-delete';

export const inputSchema = z.object({
  issueId: z.string().min(1),
  deleteSubtasks: z.boolean().optional().default(true),
});

export async function runTool(client: any, input: any) {
  try {
    await client.issues.delete({
      issueId: input.issueId,
      deleteSubtasks: input.deleteSubtasks,
    });
    
    return {
      success: true,
      message: `Issue ${input.issueId} deleted successfully`,
    };
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 5. Update `src/modules/jira/register-utils.ts`
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as issueCreate from './tools/issue-create';
import * as issueRead from './tools/issue-read';
import * as issueUpdate from './tools/issue-update';
import * as issueDelete from './tools/issue-delete';
import * as issueTransition from './tools/issue-transition';

export async function registerJiraTools(server: McpServer) {
  await server.registerTool(
    issueCreate.name,
    {
      title: 'Jira Issue Create',
      description: 'Create a new Jira issue with full field support',
      inputSchema: issueCreate.inputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    (args: any, extra: any) => issueCreate.runTool(extra.jiraClient, args)
  );

  await server.registerTool(
    issueRead.name,
    {
      title: 'Jira Issue Read',
      description: 'Read a Jira issue with expandable properties and selective fields',
      inputSchema: issueRead.inputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (args: any, extra: any) => issueRead.runTool(extra.jiraClient, args)
  );

  await server.registerTool(
    issueUpdate.name,
    {
      title: 'Jira Issue Update',
      description: 'Update a Jira issue with fields, update operations, and properties',
      inputSchema: issueUpdate.inputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    (args: any, extra: any) => issueUpdate.runTool(extra.jiraClient, args)
  );

  await server.registerTool(
    issueDelete.name,
    {
      title: 'Jira Issue Delete',
      description: 'Delete a Jira issue and optionally its subtasks',
      inputSchema: issueDelete.inputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    (args: any, extra: any) => issueDelete.runTool(extra.jiraClient, args)
  );

  await server.registerTool(
    issueTransition.name,
    {
      title: 'Jira Issue Transition',
      description: 'Transition a Jira issue to a new status with optional comment',
      inputSchema: issueTransition.inputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    (args: any, extra: any) => issueTransition.runTool(extra.jiraClient, args)
  );
}
```

### 6. Update `src/modules/jira/index.ts`
```typescript
export { JiraIssueCreate as JiraIssueCreateTool } from './tools/issue-create';
export { JiraIssueRead as JiraIssueReadTool } from './tools/issue-read';
export { JiraIssueUpdate as JiraIssueUpdateTool } from './tools/issue-update';
export { JiraIssueDelete as JiraIssueDeleteTool } from './tools/issue-delete';
export { JiraIssueTransition as JiraIssueTransitionTool } from './tools/issue-transition';
```

### 7. Rename modules for consistency
If tools follow naming convention, they should be exportable as named exports:
- `JiraIssueCreate`, `JiraIssueRead`, etc.

Update each tool to include named export:
```typescript
export const JiraIssueRead = { name, inputSchema, runTool };
export const JiraIssueUpdate = { name, inputSchema, runTool };
export const JiraIssueDelete = { name, inputSchema, runTool };
export const JiraIssueTransition = { name, inputSchema, runTool };
```

## Deliverables
- [ ] `src/modules/jira/schemas/update-issue-input.ts`
- [ ] `src/modules/jira/tools/issue-read.ts`
- [ ] `src/modules/jira/tools/issue-update.ts`
- [ ] `src/modules/jira/tools/issue-delete.ts`
- [ ] Updated `src/modules/jira/register-utils.ts` (new file)
- [ ] Updated `src/modules/jira/index.ts`

## Tests Required
- [ ] `tests/unit/jira/issue.read.spec.ts`
- [ ] `tests/unit/jira/issue.update.spec.ts`
- [ ] `tests/unit/jira/issue.delete.spec.ts`
- [ ] All tests pass

## Notes
- Follow the same pattern as `issue-create` for consistency
- Use `client.issues.get`, `client.issues.update`, `client.issues.delete` from jira.js v3
- Error handling via `normalizeJiraError`
- Input validation via Zod schemas
