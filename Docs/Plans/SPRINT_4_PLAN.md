# Sprint 4 Plan — Search, Sort, Workspaces, Fields

**Date**: 2026-06-15  
**Sprint**: 4 of 12  
**Status**: In Progress  
**Phase**: Phase 1 — Core Product

---

## Sprint 4 Issues

| Issue | Summary | Points | Assignee | Status |
|-------|---------|--------|----------|--------|
| CF-013 | Search and filter: Global search with field-level filtering | 8 | crew-fe | In Progress |
| CF-014 | Sort and group: Column sorting and record grouping | 5 | crew-fe | In Progress |
| CF-015 | Workspace and table management | 8 | crew-be | In Progress |
| CF-016 | Field type system: Configurable field definitions | 8 | crew-be | In Progress |

**Total**: 29 story points  
**Dependencies**: CF-013+CF-014 (UI features, same agent), CF-015+CF-016 (core data, same agent)

## Sprint 4 Goals

1. Implement debounced search with multi-field filtering
2. Add column sorting and record grouping to Grid view
3. Build workspace CRUD (create, switch, delete, invite members)
4. Implement configurable field definitions per table

## Acceptance Criteria

- [ ] Search debounces (300ms) across title, status, type, assignee, notes
- [ ] Filter bar: status, type, assignee, date range, featured toggle
- [ ] Grid columns clickable for sort (asc/desc/none)
- [ ] Records groupable by any field with collapse/expand
- [ ] Workspaces can be created, switched, deleted
- [ ] Tables can be added/renamed/deleted per workspace
- [ ] Fields can be added/edited/reordered per table
