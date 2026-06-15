import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  unique,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    clerkId: text('clerk_id').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_users_clerk_id').on(t.clerkId)],
);

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const workspaces = pgTable(
  'workspaces',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    icon: text('icon'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_workspaces_slug').on(t.slug)],
);

// ─── Workspace Members ────────────────────────────────────────────────────────

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['owner', 'admin', 'editor', 'viewer'] })
      .notNull()
      .default('editor'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    index('idx_workspace_members_user').on(t.userId),
  ],
);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const tables = pgTable(
  'tables',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_tables_workspace').on(t.workspaceId)],
);

// ─── Fields ───────────────────────────────────────────────────────────────────

export const fields = pgTable(
  'fields',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tableId: text('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type', {
      enum: [
        'text',
        'long_text',
        'number',
        'select',
        'multi_select',
        'date',
        'date_range',
        'checkbox',
        'collaborator',
        'url',
        'email',
        'phone',
        'attachment',
        'formula',
      ],
    }).notNull(),
    config: jsonb('config').$defaultFn(() => ({})),
    sortOrder: integer('sort_order').notNull().default(0),
    width: integer('width').notNull().default(150),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_fields_table').on(t.tableId),
    index('idx_fields_sort').on(t.tableId, t.sortOrder),
  ],
);

// ─── Field Options ────────────────────────────────────────────────────────────

export const fieldOptions = pgTable(
  'field_options',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    fieldId: text('field_id')
      .notNull()
      .references(() => fields.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    color: text('color'),
    icon: text('icon'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_field_options_field').on(t.fieldId),
    index('idx_field_options_sort').on(t.fieldId, t.sortOrder),
  ],
);

// ─── Records ──────────────────────────────────────────────────────────────────

export const records = pgTable(
  'records',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tableId: text('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    wordCount: integer('word_count').default(0),
    isArchived: boolean('is_archived').notNull().default(false),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_records_table').on(t.tableId),
    index('idx_records_workspace').on(t.workspaceId),
    index('idx_records_sort').on(t.tableId, t.sortOrder),
    index('idx_records_created_by').on(t.createdBy),
  ],
);

// ─── Cell Values (EAV pattern) ────────────────────────────────────────────────

export const cellValues = pgTable(
  'cell_values',
  {
    recordId: text('record_id')
      .notNull()
      .references(() => records.id, { onDelete: 'cascade' }),
    fieldId: text('field_id')
      .notNull()
      .references(() => fields.id, { onDelete: 'cascade' }),
    value: jsonb('value'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.recordId, t.fieldId] }),
    index('idx_cell_values_field').on(t.fieldId),
  ],
);

// ─── Views ────────────────────────────────────────────────────────────────────

export const views = pgTable(
  'views',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tableId: text('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type', { enum: ['grid', 'kanban', 'calendar', 'gallery', 'form'] }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    isShared: boolean('is_shared').notNull().default(false),
    filters: jsonb('filters').$defaultFn(() => []),
    sorts: jsonb('sorts').$defaultFn(() => []),
    groupBy: jsonb('group_by'),
    columns: jsonb('columns').$defaultFn(() => []),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_views_table').on(t.tableId),
    index('idx_views_default').on(t.tableId, t.isDefault),
  ],
);

// ─── Comments ─────────────────────────────────────────────────────────────────

export const comments = pgTable(
  'comments',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    recordId: text('record_id')
      .notNull()
      .references(() => records.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    content: text('content').notNull(),
    parentCommentId: text('parent_comment_id'),
    isResolved: boolean('is_resolved').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_comments_record').on(t.recordId),
    index('idx_comments_workspace').on(t.workspaceId),
    index('idx_comments_user').on(t.userId),
    foreignKey({ columns: [t.parentCommentId], foreignColumns: [t.id] }),
  ],
);

// ─── Mentions ─────────────────────────────────────────────────────────────────

export const mentions = pgTable(
  'mentions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    commentId: text('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    mentionedUserId: text('mentioned_user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_mentions_comment').on(t.commentId),
    index('idx_mentions_user').on(t.mentionedUserId),
    unique().on(t.commentId, t.mentionedUserId),
  ],
);

// ─── Activity Log ─────────────────────────────────────────────────────────────

