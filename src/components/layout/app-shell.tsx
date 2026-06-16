'use client';

import { useState, useCallback } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { Sidebar, type SidebarSection } from './sidebar';
import { TopBar } from './top-bar';
import { Toolbar } from './toolbar';
import { FilterBar } from '@/components/filter-bar';
import { GridView } from '@/components/views/grid-view';
import { KanbanView } from '@/components/views/kanban-view';
import { CalendarView } from '@/components/views/calendar-view';
import { ImportModal } from '@/components/import-modal';
import { SocialScheduler } from '@/components/social-scheduler';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { useSearch } from '@/hooks/use-search';
import { useViews } from '@/hooks/use-views';
import { cn } from '@/lib/utils';
import type { ContentRecord } from '@/types';
import type { FilterState, SortState, GroupState } from '@/hooks/use-search';
import type { ViewState } from '@/hooks/use-views';

type ViewType = 'grid' | 'kanban' | 'calendar';

const SAMPLE_RECORDS: ContentRecord[] = [
  { id: 1, title: 'Q3 Product Launch Announcement', status: 'Drafting', type: 'Blog', assignee: 0, date: '2026-06-18', words: 1200, featured: true, notes: 'Coordinate with product team for screenshots and quotes.' },
  { id: 2, title: 'Weekly Digest — June Week 3', status: 'In Review', type: 'Newsletter', assignee: 1, date: '2026-06-20', words: 850, featured: false, notes: 'Include roundup of new integrations.' },
  { id: 3, title: 'Behind the Scenes: How We Built v4', status: 'Idea', type: 'Blog', assignee: 0, date: '2026-06-25', words: 2000, featured: true, notes: 'Long-form narrative. Interview engineering leads.' },
  { id: 4, title: 'Instagram Reel: Feature Highlights', status: 'Drafting', type: 'Social', assignee: 2, date: '2026-06-16', words: 60, featured: false, notes: '15-second format. Focus on collaboration features.' },
  { id: 5, title: 'Customer Story: Acme Corp Migration', status: 'Published', type: 'Blog', assignee: 3, date: '2026-06-10', words: 1500, featured: true, notes: 'Acme approved final draft. Photos cleared by legal.' },
  { id: 6, title: 'Podcast Ep 47: Future of Work Tools', status: 'Drafting', type: 'Podcast', assignee: 1, date: '2026-06-22', words: 0, featured: false, notes: 'Guest: VP of Product at TechCo. Record Thursday.' },
  { id: 7, title: 'LinkedIn Thought Leadership Post', status: 'Idea', type: 'Social', assignee: 4, date: '2026-07-01', words: 200, featured: false, notes: 'Topic: asynchronous collaboration in distributed teams.' },
  { id: 8, title: 'Video Tutorial: Advanced Automations', status: 'In Review', type: 'Video', assignee: 2, date: '2026-06-19', words: 0, featured: true, notes: 'Screen recording done. Editing in progress.' },
  { id: 9, title: 'SEO Guide: Content Planning at Scale', status: 'Published', type: 'Blog', assignee: 0, date: '2026-06-05', words: 3200, featured: true, notes: 'Ranking for 12 target keywords. 4.2K views first week.' },
  { id: 10, title: 'Monthly Metrics Newsletter — June', status: 'Idea', type: 'Newsletter', assignee: 1, date: '2026-06-30', words: 600, featured: false, notes: 'Pull data from analytics dashboard. Add commentary.' },
  { id: 11, title: 'Twitter Thread: 10 Productivity Tips', status: 'Published', type: 'Social', assignee: 4, date: '2026-06-08', words: 350, featured: false, notes: 'Engaged 12K impressions. 340 retweets.' },
  { id: 12, title: 'Webinar Recap Blog Post', status: 'Drafting', type: 'Blog', assignee: 3, date: '2026-06-24', words: 1000, featured: false, notes: 'Summarize key takeaways from Tuesday webinar.' },
  { id: 13, title: 'YouTube: Getting Started Guide', status: 'Archived', type: 'Video', assignee: 2, date: '2026-05-15', words: 0, featured: false, notes: 'Replaced by v4 onboarding series.' },
  { id: 14, title: 'Partner Co-marketing Email Blast', status: 'In Review', type: 'Newsletter', assignee: 1, date: '2026-06-21', words: 400, featured: false, notes: 'Joint send with DataStack. A/B test subject lines.' },
  { id: 15, title: 'TikTok Series: Day in the Life', status: 'Idea', type: 'Social', assignee: 2, date: '2026-07-05', words: 0, featured: false, notes: '3-part series featuring the design team.' },
  { id: 16, title: 'Podcast Ep 48: Data-Driven Content', status: 'Idea', type: 'Podcast', assignee: 1, date: '2026-07-03', words: 0, featured: false, notes: 'Potential guest: Head of Analytics at MediaCo.' },
  { id: 17, title: 'Case Study: Startup Scaling Playbook', status: 'Published', type: 'Blog', assignee: 3, date: '2026-06-03', words: 2400, featured: true, notes: 'Featured in partner newsletter. 890 downloads.' },
  { id: 18, title: 'Year-in-Review Video Script', status: 'Archived', type: 'Video', assignee: 4, date: '2026-05-28', words: 1800, featured: false, notes: 'Shelved until Q4 planning. Keep outline.' },
];

