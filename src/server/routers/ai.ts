import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  generateTitles,
  generateOutline,
  generateTags,
  generateSocialSnippets,
  rewriteText,
  expandText,
  summarizeText,
  suggestSEO,
  improveWriting,
  collectStreamToString,
} from '@/lib/openai';

export const aiRouter = router({
  generateTitles: protectedProcedure
    .input(z.object({ topic: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const { stream } = await generateTitles(input.topic);
        const raw = await collectStreamToString(stream);
        const titles = JSON.parse(raw) as string[];
        return { titles };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to generate titles',
        );
      }
    }),

  generateOutline: protectedProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const { stream } = await generateOutline(input.title);
        const raw = await collectStreamToString(stream);
        const outline = JSON.parse(raw) as Array<{
          level: 'h2' | 'h3';
          text: string;
        }>;
        return { outline };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to generate outline',
        );
      }
    }),

  generateTags: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { stream } = await generateTags(input.title, input.content);
        const raw = await collectStreamToString(stream);
        const tags = JSON.parse(raw) as string[];
        return { tags };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to generate tags',
        );
      }
    }),

  generateSocialSnippets: protectedProcedure
    .input(z.object({ content: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const { stream } = await generateSocialSnippets(input.content);
        const raw = await collectStreamToString(stream);
        const snippets = JSON.parse(raw) as {
          twitter: string;
          linkedin: string;
          instagram: string;
        };
        return { snippets };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Failed to generate social snippets',
        );
      }
    }),

  rewrite: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        tone: z.enum(['formal', 'casual', 'concise', 'professional']),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { stream } = await rewriteText(input.text, input.tone);
        const result = await collectStreamToString(stream);
        return { result };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to rewrite text',
        );
      }
    }),

  expand: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const { stream } = await expandText(input.text);
        const result = await collectStreamToString(stream);
        return { result };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to expand text',
        );
      }
    }),

  summarize: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        maxLength: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { stream } = await summarizeText(input.text, input.maxLength);
        const result = await collectStreamToString(stream);
        return { result };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to summarize text',
        );
      }
    }),

  suggestSEO: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { stream } = await suggestSEO(input.title, input.content);
        const raw = await collectStreamToString(stream);
        const seo = JSON.parse(raw) as {
          keywords: string[];
          metaDescription: string;
          suggestions: string[];
        };
        return { seo };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to generate SEO suggestions',
        );
      }
    }),

  improve: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const { stream } = await improveWriting(input.text);
        const result = await collectStreamToString(stream);
        return { result };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to improve writing',
        );
      }
    }),
});
