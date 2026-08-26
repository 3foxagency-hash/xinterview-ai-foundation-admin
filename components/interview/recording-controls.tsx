'use client';

import * as React from 'react';
import { ArrowRight, TriangleAlert as AlertTriangle } from 'lucide-react';
import { strings } from '@/lib/interview/strings';
import type { LifecycleState } from '@/components/interview/answer-plane';

interface RecordingControlsProps {
  state: LifecycleState;
  questionType: 'video' | 'audio' | 'text' | 'choice';
  onStart: () => void;
  onStop: () => void;
  onSubmit: () => void;
  onRetake: () => void;
  retakesRemaining: number;
  inactivityCountdown: number | null;
  onCancelInactivity: () => void;
  disabled?: boolean;
}

export function RecordingControls({
  state,
  questionType,
  onStart,
  onStop,
  onSubmit,
  onRetake,
  retakesRemaining,
  inactivityCountdown,
  onCancelInactivity,
  disabled,
}: RecordingControlsProps) {
  const isVideoOrAudio = questionType === 'video' || questionType === 'audio';

  if (state === 'thinking') {
    return (
      <div className="iv-controls-group">
        <button
          type="button"
          className="iv-cta"
          onClick={onStart}
          disabled={disabled}
        >
          {strings.thinkingStartNow}
          <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
        </button>
        <div className="iv-cta-bloom" aria-hidden="true" />
      </div>
    );
  }

  if (state === 'ready') {
    return (
      <div className="iv-controls-group">
        <button
          type="button"
          className="iv-cta"
          onClick={onStart}
          disabled={disabled}
        >
          {isVideoOrAudio ? strings.readyStartRecording : strings.readyStartAnswering}
          <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
        </button>
        <div className="iv-cta-bloom" aria-hidden="true" />
        <p className="iv-answer-secondary">{strings.readyTimerStartsLine}</p>
      </div>
    );
  }

  if (state === 'active' || state === 'warning') {
    return (
      <div className="iv-controls-group">
        <button
          type="button"
          className="iv-stop-pill"
          onClick={onStop}
          disabled={disabled}
        >
          {isVideoOrAudio ? strings.activeStopRecording : strings.activeStopAnswering}
        </button>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className="iv-controls-group">
        <p className="iv-expired-line">{strings.expiredSaved}</p>
      </div>
    );
  }

  if (state === 'review') {
    return (
      <div className="iv-controls-group">
        {inactivityCountdown !== null && inactivityCountdown > 0 && (
          <div className="iv-inactivity-row">
            <span className="iv-inactivity-text">
              {strings.inactivityCountdown(inactivityCountdown)}
            </span>

          </div>
        )}
        <div className="iv-review-controls">
          <button
            type="button"
            className="iv-cta"
            onClick={onSubmit}
            disabled={disabled}
          >
            {strings.reviewSubmitContinue}
            <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
          </button>
          <div className="iv-cta-bloom" aria-hidden="true" />
        </div>
        {isVideoOrAudio && retakesRemaining > 0 && (
          <button
            type="button"
            className="iv-link-button iv-retake-link"
            onClick={onRetake}
          >
            {strings.reviewRecordAgain(retakesRemaining)}
          </button>
        )}
      </div>
    );
  }

  if (state === 'uploading') {
    return (
      <div className="iv-controls-group">
        <button
          type="button"
          className="iv-stop-pill"
          disabled
        >
          <span className="iv-sr-only">Uploading</span>
        </button>
      </div>
    );
  }

  return null;
}
