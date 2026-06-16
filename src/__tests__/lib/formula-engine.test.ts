import { describe, it, expect } from 'vitest';
import {
  evaluateFormula,
  validateFormula,
  extractFieldRefs,
  type FormulaContext,
} from '@/lib/formula-engine';

function makeCtx(overrides?: Partial<FormulaContext>): FormulaContext {
  return {
    recordId: 'rec-1',
    tableId: 'tbl-1',
    fields: [
      { id: 'f1', name: 'Title', type: 'text', config: {} },
      { id: 'f2', name: 'Words', type: 'number', config: {} },
      { id: 'f3', name: 'Status', type: 'select', config: {} },
      { id: 'f4', name: 'Budget', type: 'number', config: {} },
      { id: 'f5', name: 'Notes', type: 'text', config: {} },
    ],
    cellValues: [
      { fieldId: 'f1', value: 'Hello World' },
      { fieldId: 'f2', value: 1500 },
      { fieldId: 'f3', value: 'Published' },
      { fieldId: 'f4', value: 99.5 },
      { fieldId: 'f5', value: '' },
    ],
    ...overrides,
  };
}

// ─── validateFormula ────────────────────────────────────────

describe('validateFormula', () => {
  it('returns error for empty expression', () => {
    expect(validateFormula('')).toEqual({ message: 'Expression is empty' });
    expect(validateFormula('  ')).toEqual({ message: 'Expression is empty' });
  });

  it('returns null for valid expressions', () => {
    expect(validateFormula('SUM(1, 2)')).toBeNull();
    expect(validateFormula('{Title}')).toBeNull();
    expect(validateFormula('IF(1 > 0, "yes", "no")')).toBeNull();
    expect(validateFormula('"hello"')).toBeNull();
    expect(validateFormula('42 + 3')).toBeNull();
  });

  it('catches unmatched closing parenthesis', () => {
    const result = validateFormula('SUM(1, 2))');
    expect(result?.message).toBe('Unmatched closing parenthesis');
  });

  it('catches unmatched opening parenthesis', () => {
    const result = validateFormula('SUM(1, 2');
    expect(result?.message).toBe('Unmatched opening parenthesis');
  });

  it('handles valid nested parentheses in functions', () => {
    expect(validateFormula('CONCAT(UPPER("foo"), "bar")')).toBeNull();
  });

  it('catches unterminated string literal', () => {
    const result = validateFormula('CONCAT("hello, "world")');
    expect(result?.message).toBe('Unterminated string literal');
  });
});

// ─── extractFieldRefs ───────────────────────────────────────

describe('extractFieldRefs', () => {
  it('extracts field references from expression', () => {
    expect(extractFieldRefs('{Title} + {Words}')).toEqual(['Title', 'Words']);
  });

  it('deduplicates references', () => {
    expect(extractFieldRefs('{Title} + {Title}')).toEqual(['Title']);
  });

  it('returns empty array for no references', () => {
    expect(extractFieldRefs('1 + 2')).toEqual([]);
  });

  it('handles nested references in function args', () => {
    expect(extractFieldRefs('CONCAT({Title}, " - ", {Status})')).toEqual(['Title', 'Status']);
  });
});

// ─── evaluateFormula: arithmetic ─────────────────────────────

describe('evaluateFormula arithmetic', () => {
  const ctx = makeCtx();

  it('evaluates addition', () => {
    expect(evaluateFormula('1 + 2', ctx)).toEqual({ value: '3' });
  });

  it('evaluates subtraction', () => {
    expect(evaluateFormula('10 - 3', ctx)).toEqual({ value: '7' });
  });

  it('evaluates multiplication', () => {
    expect(evaluateFormula('4 * 5', ctx)).toEqual({ value: '20' });
  });

  it('evaluates division', () => {
    expect(evaluateFormula('10 / 2', ctx)).toEqual({ value: '5' });
  });

  it('evaluates division by zero as 0', () => {
    expect(evaluateFormula('10 / 0', ctx)).toEqual({ value: '0' });
  });

  it('evaluates modulo', () => {
    expect(evaluateFormula('10 % 3', ctx)).toEqual({ value: '1' });
  });

  it('evaluates with field references', () => {
    expect(evaluateFormula('{Words} + 500', ctx)).toEqual({ value: '2000' });
  });
});

// ─── evaluateFormula: functions ──────────────────────────────

