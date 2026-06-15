'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';

type Tab = 'titles' | 'outline' | 'tags' | 'social';

interface AISuggestionsProps {
  open: boolean;
  onClose: () => void;
  onUseTitle?: (title: string) => void;
  onUseOutline?: (outline: string) => void;
  onUseTags?: (tags: string[]) => void;
  onUseSocial?: (platform: string, text: string) => void;
  initialTopic?: string;
  initialTitle?: string;
  initialContent?: string;
}

export function AISuggestions({
  open,
  onClose,
  onUseTitle,
  onUseOutline,
  onUseTags,
  onUseSocial,
  initialTopic = '',
  initialTitle = '',
  initialContent = '',
}: AISuggestionsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('titles');
  const [topic, setTopic] = useState(initialTopic);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titles, setTitles] = useState<string[]>([]);
  const [outline, setOutline] = useState<Array<{ level: string; text: string }>>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [socialSnippets, setSocialSnippets] = useState<{
    twitter: string;
    linkedin: string;
    instagram: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const handleGenerateTitles = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await utils.client.ai.generateTitles.mutate({ topic });
      setTitles(result.titles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate titles');
    } finally {
      setLoading(false);
    }
  }, [topic, utils.client]);

  const handleGenerateOutline = useCallback(async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await utils.client.ai.generateOutline.mutate({ title });
      setOutline(result.outline);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outline');
    } finally {
      setLoading(false);
    }
  }, [title, utils.client]);

  const handleGenerateTags = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await utils.client.ai.generateTags.mutate({ title, content });
      setTags(result.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tags');
    } finally {
      setLoading(false);
    }
  }, [title, content, utils.client]);

  const handleGenerateSocial = useCallback(async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await utils.client.ai.generateSocialSnippets.mutate({ content });
      setSocialSnippets(result.snippets);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate social snippets',
      );
    } finally {
      setLoading(false);
    }
  }, [content, utils.client]);

  const handleGenerate = () => {
    switch (activeTab) {
      case 'titles':
        handleGenerateTitles();
        break;
      case 'outline':
        handleGenerateOutline();
        break;
      case 'tags':
        handleGenerateTags();
        break;
      case 'social':
        handleGenerateSocial();
        break;
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'titles', label: 'Titles', icon: 'M4 6h16M4 12h16M4 18h7' },
    { key: 'outline', label: 'Outline', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { key: 'tags', label: 'Tags', icon: 'M7 7h.01M7 3h5a2 2 0 011.41.59l7 7a2 2 0 010 2.82l-7 7a2 2 0 01-2.82 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
    { key: 'social', label: 'Social', icon: 'M18 8a6 6 0 01-6 6M6 8a6 6 0 006 6m-6-6v1m0 12v1m8-10H9m8 10H9' },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)]/10">
              <svg
                className="h-4 w-4 text-[var(--primary)]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h2 className="text-[15px] font-semibold text-[var(--fg)]">AI Suggestions</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1 text-[var(--fg-muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)] px-5 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setError(null);
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-t-[var(--radius-sm)] px-3 py-2 text-[13px] font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]',
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 p-5">
          {/* Input */}
          {activeTab === 'titles' && (
            <Input
              label="Topic"
              placeholder="e.g., How to build a content calendar for SaaS"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateTitles()}
            />
          )}
          {activeTab === 'outline' && (
            <Input
              label="Title"
              placeholder="e.g., 10 Ways to Boost Your Content Strategy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateOutline()}
            />
          )}
          {activeTab === 'tags' && (
            <>
              <Input
                label="Title"
                placeholder="Enter the content title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Content preview"
                placeholder="Paste a snippet of your content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </>
          )}
          {activeTab === 'social' && (
            <Input
              label="Content"
              placeholder="Paste your article content here"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          )}

          {/* Generate Button */}
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generate
              </span>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="rounded-[var(--radius-sm)] bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
              <button
                onClick={handleGenerate}
                className="mt-2 text-[12px] font-medium text-red-600 underline hover:no-underline dark:text-red-400"
              >
                Retry
              </button>
            </div>
          )}

          {/* Results */}
          {activeTab === 'titles' && titles.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[12px] font-medium text-[var(--fg-weak)]">Generated Titles</h3>
              {titles.map((t, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 transition-colors hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5"
                >
                  <span className="text-[13px] text-[var(--fg)]">{t}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUseTitle?.(t)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    Use this
                  </Button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'outline' && outline.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="text-[12px] font-medium text-[var(--fg-weak)]">Generated Outline</h3>
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4">
                {outline.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'py-1.5 text-[13px]',
                      item.level === 'h2' ? 'font-semibold text-[var(--fg)] mt-3 first:mt-0' : 'text-[var(--fg-weak)] pl-4',
                    )}
                  >
                    {item.level === 'h2' && (
                      <span className="mr-2 text-[var(--primary)]">&#9654;</span>
                    )}
                    {item.level === 'h3' && (
                      <span className="mr-2 text-[var(--fg-muted)]">&#8226;</span>
                    )}
                    {item.text}
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onUseOutline?.(outline.map((o) => `${o.level === 'h2' ? '## ' : '### '}${o.text}`).join('\n'))}
                className="self-end"
              >
                Use outline
              </Button>
            </div>
          )}

          {activeTab === 'tags' && tags.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[12px] font-medium text-[var(--fg-weak)]">Suggested Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[13px] font-medium text-[var(--primary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onUseTags?.(tags)}
                className="self-end"
              >
                Use all tags
              </Button>
            </div>
          )}

          {activeTab === 'social' && socialSnippets && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[12px] font-medium text-[var(--fg-weak)]">Social Snippets</h3>
              {Object.entries(socialSnippets).map(([platform, text]) => (
                <div
                  key={platform}
                  className="group rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] font-semibold capitalize text-[var(--fg)]">
                      {platform}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUseSocial?.(platform, text)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Use this
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--fg-weak)]">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
