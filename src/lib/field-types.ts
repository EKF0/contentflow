import { z } from 'zod';

// ─── Config Schemas ──────────────────────────────────────────────────────────

export const textConfigSchema = z.object({
  maxLength: z.number().int().positive().optional(),
  placeholder: z.string().optional(),
});

export const longTextConfigSchema = z.object({
  maxLength: z.number().int().positive().optional(),
  placeholder: z.string().optional(),
});

export const numberConfigSchema = z.object({
  format: z.enum(['integer', 'decimal', 'currency', 'percent']).default('integer'),
  decimalPlaces: z.number().int().min(0).max(10).default(0),
  currency: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

export const selectConfigSchema = z.object({
  allowCustom: z.boolean().default(false),
});

export const multiSelectConfigSchema = z.object({
  allowCustom: z.boolean().default(false),
  maxSelections: z.number().int().positive().optional(),
});

export const dateConfigSchema = z.object({
  format: z.enum(['date', 'datetime', 'time']).default('date'),
  includeTime: z.boolean().default(false),
});

export const dateRangeConfigSchema = z.object({
  format: z.enum(['date', 'datetime']).default('date'),
});

export const checkboxConfigSchema = z.object({
  defaultValue: z.boolean().default(false),
});

export const collaboratorConfigSchema = z.object({
  multiple: z.boolean().default(false),
});

export const urlConfigSchema = z.object({
  requireProtocol: z.boolean().default(true),
  allowedProtocols: z.array(z.string()).default(['http', 'https']),
});

export const emailConfigSchema = z.object({
  allowMultiple: z.boolean().default(false),
});

export const phoneConfigSchema = z.object({
  format: z.enum(['national', 'international', 'e164']).default('national'),
});

export const attachmentConfigSchema = z.object({
  maxFiles: z.number().int().positive().default(5),
  allowedTypes: z.array(z.string()).optional(),
});

export const formulaConfigSchema = z.object({
  expression: z.string().default(''),
  referencedFields: z.array(z.string()).default([]),
});

// ─── Value Validation Schemas ────────────────────────────────────────────────

export const textValueSchema = z.string();
export const longTextValueSchema = z.string();
export const numberValueSchema = z.number();
export const selectValueSchema = z.string();
export const multiSelectValueSchema = z.array(z.string());
export const dateValueSchema = z.string().datetime().or(z.string().date());
export const dateRangeValueSchema = z.object({
  start: z.string(),
  end: z.string(),
});
export const checkboxValueSchema = z.boolean();
export const collaboratorValueSchema = z.array(z.string());
export const urlValueSchema = z.string().url();
export const emailValueSchema = z.string().email();
export const phoneValueSchema = z.string();
export const attachmentValueSchema = z.array(z.string());
export const formulaValueSchema = z.union([z.string(), z.number(), z.boolean()]);

// ─── Type Definitions ────────────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'date_range'
  | 'checkbox'
  | 'collaborator'
  | 'url'
  | 'email'
  | 'phone'
  | 'attachment'
  | 'formula';

export interface FieldTypeInfo {
  id: FieldType;
  label: string;
  description: string;
  icon: string;
  category: 'basic' | 'advanced' | 'computed';
  configSchema: z.ZodSchema;
  defaultValue: () => unknown;
  validate: (value: unknown, config?: Record<string, unknown>) => boolean;
  formatValue: (value: unknown, config?: Record<string, unknown>) => string;
  parseValue: (raw: string) => unknown;
}

// ─── Field Type Registry ─────────────────────────────────────────────────────

export const FIELD_TYPES: Record<FieldType, FieldTypeInfo> = {
  text: {
    id: 'text',
    label: 'Text',
    description: 'Single line text',
    icon: 'Type',
    category: 'basic',
    configSchema: textConfigSchema,
    defaultValue: () => '',
    validate: (value, config) => {
      if (value === '' || value === null || value === undefined) return true;
      const maxLen = (config as any)?.maxLength;
      return typeof value === 'string' && (!maxLen || value.length <= maxLen);
    },
    formatValue: (value) => String(value ?? ''),
    parseValue: (raw) => raw,
  },
  long_text: {
    id: 'long_text',
    label: 'Long Text',
    description: 'Multi-line text with formatting',
    icon: 'AlignLeft',
    category: 'basic',
    configSchema: longTextConfigSchema,
    defaultValue: () => '',
    validate: (value) => {
      if (value === '' || value === null || value === undefined) return true;
      return typeof value === 'string';
    },
    formatValue: (value) => String(value ?? ''),
    parseValue: (raw) => raw,
  },
  number: {
    id: 'number',
    label: 'Number',
    description: 'Integer or decimal number',
    icon: 'Hash',
    category: 'basic',
    configSchema: numberConfigSchema,
    defaultValue: () => 0,
    validate: (value, config) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'number') return false;
      const format = (config as any)?.format;
      if (format === 'integer') return Number.isInteger(value);
      return true;
    },
    formatValue: (value, config) => {
      const num = Number(value);
      if (isNaN(num)) return '';
      const format = (config as any)?.format;
      const decimalPlaces = (config as any)?.decimalPlaces ?? 0;
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: (config as any)?.currency ?? 'USD',
          }).format(num);
        case 'percent':
          return `${(num * 100).toFixed(decimalPlaces)}%`;
        case 'decimal':
          return num.toFixed(decimalPlaces);
        default:
          return num.toLocaleString();
      }
    },
    parseValue: (raw) => {
      const num = Number(raw);
      return isNaN(num) ? 0 : num;
    },
  },
  select: {
    id: 'select',
    label: 'Select',
    description: 'Single selection from options',
    icon: 'ChevronDown',
    category: 'basic',
    configSchema: selectConfigSchema,
    defaultValue: () => null,
    validate: () => true,
    formatValue: (value) => String(value ?? ''),
    parseValue: (raw) => raw || null,
  },
  multi_select: {
    id: 'multi_select',
    label: 'Multi-Select',
    description: 'Multiple selections from options',
    icon: 'ListChecks',
    category: 'basic',
    configSchema: multiSelectConfigSchema,
    defaultValue: () => [],
    validate: (value, config) => {
      if (!Array.isArray(value)) return false;
      const max = (config as any)?.maxSelections;
      return !max || value.length <= max;
    },
    formatValue: (value) => {
      if (!Array.isArray(value)) return '';
      return value.join(', ');
    },
    parseValue: (raw) => {
      if (!raw) return [];
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    },
  },
  date: {
    id: 'date',
    label: 'Date',
    description: 'Date picker',
    icon: 'Calendar',
    category: 'basic',
    configSchema: dateConfigSchema,
    defaultValue: () => null,
    validate: (value) => {
      if (value === null || value === undefined) return true;
      return typeof value === 'string' && !isNaN(Date.parse(value));
    },
    formatValue: (value, config) => {
      if (!value) return '';
      const date = new Date(String(value));
      const format = (config as any)?.format;
      if (format === 'datetime') {
        return date.toLocaleString();
      }
      return date.toLocaleDateString();
    },
    parseValue: (raw) => raw || null,
  },
  date_range: {
    id: 'date_range',
    label: 'Date Range',
    description: 'Start and end date',
    icon: 'CalendarRange',
    category: 'advanced',
    configSchema: dateRangeConfigSchema,
    defaultValue: () => ({ start: '', end: '' }),
    validate: (value) => {
      if (!value || typeof value !== 'object') return true;
      const range = value as { start?: string; end?: string };
      if (range.start && isNaN(Date.parse(range.start))) return false;
      if (range.end && isNaN(Date.parse(range.end))) return false;
      return true;
    },
    formatValue: (value) => {
      if (!value || typeof value !== 'object') return '';
      const range = value as { start?: string; end?: string };
      if (range.start && range.end) {
        return `${new Date(range.start).toLocaleDateString()} - ${new Date(range.end).toLocaleDateString()}`;
      }
      if (range.start) return new Date(range.start).toLocaleDateString();
      if (range.end) return new Date(range.end).toLocaleDateString();
      return '';
    },
    parseValue: (raw) => {
      if (!raw) return { start: '', end: '' };
      try {
        return JSON.parse(raw);
      } catch {
        return { start: '', end: '' };
      }
    },
  },
  checkbox: {
    id: 'checkbox',
    label: 'Checkbox',
    description: 'Boolean toggle',
    icon: 'CheckSquare',
    category: 'basic',
    configSchema: checkboxConfigSchema,
    defaultValue: () => false,
    validate: (value) => typeof value === 'boolean' || value === null,
    formatValue: (value) => (value ? 'Yes' : 'No'),
    parseValue: (raw) => raw === 'true' || raw === '1',
  },
  collaborator: {
    id: 'collaborator',
    label: 'Collaborator',
    description: 'Reference to team members',
    icon: 'Users',
    category: 'advanced',
    configSchema: collaboratorConfigSchema,
    defaultValue: () => [],
    validate: (value) => Array.isArray(value) || value === null,
    formatValue: (value) => {
      if (!Array.isArray(value)) return '';
      return `${value.length} collaborator${value.length !== 1 ? 's' : ''}`;
    },
    parseValue: (raw) => {
      if (!raw) return [];
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    },
  },
  url: {
    id: 'url',
    label: 'URL',
    description: 'Web address with validation',
    icon: 'Link',
    category: 'advanced',
    configSchema: urlConfigSchema,
    defaultValue: () => '',
    validate: (value, config) => {
      if (!value || value === '') return true;
      const str = String(value);
      const requireProtocol = (config as any)?.requireProtocol !== false;
      if (requireProtocol) {
        return /^https?:\/\/.+\..+/.test(str);
      }
      return /.+\..+/.test(str);
    },
    formatValue: (value) => String(value ?? ''),
    parseValue: (raw) => raw,
  },
  email: {
    id: 'email',
    label: 'Email',
    description: 'Email address',
    icon: 'Mail',
    category: 'advanced',
    configSchema: emailConfigSchema,
    defaultValue: () => '',
    validate: (value) => {
      if (!value || value === '') return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
    },
    formatValue: (value) => String(value ?? ''),
    parseValue: (raw) => raw,
  },
  phone: {
    id: 'phone',
    label: 'Phone',
    description: 'Phone number',
    icon: 'Phone',
    category: 'advanced',
    configSchema: phoneConfigSchema,
    defaultValue: () => '',
    validate: (value) => {
      if (!value || value === '') return true;
      const cleaned = String(value).replace(/[\s\-\(\)\+]/g, '');
      return /^\d{7,15}$/.test(cleaned);
    },
    formatValue: (value, config) => {
      if (!value) return '';
      const format = (config as any)?.format;
      const str = String(value);
      if (format === 'e164') {
        return str.replace(/[^\d+]/g, '');
      }
      return str;
    },
    parseValue: (raw) => raw,
  },
  attachment: {
    id: 'attachment',
    label: 'Attachment',
    description: 'File upload',
    icon: 'Paperclip',
    category: 'advanced',
    configSchema: attachmentConfigSchema,
    defaultValue: () => [],
    validate: (value, config) => {
      if (!Array.isArray(value)) return value === null;
      const max = (config as any)?.maxFiles ?? 5;
      return value.length <= max;
    },
    formatValue: (value) => {
      if (!Array.isArray(value)) return '';
      return `${value.length} file${value.length !== 1 ? 's' : ''}`;
    },
    parseValue: (raw) => {
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
  },
  formula: {
    id: 'formula',
    label: 'Formula',
    description: 'Calculated value from expression',
    icon: 'Calculator',
    category: 'computed',
    configSchema: formulaConfigSchema,
    defaultValue: () => '',
    validate: () => true,
    formatValue: (value) => String(value ?? ''),
    parseValue: (raw) => raw,
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getFieldType(typeId: string): FieldTypeInfo | undefined {
  return FIELD_TYPES[typeId as FieldType];
}

export function getDefaultConfig(typeId: string): Record<string, unknown> {
  const fieldType = getFieldType(typeId);
  if (!fieldType) return {};

  const schema = fieldType.configSchema as z.ZodObject<any>;
  return schema?.shape ? schema.shape : {};
}

export function validateFieldValue(
  typeId: string,
  value: unknown,
  config?: Record<string, unknown>
): boolean {
  const fieldType = getFieldType(typeId);
  if (!fieldType) return false;
  return fieldType.validate(value, config);
}

export function formatFieldValue(
  typeId: string,
  value: unknown,
  config?: Record<string, unknown>
): string {
  const fieldType = getFieldType(typeId);
  if (!fieldType) return String(value ?? '');
  return fieldType.formatValue(value, config);
}

export function parseFieldValue(typeId: string, raw: string): unknown {
  const fieldType = getFieldType(typeId);
  if (!fieldType) return raw;
  return fieldType.parseValue(raw);
}

export function getFieldTypesByCategory(): Record<string, FieldTypeInfo[]> {
  const result: Record<string, FieldTypeInfo[]> = {
    basic: [],
    advanced: [],
    computed: [],
  };

  for (const ft of Object.values(FIELD_TYPES)) {
    result[ft.category].push(ft);
  }

  return result;
}
