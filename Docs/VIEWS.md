# Views

ContentFlow provides three data views for working with records: Grid, Kanban, and Calendar. Views can be saved, shared, and switched instantly.

## View Types

### Grid View

Editable spreadsheet layout — the primary data view.

**Features**:
- Inline cell editing (click to edit, Enter to confirm, Escape to cancel)
- Column resize (drag column borders)
- Row selection (click row number, Shift+click for range)
- Sort by clicking column headers (asc → desc → none)
- Group by any field (collapsible group headers with counts)
- Virtual scrolling for large datasets (100K+ records)
- Sticky headers and row numbers
- Column reorder via drag-and-drop
- Record detail panel (click row to open slide-in editor)

**Keyboard shortcuts**:
- `Arrow keys` — Navigate cells
- `Enter` — Edit cell / open record
- `Escape` — Close panel / cancel edit
- `Tab` — Move to next cell
- `Shift+Tab` — Move to previous cell
- `Cmd/Ctrl+N` — New record
- `Cmd/Ctrl+Z` — Undo

---

### Kanban View

Card-based board grouped by status or any select field.

**Features**:
- Columns represent status/category values (Idea, Drafting, In Review, Published, Archived)
- Drag-and-drop cards between columns (uses @dnd-kit)
- Card displays: title, type tag, assignee avatar, due date, word count
- Add new cards via `+` button at column bottom
- Smooth drag animations
- Column card counts
- Click card to open record detail panel

**Customization**:
- Group by any `select` or `multi_select` field
- Customize column order
- Color-coded status badges

---

### Calendar View

Monthly grid showing records on their publish/schedule dates.

**Features**:
- Monthly calendar grid
- Records placed on their date field value
- Color-coded by status or type
- Previous/next month navigation
- "Today" button to jump to current date
- Click event to open record detail
- Week view toggle (planned)

**Date field mapping**:
- Uses the first `date` or `date_range` field in the table
- Records without a date appear in an "Unscheduled" section (planned)

---

## View Configuration

Each view stores its configuration in the `views` table:

```json
{
  "name": "My View",
  "type": "grid | kanban | calendar | gallery | form",
  "isDefault": false,
  "isShared": false,
  "filters": [...],
  "sorts": [...],
  "groupBy": { "field": "fieldId" },
  "columns": [...]
}
```

### Filters

Filters combine with AND logic. Each filter specifies:

```json
{
  "fieldId": "string",
  "operator": "eq | neq | contains | gt | lt | isEmpty | isNotEmpty",
  "value": "any"
}
```

**Supported filter operators by field type**:

| Field Type | Operators |
|-----------|-----------|
| text, long_text | `eq`, `neq`, `contains`, `isEmpty`, `isNotEmpty` |
| number | `eq`, `neq`, `gt`, `lt`, `isEmpty` |
| select | `eq`, `neq`, `isEmpty` |
| multi_select | `contains`, `isEmpty` |
| date | `eq`, `gt`, `lt`, `isEmpty` |
| checkbox | `eq` (true/false) |
| collaborator | `eq`, `isEmpty` |

### Sorts

```json
{ "fieldId": "string", "direction": "asc | desc" }
```

Multiple sort criteria supported. Records sort by first criterion, then tie-break with subsequent sorts.

### Group By

```json
{ "field": "fieldId" }
```

Groups records by field value. Group headers display:
- Group label (the field value)
- Record count
- Collapse/expand toggle
- Sort within groups

---

## Saved Views

Views are persisted per table. Each table has:

- **Default view** — always present, cannot be deleted
- **Custom views** — created by any editor or above

### View Operations

| Operation | Access | Description |
|-----------|--------|-------------|
| Create view | editor+ | Save current filter/sort/group configuration |
| Rename view | editor+ | Click view name to edit inline |
| Switch view | all | Click view tab to switch instantly |
| Share view | editor+ | Toggle `isShared` to make visible to all workspace members |
| Delete view | editor+ | Cannot delete the default view |

### View Switcher

The view switcher appears as tabs in the toolbar:

```
[Grid] [Kanban] [Calendar] [+ New View]
```

Click a tab to switch. The active view's filters, sorts, and group-by are applied to the current table data.

---

## Search

Global search across all text fields in the current table.

- Debounced input (300ms delay)
- Case-insensitive substring matching
- Searches record titles and all text-type cell values
- Results update the view in-place (no navigation)

**Keyboard shortcut**: `Cmd/Ctrl+F` to focus search.

---

## Filter Bar

The filter bar appears below the toolbar when filters are active.

**Adding a filter**:
1. Click "Filter" button in toolbar
2. Select field to filter by
3. Choose operator
4. Enter value

**Combining filters**: Multiple filters use AND logic — all must match.

**Clearing filters**: Click `×` on individual filters or "Clear all" to reset.

**URL persistence**: Filter state is encoded in the URL for shareable filtered views.

---

## View Permissions

| Role | Read Views | Create/Edit Views | Delete Views |
|------|-----------|-------------------|-------------|
| viewer | Yes (shared only) | No | No |
| editor | Yes | Yes | Yes (non-default) |
| admin | Yes | Yes | Yes |
| owner | Yes | Yes | Yes |

Private views (`isShared: false`) are only visible to the creator.
