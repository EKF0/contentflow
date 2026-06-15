import type { RealtimeChannel } from '@supabase/supabase-js';
import { createBrowserClient } from './client';

type PresenceUser = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  joinedAt: string;
};

type PresenceState = {
  [key: string]: PresenceUser[];
};

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient();
  }
  return supabaseInstance;
}

export function trackPresence(
  workspaceId: string,
  user: Omit<PresenceUser, 'joinedAt'>,
  options?: {
    onJoin?: (users: PresenceUser[]) => void;
    onLeave?: (users: PresenceUser[]) => void;
    onSync?: (state: PresenceState) => void;
  },
): RealtimeChannel {
  const supabase = getSupabase();
  const channel = supabase.channel(`presence:${workspaceId}`, {
    config: {
      presence: {
        key: user.userId,
      },
    },
  });

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState<PresenceUser>();
    options?.onSync?.(state);
  });

  channel.on('presence', { event: 'join' }, ({ newPresences }) => {
    options?.onJoin?.(newPresences as unknown as PresenceUser[]);
  });

  channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
    options?.onLeave?.(leftPresences as unknown as PresenceUser[]);
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        ...user,
        joinedAt: new Date().toISOString(),
      } satisfies PresenceUser);
    }
  });

  return channel;
}

export function getPresenceState(channel: RealtimeChannel): PresenceState {
  return channel.presenceState<PresenceUser>();
}

export function untrackPresence(channel: RealtimeChannel): void {
  const supabase = getSupabase();
  supabase.removeChannel(channel);
}

export type { PresenceUser, PresenceState };
