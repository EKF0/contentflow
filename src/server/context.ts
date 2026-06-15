import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext() {
  const session = await auth();

  let dbUser = null;
  if (session.userId) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, session.userId))
      .limit(1);
    dbUser = user ?? null;
  }

  return {
    db,
    userId: session.userId,
    dbUser,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
