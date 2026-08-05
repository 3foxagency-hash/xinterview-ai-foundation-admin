'use client';

import * as React from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

interface LogoUploadProps {
  logoUrl: string | null;
  companyName: string;
  onUploaded: (url: string) => void;
  onReset: () => void;
}

const MAX_SIZE = 2 * 1024 * 1024;
const MIN_DIM = 128;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/svg+xml'];

export function LogoUpload({ logoUrl, companyName, onUploaded, onReset }: LogoUploadProps) {
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError('File must be a PNG, JPG, or SVG.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum size is 2MB.');
      return;
    }

    try {
      const img = await loadImageDims(file);
      if (img.width < MIN_DIM || img.height < MIN_DIM) {
        setError(`Image is too small. Minimum size is ${MIN_DIM}×${MIN_DIM} pixels.`);
        return;
      }
    } catch {
      setError('We could not read this image. Please try a different file.');
      return;
    }

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => (p === null ? null : Math.min(p + 15, 90)));
    }, 100);

    try {
      const { uploadLogo } = await import('@/lib/api/settings');
      const result = await uploadLogo(file);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setProgress(null), 300);
      onUploaded(result.logoUrl);
    } catch (e) {
      clearInterval(interval);
      setProgress(null);
      setError(getSettingsErrorMessage(e));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const initial = (companyName || 'X').charAt(0).toUpperCase();

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted-bg',
            dragOver && 'border-primary ring-2 ring-primary/20'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`${companyName} logo`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-h2 font-bold text-primary">{initial}</span>
          )}

          {progress !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80">
              <Loader2 size={16} className="animate-spin text-muted" />
              <div className="mt-1 h-1 w-8 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={progress !== null}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-transparent px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface disabled:opacity-50"
          >
            <Upload size={14} strokeWidth={1.5} />
            Upload logo
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-8 items-center rounded-md px-2 text-body-sm text-muted transition-colors hover:text-bodyText"
            >
              Reset to default
            </button>
          )}
          <p className="text-caption text-muted">PNG, JPG, or SVG. Max 2MB. Min 128×128px.</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-3 flex items-center gap-1.5 text-body-sm text-error">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function loadImageDims(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('load failed'));
    };
    img.src = url;
  });
}
