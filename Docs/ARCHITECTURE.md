# Architecture

ContentFlow's technical architecture: stack, data model, API layer, and real-time collaboration.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 App Router, React 18, TypeScript | SSR/CSR hybrid rendering |
| Styling | Tailwind CSS 4, CSS custom properties | Token-based design system |
| State | TanStack React Query | Server state caching |
| API | tRPC v11 | Type-safe client-server RPC |
| Database | PostgreSQL via Supabase | Managed Postgres + Realtime |
| ORM | Drizzle ORM | Schema-first SQL builder |
| Auth | Clerk | SSO, magic links, session management |
| AI | OpenAI API | Content suggestions, writing assistant |
| Storage | S3/R2 (planned) | File attachments |
| Payments | Stripe (planned) | Subscription billing |

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard / home
│   └── api/                # API routes
├── components/
│   ├── layout/             # App shell
│   │   ├── sidebar.tsx     # Workspace/table navigation
│   │   ├── toolbar.tsx     # View controls, search, filters
│   │   └── top-bar.tsx     # Breadcrumbs, user menu
│   ├── ui/                 # Primitives (7 components)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── modal.tsx
│   │   └── tooltip.tsx
│   ├── views/              # Data views
│   │   ├── grid-view.tsx   # Editable spreadsheet (438 lines)
│   │   ├── kanban-view.tsx # Drag-and-drop cards (122 lines)
│   │   └── calendar-view.tsx # Monthly schedule (216 lines)
│   ├── record-panel.tsx    # Slide-in record editor (189 lines)
│   ├── filter-bar.tsx      # Search and filter UI
│   ├── group-header.tsx    # Group-by headers
│   ├── field-editor.tsx    # Per-type cell editors
│   ├── ai-suggestions.tsx  # AI content panel
│   └── ...
├── hooks/
│   ├── use-realtime-*.ts   # Supabase Realtime subscriptions
│   ├── use-search.ts       # Debounced search + filter logic
│   ├── use-keyboard-shortcuts.ts
│   └── use-views.ts        # View CRUD + switching
├── lib/
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema (16 tables, 596 lines)
│   │   ├── index.ts        # DB client
│   │   └── seed.ts         # Sample data seeder (380 lines)
│   ├── field-types.ts      # Field type registry (18 types)
│   ├── formula-engine.ts   # Formula parser + evaluator
│   ├── openai.ts           # AI helper functions
│   ├── notifications.ts    # Email notification logic
│   └── trpc/               # tRPC client config
├── server/
│   ├── trpc.ts             # Procedure definitions (public, protected)
│   └── routers/            # 16 tRPC routers
└── middleware.ts            # Next.js middleware
```

## Database Schema

16 tables using Entity-Attribute-Value (EAV) pattern for flexible field values.

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Clerk-authenticated users |
| `workspaces` | Team workspaces (multi-tenant) |
| `workspace_members` | User-workspace associations with roles |
| `tables` | Data tables within workspaces |
| `fields` | Column definitions (type, config, sort order) |
| `field_options` | Select/multi-select option values |
| `records` | Rows in a table |
| `cell_values` | EAV cell storage (record × field → JSON value) |
| `views` | Saved view configurations (filters, sorts, groupBy) |

### Collaboration Tables

| Table | Purpose |
|-------|---------|
| `comments` | Threaded comments on records |
| `mentions` | @mention tracking |
| `activity_log` | Audit trail of all changes |
| `attachments` | File uploads (S3/R2) |
| `notifications` | User notification queue |

### Integration Tables

| Table | Purpose |
|-------|---------|
| `templates` | Pre-built table templates |
| `api_keys` | External API authentication |
| `webhooks` | Outbound event webhooks |
| `webhook_deliveries` | Delivery log with retry state |
| `record_links` | Cross-table record relationships |
| `automations` | If-this-then-that triggers |
| `content_links` | Content repurposing tracking |

### EAV Pattern

Cell values are stored in a separate `cell_values` table rather than as columns. This allows dynamic field definitions without schema migrations.

```
cell_values {
  record_id  → references records.id
  field_id   → references fields.id
  value      → JSONB (stores any field type value)
}
```

## API Architecture (tRPC)

All API routes are defined as tRPC procedures in `src/server/routers/`.

### Procedure Types

| Type | Auth Required | Mutations |
|------|--------------|-----------|
| `publicProcedure` | No | No |
| `protectedProcedure` | Yes (Clerk session) | Yes |

### Router Map

| Router | Procedures |
|--------|-----------|
| `workspace` | list, getById, create, update, delete, invite, removeMember, updateMemberRole, getMembers |
| `table` | list, getById, create, update, delete, reorder, listFields, createField, updateField, deleteField, reorderFields, listFieldOptions, createFieldOption, updateFieldOption, deleteFieldOption, reorderFieldOptions |
| `record` | list (paginated), getById, create, update, delete, archive, restore, upsertCellValue, deleteCellValue, batchUpdateCellValues |
| `view` | list, getById, create, update, delete |
| `ai` | generateTitles, generateOutline, generateTags, generateSocialSnippets, rewrite, expand, summarize, suggestSEO, improve |
| `template` | list, getById, create, apply |
| `activity` | list, getByRecord |
| `attachment` | list, upload, delete |
| `notification` | list, markRead, markAllRead |
| `apiKey` | create, list, revoke |
| `webhook` | create, list, delete, test |
| `comment` | list (threaded), count, create, update, delete, resolve |
| `formula` | validate, preview, evaluate, listFunctions |
| `link` | create, delete, list, getLinkedRecords, reverseLinks, searchTargetRecords |
| `contentLink` | (see source) |
| `automation` | (see source) |
| `email` | (see source) |

### Input Validation

All procedure inputs use Zod schemas. Example:

```typescript
record.create.input({
  tableId: string,      // required
  title: string,        // 1-500 chars
  cellValues: [{        // optional array
    fieldId: string,
    value: any,
  }],
})
```

## Authentication Flow

1. User signs in via Clerk (Google, GitHub, or email magic link)
2. Clerk provides a JWT session token
3. tRPC `protectedProcedure` verifies the Clerk JWT
4. Middleware looks up the user in the `users` table by `clerkId`
5. Context provides `ctx.dbUser` (the database user record)
6. All workspace operations check `workspace_members` for authorization

### Role Hierarchy

| Role | Can Read | Can Write | Can Admin |
|------|---------|-----------|-----------|
| `viewer` | Yes | No | No |
| `editor` | Yes | Yes | No |
| `admin` | Yes | Yes | Yes (invite, manage members) |
| `owner` | Yes | Yes | Yes (delete workspace, change roles) |

## Real-time Subscriptions

Supabase Realtime provides live collaboration:

- Record changes broadcast to all workspace members
- Optimistic updates with server reconciliation
- View state sync (filters, sorts, groupBy)
- Comment and mention notifications

Hooks: `use-realtime-records.ts`, `use-realtime-comments.ts`

## Design System

Token-based CSS custom properties in `globals.css`:

| Token | Light | Dark |
|-------|-------|------|
| `--seed-primary` | `#1b61c9` | `#4a9eff` |
| `--seed-accent` | `#fcb400` | `#fbbf24` |
| `--seed-bg` | `#ffffff` | `#0f1117` |
| `--seed-surface` | `#f8fafc` | `#1a1d27` |

Dark mode: override seed tokens in `[data-theme="dark"]` selector.
