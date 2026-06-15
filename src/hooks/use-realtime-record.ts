'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToRecord, unsubscribe } from '@/lib/supabase/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

type ChangePayload<T> = {
  eventType: RealtimeEvent;
  new: T;
  old: Partial<T>;
  errors: string[] | null;
};

type UseRealtimeRecordOptions<T> = {
  event?: RealtimeEvent | '*';
  initialData?: T | null;
  onError?: (error: unknown) => void;
};

export function useRealtimeRecord<T extends Record<string, unknown>>(
  tableName: string,
  recordId: string | null,
  options?: UseRealtimeRecordOptions<T>,
) {
  const [record, setRecord] = useState<T | null>(options?.initialData ?? null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const handleChange = useCallback((payload: ChangePayload<T>) => {
    if (payload.eventType === 'DELETE') {
      setRecord(null);
    } else {
      setRecord(payload.new);
    }
  }, []);

  useEffect(() => {
    if (!recordId) {
      setStatus('disconnected');
      return;
    }

    let channel: RealtimeChannel;

    try {
      channel = subscribeToRecord(
        tableName as never,
        recordId,
        handleChange as never,
        { event: options?.event },
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
    // handleChange is stable (useCallback with []), options?.onError captured in closure intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, recordId, options?.event]);

  return { record, status };
}
