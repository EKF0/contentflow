'use client';

import type { ContentRecord } from '@/types';
import { ASSIGNEES } from '@/types';
import { useAnalytics } from '@/hooks/use-analytics';
import { BarChart, PieChart, LineChart } from '@/components/analytics/charts';

interface AnalyticsDashboardProps {
  records: ContentRecord[];
}

function AnalyticsDashboard({ records }: AnalyticsDashboardProps) {
  const data = useAnalytics(records);

  const summaryCards = [
    { label: 'Total Records', value: data.summary.total, color: 'var(--primary)', icon: 'M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z' },
    { label: 'Published', value: data.summary.published, color: 'var(--status-published)', icon: 'M20 6L9 17l-5-5' },
    { label: 'In Progress', value: data.summary.inProgress, color: 'var(--status-drafting)', icon: 'M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z' },
    { label: 'Archived', value: data.summary.archived, color: 'var(--status-archived)', icon: 'M21 8v13H3V8M1 3h22v5H1z' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border-light)]">
        <h2 className="text-[15px] font-semibold text-[var(--fg)]">Analytics</h2>
        <span className="text-[12px] text-[var(--fg-muted)]">{records.length} records</span>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {summaryCards.map(card => (
              <div key={card.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center" style={{ background: `color-mix(in srgb, ${card.color} 12%, transparent)` }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d={card.icon} />
                    </svg>
                  </div>
                  <span className="text-[12px] text-[var(--fg-muted)]">{card.label}</span>
                </div>
                <div className="text-[28px] font-bold tracking-tight" style={{ color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status distribution */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
              <h3 className="text-[13px] font-semibold text-[var(--fg)] mb-4">Status Distribution</h3>
              <PieChart data={data.statusDistribution} />
            </div>

            {/* Production velocity */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
              <h3 className="text-[13px] font-semibold text-[var(--fg)] mb-4">Production Velocity (records/week)</h3>
              <BarChart data={data.velocity} height={160} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Team workload */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
              <h3 className="text-[13px] font-semibold text-[var(--fg)] mb-4">Team Workload</h3>
              <BarChart data={data.teamWorkload} height={160} />
            </div>

            {/* Word count by type */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
              <h3 className="text-[13px] font-semibold text-[var(--fg)] mb-4">Word Count by Type</h3>
              <LineChart data={data.wordCountTrends} height={160} />
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
            <h3 className="text-[13px] font-semibold text-[var(--fg)] mb-4">Publish Date Compliance</h3>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-[12px] text-[var(--fg-weak)]">On Time</span>
                    <span className="text-[13px] font-semibold text-[var(--fg)]">{data.compliance.onTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[12px] text-[var(--fg-weak)]">Late</span>
                    <span className="text-[13px] font-semibold text-[var(--fg)]">{data.compliance.late}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-[12px] text-[var(--fg-weak)]">No Date</span>
                    <span className="text-[13px] font-semibold text-[var(--fg)]">{data.compliance.noDate}</span>
                  </div>
                </div>
              </div>
              {/* Compliance bar */}
              <div className="flex-1 h-6 rounded-full bg-[var(--border-light)] overflow-hidden flex">
                {data.compliance.onTime + data.compliance.late + data.compliance.noDate > 0 && (
                  <>
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${((data.compliance.onTime / (data.compliance.onTime + data.compliance.late + data.compliance.noDate)) * 100)}%` }}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${((data.compliance.late / (data.compliance.onTime + data.compliance.late + data.compliance.noDate)) * 100)}%` }}
                    />
                    <div
                      className="h-full bg-gray-400 transition-all"
                      style={{ width: `${((data.compliance.noDate / (data.compliance.onTime + data.compliance.late + data.compliance.noDate)) * 100)}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Top assignees table */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
            <h3 className="text-[13px] font-semibold text-[var(--fg)] mb-4">Content by Assignee</h3>
            <div className="space-y-2">
              {data.teamWorkload.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: item.color }}>
                    {ASSIGNEES[i]?.initials}
                  </div>
                  <span className="text-[13px] text-[var(--fg)] w-28">{ASSIGNEES[i]?.name}</span>
                  <div className="flex-1 h-2 bg-[var(--border-light)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${data.summary.total > 0 ? (item.value / data.summary.total) * 100 : 0}%`, background: item.color }} />
                  </div>
                  <span className="text-[12px] font-medium text-[var(--fg-weak)] w-8 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AnalyticsDashboard };
