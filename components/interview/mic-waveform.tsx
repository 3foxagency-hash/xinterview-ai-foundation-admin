'use client';

import * as React from 'react';

interface MicWaveformProps {
  stream: MediaStream | null;
  active: boolean;
  muted: boolean;
}

export function MicWaveform({ stream, active, muted }: MicWaveformProps) {
  const [levels, setLevels] = React.useState<number[]>(() => Array.from({ length: 48 }, () => 0.2));

  React.useEffect(() => {
    if (!stream || !active || muted) {
      setLevels(Array.from({ length: 48 }, (_, index) => 0.13 + (index % 4) * 0.02));
      return;
    }
    const AudioContextClass = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 128;
    const data = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    let frame = 0;
    const measure = () => {
      analyser.getByteFrequencyData(data);
      const next = Array.from({ length: 48 }, (_, index) => {
        const sample = data[index % data.length] / 255;
        return Math.max(0.12, sample * (0.5 + index / 96));
      });
      setLevels(next);
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      analyser.disconnect();
      void context.close();
    };
  }, [active, muted, stream]);

  return (
    <div className={`iv-voice-waveform ${active && !muted ? 'is-active' : ''}`} aria-hidden="true">
      {levels.map((level, index) => (
        <span key={index} style={{ height: `${Math.round(level * 100)}%` }} />
      ))}
    </div>
  );
}
