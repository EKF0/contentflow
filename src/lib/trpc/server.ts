import { createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server/routers';
import { createContext } from '@/server/context';

const createCaller = createCallerFactory(appRouter);

export function createServerCaller() {
  return createCaller({
    // Server-side caller uses the context creation function directly
    // The actual context will be resolved at call time
    db: null as any,
    userId: null,
    dbUser: null,
  });
}

// For use in server components where we have direct DB access
export async function createServerCallerWithContext() {
  const ctx = await createContext();
  return createCaller(ctx);
}

export type { AppRouter } from '@/server/routers';
