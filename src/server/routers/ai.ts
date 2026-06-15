import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  generateTitles,
  generateOutline,
  generateTags,
  generateSocialSnippets,
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
});
