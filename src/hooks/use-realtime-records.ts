'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToTable, unsubscribe } from '@/lib/supabase/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

type ChangePayload<T> = {
  eventType: RealtimeEvent;
  new: T;
  old: Partial<T>;
  errors: string[] | null;
};

type UseRealtimeRecordsOptions<T> = {
  event?: RealtimeEvent | '*';
  filter?: string;
  initialData?: T[];
  onError?: (error: unknown) => void;
};

export function useRealtimeRecords<T extends Record<string, unknown>>(
  tableName: string,
  options?: UseRealtimeRecordsOptions<T>,
) {
  const [records, setRecords] = useState<T[]>(options?.initialData ?? []);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const handleChanges = useCallback(
    (payload: ChangePayload<T>) => {
      setRecords((prev) => {
        switch (payload.eventType) {
          case 'INSERT':
            return [...prev, payload.new];
          case 'UPDATE':
            return prev.map((record) =>
              (record as Record<string, unknown>).id === payload.new.id ? payload.new : record,
            );
          case 'DELETE':
            return prev.filter(
              (record) => (record as Record<string, unknown>).id !== payload.old.id,
            );
          default:
            return prev;
        }
      });
    },
    [],
  );

  useEffect(() => {
    let channel: RealtimeChannel;

    try {
      channel = subscribeToTable(
        tableName as never,
        handleChanges as never,
        {
          event: options?.event,
          filter: options?.filter,
        },
      );

      channel.on('system', {}, (payload) => {
        if (payload.status === 'ok') {
          setStatus('connected');
        } else if (payload.status === 'error') {
          setStatus('disconnected');
          options?.onError?.(payload);
        }
      });
    } catch (error) {
      setStatus('disconnected');
      options?.onError?.(error);
      return;
    }

    return () => {
      if (channel) {
        unsubscribe(channel);
        setStatus('disconnected');
      }
    };
    // handleChanges is stable (useCallback with []), options?.onError captured in closure intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, options?.event, options?.filter]);

  return { records, status };
}
