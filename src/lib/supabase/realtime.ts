import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createBrowserClient } from './client';

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

type ChangePayload<T> = {
  eventType: RealtimeEvent;
  new: T;
  old: Partial<T>;
  errors: string[] | null;
};

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient();
  }
  return supabaseInstance;
}

export function subscribeToTable<T extends TableName>(
  tableName: T,
  callback: (payload: ChangePayload<TableRow<T>>) => void,
  options?: {
    event?: RealtimeEvent | '*';
    filter?: string;
  },
): RealtimeChannel {
  const supabase = getSupabase();
  const channel = supabase.channel(`table:${tableName}`);

  const event = options?.event ?? '*';

  channel.on(
    'postgres_changes',
    {
      event,
      schema: 'public',
      table: tableName,
      filter: options?.filter,
    },
    (payload: RealtimePostgresChangesPayload<TableRow<T>>) => {
      callback({
        eventType: payload.eventType as RealtimeEvent,
        new: payload.new as TableRow<T>,
        old: payload.old as Partial<TableRow<T>>,
        errors: payload.errors,
      });
    },
  );

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.error(`[Realtime] Channel error on table "${tableName}"`);
    }
  });

  return channel;
}

export function subscribeToRecord<T extends TableName>(
  tableName: T,
  recordId: string,
  callback: (payload: ChangePayload<TableRow<T>>) => void,
  options?: {
    event?: RealtimeEvent | '*';
  },
): RealtimeChannel {
  const supabase = getSupabase();
  const channel = supabase.channel(`record:${tableName}:${recordId}`);

  const event = options?.event ?? '*';

  channel.on(
    'postgres_changes',
    {
      event,
      schema: 'public',
      table: tableName,
      filter: `id=eq.${recordId}`,
    },
    (payload: RealtimePostgresChangesPayload<TableRow<T>>) => {
      callback({
        eventType: payload.eventType as RealtimeEvent,
        new: payload.new as TableRow<T>,
        old: payload.old as Partial<TableRow<T>>,
        errors: payload.errors,
      });
    },
  );

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.error(`[Realtime] Channel error on record "${tableName}:${recordId}"`);
    }
  });

  return channel;
}

export function unsubscribe(channel: RealtimeChannel): void {
  const supabase = getSupabase();
  supabase.removeChannel(channel);
}
