'use client';

import {
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from '../lib/upload';
import styles from '../page.module.css';

const UPLOAD_URL = '/api/todos/upload';
const MAX_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
const ACCEPT_ATTRIBUTE = ALLOWED_MIME_TYPES.join(',');

export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

function validateFile(file: File): string | null {
  if (file.size === 0) {
    return 'File is empty';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File exceeds ${MAX_MB} MB limit`;
  }
  const mime = file.type.toLowerCase();
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mime)) {
    return 'Unsupported type. Allowed: PNG, JPG, GIF, WEBP';
  }
  return null;
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);
  const inputId = useId();

  const uploadFile = useCallback((file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', UPLOAD_URL);
      xhr.responseType = 'json';

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        const response = xhr.response as
          | { url?: unknown; error?: unknown }
          | null;

        if (xhr.status >= 200 && xhr.status < 300) {
          if (response !== null && typeof response.url === 'string') {
            resolve(response.url);
            return;
          }
          reject(new Error('Upload response missing url'));
          return;
        }

        const message =
          response !== null && typeof response.error === 'string'
            ? response.error
            : `HTTP ${xhr.status}`;
        reject(new Error(message));
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload cancelled'));

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled || uploading) return;

      const validationError = validateFile(file);
      if (validationError !== null) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        const url = await uploadFile(file);
        setProgress(100);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [disabled, uploading, uploadFile, onChange]
  );

  const handleClick = useCallback(() => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  }, [disabled, uploading]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file !== undefined) {
        void handleFile(file);
      }
      event.target.value = '';
    },
    [handleFile]
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled || uploading) return;
      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) {
        setDragActive(true);
      }
    },
    [disabled, uploading]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setDragActive(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current = 0;
      setDragActive(false);
      if (disabled || uploading) return;
      const file = event.dataTransfer.files[0];
      if (file !== undefined) {
        void handleFile(file);
      }
    },
    [disabled, uploading, handleFile]
  );

  const handleRemove = useCallback(() => {
    if (disabled || uploading) return;
    setError(null);
    setProgress(0);
    onChange(null);
  }, [disabled, uploading, onChange]);

  const dropAreaClasses = [
    styles.uploadArea,
    dragActive ? styles.uploadAreaActive : '',
    disabled || uploading ? styles.uploadAreaDisabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className={styles.uploadInputHidden}
        onChange={handleInputChange}
        disabled={disabled || uploading}
        tabIndex={-1}
      />

      {value === null ? (
        <button
          type="button"
          className={dropAreaClasses}
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={disabled || uploading}
          aria-label="Upload image"
        >
          <span>
            {uploading
              ? `Uploading… ${progress}%`
              : 'Drag & drop or click to upload'}
          </span>
          <span className={styles.uploadHint}>
            PNG, JPG, GIF, WEBP up to {MAX_MB} MB
          </span>
          {uploading && (
            <div className={styles.uploadProgress}>
              <div
                className={styles.uploadProgressBar}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </button>
      ) : (
        <div className={styles.uploadPreview}>
          <img
            src={value}
            alt="Selected image preview"
            className={styles.uploadPreviewImage}
          />
          <button
            type="button"
            className={styles.uploadRemove}
            onClick={handleRemove}
            disabled={disabled || uploading}
            aria-label="Remove image"
          >
            ×
          </button>
        </div>
      )}

      {error !== null && (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}