export const activityLog = pgTable(
  'activity_log',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    recordId: text('record_id').references(() => records.id, { onDelete: 'set null' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    action: text('action', {
      enum: ['create', 'update', 'delete', 'comment', 'status_change', 'archive', 'restore'],
    }).notNull(),
    entityType: text('entity_type', {
      enum: ['record', 'field', 'view', 'table', 'workspace'],
    }).notNull(),
    entityId: text('entity_id').notNull(),
    changes: jsonb('changes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_activity_workspace').on(t.workspaceId),
    index('idx_activity_record').on(t.recordId),
    index('idx_activity_user').on(t.userId),
    index('idx_activity_created').on(t.createdAt),
  ],
);

// ─── Attachments ──────────────────────────────────────────────────────────────

export const attachments = pgTable(
  'attachments',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    recordId: text('record_id')
      .notNull()
      .references(() => records.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    filename: text('filename').notNull(),
    url: text('url').notNull(),
    mimeType: text('mime_type'),
    size: integer('size'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_attachments_record').on(t.recordId),
    index('idx_attachments_workspace').on(t.workspaceId),
  ],
);

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    recordId: text('record_id')
      .notNull()
      .references(() => records.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: ['mention', 'assignment', 'status_change', 'comment', 'system'],
    }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_notifications_user').on(t.userId),
    index('idx_notifications_workspace').on(t.workspaceId),
    index('idx_notifications_read').on(t.userId, t.isRead),
  ],
);

// ─── Templates ────────────────────────────────────────────────────────────────

export const templates = pgTable(
  'templates',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    category: text('category', {
      enum: ['blog', 'newsletter', 'social', 'video', 'podcast', 'custom'],
    }).notNull(),
    fieldDefinitions: jsonb('field_definitions').notNull().$defaultFn(() => []),
    statusDefinitions: jsonb('status_definitions').notNull().$defaultFn(() => []),
    sampleRecords: jsonb('sample_records').$defaultFn(() => []),
    isSystem: boolean('is_system').notNull().default(false),
    usageCount: integer('usage_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_templates_workspace').on(t.workspaceId),
    index('idx_templates_category').on(t.category),
  ],
);

// ─── API Keys ────────────────────────────────────────────────────────────────

export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull().unique(),
    keyPrefix: text('key_prefix').notNull(),
    permissions: jsonb('permissions').notNull().$defaultFn(() => []),
    isActive: boolean('is_active').notNull().default(true),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_api_keys_user').on(t.userId),
    index('idx_api_keys_workspace').on(t.workspaceId),
    index('idx_api_keys_hash').on(t.keyHash),
  ],
);

// ─── Webhooks ────────────────────────────────────────────────────────────────

export const webhooks = pgTable(
  'webhooks',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    name: text('name').notNull(),
    events: jsonb('events').notNull().$defaultFn(() => ['record.created', 'record.updated', 'record.deleted']),
    isActive: boolean('is_active').notNull().default(true),
    secret: text('secret'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_webhooks_workspace').on(t.workspaceId),
    index('idx_webhooks_active').on(t.workspaceId, t.isActive),
  ],
);

// ─── Webhook Deliveries ──────────────────────────────────────────────────────

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    webhookId: text('webhook_id')
      .notNull()
      .references(() => webhooks.id, { onDelete: 'cascade' }),
    event: text('event').notNull(),
    payload: jsonb('payload').notNull(),
    statusCode: integer('status_code'),
    response: text('response'),
    success: boolean('success').notNull().default(false),
    attemptCount: integer('attempt_count').notNull().default(0),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_webhook_deliveries_webhook').on(t.webhookId),
    index('idx_webhook_deliveries_created').on(t.createdAt),
  ],
);

// ─── Re-exports for convenience ───────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;
export type Field = typeof fields.$inferSelect;
export type NewField = typeof fields.$inferInsert;
export type FieldOption = typeof fieldOptions.$inferSelect;
export type NewFieldOption = typeof fieldOptions.$inferInsert;
export type Record = typeof records.$inferSelect;
export type NewRecord = typeof records.$inferInsert;
export type CellValue = typeof cellValues.$inferSelect;
export type NewCellValue = typeof cellValues.$inferInsert;
export type View = typeof views.$inferSelect;
export type NewView = typeof views.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Mention = typeof mentions.$inferSelect;
export type NewMention = typeof mentions.$inferInsert;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type NewActivityLogEntry = typeof activityLog.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
