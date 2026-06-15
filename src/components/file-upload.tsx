'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { FieldIcon } from '@/components/ui/field-icon';

interface FileUploadProps {
  onUpload: (file: { filename: string; mimeType: string | null; size: number; fileData: string }) => void;
  disabled?: boolean;
}

const MAX_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'file-text';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-text';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table';
  return 'file';
}

function isImage(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith('image/');
}

export function FileUpload({ onUpload, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type) && file.type !== '') {
        setError(`"${file.name}" is not a supported file type.`);
        return;
      }

      if (file.size > MAX_SIZE) {
        setError(`"${file.name}" exceeds the 10MB size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        onUpload({
          filename: file.name,
          mimeType: file.type || null,
          size: file.size,
          fileData: base64,
        });
      };
      reader.readAsDataURL(file);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach(processFile);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      files.forEach(processFile);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [processFile],
  );

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors',
          isDragging
            ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
            : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface)]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <FieldIcon type="attachment" />
        <span className="text-sm text-[var(--fg-weak)]">
          Drop files here or click to browse
        </span>
        <span className="text-xs text-[var(--fg-weak)]">
          Images, PDFs, videos, documents (max 10MB)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

export { formatSize, getFileIcon, isImage };
export type { FileUploadProps };
