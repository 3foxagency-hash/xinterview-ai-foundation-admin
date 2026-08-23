'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';

interface UploadStateProps {
  percent: number;
  slowConnection: boolean;
  failed: boolean;
  failureCount: number;
  onRetry: () => void;
  onContinueWithout: () => void;
}

export function UploadState({
  percent,
  slowConnection,
  failed,
  failureCount,
  onRetry,
  onContinueWithout,
}: UploadStateProps) {
  React.useEffect(() => {
    if (percent >= 100 || failed) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [percent, failed]);

  if (failed) {
    return (
      <div className="iv-upload-failed">
        <p className="iv-upload-failed-text">
          {strings.uploadingRetryFailed(failureCount)}
        </p>
        <div className="iv-upload-actions">
          <button type="button" className="iv-cta" onClick={onRetry}>
            {strings.uploadingRetry}
          </button>
          {failureCount >= 3 && (
            <button
              type="button"
              className="iv-link-button"
              onClick={onContinueWithout}
            >
              {strings.uploadingContinueWithout}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="iv-upload-wrap">
      <div className="iv-upload-header">
        <span className="iv-upload-label">{strings.uploadingLabel}</span>
        <span className="iv-upload-percent">{Math.round(percent)}%</span>
      </div>
      <div className="iv-upload-track" aria-hidden="true">
        <div className="iv-upload-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="iv-upload-line">
        {slowConnection ? strings.uploadingSlow : strings.uploadingKeepOpen}
      </p>
    </div>
  );
}
