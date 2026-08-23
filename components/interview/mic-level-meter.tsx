'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';

const TOTAL_BARS = 24;
const MOBILE_BARS = 16;

interface MicLevelMeterProps {
  stream: MediaStream | null;
  active: boolean;
}

export function MicLevelMeter({ stream, active }: MicLevelMeterProps) {
  const [level, setLevel] = React.useState(0);
  const [bars, setBars] = React.useState(TOTAL_BARS);
  const levelRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
  const dataRef = React.useRef<Uint8Array | null>(null);
  const lastAnnounceRef = React.useRef(0);
  const [srStatus, setSrStatus] = React.useState<string>(strings.setupMicSilent);

  React.useEffect(() => {
    const checkMobile = () => {
      setBars(window.innerWidth < 768 ? MOBILE_BARS : TOTAL_BARS);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (!stream || !active) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
      }
      setLevel(0);
      levelRef.current = 0;
      return;
    }

    let AudioCtxCtor: typeof AudioContext;
    if (typeof window !== 'undefined') {
      AudioCtxCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
    } else {
      return;
    }

    if (!AudioCtxCtor) return;

    const ctx = new AudioCtxCtor();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    analyserRef.current = analyser;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    dataRef.current = data;

    const tick = () => {
      if (!analyserRef.current || !dataRef.current) return;
      analyserRef.current.getByteTimeDomainData(
        dataRef.current as Uint8Array<ArrayBuffer>,
      );

      let sum = 0;
      for (let i = 0; i < dataRef.current.length; i++) {
        const v = (dataRef.current[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataRef.current.length);

      const target = Math.min(1, rms * 3);
      levelRef.current = levelRef.current * 0.7 + target * 0.3;
      setLevel(levelRef.current);

      const now = Date.now();
      const isLoud = levelRef.current > 0.05;
      const newStatus = isLoud
        ? strings.setupMicActive
        : strings.setupMicSilent;
      if (newStatus !== srStatus && now - lastAnnounceRef.current > 2000) {
        lastAnnounceRef.current = now;
        setSrStatus(newStatus);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {
          // ignore
        }
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [stream, active, srStatus]);

  const filledBars = Math.round(level * bars);

  return (
    <div className="iv-mic-meter" aria-hidden="true">
      <div className="iv-mic-meter-header">
        <span className="iv-mic-meter-label">{strings.setupMicLevelLabel}</span>
        <span className="iv-mic-meter-hint">{strings.setupMicTestHint}</span>
      </div>
      <div className="iv-mic-bars">
        {Array.from({ length: bars }, (_, i) => (
          <div
            key={i}
            className={`iv-mic-bar ${i < filledBars ? 'filled' : ''}`}
            style={{
              height: i < filledBars ? `${30 + (i / bars) * 70}%` : '100%',
            }}
          />
        ))}
      </div>
      <span className="iv-mic-note">{strings.setupNotRecorded}</span>
      <span aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'rect(0 0 0 0)' }}>
        {srStatus}
      </span>
    </div>
  );
}
