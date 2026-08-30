'use client';

import * as React from 'react';

/**
 * Thin tick waveform used either side of a live conversational
 * interview (avatar + voice routes).
 *
 * When a stream is supplied the bars follow real microphone level via
 * Web Audio. Without one — the AI side, until LiveKit provides its
 * track — the bars animate from a deterministic idle pattern so the
 * row still reads as "audio", never as a fabricated meter of nothing:
 * `active` gates all motion, so a silent participant shows a flat line.
 */

interface LiveWaveformProps {
  /** Candidate microphone. Null for the AI side until LiveKit lands. */
  stream?: MediaStream | null;
  /** Whether this participant is currently producing audio. */
  active: boolean;
  bars?: number;
  className?: string;
}

export function LiveWaveform({
  stream = null,
  active,
  bars = 28,
  className = '',
}: LiveWaveformProps) {
  const [levels, setLevels] = React.useState<number[]>(() =>
    new Array(bars).fill(0),
  );
  const rafRef = React.useRef<number | null>(null);
  const ctxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const dataRef = React.useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Real level metering when we have a stream.
  React.useEffect(() => {
    if (!stream || !active) return;
    const Ctor =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        : null;
    if (!Ctor) return;

    let cancelled = false;
    const ctx = new Ctor();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    try {
      ctx.createMediaStreamSource(stream).connect(analyser);
    } catch {
      return;
    }

    const tick = () => {
      if (cancelled) return;
      const data = dataRef.current;
      if (data && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(data);
        const next = new Array(bars);
        const step = Math.max(1, Math.floor(data.length / bars));
        for (let i = 0; i < bars; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += data[i * step + j] ?? 0;
          next[i] = Math.min(1, sum / step / 180);
        }
        setLevels(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.close().catch(() => {});
      ctxRef.current = null;
      analyserRef.current = null;
    };
  }, [stream, active, bars]);

  // No stream (AI side): animate a travelling idle pattern.
  React.useEffect(() => {
    if (stream || !active) return;
    let cancelled = false;
    const start = Date.now();
    const tick = () => {
      if (cancelled) return;
      const t = (Date.now() - start) / 1000;
      const next = new Array(bars);
      for (let i = 0; i < bars; i++) {
        const centre = 1 - Math.abs(i / (bars - 1) - 0.5) * 2;
        next[i] =
          Math.max(
            0.08,
            (Math.sin(t * 5 + i * 0.5) * 0.5 + 0.5) * centre,
          ) * 0.9;
      }
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stream, active, bars]);

  // Settle flat when inactive.
  React.useEffect(() => {
    if (!active) setLevels(new Array(bars).fill(0));
  }, [active, bars]);

  return (
    <div
      className={`iv-live-wave ${active ? 'active' : ''} ${className}`}
      aria-hidden="true"
    >
      {levels.map((v, i) => (
        <span
          key={i}
          className="iv-live-wave-bar"
          style={{ transform: `scaleY(${0.12 + v * 0.88})` }}
        />
      ))}
    </div>
  );
}
