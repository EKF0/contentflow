import { z } from 'zod';

export const formulaExpressionSchema = z.string().min(1);

export type FormulaReturnType = 'text' | 'number' | 'date';

export interface FormulaContext {
  recordId: string;
  tableId: string;
  fields: Array<{ id: string; name: string; type: string; config: Record<string, unknown> }>;
  cellValues: Array<{ fieldId: string; value: unknown }>;
  linkedRecords?: Array<{
    recordId: string;
    fieldName: string;
    record: { id: string; title: string; cellValues: Array<{ fieldId: string; value: unknown }> };
  }>;
}

interface FormulaError {
  message: string;
  position?: number;
}

export function validateFormula(expression: string): FormulaError | null {
  if (!expression.trim()) {
    return { message: 'Expression is empty' };
  }

  let depth = 0;
  let inString = false;
  let stringChar = '';
  let i = 0;

  while (i < expression.length) {
    const ch = expression[i];

    if (inString) {
      if (ch === stringChar && expression[i - 1] !== '\\') {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      i++;
      continue;
    }

    if (ch === '(') depth++;
    if (ch === ')') {
      depth--;
      if (depth < 0) {
        return { message: 'Unmatched closing parenthesis', position: i };
      }
    }
    i++;
  }

  if (inString) {
    return { message: 'Unterminated string literal' };
  }

  if (depth !== 0) {
    return { message: 'Unmatched opening parenthesis' };
  }

  const funcPattern = /\b(SUM|COUNT|IF|CONCAT|DATE_DIFF|ROUND|UPPER|LOWER|MIN|MAX|ABS|LEN|TRIM|LEFT|RIGHT|MID|AND|OR|NOT|TRUE|FALSE|NOW|TODAY)\s*\(/g;
  let match;
  while ((match = funcPattern.exec(expression)) !== null) {
    const funcName = match[1];
    const parenPos = match.index + match[0].length - 1;
    if (!isValidFunctionCall(expression, parenPos)) {
      return { message: `Invalid function call: ${funcName}`, position: match.index };
    }
  }

  return null;
}

function isValidFunctionCall(expression: string, parenPos: number): boolean {
  let depth = 0;
  let i = parenPos;
  while (i < expression.length) {
    if (expression[i] === '(') depth++;
    if (expression[i] === ')') {
      depth--;
      if (depth === 0) return i === expression.length - 1 || /[\s,+\-*/<>=!&|)]/.test(expression[i + 1] ?? '');
    }
    i++;
  }
  return depth === 0;
}

export function extractFieldRefs(expression: string): string[] {
  const refs: string[] = [];
  const pattern = /\{([^}]+)\}/g;
  let match;
  while ((match = pattern.exec(expression)) !== null) {
    refs.push(match[1]);
  }
  return [...new Set(refs)];
}

function resolveFieldRef(
  ref: string,
  ctx: FormulaContext
): unknown {
  const parts = ref.split('.');

  if (parts.length === 2) {
    const [linkFieldName, targetFieldName] = parts;
    const linked = ctx.linkedRecords?.filter((l) => l.fieldName === linkFieldName) ?? [];
    if (linked.length === 0) return undefined;

    if (linked.length === 1) {
      const targetField = ctx.fields.find((f) => f.name === targetFieldName);
      if (!targetField) return undefined;
      const cell = linked[0].record.cellValues.find((c) => c.fieldId === targetField.id);
      return cell?.value;
    }

    return linked.map((l) => {
      const targetField = ctx.fields.find((f) => f.name === targetFieldName);
      if (!targetField) return undefined;
      const cell = l.record.cellValues.find((c) => c.fieldId === targetField.id);
      return cell?.value;
    });
  }

  const field = ctx.fields.find((f) => f.name === ref);
  if (!field) return undefined;
  const cell = ctx.cellValues.find((c) => c.fieldId === field.id);
  return cell?.value;
}

function toNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'string') {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }
  if (Array.isArray(val)) return val.length;
  return 0;
}

function toString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) return val.map(toString).join(', ');
  return String(val);
}

function toDate(val: unknown): Date | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function dateDiff(date1: Date, date2: Date, unit: string): number {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  switch (unit?.toLowerCase()) {
    case 'years':
      return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    case 'months':
      return Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000));
    case 'weeks':
      return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    case 'hours':
      return Math.floor(diffMs / (60 * 60 * 1000));
    case 'minutes':
      return Math.floor(diffMs / (60 * 1000));
    case 'seconds':
      return Math.floor(diffMs / 1000);
    case 'days':
    default:
      return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }
}

