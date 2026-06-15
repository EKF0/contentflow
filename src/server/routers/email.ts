import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const emailRouter = router({
  sendTest: protectedProcedure
    .input(z.object({ to: z.string().email(), subject: z.string(), body: z.string() }))
    .mutation(async ({ input }) => {
      console.log(`[Email] To: ${input.to}, Subject: ${input.subject}`);
      return { success: true, message: 'Email logged (not sent in dev mode)' };
    }),
});
