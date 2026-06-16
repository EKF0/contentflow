import { describe, it, expect } from 'vitest';
import {
  detectDelimiter,
  parseCSV,
  parseJSON,
  guessFieldMapping,
  importRecords,
  toCSV,
  toJSON,
} from '@/lib/import-export';
import type { ContentRecord } from '@/types';

const SAMPLE_RECORDS: ContentRecord[] = [
  {
    id: 1,
    title: 'Getting Started with React',
    status: 'Published',
    type: 'Blog',
    assignee: 0,
    date: '2024-06-15',
    words: 2500,
    featured: true,
    notes: 'Intro guide',
  },
  {
    id: 2,
    title: 'Q2 Newsletter',
    status: 'Drafting',
    type: 'Newsletter',
    assignee: 1,
    date: '2024-07-01',
    words: 1200,
    featured: false,
    notes: 'Quarterly recap',
  },
  {
    id: 3,
    title: 'Product Demo Video',
    status: 'In Review',
    type: 'Video',
    assignee: 2,
    date: '2024-07-10',
    words: 800,
    featured: false,
    notes: '',
  },
];

// ─── detectDelimiter ─────────────────────────────────────────

describe('detectDelimiter', () => {
  it('detects comma delimiter', () => {
    expect(detectDelimiter('name,age,city')).toBe(',');
  });

  it('detects tab delimiter', () => {
    expect(detectDelimiter('name\tage\tcity')).toBe('\t');
  });

  it('detects semicolon delimiter', () => {
    expect(detectDelimiter('name;age;city')).toBe(';');
  });

  it('defaults to comma when counts are equal', () => {
    expect(detectDelimiter('a,b;c')).toBe(',');
  });
});

// ─── parseCSV ────────────────────────────────────────────────

describe('parseCSV', () => {
  it('parses simple CSV', () => {
    const csv = 'Title,Status,Type\nHello,Drafting,Blog\nWorld,Published,Video';
    const result = parseCSV(csv);
    expect(result.headers).toEqual(['Title', 'Status', 'Type']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ Title: 'Hello', Status: 'Drafting', Type: 'Blog' });
  });

  it('handles quoted fields with commas', () => {
    const csv = 'Title,Notes\n"Hello, World","This has a, comma"';
    const result = parseCSV(csv);
    expect(result.rows[0]).toEqual({ Title: 'Hello, World', Notes: 'This has a, comma' });
  });

  it('handles escaped quotes', () => {
    const csv = 'Title,Notes\n"Hello ""World""","test"';
    const result = parseCSV(csv);
    expect(result.rows[0]).toEqual({ Title: 'Hello "World"', Notes: 'test' });
  });

  it('handles empty input', () => {
    expect(parseCSV('')).toEqual({ headers: [], rows: [] });
  });

  it('handles Windows line endings', () => {
    const csv = 'A,B\r\n1,2\r\n3,4';
    const result = parseCSV(csv);
    expect(result.rows).toHaveLength(2);
  });

  it('handles extra whitespace in headers', () => {
    const csv = ' Title , Status \nHello,Drafting';
    const result = parseCSV(csv);
    expect(result.headers).toEqual(['Title', 'Status']);
  });

  it('trims whitespace in values', () => {
    const csv = 'Title,Status\n Hello , Drafting ';
    const result = parseCSV(csv);
    expect(result.rows[0]).toEqual({ Title: 'Hello', Status: 'Drafting' });
  });
});

// ─── parseJSON ───────────────────────────────────────────────

describe('parseJSON', () => {
  it('parses array of objects', () => {
    const json = JSON.stringify([
      { title: 'Hello', status: 'Drafting' },
      { title: 'World', status: 'Published' },
    ]);
    const result = parseJSON(json);
    expect(result.headers).toContain('title');
    expect(result.headers).toContain('status');
    expect(result.rows).toHaveLength(2);
  });

  it('handles nested objects by flattening', () => {
    const json = JSON.stringify([{ meta: { title: 'Hello', author: 'John' } }]);
    const result = parseJSON(json);
    expect(result.headers).toContain('meta.title');
    expect(result.headers).toContain('meta.author');
    expect(result.rows[0]['meta.title']).toBe('Hello');
  });

  it('handles single object', () => {
    const json = JSON.stringify({ title: 'Hello', status: 'Drafting' });
    const result = parseJSON(json);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]['title']).toBe('Hello');
  });

  it('handles wrapped array object', () => {
    const json = JSON.stringify({ data: [{ title: 'Hello' }, { title: 'World' }] });
    const result = parseJSON(json);
    expect(result.rows).toHaveLength(2);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJSON('not json')).toThrow('Invalid JSON format');
  });

  it('handles empty array', () => {
    const result = parseJSON('[]');
    expect(result).toEqual({ headers: [], rows: [] });
  });

  it('converts non-string values to strings', () => {
    const json = JSON.stringify([{ count: 42, active: true }]);
    const result = parseJSON(json);
    expect(result.rows[0]['count']).toBe('42');
    expect(result.rows[0]['active']).toBe('true');
  });
});

// ─── guessFieldMapping ───────────────────────────────────────

