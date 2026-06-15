'use client';

import { cn } from '@/lib/utils';
import { formatSize, getFileIcon, isImage } from '@/components/file-upload';
import type { Attachment } from '@/lib/db/schema';

interface AttachmentItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  createdAt: Date | string;
}

interface AttachmentListProps {
  attachments: AttachmentItem[];
  onDelete?: (attachmentId: string) => void;
  loading?: boolean;
}

function AttachmentList({ attachments, onDelete, loading }: AttachmentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-[var(--fg-weak)]">
        Loading attachments...
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-[var(--fg-weak)]">
        No attachments yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5"
        >
          {isImage(att.mimeType) ? (
            <img
              src={att.url}
              alt={att.filename}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-[var(--bg)]">
              <AttachmentIcon type={getFileIcon(att.mimeType)} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <a
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-sm font-medium text-[var(--fg)] hover:text-[var(--primary)]"
            >
              {att.filename}
            </a>
            <p className="text-xs text-[var(--fg-weak)]">
              {att.size != null ? formatSize(att.size) : 'Unknown size'}
              {att.createdAt && (
                <> &middot; {new Date(att.createdAt).toLocaleDateString()}</>
              )}
            </p>
          </div>

          {onDelete && (
            <button
              onClick={() => onDelete(att.id)}
              className="flex h-7 w-7 items-center justify-center rounded text-[var(--fg-weak)] transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label="Delete attachment"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function AttachmentIcon({ type }: { type: string }) {
  switch (type) {
    case 'image':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--fg-weak)]">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21" />
        </svg>
      );
    case 'video':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--fg-weak)]">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
      );
    case 'file-text':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--fg-weak)]">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--fg-weak)]">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
  }
}

export { AttachmentList };
export type { AttachmentListProps };
