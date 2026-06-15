'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { ASSIGNEES } from '@/types';

interface ActivityEntry {
  id: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  userId: string;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
  createdAt: Date;
}

interface ActivityTimelineProps {
  activities: ActivityEntry[];
  className?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ActionDescription({ activity }: { activity: ActivityEntry }) {
  const actionText = {
    create: 'created this record',
    update: 'updated',
    delete: 'deleted this record',
  };

  if (activity.action === 'update' && activity.changes) {
    const fields = Object.keys(activity.changes);
    return (
      <span>
        {actionText[activity.action]}{' '}
        <span className="font-medium">{fields.join(', ')}</span>
      </span>
    );
  }

  return <span>{actionText[activity.action]}</span>;
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  const groupedByDay = useMemo(() => {
    const groups: Map<string, ActivityEntry[]> = new Map();
    activities.forEach(activity => {
      const day = new Date(activity.createdAt).toDateString();
      if (!groups.has(day)) {
        groups.set(day, []);
      }
      groups.get(day)!.push(activity);
    });
    return Array.from(groups.entries());
  }, [activities]);

  if (activities.length === 0) {
    return (
      <div className={cn('py-8 text-center text-[var(--fg-muted)]', className)}>
        No activity yet
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {groupedByDay.map(([day, entries]) => (
        <div key={day}>
          <div className="text-xs font-medium text-[var(--fg-muted)] mb-3">
            {formatDate(new Date(day))}
          </div>
          <div className="space-y-3">
            {entries.map(activity => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-1.5',
                      activity.action === 'create' && 'bg-[var(--status-published)]',
                      activity.action === 'update' && 'bg-[var(--status-drafting)]',
                      activity.action === 'delete' && 'bg-[var(--status-archived)]',
                    )}
                  />
                  <div className="w-px flex-1 bg-[var(--border)]" />
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Avatar
                      name={ASSIGNEES[0]?.name || 'User'}
                      initials={ASSIGNEES[0]?.initials || 'U'}
                      color={ASSIGNEES[0]?.color || 'var(--avatar-1)'}
                      size="sm"
                    />
                    <span className="text-xs text-[var(--fg-muted)]">
                      {formatTime(new Date(activity.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--fg)]">
                    <ActionDescription activity={activity} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
