'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export type SidebarSection = 'editorial' | 'social' | 'analytics';

interface SidebarProps {
  className?: string;
  activeSection?: SidebarSection;
  onSectionChange?: (section: SidebarSection) => void;
  socialPostCount?: number;
}

function Sidebar({ className, activeSection = 'editorial', onSectionChange, socialPostCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[var(--border)] bg-[var(--surface)] overflow-hidden z-20 flex-shrink-0',
        'transition-[width,min-width] duration-200 ease-in-out',
        collapsed ? 'w-[52px] min-w-[52px]' : 'w-[240px] min-w-[240px]',
        className,
      )}
      aria-label="Navigation"
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-3',
          collapsed && 'justify-center',
        )}
      >
        <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-white"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </div>
        {!collapsed && (
          <h2 className="text-sm font-semibold tracking-tight whitespace-nowrap">
            ContentFlow
          </h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--border-light)]"
          aria-label="Toggle sidebar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-[var(--fg-weak)]"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Tables section */}
      <div className="px-2 pt-3 pb-1">
        {!collapsed && (
          <div className="mb-1.5 px-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">
            Tables
          </div>
        )}
        <ul className="list-none space-y-0.5">
          <SidebarItem
            active={activeSection === 'editorial'}
            collapsed={collapsed}
            onClick={() => onSectionChange?.('editorial')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            }
            label="Editorial Planner"
          />
          <SidebarItem
            collapsed={collapsed}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            }
            label="Team Members"
          />
          <SidebarItem
            collapsed={collapsed}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            label="Content Calendar"
          />
          <SidebarItem
            active={activeSection === 'social'}
            collapsed={collapsed}
            onClick={() => onSectionChange?.('social')}
            badge={socialPostCount > 0 ? socialPostCount : undefined}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            }
            label="Social"
          />
          <SidebarItem
            active={activeSection === 'analytics'}
            collapsed={collapsed}
            onClick={() => onSectionChange?.('analytics')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            }
            label="Analytics"
          />
        </ul>
      </div>

      {/* Views section */}
      <div className="px-2 pt-3 pb-1">
        {!collapsed && (
          <div className="mb-1.5 px-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">
            Views
          </div>
        )}
        <ul className="list-none space-y-0.5">
          <SidebarItem
            active
            collapsed={collapsed}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            }
            label="Grid"
          />
          <SidebarItem
            collapsed={collapsed}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="12" rx="1" />
                <rect x="17" y="3" width="5" height="15" rx="1" />
              </svg>
            }
            label="Kanban"
          />
          <SidebarItem
            collapsed={collapsed}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <rect x="7" y="14" width="3" height="3" rx="0.5" />
              </svg>
            }
            label="Calendar"
          />
        </ul>
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  active?: boolean;
  collapsed: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number;
}

function SidebarItem({ active, collapsed, icon, label, onClick, badge }: SidebarItemProps) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] transition-colors',
          active
            ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium'
            : 'text-[var(--fg-weak)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]',
          collapsed && 'justify-center px-2',
        )}
      >
        <span className="flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {!collapsed && (
          <>
            <span className="whitespace-nowrap">{label}</span>
            {badge !== undefined && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 rounded-[10px] bg-[var(--primary)] text-[11px] font-medium text-white px-1.5">
                {badge}
              </span>
            )}
          </>
        )}
      </button>
    </li>
  );
}

export { Sidebar };
