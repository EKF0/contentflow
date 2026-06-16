import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  records,
  cellValues,
  fields,
  tables,
  workspaceMembers,
} from '@/lib/db/schema';
import {
  evaluateFormula,
  validateFormula,
  extractFieldRefs,
  type FormulaContext,
  type FormulaReturnType,
} from '@/lib/formula-engine';

async function assertWorkspaceMember(db: any, userId: string, workspaceId: string) {
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);

  if (!membership) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return membership;
}

async function buildFormulaContext(
  db: any,
  recordId: string,
  expression: string
): Promise<FormulaContext> {
  const [record] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);

  if (!record) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  const tableFields = await db
    .select()
    .from(fields)
    .where(eq(fields.tableId, record.tableId))
    .orderBy(fields.sortOrder);

  const cells = await db
    .select()
    .from(cellValues)
    .where(eq(cellValues.recordId, recordId));

  const refs = extractFieldRefs(expression);
  const linkRefs = refs.filter((r) => r.includes('.'));

  return {
    recordId: record.id,
    tableId: record.tableId,
    fields: tableFields.map((f: any) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      config: (f.config as Record<string, unknown>) ?? {},
    })),
    cellValues: cells.map((c: any) => ({
      fieldId: c.fieldId,
      value: c.value,
    })),
    linkedRecords: [],
  };
}

export const formulaRouter = router({
  validate: protectedProcedure
    .input(z.object({ expression: z.string() }))
    .query(({ input }) => {
      const error = validateFormula(input.expression);
      return {
        valid: !error,
        error: error?.message ?? null,
        fields: extractFieldRefs(input.expression),
      };
    }),

  preview: protectedProcedure
    .input(
      z.object({
        recordId: z.string(),
        expression: z.string(),
        returnType: z.enum(['text', 'number', 'date']).default('text'),
      })
    )
    .query(async ({ ctx, input }) => {
      const error = validateFormula(input.expression);
      if (error) {
        return { value: null, error: error.message };
      }

      const context = await buildFormulaContext(ctx.db, input.recordId, input.expression);
      return evaluateFormula(input.expression, context, input.returnType as FormulaReturnType);
    }),

  evaluate: protectedProcedure
    .input(
      z.object({
        recordId: z.string(),
        expression: z.string(),
        returnType: z.enum(['text', 'number', 'date']).default('text'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const error = validateFormula(input.expression);
      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid formula: ${error.message}`,
        });
      }

      const context = await buildFormulaContext(ctx.db, input.recordId, input.expression);
      const result = evaluateFormula(input.expression, context, input.returnType as FormulaReturnType);

      if (result.error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Formula evaluation failed: ${result.error}`,
        });
      }

      return result;
    }),

  listFunctions: protectedProcedure.query(() => {
    return [
      { name: 'SUM', description: 'Sum of numeric values', syntax: 'SUM(field1, field2, ...)' },
      { name: 'COUNT', description: 'Count of items', syntax: 'COUNT(linkedRecords)' },
      { name: 'IF', description: 'Conditional value', syntax: 'IF(condition, trueValue, falseValue)' },
      { name: 'CONCAT', description: 'Concatenate strings', syntax: 'CONCAT(field1, field2, ...)' },
      { name: 'DATE_DIFF', description: 'Difference between dates', syntax: 'DATE_DIFF(date1, date2, unit)' },
      { name: 'ROUND', description: 'Round number', syntax: 'ROUND(number, decimals)' },
      { name: 'UPPER', description: 'Convert to uppercase', syntax: 'UPPER(text)' },
      { name: 'LOWER', description: 'Convert to lowercase', syntax: 'LOWER(text)' },
      { name: 'MIN', description: 'Minimum value', syntax: 'MIN(val1, val2, ...)' },
      { name: 'MAX', description: 'Maximum value', syntax: 'MAX(val1, val2, ...)' },
      { name: 'ABS', description: 'Absolute value', syntax: 'ABS(number)' },
      { name: 'LEN', description: 'String length', syntax: 'LEN(text)' },
      { name: 'TRIM', description: 'Remove whitespace', syntax: 'TRIM(text)' },
      { name: 'LEFT', description: 'Left substring', syntax: 'LEFT(text, count)' },
      { name: 'RIGHT', description: 'Right substring', syntax: 'RIGHT(text, count)' },
      { name: 'MID', description: 'Middle substring', syntax: 'MID(text, start, count)' },
      { name: 'AND', description: 'Logical AND', syntax: 'AND(cond1, cond2, ...)' },
      { name: 'OR', description: 'Logical OR', syntax: 'OR(cond1, cond2, ...)' },
      { name: 'NOT', description: 'Logical NOT', syntax: 'NOT(condition)' },
      { name: 'NOW', description: 'Current datetime', syntax: 'NOW()' },
      { name: 'TODAY', description: 'Current date', syntax: 'TODAY()' },
    ];
  }),
});
