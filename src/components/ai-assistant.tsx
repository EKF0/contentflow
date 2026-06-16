'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';

type AssistantAction = 'rewrite' | 'expand' | 'summarize' | 'improve' | 'seo';

interface AIAssistantProps {
  open: boolean;
  onClose: () => void;
  selectedText: string;
  originalText: string;
  onUseResult: (text: string) => void;
}

interface SEOResult {
  keywords: string[];
  metaDescription: string;
  suggestions: string[];
}

export function AIAssistant({
  open,
  onClose,
  selectedText,
  originalText,
  onUseResult,
}: AIAssistantProps) {
  const [result, setResult] = useState<string | null>(null);
  const [seoResult, setSeoResult] = useState<SEOResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<AssistantAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rewriteMutation = trpc.ai.rewrite.useMutation();
  const expandMutation = trpc.ai.expand.useMutation();
  const summarizeMutation = trpc.ai.summarize.useMutation();
  const improveMutation = trpc.ai.improve.useMutation();
  const suggestSEOMutation = trpc.ai.suggestSEO.useMutation();

  const handleAction = useCallback(
    async (type: AssistantAction, text: string) => {
      setAction(type);
      setLoading(true);
      setResult(null);
      setSeoResult(null);
      setError(null);

      try {
        let response: string | undefined;

        switch (type) {
          case 'rewrite': {
            const res = await rewriteMutation.mutateAsync({ text, tone: 'professional' });
            response = res.result;
            break;
          }
          case 'expand': {
            const res = await expandMutation.mutateAsync({ text });
            response = res.result;
            break;
          }
          case 'summarize': {
            const res = await summarizeMutation.mutateAsync({ text });
            response = res.result;
            break;
          }
          case 'improve': {
            const res = await improveMutation.mutateAsync({ text });
            response = res.result;
            break;
          }
          case 'seo': {
            const res = await suggestSEOMutation.mutateAsync({
              title: text.slice(0, 100),
              content: text,
            });
            setSeoResult(res.seo);
            return;
          }
        }

        if (response) {
          setResult(response);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred',
        );
      } finally {
        setLoading(false);
      }
    },
    [rewriteMutation, expandMutation, summarizeMutation, improveMutation, suggestSEOMutation],
  );

  const handleCopy = useCallback(() => {
    const textToCopy = seoResult
      ? `Keywords: ${seoResult.keywords.join(', ')}\nMeta: ${seoResult.metaDescription}\n\nTips:\n${seoResult.suggestions.map((s) => `- ${s}`).join('\n')}`
      : result;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result, seoResult]);

  const handleUseResult = useCallback(() => {
    if (seoResult) {
      const text = `SEO Keywords: ${seoResult.keywords.join(', ')}\n\nMeta Description: ${seoResult.metaDescription}\n\nSuggestions:\n${seoResult.suggestions.map((s) => `- ${s}`).join('\n')}`;
      onUseResult(text);
    } else if (result) {
      onUseResult(result);
    }
  }, [result, seoResult, onUseResult]);

  if (!open) return null;

  const actionLabels: Record<AssistantAction, string> = {
    rewrite: 'Rewritten',
    expand: 'Expanded',
    summarize: 'Summary',
    improve: 'Improved',
    seo: 'SEO Suggestions',
  };

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)]/10">
            <svg
              className="h-3.5 w-3.5 text-[var(--primary)]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-[var(--fg)]">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-[var(--radius-sm)] p-1 text-[var(--fg-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Selected text preview */}
      <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
        <p className="line-clamp-3 text-[12px] leading-relaxed text-[var(--fg-weak)]">
          {selectedText}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--primary)]/5 px-3 py-3">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--primary)] [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--primary)] [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--primary)]" />
          </div>
          <span className="text-[13px] text-[var(--primary)]">
            {actionLabels[action ?? 'rewrite']} your text...
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-red-50 px-3 py-2 dark:bg-red-950/50">
          <span className="text-[12px] text-red-600 dark:text-red-400">{error}</span>
          <button
            onClick={() => action && handleAction(action, selectedText)}
            className="text-[12px] font-medium text-red-600 underline hover:no-underline dark:text-red-400"
          >
            Retry
          </button>
        </div>
      )}

      {/* Result */}
      {!loading && result && (
        <div className="flex flex-col gap-2">
          <h4 className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
            {actionLabels[action ?? 'rewrite']}
          </h4>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--fg)]">
              {result}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleUseResult}>
              Use this
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => action && handleAction(action, selectedText)}
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* SEO Result */}
      {!loading && seoResult && (
        <div className="flex flex-col gap-3">
          <div>
            <h4 className="mb-1.5 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Keywords
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {seoResult.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-[12px] font-medium text-[var(--primary)]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-1.5 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Meta Description
            </h4>
            <p className="rounded-[var(--radius-sm)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--fg)]">
              {seoResult.metaDescription}
            </p>
          </div>

          <div>
            <h4 className="mb-1.5 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Suggestions
            </h4>
            <ul className="flex flex-col gap-1">
              {seoResult.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[13px] text-[var(--fg)]"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleUseResult}>
              Use all
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('seo', selectedText)}
            >
              Try again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
