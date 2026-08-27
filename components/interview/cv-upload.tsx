'use client';

import * as React from 'react';
import {
  FileText,
  X,
  UploadCloud,
  Loader2,
  Paperclip,
  Plus,
  CircleCheck as CheckCircle2,
} from 'lucide-react';
import { strings } from '@/lib/interview/strings';

/**
 * "Attach your CV" control, in four interchangeable designs so the
 * team can compare them side by side before committing to one.
 *
 * TEMPORARY: the `design` prop is driven from the Display options
 * popover. Once a design is chosen, keep that branch, delete the other
 * three, and drop the prop.
 *
 *   1 — Drop zone   : dashed rectangle, upload icon, centred (current)
 *   2 — Inline row  : compact single line with a trailing "Browse" button
 *   3 — Card        : bordered card, large icon tile, prominent CTA
 *   4 — Minimal     : underlined field matching the text inputs above
 */

export type CvDesign = 1 | 2 | 3 | 4;

interface CvUploadProps {
  design: CvDesign;
  file: File | null;
  isUploading: boolean;
  uploadProgress: number;
  isDragging: boolean;
  error?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onRemove: () => void;
}

export function CvUpload({
  design,
  file,
  isUploading,
  uploadProgress,
  isDragging,
  error,
  inputRef,
  onFileChange,
  onDrop,
  onDragOver,
  onDragLeave,
  onRemove,
}: CvUploadProps) {
  const open = () => {
    if (!file && !isUploading) inputRef.current?.click();
  };

  const interactiveProps = {
    onClick: open,
    onDragOver,
    onDragLeave,
    onDrop,
    'data-dragging': isDragging ? 'true' : undefined,
    role: file ? undefined : ('button' as const),
    tabIndex: file ? -1 : 0,
    'aria-label': file ? undefined : strings.resume,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    },
  };

  const stateClass = [
    file ? 'has-file' : 'is-empty',
    isUploading ? 'is-uploading' : '',
    error ? 'has-error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const hiddenInput = (
    <input
      ref={inputRef}
      id="iv-resume-input"
      type="file"
      accept="application/pdf"
      className="iv-resume-input"
      onChange={onFileChange}
      aria-invalid={error ? 'true' : 'false'}
    />
  );

  const uploadingBody = (
    <>
      <Loader2 size={18} strokeWidth={1.5} className="iv-resume-icon spin" />
      <div className="iv-resume-body">
        <span className="iv-resume-filename">{strings.resumeUploading}</span>
        <span className="iv-resume-progress-track" aria-hidden="true">
          <span
            className="iv-resume-progress-fill"
            style={{ width: `${uploadProgress}%` }}
          />
        </span>
      </div>
    </>
  );

  const removeButton = (
    <button
      type="button"
      className="iv-resume-remove"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      aria-label={strings.resumeRemove}
    >
      <X size={15} strokeWidth={1.5} />
    </button>
  );

  // ── Design 1 — drop zone (dashed rectangle) ──────────────────────
  if (design === 1) {
    return (
      <div className={`iv-cv iv-cv-1 ${stateClass}`} {...interactiveProps}>
        {isUploading ? (
          uploadingBody
        ) : file ? (
          <>
            <FileText size={18} strokeWidth={1.5} className="iv-resume-icon" />
            <div className="iv-resume-body">
              <span className="iv-resume-filename">{file.name}</span>
              <span className="iv-resume-meta">{strings.resumeSize(file.size)}</span>
            </div>
            {removeButton}
          </>
        ) : (
          <>
            <UploadCloud size={20} strokeWidth={1.5} className="iv-resume-icon" />
            <div className="iv-resume-body">
              <span className="iv-resume-label">{strings.resume}</span>
              <span className="iv-resume-hint">{strings.resumeHint}</span>
            </div>
          </>
        )}
        {hiddenInput}
      </div>
    );
  }

  // ── Design 2 — inline row with a trailing Browse button ──────────
  if (design === 2) {
    return (
      <div className={`iv-cv iv-cv-2 ${stateClass}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} data-dragging={isDragging ? 'true' : undefined}>
        {isUploading ? (
          uploadingBody
        ) : file ? (
          <>
            <FileText size={16} strokeWidth={1.5} className="iv-resume-icon" />
            <div className="iv-resume-body">
              <span className="iv-resume-filename">{file.name}</span>
              <span className="iv-resume-meta">{strings.resumeSize(file.size)}</span>
            </div>
            {removeButton}
          </>
        ) : (
          <>
            <Paperclip size={16} strokeWidth={1.5} className="iv-resume-icon" />
            <div className="iv-resume-body">
              <span className="iv-resume-label">{strings.resume}</span>
              <span className="iv-resume-hint">{strings.resumeHint}</span>
            </div>
            <button type="button" className="iv-cv-browse" onClick={open}>
              {strings.resumeBrowse}
            </button>
          </>
        )}
        {hiddenInput}
      </div>
    );
  }

  // ── Design 3 — card with an icon tile ────────────────────────────
  if (design === 3) {
    return (
      <div className={`iv-cv iv-cv-3 ${stateClass}`} {...interactiveProps}>
        {isUploading ? (
          <div className="iv-cv-3-inner">{uploadingBody}</div>
        ) : file ? (
          <div className="iv-cv-3-inner">
            <span className="iv-cv-tile done" aria-hidden="true">
              <CheckCircle2 size={20} strokeWidth={1.5} />
            </span>
            <div className="iv-resume-body">
              <span className="iv-resume-filename">{file.name}</span>
              <span className="iv-resume-meta">{strings.resumeSize(file.size)}</span>
            </div>
            {removeButton}
          </div>
        ) : (
          <div className="iv-cv-3-inner">
            <span className="iv-cv-tile" aria-hidden="true">
              <UploadCloud size={20} strokeWidth={1.5} />
            </span>
            <div className="iv-resume-body">
              <span className="iv-resume-label">{strings.resume}</span>
              <span className="iv-resume-hint">{strings.resumeDropHint}</span>
            </div>
            <span className="iv-cv-chip">{strings.resumeHint}</span>
          </div>
        )}
        {hiddenInput}
      </div>
    );
  }

  // ── Design 4 — minimal underline, matching the text inputs ───────
  return (
    <div className={`iv-cv iv-cv-4 ${stateClass}`} {...interactiveProps}>
      {isUploading ? (
        uploadingBody
      ) : file ? (
        <>
          <FileText size={16} strokeWidth={1.5} className="iv-resume-icon" />
          <span className="iv-resume-filename">{file.name}</span>
          <span className="iv-resume-meta">{strings.resumeSize(file.size)}</span>
          {removeButton}
        </>
      ) : (
        <>
          <span className="iv-cv-plus" aria-hidden="true">
            <Plus size={14} strokeWidth={2} />
          </span>
          <span className="iv-resume-label">{strings.resume}</span>
          <span className="iv-resume-hint">{strings.resumeHint}</span>
        </>
      )}
      {hiddenInput}
    </div>
  );
}
