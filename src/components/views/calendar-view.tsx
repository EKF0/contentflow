'use client';

import { useState, useMemo } from 'react';
import { ASSIGNEES } from '@/types';
import type { ContentRecord, Status } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const statusColors: { [K in Status]: string } = {
  Idea: 'var(--status-idea)',
  Drafting: 'var(--status-drafting)',
  'In Review': 'var(--status-review)',
  Published: 'var(--status-published)',
  Archived: 'var(--status-archived)',
};

interface CalendarViewProps {
  records: ContentRecord[];
  onRecordClick?: (record: ContentRecord) => void;
}

function CalendarView({ records, onRecordClick }: CalendarViewProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { day: number; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      days.push({
        day: d,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month fill
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      const m = month + 2 > 12 ? 1 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      days.push({
        day: i,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [year, month, todayStr]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, ContentRecord[]>();
    for (const r of records) {
      const existing = map.get(r.date) ?? [];
      existing.push(r);
      map.set(r.date, existing);
    }
    return map;
  }, [records]);

  const goToPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border-light)]">
          <button onClick={goToPrevMonth} className="calendar-nav-btn w-[30px] h-[30px] flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] transition-all hover:bg-[var(--surface)] hover:border-[var(--primary)] hover:text-[var(--primary)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <h3 className="text-base font-semibold tracking-[-0.01em] min-w-[180px]">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button onClick={goToNextMonth} className="calendar-nav-btn w-[30px] h-[30px] flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] transition-all hover:bg-[var(--surface)] hover:border-[var(--primary)] hover:text-[var(--primary)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
          <button onClick={goToToday} className="calendar-today-btn px-3 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] text-[12px] font-medium transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]">
            Today
          </button>
        </div>
        <div className="flex items-center justify-center h-full text-[var(--fg-muted)] text-[13px]">
          No records found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Navigation */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border-light)]">
        <button onClick={goToPrevMonth} className="calendar-nav-btn w-[30px] h-[30px] flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] transition-all hover:bg-[var(--surface)] hover:border-[var(--primary)] hover:text-[var(--primary)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <h3 className="text-base font-semibold tracking-[-0.01em] min-w-[180px]">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button onClick={goToNextMonth} className="calendar-nav-btn w-[30px] h-[30px] flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] transition-all hover:bg-[var(--surface)] hover:border-[var(--primary)] hover:text-[var(--primary)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>
        <button onClick={goToToday} className="calendar-today-btn px-3 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] text-[12px] font-medium transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]">
          Today
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col flex-1 overflow-auto">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {WEEKDAYS.map(d => (
            <div key={d} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 flex-1">
          {calendarDays.map((day, i) => {
            const dayRecords = recordsByDate.get(day.dateStr) ?? [];
            return (
              <div
                key={i}
                className={[
                  'min-h-[110px] border-r border-r-[var(--border-light)] border-b border-b-[var(--border-light)] p-1 relative transition-colors hover:bg-[var(--surface)]',
                  !day.isCurrentMonth && 'opacity-35',
                  day.isToday && 'bg-[var(--primary-soft)]',
                  (i + 1) % 7 === 0 && 'border-r-0',
                ].filter(Boolean).join(' ')}
              >
                <span className={[
                  'text-[12px] font-medium text-[var(--fg-weak)] py-0.5 px-1.5 block',
                  day.isToday && 'text-[var(--primary)] font-semibold',
                ].filter(Boolean).join(' ')}>
                  {day.day}
                </span>

                {dayRecords.map(r => {
                  const color = statusColors[r.status];
                  return (
                    <div
                      key={r.id}
                      className="calendar-event flex items-center gap-1 py-0.5 px-1.5 my-px rounded-[var(--radius-sm)] text-[11px] font-[450] cursor-pointer transition-opacity hover:opacity-85 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{
                        background: `color-mix(in srgb, ${color} 12%, transparent)`,
                        color,
                      }}
                      onClick={() => onRecordClick?.(r)}
                    >
                      <span
                        className="ev-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: color }}
                      />
                      {r.title.length > 22 ? r.title.slice(0, 22) + '...' : r.title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { CalendarView };