describe('guessFieldMapping', () => {
  it('maps exact field names', () => {
    const result = guessFieldMapping(['Title', 'Status', 'Type']);
    expect(result[0].field).toBe('title');
    expect(result[1].field).toBe('status');
    expect(result[2].field).toBe('type');
  });

  it('maps fuzzy aliases', () => {
    const result = guessFieldMapping(['Name', 'State', 'Category', 'Author', 'WC', 'Star']);
    expect(result[0].field).toBe('title');
    expect(result[1].field).toBe('status');
    expect(result[2].field).toBe('type');
    expect(result[3].field).toBe('assignee');
    expect(result[4].field).toBe('words');
    expect(result[5].field).toBe('featured');
  });

  it('returns null for unknown columns', () => {
    const result = guessFieldMapping(['RandomColumn', 'Unknown']);
    expect(result[0].field).toBeNull();
    expect(result[1].field).toBeNull();
  });

  it('handles case-insensitive aliases', () => {
    const result = guessFieldMapping(['TITLE', 'status', 'PUBLISH']);
    expect(result[0].field).toBe('title');
    expect(result[1].field).toBe('status');
    expect(result[2].field).toBe('date');
  });
});

// ─── importRecords ───────────────────────────────────────────

describe('importRecords', () => {
  const mapping = [
    { csvColumn: 'Title', field: 'title' as const },
    { csvColumn: 'Status', field: 'status' as const },
    { csvColumn: 'Type', field: 'type' as const },
  ];

  it('imports records with sequential IDs', () => {
    const rows = [
      { Title: 'Post 1', Status: 'Drafting', Type: 'Blog' },
      { Title: 'Post 2', Status: 'Published', Type: 'Video' },
    ];
    const result = importRecords(rows, mapping, []);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('continues IDs from existing records', () => {
    const rows = [{ Title: 'New Post', Status: 'Idea', Type: 'Blog' }];
    const result = importRecords(rows, mapping, SAMPLE_RECORDS);
    expect(result[0].id).toBe(4);
  });

  it('uses defaults for missing fields', () => {
    const rows = [{ Title: 'Only Title' }];
    const result = importRecords(rows, mapping, []);
    expect(result[0].title).toBe('Only Title');
    expect(result[0].status).toBe('Idea');
    expect(result[0].type).toBe('Blog');
    expect(result[0].featured).toBe(false);
  });

  it('parses featured as boolean', () => {
    const rows = [
      { Title: 'A', Featured: 'yes' },
      { Title: 'B', Featured: 'no' },
      { Title: 'C', Featured: 'true' },
      { Title: 'D', Featured: '1' },
      { Title: 'E', Featured: '0' },
    ];
    const m = [{ csvColumn: 'Title', field: 'title' as const }, { csvColumn: 'Featured', field: 'featured' as const }];
    const result = importRecords(rows, m, []);
    expect(result[0].featured).toBe(true);
    expect(result[1].featured).toBe(false);
    expect(result[2].featured).toBe(true);
    expect(result[3].featured).toBe(true);
    expect(result[4].featured).toBe(false);
  });

  it('parses word count with commas', () => {
    const rows = [{ Title: 'A', Words: '2,500' }];
    const m = [{ csvColumn: 'Title', field: 'title' as const }, { csvColumn: 'Words', field: 'words' as const }];
    const result = importRecords(rows, m, []);
    expect(result[0].words).toBe(2500);
  });
});

// ─── toCSV ───────────────────────────────────────────────────

describe('toCSV', () => {
  it('generates CSV with headers', () => {
    const csv = toCSV(SAMPLE_RECORDS);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Title,Status,Type,Assignee,Publish Date,Word Count,Featured,Notes');
  });

  it('exports records with correct values', () => {
    const csv = toCSV(SAMPLE_RECORDS);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('Getting Started with React');
    expect(lines[1]).toContain('Published');
    expect(lines[1]).toContain('Blog');
    expect(lines[1]).toContain('Sarah Chen');
    expect(lines[1]).toContain('Yes');
  });

  it('handles commas in values by quoting', () => {
    const records: ContentRecord[] = [
      {
        id: 1,
        title: 'Post, with comma',
        status: 'Idea',
        type: 'Blog',
        assignee: 0,
        date: '2024-01-01',
        words: 100,
        featured: false,
        notes: '',
      },
    ];
    const csv = toCSV(records);
    expect(csv).toContain('"Post, with comma"');
  });

  it('handles newlines in notes by quoting', () => {
    const records: ContentRecord[] = [
      {
        id: 1,
        title: 'Post',
        status: 'Idea',
        type: 'Blog',
        assignee: 0,
        date: '2024-01-01',
        words: 100,
        featured: false,
        notes: 'Line 1\nLine 2',
      },
    ];
    const csv = toCSV(records);
    expect(csv).toContain('"Line 1\nLine 2"');
  });

  it('exports featured as Yes/No', () => {
    const csv = toCSV(SAMPLE_RECORDS);
    expect(csv).toContain(',Yes,');
    expect(csv).toContain(',No,');
  });

  it('exports correct number of rows', () => {
    const csv = toCSV(SAMPLE_RECORDS);
    const lines = csv.split('\n').filter((l) => l.trim());
    expect(lines).toHaveLength(SAMPLE_RECORDS.length + 1);
  });
});

// ─── toJSON ──────────────────────────────────────────────────

describe('toJSON', () => {
  it('generates valid JSON', () => {
    const json = toJSON(SAMPLE_RECORDS);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(SAMPLE_RECORDS.length);
  });

  it('exports correct field values', () => {
    const json = toJSON(SAMPLE_RECORDS);
    const parsed = JSON.parse(json);
    expect(parsed[0].title).toBe('Getting Started with React');
    expect(parsed[0].status).toBe('Published');
    expect(parsed[0].assignee).toBe('Sarah Chen');
    expect(parsed[0].featured).toBe(true);
  });

  it('handles empty records', () => {
    const json = toJSON([]);
    expect(JSON.parse(json)).toEqual([]);
  });
});
