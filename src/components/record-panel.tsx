'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { STATUSES, TYPES, ASSIGNEES } from '@/types';
import type { ContentRecord, Status, ContentType } from '@/types';
import { TypeTag } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { FieldIcon, type IconType } from '@/components/ui/field-icon';
import { FileUpload } from '@/components/file-upload';
import { AttachmentList } from '@/components/attachment-list';
import { CommentSection } from '@/components/comment-section';
import { AIAssistantToolbar } from '@/components/ai-assistant-toolbar';
import { AIAssistant } from '@/components/ai-assistant';
import { trpc } from '@/lib/trpc/client';

type Tab = 'details' | 'attachments' | 'comments';
type AssistantAction = 'rewrite' | 'expand' | 'summarize' | 'improve' | 'seo';

interface RecordPanelProps {
  record: ContentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (recordId: number, field: keyof ContentRecord, value: unknown) => void;
}

function RecordPanel({ record, isOpen, onClose, onUpdate }: RecordPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  const { data: commentCountData } = trpc.comment.count.useQuery(
    { recordId: String(record?.id ?? '') },
    { enabled: !!record && isOpen }
  );

  const commentCount = (commentCountData as any)?.count ?? 0;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset tab when panel opens
  useEffect(() => {
    if (isOpen) setActiveTab('details');
  }, [isOpen]);

  if (!record) return null;

  const assignee = ASSIGNEES[record.assignee] ?? ASSIGNEES[0];

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[99] bg-black/20 transition-opacity duration-200',
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Record detail"
        className={cn(
          'fixed top-0 right-0 z-[100] flex h-screen w-[480px] max-w-[90vw] flex-col',
          'border-l border-[var(--border)] bg-[var(--bg)] shadow-lg',
          'transition-transform duration-[250ms] [cubic-bezier(0.4,0,0.2,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-3.5 flex-shrink-0">
          <TypeTag type={record.type} />
          <span className="text-base font-semibold tracking-[-0.01em] flex-1 truncate">
            {record.title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--surface)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-[var(--fg-weak)]"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-5 flex-shrink-0">
          <TabButton
            active={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
            icon="text"
            label="Details"
          />
          <TabButton
            active={activeTab === 'attachments'}
            onClick={() => setActiveTab('attachments')}
            icon="attachment"
            label="Attachments"
          />
          <TabButton
            active={activeTab === 'comments'}
            onClick={() => setActiveTab('comments')}
            icon="text"
            label={`Comments${commentCount > 0 ? ` (${commentCount})` : ''}`}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'details' ? (
            <DetailsTab record={record} assignee={assignee} onUpdate={onUpdate} />
          ) : activeTab === 'attachments' ? (
            <AttachmentsTab recordId={String(record.id)} />
          ) : (
            <CommentSection recordId={String(record.id)} />
          )}
        </div>
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-[var(--primary)] text-[var(--primary)]'
          : 'border-transparent text-[var(--fg-weak)] hover:text-[var(--fg)]',
      )}
    >
      <FieldIcon type={icon} />
      {label}
    </button>
  );
}

