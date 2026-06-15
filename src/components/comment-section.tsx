'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';
import { CommentInput } from './comment-input';

interface Author {
  id: string;
  name: string;
  avatarUrl: string | null;
  email: string;
}

interface Comment {
  id: string;
  recordId: string;
  workspaceId: string;
  userId: string;
  content: string;
  parentCommentId: string | null;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: Author | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  recordId: string;
}

function formatMarkdownLite(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code class="rounded bg-[var(--surface)] px-1 py-0.5 text-xs">$1</code>');
  html = html.replace(
    /@([a-zA-Z0-9._-]+)/g,
    '<span class="font-medium text-[var(--primary)]">@$1</span>'
  );
  html = html.replace(/\n/g, '<br/>');

  return html;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function CommentItem({
  comment,
  recordId,
  currentUserId,
  onReply,
  onResolve,
}: {
  comment: Comment;
  recordId: string;
  currentUserId: string;
  onReply: (parentId: string) => void;
  onResolve: (commentId: string) => void;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const replies = comment.replies ?? [];

  const utils = trpc.useContext();

  const createReplyMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ recordId });
      setShowReplyInput(false);
    },
  });

  const deleteMutation = trpc.comment.delete.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ recordId });
    },
  });

  const isAuthor = comment.userId === currentUserId;

  return (
    <div className={cn('group', comment.parentCommentId ? 'ml-8 mt-3' : 'mt-4 first:mt-0')}>
      <div
        className={cn(
          'rounded-[var(--radius-sm)] border p-3',
          comment.isResolved
            ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
            : 'border-[var(--border)] bg-[var(--bg)]'
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-medium text-white">
            {comment.author?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <span className="text-sm font-medium text-[var(--fg)]">
            {comment.author?.name ?? 'Unknown'}
          </span>
          <span className="text-xs text-[var(--fg-weak)]">
            {timeAgo(comment.createdAt)}
          </span>
          {comment.isResolved && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
              Resolved
            </span>
          )}
        </div>

        <div
          className="prose prose-sm max-w-none text-sm leading-relaxed text-[var(--fg)]"
          dangerouslySetInnerHTML={{ __html: formatMarkdownLite(comment.content) }}
        />

        <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {!comment.parentCommentId && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-xs text-[var(--fg-weak)] hover:text-[var(--primary)]"
            >
              Reply
            </button>
          )}
          <button
            onClick={() => onResolve(comment.id)}
            className="text-xs text-[var(--fg-weak)] hover:text-[var(--primary)]"
          >
            {comment.isResolved ? 'Unresolve' : 'Resolve'}
          </button>
          {isAuthor && (
            <button
              onClick={() => deleteMutation.mutate({ commentId: comment.id })}
              className="text-xs text-[var(--fg-weak)] hover:text-red-500"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {showReplyInput && (
        <div className="mt-2 ml-8">
          <CommentInput
            recordId={recordId}
            parentCommentId={comment.id}
            compact
            placeholder="Write a reply..."
            onSubmit={(content) =>
              createReplyMutation.mutate({
                recordId,
                content,
                parentCommentId: comment.id,
              })
            }
            onCancel={() => setShowReplyInput(false)}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-2">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="ml-8 text-xs text-[var(--primary)] hover:underline"
            >
              Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowReplies(false)}
                className="ml-8 mb-2 text-xs text-[var(--fg-weak)] hover:text-[var(--primary)]"
              >
                Hide replies
              </button>
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={{ ...reply, parentCommentId: comment.id }}
                  recordId={recordId}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onResolve={onResolve}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ recordId }: CommentSectionProps) {
  const utils = trpc.useContext();

  const { data, isLoading } = trpc.comment.list.useQuery(
    { recordId },
    { enabled: !!recordId }
  );

  const { data: countData } = trpc.comment.count.useQuery(
    { recordId },
    { enabled: !!recordId }
  );

  const createMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ recordId });
      utils.comment.count.invalidate({ recordId });
    },
  });

  const resolveMutation = trpc.comment.resolve.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ recordId });
    },
  });

  const comments = (data as any)?.items ?? [];
  const count = (countData as any)?.count ?? 0;

  const handleCreateComment = useCallback(
    (content: string) => {
      createMutation.mutate({ recordId, content });
    },
    [recordId, createMutation]
  );

  const handleResolve = useCallback(
    (commentId: string) => {
      resolveMutation.mutate({ commentId });
    },
    [resolveMutation]
  );

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--fg)]">
          Comments
          {count > 0 && (
            <span className="ml-2 rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-medium text-[var(--fg-weak)]">
              {count}
            </span>
          )}
        </h3>
      </div>

      <CommentInput
        recordId={recordId}
        onSubmit={handleCreateComment}
      />

      {isLoading ? (
        <div className="py-8 text-center text-sm text-[var(--fg-weak)]">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--fg-weak)]">
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment: Comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              recordId={recordId}
              currentUserId=""
              onReply={() => {}}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}