describe('evaluateFormula functions', () => {
  const ctx = makeCtx();

  describe('SUM', () => {
    it('sums numbers', () => {
      expect(evaluateFormula('SUM(1, 2, 3)', ctx)).toEqual({ value: '6' });
    });

    it('sums with mixed types', () => {
      expect(evaluateFormula('SUM(1, "2", TRUE)', ctx)).toEqual({ value: '4' });
    });

    it('sums field references', () => {
      expect(evaluateFormula('SUM({Words}, 500)', ctx, 'number')).toEqual({ value: 2000 });
    });
  });

  describe('COUNT', () => {
    it('counts non-empty arguments', () => {
      // null literal is treated as string "null" (non-empty) by the engine
      expect(evaluateFormula('COUNT(1, "hello", "")', ctx)).toEqual({ value: '2' });
    });

    it('counts array length via linked record dot notation', () => {
      const arrCtx = makeCtx({
        fields: [
          ...makeCtx().fields,
          { id: 'f6', name: 'Name', type: 'text', config: {} },
        ],
        linkedRecords: [
          { recordId: 'r1', fieldName: 'Tag', record: { id: 'r1', title: 'T1', cellValues: [{ fieldId: 'f6', value: 'X' }] } },
          { recordId: 'r2', fieldName: 'Tag', record: { id: 'r2', title: 'T2', cellValues: [{ fieldId: 'f6', value: 'Y' }] } },
        ],
      });
      expect(evaluateFormula('COUNT({Tag.Name})', arrCtx)).toEqual({ value: '2' });
    });
  });

  describe('IF', () => {
    it('returns true value when condition is true', () => {
      expect(evaluateFormula('IF(TRUE, "yes", "no")', ctx)).toEqual({ value: 'yes' });
    });

    it('returns false value when condition is false', () => {
      expect(evaluateFormula('IF(FALSE, "yes", "no")', ctx)).toEqual({ value: 'no' });
    });

    it('evaluates comparison in condition', () => {
      expect(evaluateFormula('IF({Words} > 1000, "Long", "Short")', ctx)).toEqual({ value: 'Long' });
    });

    it('returns empty string for false with no false arg', () => {
      expect(evaluateFormula('IF(FALSE, "yes")', ctx)).toEqual({ value: '' });
    });
  });

  describe('CONCAT', () => {
    it('concatenates strings', () => {
      expect(evaluateFormula('CONCAT("hello", " ", "world")', ctx)).toEqual({ value: 'hello world' });
    });

    it('concatenates field references', () => {
      expect(evaluateFormula('CONCAT({Title}, " by ", {Status})', ctx)).toEqual({ value: 'Hello World by Published' });
    });
  });

  describe('DATE_DIFF', () => {
    it('calculates days between dates', () => {
      const result = evaluateFormula('DATE_DIFF("2024-01-01", "2024-01-10", "days")', ctx, 'number');
      expect(result.value).toBe(9);
    });

    it('calculates months (floor of 30.44-day unit)', () => {
      // Jan 1 → Apr 1 = 91 days; 91/30.44 = 2.99 → floor 2
      const result = evaluateFormula('DATE_DIFF("2024-01-01", "2024-04-01", "months")', ctx, 'number');
      expect(result.value).toBe(2);
    });

    it('returns 0 for invalid dates', () => {
      const result = evaluateFormula('DATE_DIFF("invalid", "2024-01-01", "days")', ctx, 'number');
      expect(result.value).toBe(0);
    });
  });

  describe('ROUND', () => {
    it('rounds to specified decimals', () => {
      expect(evaluateFormula('ROUND(3.14159, 2)', ctx)).toEqual({ value: '3.14' });
    });

    it('rounds to integer', () => {
      expect(evaluateFormula('ROUND(3.7, 0)', ctx)).toEqual({ value: '4' });
    });

    it('rounds field value', () => {
      expect(evaluateFormula('ROUND({Budget}, 0)', ctx, 'number')).toEqual({ value: 100 });
    });
  });

  describe('string functions', () => {
    it('UPPER converts to uppercase', () => {
      expect(evaluateFormula('UPPER("hello")', ctx)).toEqual({ value: 'HELLO' });
    });

    it('LOWER converts to lowercase', () => {
      expect(evaluateFormula('LOWER("HELLO")', ctx)).toEqual({ value: 'hello' });
    });

    it('LEN returns string length', () => {
      expect(evaluateFormula('LEN("hello")', ctx, 'number')).toEqual({ value: 5 });
    });

    it('TRIM removes whitespace', () => {
      expect(evaluateFormula('TRIM("  hello  ")', ctx)).toEqual({ value: 'hello' });
    });

    it('LEFT returns left substring', () => {
      expect(evaluateFormula('LEFT("hello", 3)', ctx)).toEqual({ value: 'hel' });
    });

    it('RIGHT returns right substring', () => {
      expect(evaluateFormula('RIGHT("hello", 3)', ctx)).toEqual({ value: 'llo' });
    });

    it('MID returns middle substring', () => {
      expect(evaluateFormula('MID("hello", 1, 3)', ctx)).toEqual({ value: 'ell' });
    });
  });

  describe('MIN/MAX/ABS', () => {
    it('MIN returns minimum', () => {
      expect(evaluateFormula('MIN(5, 3, 8)', ctx)).toEqual({ value: '3' });
    });

    it('MAX returns maximum', () => {
      expect(evaluateFormula('MAX(5, 3, 8)', ctx)).toEqual({ value: '8' });
    });

    it('ABS returns absolute value', () => {
      expect(evaluateFormula('ABS(-42)', ctx, 'number')).toEqual({ value: 42 });
    });
  });

  describe('logic functions', () => {
    it('AND returns true when all args true', () => {
      expect(evaluateFormula('AND(TRUE, TRUE)', ctx)).toEqual({ value: 'true' });
    });

    it('AND returns false when any arg false', () => {
      expect(evaluateFormula('AND(TRUE, FALSE)', ctx)).toEqual({ value: 'false' });
    });

    it('OR returns true when any arg true', () => {
      expect(evaluateFormula('OR(FALSE, TRUE)', ctx)).toEqual({ value: 'true' });
    });

    it('OR returns false when all args false', () => {
      expect(evaluateFormula('OR(FALSE, FALSE)', ctx)).toEqual({ value: 'false' });
    });

    it('NOT inverts value', () => {
      expect(evaluateFormula('NOT(TRUE)', ctx)).toEqual({ value: 'false' });
      expect(evaluateFormula('NOT(FALSE)', ctx)).toEqual({ value: 'true' });
    });
  });

  describe('NOW/TODAY', () => {
    it('NOW returns ISO date string', () => {
      const result = evaluateFormula('NOW()', ctx);
      expect(typeof result.value).toBe('string');
      expect(new Date(result.value as string).getTime()).not.toBeNaN();
    });

    it('TODAY returns YYYY-MM-DD string', () => {
      const result = evaluateFormula('TODAY()', ctx);
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('unknown function', () => {
    it('returns error for unknown function', () => {
      const result = evaluateFormula('FOOBAR(1)', ctx);
      expect(result.error).toBe('Unknown function: FOOBAR');
      expect(result.value).toBeNull();
    });
  });
});

// ─── evaluateFormula: field references ───────────────────────

describe('evaluateFormula field references', () => {
  const ctx = makeCtx();

  it('resolves single field reference', () => {
    expect(evaluateFormula('{Title}', ctx)).toEqual({ value: 'Hello World' });
  });

  it('resolves numeric field', () => {
    expect(evaluateFormula('{Words}', ctx, 'number')).toEqual({ value: 1500 });
  });

  it('returns empty string for missing field', () => {
    expect(evaluateFormula('{NonExistent}', ctx)).toEqual({ value: '' });
  });
});

// ─── evaluateFormula: nested functions ───────────────────────

describe('evaluateFormula nested functions', () => {
  const ctx = makeCtx();

  it('handles nested SUM inside IF', () => {
    expect(evaluateFormula('IF(TRUE, SUM(1, 2), 0)', ctx)).toEqual({ value: '3' });
  });

  it('handles CONCAT with UPPER', () => {
    expect(evaluateFormula('CONCAT(UPPER("hello"), " world")', ctx)).toEqual({ value: 'HELLO world' });
  });

  it('handles nested arithmetic in function', () => {
    expect(evaluateFormula('SUM(1 + 2, 3 * 4)', ctx, 'number')).toEqual({ value: 15 });
  });
});

// ─── evaluateFormula: return types ───────────────────────────

describe('evaluateFormula return types', () => {
  const ctx = makeCtx();

  it('returns string for text type', () => {
    expect(evaluateFormula('42', ctx, 'text')).toEqual({ value: '42' });
  });

  it('returns number for number type', () => {
    expect(evaluateFormula('42', ctx, 'number')).toEqual({ value: 42 });
  });

  it('returns date string for date type', () => {
    const result = evaluateFormula('"2024-01-15"', ctx, 'date');
    expect(result.value).toBe('2024-01-15');
  });

  it('returns empty string for invalid date type', () => {
    expect(evaluateFormula('"not-a-date"', ctx, 'date')).toEqual({ value: '' });
  });
});

// ─── evaluateFormula: edge cases ─────────────────────────────

describe('evaluateFormula edge cases', () => {
  const ctx = makeCtx();

  it('returns raw string for unknown expression', () => {
    expect(evaluateFormula('something', ctx)).toEqual({ value: 'something' });
  });

  it('handles empty string literal', () => {
    expect(evaluateFormula('""', ctx)).toEqual({ value: '' });
  });

  it('handles single-quoted string', () => {
    expect(evaluateFormula("'hello'", ctx)).toEqual({ value: 'hello' });
  });

  it('handles boolean literals', () => {
    expect(evaluateFormula('TRUE', ctx)).toEqual({ value: 'true' });
    expect(evaluateFormula('FALSE', ctx)).toEqual({ value: 'false' });
  });

  it('handles negative numbers', () => {
    expect(evaluateFormula('-5', ctx, 'number')).toEqual({ value: -5 });
  });

  it('handles decimal numbers', () => {
    expect(evaluateFormula('3.14', ctx, 'number')).toEqual({ value: 3.14 });
  });
});
