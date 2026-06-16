# Field Types Reference

ContentFlow supports 18 field types organized into three categories. Each type has a Zod config schema, validation logic, and display formatting.

## Categories

| Category | Types |
|----------|-------|
| **Basic** | Text, Long Text, Number, Select, Multi-Select, Date, Checkbox |
| **Advanced** | Date Range, Collaborator, URL, Email, Phone, Attachment, Link, Multi-Link |
| **Computed** | Formula, Lookup, Rollup |

---

## Basic Fields

### Text
Single-line text input.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `maxLength` | number | — | Max character count |
| `placeholder` | string | — | Placeholder text |

**Value**: `string`

---

### Long Text
Multi-line text, suitable for notes and descriptions.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `maxLength` | number | — | Max character count |
| `placeholder` | string | — | Placeholder text |

**Value**: `string`

---

### Number
Integer, decimal, currency, or percent.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'integer' \| 'decimal' \| 'currency' \| 'percent'` | `'integer'` | Display format |
| `decimalPlaces` | number | `0` | Decimal precision (0-10) |
| `currency` | string | `'USD'` | Currency code for currency format |
| `min` | number | — | Minimum value |
| `max` | number | — | Maximum value |

**Value**: `number`

**Display**:
- `integer`: `1,234`
- `decimal`: `1,234.50`
- `currency`: `$1,234.50`
- `percent`: `75%`

---

### Select
Single selection from predefined options.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `allowCustom` | boolean | `false` | Allow values not in options list |

**Value**: `string | null`

Options are stored in the `field_options` table with label, color, and icon.

---

### Multi-Select
Multiple selections from predefined options.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `allowCustom` | boolean | `false` | Allow custom values |
| `maxSelections` | number | — | Maximum selections allowed |

**Value**: `string[]`

---

### Date
Date or datetime picker.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'date' \| 'datetime' \| 'time'` | `'date'` | Display format |
| `includeTime` | boolean | `false` | Show time picker |

**Value**: ISO date string (`"2025-01-15"`) or datetime string (`"2025-01-15T10:30:00Z"`)

---

### Checkbox
Boolean toggle.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultValue` | boolean | `false` | Default checked state |

**Value**: `boolean`

---

## Advanced Fields

### Date Range
Start and end date pair.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'date' \| 'datetime'` | `'date'` | Display format |

**Value**: `{ start: string, end: string }`

**Display**: `"Jan 15, 2025 - Feb 28, 2025"`

---

### Collaborator
Reference to workspace members.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `multiple` | boolean | `false` | Allow multiple collaborators |

**Value**: `string[]` (user IDs)

**Display**: `"3 collaborators"`

---

### URL
Web address with protocol validation.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `requireProtocol` | boolean | `true` | Require `http://` or `https://` |
| `allowedProtocols` | string[] | `['http', 'https']` | Allowed protocols |

**Value**: `string`

---

### Email
Email address with format validation.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `allowMultiple` | boolean | `false` | Allow comma-separated emails |

**Value**: `string`

**Validation**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

---

### Phone
Phone number with format options.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'national' \| 'international' \| 'e164'` | `'national'` | Display format |

**Value**: `string`

**Validation**: 7-15 digits (stripping non-digit chars).

---

### Attachment
File upload field.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `maxFiles` | number | `5` | Maximum files |
| `allowedTypes` | string[] | — | MIME type whitelist |

**Value**: `string[]` (file URLs/IDs)

**Display**: `"3 files"`

---

### Link
Single record link to another table.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `linkedTableId` | string | — | Target table ID |
| `linkedFieldName` | string | — | Display field name |
| `multiple` | boolean | `false` | Allow multiple links |

**Value**: `{ recordId: string, title: string } | null`

---

### Multi-Link
Multiple record links to another table.

Uses same config as Link.

**Value**: `{ recordId: string, title: string }[]`

---

## Computed Fields

### Formula
Calculated value from an expression.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `expression` | string | `''` | Formula expression |
| `returnType` | `'text' \| 'number' \| 'date'` | `'text'` | Result type |
| `referencedFields` | string[] | `[]` | Field IDs used in formula |

**Value**: `string | number | boolean`

#### Formula Syntax

Reference fields with `{FieldName}`. Supported functions:

| Function | Description | Example |
|----------|-------------|---------|
| `SUM(a, b, ...)` | Sum of values | `SUM({Budget}, {Actual})` |
| `COUNT(items)` | Count items | `COUNT({Tasks})` |
| `IF(cond, true, false)` | Conditional | `IF({Status} = "Published", 1, 0)` |
| `CONCAT(a, b, ...)` | Join strings | `CONCAT({First}, " ", {Last})` |
| `DATE_DIFF(a, b, unit)` | Date difference | `DATE_DIFF({Publish}, {Created}, "days")` |
| `ROUND(num, dec)` | Round number | `ROUND({Score}, 2)` |
| `UPPER(text)` | Uppercase | `UPPER({Title})` |
| `LOWER(text)` | Lowercase | `LOWER({Email})` |
| `MIN(a, b, ...)` | Minimum | `MIN({Start}, {End})` |
| `MAX(a, b, ...)` | Maximum | `MAX({Score1}, {Score2})` |
| `ABS(num)` | Absolute value | `ABS({Difference})` |
| `LEN(text)` | String length | `LEN({Notes})` |
| `TRIM(text)` | Remove whitespace | `TRIM({Name})` |
| `LEFT(text, n)` | Left substring | `LEFT({Code}, 3)` |
| `RIGHT(text, n)` | Right substring | `RIGHT({Code}, 3)` |
| `MID(text, start, n)` | Middle substring | `MID({Code}, 2, 4)` |
| `AND(c1, c2, ...)` | Logical AND | `AND({A} > 0, {B} > 0)` |
| `OR(c1, c2, ...)` | Logical OR | `OR({A} = 1, {B} = 1)` |
| `NOT(cond)` | Logical NOT | `NOT({Archived})` |
| `NOW()` | Current datetime | `NOW()` |
| `TODAY()` | Current date | `TODAY()` |

Operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `+`, `-`, `*`, `/`, `&` (concat)

---

### Lookup
Pulls a value from a linked record.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `linkedFieldId` | string | — | Source field ID in linked record |

**Value**: `string` (read-only, computed from linked record)

---

### Rollup
Aggregates values from linked records.

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `linkedFieldId` | string | — | Field to aggregate |
| `aggregation` | `'count' \| 'sum' \| 'min' \| 'max' \| 'list'` | `'count'` | Aggregation function |

**Value**: `number` (for count/sum/min/max) or `string` (for list, comma-separated)

---

## Helper Functions

The field type system provides these utility functions in `src/lib/field-types.ts`:

```typescript
getFieldType(typeId)           // Get FieldTypeInfo by type ID
getDefaultConfig(typeId)       // Get default config schema for a type
validateFieldValue(typeId, value, config)  // Validate a cell value
formatFieldValue(typeId, value, config)    // Format for display
parseFieldValue(typeId, raw)              // Parse from raw string
getFieldTypesByCategory()      // Group types by category
```
