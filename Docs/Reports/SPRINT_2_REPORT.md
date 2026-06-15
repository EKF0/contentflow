# Sprint 2 Report — UI Shell + API Layer

**Date**: 2026-06-15  
**Sprint**: 2 of 12  
**Status**: Complete  
**Velocity**: 18 story points (CF-008 deferred to Sprint 3)

---

## Completed Issues

| Issue | Summary | Points | Assignee | Status |
|-------|---------|--------|----------|--------|
| CF-005 | App shell: Layout with sidebar navigation | 5 | crew-fe | Done |
| CF-006 | Design system: Token-based components | 5 | crew-fe | Done |
| CF-007 | API layer: tRPC endpoints for CRUD | 8 | crew-be | Done |

## Deliverables

### CF-005: App Shell
- `src/components/layout/sidebar.tsx` — Collapsible sidebar with Tables + Views sections
- `src/components/layout/top-bar.tsx` — Breadcrumbs + AvatarStack + Share button
- `src/components/layout/toolbar.tsx` — View tabs + Filter/Sort/Group buttons + Search
- `src/components/layout/app-shell.tsx` — Combines Sidebar + TopBar + Toolbar
- `src/app/dashboard/page.tsx` — Updated to render `<AppShell />`

### CF-006: Design System
- `src/app/globals.css` — Full token system (seed/derived tokens, status/type/avatar colors)
- `src/types/index.ts` — Shared TypeScript types + constants
- `src/components/ui/button.tsx` — Button with primary/secondary/ghost/destructive variants
- `src/components/ui/input.tsx` — Input with label + error state
- `src/components/ui/select.tsx` — Select with label + options
- `src/components/ui/badge.tsx` — StatusBadge + TypeTag components
- `src/components/ui/avatar.tsx` — Avatar (sm/md/lg) + AvatarStack
- `src/components/ui/checkbox.tsx` — Custom checkbox matching prototype
- `src/components/ui/field-icon.tsx` — SVG field type icons

### CF-007: API Layer
- `src/server/trpc.ts` — tRPC initialization with context + auth middleware
- `src/server/context.ts` — Context creation (Clerk auth + DB user)
- `src/server/routers/workspace.ts` — Workspace CRUD + member management
- `src/server/routers/table.ts` — Table CRUD + field management
- `src/server/routers/record.ts` — Record CRUD + cell value operations
- `src/server/routers/view.ts` — View CRUD + saved views
- `src/server/routers/index.ts` — Root router combining all
- `src/app/api/trpc/[trpc]/route.ts` — tRPC HTTP handler
- `src/lib/trpc/client.ts` — Client-side tRPC React hooks
- `src/lib/trpc/provider.tsx` — TRPC + React Query provider

## Build Verification

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (6/6)

Route (app)                    Size     First Load JS
┌ ○ /                          179 B    96.1 kB
├ ƒ /api/trpc/[trpc]           0 B      0 B
├ ƒ /api/webhooks/clerk        0 B      0 B
├ ○ /dashboard                 11.4 kB  98.6 kB
├ ƒ /sign-in/[[...sign-in]]   179 B    96.1 kB
└ ƒ /sign-up/[[...sign-up]]   179 B    96.1 kB
```

## Issues & Fixes

| Issue | Resolution |
|-------|-----------|
| tRPC v11 `createRouterFactory` pattern wrong | Changed to `router()` function directly |
| `onError` type mismatch (`string | null` vs `string | undefined`) | Removed explicit type annotation |
| `TRPCProvider` missing `queryClient` prop | Added QueryClient + QueryClientProvider wrapper |
| CF-007 agent timeout | Files completed, manually verified |

## Lessons Learned

1. **tRPC v11 API changes** — `t.router` is a function, not a factory; export and call directly
2. **Provider requires queryClient** — tRPC v11 React provider needs both `client` and `queryClient`
3. **Type inference can mask issues** — explicit type annotations sometimes fight with inferred types

## Sprint 3 Ready

Sprint 3 focuses on Phase 1 (Core Product):
- CF-008: Data seeding (deferred from Sprint 2)
- CF-009: Grid view (13 pts) — the big one
- CF-010: Kanban view (8 pts)
- CF-011: Calendar view (8 pts)
- CF-012: Record detail panel (5 pts)
