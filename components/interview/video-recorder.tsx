'use client';

import * as React from 'react';
import { Play, Pause } from 'lucide-react';
import { strings } from '@/lib/interview/strings';

interface VideoRecorderProps {
  stream: MediaStream | null;
  recordingUrl: string | null;
  elapsedSeconds: number;
  recording: boolean;
  reviewElapsed: number;
  reviewDuration: number;
  onReviewSeek?: (seconds: number) => void;
  onReviewToggle?: () => void;
  reviewPlaying?: boolean;
}

export function VideoRecorder({
  stream,
  recordingUrl,
  elapsedSeconds,
  recording,
  reviewElapsed,
  reviewDuration,
  onReviewSeek,
  onReviewToggle,
  reviewPlaying,
}: VideoRecorderProps) {
  const liveRef = React.useRef<HTMLVideoElement>(null);
  const reviewRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (liveRef.current && stream) {
      liveRef.current.srcObject = stream;
    }
  }, [stream]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (recordingUrl && !recording) {
    return (
      <div className="iv-video-recorder-frame">
        <video
          ref={reviewRef}
          src={recordingUrl}
          className="iv-video-recorder-video"
          onTimeUpdate={(e) => onReviewSeek?.(e.currentTarget.currentTime)}
          playsInline
        />
        <div className="iv-rec-wash" aria-hidden="true" />
        <button
          type="button"
          className="iv-review-play"
          onClick={onReviewToggle}
          aria-label={reviewPlaying ? strings.reviewPauseLabel : strings.reviewPlayLabel}
        >
          {reviewPlaying ? (
            <Pause size={20} strokeWidth={1.5} />
          ) : (
            <Play size={20} strokeWidth={1.5} className="iv-play-icon-offset" />
          )}
        </button>
        <div className="iv-review-scrub">
          <input
            type="range"
            min={0}
            max={reviewDuration || 1}
            step={0.1}
            value={Math.min(reviewElapsed, reviewDuration || 0)}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (reviewRef.current) reviewRef.current.currentTime = v;
              onReviewSeek?.(v);
            }}
            aria-label="Seek"
            className="iv-scrub-input"
          />
          <span className="iv-scrub-time">
            {fmt(reviewElapsed)} / {fmt(reviewDuration)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="iv-video-recorder-frame">
      <video
        ref={liveRef}
        className="iv-video-recorder-video"
        autoPlay
        muted
        playsInline
      />
      <div className="iv-rec-wash" aria-hidden="true" />
      {recording && (
        <div className="iv-rec-pill">
          <span className="iv-rec-dot" aria-hidden="true" />
          <span className="iv-rec-text">{strings.activeRecLabel}</span>
          <span className="iv-rec-time">{fmt(elapsedSeconds)}</span>
        </div>
      )}
    </div>
  );
}
