# Sprint 5 Plan — AI, Templates, Activity, Shortcuts

**Date**: 2026-06-15  
**Sprint**: 5 of 12  
**Status**: In Progress  
**Phase**: Phase 1 — Core Product (final sprint)

---

## Sprint 5 Issues

| Issue | Summary | Points | Assignee | Status |
|-------|---------|--------|----------|--------|
| CF-017 | AI content suggestions: Title, outline, tag generation | 13 | crew-ai | In Progress |
| CF-018 | Content templates: Pre-built editorial workflows | 8 | crew-be | In Progress |
| CF-019 | Activity log and audit trail | 5 | crew-be | In Progress |
| CF-020 | Keyboard shortcuts: Power-user navigation | 3 | crew-fe | In Progress |

**Total**: 29 story points  
**Dependencies**: CF-017 (independent), CF-018 (independent), CF-019 (needs schema already done), CF-020 (independent)

## Sprint 5 Goals

1. Integrate OpenAI API for content suggestions (titles, outlines, tags, social snippets)
2. Build template system with pre-built editorial workflows
3. Implement activity log for audit trail
4. Add keyboard shortcuts for power users

## Acceptance Criteria

- [ ] AI can generate 5 title suggestions from a topic
- [ ] AI can generate content outline from a title
- [ ] AI can suggest tags/categories for a record
- [ ] 5 pre-built templates available (Blog, Newsletter, Social, Video, Podcast)
- [ ] Templates create workspace with fields + statuses + sample records
- [ ] Activity log captures all record changes with timestamps
- [ ] Cmd+K opens command palette
- [ ] Escape closes panels/modals
