# Sprint 3 Plan — Three Core Views

**Date**: 2026-06-15  
**Sprint**: 3 of 12  
**Duration**: 1 week  
**Status**: In Progress  
**Phase**: Phase 1 — Core Product

---

## Sprint 3 Issues

| Issue | Summary | Points | Assignee | Status |
|-------|---------|--------|----------|--------|
| CF-008 | Data seeding: Editorial sample data | 3 | crew-db | In Progress |
| CF-009 | Grid view: Editable spreadsheet | 13 | crew-fe | In Progress |
| CF-010 | Kanban view: Drag-and-drop cards | 8 | crew-fe | In Progress |
| CF-011 | Calendar view: Monthly publish schedule | 8 | crew-fe | In Progress |
| CF-012 | Record detail panel: Slide-in editor | 5 | crew-fe | In Progress |

**Total**: 37 story points (biggest sprint)  
**Dependencies**: CF-008 independent, CF-009/CF-010/CF-011/CF-012 share data model

## Sprint 3 Goals

1. Implement all three views from prototype (Grid, Kanban, Calendar)
2. Connect views to tRPC data layer
3. Build record detail panel with full editing
4. Seed sample data for demo

## Acceptance Criteria

- [ ] Grid view renders all records with correct columns
- [ ] Grid cells are editable (text, select, date, number, checkbox)
- [ ] Kanban cards grouped by status with drag-and-drop
- [ ] Calendar shows events on correct dates
- [ ] Record panel opens on click with editable fields
- [ ] Search filters across all views
- [ ] All views share the same data source
