'use client';

import { useState, useMemo } from 'react';
import {
  getScheduledPosts,
  schedulePost,
  cancelPost,
  deletePost,
  PLATFORM_CONFIG,
  type SocialPlatform,
  type ScheduledPost,
} from '@/lib/social-platforms';

const PLATFORM_ICONS: Record<SocialPlatform, React.ReactNode> = {
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  posted: 'Posted',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-600',
  posted: 'bg-green-500/10 text-green-600',
  failed: 'bg-red-500/10 text-red-600',
  cancelled: 'bg-gray-500/10 text-gray-500',
};

interface SocialSchedulerProps {
  onPostCountChange?: (count: number) => void;
}

function SocialScheduler({ onPostCountChange }: SocialSchedulerProps) {
  const [platform, setPlatform] = useState<SocialPlatform>('twitter');
  const [content, setContent] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [posts, setPosts] = useState<ScheduledPost[]>(getScheduledPosts());
  const [view, setView] = useState<'scheduler' | 'queue'>('queue');

  const config = PLATFORM_CONFIG[platform];
  const charCount = content.length;
  const overLimit = charCount > config.charLimit;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  const postsByPlatform = useMemo(() => {
    const grouped: Record<SocialPlatform, ScheduledPost[]> = { twitter: [], linkedin: [], instagram: [] };
    for (const p of posts) {
      grouped[p.platform].push(p);
    }
    return grouped;
  }, [posts]);

  const handleSchedule = () => {
    if (!content.trim() || !scheduleDate || overLimit) return;
    const newPost = schedulePost({
      platform,
      content: content.trim(),
      scheduledAt: `${scheduleDate}T${scheduleTime}:00`,
      charLimit: config.charLimit,
    });
    setPosts(prev => [...prev, newPost]);
    setContent('');
    setScheduleDate('');
    onPostCountChange?.(scheduledCount + 1);
  };

  const handlePostNow = () => {
    if (!content.trim() || overLimit) return;
    const newPost = schedulePost({
      platform,
      content: content.trim(),
      scheduledAt: new Date().toISOString(),
      charLimit: config.charLimit,
    });
    setPosts(prev => [...prev, { ...newPost, status: 'posted' }]);
    setContent('');
    onPostCountChange?.(scheduledCount);
  };

  const handleCancel = (postId: string) => {
    cancelPost(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'cancelled' as const } : p));
    onPostCountChange?.(posts.filter(p => p.status === 'scheduled' && p.id !== postId).length);
  };

  const handleDelete = (postId: string) => {
    deletePost(postId);
    const remaining = posts.filter(p => p.id !== postId);
    setPosts(remaining);
    onPostCountChange?.(remaining.filter(p => p.status === 'scheduled').length);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border-light)]">
        <h2 className="text-[15px] font-semibold text-[var(--fg)]">Social Scheduler</h2>
        <div className="flex-1" />
        <div className="flex bg-[var(--surface)] rounded-[var(--radius-md)] p-0.5 border border-[var(--border)]">
          <button
            onClick={() => setView('queue')}
            className={`px-3 py-1 text-[12px] font-medium rounded-[var(--radius-sm)] transition-colors ${
              view === 'queue' ? 'bg-[var(--bg)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            Queue ({scheduledCount})
          </button>
          <button
            onClick={() => setView('scheduler')}
            className={`px-3 py-1 text-[12px] font-medium rounded-[var(--radius-sm)] transition-colors ${
              view === 'scheduler' ? 'bg-[var(--bg)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            New Post
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {view === 'scheduler' ? (
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Connected accounts */}
            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg-weak)] mb-2">Connected Accounts</label>
              <div className="flex gap-3">
                {(Object.keys(PLATFORM_CONFIG) as SocialPlatform[]).map(p => {
                  const cfg = PLATFORM_CONFIG[p];
                  return (
                    <div
                      key={p}
                      className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]"
                    >
                      <span style={{ color: cfg.color }}>{PLATFORM_ICONS[p]}</span>
                      <span className="text-[12px] font-medium text-[var(--fg)]">{cfg.name}</span>
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform selector */}
            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg-weak)] mb-2">Platform</label>
              <div className="flex gap-2">
                {(Object.keys(PLATFORM_CONFIG) as SocialPlatform[]).map(p => {
                  const cfg = PLATFORM_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border transition-colors ${
                        platform === p
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-weak)] hover:border-[var(--primary)]/30'
                      }`}
                    >
                      <span style={{ color: platform === p ? undefined : cfg.color }}>{PLATFORM_ICONS[p]}</span>
                      <span className="text-[13px] font-medium">{cfg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-semibold text-[var(--fg-weak)]">Post Content</label>
                <span className={`text-[12px] font-medium ${overLimit ? 'text-red-500' : charCount > config.charLimit * 0.9 ? 'text-amber-500' : 'text-[var(--fg-muted)]'}`}>
                  {charCount}/{config.charLimit}
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Write your ${config.name} post...`}
                className="w-full h-32 p-3 text-[13px] text-[var(--fg)] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] resize-none focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
              />
            </div>

            {/* Preview */}
            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg-weak)] mb-2">Preview</label>
              <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-[11px] font-bold">CF</div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--fg)]">ContentFlow</div>
                    <div className="text-[11px] text-[var(--fg-muted)]">Just now</div>
                  </div>
                </div>
                <p className="text-[13px] text-[var(--fg)] leading-relaxed whitespace-pre-wrap">{content || 'Your post content will appear here...'}</p>
              </div>
            </div>

            {/* Schedule picker */}
            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg-weak)] mb-2">Schedule</label>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-[13px] border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:border-[var(--primary)]"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-[140px] px-3 py-2 text-[13px] border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSchedule}
                disabled={!content.trim() || !scheduleDate || overLimit}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-[var(--primary)] text-white rounded-[var(--radius-md)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Schedule Post
              </button>
              <button
                onClick={handlePostNow}
                disabled={!content.trim() || overLimit}
                className="px-4 py-2.5 text-[13px] font-medium bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Post Now
              </button>
            </div>
          </div>
        ) : (
          /* Queue view */
          <div className="space-y-5">
            {(Object.keys(PLATFORM_CONFIG) as SocialPlatform[]).map(p => {
              const platformPosts = postsByPlatform[p];
              if (platformPosts.length === 0) return null;
              const cfg = PLATFORM_CONFIG[p];
              return (
                <div key={p}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: cfg.color }}>{PLATFORM_ICONS[p]}</span>
                    <span className="text-[13px] font-semibold text-[var(--fg)]">{cfg.name}</span>
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-[10px] bg-[var(--border-light)] text-[11px] font-medium text-[var(--fg-weak)] px-1.5">
                      {platformPosts.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {platformPosts.map(post => (
                      <div key={post.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-[13px] text-[var(--fg)] leading-relaxed line-clamp-2 flex-1">{post.content}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-medium flex-shrink-0 ${STATUS_COLORS[post.status]}`}>
                            {STATUS_LABELS[post.status]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] text-[var(--fg-muted)]">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {new Date(post.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            {post.recordTitle && <span className="text-[var(--primary)] truncate max-w-[120px]">from: {post.recordTitle}</span>}
                          </div>
                          <div className="flex gap-1">
                            {post.status === 'scheduled' && (
                              <button onClick={() => handleCancel(post.id)} className="px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:text-amber-600 hover:bg-amber-50 rounded-[var(--radius-sm)] transition-colors">
                                Cancel
                              </button>
                            )}
                            <button onClick={() => handleDelete(post.id)} className="px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:text-red-600 hover:bg-red-50 rounded-[var(--radius-sm)] transition-colors">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--fg-muted)]">
                <div className="text-[13px] font-medium mb-1">No scheduled posts</div>
                <div className="text-[12px]">Create your first social post to get started</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { SocialScheduler };
