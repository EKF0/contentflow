import { useMemo } from 'react';
import type { ContentRecord, Status } from '@/types';
import { STATUSES } from '@/types';

interface AnalyticsData {
  summary: {
    total: number;
    published: number;
    inProgress: number;
    archived: number;
    idea: number;
    inReview: number;
    drafting: number;
  };
  statusDistribution: { label: string; value: number; color: string }[];
  velocity: { label: string; value: number }[];
  teamWorkload: { label: string; value: number; color: string }[];
  wordCountTrends: { label: string; value: number }[];
  compliance: { onTime: number; late: number; noDate: number };
}

const STATUS_COLORS: Record<Status, string> = {
  Idea: 'var(--status-idea)',
  Drafting: 'var(--status-drafting)',
  'In Review': 'var(--status-review)',
  Published: 'var(--status-published)',
  Archived: 'var(--status-archived)',
};

const ASSIGNEE_COLORS = [
  'var(--avatar-1)',
  'var(--avatar-2)',
  'var(--avatar-3)',
  'var(--avatar-4)',
  'var(--avatar-5)',
];

const ASSIGNEE_NAMES = ['Sarah Chen', 'Marcus Rivera', 'Aisha Patel', "James O'Brien", 'Lena Kowalski'];

export function useAnalytics(records: ContentRecord[]): AnalyticsData {
  return useMemo(() => {
    const today = new Date();

    const published = records.filter(r => r.status === 'Published').length;
    const inProgress = records.filter(r => r.status === 'Drafting' || r.status === 'In Review').length;
    const archived = records.filter(r => r.status === 'Archived').length;
    const idea = records.filter(r => r.status === 'Idea').length;
    const drafting = records.filter(r => r.status === 'Drafting').length;
    const inReview = records.filter(r => r.status === 'In Review').length;

    const statusDistribution = STATUSES.map(status => ({
      label: status,
      value: records.filter(r => r.status === status).length,
      color: STATUS_COLORS[status],
    }));

    const weeks: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      const weekLabel = `W${6 - i}`;
      weeks[weekLabel] = 0;
    }
    const sortedRecords = [...records].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return da.getTime() - db.getTime();
    });
    for (const r of sortedRecords) {
      const d = new Date(r.date);
      const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 6) {
        const key = `W${6 - weekIndex}`;
        if (weeks[key] !== undefined) weeks[key]++;
      }
    }
    const velocity = Object.entries(weeks).map(([label, value]) => ({ label, value }));

    const workload: Record<number, number> = {};
    for (const r of records) {
      workload[r.assignee] = (workload[r.assignee] || 0) + 1;
    }
    const teamWorkload = ASSIGNEE_NAMES.map((name, i) => ({
      label: name.split(' ')[0],
      value: workload[i] || 0,
      color: ASSIGNEE_COLORS[i],
    }));

    const wcByType: Record<string, number> = {};
    for (const r of records) {
      if (r.words > 0) {
        wcByType[r.type] = (wcByType[r.type] || 0) + r.words;
      }
    }
    const wordCountTrends = Object.entries(wcByType).map(([label, value]) => ({ label, value }));

    let onTime = 0;
    let late = 0;
    let noDate = 0;
    for (const r of records) {
      if (r.status === 'Published' || r.status === 'Archived') {
        if (!r.date) {
          noDate++;
        } else {
          const pubDate = new Date(r.date);
          if (pubDate >= today) {
            onTime++;
          } else {
            late++;
          }
        }
      } else if (r.date) {
        const pubDate = new Date(r.date);
        if (pubDate >= today) {
          onTime++;
        } else {
          late++;
        }
      } else {
        noDate++;
      }
    }

    return {
      summary: { total: records.length, published, inProgress, archived, idea, drafting, inReview },
      statusDistribution,
      velocity,
      teamWorkload,
      wordCountTrends,
      compliance: { onTime, late, noDate },
    };
  }, [records]);
}
