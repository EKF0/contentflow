# Sprint 1 Plan — Foundation Infrastructure

**Date**: 2026-06-15  
**Sprint**: 1 of 12  
**Duration**: 1 week  
**Status**: In Progress

---

## Sprint 1 Issues

| Issue | Summary | Points | Assignee | Status |
|-------|---------|--------|----------|--------|
| CF-001 | Project scaffolding: Next.js + TypeScript + Tailwind | 5 | crew-devops | In Progress |
| CF-002 | Database schema: Drizzle ORM data model | 8 | crew-db | In Progress |
| CF-003 | Authentication: Clerk integration | 5 | crew-be | In Progress |
| CF-004 | Real-time data layer: Supabase Realtime | 8 | crew-be | Blocked (needs CF-002) |

**Total**: 26 story points  
**Dependencies**: CF-001 → CF-002 → CF-004, CF-003 parallel with CF-002

## Sprint 1 Goals

1. Initialize Next.js 14 project with App Router, TypeScript strict, Tailwind CSS 4
2. Set up PostgreSQL schema via Drizzle ORM (16 tables)
3. Integrate Clerk for authentication (Google, GitHub, email magic link)
4. Prepare Supabase Realtime subscriptions (blocked until schema is ready)

## Acceptance Criteria

- [ ] `npm run dev` starts on localhost:3000
- [ ] TypeScript compiles with zero errors
- [ ] Tailwind classes render correctly
- [ ] Database schema generates migrations
- [ ] Clerk auth flow works (sign-up, sign-in, session)
- [ ] ESLint passes with zero errors

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Schema design incomplete | High | Crew-db has full 16-table design ready |
| Clerk integration complex | Medium | Use Clerk's Next.js SDK (well-documented) |
| Supabase Realtime blocked | Low | CF-004 can start in Sprint 2 if needed |
