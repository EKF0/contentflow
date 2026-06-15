# Sprint 2 Plan — UI Shell + API Layer

**Date**: 2026-06-15  
**Sprint**: 2 of 12  
**Duration**: 1 week  
**Status**: In Progress

---

## Sprint 2 Issues

| Issue | Summary | Points | Assignee | Status |
|-------|---------|--------|----------|--------|
| CF-005 | App shell: Layout with sidebar navigation | 5 | crew-fe | In Progress |
| CF-006 | Design system: Token-based components | 5 | crew-fe | In Progress |
| CF-007 | API layer: tRPC endpoints for CRUD | 8 | crew-be | In Progress |
| CF-008 | Data seeding: Editorial sample data | 3 | crew-db | Blocked (needs CF-007) |

**Total**: 21 story points  
**Dependencies**: CF-005+CF-006 (parallel, same agent), CF-007 (independent), CF-008 (needs CF-007)

## Sprint 2 Goals

1. Build responsive app shell matching Airtable layout from prototype
2. Create reusable UI component library (Button, Input, Select, Badge, Avatar, Checkbox)
3. Implement type-safe API layer with tRPC + Zod validation
4. Prepare data seeding for sample editorial records

## Acceptance Criteria

- [ ] Sidebar collapses/expands with animation
- [ ] View tabs switch between Grid/Kanban/Calendar (placeholder views)
- [ ] Search input is functional
- [ ] All UI components render correctly in light and dark mode
- [ ] tRPC endpoints respond to queries/mutations
- [ ] Input validation rejects invalid data
- [ ] Auth middleware protects all endpoints

## Research Completed

- Component architecture: `Docs/Researchs/COMPONENT_ARCHITECTURE.md`
- Design system: `Docs/Plans/DESIGN_SYSTEM.md`
- API architecture: `Docs/Plans/API_ARCHITECTURE.md`

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| UI doesn't match prototype | Medium | Reference index.html CSS directly |
| tRPC v11 API changes | Low | Use official docs patterns |
| Seed data conflicts with schema | Low | Use DB schema as source of truth |
