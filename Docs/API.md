# API Reference

ContentFlow uses tRPC v11 for type-safe client-server communication. All endpoints are accessible via the tRPC client or directly via HTTP at `/api/trpc/[procedure]`.

## Base URL

```
http://localhost:3000/api/trpc
```

## Authentication

All procedures except `health` require a valid Clerk session. Pass the Clerk JWT via the `Authorization` header or cookie.

```
Authorization: Bearer <clerk-jwt>
```

## Error Handling

tRPC returns standard error codes:

| Code | Meaning |
|------|---------|
| `UNAUTHORIZED` | Missing or invalid auth |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource doesn't exist |
| `CONFLICT` | Already exists (e.g., duplicate member) |
| `BAD_REQUEST` | Invalid input |

## Procedures

### `health` (public)

```
GET /api/trpc/health
```

Returns `{ status: 'ok', timestamp: string }`.

---

### `workspace`

#### `workspace.list`
```
GET /api/trpc/workspace.list
```
Returns all workspaces the authenticated user belongs to, with member counts.

#### `workspace.getById`
```json
{ "workspaceId": "string" }
```

#### `workspace.create`
```json
{
  "name": "string (1-100 chars)",
  "slug": "string (lowercase, alphanumeric, hyphens)",
  "description": "string (optional)",
  "icon": "string (optional)"
}
```
Auto-creates an `owner` membership for the creator.

#### `workspace.update`
```json
{
  "workspaceId": "string",
  "name": "string (optional)",
  "description": "string (optional)",
  "icon": "string (optional)"
}
```
Requires `editor` role or above.

#### `workspace.delete`
```json
{ "workspaceId": "string" }
```
Owner only. Cascades to all workspace data.

#### `workspace.invite`
```json
{
  "workspaceId": "string",
  "email": "string (valid email)",
  "role": "admin | editor | viewer"
}
```
Requires `owner` or `admin`. Target user must exist.

#### `workspace.removeMember`
```json
{ "workspaceId": "string", "userId": "string" }
```
Cannot remove the owner.

#### `workspace.updateMemberRole`
```json
{
  "workspaceId": "string",
  "userId": "string",
  "role": "admin | editor | viewer"
}
```
Owner only. Cannot change your own role.

#### `workspace.getMembers`
```json
{ "workspaceId": "string" }
```

---

### `table`

#### `table.list`
```json
{ "workspaceId": "string" }
```

#### `table.getById`
```json
{ "tableId": "string" }
```

#### `table.create`
```json
{
  "workspaceId": "string",
  "name": "string (1-100 chars)",
  "icon": "string (optional)",
  "description": "string (optional)"
}
```
Auto-creates default fields: Title (text), Status (select), Notes (long_text).

#### `table.update`
```json
{ "tableId": "string", "name": "string (optional)", ... }
```

#### `table.delete`
```json
{ "tableId": "string" }
```
Requires `owner` or `admin`.

#### `table.reorder`
```json
{ "workspaceId": "string", "tableIds": ["string", ...] }
```

#### `table.listFields`
```json
{ "tableId": "string" }
```
Returns fields ordered by `sortOrder`.

#### `table.createField`
```json
{
  "tableId": "string",
  "name": "string (1-100 chars)",
  "type": "text | long_text | number | select | multi_select | date | date_range | checkbox | collaborator | url | email | phone | attachment | formula | link | multi_link | lookup | rollup",
  "config": { ... },
  "sortOrder": "number (optional)",
  "width": "number (optional, default 150)"
}
```

#### `table.updateField`
```json
{ "fieldId": "string", "name": "string (optional)", "config": { ... }, ... }
```

#### `table.deleteField`
```json
{ "fieldId": "string" }
```
Requires `owner` or `admin`.

#### `table.reorderFields`
```json
{ "tableId": "string", "fieldIds": ["string", ...] }
```

#### `table.listFieldOptions`
```json
{ "fieldId": "string" }
```

#### `table.createFieldOption`
```json
{ "fieldId": "string", "label": "string", "color": "string (optional)", "icon": "string (optional)" }
```

#### `table.updateFieldOption`
```json
{ "optionId": "string", "label": "string (optional)", "color": "string (optional)" }
```

#### `table.deleteFieldOption`
```json
{ "optionId": "string" }
```

---

### `record`

#### `record.list`
```json
{
  "tableId": "string",
  "limit": "number (1-100, default 50)",
  "cursor": "string (optional, for pagination)",
  "includeArchived": "boolean (default false)"
}
```
Returns `{ items: Record[], nextCursor: string | null }`. Each record includes its `cellValues`.

#### `record.getById`
```json
{ "recordId": "string" }
```

#### `record.create`
```json
{
  "tableId": "string",
  "title": "string (1-500 chars)",
  "cellValues": [{ "fieldId": "string", "value": any }]
}
```
Cannot be called by `viewer` role.

#### `record.update`
```json
{ "recordId": "string", "title": "string (optional)", "wordCount": "number (optional)" }
```

#### `record.delete`
```json
{ "recordId": "string" }
```

#### `record.archive` / `record.restore`
```json
{ "recordId": "string" }
```

#### `record.upsertCellValue`
```json
{ "recordId": "string", "fieldId": "string", "value": any }
```
Creates or updates a cell value.

