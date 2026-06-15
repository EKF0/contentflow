'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';

interface CommentInputProps {
  recordId: string;
  parentCommentId?: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}

interface MentionUser {
  id: string;
  name: string;
  email: string;
}

export function CommentInput({
  recordId,
  parentCommentId,
  onSubmit,
  onCancel,
  placeholder = 'Write a comment... Use @ to mention someone',
  compact = false,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  const { data: membersData } = trpc.workspace.getMembers.useQuery(
    { workspaceId: '' },
    { enabled: showMentions }
  );

  const members: MentionUser[] = (membersData as any)?.members ?? [];
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const pos = e.target.selectionStart ?? 0;
      setContent(value);
      setCursorPosition(pos);

      const textBeforeCursor = value.slice(0, pos);
      const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9._-]*)$/);

      if (mentionMatch) {
        setShowMentions(true);
        setMentionQuery(mentionMatch[1]);
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    },
    []
  );

  const insertMention = useCallback(
    (user: MentionUser) => {
      const textBeforeCursor = content.slice(0, cursorPosition);
      const textAfterCursor = content.slice(cursorPosition);
      const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9._-]*)$/);

      if (mentionMatch) {
        const beforeMention = textBeforeCursor.slice(
          0,
          textBeforeCursor.length - mentionMatch[0].length
        );
        const newContent = `${beforeMention}@${user.name} ${textAfterCursor}`;
        setContent(newContent);
        setShowMentions(false);

        setTimeout(() => {
          if (textareaRef.current) {
            const newPos = beforeMention.length + user.name.length + 2;
            textareaRef.current.selectionStart = newPos;
            textareaRef.current.selectionEnd = newPos;
            textareaRef.current.focus();
          }
        }, 0);
      }
    },
    [content, cursorPosition]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showMentions && filteredMembers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex((i) => (i + 1) % filteredMembers.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex((i) => (i - 1 + filteredMembers.length) % filteredMembers.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          insertMention(filteredMembers[mentionIndex]);
        } else if (e.key === 'Escape') {
          setShowMentions(false);
        }
        return;
      }

      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [showMentions, filteredMembers, mentionIndex, insertMention]
  );

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setContent('');
  }, [content, onSubmit]);

  useEffect(() => {
    if (showMentions && mentionListRef.current) {
      const activeItem = mentionListRef.current.children[mentionIndex] as HTMLElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [mentionIndex, showMentions]);

  const charCount = content.length;
  const maxChars = 5000;

  return (
    <div className={cn('relative', compact ? '' : 'mb-4')}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className={cn(
            'w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm leading-relaxed text-[var(--fg)]',
            'placeholder:text-[var(--fg-weak)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]',
            compact ? 'min-h-[60px]' : 'min-h-[80px]'
          )}
        />

        {showMentions && filteredMembers.length > 0 && (
          <div
            ref={mentionListRef}
            className="absolute bottom-full left-0 z-50 mb-1 max-h-[200px] w-[250px] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] shadow-lg"
          >
            {filteredMembers.map((user, idx) => (
              <button
                key={user.id}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                  idx === mentionIndex
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                    : 'hover:bg-[var(--surface)]'
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(user);
                }}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-medium text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{user.name}</div>
                  <div className="truncate text-xs text-[var(--fg-weak)]">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-xs',
              charCount > maxChars * 0.9
                ? 'text-red-500'
                : 'text-[var(--fg-weak)]'
            )}
          >
            {charCount}/{maxChars}
          </span>
          <span className="text-xs text-[var(--fg-weak)]">
            Ctrl+Enter to submit
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium text-[var(--fg-weak)] transition-colors hover:bg-[var(--surface)]"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={cn(
              'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors',
              content.trim()
                ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                : 'cursor-not-allowed bg-[var(--surface)] text-[var(--fg-weak)]'
            )}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
