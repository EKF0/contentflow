# Changelog

All notable changes to ContentFlow.

## [0.1.0] — In Development

### Sprint 7 (Latest) — Features & Integrations

**Added**
- REST API with API keys for external integrations (CF-025)
- Webhook support for record create/update/delete events (CF-025)
- Social media scheduling integration — Twitter/X, LinkedIn, Instagram (CF-026)
- Content calendar sync with Google Calendar (CF-026)
- Analytics dashboard with content performance metrics (CF-027)
- Inline threaded comments with @mention support (CF-028)
- Comment resolution workflow (CF-028)
- Comment notifications via email (CF-028)

### Sprint 6 — Features & Integrations

**Added**
- CSV and JSON data import/export (CF-021)
- Auto-detect columns on CSV import (CF-021)
- Chunked processing for large files (10K+ rows) (CF-021)
- File upload to S3/R2 bucket (CF-022)
- Image thumbnails in grid and kanban views (CF-022)
- Drag-and-drop file upload (CF-022)
- File preview modal (CF-022)
- Saved views — create, switch, delete custom views (CF-023)
- View sharing with team members (CF-023)
- Email notifications for @mentions and assignments (CF-024)
- Configurable per-user notification preferences (CF-024)

### Sprint 5 — Core Product

**Added**
- AI content suggestions — titles, outlines, tags (CF-017)
- Social media snippet generation from long-form content (CF-017)
- Content templates — Blog Post, Newsletter, Social, Video, Podcast (CF-018)
- Custom template creation and saving (CF-018)
- Activity log and audit trail (CF-019)
- Record change history with undo support (CF-019)
- Keyboard shortcuts — Cmd+K, Cmd+N, Cmd+F, arrow navigation (CF-020)
- Shortcut help overlay (Cmd+/) (CF-020)

### Sprint 4 — Core Product

**Added**
- Debounced global search across text fields (CF-013)
- Filter bar with status, type, assignee, date range filters (CF-013)
- AND logic for combined filters (CF-013)
- Filter state persistence in URL (CF-013)
- Column header sorting (asc/desc/none) (CF-014)
- Record grouping by any field (CF-014)
- Group headers with count and collapse/expand (CF-014)
- Multi-workspace support — create, switch, delete (CF-015)
- Workspace settings — name, icon, description (CF-015)
- Table CRUD with field definitions (CF-015)
- Field type registry — 18 types with config schemas (CF-016)
- Add/edit/delete/reorder fields (CF-016)
- Field validation rules (CF-016)

### Sprint 3 — Core Product

**Added**
- Grid view — editable spreadsheet with inline editing (CF-009)
- Sticky headers and column resize (CF-009)
- Row selection and column reorder (CF-009)
- Kanban view — drag-and-drop card board (CF-010)
- Cards grouped by status with metadata (CF-010)
- Calendar view — monthly publish schedule (CF-011)
- Color-coded events by status (CF-011)
- Record detail panel — slide-in editor (CF-012)
- All field type editors in detail panel (CF-012)

### Sprint 2 — Foundation

**Added**
- App shell — sidebar navigation, top bar, workspace switcher (CF-005)
- Design system — token-based CSS, 7 UI primitives (CF-006)
- Light/dark theme support (CF-006)
- tRPC API layer — workspace, table, record, field CRUD (CF-007)
- Data seeding — 18 sample editorial records (CF-008)

### Sprint 1 — Foundation

**Added**
- Next.js 14 App Router project setup (CF-001)
- TypeScript strict mode, ESLint, Prettier (CF-001)
- PostgreSQL schema via Drizzle ORM — 16 tables (CF-002)
- Clerk authentication — Google, GitHub, email magic link (CF-003)
- Supabase Realtime subscriptions (CF-004)
- Optimistic updates with conflict resolution (CF-004)

---

## Roadmap

### Phase 3 — Advanced Features (In Progress)

| Issue | Feature | Sprint |
|-------|---------|--------|
| CF-029 | Formulas and computed fields | Sprint 8 |
| CF-030 | Record linking between tables | Sprint 8 |
| CF-031 | AI content assistant (in-context) | Sprint 8 |
| CF-032 | Workflow automations | Sprint 9 |
| CF-033 | Content repurposing tracker | Sprint 9 |
| CF-034 | Mobile responsive design | Sprint 9 |
| CF-035 | Performance optimization (100K+ records) | Sprint 10 |
| CF-036 | Testing suite (unit, integration, E2E) | Sprint 10 |
| CF-037 | Documentation | Sprint 10 |
| CF-038 | Accessibility audit (WCAG 2.1 AA) | Sprint 10 |

### Phase 4 — Launch & Growth (Planned)

| Issue | Feature | Sprint |
|-------|---------|--------|
| CF-039 | Deployment pipeline (Vercel + CI/CD) | Sprint 11 |
| CF-040 | Stripe billing integration | Sprint 11 |
| CF-041 | Landing page and marketing site | Sprint 11 |
| CF-042 | Beta testing and launch prep | Sprint 12 |
| CF-043 | Public launch (Product Hunt) | Sprint 12 |
| CF-044 | Post-launch iteration | Sprint 12 |
