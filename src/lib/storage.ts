import { writeFile, unlink, access, readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

function generateFilename(originalName: string): string {
  const ext = originalName.split('.').pop() ?? 'bin';
  const timestamp = Date.now();
  const id = randomUUID().slice(0, 8);
  return `${timestamp}-${id}.${ext}`;
}

function getStoragePath(urlPath: string): string {
  const relative = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
  return join(process.cwd(), 'public', relative);
}

export function isAllowedMimeType(mime: string | null): boolean {
  if (!mime) return true; // allow unknown
  return ALLOWED_TYPES.includes(mime);
}

export function isAllowedSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export async function uploadFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string | null,
): Promise<{ url: string; filename: string; size: number; mimeType: string | null }> {
  await access(UPLOADS_DIR).catch(async () => {
    const { mkdir } = await import('fs/promises');
    await mkdir(UPLOADS_DIR, { recursive: true });
  });

  const filename = generateFilename(originalName);
  const filePath = join(UPLOADS_DIR, filename);
  await writeFile(filePath, fileBuffer);

  return {
    url: `/uploads/${filename}`,
    filename: originalName,
    size: fileBuffer.length,
    mimeType,
  };
}

export async function deleteFile(urlPath: string): Promise<void> {
  const filePath = getStoragePath(urlPath);
  await access(filePath).then(
    () => unlink(filePath),
    () => {}, // file doesn't exist, ignore
  );
}

export async function getSignedUrl(urlPath: string): Promise<string> {
  const filePath = getStoragePath(urlPath);
  await access(filePath);
  // For local storage, return the path directly. For S3, generate presigned URL.
  const relative = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return relative;
}

export async function getFileBuffer(urlPath: string): Promise<Buffer> {
  const filePath = getStoragePath(urlPath);
  return readFile(filePath);
}
