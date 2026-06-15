import type { ContentRecord, Status, ContentType } from '@/types';
import { ASSIGNEES, STATUSES, TYPES } from '@/types';

const VALID_STATUSES = new Set<string>(STATUSES);
const VALID_TYPES = new Set<string>(TYPES);
const ASSIGNEE_NAME_MAP = new Map(ASSIGNEES.map((a, i) => [a.name.toLowerCase(), i]));

export function detectDelimiter(headerLine: string): string {
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
}

function parseQuotedCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === delimiter) {
        fields.push(current);
        current = '';
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  fields.push(current);
  return fields;
}

export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]!);
  const headers = parseQuotedCSVLine(lines[0]!, delimiter).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseQuotedCSVLine(lines[i]!, delimiter);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j]?.trim() ?? '';
    }
    rows.push(row);
  }

  return { headers, rows };
}

export function parseJSON(text: string): { headers: string[]; rows: Record<string, string>[] } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON format');
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return { headers: [], rows: [] };
    const flat = data.map((item) => flattenObject(item));
    const headerSet = new Set<string>();
    flat.forEach((row) => Object.keys(row).forEach((k) => headerSet.add(k)));
    const headers = Array.from(headerSet);
    return { headers, rows: flat };
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(Object.values(data)[0])) {
      const firstArr = Object.values(data)[0] as unknown[];
      if (firstArr.length > 0 && typeof firstArr[0] === 'object') {
        const flat = firstArr.map((item) => flattenObject(item));
        const headerSet = new Set<string>();
        flat.forEach((row) => Object.keys(row).forEach((k) => headerSet.add(k)));
        const headers = Array.from(headerSet);
        return { headers, rows: flat };
      }
    }
    const flat = flattenObject(data);
    return { headers: Object.keys(flat), rows: [flat] };
  }

  return { headers: [], rows: [] };
}

function flattenObject(obj: unknown, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof obj !== 'object' || obj === null) return result;

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, path));
    } else if (value !== null && value !== undefined) {
      result[path] = String(value);
    }
  }
  return result;
}

export interface ColumnMapping {
  csvColumn: string;
  field: keyof ContentRecord | null;
}

function normalizeFieldName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const FIELD_ALIASES: Record<string, keyof ContentRecord> = {
  title: 'title',
  name: 'title',
  subject: 'title',
  headline: 'title',
  heading: 'title',
  status: 'status',
  state: 'status',
  lifecycle: 'status',
  type: 'type',
  contenttype: 'type',
  category: 'type',
  format: 'type',
  genre: 'type',
  assignee: 'assignee',
  author: 'assignee',
  owner: 'assignee',
  writer: 'assignee',
  person: 'assignee',
  date: 'date',
  publishdate: 'date',
  pubdate: 'date',
  scheduledate: 'date',
  publish: 'date',
  words: 'words',
  wordcount: 'words',
  wc: 'words',
  length: 'words',
  count: 'words',
  featured: 'featured',
  highlight: 'featured',
  star: 'featured',
  pinned: 'featured',
  favorite: 'featured',
  favourite: 'featured',
  notes: 'notes',
  note: 'notes',
  description: 'notes',
  desc: 'notes',
  comments: 'notes',
  memo: 'notes',
};

export function guessFieldMapping(csvHeaders: string[]): ColumnMapping[] {
  return csvHeaders.map((header) => {
    const normalized = normalizeFieldName(header);
    const field = FIELD_ALIASES[normalized] ?? null;
    return { csvColumn: header, field };
  });
}

function mapAssignee(value: string): number {
  const lower = value.toLowerCase().trim();
  if (ASSIGNEE_NAME_MAP.has(lower)) return ASSIGNEE_NAME_MAP.get(lower)!;
  const idx = parseInt(value, 10);
  if (!isNaN(idx) && idx >= 0 && idx < ASSIGNEES.length) return idx;
  return 0;
}

function parseImportValue(
  field: keyof ContentRecord,
  value: string,
): ContentRecord[keyof ContentRecord] | null {
  switch (field) {
    case 'id':
      return parseInt(value, 10) || 0;
    case 'title':
      return value || 'Untitled';
    case 'status': {
      const normalized = value.trim();
      if (VALID_STATUSES.has(normalized)) return normalized as Status;
      const mapped = STATUSES.find((s) => s.toLowerCase() === normalized.toLowerCase());
      return mapped ?? 'Idea';
    }
    case 'type': {
      const normalized = value.trim();
      if (VALID_TYPES.has(normalized)) return normalized as ContentType;
      const mapped = TYPES.find((t) => t.toLowerCase() === normalized.toLowerCase());
      return mapped ?? 'Blog';
    }
    case 'assignee':
      return mapAssignee(value);
    case 'date':
      return normalizeDate(value);
    case 'words':
      return parseInt(value.replace(/,/g, ''), 10) || 0;
    case 'featured':
      return ['true', 'yes', '1', '✓', 'x'].includes(value.toLowerCase().trim());
    case 'notes':
      return value;
    default:
      return value;
  }
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

export function importRecords(
  rows: Record<string, string>[],
  mapping: ColumnMapping[],
  existingRecords: ContentRecord[],
): ContentRecord[] {
  const maxId = existingRecords.reduce((max, r) => Math.max(max, r.id), 0);
  return rows.map((row, i) => {
    const record: Partial<ContentRecord> = {};
    for (const m of mapping) {
      if (m.field && row[m.csvColumn] !== undefined) {
        const val = parseImportValue(m.field, row[m.csvColumn]);
        if (val !== null) (record as Record<string, unknown>)[m.field] = val;
      }
    }
    return {
      id: maxId + i + 1,
      title: record.title ?? 'Untitled',
      status: record.status ?? 'Idea',
      type: record.type ?? 'Blog',
      assignee: record.assignee ?? 0,
      date: record.date ?? new Date().toISOString().slice(0, 10),
      words: record.words ?? 0,
      featured: record.featured ?? false,
      notes: record.notes ?? '',
    } as ContentRecord;
  });
}

export function toCSV(records: ContentRecord[]): string {
  const headers = ['Title', 'Status', 'Type', 'Assignee', 'Publish Date', 'Word Count', 'Featured', 'Notes'];
  const rows = records.map((r) => {
    const assigneeName = ASSIGNEES[r.assignee]?.name ?? '';
    return [
      escapeCSVField(r.title),
      escapeCSVField(r.status),
      escapeCSVField(r.type),
      escapeCSVField(assigneeName),
      escapeCSVField(r.date),
      String(r.words),
      r.featured ? 'Yes' : 'No',
      escapeCSVField(r.notes),
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toJSON(records: ContentRecord[]): string {
  return JSON.stringify(
    records.map((r) => ({
      title: r.title,
      status: r.status,
      type: r.type,
      assignee: ASSIGNEES[r.assignee]?.name ?? '',
      date: r.date,
      words: r.words,
      featured: r.featured,
      notes: r.notes,
    })),
    null,
    2,
  );
}
