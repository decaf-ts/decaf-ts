# TASK-45: Attachment Management Tool

**Specification:** [SPECIFICATION-2](../SPECIFICATION_2.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 2-3 hours

## Objective
Implement Jira attachment management tool for adding attachments to issues.

## Files to Create

### 1. Schema: `src/modules/jira/schemas/attach-issue-input.ts`
```typescript
import { z } from 'zod';

export const attachIssueInputSchema = z.object({
  issueId: z.string().min(1),
  file: z.string().min(1),  // file path on local filesystem
  mimeType: z.string().optional(),
  comment: z.string().optional(),
});

export type AttachIssueInput = z.infer<typeof attachIssueInputSchema>;
```

### 2. Tool: `src/modules/jira/tools/attach.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';
import { attachIssueInputSchema } from '../schemas/attach-issue-input';
import fs from 'fs';
import path from 'path';

export const name = 'jira.attach';

export const inputSchema = attachIssueInputSchema;

export async function runTool(client: any, input: any) {
  try {
    const filePath = path.resolve(input.file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    const attachment: any = {
      content: fileBuffer,
      name: fileName,
      mimeType: input.mimeType || 'application/octet-stream',
    };
    
    const response = await client.issues.addAttachment({
      issueId: input.issueId,
      file: attachment,
      comment: input.comment,
    });

    return response.data || response;
  } catch (err: any) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 3. Tool: `src/modules/jira/tools/attachment-list.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.attachment-list';

export const inputSchema = z.object({
  issueId: z.string().min(1),
});

export async function runTool(client: any, input: any) {
  try {
    const response = await client.issues.getAttachments({ issueId: input.issueId });

    return response.data || response;
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

### 4. Tool: `src/modules/jira/tools/attachment-delete.ts`
```typescript
import { z } from 'zod';
import { normalizeJiraError } from '../error-normalizer';

export const name = 'jira.attachment-delete';

export const inputSchema = z.object({
  issueId: z.string().min(1),
  attachmentId: z.string().min(1),
});

export async function runTool(client: any, input: any) {
  try {
    await client.issues.deleteAttachment({
      issueId: input.issueId,
      attachmentId: input.attachmentId,
    });

    return {
      success: true,
      message: `Attachment ${input.attachmentId} deleted successfully`,
    };
  } catch (err) {
    throw normalizeJiraError(err);
  }
}

export default { name, inputSchema, runTool };
```

## Tests Required
- [ ] `tests/unit/jira/attach.spec.ts`
  - Test attaching a file
  - Test attaching with mimeType
  - Test attaching with comment
  - Test handling non-existent file
  - Test handling large files
- [ ] `tests/unit/jira/attachment.list.spec.ts`
- [ ] `tests/unit/jira/attachment.delete.spec.ts`
- [ ] All tests pass

## Deliverables
- [ ] `src/modules/jira/schemas/attach-issue-input.ts`
- [ ] `src/modules/jira/tools/attach.ts`
- [ ] Optional: attachment-list and attachment-delete tools
- [ ] Test files for all tools
- [ ] All tests pass
