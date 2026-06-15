# Sprint 6 Plan — Import/Export, Attachments, Views, Notifications

**Date**: 2026-06-15  
**Sprint**: 6 of 12  
**Status**: In Progress  
**Phase**: Phase 2 — Features & Integrations

---

## Sprint 6 Issues

| Issue | Summary | Points | Assignee | Status |
|-------|---------|--------|----------|--------|
| CF-021 | Import/Export: CSV and JSON data | 8 | crew-fe | In Progress |
| CF-022 | Attachments: File upload and management | 8 | crew-be | In Progress |
| CF-023 | Views management: Save/switch custom views | 5 | crew-fe | In Progress |
| CF-024 | Email notifications: Record changes | 5 | crew-be | In Progress |

**Total**: 26 story points  
**Dependencies**: CF-021+CF-023 (UI features), CF-022+CF-024 (backend features)

## Sprint 6 Goals

1. CSV/JSON import with auto-detection
2. CSV/JSON export with formatting
3. File upload to S3/R2 with drag-and-drop
4. Save/load custom views per table
5. Email notification system for mentions and changes

## Acceptance Criteria

- [ ] CSV import parses columns and creates records
- [ ] JSON import handles nested data
- [ ] Export downloads table as CSV/JSON
- [ ] Drag-and-drop file upload works
- [ ] Image thumbnails render in grid/kanban
- [ ] Custom views save filter/sort/group state
- [ ] Views can be switched via dropdown
- [ ] Email sent on @mention
