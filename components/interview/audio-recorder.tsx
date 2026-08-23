'use client';

import * as React from 'react';
import { Play, Pause } from 'lucide-react';
import { strings } from '@/lib/interview/strings';

const BAR_COUNT = 64;
const BAR_COUNT_MOBILE = 32;

interface AudioRecorderProps {
  stream: MediaStream | null;
  recording: boolean;
  reviewUrl: string | null;
  reviewElapsed: number;
  reviewDuration: number;
  onReviewSeek?: (seconds: number) => void;
  onReviewToggle?: () => void;
  reviewPlaying?: boolean;
}

export function AudioRecorder({
  stream,
  recording,
  reviewUrl,
  reviewElapsed,
  reviewDuration,
  onReviewSeek,
  onReviewToggle,
  reviewPlaying,
}: AudioRecorderProps) {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = React.useRef<number>(0);
  const barsRef = React.useRef<(HTMLSpanElement | null)[]>([]);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const barCount = isMobile ? BAR_COUNT_MOBILE : BAR_COUNT;

  React.useEffect(() => {
    if (!stream || !recording) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
      const step = Math.floor(data.length / barCount);
      for (let i = 0; i < barCount; i++) {
        const bar = barsRef.current[i];
        if (!bar) continue;
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += data[i * step + j] || 0;
        }
        const avg = sum / step / 255;
        const height = Math.max(3, avg * 100);
        bar.style.height = `${height}%`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      source?.disconnect();
      ctx.close().catch(() => {});
    };
  }, [stream, recording, barCount]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (reviewUrl && !recording) {
    const progress = reviewDuration > 0 ? reviewElapsed / reviewDuration : 0;
    return (
      <div className="iv-audio-recorder-surface">
        <div className="iv-audio-waveform-static" aria-hidden="true">
          {Array.from({ length: barCount }, (_, i) => {
            const played = i / barCount < progress;
            const seed = Math.sin(i * 12.9898) * 43758.5453;
            const frac = seed - Math.floor(seed);
            const h = 15 + Math.round(frac * 70);
            return (
              <span
                key={i}
                className={played ? 'iv-wave-bar played' : 'iv-wave-bar'}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <div className="iv-audio-playhead" style={{ left: `${progress * 80 + 10}%` }} aria-hidden="true" />
        <div className="iv-audio-review-controls">
          <button
            type="button"
            className="iv-review-play-sm"
            onClick={onReviewToggle}
            aria-label={reviewPlaying ? strings.reviewPauseLabel : strings.reviewPlayLabel}
          >
            {reviewPlaying ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}
          </button>
          <span className="iv-scrub-time">{fmt(reviewElapsed)} / {fmt(reviewDuration)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="iv-audio-recorder-surface">
      <div className="iv-audio-waveform" aria-hidden="true">
        {Array.from({ length: barCount }, (_, i) => (
          <span
            key={i}
            ref={(el) => { barsRef.current[i] = el; }}
            className="iv-wave-bar"
          />
        ))}
      </div>
      <span className="iv-audio-listening">{strings.audioListening}</span>
    </div>
  );
}
