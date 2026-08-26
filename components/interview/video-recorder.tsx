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
  isPortrait?: boolean;
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
  isPortrait = false,
}: VideoRecorderProps) {
  const liveRef = React.useRef<HTMLVideoElement>(null);
  const reviewRef = React.useRef<HTMLVideoElement>(null);
  const [posterUrl, setPosterUrl] = React.useState<string | null>(null);

  // Re-attach whenever the live preview re-mounts (e.g. after a retake,
  // when the component switches back from the review <video> branch to
  // this one — a fresh element, so `srcObject` must be set again) or the
  // stream itself changes. autoPlay alone is unreliable once srcObject is
  // assigned programmatically after mount, so play() is called explicitly.
  React.useEffect(() => {
    const el = liveRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    el.play().catch(() => {});
  }, [stream, recordingUrl, recording]);

  // MediaRecorder-produced WebM blobs frequently report an unreliable
  // duration, which stops the browser from decoding/painting a seek-based
  // thumbnail — the review <video> can end up blank even though the file
  // itself is fine. To guarantee a visible thumbnail regardless of that,
  // a frame from the live feed is grabbed continuously while recording so
  // one is always ready by the time review needs it — recording stops and
  // the switch to the review screen happen in the same render, so trying
  // to snapshot *at* that transition is one render too late: the live
  // <video> is already unmounted by the time an effect could read it.
  const posterRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!recording) return;
    const v = liveRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let rafId: number;

    const capture = () => {
      if (v.videoWidth > 0 && v.videoHeight > 0 && ctx) {
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        try {
          posterRef.current = canvas.toDataURL('image/jpeg', 0.85);
        } catch {
          // ignore (e.g. tainted canvas)
        }
      }
      rafId = requestAnimationFrame(capture);
    };
    rafId = requestAnimationFrame(capture);
    return () => cancelAnimationFrame(rafId);
  }, [recording]);

  React.useEffect(() => {
    if (recordingUrl && !recording) {
      setPosterUrl(posterRef.current);
    } else if (!recordingUrl) {
      setPosterUrl(null);
    }
  }, [recordingUrl, recording]);

  // A <video> element prioritizes `srcObject` over `src` whenever both are
  // set — and React can reuse the same underlying <video> DOM node across
  // the live/review branches here rather than truly unmounting it, so the
  // live camera's srcObject can still be attached to what is now the
  // review element. Left alone, the element keeps rendering the live feed
  // forever, completely ignoring `src={recordingUrl}`. Clearing srcObject
  // whenever this element is meant to play the recorded blob guarantees
  // `src` actually takes effect.
  React.useEffect(() => {
    const el = reviewRef.current;
    if (!el || !recordingUrl) return;
    el.srcObject = null;
  }, [recordingUrl]);

  // The play/pause button only flips `reviewPlaying` state upstream — this
  // is what actually drives the <video> element to match it.
  React.useEffect(() => {
    const el = reviewRef.current;
    if (!el || !recordingUrl) return;
    if (reviewPlaying) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [reviewPlaying, recordingUrl]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (recordingUrl && !recording) {
    return (
      <div className={`iv-video-recorder-frame${isPortrait ? ' iv-video-portrait' : ''}`}>
        <video
          ref={reviewRef}
          src={recordingUrl}
          className="iv-video-recorder-video"
          onTimeUpdate={(e) => onReviewSeek?.(e.currentTarget.currentTime)}
          onEnded={() => onReviewToggle?.()}
          preload="auto"
          playsInline
        />
        {/* A <video poster> is only shown before the element's own first
            frame becomes available — once readyState reaches
            HAVE_CURRENT_DATA it takes over even if that frame renders
            blank (a real issue with some MediaRecorder-produced WebM
            blobs). An <img> overlay isn't subject to that: it stays put
            until the candidate actually presses play, guaranteeing a
            real thumbnail is visible either way. */}
        {posterUrl && !reviewPlaying && (
          <img
            src={posterUrl}
            alt=""
            className="iv-video-recorder-video iv-video-poster-overlay"
          />
        )}
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
    <div className={`iv-video-recorder-frame${isPortrait ? ' iv-video-portrait' : ''}`}>
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
