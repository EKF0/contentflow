# Component Architecture — ContentFlow

**Date**: 2026-06-15  
**Researcher**: Frontend Engineer Agent  
**Status**: Complete

---

## Component Hierarchy

```
AppShell
├── Sidebar
│   ├── SidebarHeader (logo + app name + toggle)
│   ├── SidebarSection ("Tables")
│   │   └── NavTableItem × N
│   └── SidebarSection ("Views")
│       └── NavViewItem × 3 (Grid, Kanban, Calendar)
├── MainArea
│   ├── TopBar
│   │   ├── Breadcrumb
│   │   ├── Spacer
│   │   ├── AvatarStack
│   │   └── ShareButton
│   ├── Toolbar
│   │   ├── ViewTabs (Grid, Kanban, Calendar)
│   │   ├── ToolbarDivider
│   │   ├── FilterButton
│   │   ├── SortButton
│   │   ├── GroupButton
│   │   └── SearchInput
│   └── ViewContainer
│       ├── GridView
│       │   ├── GridWrapper
│       │   │   └── GridTable
│       │   │       ├── GridHeader (sticky)
│       │   │       │   ├── RowNumHeader
│       │   │       │   ├── CheckboxHeader
│       │   │       │   └── GridColumnHeader × N
│       │   │       └── GridBody
│       │   │           └── GridRow × N
│       │   │               ├── RowNumCell
│       │   │               ├── CheckboxCell
│       │   │               ├── TitleCell
│       │   │               ├── StatusCell → StatusBadge
│       │   │               ├── TypeCell → TypeTag
│       │   │               ├── AssigneeCell → MiniAvatar
│       │   │               ├── DateCell
│       │   │               ├── WordsCell
│       │   │               ├── FeaturedCell → Checkbox
│       │   │               └── NotesCell
│       │   └── GridFooter (record count + filter info)
│       ├── KanbanView
│       │   └── KanbanWrapper (horizontal scroll)
│       │       └── KanbanColumn × 5 (one per status)
│       │           ├── KanbanColumnHeader
│       │           │   ├── StatusDot
│       │           │   ├── StatusName
│       │           │   ├── CardCount
│       │           │   └── AddButton
│       │           └── KanbanCards
│       │               └── KanbanCard × N
│       │                   ├── CardTitle
│       │                   ├── CardMeta (TypeTag + FeaturedTag)
│       │                   └── CardBottom (Date + Words + Avatar)
│       └── CalendarView
│           └── CalendarWrapper
│               ├── CalendarHeader
│               │   ├── PrevButton
│               │   ├── MonthYearTitle
│               │   ├── NextButton
│               │   └── TodayButton
│               └── CalendarGrid
│                   ├── CalendarWeekdays (Sun-Sat)
│                   └── CalendarDays (6×7 grid)
│                       └── CalendarDay × 42
│                           ├── DayNumber
│                           └── CalendarEvent × N
│                               ├── StatusDot
│                               └── EventTitle
└── RecordPanel (overlay)
    ├── PanelOverlay (click to close)
    └── SlidePanel
        ├── PanelHeader
        │   ├── TypeTag
        │   ├── PanelTitle
        │   └── CloseButton
        └── PanelBody (scrollable)
            └── RecordField × N
                ├── FieldLabel + FieldIcon
                └── FieldRenderer (Input/Select/Textarea/Checkbox)
```

## State Management

### Global State

```typescript
// View state
currentView: 'grid' | 'kanban' | 'calendar'
searchQuery: string
calendarDate: Date

// Data
records: Record[]
filteredRecords: Record[]  // derived from records + searchQuery

// UI state
sidebarCollapsed: boolean
panelOpen: boolean
selectedRecordId: number | null
```

### State Flow

```
records (source of truth)
  ↓ + searchQuery
filteredRecords (derived via useMemo)
  ↓
GridView / KanbanView / CalendarView (read filteredRecords)
  ↓
record mutations → updateRecord() → re-filter → re-render
```

## Reusable Components

| Component | Props | Used In |
|-----------|-------|---------|
| `StatusBadge` | `{ status: Status }` | Grid cells, Kanban cards |
| `TypeTag` | `{ type: ContentType }` | Grid cells, Kanban cards, Panel header |
| `Avatar` | `{ name, initials, color, size? }` | Grid cells, Kanban cards, TopBar |
| `AvatarStack` | `{ assignees: Assignee[] }` | TopBar |
| `SearchInput` | `{ value, onChange }` | Toolbar |
| `ViewTabs` | `{ active, onChange }` | Toolbar |
| `Overlay` | `{ open, onClose }` | Record panel |
| `SlidePanel` | `{ open, onClose, children }` | Record detail |
| `RecordField` | `{ field, value, onChange }` | Panel body |

## Constants

```typescript
STATUSES: ['Idea', 'Drafting', 'In Review', 'Published', 'Archived']
TYPES: ['Blog', 'Newsletter', 'Social', 'Video', 'Podcast']

ASSIGNEES: [
  { name: 'Sarah Chen', initials: 'SC', color: 'var(--avatar-1)' },
  { name: 'Marcus Rivera', initials: 'MR', color: 'var(--avatar-2)' },
  { name: 'Aisha Patel', initials: 'AP', color: 'var(--avatar-3)' },
  { name: "James O'Brien", initials: 'JO', color: 'var(--avatar-4)' },
  { name: 'Lena Kowalski', initials: 'LK', color: 'var(--avatar-5)' },
]

FIELDS: [
  { key: 'title', label: 'Title', type: 'text', width: '260px' },
  { key: 'status', label: 'Status', type: 'select', width: '120px' },
  { key: 'type', label: 'Type', type: 'select', width: '110px' },
  { key: 'assignee', label: 'Assignee', type: 'collaborator', width: '150px' },
  { key: 'date', label: 'Publish Date', type: 'date', width: '120px' },
  { key: 'words', label: 'Word Count', type: 'number', width: '100px' },
  { key: 'featured', label: 'Featured', type: 'checkbox', width: '80px' },
  { key: 'notes', label: 'Notes', type: 'text', width: '220px' },
]
```

## Helpers to Preserve

| Function | Purpose | React Replacement |
|----------|---------|------------------|
| `esc(s)` | XSS escaping | Not needed (React auto-escapes) |
| `truncate(s, n)` | String truncation | `lib/utils.ts` |
| `statusClass(s)` | Status → CSS class | Tailwind classes |
| `typeClass(t)` | Type → CSS class | Tailwind classes |
| `formatDate(d)` | Date formatting | `date-fns` or `Intl` |
| `formatDateShort(d)` | Short date | `date-fns` or `Intl` |