function DetailsTab({
  record,
  assignee,
  onUpdate,
}: {
  record: ContentRecord;
  assignee: { name: string; initials: string; color: string };
  onUpdate: (recordId: number, field: keyof ContentRecord, value: unknown) => void;
}) {
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantAction, setAssistantAction] = useState<AssistantAction | null>(null);

  const handleTextSelect = useCallback(() => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const text = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd,
    );
    const trimmedText = text.trim();

    if (trimmedText.length > 2) {
      setSelectedText(trimmedText);
      setSelectedRange({
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      });

      const rect = textarea.getBoundingClientRect();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rangeRect = range.getBoundingClientRect();
        setToolbarPosition({
          top: rangeRect.top - 48,
          left: rangeRect.left + rangeRect.width / 2,
        });
      } else {
        setToolbarPosition({
          top: rect.top - 48,
          left: rect.left + rect.width / 2,
        });
      }
      setToolbarVisible(true);
    } else {
      setToolbarVisible(false);
    }
  }, []);

  const handleToolbarAction = useCallback(
    (action: AssistantAction, _text: string) => {
      setToolbarVisible(false);
      setAssistantAction(action);
      setAssistantOpen(true);
    },
    [],
  );

  const handleToolbarDismiss = useCallback(() => {
    setToolbarVisible(false);
  }, []);

  const handleUseResult = useCallback(
    (newText: string) => {
      const textarea = notesRef.current;
      if (!textarea || !selectedRange) {
        onUpdate(record.id, 'notes', (record.notes || '') + '\n\n' + newText);
        return;
      }

      const before = textarea.value.substring(0, selectedRange.start);
      const after = textarea.value.substring(selectedRange.end);
      const updated = before + newText + after;
      onUpdate(record.id, 'notes', updated);

      setAssistantOpen(false);
      setSelectedText('');
      setSelectedRange(null);
    },
    [record.id, record.notes, selectedRange, onUpdate],
  );

  const handleCloseAssistant = useCallback(() => {
    setAssistantOpen(false);
    setAssistantAction(null);
  }, []);

  useEffect(() => {
    const textarea = notesRef.current;
    if (!textarea) return;

    textarea.addEventListener('mouseup', handleTextSelect);
    textarea.addEventListener('keyup', (e) => {
      if (e.shiftKey) handleTextSelect();
    });

    return () => {
      textarea.removeEventListener('mouseup', handleTextSelect);
      textarea.removeEventListener('keyup', handleTextSelect);
    };
  }, [handleTextSelect]);

  useEffect(() => {
    if (!assistantOpen) {
      setAssistantAction(null);
    }
  }, [assistantOpen]);

  return (
    <>
      <FieldRow icon="text" label="Title">
        <input
          type="text"
          value={record.title}
          onChange={(e) => onUpdate(record.id, 'title', e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-sm text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
        />
      </FieldRow>

      <FieldRow icon="select" label="Status">
        <select
          value={record.status}
          onChange={(e) => onUpdate(record.id, 'status', e.target.value as Status)}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-sm text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FieldRow>

      <FieldRow icon="tag" label="Type">
        <select
          value={record.type}
          onChange={(e) => onUpdate(record.id, 'type', e.target.value as ContentType)}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-sm text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FieldRow>

      <FieldRow icon="user" label="Assignee">
        <div className="flex items-center gap-2">
          <Avatar initials={assignee.initials} color={assignee.color} size="sm" />
          <span className="text-sm text-[var(--fg)]">{assignee.name}</span>
        </div>
      </FieldRow>

      <FieldRow icon="calendar" label="Publish Date">
        <input
          type="date"
          value={record.date}
          onChange={(e) => onUpdate(record.id, 'date', e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-sm text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
        />
      </FieldRow>

      <FieldRow icon="number" label="Word Count">
        <input
          type="number"
          value={record.words}
          min={0}
          step={50}
          onChange={(e) => onUpdate(record.id, 'words', parseInt(e.target.value, 10) || 0)}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-sm text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
        />
      </FieldRow>

      <FieldRow icon="check" label="Featured">
        <input
          type="checkbox"
          checked={record.featured}
          onChange={(e) => onUpdate(record.id, 'featured', e.target.checked)}
          className="h-[18px] w-[18px] cursor-pointer accent-[var(--primary)]"
        />
      </FieldRow>

      <FieldRow icon="text" label="Notes">
        <div className="relative">
          <textarea
            ref={notesRef}
            value={record.notes}
            onChange={(e) => onUpdate(record.id, 'notes', e.target.value)}
            rows={4}
            className="w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-sm leading-relaxed text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
            placeholder="Type or paste text, then select it to use the AI assistant..."
          />
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--fg-muted)]">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Select text to use AI assistant
          </div>
        </div>
      </FieldRow>

      {/* AI Assistant Toolbar */}
      <AIAssistantToolbar
        visible={toolbarVisible}
        position={toolbarPosition}
        selectedText={selectedText}
        onAction={handleToolbarAction}
        onDismiss={handleToolbarDismiss}
      />

      {/* AI Assistant Panel */}
      <AIAssistant
        open={assistantOpen}
        onClose={handleCloseAssistant}
        selectedText={selectedText}
        originalText={record.notes || ''}
        onUseResult={handleUseResult}
      />
    </>
  );
}

function AttachmentsTab({ recordId }: { recordId: string }) {
  const utils = trpc.useContext();
  const [uploading, setUploading] = useState(false);

  const { data: attachmentData, isLoading } = trpc.attachment.list.useQuery(
    { recordId },
    { enabled: !!recordId },
  );

  const uploadMutation = trpc.attachment.upload.useMutation({
    onSuccess: () => {
      utils.attachment.list.invalidate({ recordId });
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
    },
  });

  const deleteMutation = trpc.attachment.delete.useMutation({
    onSuccess: () => {
      utils.attachment.list.invalidate({ recordId });
    },
  });

  const handleUpload = useCallback(
    (file: { filename: string; mimeType: string | null; size: number; fileData: string }) => {
      setUploading(true);
      uploadMutation.mutate({ recordId, ...file });
    },
    [recordId, uploadMutation],
  );

  const handleDelete = useCallback(
    (attachmentId: string) => {
      deleteMutation.mutate({ attachmentId });
    },
    [deleteMutation],
  );

  return (
    <div className="flex flex-col gap-4">
      <FileUpload onUpload={handleUpload} disabled={uploading} />

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-[var(--fg-weak)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          Uploading...
        </div>
      )}

      <AttachmentList
        attachments={Array.isArray(attachmentData) ? attachmentData : []}
        onDelete={handleDelete}
        loading={isLoading}
      />
    </div>
  );
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: IconType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide text-[var(--fg-weak)]">
        <FieldIcon type={icon} />
        {label}
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export { RecordPanel };
export type { RecordPanelProps };