#### `record.deleteCellValue`
```json
{ "recordId": "string", "fieldId": "string" }
```

#### `record.batchUpdateCellValues`
```json
{
  "recordId": "string",
  "updates": [{ "fieldId": "string", "value": any }, ...]
}
```

---

### `view`

#### `view.list`
```json
{ "tableId": "string" }
```

#### `view.getById`
```json
{ "viewId": "string" }
```

#### `view.create`
```json
{
  "tableId": "string",
  "name": "string (1-100 chars)",
  "type": "grid | kanban | calendar | gallery | form",
  "isDefault": "boolean (optional)",
  "isShared": "boolean (optional)",
  "filters": "[...] (optional)",
  "sorts": "[...] (optional)",
  "groupBy": "... (optional)",
  "columns": "[...] (optional)"
}
```

#### `view.update`
```json
{ "viewId": "string", "name": "string (optional)", ... }
```

#### `view.delete`
```json
{ "viewId": "string" }
```
Cannot delete the default view.

---

### `comment`

#### `comment.list`
```json
{ "recordId": "string", "limit": "number (default 50)", "cursor": "string (optional)" }
```
Returns threaded comments with author info and nested replies.

#### `comment.count`
```json
{ "recordId": "string" }
```

#### `comment.create`
```json
{ "recordId": "string", "content": "string (1-5000 chars)", "parentCommentId": "string (optional)" }
```
Supports `@username` mentions. Creates notifications for mentioned users.

#### `comment.update`
```json
{ "commentId": "string", "content": "string (1-5000 chars)" }
```
Author only.

#### `comment.delete`
```json
{ "commentId": "string" }
```
Author, `owner`, or `admin`.

#### `comment.resolve`
```json
{ "commentId": "string" }
```
Toggles resolved state.

---

### `ai`

All AI procedures require authentication and an OpenAI API key.

#### `ai.generateTitles`
```json
{ "topic": "string" }
```
Returns `{ titles: string[] }`.

#### `ai.generateOutline`
```json
{ "title": "string" }
```
Returns `{ outline: { level: 'h2' | 'h3', text: string }[] }`.

#### `ai.generateTags`
```json
{ "title": "string", "content": "string" }
```
Returns `{ tags: string[] }`.

#### `ai.generateSocialSnippets`
```json
{ "content": "string" }
```
Returns `{ snippets: { twitter: string, linkedin: string, instagram: string } }`.

#### `ai.rewrite`
```json
{ "text": "string", "tone": "formal | casual | concise | professional" }
```
Returns `{ result: string }`.

#### `ai.expand`
```json
{ "text": "string" }
```

#### `ai.summarize`
```json
{ "text": "string", "maxLength": "number (optional)" }
```

#### `ai.suggestSEO`
```json
{ "title": "string", "content": "string" }
```
Returns `{ seo: { keywords: string[], metaDescription: string, suggestions: string[] } }`.

#### `ai.improve`
```json
{ "text": "string" }
```

---

### `formula`

#### `formula.validate`
```json
{ "expression": "string" }
```
Returns `{ valid: boolean, error: string | null, fields: string[] }`.

#### `formula.preview`
```json
{ "recordId": "string", "expression": "string", "returnType": "text | number | date" }
```
Evaluates without persisting.

#### `formula.evaluate`
```json
{ "recordId": "string", "expression": "string", "returnType": "text | number | date" }
```

#### `formula.listFunctions`
Returns available formula functions (SUM, COUNT, IF, CONCAT, DATE_DIFF, etc.).

---

### `link`

#### `link.create`
```json
{ "sourceRecordId": "string", "targetRecordId": "string", "fieldName": "string" }
```

#### `link.delete`
```json
{ "sourceRecordId": "string", "targetRecordId": "string", "fieldName": "string" }
```

#### `link.list`
```json
{ "recordId": "string", "fieldName": "string (optional)" }
```

#### `link.getLinkedRecords`
```json
{ "recordId": "string", "fieldName": "string (optional)" }
```
Returns full record objects with cell values.

#### `link.reverseLinks`
```json
{ "recordId": "string" }
```
Returns records that link *to* this record.

#### `link.searchTargetRecords`
```json
{ "tableId": "string", "query": "string (optional)", "excludeRecordId": "string (optional)", "limit": "number (1-50, default 20)" }
```

---

### `webhook`

#### `webhook.create`
```json
{
  "workspaceId": "string",
  "name": "string (1-100 chars)",
  "url": "string (valid URL)",
  "events": ["record.created", "record.updated", "record.deleted"]
}
```
Auto-generates a `whsec_...` signing secret.

#### `webhook.list`
```json
{ "workspaceId": "string" }
```

#### `webhook.delete`
```json
{ "webhookId": "string" }
```

#### `webhook.test`
```json
{ "webhookId": "string" }
```
Sends a test payload to the webhook URL.

---

### `apiKey`

#### `apiKey.create`
```json
{ "workspaceId": "string", "name": "string", "permissions": ["read"], "expiresAt": "ISO datetime (optional)" }
```
Returns the full key (`cf_...`). Only shown once.

#### `apiKey.list`
```json
{ "workspaceId": "string" }
```
Returns keys without the secret value.

#### `apiKey.revoke`
```json
{ "apiKeyId": "string" }
```
Soft-deletes (sets `isActive: false`).
