import type { UploadResponse } from '../types';

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
] as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateUpload(file: File): UploadValidationResult {
  if (!file || typeof file.arrayBuffer !== 'function') {
    return { ok: false, error: 'No file provided' };
  }

  if (file.size === 0) {
    return { ok: false, error: 'File is empty' };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const limitMb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
    return { ok: false, error: `File exceeds ${limitMb} MB limit` };
  }

  const mime = file.type.toLowerCase();
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mime)) {
    return {
      ok: false,
      error: `Unsupported type "${file.type}". Allowed: PNG, JPG, GIF, WEBP`,
    };
  }

  return { ok: true };
}

export function sanitizeFilename(input: string): string {
  const base = input.split(/[\\/]/).pop() ?? 'upload';
  const dotIndex = base.lastIndexOf('.');
  const hasExtension = dotIndex > 0 && dotIndex < base.length - 1;

  const rawName = hasExtension ? base.slice(0, dotIndex) : base;
  const rawExt = hasExtension ? base.slice(dotIndex + 1) : '';

  const safeName =
    rawName
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'upload';

  const safeExt = rawExt.replace(/[^a-zA-Z0-9]+/g, '').slice(0, 8);

  return safeExt.length > 0 ? `${safeName}.${safeExt}` : safeName;
}

export async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mime = file.type.toLowerCase();
  return `data:${mime};base64,${base64}`;
}

export function buildUploadResponse(
  file: File,
  dataUrl: string
): UploadResponse {
  return {
    url: dataUrl,
    filename: sanitizeFilename(file.name),
    size: file.size,
    mimeType: file.type.toLowerCase(),
  };
}