function evaluateExpression(expression: string, ctx: FormulaContext): unknown {
  const trimmed = expression.trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === 'TRUE') return true;
  if (trimmed === 'FALSE') return false;

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (/^\{[^}]+\}$/.test(trimmed)) {
    const ref = trimmed.slice(1, -1);
    return resolveFieldRef(ref, ctx);
  }

  const funcMatch = trimmed.match(/^(\w+)\s*\(([\s\S]*)\)$/);
  if (funcMatch) {
    const funcName = funcMatch[1].toUpperCase();
    const argsStr = funcMatch[2];
    const args = splitArgs(argsStr).map((a) => evaluateExpression(a, ctx));

    switch (funcName) {
      case 'SUM':
        return args.reduce<number>((acc, val) => acc + toNumber(val), 0);
      case 'COUNT': {
        const firstArg = args[0];
        if (Array.isArray(firstArg)) return firstArg.length;
        return args.filter((a) => a !== null && a !== undefined && a !== '').length;
      }
      case 'IF': {
        const [condition, trueVal, falseVal] = args;
        const boolVal = typeof condition === 'boolean' ? condition : !!condition;
        return boolVal ? trueVal : (falseVal ?? '');
      }
      case 'CONCAT':
        return args.map(toString).join('');
      case 'DATE_DIFF': {
        const [d1, d2, unit] = args;
        const date1 = toDate(d1);
        const date2 = toDate(d2);
        if (!date1 || !date2) return 0;
        return dateDiff(date1, date2, toString(unit));
      }
      case 'ROUND': {
        const [num, decimals] = args;
        const n = toNumber(num);
        const d = toNumber(decimals);
        return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
      }
      case 'UPPER':
        return toString(args[0]).toUpperCase();
      case 'LOWER':
        return toString(args[0]).toLowerCase();
      case 'MIN':
        return Math.min(...args.map(toNumber));
      case 'MAX':
        return Math.max(...args.map(toNumber));
      case 'ABS':
        return Math.abs(toNumber(args[0]));
      case 'LEN':
        return toString(args[0]).length;
      case 'TRIM':
        return toString(args[0]).trim();
      case 'LEFT': {
        const [str, n] = args;
        return toString(str).slice(0, toNumber(n));
      }
      case 'RIGHT': {
        const [str, n] = args;
        const s = toString(str);
        return s.slice(-toNumber(n));
      }
      case 'MID': {
        const [str, start, len] = args;
        return toString(str).slice(toNumber(start), toNumber(start) + toNumber(len));
      }
      case 'AND':
        return args.every((a) => !!a);
      case 'OR':
        return args.some((a) => !!a);
      case 'NOT':
        return !args[0];
      case 'NOW':
        return new Date().toISOString();
      case 'TODAY':
        return new Date().toISOString().split('T')[0];
      default:
        throw new Error(`Unknown function: ${funcName}`);
    }
  }

  const arithMatch = trimmed.match(/^(.+?)\s*([+\-*\/%])\s*(.+)$/);
  if (arithMatch) {
    const left = toNumber(evaluateExpression(arithMatch[1], ctx));
    const right = toNumber(evaluateExpression(arithMatch[3], ctx));
    switch (arithMatch[2]) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? left / right : 0;
      case '%': return right !== 0 ? left % right : 0;
    }
  }

  const fieldRef = trimmed.match(/^\{([^}]+)\}$/);
  if (fieldRef) {
    return resolveFieldRef(fieldRef[1], ctx);
  }

  return trimmed;
}

function splitArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];

    if (inString) {
      current += ch;
      if (ch === stringChar && argsStr[i - 1] !== '\\') {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    if (ch === '(') {
      depth++;
      current += ch;
      continue;
    }
    if (ch === ')') {
      depth--;
      current += ch;
      continue;
    }

    if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

export function evaluateFormula(
  expression: string,
  ctx: FormulaContext,
  returnType: FormulaReturnType = 'text'
): { value: unknown; error?: string } {
  try {
    const result = evaluateExpression(expression, ctx);

    switch (returnType) {
      case 'number':
        return { value: toNumber(result) };
      case 'date': {
        const d = toDate(result);
        return { value: d ? d.toISOString().split('T')[0] : '' };
      }
      case 'text':
      default:
        return { value: toString(result) };
    }
  } catch (err) {
    return {
      value: null,
      error: err instanceof Error ? err.message : 'Formula evaluation failed',
    };
  }
}

export const FORMULA_TEMPLATES = [
  { label: 'Concatenate fields', expression: 'CONCAT({Field1}, " ", {Field2})' },
  { label: 'Conditional text', expression: 'IF({Status} = "Published", "Live", "Draft")' },
  { label: 'Sum of fields', expression: '{Field1} + {Field2}' },
  { label: 'Date difference in days', expression: 'DATE_DIFF({StartDate}, {EndDate}, "days")' },
  { label: 'Word count check', expression: 'IF({Word Count} > 500, "Long", "Short")' },
  { label: 'Round number', expression: 'ROUND({Field1}, 2)' },
  { label: 'Upper case text', expression: 'UPPER({Title})' },
  { label: 'Linked record count', expression: 'COUNT({LinkedRecords})' },
];