function AppShell() {
  const [activeView, setActiveView] = useState<ViewType>('grid');
  const [activeSection, setActiveSection] = useState<SidebarSection>('editorial');
  const [socialPostCount, setSocialPostCount] = useState(0);
  const [records, setRecords] = useState<ContentRecord[]>(SAMPLE_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    type: [],
    assignee: [],
    dateRange: null,
    featured: null,
  });
  const [sort, setSort] = useState<SortState>({ field: null, direction: 'asc' });
  const [group, setGroup] = useState<GroupState>({ field: null });
  const [importOpen, setImportOpen] = useState(false);
  const [saveViewModalOpen, setSaveViewModalOpen] = useState(false);
  const [viewNameInput, setViewNameInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const saveViewModalRef = useFocusTrap(saveViewModalOpen);

  const viewsState = useViews();

  const { filteredRecords, groupedRecords } = useSearch(records, searchQuery, filters, sort, group);

  const activeFilterCount = [
    filters.status.length > 0,
    filters.type.length > 0,
    filters.assignee.length > 0,
    filters.dateRange !== null,
    filters.featured !== null,
  ].filter(Boolean).length;

  const handleRecordUpdate = useCallback((id: number, field: string, value: unknown) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (field === 'words') return { ...r, words: parseInt(String(value)) || 0 };
      if (field === 'featured') return { ...r, featured: Boolean(value) };
      return { ...r, [field]: value };
    }));
  }, []);

  const handleRecordClick = useCallback((_record: ContentRecord) => {
    // Record panel will be implemented in a later phase
  }, []);

  const handleImportRecords = useCallback((newRecords: ContentRecord[]) => {
    setRecords((prev) => [...prev, ...newRecords]);
  }, []);

  const handleSaveView = useCallback(() => {
    setSaveViewModalOpen(true);
    setViewNameInput('');
  }, []);

  const confirmSaveView = useCallback(() => {
    if (!viewNameInput.trim()) return;
    const state: ViewState = {
      searchQuery,
      filters,
      sort,
      group,
      viewMode: activeView,
    };
    viewsState.saveView(viewNameInput.trim(), state);
    setSaveViewModalOpen(false);
    setViewNameInput('');
  }, [viewNameInput, searchQuery, filters, sort, group, activeView, viewsState]);

  const handleLoadView = useCallback(
    (id: string) => {
      const state = viewsState.loadView(id);
      if (state) {
        setSearchQuery(state.searchQuery);
        setFilters(state.filters);
        setSort(state.sort);
        setGroup(state.group);
        setActiveView(state.viewMode);
      }
    },
    [viewsState],
  );

  const handleViewSwitch = useCallback(
    (view: ViewType) => {
      setActiveView(view);
      setSidebarOpen(false);
      viewsState.resetView();
    },
    [viewsState],
  );

  const handleSectionChange = useCallback(
    (section: SidebarSection) => {
      setActiveSection(section);
      setSidebarOpen(false);
    },
    [],
  );

  return (
    <div className="flex h-screen">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Mobile sidebar backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar - always rendered, hidden on mobile via props */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:transform-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          socialPostCount={socialPostCount}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <main id="main-content" className="flex flex-1 flex-col overflow-hidden min-w-0" role="main">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        {activeSection === 'editorial' && (
          <>
            <Toolbar
              activeView={activeView}
              onViewChange={handleViewSwitch}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterVisible={filterVisible}
              onFilterToggle={() => setFilterVisible(!filterVisible)}
              activeFilterCount={activeFilterCount}
              sort={sort}
              onSortChange={setSort}
              group={group}
              onGroupChange={setGroup}
              onImportClick={() => setImportOpen(true)}
              records={records}
              filteredRecords={filteredRecords}
              views={viewsState.views}
              activeViewId={viewsState.activeViewId}
              activeViewName={viewsState.activeView?.name ?? null}
              onLoadView={handleLoadView}
              onSaveView={handleSaveView}
              onDeleteView={viewsState.deleteView}
              onRenameView={viewsState.renameView}
              onResetView={viewsState.resetView}
            />
            {filterVisible && (
              <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
              />
            )}
            <div className="flex-1 overflow-auto relative">
              <div className="absolute inset-0 flex flex-col">
                {activeView === 'grid' && (
                  <GridView
                    records={filteredRecords}
                    groupedRecords={group.field ? groupedRecords : undefined}
                    searchQuery={searchQuery}
                    sort={sort}
                    onRecordClick={handleRecordClick}
                    onRecordUpdate={handleRecordUpdate}
                  />
                )}
                {activeView === 'kanban' && (
                  <KanbanView
                    records={filteredRecords}
                    onRecordClick={handleRecordClick}
                  />
                )}
                {activeView === 'calendar' && (
                  <CalendarView
                    records={filteredRecords}
                    onRecordClick={handleRecordClick}
                  />
                )}
              </div>
            </div>
          </>
        )}
        {activeSection === 'social' && (
          <SocialScheduler onPostCountChange={setSocialPostCount} />
        )}
        {activeSection === 'analytics' && (
          <AnalyticsDashboard records={records} />
        )}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {(['grid', 'kanban', 'calendar'] as ViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => handleViewSwitch(view)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] transition-colors',
              activeView === view
                ? 'text-[var(--primary)]'
                : 'text-[var(--fg-muted)]',
            )}
          >
            {view === 'grid' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            )}
            {view === 'kanban' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="12" rx="1" />
                <rect x="17" y="3" width="5" height="15" rx="1" />
              </svg>
            )}
            {view === 'calendar' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )}
            <span className="capitalize">{view}</span>
          </button>
        ))}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] text-[var(--fg-muted)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="12" cy="5" r="1" />
            <circle cx="19" cy="5" r="1" />
            <circle cx="5" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
            <circle cx="19" cy="19" r="1" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          <span>More</span>
        </button>
      </nav>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportRecords}
        existingRecords={records}
      />

      {/* Save View Modal */}
      {saveViewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Save view">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSaveViewModalOpen(false)} aria-hidden="true" />
          <div ref={saveViewModalRef} tabIndex={-1} className="relative bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] w-full max-w-[360px] p-5">
            <h3 className="text-[15px] font-semibold text-[var(--fg)] mb-3" id="save-view-title">Save View</h3>
            <input
              type="text"
              placeholder="View name..."
              value={viewNameInput}
              onChange={(e) => setViewNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmSaveView();
                if (e.key === 'Escape') setSaveViewModalOpen(false);
              }}
              autoFocus
              aria-labelledby="save-view-title"
              className="w-full border border-[var(--border)] rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-[var(--fg)] bg-[var(--surface)] focus:outline-none focus:border-[var(--primary)]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSaveViewModalOpen(false)}
                className="px-3 py-1.5 text-[13px] text-[var(--fg-weak)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-md)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmSaveView}
                disabled={!viewNameInput.trim()}
                className="px-4 py-1.5 text-[13px] font-medium bg-[var(--primary)] text-white rounded-[var(--radius-md)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { AppShell, type ViewType };
