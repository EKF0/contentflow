import { router, publicProcedure } from '../trpc';
import { workspaceRouter } from './workspace';
import { tableRouter } from './table';
import { recordRouter } from './record';
import { viewRouter } from './view';
import { aiRouter } from './ai';
import { templateRouter } from './template';
import { activityRouter } from './activity';
import { attachmentRouter } from './attachment';
import { notificationRouter } from './notification';
import { apiKeyRouter } from './api-key';
import { webhookRouter } from './webhook';
import { commentRouter } from './comment';

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  workspace: workspaceRouter,
  table: tableRouter,
  record: recordRouter,
  view: viewRouter,
  ai: aiRouter,
  template: templateRouter,
  activity: activityRouter,
  attachment: attachmentRouter,
  notification: notificationRouter,
  apiKey: apiKeyRouter,
  webhook: webhookRouter,
  comment: commentRouter,
});

export type AppRouter = typeof appRouter;
