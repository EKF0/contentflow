import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getClerkUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  return clerkUser;
}

export async function getDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  return user ?? null;
}

export async function getDbUserByClerkId(clerkId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  return user ?? null;
}
